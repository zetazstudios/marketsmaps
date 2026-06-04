import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { coords, error };
}
