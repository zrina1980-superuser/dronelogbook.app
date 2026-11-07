export interface PilotProfileData {
  uid: string;
  pilotName: string;
  pilotId: string;
  operatorId: string;
  droneSn: string;
  droneMake: string;
  droneModel: string;
  avatarDataUrl: string;
  licenseUrl: string;
  registrationUrl: string;
  insuranceUrl: string;
  UpdatedAtIso?: string;
}

export type PilotDocType = 'license' | 'registration' | 'insurance';

export interface PilotDocumentData {
  docType: PilotDocType;
  fileName: string;
  mimeType: string;
  fileDataUrl: string; // Base64 Data URL of local PDF or Image
  externalUrl: string;
  docNumber?: string;
  validUntil?: string;
  updatedAtMs: number;
  synced?: boolean;
}

export interface DroneAsset {
  id: string;
  make: string;
  model: string;
  sn: string;
  weightClass: string;
}

export interface FlightEntry {
  id: string;
  ownerId: string;
  location: string;
  latitude?: number;
  longitude?: number;
  takeoffTime: string; // ISO 'YYYY-MM-DDTHH:mm'
  landingTime: string; // ISO 'YYYY-MM-DDTHH:mm'
  durationMin: number;
  radiusM: number;
  droneSn: string;
  droneMake: string;
  droneModel: string;
  checklistCompleted: boolean;
  notes: string;
  synced?: boolean;
  createdAtMs: number;
}

export interface MaintenanceEntry {
  id: string;
  ownerId: string;
  serviceDate: string; // 'YYYY-MM-DD'
  category: string;
  droneSn: string;
  description: string;
  synced?: boolean;
  createdAtMs: number;
}

export interface CountryRuleEntry {
  id: string;
  ownerId: string;
  country: string;
  countryEn?: string;
  code?: string;
  region?: string;
  status?: string;
  safetyLevel?: 'allowed' | 'restricted' | 'banned';
  regulator: string;
  easa: 'Da' | 'Ne' | 'Djelomično';
  maxHeight: string;
  vlos?: string;
  registration?: string;
  insurance: string;
  remoteId?: string;
  appLink: string;
  sourceText?: string;
  customsInfo?: string;
  prohibited: string;
  notes: string;
  instructions: string;
  isCustom?: boolean;
}

export const BLUEPRINT_LIMITS = {
  idMax: 128,
  idRegex: /^[a-zA-Z0-9_-]+$/,
  pilotNameMax: 100,
  pilotIdMax: 80,
  operatorIdMax: 80,
  droneSnMax: 80,
  droneMakeMax: 80,
  droneModelMax: 80,
  avatarMax: 250000,
  docFileNameMax: 200,
  docMimeMax: 100,
  docDataUrlMax: 600000,
  docNumberMax: 80,
  validUntilMax: 40,
  urlMax: 500,
  locationMax: 300,
  timeMax: 64,
  radiusMin: 100,
  radiusMax: 2000,
  durationMax: 1440,
  notesMax: 1000,
  serviceDateMax: 40,
  categoryMax: 60,
  countryMax: 100,
  regulatorMax: 120,
  easaAllowed: ['Da', 'Ne', 'Djelomično'] as const,
  maxHeightMax: 60,
  insuranceMax: 120,
  prohibitedMax: 600,
  ruleNotesMax: 1500,
  instructionsMax: 2000,
};

/**
 * Normalizes Croatian diacritics and case for smart search & upsert matching.
 */
export function normalizeSearchText(input: string): string {
  return (input || '')
    .trim()
    .toLowerCase()
    .replace(/č/g, 'c')
    .replace(/ć/g, 'c')
    .replace(/ž/g, 'z')
    .replace(/š/g, 's')
    .replace(/đ/g, 'd');
}

/**
 * Calculates flight duration in minutes from takeoff and landing timestamps.
 * Returns null if timestamps are invalid or landing is before takeoff.
 */
export function calculateDurationMin(takeoffTime: string, landingTime: string): number | null {
  if (!takeoffTime || !landingTime) return null;
  const startMs = Date.parse(takeoffTime);
  const endMs = Date.parse(landingTime);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  const diffMin = Math.round((endMs - startMs) / 60000);
  if (diffMin < 0 || diffMin > BLUEPRINT_LIMITS.durationMax) return null;
  return diffMin;
}

