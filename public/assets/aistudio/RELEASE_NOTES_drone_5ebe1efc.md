# Drone Logbook App - Release Notes

## Latest - Version 1.3.1
Date: 2026-04-16
Release: Web Embed Stabilization + Deployment Checklist

### Highlights
- Confirmed stable GitHub Pages iframe load with Apps Script `/exec` endpoint.
- Documented repeatable deployment flow to avoid `X-Frame-Options: sameorigin` regressions.

### Release Checklist
- Verify `doGet()` includes `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);`.
- Create a new Web App deployment version after every backend change.
- Deployment settings must be:
  - Execute as: `Me`
  - Who has access: `Anyone`
- Use only `/exec` URL in public iframe integrations (never `/dev`).
- Open `/exec` directly in Incognito before publishing; confirm no login wall/redirect page appears.
- Hard refresh GitHub Pages (`Ctrl+F5`) after updating iframe source.

#### Notes
- This release formalizes the publish workflow so fullscreen GitHub embed remains stable and popup-free.

---

## Version 1.3.0
Date: 2026-04-16
Release: Local-First Offline Upgrade + PWA Standalone + Header Layout Polish

### Highlights
- Local-first loading now hydrates cached History, Maintenance, and Rules data instantly.
- Offline submissions are now robust with automatic queue fallback on network errors.
- New header status cluster: Manual Sync + connection badge above pilot profile image.
- PWA behavior improved with dynamic manifest injection and standalone display mode.
- Mobile UX improved with overscroll containment and better startup rendering.

#### What Is New
- History and Maintenance modules now render card layouts optimized for mobile readability.
- Rules module now uses filtered custom dropdown behavior for country lookup.
- Added `Online/Offline` status badge and manual refresh action in header UI.
- Added startup background refresh pipeline after cached content hydration.
- Added connectivity listeners (`online`/`offline`) to auto-refresh status and trigger sync.

#### Offline And Sync Behavior
- Flight and Maintenance save operations now:
  - save immediately when online
  - auto-enqueue when offline
  - fallback to enqueue if server callback fails due to likely network issues
- Offline queue now syncs on reconnect and also supports manual sync trigger.

#### PWA And Install Experience
- App now injects a runtime manifest with:
  - `display: standalone`
  - portrait orientation
  - dedicated 512x512 and 192x192 icons
- This improves home-screen launch behavior and reduces fallback icon issues on mobile.

#### Build And Release Notes
- CLEAN_FILES sync executed successfully and includes all root updates.
- Sensitive defaults are sanitized in CLEAN_FILES before customer push.
- Both deployment targets were pushed successfully:
  - Original (test)
  - PRO Master (customer)

#### Notes
- This release focuses on reliability in low-signal conditions, faster perceived load time, and cleaner mobile-first ergonomics.

---

Date: 2026-04-14
Version: 1.2.0
Release: Rules Module Autofill + Smart Upsert

### Highlights
- New dropdown selector for existing countries in Rules module.
- Automatic form population (autofill) when selecting a country.
- Smart upsert backend logic: Update existing rules or add new ones.
- Dynamic button label change based on country state.
- Improved country rules lookup experience with datalist filtering.

#### What Is New
- Rules input now features autocomplete dropdown with all available countries.
- Selecting a country from dropdown automatically fills all fields with existing rules data.
- Button text dynamically changes:
  - "SPREMI U BAZU" (Save to DB) for new countries
  - "SPREMI IZMJENE" (Save Changes) for existing countries
- Backend smart save logic prevents duplicates by comparing case-insensitive country names.
- Form resets properly after successful submission with button state restoration.

#### Data And Compatibility
- Rules module now supports true edit workflow (update instead of duplicate).
- Existing rules in Google Sheet remain compatible with new lookup logic.

#### Notes
- This release improves the Rules management workflow, making it easier to add new rules or update existing ones without manual tracking.

---

Date: 2026-04-14
Version: 1.1.0
Release: Map Picker + Inline Edit Upgrade

## Highlights
- New map-based location picker in New Flight and Log edit.
- Added Map/Satellite switch with improved satellite coverage.
- Added My Location button for quick GPS centering.
- Added automatic place name lookup from coordinates.
- Added flight radius slider in New Flight and Log edit.

## What Is New
- New Flight now supports selecting location directly on an interactive map.
- Location can be set by click or by dragging marker.
- Reverse geocoding now appends place name after coordinates.
- Flight radius is now part of the flight record:
  - default: 500 m
  - min: 100 m
  - max: 2000 m
  - step: 50 m
- Log table now shows Radius as a dedicated column.
- Log inline edit now supports radius changes with slider.

## Editing Experience
- Log entries are edited inline (no popup prompts).
- Service entries are edited inline (no popup prompts).
- Added clear Save/Cancel flow for edit mode.

## Stability Improvements
- Improved map initialization and coordinate normalization.
- Reduced parser-related breakage in Google Apps Script HTML context.
- Improved zoom behavior and layer consistency in map picker.

## Data And Compatibility
- Added Radius (m) field to flight storage.
- Existing data remains compatible through automatic sheet migration.

## Notes
- This release focuses on faster data entry, better location precision, and safer edits.
