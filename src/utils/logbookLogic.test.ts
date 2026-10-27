import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDurationMin,
  formatCroatianDateTime,
  parseCoordinatesFromLocation,
  formatLocationWithCoords,
  validateFlightInput,
  computeFlightAnalytics,
  findCountryRule,
  upsertCountryRuleList,
  sanitizeFlightPayload,
  generateFlightsCsv,
  type FlightEntry,
  type CountryRuleEntry,
} from './logbookLogic';

test('calculateDurationMin computes exact duration in minutes and rejects invalid ranges', () => {
  assert.equal(calculateDurationMin('2026-10-26T14:41', '2026-10-26T16:41'), 120);
  assert.equal(calculateDurationMin('2026-04-16T20:26', '2026-04-16T21:25'), 59);
  assert.equal(calculateDurationMin('2026-10-26T16:41', '2026-10-26T14:41'), null);
  assert.equal(calculateDurationMin('', '2026-10-26T14:41'), null);
});

test('parseCoordinatesFromLocation and formatLocationWithCoords handle GPS strings accurately', () => {
  const parsed = parseCoordinatesFromLocation('45.82075, 16.01811 – Gradska četvrt Maksimir, Grad Zagreb');
  assert.deepEqual(parsed, { lat: 45.82075, lng: 16.01811 });
  assert.equal(parseCoordinatesFromLocation('Jarun, Zagreb'), null);

  const formatted = formatLocationWithCoords(45.820751, 16.018112, 'Maksimir, Zagreb');
  assert.equal(formatted, '45.82075, 16.01811 – Maksimir, Zagreb');
});

test('validateFlightInput enforces required location, positive duration, radius bounds, and checklist', () => {
  const validResult = validateFlightInput({
    location: 'Jarun, Zagreb',
    takeoffTime: '2026-10-26T10:00',
    landingTime: '2026-10-26T10:25',
    radiusM: 500,
    checklistCompleted: true,
  });
  assert.equal(validResult.valid, true);
  assert.equal(validResult.durationMin, 25);

  const missingChecklist = validateFlightInput({
    location: 'Jarun, Zagreb',
    takeoffTime: '2026-10-26T10:00',
    landingTime: '2026-10-26T10:25',
    radiusM: 500,
    checklistCompleted: false,
  });
  assert.equal(missingChecklist.valid, false);

  const invalidRadius = validateFlightInput({
    location: 'Jarun, Zagreb',
    takeoffTime: '2026-10-26T10:00',
    landingTime: '2026-10-26T10:25',
    radiusM: 3500,
    checklistCompleted: true,
  });
  assert.equal(invalidRadius.valid, false);
});

test('computeFlightAnalytics aggregates flight count, hours/minutes, and max radius', () => {
  const sampleFlights: FlightEntry[] = [
    {
      id: 'f1',
      ownerId: 'u1',
      location: 'Maksimir',
      takeoffTime: '2026-10-26T14:41',
      landingTime: '2026-10-26T16:41',
      durationMin: 120,
      radiusM: 500,
      droneSn: 'SN-001',
      droneMake: 'DJI',
      droneModel: 'Mini 4 Pro',
      checklistCompleted: true,
      notes: 'Sve ok',
      createdAtMs: 1,
    },
    {
      id: 'f2',
      ownerId: 'u1',
      location: 'Trešnjevka',
      takeoffTime: '2026-04-16T20:26',
      landingTime: '2026-04-16T21:25',
      durationMin: 59,
      radiusM: 850,
      droneSn: 'SN-002',
      droneMake: 'DJI',
      droneModel: 'Air 3',
      checklistCompleted: true,
      notes: 'Mirno',
      createdAtMs: 2,
    },
  ];

  const stats = computeFlightAnalytics(sampleFlights);
  assert.equal(stats.totalFlights, 2);
  assert.equal(stats.totalMinutes, 179);
  assert.equal(stats.formattedTotalTime, '2h 59m');
  assert.equal(stats.maxRadiusM, 850);
  assert.equal(stats.uniqueDrones, 2);
});