/**
 * Formats an ISO datetime string ('2026-10-26T14:41') into Croatian display format ('26.10.2026. 14:41').
 */
export function formatCroatianDateTime(isoOrText: string): string {
  if (!isoOrText) return '';
  const date = new Date(isoOrText);
  if (Number.isNaN(date.getTime())) return isoOrText;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy}. ${hh}:${min}`;
}

/**
 * Formats an ISO date string ('2026-04-12') into Croatian date format ('12.04.2026.').
 */
export function formatCroatianDate(isoDate: string): string {
  if (!isoDate) return '';
  if (/^\d{2}\.\d{2}\.\d{4}\.?$/.test(isoDate.trim())) {
    return isoDate.trim().endsWith('.') ? isoDate.trim() : `${isoDate.trim()}.`;
  }
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}.`;
  }
  return isoDate;
}

/**
 * Extracts decimal coordinates if present in a location string (e.g., "45.82075, 16.01811 – Maksimir").
 */
export function parseCoordinatesFromLocation(locationText: string): { lat: number; lng: number } | null {
  if (!locationText) return null;
  const match = locationText.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;
  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return { lat, lng };
}

/**
 * Formats coordinates and an optional place name into a clean location string.
 */
export function formatLocationWithCoords(lat: number, lng: number, placeName?: string): string {
  const coords = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const cleanPlace = (placeName || '').trim();
  const combined = cleanPlace ? `${coords} – ${cleanPlace}` : coords;
  return combined.slice(0, BLUEPRINT_LIMITS.locationMax);
}

/**
 * Validates new flight form inputs before saving.
 */
export function validateFlightInput(input: {
  location: string;
  takeoffTime: string;
  landingTime: string;
  radiusM: number;
  checklistCompleted: boolean;
}): { valid: boolean; error?: string; durationMin?: number } {
  const loc = (input.location || '').trim();
  if (!loc) {
    return { valid: false, error: 'Unesite lokaciju polijetanja ili odaberite točku na karti.' };
  }
  if (loc.length > BLUEPRINT_LIMITS.locationMax) {
    return { valid: false, error: `Lokacija ne smije biti duža od ${BLUEPRINT_LIMITS.locationMax} znakova.` };
  }
  const durationMin = calculateDurationMin(input.takeoffTime, input.landingTime);
  if (durationMin === null) {
    return { valid: false, error: 'Vrijeme slijetanja mora biti nakon vremena polijetanja (unutar 24h).' };
  }
  if (input.radiusM < BLUEPRINT_LIMITS.radiusMin || input.radiusM > BLUEPRINT_LIMITS.radiusMax) {
    return { valid: false, error: `Radijus leta mora biti između ${BLUEPRINT_LIMITS.radiusMin}m i ${BLUEPRINT_LIMITS.radiusMax}m.` };
  }
  if (!input.checklistCompleted) {
    return { valid: false, error: 'Potvrdite da je prijeletna checklista obavljena prije spremanja leta.' };
  }
  return { valid: true, durationMin };
}

/**
 * Computes aggregate flight statistics for the LOG dashboard.
 */
