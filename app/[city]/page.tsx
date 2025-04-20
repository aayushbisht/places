'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Place {
  name: string;
  rating: number;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export default function CityPage({ params }: { params: { city: string } }) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
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
              radius: 5000,
              type: 'tourist_attraction',
            }, (results, status) => {
              if (status === 'OK' && results) {
                markers.forEach(marker => marker.setMap(null));
                const newMarkers: google.maps.Marker[] = [];

                const formattedPlaces = results.slice(0, 20).map(place => {
                  const marker = new google.maps.Marker({
                    position: place.geometry?.location,
                    map: newMap,
                    title: place.name,
                  });
                  newMarkers.push(marker);

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
                setMap(newMap);
              }
            });
          }
        });
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [params.city]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="fixed top-0 left-0 right-0 bg-[#0a0a0a] p-4 z-10">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSearch} className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search another city..."
              className="w-full px-4 py-3 border border-gray-300 focus:border-gray-500 focus:outline-none text-lg"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-white">
              🔍
            </button>
          </form>
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