import {
  DEFAULT_DESIGN_LAYOUT,
  type DesignLayoutSettings,
} from '../components/DesignStudioMenu';
import {
  DEFAULT_SCENE_3D_BACKGROUND,
  type Scene3DBackgroundSettings,
} from '../components/Scene3DBackgroundModal';
import type { LangCode } from '../i18n/translations';
import type {
  BinSpec,
  PinnedCargoPlacement,
  SKUItem,
  WarehouseConfig,
  WarehouseScenario,
} from '../types/warehouse';

export interface WorkspaceHistorySnapshot {
  skus: SKUItem[];
  configPatch: Partial<WarehouseConfig>;
  customBinsOverride: BinSpec[] | null;
  extraBins: BinSpec[];
  removedBinIds: string[];
  pinnedPlacements: PinnedCargoPlacement[];
}

export interface SavedWorkspaceSession extends WorkspaceHistorySnapshot {
  scenarioId: string;
}

export const DESIGN_STORAGE_KEY = 'cubislot_design_layout_v1';
export const CUSTOM_MAPS_KEY = 'cubislot_custom_maps_v1';
export const LANG_STORAGE_KEY = 'cubislot_lang_v2_en';
export const SCENE_3D_BG_KEY = 'cubislot_scene_3d_bg_v1';
export const WORKSPACE_SESSION_KEY = 'cubislot_active_workspace_v2_en';

export function loadSavedWorkspaceSession(): SavedWorkspaceSession | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedWorkspaceSession>;
      if (
        parsed &&
        typeof parsed.scenarioId === 'string' &&
        Array.isArray(parsed.skus)
      ) {
        return {
          scenarioId: parsed.scenarioId,
          skus: parsed.skus,
          configPatch:
            parsed.configPatch && typeof parsed.configPatch === 'object'
              ? parsed.configPatch
              : {},
          customBinsOverride: Array.isArray(parsed.customBinsOverride)
            ? parsed.customBinsOverride
            : null,
          extraBins: Array.isArray(parsed.extraBins) ? parsed.extraBins : [],
          removedBinIds: Array.isArray(parsed.removedBinIds)
            ? parsed.removedBinIds
            : [],
          pinnedPlacements: Array.isArray(parsed.pinnedPlacements)
            ? parsed.pinnedPlacements
            : [],
        };
      }
    }
  } catch {
  }
  return null;
}

export function saveWorkspaceSession(payload: SavedWorkspaceSession): void {
  try {
    localStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify(payload));
  } catch {
  }
}

export function loadScene3DBg(): Scene3DBackgroundSettings {
  try {
    const raw = localStorage.getItem(SCENE_3D_BG_KEY);
    if (raw) {
      return {
        ...DEFAULT_SCENE_3D_BACKGROUND,
        ...(JSON.parse(raw) as Partial<Scene3DBackgroundSettings>),
      };
    }
  } catch {
  }
  return DEFAULT_SCENE_3D_BACKGROUND;
}

export function saveScene3DBg(sceneBg: Scene3DBackgroundSettings): void {
  try {
    localStorage.setItem(SCENE_3D_BG_KEY, JSON.stringify(sceneBg));
  } catch {
  }
}

export function loadLang(): LangCode {
  return 'en';
}

export function saveLang(lang: LangCode): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
  }
}

export function loadCustomMaps(): WarehouseScenario[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MAPS_KEY);
    if (raw) {
      return JSON.parse(raw) as WarehouseScenario[];
    }
  } catch {
  }
  return [];
}

export function saveCustomMaps(maps: WarehouseScenario[]): void {
  try {
    localStorage.setItem(CUSTOM_MAPS_KEY, JSON.stringify(maps));
  } catch {
  }
}

export function loadDesignSettings(): DesignLayoutSettings {
  try {
    const raw = localStorage.getItem(DESIGN_STORAGE_KEY);
    if (raw) {
      return {
        ...DEFAULT_DESIGN_LAYOUT,
        ...(JSON.parse(raw) as Partial<DesignLayoutSettings>),
      };
    }
  } catch {
  }
  return DEFAULT_DESIGN_LAYOUT;
}

export function saveDesignSettings(settings: DesignLayoutSettings): void {
  try {
    localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(settings));
  } catch {
  }
}