export function computeFlightAnalytics(flights: FlightEntry[]) {
  const totalFlights = flights.length;
  const totalMinutes = flights.reduce((sum, f) => sum + (Number.isFinite(f.durationMin) ? f.durationMin : 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const formattedTotalTime = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  const avgDurationMin = totalFlights > 0 ? Math.round(totalMinutes / totalFlights) : 0;
  const maxRadiusM = flights.reduce((max, f) => Math.max(max, f.radiusM || 0), 0);
  const uniqueDrones = Array.from(new Set(flights.map((f) => f.droneSn).filter(Boolean))).length;

  return {
    totalFlights,
    totalMinutes,
    formattedTotalTime,
    avgDurationMin,
    maxRadiusM,
    uniqueDrones,
  };
}

/**
 * Finds an existing country rule case-insensitively and diacritic-insensitively (matches HR name, EN name, or ISO code).
 */
export function findCountryRule(rules: CountryRuleEntry[], countryName: string): CountryRuleEntry | undefined {
  const target = normalizeSearchText(countryName);
  if (!target) return undefined;
  return rules.find(
    (r) =>
      normalizeSearchText(r.country) === target ||
      (r.countryEn && normalizeSearchText(r.countryEn) === target) ||
      (r.code && normalizeSearchText(r.code) === target)
  );
}

/**
 * Smart Upsert for Country Rules: updates in place if country already exists, or prepends if new.
 */
export function upsertCountryRuleList(
  rules: CountryRuleEntry[],
  incomingRule: Omit<CountryRuleEntry, 'id'> & { id?: string }
): { updatedRules: CountryRuleEntry[]; isUpdate: boolean; savedRule: CountryRuleEntry } {
  const existingIndex = rules.findIndex(
    (r) => normalizeSearchText(r.country) === normalizeSearchText(incomingRule.country)
  );

  if (existingIndex >= 0) {
    const existing = rules[existingIndex];
    const savedRule: CountryRuleEntry = {
      ...existing,
      ...incomingRule,
      id: existing.id,
      country: incomingRule.country.trim().slice(0, BLUEPRINT_LIMITS.countryMax),
      isCustom: true,
    };
    const updatedRules = [...rules];
    updatedRules[existingIndex] = savedRule;
    return { updatedRules, isUpdate: true, savedRule };
  }

  const slug = normalizeSearchText(incomingRule.country).replace(/[^a-z0-9]+/g, '-') || 'country';
  const savedRule: CountryRuleEntry = {
    ...incomingRule,
    id: incomingRule.id || `rule-${slug}-${Date.now()}`,
    country: incomingRule.country.trim().slice(0, BLUEPRINT_LIMITS.countryMax),
    isCustom: true,
  };
  return {
    updatedRules: [savedRule, ...rules],
    isUpdate: false,
    savedRule,
  };
}

/**
 * Sanitizes outgoing flight payload to strictly adhere to firebase-blueprint.json limits.
 */
export function sanitizeFlightPayload(entry: FlightEntry, uid: string) {
  const base: Record<string, unknown> = {
    ownerId: uid.slice(0, BLUEPRINT_LIMITS.idMax),
    location: entry.location.trim().slice(0, BLUEPRINT_LIMITS.locationMax) || 'Nepoznata lokacija',
    takeoffTime: entry.takeoffTime.slice(0, BLUEPRINT_LIMITS.timeMax),
    landingTime: entry.landingTime.slice(0, BLUEPRINT_LIMITS.timeMax),
    durationMin: Math.max(0, Math.min(BLUEPRINT_LIMITS.durationMax, Math.round(entry.durationMin))),
    radiusM: Math.max(50, Math.min(5000, Math.round(entry.radiusM))),
    droneSn: (entry.droneSn || '').trim().slice(0, BLUEPRINT_LIMITS.droneSnMax),
    droneMake: (entry.droneMake || '').trim().slice(0, BLUEPRINT_LIMITS.droneMakeMax),
    droneModel: (entry.droneModel || '').trim().slice(0, BLUEPRINT_LIMITS.droneModelMax),
    checklistCompleted: Boolean(entry.checklistCompleted),
    notes: (entry.notes || '').trim().slice(0, BLUEPRINT_LIMITS.notesMax),
  };

  if (typeof entry.latitude === 'number' && !Number.isNaN(entry.latitude) && entry.latitude >= -90 && entry.latitude <= 90) {
    base.latitude = entry.latitude;
  }
  if (typeof entry.longitude === 'number' && !Number.isNaN(entry.longitude) && entry.longitude >= -180 && entry.longitude <= 180) {
    base.longitude = entry.longitude;
  }

  return base;
}

/**
 * Generates CSV string for exporting flight logs.
 */
export function generateFlightsCsv(flights: FlightEntry[]): string {
  const headers = [
    'Polijetanje',
    'Slijetanje',
    'Trajanje (min)',
    'Lokacija',
    'Radius (m)',
    'Proizvodac',
    'Model',
    'S/N Drona',
    'Checklista',
    'Napomene',
  ];
  const escapeCsv = (val: string | number | boolean) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };
  const rows = flights.map((f) =>
    [
      formatCroatianDateTime(f.takeoffTime),
      formatCroatianDateTime(f.landingTime),
      f.durationMin,
      f.location,
      f.radiusM,
      f.droneMake,
      f.droneModel,
      f.droneSn,
      f.checklistCompleted ? 'DA' : 'NE',
      f.notes,
    ]
      .map(escapeCsv)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}
