'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (inputRef.current) {
        const autocomplete = new google.maps.places.AutocompleteService();
        
        const handleInput = () => {
          if (inputRef.current?.value) {
            autocomplete.getPlacePredictions(
              {
                input: inputRef.current.value,
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

        inputRef.current.addEventListener('input', handleInput);
        inputRef.current.addEventListener('blur', () => {
          setTimeout(() => setShowPredictions(false), 200);
        });
        inputRef.current.addEventListener('focus', () => {
          if (predictions.length > 0) {
            setShowPredictions(true);
          }
        });

        return () => {
          inputRef.current?.removeEventListener('input', handleInput);
        };
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handlePredictionClick = (prediction: google.maps.places.AutocompletePrediction) => {
    if (inputRef.current) {
      inputRef.current.value = prediction.description;
      setShowPredictions(false);
      router.push(`/${encodeURIComponent(prediction.description)}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
      <div className="text-center p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-light mb-12 text-white">Where do you want to go?</h1>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter city name..."
            className="w-full px-4 py-3 border border-gray-300 focus:border-gray-500 focus:outline-none text-lg"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white">
            🔍
          </div>
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
        </div>
      </div>
    </main>
  );
}
