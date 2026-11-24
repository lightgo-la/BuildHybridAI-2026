import {
  initializeApp,
  getApps,
  deleteApp,
  type FirebaseApp,
} from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';
import {
  getRemoteConfig,
  fetchAndActivate,
  getString,
  getNumber,
  type RemoteConfig,
} from 'firebase/remote-config';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export interface FirebaseRuntimeConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  recaptchaSiteKey?: string;
  debugToken?: boolean;
}

export interface RemoteSlottingParams {
  cloudModelName: string;
  liteModelName: string;
  onDeviceMaxSkus: number;
  goldenZoneMinM: number;
  goldenZoneMaxM: number;
  source: 'remote_config' | 'defaults';
}

export interface FirebaseServicesState {
  configured: boolean;
  app: FirebaseApp | null;
  appCheckActive: boolean;
  appCheckMode: 'recaptcha_v3' | 'debug_token' | 'unconfigured';
  remoteConfig: RemoteConfig | null;
  remoteParams: RemoteSlottingParams;
  auth: Auth | null;
  firestore: Firestore | null;
  userId: string | null;
  error: string | null;
}

const DEFAULT_REMOTE_PARAMS: RemoteSlottingParams = {
  cloudModelName: 'gemini-3.8-flash',
  liteModelName: 'gemini-3.5-flash-lite',
  onDeviceMaxSkus: 8,
  goldenZoneMinM: 0.8,
  goldenZoneMaxM: 1.65,
  source: 'defaults',
};

const STORAGE_KEY = 'cubislot_firebase_runtime_config';

export function loadEnvOrStoredConfig(): FirebaseRuntimeConfig {
  const envConfig: FirebaseRuntimeConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
    recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY ?? '',
    debugToken: import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN === 'true',
  };

  if (envConfig.apiKey && envConfig.projectId && envConfig.appId) {
    return envConfig;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as FirebaseRuntimeConfig;
    }
  } catch {
    // Ignore malformed localStorage
  }

  return envConfig;
}

