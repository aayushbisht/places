'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadGoogleMapsScript, getCityLocation, getNearbyPlaces, getPlaceDetails } from '../utils/googleMaps';
import PlaceCard from '../components/PlaceCard';

interface Place {
  name: string;
  rating: number;
  vicinity: string;
  placeId?: string;
  photoUrl?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

type PlaceType = 'places' | 'stays' | 'food';

export default function CityPage() {
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
        setPlaces(nearbyPlaces);

        markers.forEach(marker => marker.setMap(null));
        infoWindows.forEach(window => window.close());
        setMarkers([]);
        setInfoWindows([]);

        const newMarkers: google.maps.Marker[] = [];
        const newInfoWindows: google.maps.InfoWindow[] = [];

        nearbyPlaces.forEach((place: Place) => {
          const marker = new google.maps.Marker({
            position: new google.maps.LatLng(
              place.geometry.location.lat,
              place.geometry.location.lng
            ),
            map: map,
            title: place.name,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0;">${place.name}</h3>
                <p style="margin: 0 0 4px 0;">Rating: ${place.rating}</p>
                <p style="margin: 0;">${place.vicinity}</p>
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
                  <div style="padding: 8px;">
                    <h3 style="margin: 0 0 8px 0;">${details.name}</h3>
                    ${photoUrl ? `<img src="${photoUrl}" style="max-width: 100%; margin-bottom: 8px;" />` : ''}
                    <p style="margin: 0 0 4px 0;">Rating: ${details.rating}</p>
                    <p style="margin: 0;">${details.vicinity}</p>
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

  return (
    <div className="flex h-screen">
      <div className="w-1/3 overflow-y-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{city}</h1>
        
        <div className="flex space-x-4 mb-6">
          {(['places', 'stays', 'food'] as PlaceType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
              <PlaceCard
                key={place.name}
                place={place}
                onClick={() => handlePlaceClick(place)}
              />
            ))}
          </div>
        )}
      </div>
      <div ref={mapRef} className="w-2/3 h-full" />
    </div>
  );
} 