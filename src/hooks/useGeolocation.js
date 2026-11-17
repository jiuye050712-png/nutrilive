import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_CAMPUS_COORDS = {
  latitude: 55.8440,
  longitude: -4.4300,
  accuracy: 20
};

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGeolocation() {
  const [coords, setCoords] = useState(DEFAULT_CAMPUS_COORDS);
  const [placeName, setPlaceName] = useState('Paisley Campus Area');
  const [gpsStatus, setGpsStatus] = useState('Ready');
  const lastGeocodedRef = useRef('');

  const [homeAnchor, setHomeAnchor] = useState(() => {
    try {
      const saved = localStorage.getItem('nutrilive_home_anchor');
      return saved ? JSON.parse(saved) : DEFAULT_CAMPUS_COORDS;
    } catch {
      return DEFAULT_CAMPUS_COORDS;
    }
  });

  const resolvePlaceName = useCallback(async (lat, lon) => {
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (lastGeocodedRef.current === key) return;
    lastGeocodedRef.current = key;

    if (!navigator.onLine) {
      setPlaceName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=16`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Geocode failed');
      const data = await res.json();
      const addr = data.address || {};
      const street = addr.road || addr.pedestrian || addr.neighbourhood || addr.suburb;
      const town = addr.town || addr.city || addr.village || 'Paisley';
      const label = street ? `${street}, ${town}` : town;
      setPlaceName(label);
    } catch {
      setPlaceName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
  }, []);

  const handleSuccess = useCallback(
    (position) => {
      const current = {
        latitude: Number(position.coords.latitude.toFixed(5)),
        longitude: Number(position.coords.longitude.toFixed(5)),
        accuracy: Math.round(position.coords.accuracy)
      };
      setCoords(current);
      setGpsStatus(`GPS ±${current.accuracy}m`);
      resolvePlaceName(current.latitude, current.longitude);
    },
    [resolvePlaceName]
  );

  const handleError = useCallback(() => {
    setCoords((prev) => prev || DEFAULT_CAMPUS_COORDS);
    setGpsStatus('Anchor Mode');
    resolvePlaceName(DEFAULT_CAMPUS_COORDS.latitude, DEFAULT_CAMPUS_COORDS.longitude);
  }, [resolvePlaceName]);

  const syncLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      handleError();
      return;
    }
    setGpsStatus('Locating...');
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 6000,
      maximumAge: 0
    });
  }, [handleSuccess, handleError]);

  const setAsHomeKitchen = useCallback(() => {
    if (!coords) return;
    localStorage.setItem('nutrilive_home_anchor', JSON.stringify(coords));
    setHomeAnchor(coords);
    setGpsStatus('Home Anchor Saved');
  }, [coords]);

  useEffect(() => {
    resolvePlaceName(DEFAULT_CAMPUS_COORDS.latitude, DEFAULT_CAMPUS_COORDS.longitude);
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 8000
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [handleSuccess, handleError, resolvePlaceName]);

  const distanceFromHome =
    coords && homeAnchor
      ? Math.round(
          calculateDistanceMeters(
            homeAnchor.latitude,
            homeAnchor.longitude,
            coords.latitude,
            coords.longitude
          )
        )
      : 0;

  const diningContext = distanceFromHome > 60 ? 'Dining Out' : 'Home-Cooked';

  return {
    coords,
    placeName,
    gpsStatus,
    distanceFromHome,
    diningContext,
    syncLocation,
    setAsHomeKitchen
  };
}