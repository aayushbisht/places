'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import SearchBar from '../components/SearchBar';
import { loadGoogleMapsScript, getCityLocation, getNearbyPlaces, getPlaceDetails } from '../utils/googleMaps';
import PlaceCard from '../components/PlaceCard';

interface Place {
  name: string;
  rating: number;
  vicinity: string;
  placeId?: string;
  photoUrl?: string;
  description?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

type PlaceType = 'places' | 'stays' | 'food';




export default function CityPage({ params }: { params: { city: string } }) {
    const { city } = useParams();
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [places, setPlaces] = useState<Place[]>([]);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
    const [infoWindows, setInfoWindows] = useState<google.maps.InfoWindow[]>([]);
    const [activeTab, setActiveTab] = useState<PlaceType>('places');
    const [isLoading, setIsLoading] = useState(false);

  const getPlaceType = (tab: PlaceType): string => {
    switch (tab) {
      case 'places':
        return 'tourist_attraction';
      case 'stays':
        return 'lodging';
      case 'food':
        return 'restaurant';
      default:
        return 'tourist_attraction';
    }
  };

  const getTabTitle = (tab: PlaceType): string => {
    switch (tab) {
      case 'places':
        return 'Top Places';
      case 'stays':
        return 'Hotels & Stays';
      case 'food':
        return 'Restaurants & Food';
      default:
        return 'Top Places';
    }
  };


useEffect(() => {
    if (!city) return;

    const initializeMap = async () => {
      try {
        await loadGoogleMapsScript();
        const cityLocation = await getCityLocation(city as string);
        
        if (mapRef.current) {
          const newMap = new google.maps.Map(mapRef.current, {
            center: cityLocation,
            zoom: 12,
            styles: [
              {
                "featureType": "all",
                "elementType": "labels",
                "stylers": [
                  {
                    "visibility": "on"
                  }
                ]
              },
              {
                "featureType": "administrative",
                "elementType": "all",
                "stylers": [
                  {
                    "visibility": "on"
                  }
                ]
              },
              {
                "featureType": "landscape",
                "elementType": "all",
                "stylers": [
                  {
                    "color": "#f2f2f2"
                  }
                ]
              },
              {
                "featureType": "poi",
                "elementType": "all",
                "stylers": [
                  {
                    "visibility": "off"
                  }
                ]
              },
              {
                "featureType": "road",
                "elementType": "all",
                "stylers": [
                  {
                    "visibility": "on"
                  },
                  {
                    "color": "#ffffff"
                  }
                ]
              },
              {
                "featureType": "road.highway",
                "elementType": "all",
                "stylers": [
                  {
                    "visibility": "on"
                  },
                  {
                    "color": "#ffffff"
                  }
                ]
              },
              {
                "featureType": "road.arterial",
                "elementType": "all",
                "stylers": [
                  {
                    "visibility": "on"
                  },
                  {
                    "color": "#ffffff"
                  }
                ]
              },
              {
                "featureType": "road.local",
                "elementType": "all",
                "stylers": [
                  {
                    "visibility": "on"
                  },
                  {
                    "color": "#ffffff"
                  }
                ]
              },
              {
                "featureType": "transit",
                "elementType": "all",
                "stylers": [
                  {
                    "visibility": "off"
                  }
                ]
              },
              {
                "featureType": "water",
                "elementType": "all",
                "stylers": [
                  {
                    "color": "#e9e9e9"
                  }
                ]
              }
            ],
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          });
          setMap(newMap);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();
  }, [city]);

  useEffect(() => {
    if (!map || !city) return;

    const fetchPlaces = async () => {
      setIsLoading(true);
      try {
        const cityLocation = await getCityLocation(city as string);
        const nearbyPlaces = await getNearbyPlaces(map, cityLocation, getPlaceType(activeTab));
        console.log(nearbyPlaces);
        
        const placesWithPhotos = await Promise.all(
          nearbyPlaces.map(async (place, index) => {
            if (place.placeId) {
              try {
                const details = await getPlaceDetails(place.placeId);
                const photoUrl = details.photos?.[0]?.getUrl({ maxWidth: 400 });
                return { ...place, photoUrl, number: index + 1 };
              } catch (error) {
                console.error('Error fetching place details:', error);
                return { ...place, number: index + 1 };
              }
            }
            return { ...place, number: index + 1 };
          })
        );
        
        setPlaces(placesWithPhotos);

        markers.forEach(marker => marker.setMap(null));
        infoWindows.forEach(window => window.close());
        setMarkers([]);
        setInfoWindows([]);

        const newMarkers: google.maps.Marker[] = [];
        const newInfoWindows: google.maps.InfoWindow[] = [];

        placesWithPhotos.forEach((place: Place, index: number) => {
          const marker = new google.maps.Marker({
            position: new google.maps.LatLng(
              place.geometry.location.lat,
              place.geometry.location.lng
            ),
            map: map,
            title: place.name,
            label: {
              text: (index + 1).toString(),
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold'
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 15,
              fillColor: '#000000',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF'
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2 bg-white rounded shadow">
                <h3 class="text-lg font-semibold mb-2 text-black">${place.name || ''}</h3>
                <div class="flex items-center mb-2">
                  <span class="text-yellow-400">★</span>
                  <span class="ml-1 text-black">${place.rating?.toFixed(1) || 'N/A'}</span>
                </div>
                <p class="text-black">${place.vicinity || ''}</p>
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindows.forEach(window => window.close());
            infoWindow.open(map, marker);
            if (place.placeId) {
              getPlaceDetails(place.placeId).then((details: google.maps.places.PlaceResult) => {
                const photoUrl = details.photos?.[0]?.getUrl({ maxWidth: 400 });
                const content = `
                  <div class="p-2">
                    <img src="${photoUrl}" alt="${details.name}" class="w-full h-32 object-cover mb-2 rounded" onerror="this.style.display='none'">
                    <h3 class="text-lg font-semibold mb-2 text-gray-800">${details.name}</h3>
                    <div class="flex items-center mb-2">
                      <span class="text-yellow-400">★</span>
                      <span class="ml-1 text-gray-800">${details.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <p class="text-gray-600">${place.vicinity || ''}</p>
                    ${details.website ? `<a href="${details.website}" target="_blank" class="text-blue-500 hover:underline">Visit Website</a><br/>` : ''}
                    <a href="https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}&query_place_id=${place.placeId}" target="_blank" class="text-blue-500 hover:underline">Open in Google Maps</a>
                  </div>
                `;
                infoWindow.setContent(content);
              });
            }
          });

          newMarkers.push(marker);
          newInfoWindows.push(infoWindow);
        });

        setMarkers(newMarkers);
        setInfoWindows(newInfoWindows);
      } catch (error) {
        console.error('Error fetching places:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaces();
  }, [map, city, activeTab]);

  const handlePlaceClick = (place: Place) => {
    if (!map) return;
    
    const position = new google.maps.LatLng(
      place.geometry.location.lat,
      place.geometry.location.lng
    );
    
    map.panTo(position);
    map.setZoom(15);
    
    const marker = markers.find(m => m.getTitle() === place.name);
    const infoWindow = infoWindows[markers.indexOf(marker!)];
    
    if (marker && infoWindow) {
      infoWindows.forEach(window => window.close());
      infoWindow.open(map, marker);
    }
  };

  const handlePlaceHover = (place: Place, isHovering: boolean) => {
    const marker = markers.find(m => m.getTitle() === place.name);
    if (marker) {
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: 15,
        fillColor: isHovering ? '#FFD700' : '#000000',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#FFFFFF'
      });
    }
  };

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
          {/* <h2 className="text-2xl font-light mb-4 text-white">Top Places in {decodeURIComponent(params.city)}</h2> */}
          <h1 className="text-2xl font-bold mb-4">{decodeURIComponent(city)}</h1>
        
        <div className="flex space-x-4 mb-6">
          {(['places', 'stays', 'food'] as PlaceType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md border border-gray-300 ${
                activeTab === tab
                  ? 'bg-[#3a3a3a] text-white'
                  : 'bg-[0a0a0a] text-white hover:bg-[#2a2a2a]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

          <h2 className="text-xl font-semibold mb-4">{getTabTitle(activeTab)}</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {places.map((place) => (
              <div
                key={place.name}
                onMouseEnter={() => handlePlaceHover(place, true)}
                onMouseLeave={() => handlePlaceHover(place, false)}
              >
                <PlaceCard
                  place={place}
                  onClick={() => handlePlaceClick(place)}
                />
              </div>
            ))}
          </div>
        )}
        </div>
        <div className="w-1/2" ref={mapRef}></div>
      </div>
    </main>
  );
} 