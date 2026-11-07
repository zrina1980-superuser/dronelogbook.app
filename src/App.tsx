/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useState } from 'react';
import { useLogbookStore } from './hooks/useLogbookStore';
import { PilotHeader } from './components/PilotHeader';
import { NewFlightModule } from './components/NewFlightModule';
import { ServiceModule } from './components/ServiceModule';
import { FlightLogModule } from './components/FlightLogModule';
import { RulesModule } from './components/RulesModule';
import {
  ProfileModal,
  DisclaimerModal,
  DocumentPreviewModal,
} from './components/Modals';
import type { PilotDocType } from './utils/logbookLogic';

type ActiveTab = 'NOVI_LET' | 'SERVIS' | 'LOG' | 'PRAVILA';

export default function App() {
  const store = useLogbookStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('NOVI_LET');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [activeDocModal, setActiveDocModal] = useState<PilotDocType | null>(
    null
  );

  const tabs: { id: ActiveTab; label: string; count?: number }[] = [
    { id: 'NOVI_LET', label: 'NOVI LET' },
    { id: 'SERVIS', label: 'SERVIS', count: store.maintenance.length },
    { id: 'LOG', label: 'LOG', count: store.flights.length },
    { id: 'PRAVILA', label: 'PRAVILA', count: store.countryRules.length },
  ];

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col">
      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 flex-1">
        {/* Pilot Profile & Telemetry Header */}
        <PilotHeader
          profile={store.profile}
          pilotDocs={store.pilotDocs}
          fleet={store.fleet}
          flights={store.flights}
          rulesCount={store.countryRules.length}
          isOnline={store.isOnline}
          isSyncing={store.isSyncing}
          lastSyncText={store.lastSyncText}
          user={store.user}
          onSyncNow={store.syncNow}
          onOpenSettings={() => setIsProfileModalOpen(true)}
          onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
          onOpenDocModal={(docType) => setActiveDocModal(docType)}
          onUpdateDroneSn={store.updateActiveDroneSn}
          onSignInGoogle={store.signInWithGoogle}
          onSignOut={store.signOutUser}
        />

        {/* 4-Module Segmented Navigation Bar */}
        <nav
          aria-label="Glavna navigacija modula"
          className="grid grid-cols-4 gap-2 sm:gap-3 mb-6"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-300 text-[#050811] shadow-[0_0_24px_rgba(0,240,255,0.3)]'
                    : 'bg-[#0b1324] hover:bg-[#111d36] text-slate-200 border border-slate-800/90 hover:border-cyan-500/40'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`hidden sm:inline font-mono text-[11px] tabular-nums ${
                      isActive ? 'text-[#050811]/80' : 'text-cyan-300/80'
                    }`}
                  >
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Module Viewport */}
        <main>
          {activeTab === 'NOVI_LET' && (
            <NewFlightModule
              profile={store.profile}
              onSaveFlight={store.addFlight}
              onNavigateToLog={() => setActiveTab('LOG')}
            />
          )}

          {activeTab === 'SERVIS' && (
            <ServiceModule
              profile={store.profile}
              fleet={store.fleet}
              maintenance={store.maintenance}
              onAddMaintenance={store.addMaintenance}
              onUpdateMaintenance={store.updateMaintenance}
              onDeleteMaintenance={store.deleteMaintenance}
            />
          )}

          {activeTab === 'LOG' && (
            <FlightLogModule
              flights={store.flights}
              fleet={store.fleet}
              onUpdateFlight={store.updateFlight}
              onDeleteFlight={store.deleteFlight}
              onNavigateToNewFlight={() => setActiveTab('NOVI_LET')}
            />
          )}

          {activeTab === 'PRAVILA' && (
            <RulesModule
              countryRules={store.countryRules}
              onSaveCountryRule={store.saveCountryRule}
              onResetDefaultCountries={store.resetDefaultCountries}
            />
          )}
        </main>
      </div>

      {/* Subtle Footer with Contact & About Trigger */}
      <footer className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 py-4 border-t border-slate-900 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <img
            src="/dronelogbookapp.png"
            alt="dronelogbook.app"
            className="w-6 h-6 rounded-md border border-cyan-400/40 object-cover"
          />
          <span>
            <strong>dronelogbook.app</strong> · Standalone PWA · Globalna baza propisa (195 država)
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsDisclaimerOpen(true)}
            className="hover:text-cyan-300 cursor-pointer"
          >
            O aplikaciji, Kolačići i Disclaimer
          </button>
          <a
            href="mailto:drone@zrina.app"
            className="text-cyan-400 hover:underline font-mono"
          >
            drone@zrina.app
          </a>
          <a
            href="https://zrina.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fuchsia-400 hover:underline font-mono"
          >
            zrina.app
          </a>
        </div>
      </footer>

      {/* Offline Connectivity Banner (PWA requirement) */}
      {!store.isOnline && (
        <div
          role="status"
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-amber-500/95 px-3.5 py-2 text-xs font-bold text-[#050811] shadow-xl"
        >
          <span className="h-2 w-2 rounded-full bg-[#050811] animate-pulse" />
          <span>Offline način rada — koriste se lokalno spremljeni podaci</span>
        </div>
      )}

      {/* Non-intrusive Toast Notification */}
      {store.statusToast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#0b1324] border border-cyan-400/60 text-xs font-medium text-cyan-200 shadow-2xl pointer-events-none whitespace-nowrap"
        >
          {store.statusToast.message}
        </div>
      )}

      {/* Modals */}
      {isProfileModalOpen && (
        <ProfileModal
          profile={store.profile}
          fleet={store.fleet}
          onSave={store.savePilotProfile}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {isDisclaimerOpen && (
        <DisclaimerModal onClose={() => setIsDisclaimerOpen(false)} />
      )}

      {activeDocModal && (
        <DocumentPreviewModal
          docType={activeDocModal}
          profile={store.profile}
          pilotDoc={store.pilotDocs[activeDocModal]}
          user={store.user}
          onSaveDocument={store.savePilotDocument}
          onRemoveDocument={store.removePilotDocument}
          onSignInGoogle={store.signInWithGoogle}
          onClose={() => setActiveDocModal(null)}
        />
      )}
    </div>
  );
}
