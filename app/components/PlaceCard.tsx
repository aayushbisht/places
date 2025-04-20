import React from 'react'

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
  
interface PlaceCardProps {
    place: Place;
    index: number;
    map: google.maps.Map | null;
    infoWindows: google.maps.InfoWindow[] | null;
    markers: google.maps.Marker[] | null;
}

const PlaceCard = ({ place, index, map, infoWindows, markers }: PlaceCardProps) => {
  return (
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
  )
}

export default PlaceCard
