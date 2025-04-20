'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadGoogleMapsScript } from '../utils/googleMaps';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ initialValue = '', placeholder = 'Enter city name...', className = '' }: SearchBarProps) {
  const router = useRouter();
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        await loadGoogleMapsScript();
        setAutocomplete(new google.maps.places.AutocompleteService());
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    };

    initializeAutocomplete();
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value && autocomplete) {
      autocomplete.getPlacePredictions(
        {
          input: value,
          types: ['(cities)'],
        },
        (predictions, status) => {
          if (status === 'OK' && predictions) {
            setPredictions(predictions);
            setShowPredictions(true);
          } else {
            setPredictions([]);
            setShowPredictions(false);
          }
        }
      );
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handlePredictionClick = (prediction: google.maps.places.AutocompletePrediction) => {
    setSearchQuery(prediction.description);
    setShowPredictions(false);
    router.push(`/${encodeURIComponent(prediction.description)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowPredictions(false), 200);
  };

  const handleFocus = () => {
    if (predictions.length > 0) {
      setShowPredictions(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <input
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 focus:border-gray-500 focus:outline-none text-lg"
      />
      <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-white">
        🔍
      </button>
      {showPredictions && predictions.length > 0 && (
        <div className="absolute w-full mt-1 bg-[#0a0a0a] border border-gray-300 rounded-md shadow-lg">
          {predictions.map((prediction) => (
            <div
              key={prediction.place_id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-1"
              onClick={() => handlePredictionClick(prediction)}
            >
              <div className="text-white">{prediction.description}</div>
            </div>
          ))}
        </div>
      )}
    </form>
  );
} 