test('findCountryRule and upsertCountryRuleList handle diacritic-insensitive lookup and smart upsert', () => {
  const initialRules: CountryRuleEntry[] = [
    {
      id: 'grcka',
      ownerId: 'system',
      country: 'Grčka',
      regulator: 'HCAA',
      easa: 'Da',
      maxHeight: '120m',
      insurance: 'Obavezno',
      appLink: 'https://dags.hasp.gov.gr/',
      prohibited: 'Akropola, arheološka nalazišta',
      notes: 'Po zakonu...',
      instructions: 'Registriraj se...',
    },
  ];

  assert.equal(findCountryRule(initialRules, 'grcka')?.regulator, 'HCAA');
  assert.equal(findCountryRule(initialRules, 'GRČKA')?.regulator, 'HCAA');

  // Update existing country
  const updateOutcome = upsertCountryRuleList(initialRules, {
    ownerId: 'u1',
    country: 'grčka',
    regulator: 'HCAA Greece',
    easa: 'Da',
    maxHeight: '120m',
    insurance: 'Obavezno za sve',
    appLink: 'https://dags.hasp.gov.gr/',
    prohibited: 'Akropola',
    notes: 'Ažurirana bilješka',
    instructions: 'Nove upute',
  });
  assert.equal(updateOutcome.isUpdate, true);
  assert.equal(updateOutcome.updatedRules.length, 1);
  assert.equal(updateOutcome.updatedRules[0].regulator, 'HCAA Greece');

  // Insert new country
  const insertOutcome = upsertCountryRuleList(updateOutcome.updatedRules, {
    ownerId: 'u1',
    country: 'Novi Zeland',
    regulator: 'CAA NZ',
    easa: 'Ne',
    maxHeight: '120m',
    insurance: 'Preporučeno',
    appLink: 'https://www.aviation.govt.nz/',
    prohibited: 'Nacionalni parkovi',
    notes: 'Part 101 pravila',
    instructions: 'Provjeri AirShare',
  });
  assert.equal(insertOutcome.isUpdate, false);
  assert.equal(insertOutcome.updatedRules.length, 2);
});

test('sanitizeFlightPayload and generateFlightsCsv produce valid, bounded output', () => {
  const flight: FlightEntry = {
    id: 'f1',
    ownerId: 'user_123',
    location: 'Jarun, Zagreb',
    latitude: 45.78,
    longitude: 15.92,
    takeoffTime: '2026-10-26T15:05',
    landingTime: '2026-10-26T15:25',
    durationMin: 20,
    radiusM: 500,
    droneSn: 'TEST-SN',
    droneMake: 'DJI',
    droneModel: 'Mini 4 Pro',
    checklistCompleted: true,
    notes: 'Sve u redu',
    createdAtMs: 100,
  };

  const payload = sanitizeFlightPayload(flight, 'user_123');
  assert.equal(payload.ownerId, 'user_123');
  assert.equal(payload.radiusM, 500);

  const csv = generateFlightsCsv([flight]);
  assert.ok(csv.includes('Polijetanje,Slijetanje'));
  assert.ok(csv.includes('"Jarun, Zagreb"'));
  assert.ok(csv.includes('"' + formatCroatianDateTime('2026-10-26T15:05') + '"'));
});

test('GLOBAL_195_COUNTRIES contains all 195 world countries and clean-slate defaults are empty', async () => {
  const {
    DEFAULT_COUNTRY_RULES,
    DEFAULT_PILOT_PROFILE,
    INITIAL_FLIGHTS,
    INITIAL_MAINTENANCE,
    DEFAULT_DRONE_FLEET,
  } = await import('../data/defaultCountries');

  assert.equal(DEFAULT_COUNTRY_RULES.length, 195);
  assert.equal(DEFAULT_PILOT_PROFILE.pilotName, '');
  assert.equal(DEFAULT_PILOT_PROFILE.pilotId, '');
  assert.equal(DEFAULT_PILOT_PROFILE.droneSn, '');
  assert.equal(INITIAL_FLIGHTS.length, 0);
  assert.equal(INITIAL_MAINTENANCE.length, 0);
  assert.equal(DEFAULT_DRONE_FLEET.length, 0);
  assert.equal(findCountryRule(DEFAULT_COUNTRY_RULES, 'Hrvatska')?.code, 'HR');
  assert.equal(findCountryRule(DEFAULT_COUNTRY_RULES, 'JP')?.country, 'Japan');
});

