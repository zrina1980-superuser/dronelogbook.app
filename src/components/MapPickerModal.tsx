import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Layers, Check, X, Compass } from 'lucide-react';
import { formatLocationWithCoords } from '../utils/logbookLogic';

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  radiusM: number;
  onRadiusChange?: (newRadius: number) => void;
  onConfirmLocation: (
    locationString: string,
    lat: number,
    lng: number,
    radiusM: number
  ) => void;
  onClose?: () => void;
  embedded?: boolean;
}

const CROATIA_PRESETS = [
  { name: 'Jarun, Grad Zagreb', lat: 45.78042, lng: 15.92185 },
  { name: 'Maksimir, Grad Zagreb', lat: 45.82075, lng: 16.01811 },
  { name: 'Park-šuma Marjan, Split', lat: 43.50891, lng: 16.41052 },
  { name: 'Trsat, Rijeka', lat: 45.33185, lng: 14.45721 },
  { name: 'Tvrđa, Osijek', lat: 45.56082, lng: 18.69601 },
  { name: 'Srđ, Dubrovnik', lat: 42.64985, lng: 18.11042 },
];

export const InteractiveDroneMap: React.FC<MapPickerProps> = ({
  initialLat = 45.81501,
  initialLng = 15.98192,
  radiusM,
  onRadiusChange,
  onConfirmLocation,
  onClose,
  embedded = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);

  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [localRadius, setLocalRadius] = useState<number>(radiusM);
  const [placeName, setPlaceName] = useState<string>('Grad Zagreb');
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('satellite');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  useEffect(() => {
    setLocalRadius(radiusM);
  }, [radiusM]);

  const reverseGeocode = useCallback(
    async (targetLat: number, targetLng: number) => {
      setIsGeocoding(true);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${targetLat}&lon=${targetLng}&accept-language=hr`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const suburb =
            addr.suburb ||
            addr.neighbourhood ||
            addr.quarter ||
            addr.village ||
            addr.town ||
            addr.municipality ||
            '';
          const city = addr.city || addr.county || addr.state || '';
          const parts = [suburb, city].filter(Boolean);
          const resolved =
            parts.length > 0
              ? parts.join(', ')
              : data.name || 'Odabrana točka';
          setPlaceName(resolved);
          return resolved;
        }
      } catch {
        // Fallback when offline or rate-limited
      } finally {
        setIsGeocoding(false);
      }
      return '';
    },
    []
  );

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
    });

    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }
    );

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: '© Esri Satellite',
      }
    );

    satelliteLayer.addTo(map);
    streetLayerRef.current = streetLayer;
    satelliteLayerRef.current = satelliteLayer;

    // Custom drone takeoff pin icon (Cyan HUD style)
    const droneIcon = L.divIcon({
      className: 'custom-drone-pin',
      html: `<div style="width:32px;height:32px;border-radius:9999px;background:linear-gradient(135deg,#00f0ff,#38bdf8);border:3px solid #060a14;box-shadow:0 0 18px rgba(0,240,255,0.9);display:flex;align-items:center;justify-content:center;color:#060a14;font-weight:bold;font-size:14px;">🚁</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: droneIcon,
    }).addTo(map);

    const circle = L.circle([initialLat, initialLng], {
      radius: radiusM,
      color: '#00f0ff',
      weight: 2,
      fillColor: '#00f0ff',
      fillOpacity: 0.16,
    }).addTo(map);

    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      setLat(pos.lat);
      setLng(pos.lng);
      circle.setLatLng(pos);
      const name = await reverseGeocode(pos.lat, pos.lng);
      if (embedded) {
        onConfirmLocation(
          formatLocationWithCoords(
            pos.lat,
            pos.lng,
            name || 'Odabrana lokacija'
          ),
          pos.lat,
          pos.lng,
          radiusM
        );
      }
    });

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat: clickedLat, lng: clickedLng } = e.latlng;
      marker.setLatLng([clickedLat, clickedLng]);
      circle.setLatLng([clickedLat, clickedLng]);
      setLat(clickedLat);
      setLng(clickedLng);
      const name = await reverseGeocode(clickedLat, clickedLng);
      if (embedded) {
        onConfirmLocation(
          formatLocationWithCoords(
            clickedLat,
            clickedLng,
            name || 'Odabrana lokacija'
          ),
          clickedLat,
          clickedLng,
          radiusM
        );
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(localRadius);
    }
  }, [localRadius]);

  const toggleMapLayer = (mode: 'street' | 'satellite') => {
    setMapMode(mode);
    const map = mapInstanceRef.current;
    if (!map || !streetLayerRef.current || !satelliteLayerRef.current) return;
    if (mode === 'satellite') {
      map.removeLayer(streetLayerRef.current);
      satelliteLayerRef.current.addTo(map);
    } else {
      map.removeLayer(satelliteLayerRef.current);
      streetLayerRef.current.addTo(map);
    }
  };

  const selectCoordinates = async (
    targetLat: number,
    targetLng: number,
    presetLabel?: string
  ) => {
    setLat(targetLat);
    setLng(targetLng);
    if (markerRef.current && circleRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([targetLat, targetLng]);
      circleRef.current.setLatLng([targetLat, targetLng]);
      mapInstanceRef.current.setView([targetLat, targetLng], 15);
    }
    if (presetLabel) {
      setPlaceName(presetLabel);
      onConfirmLocation(
        formatLocationWithCoords(targetLat, targetLng, presetLabel),
        targetLat,
        targetLng,
        localRadius
      );
    } else {
      const resolved = await reverseGeocode(targetLat, targetLng);
      onConfirmLocation(
        formatLocationWithCoords(
          targetLat,
          targetLng,
          resolved || placeName
        ),
        targetLat,
        targetLng,
        localRadius
      );
    }
  };

  const handleUseDeviceGps = () => {
    if (!navigator.geolocation) {
      selectCoordinates(45.81501, 15.98192, 'Grad Zagreb');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        selectCoordinates(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        selectCoordinates(45.81501, 15.98192, 'Grad Zagreb');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const formattedPreview = formatLocationWithCoords(lat, lng, placeName);

  return (
    <div className="flex flex-col h-full">
      {/* Map Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleMapLayer('satellite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              mapMode === 'satellite'
                ? 'bg-cyan-400 text-[#050811] font-bold'
                : 'bg-[#101c34] text-slate-300 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Satelit</span>
          </button>
          <button
            type="button"
            onClick={() => toggleMapLayer('street')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              mapMode === 'street'
                ? 'bg-cyan-400 text-[#050811] font-bold'
                : 'bg-[#101c34] text-slate-300 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Karta</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleUseDeviceGps}
          className="px-3 py-1.5 rounded-lg bg-[#101c34] hover:bg-cyan-500/20 border border-cyan-500/40 text-xs font-medium text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Moja GPS lokacija</span>
        </button>
      </div>

      {/* Quick Location Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
        <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
          <Compass className="w-3 h-3 text-cyan-400" /> Brze točke:
        </span>
        {CROATIA_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => selectCoordinates(preset.lat, preset.lng, preset.name)}
            className="px-2.5 py-1 rounded-md bg-[#060a14] hover:bg-cyan-500/15 border border-slate-800 hover:border-cyan-400/40 text-[11px] text-slate-300 hover:text-cyan-200 whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            {preset.name.split(',')[0]}
          </button>
        ))}
      </div>

      {/* Leaflet Map Viewport */}
      <div className="relative w-full h-[280px] sm:h-[340px] rounded-xl overflow-hidden border border-slate-800 bg-[#060a14]">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      </div>

      {/* Radius & Coordinates Readout Footer */}
      <div className="mt-3 bg-[#060a14] border border-slate-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Odabrana lokacija:</span>
          <span className="text-cyan-300 font-mono text-[11px]">
            {isGeocoding ? 'Dohvaćam naziv mjesta...' : 'GPS spreman'}
          </span>
        </div>
        <div className="text-xs font-mono text-slate-100 bg-[#0b1324] px-3 py-2 rounded-lg border border-slate-800/80 break-words">
          {formattedPreview}
        </div>

        <div className="pt-1">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span>Vizualni radijus leta na karti:</span>
            <span className="font-mono font-semibold text-cyan-300 tabular-nums">
              {localRadius}m
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={localRadius}
            aria-label="Vizualni radijus leta na karti"
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalRadius(val);
              onRadiusChange?.(val);
            }}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {!embedded && (
          <div className="flex items-center justify-end gap-2 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Odustani</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onConfirmLocation(formattedPreview, lat, lng, localRadius);
                onClose?.();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-xs font-bold text-[#050811] flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Potvrdi lokaciju</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
