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
  cloudModelName: 'gemini-2.5-flash',
  liteModelName: 'gemini-2.5-flash-lite',
  onDeviceMaxSkus: 8,
  goldenZoneMinM: 0.8,
  goldenZoneMaxM: 1.65,
  source: 'defaults',
};

const STORAGE_KEY = 'cubislot_firebase_runtime_config';

function sanitizePlaceholder(val: string | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.includes('your_')) return '';
  return trimmed;
}

export function loadEnvOrStoredConfig(): FirebaseRuntimeConfig {
  try {
    const raw =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FirebaseRuntimeConfig>;
      if (parsed && typeof parsed === 'object') {
        const storedCfg: FirebaseRuntimeConfig = {
          apiKey: sanitizePlaceholder(parsed.apiKey),
          authDomain: sanitizePlaceholder(parsed.authDomain),
          projectId: sanitizePlaceholder(parsed.projectId),
          storageBucket: sanitizePlaceholder(parsed.storageBucket),
          messagingSenderId: sanitizePlaceholder(parsed.messagingSenderId),
          appId: sanitizePlaceholder(parsed.appId),
          recaptchaSiteKey: sanitizePlaceholder(parsed.recaptchaSiteKey),
          debugToken: Boolean(parsed.debugToken),
        };
        if (isFirebaseConfigured(storedCfg)) {
          return storedCfg;
        }
      }
    }
  } catch {
    // ignore localStorage read error
  }

  const envConfig: FirebaseRuntimeConfig = {
    apiKey: sanitizePlaceholder(import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: sanitizePlaceholder(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: sanitizePlaceholder(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: sanitizePlaceholder(
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
    ),
    messagingSenderId: sanitizePlaceholder(
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    ),
    appId: sanitizePlaceholder(import.meta.env.VITE_FIREBASE_APP_ID),
    recaptchaSiteKey: sanitizePlaceholder(
      import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY
    ),
    debugToken: import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN === 'true',
  };

  return envConfig;
}

export function saveRuntimeConfig(cfg: FirebaseRuntimeConfig): void {
  const cleaned: FirebaseRuntimeConfig = {
    apiKey: cfg.apiKey.trim(),
    authDomain: cfg.authDomain.trim(),
    projectId: cfg.projectId.trim(),
    storageBucket: (cfg.storageBucket ?? '').trim(),
    messagingSenderId: (cfg.messagingSenderId ?? '').trim(),
    appId: cfg.appId.trim(),
    recaptchaSiteKey: (cfg.recaptchaSiteKey ?? '').trim(),
    debugToken: Boolean(cfg.debugToken),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
}

export function isFirebaseConfigured(cfg: FirebaseRuntimeConfig): boolean {
  return Boolean(
    cfg.apiKey &&
      cfg.projectId &&
      cfg.appId &&
      !cfg.apiKey.includes('your_') &&
      !cfg.projectId.includes('your_') &&
      !cfg.appId.includes('your_')
  );
}

let cachedState: FirebaseServicesState | null = null;
let inflightInitPromise: Promise<FirebaseServicesState> | null = null;

function sanitizeRemoteModelName(name: string, fallback: string): string {
  const trimmed = name.trim();
  if (!trimmed || /^gemini-1\.|^gemini-2\.0/i.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

async function performFirebaseInit(
  customCfg?: FirebaseRuntimeConfig
): Promise<FirebaseServicesState> {
  const cfg = customCfg ?? loadEnvOrStoredConfig();
  const globalAppCheckObj = globalThis as unknown as {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  };

  if (!isFirebaseConfigured(cfg)) {
    globalAppCheckObj.FIREBASE_APPCHECK_DEBUG_TOKEN = false;
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
    if (getApps().length > 0) {
      await Promise.all(getApps().map((existing) => deleteApp(existing)));
    }

    const app = initializeApp({
      apiKey: cfg.apiKey.trim(),
      authDomain: cfg.authDomain.trim(),
      projectId: cfg.projectId.trim(),
      storageBucket: cfg.storageBucket.trim(),
      messagingSenderId: cfg.messagingSenderId.trim(),
      appId: cfg.appId.trim(),
    });

    let appCheck: AppCheck | null = null;
    let appCheckMode: FirebaseServicesState['appCheckMode'] = 'unconfigured';

    if (cfg.debugToken) {
      globalAppCheckObj.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      appCheckMode = 'debug_token';
    } else {
      globalAppCheckObj.FIREBASE_APPCHECK_DEBUG_TOKEN = false;
    }

    const cleanSiteKey = sanitizePlaceholder(cfg.recaptchaSiteKey);
    if (cleanSiteKey) {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(cleanSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      if (!cfg.debugToken) appCheckMode = 'recaptcha_v3';
    }

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
      const validBounds =
        Number.isFinite(fetchedMinM) &&
        Number.isFinite(fetchedMaxM) &&
        fetchedMinM >= 0 &&
        fetchedMaxM > fetchedMinM;
      remoteParams = {
        cloudModelName: sanitizeRemoteModelName(
          getString(remoteConfig, 'cloud_model_name'),
          DEFAULT_REMOTE_PARAMS.cloudModelName
        ),
        liteModelName: sanitizeRemoteModelName(
          getString(remoteConfig, 'lite_model_name'),
          DEFAULT_REMOTE_PARAMS.liteModelName
        ),
        onDeviceMaxSkus:
          Number.isFinite(fetchedMaxSkus) && fetchedMaxSkus > 0
            ? fetchedMaxSkus
            : DEFAULT_REMOTE_PARAMS.onDeviceMaxSkus,
        goldenZoneMinM: validBounds
          ? fetchedMinM
          : DEFAULT_REMOTE_PARAMS.goldenZoneMinM,
        goldenZoneMaxM: validBounds
          ? fetchedMaxM
          : DEFAULT_REMOTE_PARAMS.goldenZoneMaxM,
        source: 'remote_config',
      };
    } catch {
      // remote config optional
    }

    let auth: Auth | null = null;
    let firestore: Firestore | null = null;
    let userId: string | null = null;
    try {
      firestore = getFirestore(app);
    } catch {
      // firestore unavailable
    }
    try {
      auth = getAuth(app);
      const cred = await signInAnonymously(auth);
      userId = cred.user.uid;
    } catch {
      // anonymous auth optional if firestore rules allow test mode
    }

    cachedState = {
      configured: true,
      app,
      appCheckActive: Boolean(appCheck) || Boolean(cfg.debugToken),
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

export async function initFirebaseServices(
  customCfg?: FirebaseRuntimeConfig
): Promise<FirebaseServicesState> {
  if (inflightInitPromise) {
    await inflightInitPromise.catch(() => {});
  }
  const nextPromise = performFirebaseInit(customCfg);
  inflightInitPromise = nextPromise;
  try {
    return await nextPromise;
  } finally {
    if (inflightInitPromise === nextPromise) {
      inflightInitPromise = null;
    }
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
