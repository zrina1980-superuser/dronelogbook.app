import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Map as MapIcon,
  CheckSquare,
  Clock,
  Send,
  AlertCircle,
  Sparkles,
  Wind,
  Thermometer,
  Gauge,
  CheckCircle2,
} from 'lucide-react';
import {
  calculateDurationMin,
  validateFlightInput,
  parseCoordinatesFromLocation,
  formatLocationWithCoords,
  type PilotProfileData,
  type FlightEntry,
} from '../utils/logbookLogic';
import { InteractiveDroneMap } from './MapPickerModal';

interface NewFlightModuleProps {
  profile: PilotProfileData;
  onSaveFlight: (
    flight: Omit<FlightEntry, 'id' | 'ownerId' | 'createdAtMs'>
  ) => Promise<void>;
  onNavigateToLog: () => void;
}

interface MeteoSnapshot {
  temperatureC: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  status: 'OPTIMALNO' | 'OPREZ (VJETAR)' | 'NEPOVOLJNO';
}

const PREFLIGHT_ITEMS = [
  { id: 'props', label: 'Vizualna provjera propelera, motora i okvira' },
  { id: 'battery', label: 'Napon i temperatura baterije (100% napunjena)' },
  { id: 'sdcard', label: 'SD kartica umetnuta i slobodna memorija provjerena' },
  { id: 'imu', label: 'Kalibracija kompasa i IMU senzora uredna' },
  { id: 'gps', label: 'Dovoljan broj GPS satelita (Home Point zabilježen)' },
  { id: 'weather', label: 'Vremenski uvjeti, vjetar i AMC zona provjereni' },
];

