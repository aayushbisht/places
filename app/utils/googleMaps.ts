let scriptLoaded = false;
let loadingPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (): Promise<void> => {
  if (scriptLoaded) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    if (window.google) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return loadingPromise;
};

export const getCityLocation = async (cityName: string): Promise<google.maps.LatLng> => {
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: cityName }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        resolve(results[0].geometry.location);
      } else {
        reject(new Error(`Failed to geocode city: ${cityName}`));
      }
    });
  });
};

export const getNearbyPlaces = async (
  map: google.maps.Map,
  location: google.maps.LatLng
): Promise<Array<{
  name: string;
  rating: number;
  vicinity: string;
  placeId?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}>> => {
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(
      {
        location,
        radius: 30000,
        type: 'tourist_attraction',
        rankBy: google.maps.places.RankBy.PROMINENCE,
      },
      (results, status) => {
        if (status === 'OK' && results) {
          const formattedPlaces = results.slice(0, 20).map(place => ({
            name: place.name!,
            rating: place.rating || 0,
            vicinity: place.vicinity || '',
            placeId: place.place_id,
            geometry: {
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
            },
          }));
          resolve(formattedPlaces);
        } else {
          reject(new Error('Failed to get nearby places'));
        }
      }
    );
  });
};

export const getPlaceDetails = async (
  placeId: string
): Promise<google.maps.places.PlaceResult> => {
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(
      document.createElement('div')
    );
    service.getDetails(
      {
        placeId,
        fields: ['photos', 'name', 'rating', 'vicinity', 'types', 'website', 'formatted_address'],
      },
      (result, status) => {
        if (status === 'OK' && result) {
          resolve(result);
        } else {
          reject(new Error('Failed to get place details'));
        }
      }
    );
  });
}; 