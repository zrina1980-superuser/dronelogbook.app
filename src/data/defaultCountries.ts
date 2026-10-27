import type {
  CountryRuleEntry,
  DroneAsset,
  FlightEntry,
  MaintenanceEntry,
  PilotProfileData,
} from '../utils/logbookLogic';
import { GLOBAL_195_COUNTRIES } from './globalRules195';

export const DEFAULT_AVATAR_SVG = '/dronelogbookapp.png';
export const APP_HERO_LOGO_PNG = '/dronelogbookapp.png';

/**
 * Clean-slate default pilot profile — ready for public sharing and multi-user Google sign-in.
 */
export const DEFAULT_PILOT_PROFILE: PilotProfileData = {
  uid: 'local-pilot',
  pilotName: '',
  pilotId: '',
  operatorId: '',
  droneSn: '',
  droneMake: '',
  droneModel: '',
  avatarDataUrl: DEFAULT_AVATAR_SVG,
  licenseUrl: '',
  registrationUrl: '',
  insuranceUrl: '',
};

export const DEFAULT_DRONE_FLEET: DroneAsset[] = [];

export const INITIAL_FLIGHTS: FlightEntry[] = [];

export const INITIAL_MAINTENANCE: MaintenanceEntry[] = [];

export const DEFAULT_COUNTRY_RULES: CountryRuleEntry[] = GLOBAL_195_COUNTRIES;