export function saveRuntimeConfig(cfg: FirebaseRuntimeConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function isFirebaseConfigured(cfg: FirebaseRuntimeConfig): boolean {
  return Boolean(
    cfg.apiKey &&
      cfg.projectId &&
      cfg.appId &&
      !cfg.apiKey.includes('your_') &&
      !cfg.projectId.includes('your_')
  );
}

let cachedState: FirebaseServicesState | null = null;

export async function initFirebaseServices(
  customCfg?: FirebaseRuntimeConfig
): Promise<FirebaseServicesState> {
  const cfg = customCfg ?? loadEnvOrStoredConfig();

  if (!isFirebaseConfigured(cfg)) {
    if (getApps().length > 0) {
      await Promise.all(getApps().map((existing) => deleteApp(existing)));
    }
    cachedState = {
      configured: false,
      app: null,
      appCheckActive: false,
      appCheckMode: 'unconfigured',
      remoteConfig: null,
      remoteParams: DEFAULT_REMOTE_PARAMS,
      auth: null,
      firestore: null,
      userId: null,
      error: null,
    };
    return cachedState;
  }

  try {
    // Tear down any previously initialized FirebaseApp instances when re-initializing
    // so new credentials and App Check providers apply cleanly without duplicate errors.
    if (getApps().length > 0) {
      await Promise.all(getApps().map((existing) => deleteApp(existing)));
    }

    const app = initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
    });

    // Firebase App Check (required for Firebase AI Logic)
    let appCheck: AppCheck | null = null;
    let appCheckMode: FirebaseServicesState['appCheckMode'] = 'unconfigured';

    if (cfg.debugToken) {
      (
        globalThis as unknown as {
          FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
        }
      ).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      appCheckMode = 'debug_token';
    }

    if (cfg.recaptchaSiteKey && !cfg.recaptchaSiteKey.includes('your_')) {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(cfg.recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      if (!cfg.debugToken) appCheckMode = 'recaptcha_v3';
    } else if (cfg.debugToken) {
      // Fallback debug initialization with placeholder key if debug token is enabled
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'),
        isTokenAutoRefreshEnabled: true,
      });
    }

    // Firebase Remote Config for dynamic model & Golden Zone thresholds
    let remoteConfig: RemoteConfig | null = null;
    let remoteParams: RemoteSlottingParams = { ...DEFAULT_REMOTE_PARAMS };
    try {
      remoteConfig = getRemoteConfig(app);
      remoteConfig.settings.minimumFetchIntervalMillis = 60_000;
      remoteConfig.defaultConfig = {
        cloud_model_name: DEFAULT_REMOTE_PARAMS.cloudModelName,
        lite_model_name: DEFAULT_REMOTE_PARAMS.liteModelName,
        on_device_max_skus: DEFAULT_REMOTE_PARAMS.onDeviceMaxSkus,
        golden_zone_min_m: DEFAULT_REMOTE_PARAMS.goldenZoneMinM,
        golden_zone_max_m: DEFAULT_REMOTE_PARAMS.goldenZoneMaxM,
      };
      await fetchAndActivate(remoteConfig);
      const fetchedMaxSkus = getNumber(remoteConfig, 'on_device_max_skus');
      const fetchedMinM = getNumber(remoteConfig, 'golden_zone_min_m');
      const fetchedMaxM = getNumber(remoteConfig, 'golden_zone_max_m');
      remoteParams = {
        cloudModelName:
          getString(remoteConfig, 'cloud_model_name') ||
          DEFAULT_REMOTE_PARAMS.cloudModelName,
        liteModelName:
          getString(remoteConfig, 'lite_model_name') ||
          DEFAULT_REMOTE_PARAMS.liteModelName,
        onDeviceMaxSkus:
          Number.isFinite(fetchedMaxSkus) && fetchedMaxSkus > 0
            ? fetchedMaxSkus
            : DEFAULT_REMOTE_PARAMS.onDeviceMaxSkus,
        goldenZoneMinM:
          Number.isFinite(fetchedMinM) && fetchedMinM >= 0
            ? fetchedMinM
            : DEFAULT_REMOTE_PARAMS.goldenZoneMinM,
        goldenZoneMaxM:
          Number.isFinite(fetchedMaxM) && fetchedMaxM > 0
            ? fetchedMaxM
            : DEFAULT_REMOTE_PARAMS.goldenZoneMaxM,
        source: 'remote_config',
      };
    } catch {
      // Keep default params if Remote Config API isn't provisioned yet
    }

    // Firebase Auth + Firestore (optional persistence for slotting scenarios)
    let auth: Auth | null = null;
    let firestore: Firestore | null = null;
    let userId: string | null = null;
    try {
      auth = getAuth(app);
      const cred = await signInAnonymously(auth);
      userId = cred.user.uid;
      firestore = getFirestore(app);
    } catch {
      // Anonymous auth may be disabled in project; continue gracefully
    }

    cachedState = {
      configured: true,
      app,
      appCheckActive: Boolean(appCheck),
      appCheckMode,
      remoteConfig,
      remoteParams,
      auth,
      firestore,
      userId,
      error: null,
    };
    return cachedState;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    cachedState = {
      configured: false,
      app: null,
      appCheckActive: false,
      appCheckMode: 'unconfigured',
      remoteConfig: null,
      remoteParams: DEFAULT_REMOTE_PARAMS,
      auth: null,
      firestore: null,
      userId: null,
      error: message,
    };
    return cachedState;
  }
}

export function getFirebaseServicesState(): FirebaseServicesState | null {
  return cachedState;
}

export async function saveSlottingSnapshotToFirestore(
  state: FirebaseServicesState,
  payload: {
    scenarioName: string;
    equipmentMode: string;
    baselineKpis: Record<string, number>;
    optimizedKpis: Record<string, number>;
    inferenceSource?: string;
  }
): Promise<string> {
  if (!state.firestore) {
    throw new Error(
      'Firestore is not active. Configure Firebase credentials and enable Anonymous Auth + Firestore.'
    );
  }
  const docRef = await addDoc(collection(state.firestore, 'slotting_runs'), {
    ...payload,
    userId: state.userId ?? 'anonymous',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
