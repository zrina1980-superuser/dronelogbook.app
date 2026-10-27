import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  Smartphone,
  Monitor,
  Share2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Automatically suppress when running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="Instaliraj dronelogbook.app PWA aplikaciju"
        title="Instaliraj dronelogbook.app na početni zaslon ili računalo"
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-300 hover:from-cyan-300 hover:to-sky-300 text-[#050811] text-xs font-bold flex items-center gap-1.5 shadow-[0_0_18px_rgba(0,240,255,0.28)] transition-all cursor-pointer whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{isIOS ? 'Instaliraj na iOS' : 'Instaliraj App'}</span>
      </button>

      {showGuideModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Upute za instalaciju dronelogbook.app PWA aplikacije"
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-[#0b1324] border border-cyan-500/45 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/dronelogbookapp.png"
                    alt="dronelogbook.app ikona"
                    className="w-10 h-10 rounded-xl border border-cyan-400/50 object-cover"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white font-['Outfit']">
                      Instaliraj{' '}
                      <span className="text-cyan-400">dronelogbook.app</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Progressive Web App (PWA) · Puni zaslon &amp; Offline rad
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  aria-label="Zatvori upute za instalaciju"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isInstallable && (
                <div className="bg-cyan-950/35 border border-cyan-400/50 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="text-xs text-cyan-100">
                    <strong className="block text-white">
                      Izravna instalacija dostupna!
                    </strong>
                    Kliknite za trenutnu instalaciju aplikacije na vaš uređaj.
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await install();
                      if (ok) setShowGuideModal(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#050811] text-xs font-bold cursor-pointer shrink-0"
                  >
                    Instaliraj odmah
                  </button>
                </div>
              )}

              <div className="space-y-3 text-xs text-slate-300">
                {/* Android Guide */}
                <div className="bg-[#060a14] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm font-['Outfit']">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <h4>Android (Chrome / Brave / Samsung Internet)</h4>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                    <li>
                      Otvorite izbornik preglednika u gornjem desnom kutu (
                      <strong>⋮</strong>).
                    </li>
                    <li>
                      Odaberite <strong>&ldquo;Instaliraj aplikaciju&rdquo;</strong>{' '}
                      (<em>Install app</em>) ili{' '}
                      <strong>&ldquo;Dodaj na početni zaslon&rdquo;</strong>.
                    </li>
                    <li>
                      Potvrdite instalaciju — ikona{' '}
                      <strong>dronelogbook.app</strong> pojavit će se na vašem
                      zaslonu.
                    </li>
                  </ol>
                </div>

                {/* iOS Safari Guide */}
                <div className="bg-[#060a14] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-sky-300 font-bold text-sm font-['Outfit']">
                    <Share2 className="w-4 h-4 text-sky-400" />
                    <h4>iPhone i iPad (iOS Safari)</h4>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                    <li>
                      Dodirnite gumb <strong>Dijeli (Share)</strong> na dnu
                      Safari alatne trake.
                    </li>
                    <li>
                      Pomaknite se prema dolje i odaberite{' '}
                      <strong>&ldquo;Dodaj na početni zaslon&rdquo;</strong> (
                      <em>Add to Home Screen</em>).
                    </li>
                    <li>
                      Dodirnite <strong>Dodaj</strong> u gornjem desnom kutu.
                    </li>
                  </ol>
                </div>

                {/* Desktop Guide */}
                <div className="bg-[#060a14] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-fuchsia-300 font-bold text-sm font-['Outfit']">
                    <Monitor className="w-4 h-4 text-fuchsia-400" />
                    <h4>Računalo (Chrome / Edge Desktop)</h4>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Kliknite na ikonu zaslona s strelicom (
                    <strong>Instaliraj dronelogbook.app</strong>) na desnoj
                    strani adresne trake preglednika kako biste aplikaciju
                    pokretali u vlastitom prozoru.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Service Worker &amp; Offline predmemorija aktivni
                </span>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
                >
                  Zatvori
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
