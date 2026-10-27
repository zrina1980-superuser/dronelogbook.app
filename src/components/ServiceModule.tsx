import React, { useState } from 'react';
import {
  Wrench,
  Edit3,
  Trash2,
  Check,
  X,
  Search,
  AlertCircle,
} from 'lucide-react';
import {
  formatCroatianDate,
  type MaintenanceEntry,
  type PilotProfileData,
  type DroneAsset,
} from '../utils/logbookLogic';

interface ServiceModuleProps {
  profile: PilotProfileData;
  fleet: DroneAsset[];
  maintenance: MaintenanceEntry[];
  onAddMaintenance: (data: {
    serviceDate: string;
    category: string;
    droneSn: string;
    description: string;
  }) => Promise<void>;
  onUpdateMaintenance: (entry: MaintenanceEntry) => Promise<void>;
  onDeleteMaintenance: (id: string) => Promise<void>;
}

const SERVICE_CATEGORIES = [
  'Redovni servis',
  'Zamjena dijelova',
  'Firmware ažuriranje',
  'Kalibracija IMU / Kompasa',
  'Popravak nakon nezgode',
  'Provjera baterija',
];

function getTodayDateString(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export const ServiceModule: React.FC<ServiceModuleProps> = ({
  profile,
  fleet,
  maintenance,
  onAddMaintenance,
  onUpdateMaintenance,
  onDeleteMaintenance,
}) => {
  const [serviceDate, setServiceDate] = useState<string>(() => getTodayDateString());
  const [category, setCategory] = useState<string>('Redovni servis');
  const [droneSn, setDroneSn] = useState<string>(profile.droneSn || '');
  const [description, setDescription] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editSn, setEditSn] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!serviceDate) {
      setErrorMsg('Odaberite datum servisa.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Unesite opis obavljenih radova na dronu.');
      return;
    }

    await onAddMaintenance({
      serviceDate,
      category,
      droneSn: droneSn || profile.droneSn || '',
      description: description.trim(),
    });

    setDescription('');
  };

  const startEdit = (item: MaintenanceEntry) => {
    setEditingId(item.id);
    setEditDate(item.serviceDate);
    setEditCategory(item.category || 'Redovni servis');
    setEditSn(item.droneSn || profile.droneSn);
    setEditDescription(item.description);
  };

  const saveInlineEdit = async (item: MaintenanceEntry) => {
    if (!editDescription.trim()) return;
    await onUpdateMaintenance({
      ...item,
      serviceDate: editDate,
      category: editCategory,
      droneSn: editSn,
      description: editDescription.trim(),
    });
    setEditingId(null);
  };

  const filteredMaintenance = maintenance.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.description.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.droneSn.toLowerCase().includes(q) ||
      formatCroatianDate(m.serviceDate).includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Add Service Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-5 bg-[#0b1324]/95 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-[0_14px_40px_rgba(0,0,0,0.45)] space-y-4"
      >
        <div>
          <label
            htmlFor="service-date-input"
            className="block text-xs font-medium text-slate-300 mb-1.5"
          >
            Datum servisa
          </label>
          <input
            id="service-date-input"
            type="date"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-sm font-mono text-white focus:outline-none tabular-nums"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="service-category-select"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Vrsta zahvata
            </label>
            <select
              id="service-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-xs text-white focus:outline-none cursor-pointer"
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="service-drone-sn"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              S/N Drona
            </label>
            <input
              id="service-drone-sn"
              type="text"
              list="fleet-sn-options"
              value={droneSn}
              onChange={(e) => setDroneSn(e.target.value)}
              placeholder="Opcionalno S/N"
              className="w-full px-3 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-xs font-mono text-cyan-300 focus:outline-none"
            />
            <datalist id="fleet-sn-options">
              {fleet.map((d) => (
                <option key={d.id} value={d.sn}>
                  {d.make} {d.model}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label
            htmlFor="service-description-input"
            className="block text-xs font-medium text-slate-300 mb-1.5"
          >
            Opis radova
          </label>
          <textarea
            id="service-description-input"
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="Npr. zamjena propelera, ažuriranje firmware-a, kalibracija gimbala..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-sm text-white font-mono placeholder-slate-500 focus:outline-none resize-y"
          />
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-300 hover:from-cyan-300 hover:to-sky-300 text-sm font-bold text-[#050811] tracking-wide flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
        >
          <Wrench className="w-4 h-4" />
          <span>ZAPIŠI SERVIS</span>
        </button>
      </form>

      {/* Right Column: Service History Cards */}
      <div className="lg:col-span-7 bg-[#0b1324]/95 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-[0_14px_40px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit']">
              Povijest servisa i održavanja
            </h2>
            <p className="text-xs text-slate-400">
              Ukupno evidentiranih zahvata:{' '}
              <span className="font-mono text-cyan-300 tabular-nums">
                {maintenance.length}
              </span>
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pretraži servise..."
              aria-label="Pretraži povijest servisa"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {filteredMaintenance.length === 0 ? (
          <div className="text-center py-12 px-4 bg-[#060a14] rounded-2xl border border-slate-800/80">
            <Wrench className="w-8 h-8 text-cyan-400/50 mx-auto mb-2.5" />
            <p className="text-sm font-semibold text-slate-200">
              Još nema zapisanih servisa
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Unesite prvi servisni zahvat ili zamjenu dijelova putem obrasca lijevo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMaintenance.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-[#070c18] border border-cyan-500/30 rounded-2xl p-4 transition-colors"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Datum
                          </label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b1324] border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Vrsta
                          </label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b1324] border border-slate-700 text-xs text-white"
                          >
                            {SERVICE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            S/N Drona
                          </label>
                          <input
                            type="text"
                            value={editSn}
                            onChange={(e) => setEditSn(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b1324] border border-slate-700 text-xs font-mono text-cyan-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Opis radova
                        </label>
                        <textarea
                          rows={2}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#0b1324] border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => onDeleteMaintenance(item.id)}
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
                            onClick={() => saveInlineEdit(item)}
                            className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-xs font-bold text-[#050811] flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Spremi</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
                          {formatCroatianDate(item.serviceDate)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {item.category}
                          {item.droneSn ? ` · S/N: ${item.droneSn}` : ''}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 mb-0.5">Opis</div>
                      <div className="text-sm text-slate-100 leading-relaxed">
                        {item.description}
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          aria-label={`Uredi servis ${item.description}`}
                          className="px-3.5 py-1 rounded-lg border border-cyan-500/50 hover:bg-cyan-500/15 text-xs font-medium text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Uredi</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