function getInitialTakeoffIso(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function getOffsetIso(baseIso: string, addMinutes: number): string {
  const d = new Date(baseIso);
  if (Number.isNaN(d.getTime())) return getInitialTakeoffIso();
  const next = new Date(d.getTime() + addMinutes * 60000);
  next.setMinutes(next.getMinutes() - next.getTimezoneOffset());
  return next.toISOString().slice(0, 16);
}

export const NewFlightModule: React.FC<NewFlightModuleProps> = ({
  profile,
  onSaveFlight,
  onNavigateToLog,
}) => {
  const [location, setLocation] = useState<string>('');
  const [latitude, setLatitude] = useState<number | undefined>(45.81501);
  const [longitude, setLongitude] = useState<number | undefined>(15.98192);
  const [radiusM, setRadiusM] = useState<number>(500);
  const [takeoffTime, setTakeoffTime] = useState<string>(() => getInitialTakeoffIso());
  const [landingTime, setLandingTime] = useState<string>(() =>
    getOffsetIso(getInitialTakeoffIso(), 20)
  );
  const [notes, setNotes] = useState<string>('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    props: true,
    battery: true,
    sdcard: true,
    imu: true,
    gps: true,
    weather: true,
  });
  const [checklistCompleted, setChecklistCompleted] = useState<boolean>(true);
  const [showChecklistDetails, setShowChecklistDetails] = useState<boolean>(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [meteo, setMeteo] = useState<MeteoSnapshot | null>(null);

  const durationMin = useMemo(
    () => calculateDurationMin(takeoffTime, landingTime),
    [takeoffTime, landingTime]
  );

  // Live Open-Meteo Aviation Weather Telemetry for selected coordinates
  useEffect(() => {
    const lat = latitude ?? 45.81501;
    const lng = longitude ?? 15.98192;
    let cancelled = false;

    const fetchMeteo = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_gusts_10m`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.current) return;
        const temp = Math.round(Number(data.current.temperature_2m ?? 18));
        const wind = Math.round(Number(data.current.wind_speed_10m ?? 9));
        const gusts = Math.round(Number(data.current.wind_gusts_10m ?? 16));
        const status: MeteoSnapshot['status'] =
          wind > 32 || gusts > 45
            ? 'NEPOVOLJNO'
            : wind > 20 || gusts > 32
            ? 'OPREZ (VJETAR)'
            : 'OPTIMALNO';
        setMeteo({
          temperatureC: temp,
          windSpeedKmh: wind,
          windGustsKmh: gusts,
          status,
        });
      } catch {
        // Ignore offline weather errors
      }
    };

    fetchMeteo();
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  const handleGetGpsLocation = () => {
    setIsLocatingGps(true);
    setValidationError(null);
    if (!navigator.geolocation) {
      const fallback = formatLocationWithCoords(
        45.81501,
        15.98192,
        'Grad Zagreb'
      );
      setLocation(fallback);
      setLatitude(45.81501);
      setLongitude(15.98192);
      setIsLocatingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=hr`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const suburb =
              addr.suburb ||
              addr.neighbourhood ||
              addr.quarter ||
              addr.village ||
              '';
            const city = addr.city || addr.town || addr.municipality || '';
            const place =
              [suburb, city].filter(Boolean).join(', ') ||
              'Trenutna GPS lokacija';
            setLocation(formatLocationWithCoords(lat, lng, place));
          } else {
            setLocation(formatLocationWithCoords(lat, lng, 'Trenutna GPS lokacija'));
          }
        } catch {
          setLocation(formatLocationWithCoords(lat, lng, 'Trenutna GPS lokacija'));
        } finally {
          setIsLocatingGps(false);
        }
      },
      () => {
        const fallback = formatLocationWithCoords(
          45.81501,
          15.98192,
          'Grad Zagreb'
        );
        setLocation(fallback);
        setLatitude(45.81501);
        setLongitude(15.98192);
        setIsLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 4000 }
    );
  };

  const applyQuickDuration = (mins: number) => {
    setLandingTime(getOffsetIso(takeoffTime, mins));
    setValidationError(null);
  };

  const handleToggleChecklistItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const allDone = PREFLIGHT_ITEMS.every((item) => next[item.id]);
      setChecklistCompleted(allDone);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const check = validateFlightInput({
      location,
      takeoffTime,
      landingTime,
      radiusM,
      checklistCompleted,
    });

    if (!check.valid || check.durationMin === undefined) {
      setValidationError(check.error || 'Provjerite unesene podatke.');
      return;
    }

    const parsedCoords = parseCoordinatesFromLocation(location);
    await onSaveFlight({
      location: location.trim(),
      latitude: parsedCoords ? parsedCoords.lat : latitude,
      longitude: parsedCoords ? parsedCoords.lng : longitude,
      takeoffTime,
      landingTime,
      durationMin: check.durationMin,
      radiusM,
      droneSn: profile.droneSn || '',
      droneMake: profile.droneMake || '',
      droneModel: profile.droneModel || '',
      checklistCompleted,
      notes: notes.trim() || 'Redovni let — sve uredno',
    });

    // Reset form for next flight
    setLocation('');
    setRadiusM(500);
    const nextStart = getInitialTakeoffIso();
    setTakeoffTime(nextStart);
    setLandingTime(getOffsetIso(nextStart, 20));
    setNotes('');
    onNavigateToLog();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: New Flight Entry Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-6 bg-[#0b1324]/95 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-[0_14px_40px_rgba(0,0,0,0.45)] space-y-4"
      >
        <div>
          <label
            htmlFor="flight-location-input"
            className="block text-xs font-semibold text-slate-300 mb-1.5"
          >
            Lokacija polijetanja
          </label>
          <input
            id="flight-location-input"
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setValidationError(null);
            }}
            placeholder="Npr. Jarun, Zagreb ili GPS koordinate"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
            <button
              type="button"
              onClick={handleGetGpsLocation}
              disabled={isLocatingGps}
              className="w-full py-2.5 px-3 rounded-xl bg-[#101c34] hover:bg-[#162647] border border-cyan-500/35 text-xs font-semibold text-slate-100 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-fuchsia-400 shrink-0" />
              <span>
                {isLocatingGps ? 'TRAŽIM GPS...' : 'KLIKNI ZA GPS LOKACIJU'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#101c34] hover:bg-[#162647] border border-sky-500/35 text-xs font-semibold text-slate-100 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MapIcon className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>ODABERI NA KARTI</span>
            </button>
          </div>
        </div>

        {/* Live Aviation Meteo Widget for Selected Coordinates */}
        {meteo && (
          <div className="bg-[#060a14] border border-slate-800/90 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Temp (2m)</div>
                <div className="font-mono font-bold text-white">
                  {meteo.temperatureC}°C
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Vjetar / Udari</div>
                <div className="font-mono font-bold text-white">
                  {meteo.windSpeedKmh} / {meteo.windGustsKmh} km/h
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Uvjeti leta</div>
                <div
                  className={`font-mono font-bold text-[11px] ${
                    meteo.status === 'OPTIMALNO'
                      ? 'text-cyan-300'
                      : meteo.status === 'OPREZ (VJETAR)'
                      ? 'text-amber-300'
                      : 'text-rose-400'
                  }`}
                >
                  {meteo.status}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flight Radius Slider */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
            <label htmlFor="flight-radius-slider" className="font-medium">
              Radius leta:{' '}
              <span className="text-cyan-300 font-mono font-bold tabular-nums">
                {radiusM}m
              </span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              100m – 2000m
            </span>
          </div>
          <input
            id="flight-radius-slider"
            type="range"
            min={100}
            max={2000}
            step={50}
            value={radiusM}
            onChange={(e) => setRadiusM(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Takeoff & Landing Datetime Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label
              htmlFor="takeoff-time-input"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Polijetanje
            </label>
            <input
              id="takeoff-time-input"
              type="datetime-local"
              value={takeoffTime}
              onChange={(e) => {
                setTakeoffTime(e.target.value);
                setValidationError(null);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-xs font-mono text-white focus:outline-none tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="landing-time-input"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Slijetanje
            </label>
            <input
              id="landing-time-input"
              type="datetime-local"
              value={landingTime}
              onChange={(e) => {
                setLandingTime(e.target.value);
                setValidationError(null);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-xs font-mono text-white focus:outline-none tabular-nums"
            />
          </div>
        </div>

        {/* Auto-calculated Duration + Quick Duration Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="duration-readout"
              className="text-xs font-medium text-slate-300"
            >
              Trajanje (min)
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Brzi odabir:</span>
              {[15, 25, 40].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => applyQuickDuration(m)}
                  className="px-2 py-0.5 rounded-md bg-[#111c33] hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400/50 text-[11px] font-mono text-cyan-300 cursor-pointer transition-colors"
                >
                  +{m}m
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              id="duration-readout"
              type="text"
              readOnly
              value={
                durationMin !== null
                  ? `${durationMin} min`
                  : 'Računa se automatski...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 text-sm font-mono text-cyan-300 focus:outline-none tabular-nums"
            />
            <Clock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
          </div>
        </div>

        {/* Flight Notes */}
        <div>
          <label
            htmlFor="flight-notes-input"
            className="block text-xs font-medium text-slate-300 mb-1.5"
          >
            Napomene / Događaji
          </label>
          <textarea
            id="flight-notes-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Npr. miran let, snimanje terena, provjera baterije..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-sm text-white placeholder-slate-500 focus:outline-none resize-none"
          />
        </div>

        {/* Pre-flight Safety Checklist */}
        <div className="bg-[#060a14] border border-slate-800/90 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checklistCompleted}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setChecklistCompleted(checked);
                  if (checked) {
                    setCheckedItems({
                      props: true,
                      battery: true,
                      sdcard: true,
                      imu: true,
                      gps: true,
                      weather: true,
                    });
                  }
                }}
                className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
              />
              <span className="text-xs font-bold text-cyan-300 tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                CHECKLISTA OBAVLJENA
              </span>
            </label>

            <button
              type="button"
              onClick={() => setShowChecklistDetails((prev) => !prev)}
              className="text-[11px] text-slate-400 hover:text-cyan-300 underline cursor-pointer"
            >
              {showChecklistDetails ? 'Sakrij stavke' : 'Prikaži 6 stavki'}
            </button>
          </div>

          {showChecklistDetails && (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
              {PREFLIGHT_ITEMS.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checkedItems[item.id])}
                    onChange={() => handleToggleChecklistItem(item.id)}
                    className="w-3.5 h-3.5 rounded accent-cyan-400"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {validationError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-300 hover:from-cyan-300 hover:to-sky-300 text-sm font-bold text-[#050811] tracking-wide flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,240,255,0.28)] transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>SPREMI U DNEVNIK</span>
        </button>
      </form>

      {/* Right Column: Live Interactive Map & Zone Preview */}
      <div className="lg:col-span-6 bg-[#0b1324]/95 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-[0_14px_40px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Interaktivna Satelitska GPS Karta i Radijus Leta
            </h2>
            <p className="text-xs text-slate-400">
              Klikni na kartu ili povuci marker — mjesto, koordinate i meteo podaci ažuriraju se automatski
            </p>
          </div>
        </div>

        <InteractiveDroneMap
          initialLat={latitude || 45.81501}
          initialLng={longitude || 15.98192}
          radiusM={radiusM}
          onRadiusChange={(newR) => setRadiusM(newR)}
          onConfirmLocation={(locStr, lat, lng, newR) => {
            setLocation(locStr);
            setLatitude(lat);
            setLongitude(lng);
            setRadiusM(newR);
            setValidationError(null);
          }}
          embedded={true}
        />
      </div>

      {/* Modal Map Picker */}
      {isMapModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Odabir lokacije na karti"
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-[#0b1324] border border-cyan-500/40 rounded-2xl w-full max-w-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Odaberi lokaciju polijetanja na karti
              </h3>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="text-xs text-slate-300 hover:text-white px-3 py-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                Zatvori
              </button>
            </div>
            <InteractiveDroneMap
              initialLat={latitude || 45.81501}
              initialLng={longitude || 15.98192}
              radiusM={radiusM}
              onRadiusChange={(newR) => setRadiusM(newR)}
              onConfirmLocation={(locStr, lat, lng, newR) => {
                setLocation(locStr);
                setLatitude(lat);
                setLongitude(lng);
                setRadiusM(newR);
                setValidationError(null);
              }}
              onClose={() => setIsMapModalOpen(false)}
              embedded={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
