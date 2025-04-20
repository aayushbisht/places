import React from 'react'
import Image from 'next/image';
import Link from 'next/link';

interface Place {
    name: string;
    rating: number;
    vicinity: string;
    photoUrl?: string;
    placeId?: string;
    number?: number;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }
  
interface PlaceCardProps {
    place: Place;
    onClick: () => void;
}

const PlaceCard = ({ place, onClick }: PlaceCardProps) => {
  const mapsUrl = place.placeId 
    ? `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}&query_place_id=${place.placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}`;

  return (
    <div
      className="p-4 border flex justify-between border-gray-300 rounded-md hover:bg-gray-800 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2">
          {place.number && (
            <div className="w-6 h-6 rounded-sm border-1 bg-[#0a0a0a] flex items-center justify-center text-white font-bold">
              {place.number}
            </div>
          )}
          <h3 className="text-xl font-medium text-white">{place.name}</h3>
        </div>
        <p className="text-gray-400">{place.vicinity}</p>
        <div className="flex items-center mt-2">
          <span className="text-yellow-400">★</span>
          <span className="text-white ml-1">{place.rating.toFixed(1)}</span>
        </div>
        <Link 
          href={mapsUrl}
          target="_blank"
          onClick={(e) => e.stopPropagation()}
          className="text-[#bababa] hover:text-blue-300 text-sm mt-2 inline-block"
        >
          View on Google Maps →
        </Link>
      </div>
      {place.photoUrl && (
        <div className="relative w-32 h-32">
          <Image
            src={place.photoUrl}
            alt={place.name}
            fill
            className="object-cover rounded-md"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}

export default PlaceCard;
