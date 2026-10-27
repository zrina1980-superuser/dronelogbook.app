import React, { useState } from 'react';
import {
  Search,
  Download,
  Edit3,
  Trash2,
  Check,
  X,
  CheckSquare,
  Map as MapIcon,
  Plane,
} from 'lucide-react';
import {
  formatCroatianDateTime,
  calculateDurationMin,
  generateFlightsCsv,
  type FlightEntry,
  type DroneAsset,
} from '../utils/logbookLogic';
import { InteractiveDroneMap } from './MapPickerModal';

interface FlightLogModuleProps {
  flights: FlightEntry[];
  fleet: DroneAsset[];
  onUpdateFlight: (flight: FlightEntry) => Promise<void>;
  onDeleteFlight: (id: string) => Promise<void>;
  onNavigateToNewFlight: () => void;
}

export const FlightLogModule: React.FC<FlightLogModuleProps> = ({
  flights,
  fleet,
  onUpdateFlight,
  onDeleteFlight,
  onNavigateToNewFlight,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDroneSn, setSelectedDroneSn] = useState<string>('ALL');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLocation, setEditLocation] = useState<string>('');
  const [editLat, setEditLat] = useState<number | undefined>(undefined);
  const [editLng, setEditLng] = useState<number | undefined>(undefined);
  const [editRadius, setEditRadius] = useState<number>(500);
  const [editTakeoff, setEditTakeoff] = useState<string>('');
  const [editLanding, setEditLanding] = useState<string>('');
  const [editSn, setEditSn] = useState<string>('');
  const [editChecklist, setEditChecklist] = useState<boolean>(true);
  const [editNotes, setEditNotes] = useState<string>('');
  const [showEditMap, setShowEditMap] = useState<boolean>(false);

  const startEdit = (flight: FlightEntry) => {
    setEditingId(flight.id);
    setEditLocation(flight.location);
    setEditLat(flight.latitude);
    setEditLng(flight.longitude);
    setEditRadius(flight.radiusM || 500);
    setEditTakeoff(flight.takeoffTime);
    setEditLanding(flight.landingTime);
    setEditSn(flight.droneSn || '');
    setEditChecklist(flight.checklistCompleted);
    setEditNotes(flight.notes);
    setShowEditMap(false);
  };

  const handleSaveInline = async (original: FlightEntry) => {
    if (!editLocation.trim()) return;
    const calcMin = calculateDurationMin(editTakeoff, editLanding);
    const durationMin = calcMin !== null ? calcMin : original.durationMin;

    await onUpdateFlight({
      ...original,
      location: editLocation.trim(),
      latitude: editLat,
      longitude: editLng,
      radiusM: editRadius,
      takeoffTime: editTakeoff,
      landingTime: editLanding,
      durationMin,
      droneSn: editSn.trim() || original.droneSn,
      checklistCompleted: editChecklist,
      notes: editNotes.trim() || 'Sve ok',
    });
    setEditingId(null);
    setShowEditMap(false);
  };

  const handleExportCsv = () => {
    const csvContent = generateFlightsCsv(filteredFlights);
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drone-logbook-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const uniqueSnList = Array.from(
    new Set(
      [...fleet.map((d) => d.sn), ...flights.map((f) => f.droneSn)].filter(Boolean)
    )
  );

  const filteredFlights = flights.filter((f) => {
    if (selectedDroneSn !== 'ALL' && f.droneSn !== selectedDroneSn) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.location.toLowerCase().includes(q) ||
      f.notes.toLowerCase().includes(q) ||
      f.droneSn.toLowerCase().includes(q) ||
      formatCroatianDateTime(f.takeoffTime).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Filter & Export Bar */}
      <div className="bg-[#0b1324]/95 border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pretraži po lokaciji, napomeni ili datumu..."
              aria-label="Pretraži dnevnik letova"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedDroneSn}
            onChange={(e) => setSelectedDroneSn(e.target.value)}
            aria-label="Filtriraj po dronu"
            className="px-3 py-2 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Svi dronovi ({flights.length})</option>
            {uniqueSnList.map((sn) => (
              <option key={sn} value={sn}>
                S/N: {sn}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredFlights.length === 0}
          className="px-4 py-2 rounded-xl bg-[#101c34] hover:bg-cyan-500/20 disabled:opacity-40 border border-cyan-500/40 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Izvezi CSV</span>
        </button>
      </div>

      {/* Flight Log Cards Grid */}
      {filteredFlights.length === 0 ? (
        <div className="bg-[#0b1324]/95 border border-slate-800 rounded-2xl p-12 text-center shadow-lg">
          <Plane className="w-10 h-10 text-cyan-400/50 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white font-['Outfit']">
            Dnevnik letova je prazan
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-5 max-w-md mx-auto">
            Zabilježite svoj prvi let u modulu NOVI LET ili se prijavite Google računom za povlačenje svojih letova iz oblaka.
          </p>
          <button
            type="button"
            onClick={onNavigateToNewFlight}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-[#050811] text-xs font-bold cursor-pointer"
          >
            + Zabilježi novi let
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredFlights.map((flight) => {
            const isEditing = editingId === flight.id;
            return (
              <article
                key={flight.id}
                className="bg-[#0b1324]/95 border border-cyan-500/35 rounded-2xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-cyan-300">
                        Uređivanje zapisa o letu
                      </span>
                      {editSn && (
                        <span className="text-[11px] font-mono text-slate-400">
                          S/N: {editSn}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Lokacija polijetanja
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          aria-label="Uredi lokaciju leta"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#060a14] border border-slate-700 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditMap((prev) => !prev)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#101c34] border border-slate-700 text-xs text-cyan-300 flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <MapIcon className="w-3.5 h-3.5" />
                          <span>Karta</span>
                        </button>
                      </div>
                    </div>

                    {showEditMap && (
                      <div className="p-2.5 rounded-xl bg-[#060a14] border border-slate-800">
                        <InteractiveDroneMap
                          initialLat={editLat || 45.81501}
                          initialLng={editLng || 15.98192}
                          radiusM={editRadius}
                          onRadiusChange={(r) => setEditRadius(r)}
                          onConfirmLocation={(locStr, lat, lng, r) => {
                            setEditLocation(locStr);
                            setEditLat(lat);
                            setEditLng(lng);
                            setEditRadius(r);
                          }}
                          embedded={true}
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>
                          Radius leta:{' '}
                          <strong className="text-cyan-300 font-mono">
                            {editRadius}m
                          </strong>
                        </span>
                        <span className="font-mono text-slate-500">
                          100m – 2000m
                        </span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={2000}
                        step={50}
                        value={editRadius}
                        aria-label="Uredi radijus leta"
                        onChange={(e) => setEditRadius(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Polijetanje
                        </label>
                        <input
                          type="datetime-local"
                          value={editTakeoff}
                          onChange={(e) => setEditTakeoff(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#060a14] border border-slate-700 text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Slijetanje
                        </label>
                        <input
                          type="datetime-local"
                          value={editLanding}
                          onChange={(e) => setEditLanding(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#060a14] border border-slate-700 text-xs font-mono text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Napomene / Događaji
                      </label>
                      <textarea
                        rows={2}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        aria-label="Uredi napomene leta"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#060a14] border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => onDeleteFlight(flight.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Obriši</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Odustani</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveInline(flight)}
                          className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-xs font-bold text-[#050811] flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Spremi izmjene</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
                          {formatCroatianDateTime(flight.takeoffTime)} –{' '}
                          {formatCroatianDateTime(flight.landingTime)} ·{' '}
                          {flight.durationMin} min
                        </div>
                        {(flight.droneModel || flight.droneSn) && (
                          <span className="text-[11px] font-mono text-slate-400 shrink-0">
                            {flight.droneModel || 'Dron'}
                            {flight.droneSn ? ` (${flight.droneSn})` : ''}
                          </span>
                        )}
                      </div>

                      <div className="mb-2.5">
                        <div className="text-[11px] text-slate-400">Lokacija</div>
                        <div className="text-sm text-slate-100 leading-snug font-medium">
                          {flight.location}
                        </div>
                      </div>

                      <div className="mb-2.5">
                        <div className="text-[11px] text-slate-400">Radius</div>
                        <div className="text-xs font-mono font-semibold text-cyan-300 tabular-nums">
                          {flight.radiusM}m
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 mb-1">
                          Checklista / Napomene
                        </div>
                        {flight.checklistCompleted && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-200 mb-1">
                            <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>Prijeletna provjera obavljena</span>
                          </div>
                        )}
                        <p className="text-xs italic text-slate-300 leading-relaxed">
                          {flight.notes || 'Sve uredno'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end mt-3 pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => startEdit(flight)}
                        aria-label={`Uredi let ${flight.location}`}
                        className="px-3.5 py-1 rounded-lg border border-cyan-500/50 hover:bg-cyan-500/15 text-xs font-medium text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Uredi</span>
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
