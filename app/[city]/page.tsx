'use client';

import { useEffect, useRef, useState } from 'react';
import SearchBar from '../components/SearchBar';
import { loadGoogleMapsScript } from '../utils/googleMaps';

interface Place {
  name: string;
  rating: number;
  vicinity: string;
  photoUrl?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export default function CityPage({ params }: { params: { city: string } }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindows, setInfoWindows] = useState<google.maps.InfoWindow[]>([]);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        await loadGoogleMapsScript();
        
        if (mapRef.current) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: decodeURIComponent(params.city) }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              const location = results[0].geometry.location;
              
              const newMap = new google.maps.Map(mapRef.current!, {
                center: location,
                zoom: 12,
              });

              const service = new google.maps.places.PlacesService(newMap);
              
              service.nearbySearch({
                location: location,
                radius: 30000,
                type: 'tourist_attraction',
                rankBy: google.maps.places.RankBy.PROMINENCE,

              }, (results, status) => {
                if (status === 'OK' && results) {
                  markers.forEach(marker => marker.setMap(null));
                  infoWindows.forEach(window => window.close());
                  
                  const newMarkers: google.maps.Marker[] = [];
                  const newInfoWindows: google.maps.InfoWindow[] = [];

                  const formattedPlaces = results.slice(0, 20).map(place => {
                    const marker = new google.maps.Marker({
                      position: place.geometry?.location,
                      map: newMap,
                      title: place.name,
                    });

                    const infoWindow = new google.maps.InfoWindow({
                      content: `
                        <div class="p-2">
                          <h3 class="text-lg font-semibold mb-2">${place.name}</h3>
                          <div class="flex items-center mb-2">
                            <span class="text-yellow-400">★</span>
                            <span class="ml-1">${place.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <p class="text-gray-600">${place.vicinity || ''}</p>
                        </div>
                      `,
                    });

                    marker.addListener('click', () => {
                      newInfoWindows.forEach(window => window.close());
                      infoWindow.open(newMap, marker);
                    });

                    newMarkers.push(marker);
                    newInfoWindows.push(infoWindow);

                    service.getDetails(
                      { 
                        placeId: place.place_id!, 
                        fields: ['photos', 'name', 'rating', 'vicinity', 'types', 'website', 'formatted_address']
                      },
                      (placeDetails, status) => {
                        console.log('Place Details:', {
                          name: placeDetails?.name,
                          status,
                          photos: placeDetails?.photos,
                          photoCount: placeDetails?.photos?.length || 0,
                          types: placeDetails?.types
                        });

                        if (status === 'OK' && placeDetails) {
                          const photos = placeDetails.photos || [];
                          if (photos.length > 0) {
                            try {
                              const photoUrl = photos[0].getUrl({
                                maxWidth: 400,
                                maxHeight: 300
                              });
                              
                              console.log('Generated photo URL:', photoUrl);
                              
                              const updatedContent = `
                                <div class="p-2">
                                  <img src="${photoUrl}" alt="${place.name}" class="w-full h-32 object-cover mb-2 rounded" onerror="this.style.display='none'">
                                  <h3 class="text-lg font-semibold mb-2 text-gray-800">${place.name}</h3>
                                  <div class="flex items-center mb-2">
                                    <span class="text-yellow-400">★</span>
                                    <span class="ml-1 text-gray-800">${place.rating?.toFixed(1) || 'N/A'}</span>
                                  </div>
                                  <p class="text-gray-600">${place.vicinity || ''}</p>
                                  ${placeDetails.website ? `<a href="${placeDetails.website}" target="_blank" class="text-blue-500 hover:underline">Visit Website</a>` : ''}
                                </div>
                              `;
                              infoWindow.setContent(updatedContent);
                            } catch (error) {
                              console.error('Error getting photo URL:', error);
                              const fallbackContent = `
                                <div class="p-2">
                                  <h3 class="text-lg font-semibold mb-2">${place.name}</h3>
                                  <div class="flex items-center mb-2">
                                    <span class="text-yellow-400">★</span>
                                    <span class="ml-1">${place.rating?.toFixed(1) || 'N/A'}</span>
                                  </div>
                                  <p class="text-gray-600">${place.vicinity || ''}</p>
                                  ${placeDetails.website ? `<a href="${placeDetails.website}" target="_blank" class="text-blue-500 hover:underline">Visit Website</a>` : ''}
                                </div>
                              `;
                              infoWindow.setContent(fallbackContent);
                            }
                          } else {
                            console.log('No photos available for:', place.name);
                          }
                        } else {
                          console.error('Failed to get place details:', status);
                        }
                      }
                    );

                    return {
                      name: place.name!,
                      rating: place.rating || 0,
                      vicinity: place.vicinity || '',
                      geometry: {
                        location: {
                          lat: place.geometry?.location?.lat() || 0,
                          lng: place.geometry?.location?.lng() || 0,
                        },
                      },
                    };
                  });

                  setPlaces(formattedPlaces);
                  setMarkers(newMarkers);
                  setInfoWindows(newInfoWindows);
                  setMap(newMap);
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    };

    initializeMap();
  }, [params.city]);

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="fixed top-0 left-0 right-0 bg-[#0a0a0a] p-4 z-10">
        <div className="max-w-7xl mx-auto">
          <SearchBar 
            placeholder="Search another city..."
            className="max-w-md"
          />
        </div>
      </div>

      <div className="flex h-screen pt-20">
        <div className="w-1/2 overflow-y-auto p-4">
          <h2 className="text-2xl font-light mb-4 text-white">Top Places in {decodeURIComponent(params.city)}</h2>
          <div className="space-y-4">
            {places.map((place, index) => (
              <div
                key={index}
                className="p-4 border border-gray-300 rounded-md hover:bg-gray-800 cursor-pointer"
                onClick={() => {
                  if (map) {
                    map.setCenter(place.geometry.location);
                    map.setZoom(15);
                    infoWindows[index]?.open(map, markers[index]);
                  }
                }}
              >
                <h3 className="text-xl font-medium text-white">{place.name}</h3>
                <p className="text-gray-400">{place.vicinity}</p>
                <div className="flex items-center mt-2">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white ml-1">{place.rating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-1/2" ref={mapRef}></div>
      </div>
    </main>
  );
} 