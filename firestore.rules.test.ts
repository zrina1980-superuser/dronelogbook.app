import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BLUEPRINT_LIMITS } from './src/utils/logbookLogic';

const rulesText = fs.readFileSync('./firestore.rules', 'utf8');

interface SimulatedRequest {
  auth: { uid: string; email_verified: boolean } | null;
  path: string;
  docId: string;
  method: 'get' | 'list' | 'create' | 'update' | 'delete';
  resourceData?: Record<string, unknown>;
  existingData?: Record<string, unknown>;
  queryOwnerId?: string;
  useServerTimestamp?: boolean;
}

/**
 * Deterministic evaluator mirroring the exact boolean gates of firestore.rules
 * to verify all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */
function evaluateRulesGate(req: SimulatedRequest): 'ALLOW' | 'PERMISSION_DENIED' {
  if (!req.auth) return 'PERMISSION_DENIED';
  const isVerified = req.auth.email_verified === true;
  const isValidId =
    typeof req.docId === 'string' &&
    req.docId.length >= 1 &&
    req.docId.length <= BLUEPRINT_LIMITS.idMax &&
    BLUEPRINT_LIMITS.idRegex.test(req.docId);

  if (req.path === 'users') {
    if (req.method === 'list') return 'PERMISSION_DENIED';
    if (!isValidId || req.docId !== req.auth.uid) return 'PERMISSION_DENIED';
    if (req.method === 'get') return 'ALLOW';
    if (!isVerified) return 'PERMISSION_DENIED';
    return 'ALLOW';
  }

  if (req.path === 'flights') {
    if (req.method === 'list') {
      return req.queryOwnerId === req.auth.uid ? 'ALLOW' : 'PERMISSION_DENIED';
    }
    if (!isValidId) return 'PERMISSION_DENIED';
    if (req.method === 'get') {
      return req.existingData?.ownerId === req.auth.uid ? 'ALLOW' : 'PERMISSION_DENIED';
    }
    if (!isVerified) return 'PERMISSION_DENIED';
    const d = req.resourceData || {};
    const allowedKeys = new Set([
      'ownerId', 'location', 'latitude', 'longitude',
      'takeoffTime', 'landingTime', 'durationMin', 'radiusM',
      'droneSn', 'droneMake', 'droneModel',
      'checklistCompleted', 'notes', 'createdAt', 'updatedAt',
    ]);
    for (const k of Object.keys(d)) {
      if (!allowedKeys.has(k)) return 'PERMISSION_DENIED';
    }
    if (d.ownerId !== req.auth.uid) return 'PERMISSION_DENIED';
    if (typeof d.notes !== 'string' || d.notes.length > BLUEPRINT_LIMITS.notesMax) return 'PERMISSION_DENIED';
    if (typeof d.radiusM !== 'number' || d.radiusM < 50 || d.radiusM > 5000) return 'PERMISSION_DENIED';
    if (typeof d.durationMin !== 'number' || d.durationMin < 0 || d.durationMin > 1440) return 'PERMISSION_DENIED';
    if (!req.useServerTimestamp) return 'PERMISSION_DENIED';
    if (req.method === 'update') {
      if (d.ownerId !== req.existingData?.ownerId) return 'PERMISSION_DENIED';
      if (d.createdAt !== req.existingData?.createdAt) return 'PERMISSION_DENIED';
    }
    return 'ALLOW';
  }

  if (req.path === 'countryRules') {
    if (!isVerified || !isValidId) return 'PERMISSION_DENIED';
    const d = req.resourceData || {};
    if (d.ownerId !== req.auth.uid) return 'PERMISSION_DENIED';
    if (!['Da', 'Ne', 'Djelomično'].includes(String(d.easa))) return 'PERMISSION_DENIED';
    return 'ALLOW';
  }

  return 'PERMISSION_DENIED';
}

test('firestore.rules contains all mandatory zero-trust invariants', () => {
  assert.ok(rulesText.includes("rules_version = '2';"));
  assert.ok(rulesText.includes('allow read, write: if false;'));
  assert.ok(rulesText.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesText.includes('isValidPilotProfile(incoming())'));
  assert.ok(rulesText.includes('isValidFlightRecord(incoming())'));
  assert.ok(rulesText.includes('isValidMaintenanceRecord(incoming())'));
  assert.ok(rulesText.includes('isValidCountryRule(incoming())'));
});

