import React, { useState, useRef } from 'react';
import {
  X,
  Save,
  Upload,
  Plus,
  Trash2,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  FileText,
  Download,
  Cloud,
  Cookie,
  Mail,
  Globe,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import type {
  PilotProfileData,
  PilotDocType,
  PilotDocumentData,
  DroneAsset,
} from '../utils/logbookLogic';
import {
  DEFAULT_AVATAR_SVG,
  APP_HERO_LOGO_PNG,
} from '../data/defaultCountries';
import type { User } from 'firebase/auth';

interface ProfileModalProps {
  profile: PilotProfileData;
  fleet: DroneAsset[];
  onSave: (newProfile: PilotProfileData, newFleet: DroneAsset[]) => Promise<void>;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  fleet,
  onSave,
  onClose,
}) => {
  const [pilotName, setPilotName] = useState(profile.pilotName);
  const [pilotId, setPilotId] = useState(profile.pilotId);
  const [operatorId, setOperatorId] = useState(profile.operatorId);
  const [droneMake, setDroneMake] = useState(profile.droneMake);
  const [droneModel, setDroneModel] = useState(profile.droneModel);
  const [droneSn, setDroneSn] = useState(profile.droneSn);
  const [avatarDataUrl, setAvatarDataUrl] = useState(
    profile.avatarDataUrl || DEFAULT_AVATAR_SVG
  );
  const [licenseUrl, setLicenseUrl] = useState(profile.licenseUrl);
  const [registrationUrl, setRegistrationUrl] = useState(profile.registrationUrl);
  const [insuranceUrl, setInsuranceUrl] = useState(profile.insuranceUrl);
  const [localFleet, setLocalFleet] = useState<DroneAsset[]>(fleet);

  // Add drone inputs
  const [newMake, setNewMake] = useState('DJI');
  const [newModel, setNewModel] = useState('');
  const [newSn, setNewSn] = useState('');
  const [newWeight, setNewWeight] = useState('C0 (<249g)');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 240;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          setAvatarDataUrl(compressed);
        }
      };
      if (typeof ev.target?.result === 'string') {
        img.src = ev.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddDrone = () => {
    if (!newModel.trim() || !newSn.trim()) return;
    const added: DroneAsset = {
      id: `drone-${Date.now()}`,
      make: newMake.trim() || 'DJI',
      model: newModel.trim(),
      sn: newSn.trim(),
      weightClass: newWeight,
    };
    setLocalFleet((prev) => [...prev, added]);
    setDroneMake(added.make);
    setDroneModel(added.model);
    setDroneSn(added.sn);
    setNewModel('');
    setNewSn('');
  };

  const handleRemoveDrone = (id: string) => {
    setLocalFleet((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(
      {
        uid: profile.uid,
        pilotName,
        pilotId,
        operatorId,
        droneMake,
        droneModel,
        droneSn,
        avatarDataUrl,
        licenseUrl,
        registrationUrl,
        insuranceUrl,
      },
      localFleet
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Postavke profila pilota i flote"
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-[#0b1324] border border-cyan-500/40 rounded-2xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-['Outfit']">
              Profil Pilota i Flota Dronova
            </h2>
            <p className="text-xs text-slate-400">
              Podaci se spremaju u vaš preglednik i sinkroniziraju s vašim osobnim Google Cloud računom
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zatvori prozor profila"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Section */}
          <div className="flex items-center gap-4 bg-[#060a14] border border-slate-800 rounded-xl p-3.5">
            <img
              src={avatarDataUrl}
              alt="Pregled avatara"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shrink-0"
            />
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-200">
                Slika profila ili oznaka operatera
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#111c33] hover:bg-cyan-500/20 border border-cyan-500/40 text-xs text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Učitaj sliku</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarDataUrl(DEFAULT_AVATAR_SVG)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Zadani drone.app SVG</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Pilot Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="modal-pilot-name"
                className="block text-xs text-slate-300 mb-1"
              >
                Ime pilota / Callsign
              </label>
              <input
                id="modal-pilot-name"
                type="text"
                value={pilotName}
                onChange={(e) => setPilotName(e.target.value)}
                placeholder="Upišite ime ili callsign"
                className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-xs text-white"
              />
            </div>
            <div>
              <label
                htmlFor="modal-pilot-id"
                className="block text-xs text-slate-300 mb-1"
              >
                Pilot ID (A1/A3 / A2)
              </label>
              <input
                id="modal-pilot-id"
                type="text"
                value={pilotId}
                onChange={(e) => setPilotId(e.target.value)}
                placeholder="Npr. HRV-RP-..."
                className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label
                htmlFor="modal-operator-id"
                className="block text-xs text-slate-300 mb-1"
              >
                Operater ID (UAS)
              </label>
              <input
                id="modal-operator-id"
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="Npr. HRV-OP-..."
                className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 text-xs font-mono text-white"
              />
            </div>
          </div>

          {/* Active Drone Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Proizvođač aktivnog drona
              </label>
              <input
                type="text"
                value={droneMake}
                onChange={(e) => setDroneMake(e.target.value)}
                placeholder="Npr. DJI, Autel..."
                className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Model aktivnog drona
              </label>
              <input
                type="text"
                value={droneModel}
                onChange={(e) => setDroneModel(e.target.value)}
                placeholder="Npr. Mini 4 Pro, Mavic 3..."
                className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Serijski broj (S/N)
              </label>
              <input
                type="text"
                value={droneSn}
                onChange={(e) => setDroneSn(e.target.value)}
                placeholder="Upišite S/N drona"
                className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-800 text-xs font-mono text-cyan-300"
              />
            </div>
          </div>

          {/* Fleet Manager */}
          <div className="bg-[#060a14] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="text-xs font-semibold text-cyan-300">
              Vaša flota dronova (za brzu promjenu u zaglavlju)
            </div>
            {localFleet.length === 0 ? (
              <p className="text-xs text-slate-500">
                Još nemate spremljenih dronova u floti. Dodajte ih ispod.
              </p>
            ) : (
              <div className="space-y-1.5">
                {localFleet.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between bg-[#0d1629] px-3 py-1.5 rounded-lg border border-slate-800 text-xs"
                  >
                    <div>
                      <strong className="text-white">
                        {d.make} {d.model}
                      </strong>{' '}
                      · <span className="font-mono text-cyan-300">{d.sn}</span>{' '}
                      <span className="text-slate-400">({d.weightClass})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDroneMake(d.make);
                          setDroneModel(d.model);
                          setDroneSn(d.sn);
                        }}
                        className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Postavi aktivnim
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDrone(d.id)}
                        className="text-rose-400 hover:text-rose-300 cursor-pointer"
                        aria-label={`Ukloni dron ${d.model}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
              <input
                type="text"
                value={newMake}
                onChange={(e) => setNewMake(e.target.value)}
                placeholder="Proizvođač (DJI)"
                className="px-2.5 py-1.5 rounded-lg bg-[#0b1324] border border-slate-800 text-xs text-white"
              />
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Model (npr. Air 3)"
                className="px-2.5 py-1.5 rounded-lg bg-[#0b1324] border border-slate-800 text-xs text-white"
              />
              <input
                type="text"
                value={newSn}
                onChange={(e) => setNewSn(e.target.value)}
                placeholder="S/N broj"
                className="px-2.5 py-1.5 rounded-lg bg-[#0b1324] border border-slate-800 text-xs font-mono text-white"
              />
              <select
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-[#0b1324] border border-slate-800 text-xs text-slate-200"
              >
                <option value="C0 (<249g)">C0 (&lt;249g)</option>
                <option value="C1 (<900g)">C1 (&lt;900g)</option>
                <option value="C2 (<4kg)">C2 (&lt;4kg)</option>
                <option value="C3/C4 (<25kg)">C3/C4 (&lt;25kg)</option>
              </select>
              <button
                type="button"
                onClick={handleAddDrone}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
            >
              Odustani
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-xs font-bold text-[#050811] flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Spremi profil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Trezor Dokumenata (Dozvola, Registracija, Osiguranje)
 * Supports uploading local files (PDF / JPG / PNG / WEBP) + saving to localStorage & Firebase Cloud!
 */
export const DocumentPreviewModal: React.FC<{
  docType: PilotDocType;
  profile: PilotProfileData;
  pilotDoc: PilotDocumentData | null;
  user: User | null;
  onSaveDocument: (
    docType: PilotDocType,
    data: Omit<PilotDocumentData, 'docType' | 'updatedAtMs' | 'synced'>
  ) => Promise<void>;
  onRemoveDocument: (docType: PilotDocType) => Promise<void>;
  onSignInGoogle: () => void;
  onClose: () => void;
}> = ({
  docType,
  profile,
  pilotDoc,
  user,
  onSaveDocument,
  onRemoveDocument,
  onSignInGoogle,
  onClose,
}) => {
  const meta = {
    license: {
      title: 'Dozvola udaljenog pilota (EASA A1/A3 / A2)',
      subtitle: 'Učitajte PDF ili sliku certifikata sa svog uređaja',
      numberLabel: 'Broj dozvole (Pilot ID)',
      defaultNumber: pilotDoc?.docNumber || profile.pilotId || '',
      defaultUrl: pilotDoc?.externalUrl || profile.licenseUrl || '',
    },
    registration: {
      title: 'Registracija UAS Operatera',
      subtitle: 'Potvrda registracije operatera (HACZ / CCAA / EASA)',
      numberLabel: 'Broj operatera (Operator ID)',
      defaultNumber: pilotDoc?.docNumber || profile.operatorId || '',
      defaultUrl: pilotDoc?.externalUrl || profile.registrationUrl || '',
    },
    insurance: {
      title: 'Polica osiguranja od odgovornosti za dron',
      subtitle: 'Polica osiguranja prema Uredbi (EZ) br. 785/2004',
      numberLabel: 'Broj police / S/N drona',
      defaultNumber: pilotDoc?.docNumber || profile.droneSn || '',
      defaultUrl: pilotDoc?.externalUrl || profile.insuranceUrl || '',
    },
  }[docType];

  const [fileName, setFileName] = useState<string>(pilotDoc?.fileName || '');
  const [mimeType, setMimeType] = useState<string>(pilotDoc?.mimeType || '');
  const [fileDataUrl, setFileDataUrl] = useState<string>(
    pilotDoc?.fileDataUrl || ''
  );
  const [docNumber, setDocNumber] = useState<string>(meta.defaultNumber);
  const [validUntil, setValidUntil] = useState<string>(
    pilotDoc?.validUntil || ''
  );
  const [externalUrl, setExternalUrl] = useState<string>(meta.defaultUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const docInputRef = useRef<HTMLInputElement | null>(null);

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsProcessing(true);

    // If image, compress smoothly via Canvas so it fits cleanly in Firestore & localStorage
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.78);
            setFileName(file.name);
            setMimeType('image/jpeg');
            setFileDataUrl(compressed);
          }
          setIsProcessing(false);
        };
        img.onerror = () => {
          setUploadError('Slika se ne može učitati.');
          setIsProcessing(false);
        };
        if (typeof ev.target?.result === 'string') {
          img.src = ev.target.result;
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // If PDF, check size (< 420 KB raw so Base64 stays under 580 KB Firestore limit)
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      if (file.size > 430 * 1024) {
        setUploadError(
          'PDF datoteka je veća od 430 KB. Učitajte sliku (screenshot/fotografiju dokumenta) ili manji PDF kako bi se mogao sinkronizirati u Cloud.'
        );
        setIsProcessing(false);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setFileName(file.name);
          setMimeType('application/pdf');
          setFileDataUrl(ev.target.result);
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    setUploadError('Podržani formati su PDF, JPG, PNG i WEBP.');
    setIsProcessing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveDocument(docType, {
      fileName,
      mimeType,
      fileDataUrl,
      externalUrl,
      docNumber,
      validUntil,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={meta.title}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-[#0b1324] border border-cyan-500/45 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-base font-['Outfit']">
              <FileCheck2 className="w-5 h-5 shrink-0 text-cyan-400" />
              <span>{meta.title}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{meta.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zatvori"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cloud Sync Banner */}
        <div className="rounded-xl bg-[#070c18] border border-slate-800 p-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {user
                ? `Sinkronizirano s vašim Google Cloud računom (${user.email})`
                : 'Sprema se lokalno — prijavite se Google računom za automatski Cloud backup'}
            </span>
          </div>
          {!user && (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-semibold whitespace-nowrap cursor-pointer"
            >
              Prijava
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {/* Local File Picker / Dropzone */}
          <div className="border-2 border-dashed border-cyan-500/35 hover:border-cyan-400/70 rounded-2xl p-4 bg-[#060a14] text-center transition-colors">
            <input
              ref={docInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleLocalFileSelect}
              className="hidden"
            />
            <Upload className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
            <div className="font-semibold text-white text-sm">
              {fileName
                ? `Odabrana datoteka: ${fileName}`
                : 'Odaberite lokalnu datoteku (Slika ili PDF)'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 mb-3">
              Fotografija iskaznice, screenshot certifikata ili PDF dokument do 430 KB
            </p>
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-semibold cursor-pointer"
            >
              {isProcessing
                ? 'Obrađujem datoteku...'
                : fileName
                ? 'Zamijeni lokalnu datoteku'
                : 'Učitaj s uređaja'}
            </button>
          </div>

          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200">
              {uploadError}
            </div>
          )}

          {/* Live Preview of Uploaded Local/Cloud Document */}
          {fileDataUrl && (
            <div className="bg-[#060a14] border border-slate-800 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pregled spremljenog dokumenta</span>
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={fileDataUrl}
                    download={fileName || `${docType}-dokument`}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 flex items-center gap-1 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Preuzmi</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName('');
                      setMimeType('');
                      setFileDataUrl('');
                      onRemoveDocument(docType);
                    }}
                    className="px-2 py-1 rounded-lg bg-rose-950/60 text-rose-300 hover:bg-rose-900/70 cursor-pointer"
                  >
                    Ukloni
                  </button>
                </div>
              </div>

              {mimeType.startsWith('image/') ? (
                <img
                  src={fileDataUrl}
                  alt={meta.title}
                  className="w-full max-h-60 object-contain rounded-lg border border-slate-800 bg-black"
                />
              ) : (
                <div className="p-3 rounded-lg bg-[#0d1629] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <span className="truncate max-w-[220px]">
                      {fileName || 'PDF Dokument.pdf'}
                    </span>
                  </div>
                  <a
                    href={fileDataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline font-semibold"
                  >
                    Otvori PDF
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Document Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">
                {meta.numberLabel}
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Upišite oznaku / broj..."
                className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 font-mono text-cyan-300"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">
                Vrijedi do (opcionalno)
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">
              Vanjski link na dokument u oblaku (opcionalno, npr. Google Drive)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#060a14] border border-slate-800 focus:border-cyan-400 font-mono text-white"
              />
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              Zatvori
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-[#050811] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Spremi dokument</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Rich About, Privacy/Cookies, Disclaimer & Contact Modal
 * Features original PNG + SVG branding, drone@zrina.app & https://zrina.app
 */
export const DisclaimerModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="O aplikaciji, privatnost i odricanje od odgovornosti"
    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
  >
    <div className="bg-[#0b1324] border border-cyan-500/45 rounded-2xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5 text-white font-bold font-['Outfit']">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg">O aplikaciji · Pravila privatnosti · Kontakt</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zatvori"
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Branding Showcase with User's Uploaded PNG & SVG */}
      <div className="bg-gradient-to-r from-[#060a14] via-[#0f1b33] to-[#060a14] border border-cyan-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
        <img
          src={APP_HERO_LOGO_PNG}
          alt="dronelogbook.app originalni amblem"
          className="w-24 h-24 rounded-2xl object-cover border border-cyan-400/50 shadow-[0_0_24px_rgba(0,240,255,0.25)] shrink-0"
        />
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-2">
            <img
              src={DEFAULT_AVATAR_SVG}
              alt="dronelogbook.app ikona"
              className="w-6 h-6 rounded-md border border-cyan-400/40 object-cover"
            />
            <h3 className="text-base font-bold text-white font-['Outfit']">
              <span className="text-cyan-400">dronelogbook.app</span> — Pametni dnevnik letova i flota
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Suvremena, brza i pametna web/PWA platforma za udaljene pilote bespilotnih
            letjelica (UAS). Dizajnirana za jednostavnu evidenciju letova uz GPS kartu,
            praćenje servisa flote, lokalno i Cloud čuvanje dozvola te trenutni uvid u
            zrakoplovne i carinske propise za <strong>195 država svijeta</strong>.
          </p>
        </div>
      </div>

      {/* Section 1: Multi-User Cloud & Clean Slate Architecture */}
      <div className="bg-[#060a14] border border-slate-800/90 rounded-xl p-4 space-y-2 text-xs text-slate-300 leading-relaxed">
        <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm font-['Outfit']">
          <Cloud className="w-4 h-4 text-cyan-400" />
          <h4>Višekorisnički Cloud sustav (Spremno za dijeljenje)</h4>
        </div>
        <p>
          Aplikacija se otvara potpuno čista (<em>Clean Slate</em>) te svaki pilot
          kojem podijelite poveznicu unosi vlastite podatke. Prijavom putem vlastitog{' '}
          <strong>Google računa</strong>, svaki korisnik dobiva svoj potpuno odvojen i
          kriptografski zaštićen prostor u <strong>Firebase Firestore</strong> bazi
          podataka (nitko ne vidi tuđe letove, servise niti učitane dokumente).
        </p>
      </div>

      {/* Section 2: Cookies, LocalStorage & Tracking Policy */}
      <div className="bg-[#060a14] border border-slate-800/90 rounded-xl p-4 space-y-2 text-xs text-slate-300 leading-relaxed">
        <div className="flex items-center gap-2 text-sky-300 font-bold text-sm font-['Outfit']">
          <Cookie className="w-4 h-4 text-sky-400" />
          <h4>Kolačići, privatnost i pohrana podataka (Cookies &amp; Privacy)</h4>
        </div>
        <p>
          <strong>Bez oglašivačkog praćenja:</strong> Ova aplikacija <u>ne koristi</u>{' '}
          reklamne kolačiće trećih strana, marketinške piksele niti prodaje korisničke
          podatke.
        </p>
        <p>
          <strong>Tehnička pohrana (LocalStorage &amp; Firebase Auth):</strong> Za rad
          izvan mreže (Offline-First PWA) aplikacija koristi lokalnu memoriju vašeg
          preglednika (<code>localStorage</code>) kako bi vaši letovi, profil i
          učitani dokumenti bili dostupni čak i na terenu bez signala. Ako se
          odlučite prijaviti putem Google računa, koriste se isključivo nužni
          sigurnosni tokeni (Firebase Authentication) radi sinkronizacije s vašim
          osobnim oblakom.
        </p>
      </div>

      {/* Section 3: Aviation Legal Disclaimer */}
      <div className="bg-[#060a14] border border-amber-500/30 rounded-xl p-4 space-y-2 text-xs text-slate-300 leading-relaxed">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-['Outfit']">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h4>Odricanje od odgovornosti (Pravna napomena)</h4>
        </div>
        <p>
          Podaci o propisima za 195 država svijeta i meteorološki parametri u
          aplikaciji isključivo su informativne prirode i služe kao pomoć u pripremi
          leta. Zrakoplovni zakoni (EASA, CCAA/HACZ, HKZP AMC Portal te nacionalne
          agencije drugih država) podložni su izmjenama i privremenim NOTAM zabranama.
        </p>
        <p className="text-amber-200/90 font-medium">
          Udaljeni pilot u svakom je trenutku osobno i zakonski odgovoran za sigurnost
          leta, provjeru aktivnih geozona te poštivanje zakona i carinskih propisa
          države u kojoj upravlja dronom.
        </p>
      </div>

      {/* Section 4: Contact & Official Web Links */}
      <div className="bg-gradient-to-r from-[#091326] to-[#111c36] border border-cyan-500/35 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs space-y-0.5 text-center sm:text-left">
          <div className="font-bold text-white text-sm">
            Kontakt podrška i informacije
          </div>
          <p className="text-slate-400">
            Imate prijedlog, pitanje ili ispravak pravila? Javite nam se:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="mailto:drone@zrina.app"
            className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>drone@zrina.app</span>
          </a>

          <a
            href="https://zrina.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-400/50 text-xs font-mono font-semibold text-fuchsia-300 flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>zrina.app</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-[#050811] text-xs font-bold cursor-pointer"
        >
          U redu, razumijem
        </button>
      </div>
    </div>
  </div>
);
