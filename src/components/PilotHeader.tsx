import React from 'react';
import {
  RefreshCw,
  Settings,
  Info,
  ShieldCheck,
  FileText,
  CreditCard,
  Cloud,
  LogOut,
  Plane,
  Clock,
  Globe,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type {
  PilotProfileData,
  PilotDocType,
  PilotDocumentData,
  DroneAsset,
  FlightEntry,
} from '../utils/logbookLogic';
import { computeFlightAnalytics } from '../utils/logbookLogic';
import { DEFAULT_AVATAR_SVG } from '../data/defaultCountries';
import { PWAInstallButton } from './PWAInstallButton';
import type { User } from 'firebase/auth';

interface PilotHeaderProps {
  profile: PilotProfileData;
  pilotDocs: Record<PilotDocType, PilotDocumentData | null>;
  fleet: DroneAsset[];
  flights: FlightEntry[];
  rulesCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncText: string;
  user: User | null;
  onSyncNow: () => void;
  onOpenSettings: () => void;
  onOpenDisclaimer: () => void;
  onOpenDocModal: (docType: PilotDocType) => void;
  onUpdateDroneSn: (sn: string) => void;
  onSignInGoogle: () => void;
  onSignOut: () => void;
}

export const PilotHeader: React.FC<PilotHeaderProps> = ({
  profile,
  pilotDocs,
  fleet,
  flights,
  rulesCount,
  isOnline,
  isSyncing,
  lastSyncText,
  user,
  onSyncNow,
  onOpenSettings,
  onOpenDisclaimer,
  onOpenDocModal,
  onUpdateDroneSn,
  onSignInGoogle,
  onSignOut,
}) => {
  const stats = computeFlightAnalytics(flights);

  const hasDocSaved = (docType: PilotDocType): boolean => {
    const docItem = pilotDocs[docType];
    if (docItem && (docItem.fileDataUrl || docItem.externalUrl || docItem.docNumber)) {
      return true;
    }
    if (docType === 'license' && profile.licenseUrl) return true;
    if (docType === 'registration' && profile.registrationUrl) return true;
    if (docType === 'insurance' && profile.insuranceUrl) return true;
    return false;
  };

  const displayPilotName =
    profile.pilotName || user?.displayName || 'Novi Pilot';
  const isCleanSlate =
    !profile.pilotName && !user && !profile.pilotId && !profile.droneSn;

  return (
    <header className="w-full mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left / Main Pilot Command Deck */}
        <div className="lg:col-span-7 bg-gradient-to-br from-[#0c1528] via-[#091020] to-[#070b16] border border-cyan-500/35 rounded-2xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,240,255,0.07)] flex flex-col justify-between relative overflow-hidden">
          {/* Subtle top ambient glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-52 h-52 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-fuchsia-500/10 blur-3xl" />

          {/* Top Bar: Sync + Status on left, PWA Install + Google Cloud Login + Settings + About on right */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 relative z-10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSyncNow}
                disabled={isSyncing}
                aria-label="Sinkroniziraj podatke"
                title={`Sinkroniziraj podatke (${lastSyncText})`}
                className="w-8 h-8 rounded-xl border border-cyan-400/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500/20 flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                />
              </button>

              <span
                className={`text-[11px] font-mono font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg border whitespace-nowrap ${
                  isOnline
                    ? 'border-cyan-400/40 bg-cyan-950/40 text-cyan-300'
                    : 'border-amber-400/40 bg-amber-950/40 text-amber-300'
                }`}
              >
                {isOnline ? '● Online' : '○ Offline'}
              </span>

              <span className="hidden xl:inline text-xs text-slate-400 truncate max-w-[160px]">
                {user ? `Cloud: ${user.email}` : lastSyncText}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Mandatory In-App PWA Install Button */}
              <PWAInstallButton />

              {user ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-[#111c33]/80 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  title={`Prijavljen: ${user.email}`}
                >
                  <LogOut className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Odjava</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 hover:from-cyan-500/30 hover:to-fuchsia-500/30 border border-cyan-400/50 text-xs font-semibold text-cyan-200 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                >
                  <Cloud className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Cloud Prijava</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Uredi profil pilota"
                title="Postavke profila i flote dronova"
                className="w-9 h-9 rounded-xl border border-slate-700/90 hover:border-cyan-400/60 bg-[#101a2e] hover:bg-cyan-500/15 text-cyan-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenDisclaimer}
                aria-label="O aplikaciji, privatnost i uvjeti korištenja"
                title="O aplikaciji, kolačići, disclaimer i kontakt"
                className="px-2.5 h-9 rounded-xl border border-slate-700/90 hover:border-fuchsia-400/60 bg-[#101a2e] hover:bg-fuchsia-500/15 text-slate-200 hover:text-white flex items-center justify-center gap-1 text-xs font-medium transition-colors cursor-pointer shrink-0"
              >
                <Info className="w-4 h-4 text-fuchsia-400" />
                <span className="hidden sm:inline">O aplikaciji</span>
              </button>
            </div>
          </div>

          {/* Middle Row: Vector HUD Logo / Avatar + Pilot Identity */}
          <div className="flex items-center gap-4 my-1 relative z-10">
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Promijeni sliku profila"
              className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-cyan-400/70 bg-[#060a14] shrink-0 group cursor-pointer shadow-[0_0_24px_rgba(0,240,255,0.22)]"
            >
              <img
                src={profile.avatarDataUrl || DEFAULT_AVATAR_SVG}
                alt="dronelogbook.app profil pilota"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-semibold text-cyan-300 transition-opacity">
                Uredi profil
              </span>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate font-['Outfit']">
                  {displayPilotName}
                </h1>
                {isCleanSlate ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-medium">
                    Spreman za unos
                  </span>
                ) : (
                  (profile.droneMake || profile.droneModel) && (
                    <span className="text-xs text-cyan-300/90 font-mono truncate">
                      · {profile.droneMake} {profile.droneModel}
                    </span>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-400 font-mono mt-1">
                <div className="truncate">
                  Pilot ID:{' '}
                  <span className="text-slate-200">
                    {profile.pilotId || 'Nije upisan'}
                  </span>
                </div>
                <div className="truncate">
                  Operater:{' '}
                  <span className="text-slate-200">
                    {profile.operatorId || 'Nije upisan'}
                  </span>
                </div>
              </div>

              {/* Active Drone S/N Input + Fleet Selector */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 min-w-[130px] flex-1">
                  <label
                    htmlFor="header-drone-sn"
                    className="text-xs text-slate-400 font-mono shrink-0"
                  >
                    S/N:
                  </label>
                  <input
                    id="header-drone-sn"
                    type="text"
                    value={profile.droneSn}
                    onChange={(e) => onUpdateDroneSn(e.target.value)}
                    placeholder="Upiši S/N drona..."
                    aria-label="Serijski broj aktivnog drona"
                    className="w-full min-w-[90px] max-w-[180px] bg-transparent border-b border-cyan-400/60 focus:border-cyan-300 text-xs font-mono text-cyan-300 placeholder-slate-500 py-0.5 focus:outline-none"
                  />
                </div>
                {fleet.length > 0 && (
                  <select
                    aria-label="Odaberi dron iz flote"
                    value={profile.droneSn}
                    onChange={(e) => onUpdateDroneSn(e.target.value)}
                    className="bg-[#0e182c] border border-slate-700 rounded-lg text-[11px] text-slate-200 px-2.5 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer shrink-0"
                  >
                    <option value="">Odaberi iz flote ({fleet.length})</option>
                    {fleet.map((d) => (
                      <option key={d.id} value={d.sn}>
                        {d.make} {d.model} ({d.sn})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Document Vault Quick-Access Buttons (Local File + Cloud Sync) */}
          <div className="grid grid-cols-3 gap-2.5 mt-4 relative z-10">
            {(
              [
                {
                  type: 'license' as PilotDocType,
                  label: 'Dozvola',
                  icon: CreditCard,
                  accent: 'text-cyan-400',
                },
                {
                  type: 'registration' as PilotDocType,
                  label: 'Registracija',
                  icon: FileText,
                  accent: 'text-sky-400',
                },
                {
                  type: 'insurance' as PilotDocType,
                  label: 'Osiguranje',
                  icon: ShieldCheck,
                  accent: 'text-fuchsia-400',
                },
              ] as const
            ).map((btn) => {
              const IconComp = btn.icon;
              const saved = hasDocSaved(btn.type);
              return (
                <button
                  key={btn.type}
                  type="button"
                  onClick={() => onOpenDocModal(btn.type)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    saved
                      ? 'bg-[#10203b] hover:bg-[#15294a] border-cyan-400/50 text-white shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                      : 'bg-[#0e172a] hover:bg-[#142038] border-slate-800 hover:border-cyan-500/40 text-slate-200'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${btn.accent} shrink-0`} />
                  <span>{btn.label}</span>
                  {saved && (
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                      aria-label="Dokument spremljen"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Telemetry HUD & Cloud Status Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0c1528] via-[#091020] to-[#070b16] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white tracking-wide uppercase font-['Outfit']">
                  dronelogbook<span className="text-cyan-400">.app</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Telemetrija letova · Globalna baza propisa (195 država)
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              PWA v2.0
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-auto">
            <div className="bg-[#070c18] border border-slate-800/90 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 whitespace-nowrap">
                <Plane className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Letovi</span>
              </div>
              <div className="text-xl font-bold font-mono text-white tabular-nums">
                {stats.totalFlights}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono tabular-nums truncate">
                Max: {stats.maxRadiusM}m
              </div>
            </div>

            <div className="bg-[#070c18] border border-slate-800/90 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Nalet</span>
              </div>
              <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums whitespace-nowrap">
                {stats.formattedTotalTime}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono tabular-nums truncate">
                Ø {stats.avgDurationMin} min
              </div>
            </div>

            <div className="bg-[#070c18] border border-slate-800/90 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 whitespace-nowrap">
                <Globe className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                <span>Države</span>
              </div>
              <div className="text-xl font-bold font-mono text-white tabular-nums">
                {rulesCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                Cijeli svijet
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">
              Pohrana:{' '}
              <strong className="text-cyan-300">
                {user ? 'Osobni Firebase Cloud' : 'Lokalni način (Clean Slate)'}
              </strong>
            </span>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold cursor-pointer shrink-0"
            >
              Flota ({fleet.length})
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