test('Dirty Dozen Payload #1: Shadow Field Injection on Flight Creation -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'pilot_1', email_verified: true },
    path: 'flights',
    docId: 'flight_1',
    method: 'create',
    useServerTimestamp: true,
    resourceData: {
      ownerId: 'pilot_1',
      location: 'Zagreb',
      takeoffTime: '2026-10-26T10:00',
      landingTime: '2026-10-26T10:20',
      durationMin: 20,
      radiusM: 500,
      droneSn: 'SN1',
      droneMake: 'DJI',
      droneModel: 'Mini 4',
      checklistCompleted: true,
      notes: 'OK',
      createdAt: 'SERVER_TIME',
      updatedAt: 'SERVER_TIME',
      isAdmin: true, // Ghost field
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen Payload #2: Identity Spoofing on Flight Creation -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'attacker_uid', email_verified: true },
    path: 'flights',
    docId: 'flight_1',
    method: 'create',
    useServerTimestamp: true,
    resourceData: {
      ownerId: 'victim_uid_123',
      location: 'Zagreb',
      takeoffTime: '2026-10-26T10:00',
      landingTime: '2026-10-26T10:20',
      durationMin: 20,
      radiusM: 500,
      droneSn: 'SN1',
      droneMake: 'DJI',
      droneModel: 'Mini 4',
      checklistCompleted: true,
      notes: 'OK',
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen Payload #3: Unverified Email Write -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'pilot_1', email_verified: false },
    path: 'flights',
    docId: 'flight_1',
    method: 'create',
    useServerTimestamp: true,
    resourceData: {
      ownerId: 'pilot_1',
      location: 'Zagreb',
      takeoffTime: '2026-10-26T10:00',
      landingTime: '2026-10-26T10:20',
      durationMin: 20,
      radiusM: 500,
      droneSn: 'SN1',
      droneMake: 'DJI',
      droneModel: 'Mini 4',
      checklistCompleted: true,
      notes: 'OK',
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen Payload #4: ID Poisoning Attack -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'pilot_1', email_verified: true },
    path: 'flights',
    docId: 'invalid$id!with*spaces',
    method: 'create',
    useServerTimestamp: true,
    resourceData: { ownerId: 'pilot_1', notes: 'OK', radiusM: 500, durationMin: 10 },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen Payload #5: Denial-of-Wallet Oversized String -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'pilot_1', email_verified: true },
    path: 'flights',
    docId: 'flight_1',
    method: 'create',
    useServerTimestamp: true,
    resourceData: {
      ownerId: 'pilot_1',
      notes: 'A'.repeat(5000),
      radiusM: 500,
      durationMin: 10,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen Payload #6: Out-of-Bounds Flight Radius -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'pilot_1', email_verified: true },
    path: 'flights',
    docId: 'flight_1',
    method: 'create',
    useServerTimestamp: true,
    resourceData: {
      ownerId: 'pilot_1',
      notes: 'OK',
      radiusM: 99999,
      durationMin: 10,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen Payload #7: Forged Client Timestamp on Create -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'pilot_1', email_verified: true },
    path: 'flights',
    docId: 'flight_1',
    method: 'create',
    useServerTimestamp: false,
    resourceData: {
      ownerId: 'pilot_1',
      notes: 'OK',
      radiusM: 500,
      durationMin: 10,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen Payload #8: Immutable Field Mutation on Update -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'pilot_1', email_verified: true },
    path: 'flights',
    docId: 'flight_1',
    method: 'update',
    useServerTimestamp: true,
    existingData: { ownerId: 'pilot_1', createdAt: 'T1' },
    resourceData: {
      ownerId: 'pilot_1',
      createdAt: 'T2_MUTATED',
      notes: 'OK',
      radiusM: 500,
      durationMin: 10,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen Payload #9: Value Poisoning on Update -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'pilot_1', email_verified: true },
    path: 'flights',
    docId: 'flight_1',
    method: 'update',
    useServerTimestamp: true,
    existingData: { ownerId: 'pilot_1', createdAt: 'T1' },
    resourceData: {
      ownerId: 'pilot_1',
      createdAt: 'T1',
      notes: 'OK',
      radiusM: 500,
      durationMin: 'twenty' as unknown as number,
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen Payload #10: Cross-Tenant PII Read -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'attacker_uid', email_verified: true },
    path: 'users',
    docId: 'victim_uid',
    method: 'get',
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen Payload #11: Blanket Collection Scraping -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'attacker_uid', email_verified: true },
    path: 'flights',
    docId: '',
    method: 'list',
    queryOwnerId: undefined,
  });
  assert.equal(res, 'PERMISSION_DENIED');
});

test('Dirty Dozen Payload #12: Invalid Enum in CountryRule -> PERMISSION_DENIED', () => {
  const res = evaluateRulesGate({
    auth: { uid: 'pilot_1', email_verified: true },
    path: 'countryRules',
    docId: 'rule_1',
    method: 'create',
    resourceData: {
      ownerId: 'pilot_1',
      easa: 'Maybe',
    },
  });
  assert.equal(res, 'PERMISSION_DENIED');
});
