import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ExternalLink,
  Save,
  Pencil,
  ShieldAlert,
  CheckCircle2,
  X,
  Plus,
  Globe,
  Radio,
  Luggage,
  Eye,
  ArrowUpFromLine,
  Building2,
  FileBadge,
} from 'lucide-react';
import {
  findCountryRule,
  normalizeSearchText,
  type CountryRuleEntry,
} from '../utils/logbookLogic';

interface RulesModuleProps {
  countryRules: CountryRuleEntry[];
  onSaveCountryRule: (
    rule: Omit<CountryRuleEntry, 'id' | 'ownerId'>
  ) => Promise<CountryRuleEntry>;
  onResetDefaultCountries?: () => void;
}

export const RulesModule: React.FC<RulesModuleProps> = ({
  countryRules,
  onSaveCountryRule,
}) => {
  const defaultCroatia =
    findCountryRule(countryRules, 'Hrvatska') || countryRules[0] || null;

  const [searchInput, setSearchInput] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedRule, setSelectedRule] = useState<CountryRuleEntry | null>(
    defaultCroatia
  );

  // Discrete inline/modal edit state — ONLY opened when clicking the Pencil icon (✏️)
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const [formCountry, setFormCountry] = useState<string>('');
  const [formCountryEn, setFormCountryEn] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formRegion, setFormRegion] = useState<string>('Europa');
  const [formStatus, setFormStatus] = useState<string>('Dozvoljeno (EASA pravila)');
  const [formRegulator, setFormRegulator] = useState<string>('');
  const [formEasa, setFormEasa] = useState<'Da' | 'Ne' | 'Djelomično'>('Da');
  const [formMaxHeight, setFormMaxHeight] = useState<string>('120 m');
  const [formVlos, setFormVlos] = useState<string>('Obavezan (VLOS)');
  const [formRegistration, setFormRegistration] = useState<string>('');
  const [formInsurance, setFormInsurance] = useState<string>('Obavezno');
  const [formRemoteId, setFormRemoteId] = useState<string>('');
  const [formAppLink, setFormAppLink] = useState<string>('');
  const [formCustomsInfo, setFormCustomsInfo] = useState<string>('');
  const [formProhibited, setFormProhibited] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(ev.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = countryRules.filter((r) => {
    const q = normalizeSearchText(searchInput);
    if (!q) return true;
    return (
      normalizeSearchText(r.country).includes(q) ||
      normalizeSearchText(r.countryEn || '').includes(q) ||
      normalizeSearchText(r.code || '').includes(q) ||
      normalizeSearchText(r.regulator).includes(q)
    );
  });

  const handleSelectCountry = (rule: CountryRuleEntry) => {
    setSelectedRule(rule);
    setSearchInput(rule.country);
    setIsDropdownOpen(false);
  };

  const openEditForRule = (rule: CountryRuleEntry) => {
    setFormCountry(rule.country);
    setFormCountryEn(rule.countryEn || '');
    setFormCode(rule.code || '');
    setFormRegion(rule.region || 'Europa');
    setFormStatus(rule.status || 'Dozvoljeno uz registraciju');
    setFormRegulator(rule.regulator);
    setFormEasa(rule.easa);
    setFormMaxHeight(rule.maxHeight);
    setFormVlos(rule.vlos || 'Obavezan (VLOS)');
    setFormRegistration(rule.registration || '');
    setFormInsurance(rule.insurance);
    setFormRemoteId(rule.remoteId || '');
    setFormAppLink(rule.appLink || rule.sourceText || '');
    setFormCustomsInfo(rule.customsInfo || '');
    setFormProhibited(rule.prohibited || '');
    setFormNotes(rule.notes || '');
    setIsEditingModalOpen(true);
  };

  const openAddNewCountry = () => {
    setFormCountry(searchInput.trim() || '');
    setFormCountryEn('');
    setFormCode('');
    setFormRegion('Europa');
    setFormStatus('Dozvoljeno uz registraciju');
    setFormRegulator('');
    setFormEasa('Da');
    setFormMaxHeight('120 m');
    setFormVlos('Obavezan (VLOS)');
    setFormRegistration('Obavezna za dronove >250g');
    setFormInsurance('Preporučeno');
    setFormRemoteId('Nije propisan');
    setFormAppLink('');
    setFormCustomsInfo('Slobodan unos za osobnu upotrebu.');
    setFormProhibited('');
    setFormNotes('');
    setIsEditingModalOpen(true);
  };

  const handleSaveRuleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCountry.trim()) return;

    const rawUrl = formAppLink.trim();
    const formattedUrl =
      rawUrl && !rawUrl.startsWith('http') && rawUrl.includes('.')
        ? `https://${rawUrl}`
        : rawUrl;

    const saved = await onSaveCountryRule({
      country: formCountry.trim(),
      countryEn: formCountryEn.trim() || formCountry.trim(),
      code: formCode.trim().toUpperCase(),
      region: formRegion.trim(),
      status: formStatus.trim(),
      safetyLevel: formStatus.toLowerCase().includes('zabrana')
        ? 'forbidden'
        : formStatus.toLowerCase().includes('uvjetno') ||
          formStatus.toLowerCase().includes('dozvola obavezna')
        ? 'caution'
        : 'allowed',
      regulator: formRegulator.trim() || 'Nacionalna zrakoplovna agencija',
      easa: formEasa,
      maxHeight: formMaxHeight.trim() || '120 m',
      vlos: formVlos.trim() || 'Obavezan (VLOS)',
      registration: formRegistration.trim(),
      insurance: formInsurance.trim() || 'Preporučeno',
      remoteId: formRemoteId.trim() || 'Nije propisan',
      appLink: formattedUrl,
      sourceText: rawUrl,
      customsInfo: formCustomsInfo.trim(),
      prohibited: formProhibited.trim(),
      notes: formNotes.trim(),
      instructions: formCustomsInfo.trim()
        ? `Carina i unos: ${formCustomsInfo.trim()}`
        : '',
      isCustom: true,
    });

    setSelectedRule(saved);
    setSearchInput(saved.country);
    setIsEditingModalOpen(false);
  };

  const getBadgeStyle = (rule: CountryRuleEntry) => {
    if (
      rule.safetyLevel === 'forbidden' ||
      (rule.status && rule.status.toLowerCase().includes('zabrana'))
    ) {
      return 'bg-rose-500/15 border-rose-500/50 text-rose-300';
    }
    if (
      rule.safetyLevel === 'caution' ||
      (rule.status &&
        (rule.status.toLowerCase().includes('uvjetno') ||
          rule.status.toLowerCase().includes('dozvola obavezna')))
    ) {
      return 'bg-amber-500/15 border-amber-500/50 text-amber-300';
    }
    return 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Search Bar ONLY — no horizontal pill clutter, no directory box */}
      <div
        ref={dropdownRef}
        className="relative bg-[#0b1324]/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val);
                setIsDropdownOpen(true);
                const exactMatch = findCountryRule(countryRules, val);
                if (exactMatch) {
                  setSelectedRule(exactMatch);
                }
              }}
              placeholder="Upiši državu (npr. Hrvatska, Grčka, Japan, Egipat...)"
              aria-label="Upiši državu"
              className="w-full pl-11 pr-9 py-3 rounded-xl bg-[#060a14] border border-cyan-500/40 focus:border-cyan-400 text-sm text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setIsDropdownOpen(true);
                }}
                aria-label="Očisti pretragu"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={openAddNewCountry}
            title="Dodaj novu državu ili vlastitu zonu"
            className="px-3.5 py-3 rounded-xl bg-[#111c33] hover:bg-[#172644] border border-slate-700/80 hover:border-cyan-400/50 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova država</span>
          </button>
        </div>

        {/* Clean Autocomplete Dropdown when typing or focused */}
        {isDropdownOpen && (
          <div className="absolute left-4 right-4 top-[calc(100%-4px)] z-30 mt-1 max-h-72 overflow-y-auto rounded-2xl bg-[#080e1c] border border-cyan-500/40 shadow-2xl divide-y divide-slate-800/70">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-between">
                <span>Država &ldquo;{searchInput}&rdquo; nije pronađena.</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    openAddNewCountry();
                  }}
                  className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                >
                  + Dodaj u bazu
                </button>
              </div>
            ) : (
              filteredCountries.slice(0, 35).map((item) => {
                const isCurrent = selectedRule?.country === item.country;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectCountry(item)}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-500/15 text-cyan-300'
                        : 'hover:bg-[#111c33] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 shrink-0">
                        {item.code || 'UAS'}
                      </span>
                      <span className="text-sm font-semibold truncate">
                        {item.country}
                      </span>
                      {item.countryEn && item.countryEn !== item.country && (
                        <span className="text-xs text-slate-400 truncate hidden sm:inline">
                          ({item.countryEn})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 truncate max-w-[180px] shrink-0">
                      {item.status || item.maxHeight}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected Country Card with Discrete Pencil Edit Icon in Header */}
      {selectedRule ? (
        <article className="bg-gradient-to-b from-[#0d1629] to-[#080e1a] border border-cyan-500/35 rounded-2xl p-5 sm:p-6 shadow-[0_16px_48px_rgba(0,240,255,0.06)] space-y-5">
          {/* Card Header: Country Title, Status Badge & Discrete Pencil Icon (✏️) */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/90 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                {selectedRule.code && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/40 text-xs font-mono font-bold text-cyan-300">
                    {selectedRule.code}
                  </span>
                )}
                <h2 className="text-2xl font-bold text-white tracking-tight font-['Outfit']">
                  {selectedRule.country}
                </h2>
                {selectedRule.countryEn && (
                  <span className="text-sm text-slate-400 font-normal">
                    / {selectedRule.countryEn}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  {selectedRule.region || 'Globalna baza (195 država)'}
                </span>
                <span>·</span>
                <span>
                  EASA sustav:{' '}
                  <strong className="text-slate-200">{selectedRule.easa}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span
                className={`px-3 py-1 rounded-xl border text-xs font-semibold tracking-wide ${getBadgeStyle(
                  selectedRule
                )}`}
              >
                {selectedRule.status || 'Dozvoljeno uz pravila'}
              </span>

              {/* Discrete Pencil Button requested by user */}
              <button
                type="button"
                onClick={() => openEditForRule(selectedRule)}
                aria-label={`Uredi pravila za državu ${selectedRule.country}`}
                title="Ručno izmijeni podatke (npr. web adresu ili napomenu)"
                className="w-9 h-9 rounded-xl bg-[#131f38] hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400 text-cyan-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Telemetry & Legal Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#070c17] border border-slate-800/90 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <ArrowUpFromLine className="w-3.5 h-3.5 text-cyan-400" />
                <span>Maksimalna visina</span>
              </div>
              <div className="text-base font-bold font-mono text-cyan-300 tabular-nums">
                {selectedRule.maxHeight}
              </div>
            </div>

            <div className="bg-[#070c17] border border-slate-800/90 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>Vizualni kontakt (VLOS)</span>
              </div>
              <div className="text-sm font-semibold text-slate-100">
                {selectedRule.vlos || 'Obavezan (VLOS)'}
              </div>
            </div>

            <div className="bg-[#070c17] border border-slate-800/90 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Radio className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Remote ID sustav</span>
              </div>
              <div className="text-sm font-semibold text-slate-100">
                {selectedRule.remoteId || 'Nije propisan'}
              </div>
            </div>
          </div>

          {/* Detailed Structured Rows */}
          <div className="bg-[#070c17]/90 border border-slate-800/80 rounded-xl p-4 space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 pb-2.5 border-b border-slate-800/60">
              <span className="sm:col-span-4 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Nadležno tijelo (Regulator):
              </span>
              <span className="sm:col-span-8 text-slate-100 font-medium">
                {selectedRule.regulator}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 pb-2.5 border-b border-slate-800/60">
              <span className="sm:col-span-4 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <FileBadge className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                Registracija drona / pilota:
              </span>
              <span className="sm:col-span-8 text-slate-100">
                {selectedRule.registration || 'Prema nacionalnom pravilniku'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 pb-2.5 border-b border-slate-800/60">
              <span className="sm:col-span-4 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Osiguranje od odgovornosti:
              </span>
              <span className="sm:col-span-8 text-slate-100">
                {selectedRule.insurance}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 items-center">
              <span className="sm:col-span-4 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Službeni izvor / Portal:
              </span>
              <div className="sm:col-span-8 flex items-center justify-between gap-2">
                {selectedRule.appLink ? (
                  <a
                    href={selectedRule.appLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-1.5 font-mono text-xs break-all"
                  >
                    <span>{selectedRule.sourceText || selectedRule.appLink}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-slate-500 text-xs">Nije navedeno</span>
                )}
                <button
                  type="button"
                  onClick={() => openEditForRule(selectedRule)}
                  className="text-[11px] text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Izmijeni</span>
                </button>
              </div>
            </div>
          </div>

          {/* Customs / Border Entry Notice */}
          {selectedRule.customsInfo && (
            <div
              className={`rounded-xl p-4 border flex items-start gap-3 ${
                selectedRule.customsInfo.toLowerCase().includes('plijeni') ||
                selectedRule.customsInfo.toLowerCase().includes('oduzima') ||
                selectedRule.customsInfo.toLowerCase().includes('zabranjen')
                  ? 'bg-rose-950/35 border-rose-500/40 text-rose-200'
                  : 'bg-sky-950/30 border-sky-500/35 text-sky-100'
              }`}
            >
              <Luggage className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block font-semibold text-white mb-0.5">
                  Carina i unos drona preko granice:
                </strong>
                <span>{selectedRule.customsInfo}</span>
              </div>
            </div>
          )}

          {/* Short Rules & Operational Restrictions */}
          <div className="bg-[#070c17] border border-slate-800/90 rounded-xl p-4 space-y-2">
            <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              Kratka pravila i ograničenja u zračnom prostoru
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedRule.notes || selectedRule.prohibited}
            </p>
          </div>
        </article>
      ) : (
        <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-8 text-center">
          <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm text-slate-200">
            Upišite naziv države u polje za pretragu iznad.
          </p>
        </div>
      )}

      {/* Modal for Editing or Adding a Country (Triggered ONLY via Pencil icon or + Nova država) */}
      {isEditingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Uredi pravila za ${formCountry || 'državu'}`}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#0b1324] border border-cyan-500/40 rounded-2xl w-full max-w-xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  {formCountry
                    ? `Uredi pravila: ${formCountry}`
                    : 'Dodaj novu državu u bazu'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                aria-label="Zatvori uređivanje"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRuleForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 mb-1">
                    Naziv države (HR)
                  </label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">ISO Kod</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="HR"
                    maxLength={4}
                    className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 font-mono text-cyan-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">
                    Status letenja
                  </label>
                  <input
                    type="text"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">
                    Nadležno tijelo (Regulator)
                  </label>
                  <input
                    type="text"
                    value={formRegulator}
                    onChange={(e) => setFormRegulator(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">
                    Max visina
                  </label>
                  <input
                    type="text"
                    value={formMaxHeight}
                    onChange={(e) => setFormMaxHeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 font-mono text-cyan-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">VLOS</label>
                  <input
                    type="text"
                    value={formVlos}
                    onChange={(e) => setFormVlos(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Remote ID</label>
                  <input
                    type="text"
                    value={formRemoteId}
                    onChange={(e) => setFormRemoteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">
                    Registracija
                  </label>
                  <input
                    type="text"
                    value={formRegistration}
                    onChange={(e) => setFormRegistration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">
                    Osiguranje
                  </label>
                  <input
                    type="text"
                    value={formInsurance}
                    onChange={(e) => setFormInsurance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">
                  Službena web adresa / portal (URL)
                </label>
                <input
                  type="text"
                  value={formAppLink}
                  onChange={(e) => setFormAppLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 font-mono text-cyan-300"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">
                  Carina i unos drona
                </label>
                <input
                  type="text"
                  value={formCustomsInfo}
                  onChange={(e) => setFormCustomsInfo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">
                  Kratka pravila i napomene
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-slate-700 focus:border-cyan-400 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-[#050811] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Spremi izmjene</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
