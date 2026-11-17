import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Home, RefreshCw, Navigation } from 'lucide-react';

function createPinIcon(colorHex, isHighlighted = false) {
  const size = isHighlighted ? 20 : 14;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:9999px;
      background:${colorHex};
      border:2.5px solid #ffffff;
      box-shadow:0 2px 6px rgba(0,0,0,0.55);
    "></div>`
  });
}

export default function MealMap({
  coords,
  placeName,
  meals,
  selectedMeal,
  diningContext,
  distanceFromHome,
  gpsStatus,
  isOnline,
  onSetHome,
  onSyncLocation,
  onClearSelectedMeal
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const activeLat = selectedMeal?.lat ?? coords?.latitude ?? 55.8440;
  const activeLon = selectedMeal?.lon ?? coords?.longitude ?? -4.4300;
  const activeHeadline = selectedMeal ? selectedMeal.title : placeName;

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [activeLat, activeLon],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (coords) {
      L.marker([coords.latitude, coords.longitude], {
        icon: createPinIcon('#0284c7', !selectedMeal)
      })
        .bindPopup(`<b>Current Location</b><br/>${placeName}`)
        .addTo(layer);
    }

    meals.forEach((m) => {
      if (typeof m.lat === 'number' && typeof m.lon === 'number') {
        const isSel = selectedMeal?.id === m.id;
        const pinColor = isSel
          ? '#d97706'
          : m.diningContext === 'Home-Cooked'
          ? '#059669'
          : '#e11d48';

        const marker = L.marker([m.lat, m.lon], {
          icon: createPinIcon(pinColor, isSel)
        })
          .bindPopup(`<b>${m.title}</b><br/>${m.calories} kcal · ${m.placeName || ''}`)
          .addTo(layer);

        if (isSel) {
          marker.openPopup();
        }
      }
    });

    map.flyTo([activeLat, activeLon], selectedMeal ? 16 : 15, { duration: 0.6 });
  }, [coords, placeName, meals, selectedMeal, activeLat, activeLon]);

  return (
    <section className="rounded-2xl bg-slate-900/95 border border-slate-800 overflow-hidden">
      <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4 text-sky-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">{activeHeadline}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                  diningContext === 'Home-Cooked'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-sky-500/15 text-sky-300'
                }`}
              >
                {diningContext}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {selectedMeal?.placeName || `${distanceFromHome}m from Home`} · {gpsStatus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedMeal && (
            <button
              type="button"
              onClick={onClearSelectedMeal}
              className="px-2 py-1 rounded-lg bg-slate-800 text-[11px] text-amber-300 hover:bg-slate-700"
            >
              My GPS
            </button>
          )}
          <button
            type="button"
            onClick={onSetHome}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300"
            title="Set current spot as Home Kitchen"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onSyncLocation}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300"
            title="Refresh GPS Location"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative h-44 w-full bg-slate-200">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {!isOnline && (
          <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded bg-amber-950/90 border border-amber-700 text-[10px] text-amber-300">
            Offline Tile Cache
          </div>
        )}

        <div className="pointer-events-none absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-800 text-[10px] text-slate-200 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>{meals.length} dining pins plotted · Tap any card to focus</span>
        </div>
      </div>
    </section>
  );
}