# Security Specification — Drone Logbook Pro

## 1. Data Invariants

1. **Zero-Trust Default Deny**: Every path not explicitly matched in `/databases/{database}/documents` is strictly denied (`allow read, write: if false;`).
2. **Verified Identity Ownership**:
   - A `PilotProfile` at `/users/{userId}` can only be read, created, or updated by the authenticated, email-verified user whose `request.auth.uid == userId` and `data.uid == request.auth.uid`.
   - `FlightRecord` (`/flights/{flightId}`), `MaintenanceRecord` (`/maintenance/{maintenanceId}`), and `CountryRule` (`/countryRules/{ruleId}`) documents must have `ownerId == request.auth.uid` and can only be read, listed, created, updated, or deleted by that verified owner.
3. **Strict Key & Volumetric Boundaries**:
   - No shadow or undocumented fields are permitted (`hasAll` + `hasOnly` on create, `affectedKeys().hasOnly(...)` on update).
   - Every string field enforces exact `.size()` limits matching `firebase-blueprint.json`.
   - Document IDs must match `^[a-zA-Z0-9_\-]+$` with length `1..128`.
4. **Temporal & Ownership Immutability**:
   - `createdAt` and `updatedAt` must equal `request.time` on creation.
   - On update, `createdAt` and `ownerId` (or `uid`) are strictly immutable, and `updatedAt` must equal `request.time`.
5. **Query Enforcer (No Blanket Reads)**:
   - `/users/{userId}` forbids `list` queries entirely to prevent PII scraping.
   - `/flights`, `/maintenance`, and `/countryRules` enforce `resource.data.ownerId == request.auth.uid` on both `get` and `list`.

## 2. The "Dirty Dozen" Payloads

1. **Shadow Field Injection on Flight Creation**: Adding `"isAdmin": true` to a valid `/flights/{flightId}` payload -> `PERMISSION_DENIED`.
2. **Identity Spoofing on Flight Creation**: Setting `ownerId: "victim_uid_123"` while authenticated as `attacker_uid` -> `PERMISSION_DENIED`.
3. **Unverified Email Write**: Attempting to create a `/flights/{flightId}` document with `email_verified: false` -> `PERMISSION_DENIED`.
4. **ID Poisoning Attack**: Creating `/flights/invalid$id!with*spaces` -> `PERMISSION_DENIED`.
5. **Denial-of-Wallet Oversized String**: Setting `notes` to a 5,000-character string (exceeding `maxLength: 1000`) -> `PERMISSION_DENIED`.
6. **Out-of-Bounds Flight Radius**: Setting `radiusM: 99999` (exceeding `2000` meters) -> `PERMISSION_DENIED`.
7. **Forged Client Timestamp on Create**: Setting `createdAt` to a past timestamp instead of `request.time` -> `PERMISSION_DENIED`.
8. **Immutable Field Mutation on Update**: Updating `ownerId` or `createdAt` on an existing `/flights/{flightId}` document -> `PERMISSION_DENIED`.
9. **Value Poisoning on Update**: Updating `durationMin` with a string `"twenty"` instead of a non-negative number -> `PERMISSION_DENIED`.
10. **Cross-Tenant PII Read**: Authenticated user `attacker_uid` attempting `get` on `/users/victim_uid` -> `PERMISSION_DENIED`.
11. **Blanket Collection Scraping**: Authenticated user running an unfiltered `list` query on `/flights` without `where('ownerId', '==', uid)` -> `PERMISSION_DENIED`.
12. **Invalid Enum in CountryRule**: Creating `/countryRules/{ruleId}` with `easa: "Maybe"` (not in `["Da", "Ne", "Djelomično"]`) -> `PERMISSION_DENIED`.

## 3. Red Team Audit Conflict Report

| Collection | Identity Spoofing | State / Timestamp Integrity | Resource / Value Poisoning | Query / PII Isolation | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/users/{userId}` | Blocked (`uid == request.auth.uid && userId == request.auth.uid`) | Enforced (`createdAt`/`updatedAt == request.time`) | Blocked (`isValidPilotProfile` wraps create & update) | `list` disabled; `get` restricted to owner | PASS |
| `/flights/{flightId}` | Blocked (`ownerId == request.auth.uid`) | Enforced (`createdAt` immutable, `updatedAt == request.time`) | Blocked (`isValidFlightRecord` + radius/duration bounds) | `list` enforces `resource.data.ownerId == request.auth.uid` | PASS |
| `/maintenance/{maintenanceId}` | Blocked (`ownerId == request.auth.uid`) | Enforced (`createdAt` immutable, `updatedAt == request.time`) | Blocked (`isValidMaintenanceRecord` wraps create & update) | `list` enforces `resource.data.ownerId == request.auth.uid` | PASS |
| `/countryRules/{ruleId}` | Blocked (`ownerId == request.auth.uid`) | Enforced (`createdAt` immutable, `updatedAt == request.time`) | Blocked (`isValidCountryRule` + enum check) | `list` enforces `resource.data.ownerId == request.auth.uid` | PASS |
