import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import {
  BLUEPRINT_LIMITS,
  sanitizeFlightPayload,
  upsertCountryRuleList,
  type PilotProfileData,
  type PilotDocType,
  type PilotDocumentData,
  type DroneAsset,
  type FlightEntry,
  type MaintenanceEntry,
  type CountryRuleEntry,
} from '../utils/logbookLogic';
import {
  DEFAULT_AVATAR_SVG,
  DEFAULT_PILOT_PROFILE,
  DEFAULT_DRONE_FLEET,
  INITIAL_FLIGHTS,
  INITIAL_MAINTENANCE,
  DEFAULT_COUNTRY_RULES,
} from '../data/defaultCountries';

const LS_KEYS = {
  PROFILE: 'droneApp_clean_v3_profile',
  FLEET: 'droneApp_clean_v3_fleet',
  FLIGHTS: 'droneApp_clean_v3_flights',
  MAINT: 'droneApp_clean_v3_maintenance',
  RULES: 'droneApp_clean_v3_rules_195',
  DOCS: 'droneApp_clean_v3_pilot_docs',
};

const EMPTY_DOCS: Record<PilotDocType, PilotDocumentData | null> = {
  license: null,
  registration: null,
  insurance: null,
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage write warning:', e);
  }
}

export function useLogbookStore() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState<string>('Lokalno spremno');
  const [statusToast, setStatusToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const [profile, setProfile] = useState<PilotProfileData>(() => {
    const loaded = readLocal<PilotProfileData>(LS_KEYS.PROFILE, DEFAULT_PILOT_PROFILE);
    if (
      !loaded.avatarDataUrl ||
      loaded.avatarDataUrl.includes('dronelogbook_5eb7d220.svg') ||
      loaded.avatarDataUrl === '/icon.svg'
    ) {
      loaded.avatarDataUrl = DEFAULT_AVATAR_SVG;
    }
    return loaded;
  });
  const [fleet, setFleet] = useState<DroneAsset[]>(() =>
    readLocal<DroneAsset[]>(LS_KEYS.FLEET, DEFAULT_DRONE_FLEET)
  );
  const [flights, setFlights] = useState<FlightEntry[]>(() =>
    readLocal<FlightEntry[]>(LS_KEYS.FLIGHTS, INITIAL_FLIGHTS)
  );
  const [maintenance, setMaintenance] = useState<MaintenanceEntry[]>(() =>
    readLocal<MaintenanceEntry[]>(LS_KEYS.MAINT, INITIAL_MAINTENANCE)
  );
  const [countryRules, setCountryRules] = useState<CountryRuleEntry[]>(() => {
    const stored = readLocal<CountryRuleEntry[]>(LS_KEYS.RULES, DEFAULT_COUNTRY_RULES);
    return stored.length >= 190 ? stored : DEFAULT_COUNTRY_RULES;
  });
  const [pilotDocs, setPilotDocs] = useState<Record<PilotDocType, PilotDocumentData | null>>(() =>
    readLocal<Record<PilotDocType, PilotDocumentData | null>>(LS_KEYS.DOCS, EMPTY_DOCS)
  );

  // Clean up legacy v2 keys once so no personal pre-filled data remains
  useEffect(() => {
    try {
      localStorage.removeItem('pilotProfile');
      localStorage.removeItem('droneLog_fleet_v2');
      localStorage.removeItem('droneLog_flights_v2');
      localStorage.removeItem('droneLog_maintenance_v2');
      localStorage.removeItem('droneLog_rules_v2');
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
      setStatusToast({ message, type });
    },
    []
  );

  useEffect(() => {
    if (!statusToast) return;
    const timer = setTimeout(() => setStatusToast(null), 3800);
    return () => clearTimeout(timer);
  }, [statusToast]);

  // Persist to localStorage automatically
  useEffect(() => {
    writeLocal(LS_KEYS.PROFILE, profile);
  }, [profile]);

  useEffect(() => {
    writeLocal(LS_KEYS.FLEET, fleet);
  }, [fleet]);

  useEffect(() => {
    writeLocal(LS_KEYS.FLIGHTS, flights);
  }, [flights]);

  useEffect(() => {
    writeLocal(LS_KEYS.MAINT, maintenance);
  }, [maintenance]);

  useEffect(() => {
    writeLocal(LS_KEYS.RULES, countryRules);
  }, [countryRules]);

  useEffect(() => {
    writeLocal(LS_KEYS.DOCS, pilotDocs);
  }, [pilotDocs]);

  // Network connectivity listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Mreža dostupna — Cloud sinkronizacija aktivna', 'info');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Izvanmrežni način rada (Lokalna pohrana aktivna)', 'warning');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Firestore real-time listeners when authenticated
  useEffect(() => {
    if (!authReady || !user) return;
    const uid = user.uid;

    // 1. User Profile listener
    const userDocRef = doc(db, 'users', uid);
    const unsubProfile = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setProfile((prev) => ({
            ...prev,
            uid,
            pilotName: String(d.pilotName ?? prev.pilotName ?? user.displayName ?? ''),
            pilotId: String(d.pilotId ?? prev.pilotId),
            operatorId: String(d.operatorId ?? prev.operatorId),
            droneSn: String(d.droneSn ?? prev.droneSn),
            droneMake: String(d.droneMake ?? prev.droneMake),
            droneModel: String(d.droneModel ?? prev.droneModel),
            avatarDataUrl: String(d.avatarDataUrl || prev.avatarDataUrl),
            licenseUrl: String(d.licenseUrl ?? prev.licenseUrl),
            registrationUrl: String(d.registrationUrl ?? prev.registrationUrl),
            insuranceUrl: String(d.insuranceUrl ?? prev.insuranceUrl),
          }));
        } else if (user.displayName) {
          setProfile((prev) => ({
            ...prev,
            uid,
            pilotName: prev.pilotName || user.displayName || '',
          }));
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        } catch {
          // Handled and logged
        }
      }
    );

    // 2. Flights listener
    const flightsQuery = query(
      collection(db, 'flights'),
      where('ownerId', '==', uid)
    );
    const unsubFlights = onSnapshot(
      flightsQuery,
      (snap) => {
        const remoteFlights: FlightEntry[] = snap.docs
          .map((docSnap) => {
            const d = docSnap.data();
            const createdMs = d.createdAt?.toMillis
              ? d.createdAt.toMillis()
              : Date.parse(d.takeoffTime) || Date.now();
            return {
              id: docSnap.id,
              ownerId: String(d.ownerId),
              location: String(d.location || ''),
              latitude: typeof d.latitude === 'number' ? d.latitude : undefined,
              longitude: typeof d.longitude === 'number' ? d.longitude : undefined,
              takeoffTime: String(d.takeoffTime || ''),
              landingTime: String(d.landingTime || ''),
              durationMin: Number(d.durationMin || 0),
              radiusM: Number(d.radiusM || 500),
              droneSn: String(d.droneSn || ''),
              droneMake: String(d.droneMake || ''),
              droneModel: String(d.droneModel || ''),
              checklistCompleted: Boolean(d.checklistCompleted),
              notes: String(d.notes || ''),
              synced: true,
              createdAtMs: createdMs,
            };
          })
          .sort((a, b) => {
            const tA = Date.parse(a.takeoffTime) || a.createdAtMs;
            const tB = Date.parse(b.takeoffTime) || b.createdAtMs;
            return tB - tA;
          });
        if (remoteFlights.length > 0) {
          setFlights(remoteFlights);
        }
        setLastSyncText('Cloud sinkroniziran');
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'flights');
        } catch {
          // Handled and logged
        }
      }
    );

    // 3. Maintenance listener
    const maintQuery = query(
      collection(db, 'maintenance'),
      where('ownerId', '==', uid)
    );
    const unsubMaint = onSnapshot(
      maintQuery,
      (snap) => {
        const remoteMaint: MaintenanceEntry[] = snap.docs
          .map((docSnap) => {
            const d = docSnap.data();
            const createdMs = d.createdAt?.toMillis
              ? d.createdAt.toMillis()
              : Date.parse(d.serviceDate) || Date.now();
            return {
              id: docSnap.id,
              ownerId: String(d.ownerId),
              serviceDate: String(d.serviceDate || ''),
              category: String(d.category || 'Redovni servis'),
              droneSn: String(d.droneSn || ''),
              description: String(d.description || ''),
              synced: true,
              createdAtMs: createdMs,
            };
          })
          .sort(
            (a, b) =>
              (Date.parse(b.serviceDate) || b.createdAtMs) -
              (Date.parse(a.serviceDate) || a.createdAtMs)
          );
        if (remoteMaint.length > 0) {
          setMaintenance(remoteMaint);
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'maintenance');
        } catch {
          // Handled and logged
        }
      }
    );

    // 4. Custom Country Rules listener
    const rulesQuery = query(
      collection(db, 'countryRules'),
      where('ownerId', '==', uid)
    );
    const unsubRules = onSnapshot(
      rulesQuery,
      (snap) => {
        if (!snap.empty) {
          setCountryRules((prev) => {
            let merged = [...prev];
            snap.docs.forEach((docSnap) => {
              const d = docSnap.data();
              const res = upsertCountryRuleList(merged, {
                id: docSnap.id,
                ownerId: String(d.ownerId),
                country: String(d.country),
                regulator: String(d.regulator || ''),
                easa: (['Da', 'Ne', 'Djelomično'].includes(d.easa)
                  ? d.easa
                  : 'Da') as 'Da' | 'Ne' | 'Djelomično',
                maxHeight: String(d.maxHeight || '120m'),
                insurance: String(d.insurance || ''),
                appLink: String(d.appLink || ''),
                prohibited: String(d.prohibited || ''),
                notes: String(d.notes || ''),
                instructions: String(d.instructions || ''),
                isCustom: true,
              });
              merged = res.updatedRules;
            });
            return merged;
          });
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'countryRules');
        } catch {
          // Handled and logged
        }
      }
    );

    // 5. Pilot Documents listener (Dozvola, Registracija, Osiguranje files in Cloud)
    const docsQuery = query(
      collection(db, 'pilotDocs'),
      where('ownerId', '==', uid)
    );
    const unsubDocs = onSnapshot(
      docsQuery,
      (snap) => {
        if (!snap.empty) {
          setPilotDocs((prev) => {
            const next = { ...prev };
            snap.docs.forEach((docSnap) => {
              const d = docSnap.data();
              const docType = d.docType as PilotDocType;
              if (docType === 'license' || docType === 'registration' || docType === 'insurance') {
                next[docType] = {
                  docType,
                  fileName: String(d.fileName || ''),
                  mimeType: String(d.mimeType || ''),
                  fileDataUrl: String(d.fileDataUrl || ''),
                  externalUrl: String(d.externalUrl || ''),
                  docNumber: String(d.docNumber || ''),
                  validUntil: String(d.validUntil || ''),
                  updatedAtMs: d.updatedAt?.toMillis ? d.updatedAt.toMillis() : Date.now(),
                  synced: true,
                };
              }
            });
            return next;
          });
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'pilotDocs');
        } catch {
          // Handled and logged
        }
      }
    );

    return () => {
      unsubProfile();
      unsubFlights();
      unsubMaint();
      unsubRules();
      unsubDocs();
    };
  }, [authReady, user]);

  // Manual or Reconnect Cloud Sync (pushes local profile, flights, maintenance & local documents to user's Cloud)
  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      if (!user) {
        setLastSyncText(
          `Lokalna pohrana (${new Date().toLocaleTimeString('hr-HR', {
            hour: '2-digit',
            minute: '2-digit',
          })})`
        );
        showToast(
          'Podaci i dokumenti su spremljeni lokalno. Prijavite se Google računom za svoj Cloud prostor.',
          'info'
        );
        return;
      }

      const uid = user.uid;
      // 1. Push profile to Firestore
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const profilePayload = {
        uid,
        pilotName: (profile.pilotName || user.displayName || 'Pilot').slice(
          0,
          BLUEPRINT_LIMITS.pilotNameMax
        ),
        pilotId: (profile.pilotId || '').slice(0, BLUEPRINT_LIMITS.pilotIdMax),
        operatorId: (profile.operatorId || '').slice(0, BLUEPRINT_LIMITS.operatorIdMax),
        droneSn: (profile.droneSn || '').slice(0, BLUEPRINT_LIMITS.droneSnMax),
        droneMake: (profile.droneMake || '').slice(0, BLUEPRINT_LIMITS.droneMakeMax),
        droneModel: (profile.droneModel || '').slice(0, BLUEPRINT_LIMITS.droneModelMax),
        avatarDataUrl: (profile.avatarDataUrl || '').slice(0, BLUEPRINT_LIMITS.avatarMax),
        licenseUrl: (profile.licenseUrl || '').slice(0, BLUEPRINT_LIMITS.urlMax),
        registrationUrl: (profile.registrationUrl || '').slice(0, BLUEPRINT_LIMITS.urlMax),
        insuranceUrl: (profile.insuranceUrl || '').slice(0, BLUEPRINT_LIMITS.urlMax),
        updatedAt: serverTimestamp(),
      };

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          ...profilePayload,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, profilePayload);
      }

      // 2. Sync any unsynced local flights
      for (const f of flights) {
        if (!f.synced || f.ownerId !== uid) {
          const cleanId =
            f.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || `flight-${Date.now()}`;
          const fRef = doc(db, 'flights', cleanId);
          const fSnap = await getDoc(fRef);
          const sanitized = sanitizeFlightPayload(f, uid);
          if (!fSnap.exists()) {
            await setDoc(fRef, {
              ...sanitized,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      // 3. Sync any unsynced maintenance records
      for (const m of maintenance) {
        if (!m.synced || m.ownerId !== uid) {
          const cleanId =
            m.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || `maint-${Date.now()}`;
          const mRef = doc(db, 'maintenance', cleanId);
          const mSnap = await getDoc(mRef);
          if (!mSnap.exists()) {
            await setDoc(mRef, {
              ownerId: uid,
              serviceDate: m.serviceDate.slice(0, BLUEPRINT_LIMITS.serviceDateMax),
              category: (m.category || 'Redovni servis').slice(0, BLUEPRINT_LIMITS.categoryMax),
              droneSn: (m.droneSn || '').slice(0, BLUEPRINT_LIMITS.droneSnMax),
              description: m.description.slice(0, BLUEPRINT_LIMITS.notesMax),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      // 4. Sync any locally uploaded Dozvola / Registracija / Osiguranje documents to Cloud
      const docTypes: PilotDocType[] = ['license', 'registration', 'insurance'];
      for (const dt of docTypes) {
        const localDoc = pilotDocs[dt];
        if (localDoc && !localDoc.synced) {
          const docId = `${uid}_${dt}`;
          const dRef = doc(db, 'pilotDocs', docId);
          const dSnap = await getDoc(dRef);
          const payload = {
            ownerId: uid,
            docType: dt,
            fileName: (localDoc.fileName || '').slice(0, BLUEPRINT_LIMITS.docFileNameMax),
            mimeType: (localDoc.mimeType || '').slice(0, BLUEPRINT_LIMITS.docMimeMax),
            fileDataUrl: (localDoc.fileDataUrl || '').slice(0, BLUEPRINT_LIMITS.docDataUrlMax),
            externalUrl: (localDoc.externalUrl || '').slice(0, BLUEPRINT_LIMITS.urlMax),
            docNumber: (localDoc.docNumber || '').slice(0, BLUEPRINT_LIMITS.docNumberMax),
            validUntil: (localDoc.validUntil || '').slice(0, 40),
            updatedAt: serverTimestamp(),
          };
          if (dSnap.exists()) {
            const { ownerId: _ignoreOwner, ...updateFields } = payload;
            await updateDoc(dRef, updateFields);
          } else {
            await setDoc(dRef, {
              ...payload,
              createdAt: serverTimestamp(),
            });
          }
        }
      }

      setLastSyncText(
        `Cloud sinkroniziran (${new Date().toLocaleTimeString('hr-HR', {
          hour: '2-digit',
          minute: '2-digit',
        })})`
      );
      showToast('Svi podaci i dokumenti uspješno su sinkronizirani s vašim Cloud računom!', 'success');
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, 'syncNow');
      } catch {
        showToast('Sinkronizacija nije uspjela — podaci su sigurni lokalno.', 'warning');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [user, profile, flights, maintenance, pilotDocs, showToast]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        showToast(
          `Prijavljeni ste kao ${cred.user.displayName || cred.user.email} — vaš osobni Cloud prostor je aktivan!`,
          'success'
        );
      }
    } catch (error) {
      console.warn('Google sign-in popup closed or blocked:', error);
      showToast('Prijava putem Google računa nije dovršena.', 'warning');
    }
  }, [showToast]);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      showToast('Odjavljeni ste iz Cloud računa.', 'info');
    } catch (e) {
      console.error(e);
    }
  }, [showToast]);

  // Save Pilot Document (Dozvola, Registracija, Osiguranje) locally & to Firebase Cloud
  const savePilotDocument = useCallback(
    async (docType: PilotDocType, docInput: Omit<PilotDocumentData, 'docType' | 'updatedAtMs' | 'synced'>) => {
      const entry: PilotDocumentData = {
        docType,
        fileName: (docInput.fileName || '').slice(0, BLUEPRINT_LIMITS.docFileNameMax),
        mimeType: (docInput.mimeType || '').slice(0, BLUEPRINT_LIMITS.docMimeMax),
        fileDataUrl: (docInput.fileDataUrl || '').slice(0, BLUEPRINT_LIMITS.docDataUrlMax),
        externalUrl: (docInput.externalUrl || '').trim().slice(0, BLUEPRINT_LIMITS.urlMax),
        docNumber: (docInput.docNumber || '').trim().slice(0, BLUEPRINT_LIMITS.docNumberMax),
        validUntil: (docInput.validUntil || '').trim().slice(0, 40),
        updatedAtMs: Date.now(),
        synced: Boolean(user && isOnline),
      };

      setPilotDocs((prev) => ({
        ...prev,
        [docType]: entry,
      }));

      // Also sync external URL or ID back to profile if provided
      setProfile((prev) => ({
        ...prev,
        pilotId: docType === 'license' && entry.docNumber ? entry.docNumber : prev.pilotId,
        operatorId: docType === 'registration' && entry.docNumber ? entry.docNumber : prev.operatorId,
        licenseUrl: docType === 'license' ? entry.externalUrl : prev.licenseUrl,
        registrationUrl: docType === 'registration' ? entry.externalUrl : prev.registrationUrl,
        insuranceUrl: docType === 'insurance' ? entry.externalUrl : prev.insuranceUrl,
      }));

      if (user && isOnline) {
        try {
          const docId = `${user.uid}_${docType}`;
          const dRef = doc(db, 'pilotDocs', docId);
          const dSnap = await getDoc(dRef);
          const payload = {
            docType,
            fileName: entry.fileName,
            mimeType: entry.mimeType,
            fileDataUrl: entry.fileDataUrl,
            externalUrl: entry.externalUrl,
            docNumber: entry.docNumber,
            validUntil: entry.validUntil,
            updatedAt: serverTimestamp(),
          };
          if (dSnap.exists()) {
            await updateDoc(dRef, payload);
          } else {
            await setDoc(dRef, {
              ownerId: user.uid,
              ...payload,
              createdAt: serverTimestamp(),
            });
          }
          showToast('Dokument spremljen lokalno i na vaš osobni Cloud račun!', 'success');
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.WRITE, `pilotDocs/${user.uid}_${docType}`);
          } catch {
            showToast('Dokument spremljen lokalno (sinkronizirat će se pri idućoj prijavi).', 'info');
          }
        }
      } else {
        showToast(
          'Dokument spremljen lokalno! Prijavite se Google računom za sigurnosnu kopiju u oblaku.',
          'success'
        );
      }
    },
    [user, isOnline, showToast]
  );

  const removePilotDocument = useCallback(
    async (docType: PilotDocType) => {
      setPilotDocs((prev) => ({
        ...prev,
        [docType]: null,
      }));
      if (user && isOnline) {
        try {
          await deleteDoc(doc(db, 'pilotDocs', `${user.uid}_${docType}`));
        } catch {
          // Ignore if not on server
        }
      }
      showToast('Dokument je uklonjen.', 'info');
    },
    [user, isOnline, showToast]
  );

  // Flight Operations
  const addFlight = useCallback(
    async (newFlightData: Omit<FlightEntry, 'id' | 'ownerId' | 'createdAtMs'>) => {
      const id = `flight-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const uid = user?.uid || 'local-pilot';
      const entry: FlightEntry = {
        ...newFlightData,
        id,
        ownerId: uid,
        synced: Boolean(user && isOnline),
        createdAtMs: Date.now(),
      };

      setFlights((prev) => [entry, ...prev]);

      if (user && isOnline) {
        try {
          const payload = sanitizeFlightPayload(entry, user.uid);
          await setDoc(doc(db, 'flights', id), {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          showToast('Let spremljen u dnevnik i vaš Cloud prostor!', 'success');
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.CREATE, `flights/${id}`);
          } catch {
            showToast('Let spremljen u lokalni red čekanja (Offline Queue).', 'warning');
          }
        }
      } else {
        showToast(
          isOnline
            ? 'Let spremljen u lokalni dnevnik!'
            : 'Offline: Let spremljen u red čekanja za sinkronizaciju.',
          'success'
        );
      }
    },
    [user, isOnline, showToast]
  );

  const updateFlight = useCallback(
    async (updatedFlight: FlightEntry) => {
      setFlights((prev) =>
        prev.map((f) =>
          f.id === updatedFlight.id ? { ...updatedFlight, synced: Boolean(user && isOnline) } : f
        )
      );

      if (user && isOnline) {
        try {
          const fRef = doc(db, 'flights', updatedFlight.id);
          const fSnap = await getDoc(fRef);
          const payload = sanitizeFlightPayload(updatedFlight, user.uid);
          if (fSnap.exists()) {
            const { ownerId: _ignoreOwner, ...mutableFields } = payload;
            await updateDoc(fRef, {
              ...mutableFields,
              updatedAt: serverTimestamp(),
            });
          } else {
            await setDoc(fRef, {
              ...payload,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          showToast('Izmjene leta spremljene u Cloud!', 'success');
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, `flights/${updatedFlight.id}`);
          } catch {
            showToast('Izmjene leta spremljene lokalno.', 'info');
          }
        }
      } else {
        showToast('Izmjene leta spremljene!', 'success');
      }
    },
    [user, isOnline, showToast]
  );

  const deleteFlight = useCallback(
    async (flightId: string) => {
      setFlights((prev) => prev.filter((f) => f.id !== flightId));
      if (user && isOnline) {
        try {
          await deleteDoc(doc(db, 'flights', flightId));
          showToast('Zapis o letu obrisan.', 'info');
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.DELETE, `flights/${flightId}`);
          } catch {
            // Ignored if only local
          }
        }
      } else {
        showToast('Zapis o letu obrisan.', 'info');
      }
    },
    [user, isOnline, showToast]
  );

  // Maintenance Operations
  const addMaintenance = useCallback(
    async (data: { serviceDate: string; category: string; droneSn: string; description: string }) => {
      const id = `maint-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const uid = user?.uid || 'local-pilot';
      const entry: MaintenanceEntry = {
        id,
        ownerId: uid,
        serviceDate: data.serviceDate.slice(0, BLUEPRINT_LIMITS.serviceDateMax),
        category: (data.category || 'Redovni servis').slice(0, BLUEPRINT_LIMITS.categoryMax),
        droneSn: (data.droneSn || profile.droneSn || '').slice(0, BLUEPRINT_LIMITS.droneSnMax),
        description: data.description.trim().slice(0, BLUEPRINT_LIMITS.notesMax),
        synced: Boolean(user && isOnline),
        createdAtMs: Date.now(),
      };

      setMaintenance((prev) => [entry, ...prev]);

      if (user && isOnline) {
        try {
          await setDoc(doc(db, 'maintenance', id), {
            ownerId: user.uid,
            serviceDate: entry.serviceDate,
            category: entry.category,
            droneSn: entry.droneSn,
            description: entry.description,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          showToast('Servis zapisan u dnevnik i Cloud!', 'success');
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.CREATE, `maintenance/${id}`);
          } catch {
            showToast('Servis spremljen u lokalni red čekanja.', 'warning');
          }
        }
      } else {
        showToast('Servis uspješno zapisan!', 'success');
      }
    },
    [user, isOnline, profile.droneSn, showToast]
  );

  const updateMaintenance = useCallback(
    async (updated: MaintenanceEntry) => {
      setMaintenance((prev) =>
        prev.map((m) =>
          m.id === updated.id ? { ...updated, synced: Boolean(user && isOnline) } : m
        )
      );

      if (user && isOnline) {
        try {
          const mRef = doc(db, 'maintenance', updated.id);
          const mSnap = await getDoc(mRef);
          if (mSnap.exists()) {
            await updateDoc(mRef, {
              serviceDate: updated.serviceDate.slice(0, BLUEPRINT_LIMITS.serviceDateMax),
              category: (updated.category || 'Redovni servis').slice(0, BLUEPRINT_LIMITS.categoryMax),
              droneSn: (updated.droneSn || '').slice(0, BLUEPRINT_LIMITS.droneSnMax),
              description: updated.description.trim().slice(0, BLUEPRINT_LIMITS.notesMax),
              updatedAt: serverTimestamp(),
            });
          } else {
            await setDoc(mRef, {
              ownerId: user.uid,
              serviceDate: updated.serviceDate.slice(0, BLUEPRINT_LIMITS.serviceDateMax),
              category: (updated.category || 'Redovni servis').slice(0, BLUEPRINT_LIMITS.categoryMax),
              droneSn: (updated.droneSn || '').slice(0, BLUEPRINT_LIMITS.droneSnMax),
              description: updated.description.trim().slice(0, BLUEPRINT_LIMITS.notesMax),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          showToast('Izmjene servisa spremljene!', 'success');
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.UPDATE, `maintenance/${updated.id}`);
          } catch {
            showToast('Izmjene servisa spremljene lokalno.', 'info');
          }
        }
      } else {
        showToast('Izmjene servisa spremljene!', 'success');
      }
    },
    [user, isOnline, showToast]
  );

  const deleteMaintenance = useCallback(
    async (maintId: string) => {
      setMaintenance((prev) => prev.filter((m) => m.id !== maintId));
      if (user && isOnline) {
        try {
          await deleteDoc(doc(db, 'maintenance', maintId));
          showToast('Servisni zapis obrisan.', 'info');
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.DELETE, `maintenance/${maintId}`);
          } catch {
            // Ignored
          }
        }
      } else {
        showToast('Servisni zapis obrisan.', 'info');
      }
    },
    [user, isOnline, showToast]
  );

  // Country Rules Smart Upsert
  const saveCountryRule = useCallback(
    async (ruleInput: Omit<CountryRuleEntry, 'id' | 'ownerId'>) => {
      const uid = user?.uid || 'local-pilot';
      const { updatedRules, isUpdate, savedRule } = upsertCountryRuleList(countryRules, {
        ...ruleInput,
        ownerId: uid,
      });

      setCountryRules(updatedRules);

      if (user && isOnline) {
        try {
          const cleanId =
            savedRule.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || `rule-${Date.now()}`;
          const rRef = doc(db, 'countryRules', cleanId);
          const rSnap = await getDoc(rRef);
          const payload = {
            country: savedRule.country.slice(0, BLUEPRINT_LIMITS.countryMax),
            regulator: savedRule.regulator.slice(0, BLUEPRINT_LIMITS.regulatorMax),
            easa: savedRule.easa,
            maxHeight: savedRule.maxHeight.slice(0, BLUEPRINT_LIMITS.maxHeightMax),
            insurance: savedRule.insurance.slice(0, BLUEPRINT_LIMITS.insuranceMax),
            appLink: savedRule.appLink.slice(0, BLUEPRINT_LIMITS.urlMax),
            prohibited: savedRule.prohibited.slice(0, BLUEPRINT_LIMITS.prohibitedMax),
            notes: savedRule.notes.slice(0, BLUEPRINT_LIMITS.ruleNotesMax),
            instructions: savedRule.instructions.slice(0, BLUEPRINT_LIMITS.instructionsMax),
            updatedAt: serverTimestamp(),
          };
          if (rSnap.exists()) {
            await updateDoc(rRef, payload);
          } else {
            await setDoc(rRef, {
              ownerId: user.uid,
              ...payload,
              createdAt: serverTimestamp(),
            });
          }
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.WRITE, `countryRules/${savedRule.id}`);
          } catch {
            // Kept in localStorage
          }
        }
      }

      showToast(
        isUpdate
          ? `Pravila za državu "${savedRule.country}" uspješno ažurirana!`
          : `Nova država "${savedRule.country}" dodana u bazu!`,
        'success'
      );
      return savedRule;
    },
    [countryRules, user, isOnline, showToast]
  );

  const resetDefaultCountries = useCallback(() => {
    setCountryRules(DEFAULT_COUNTRY_RULES);
    showToast('Baza pravila vraćena na tvorničkih 195 država svijeta!', 'info');
  }, [showToast]);

  // Pilot Profile & Fleet Updates
  const savePilotProfile = useCallback(
    async (newProfile: PilotProfileData, newFleet?: DroneAsset[]) => {
      const sanitized: PilotProfileData = {
        uid: user?.uid || newProfile.uid || '',
        pilotName: (newProfile.pilotName || '').trim().slice(0, BLUEPRINT_LIMITS.pilotNameMax),
        pilotId: (newProfile.pilotId || '').trim().slice(0, BLUEPRINT_LIMITS.pilotIdMax),
        operatorId: (newProfile.operatorId || '').trim().slice(0, BLUEPRINT_LIMITS.operatorIdMax),
        droneSn: (newProfile.droneSn || '').trim().slice(0, BLUEPRINT_LIMITS.droneSnMax),
        droneMake: (newProfile.droneMake || '').trim().slice(0, BLUEPRINT_LIMITS.droneMakeMax),
        droneModel: (newProfile.droneModel || '').trim().slice(0, BLUEPRINT_LIMITS.droneModelMax),
        avatarDataUrl: (
          newProfile.avatarDataUrl || DEFAULT_PILOT_PROFILE.avatarDataUrl
        ).slice(0, BLUEPRINT_LIMITS.avatarMax),
        licenseUrl: (newProfile.licenseUrl || '').trim().slice(0, BLUEPRINT_LIMITS.urlMax),
        registrationUrl: (newProfile.registrationUrl || '').trim().slice(0, BLUEPRINT_LIMITS.urlMax),
        insuranceUrl: (newProfile.insuranceUrl || '').trim().slice(0, BLUEPRINT_LIMITS.urlMax),
      };

      setProfile(sanitized);
      if (newFleet) {
        setFleet(newFleet);
      }

      if (user && isOnline) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          const { uid: _ignore, ...fields } = sanitized;
          const safePilotName = fields.pilotName || user.displayName || 'Pilot';
          if (snap.exists()) {
            await updateDoc(userRef, {
              ...fields,
              pilotName: safePilotName,
              updatedAt: serverTimestamp(),
            });
          } else {
            await setDoc(userRef, {
              uid: user.uid,
              ...fields,
              pilotName: safePilotName,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          showToast('Profil pilota spremljen na vaš Cloud račun i lokalno!', 'success');
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          } catch {
            showToast('Profil pilota spremljen lokalno.', 'info');
          }
        }
      } else {
        showToast('Profil pilota uspješno spremljen lokalno!', 'success');
      }
    },
    [user, isOnline, showToast]
  );

  const updateActiveDroneSn = useCallback(
    (sn: string) => {
      const matchedDrone = fleet.find((d) => d.sn === sn);
      setProfile((prev) => ({
        ...prev,
        droneSn: sn.slice(0, BLUEPRINT_LIMITS.droneSnMax),
        droneMake: matchedDrone ? matchedDrone.make : prev.droneMake,
        droneModel: matchedDrone ? matchedDrone.model : prev.droneModel,
      }));
    },
    [fleet]
  );

  return {
    user,
    authReady,
    isOnline,
    isSyncing,
    lastSyncText,
    statusToast,
    profile,
    fleet,
    flights,
    maintenance,
    countryRules,
    pilotDocs,
    signInWithGoogle,
    signOutUser,
    syncNow,
    addFlight,
    updateFlight,
    deleteFlight,
    addMaintenance,
    updateMaintenance,
    deleteMaintenance,
    saveCountryRule,
    resetDefaultCountries,
    savePilotProfile,
    savePilotDocument,
    removePilotDocument,
    updateActiveDroneSn,
  };
}
