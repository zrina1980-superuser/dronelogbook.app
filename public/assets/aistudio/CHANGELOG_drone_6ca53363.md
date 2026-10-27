# Changelog

All notable changes to this project are documented in this file.

## [1.3.0] - 2026-04-16

### Added
- Added local-first stale-while-revalidate loading for History, Maintenance, and Rules views using localStorage cache hydration.
- Added offline submission fallback for flight and maintenance records with automatic queueing on network failure.
- Added connection status badge (`Online`/`Offline`) and manual sync action in the pilot header area.
- Added startup hydration flow to render cached data immediately before background server refresh.
- Added dynamic in-head PWA manifest injection (Blob URL) with `display: "standalone"` for better home-screen behavior.

### Changed
- Changed History and Maintenance views from table-style rendering to card-based rendering for faster mobile scanning and editing.
- Changed country input UX from datalist flow to custom filtered dropdown flow in Rules form.
- Changed header layout so Manual Sync and Connection Status are positioned above pilot image, while Settings and Disclaimer remain next to pilot name.
- Changed map picker behavior to fail fast with user feedback when device is offline.

### Fixed
- Fixed blank/slow initial UI state by serving cached content first and revalidating in background.
- Fixed offline save reliability by handling likely network errors in server callbacks and enqueueing locally.
- Fixed mobile pull-to-refresh interference with form usage by applying vertical overscroll containment.
- Fixed PWA install icon fallback issue (gray default icon behavior) by ensuring app-level manifest/icon configuration is present.

### Technical Details
- Frontend files updated:
  - Index.html
  - CSS.html
  - JS.html
- CLEAN_FILES synchronization flow verified and executed:
  - Root files copied to CLEAN_FILES
  - Sensitive defaults sanitized in CLEAN_FILES/JS.html (`DEFAULT_DRONE_SN`, `DEFAULT_PILOT_PROFILE`, `DEFAULT_PROFILE_IMAGE`)
  - Sanitized icon links and manifest link enforced in CLEAN_FILES/Index.html

## [1.2.0] - 2026-04-14

### Added
- Added datalist element with autocomplete dropdown for country selection in Rules module.
- Added `povuciPravilo()` autofill function that populates all rule fields based on selected country.
- Added global `globalnaPravila` variable to cache rules for frontend lookup.
- Added dynamic datalist population from loaded country rules.
- Added dynamic button label switching based on country existence (new vs. existing).

### Changed
- Changed Rules module input from simple text field to datalist-enabled field with autocomplete.
- Changed form behavior to auto-populate when country is selected from dropdown.
- Changed button label to reflect action type: "SPREMI IZMJENE" for updates, "SPREMI U BAZU" for new entries.
- Changed form reset flow to include button state restoration via `povuciPravilo()`.

### Technical Details
- Frontend files updated:
  - Index.html: Added `list="listaDrzava"` and `onchange="povuciPravilo()"` to c_Drzava input
  - Index.html: Added `<datalist id="listaDrzava"></datalist>` element
  - JS.html: Added `globalnaPravila` global variable initialization
  - JS.html: Added autofill datalist population in `loadRules()` success handler
  - JS.html: Added complete `povuciPravilo()` function for field autofill and button state
  - JS.html: Added `povuciPravilo()` call in `submitCountry()` after form reset
- Backend remains unchanged (already had smart upsert logic in `saveNewCountry()`):
  - Code.js: Existing upsert logic compares case-insensitive country names for updates

### Notes
- Rules module now fully supports edit workflow (true update, not duplicate creation).
- Autofill improves data consistency by preventing manual re-entry of unchanged fields.

## [1.1.0] - 2026-04-14

### Added
- Added map picker modal for flight location selection.
- Added map marker click/drag workflow for precise location input.
- Added My Location action in map picker.
- Added reverse geocoding to append place name to coordinates.
- Added satellite layer and base layer switching.
- Added flight radius slider in New Flight form.
- Added live radius value label in New Flight form.
- Added Radius column in Log table view.
- Added radius slider to Log inline edit mode.
- Added backend Radius (m) persistence in Letovi sheet.

### Changed
- Changed Log editing from prompt-based flow to inline row editing.
- Changed Service editing from prompt-based flow to inline row editing.
- Updated map tile providers to Google street and satellite layers.
- Updated map zoom limits for better stability and usability.
- Updated flight reset flow to restore radius default after save.

### Fixed
- Fixed map parser/runtime issues in Apps Script HTML rendering context.
- Fixed coordinate validation edge cases that could break tile loading.
- Fixed map behavior when switching base layers and zoom levels.
- Fixed compatibility path for older Letovi sheet structure by migrating Radius column.

### Technical Details
- Frontend files updated:
  - Index.html
  - JS.html
  - CSS.html
- Backend files updated:
  - Code.js
- Data model update:
  - Letovi header extended with Radius (m)
  - saveFlight/updateFlight/getRecentFlights now handle radius

## [1.0.0] - Initial release

### Added
- Initial Google Apps Script web app for drone operations:
  - New Flight module
  - Service module
  - Log module
  - Rules module
- Google Sheets backend integration for Letovi, Odrzavanje, and PravilaZemalja.
- Basic flight logging with location, takeoff/landing time, duration, and notes.
- Service entry logging and recent service history.
- Country rules search, display, and admin seed workflow.
- Pilot profile and document links stored in localStorage.
- Offline queue and sync-on-reconnect behavior.
- PWA-ready meta/manifest setup.

### Notes
- Pre-release iterations were not tracked as separate changelog entries.
- This baseline entry is reconstructed from README scope.
