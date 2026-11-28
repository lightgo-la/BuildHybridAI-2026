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

function isValidSkuItem(item: unknown): item is SKUItem {
  if (!item || typeof item !== 'object') return false;
  const s = item as Partial<SKUItem>;
  return (
    typeof s.id === 'string' &&
    typeof s.skuCode === 'string' &&
    typeof s.name === 'string' &&
    typeof s.lengthCm === 'number' &&
    Number.isFinite(s.lengthCm) &&
    s.lengthCm > 0 &&
    typeof s.widthCm === 'number' &&
    Number.isFinite(s.widthCm) &&
    s.widthCm > 0 &&
    typeof s.heightCm === 'number' &&
    Number.isFinite(s.heightCm) &&
    s.heightCm > 0 &&
    typeof s.weightKg === 'number' &&
    Number.isFinite(s.weightKg) &&
    s.weightKg >= 0 &&
    typeof s.quantity === 'number' &&
    Number.isFinite(s.quantity) &&
    s.quantity >= 0
  );
}

function isValidBinSpec(item: unknown): item is BinSpec {
  if (!item || typeof item !== 'object') return false;
  const b = item as Partial<BinSpec>;
  return (
    typeof b.id === 'string' &&
    typeof b.level === 'number' &&
    Number.isFinite(b.level) &&
    typeof b.xMeters === 'number' &&
    Number.isFinite(b.xMeters) &&
    typeof b.yMeters === 'number' &&
    Number.isFinite(b.yMeters) &&
    typeof b.zMeters === 'number' &&
    Number.isFinite(b.zMeters) &&
    typeof b.binLengthCm === 'number' &&
    b.binLengthCm > 0 &&
    typeof b.binWidthCm === 'number' &&
    b.binWidthCm > 0 &&
    typeof b.binHeightCm === 'number' &&
    b.binHeightCm > 0
  );
}

function isValidPinnedPlacement(item: unknown): item is PinnedCargoPlacement {
  if (!item || typeof item !== 'object') return false;
  const p = item as Partial<PinnedCargoPlacement>;
  return (
    typeof p.binId === 'string' &&
    typeof p.skuId === 'string' &&
    typeof p.count === 'number' &&
    Number.isFinite(p.count) &&
    p.count > 0
  );
}

export function sanitizeConfigPatch(
  raw: unknown
): Partial<WarehouseConfig> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const patch = { ...(raw as Partial<WarehouseConfig>) };
  if (patch.obstacles !== undefined && !Array.isArray(patch.obstacles)) {
    delete patch.obstacles;
  }
  if (patch.interiorProps !== undefined && !Array.isArray(patch.interiorProps)) {
    delete patch.interiorProps;
  }
  if (
    patch.disabledBinIds !== undefined &&
    !Array.isArray(patch.disabledBinIds)
  ) {
    delete patch.disabledBinIds;
  }
  if (
    patch.customRouteBinIds !== undefined &&
    !Array.isArray(patch.customRouteBinIds)
  ) {
    delete patch.customRouteBinIds;
  }
  return patch;
}

export function loadSavedWorkspaceSession(): SavedWorkspaceSession | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedWorkspaceSession>;
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        typeof parsed.scenarioId === 'string' &&
        Array.isArray(parsed.skus)
      ) {
        const validSkus = parsed.skus.filter(isValidSkuItem);
        const validCustomBins = Array.isArray(parsed.customBinsOverride)
          ? parsed.customBinsOverride.filter(isValidBinSpec)
          : null;
        return {
          scenarioId: parsed.scenarioId,
          skus: validSkus,
          configPatch: sanitizeConfigPatch(parsed.configPatch),
          customBinsOverride:
            validCustomBins && validCustomBins.length > 0
              ? validCustomBins
              : null,
          extraBins: Array.isArray(parsed.extraBins)
            ? parsed.extraBins.filter(isValidBinSpec)
            : [],
          removedBinIds: Array.isArray(parsed.removedBinIds)
            ? parsed.removedBinIds.filter((id): id is string => typeof id === 'string')
            : [],
          pinnedPlacements: Array.isArray(parsed.pinnedPlacements)
            ? parsed.pinnedPlacements.filter(isValidPinnedPlacement)
            : [],
        };
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export function saveWorkspaceSession(payload: SavedWorkspaceSession): boolean {
  try {
    localStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadScene3DBg(): Scene3DBackgroundSettings {
  try {
    const raw = localStorage.getItem(SCENE_3D_BG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          ...DEFAULT_SCENE_3D_BACKGROUND,
          ...(parsed as Partial<Scene3DBackgroundSettings>),
        };
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return DEFAULT_SCENE_3D_BACKGROUND;
}

export function saveScene3DBg(sceneBg: Scene3DBackgroundSettings): void {
  try {
    localStorage.setItem(SCENE_3D_BG_KEY, JSON.stringify(sceneBg));
  } catch {
    // ignore quota error
  }
}

export function loadLang(): LangCode {
  return 'en';
}

export function saveLang(lang: LangCode): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore quota error
  }
}

export function loadCustomMaps(): WarehouseScenario[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MAPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (m): m is WarehouseScenario =>
            Boolean(
              m &&
                typeof m === 'object' &&
                typeof m.id === 'string' &&
                typeof m.name === 'string' &&
                m.config &&
                typeof m.config === 'object' &&
                Array.isArray(m.skus)
            )
        );
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return [];
}

export function saveCustomMaps(maps: WarehouseScenario[]): boolean {
  try {
    localStorage.setItem(CUSTOM_MAPS_KEY, JSON.stringify(maps));
    return true;
  } catch {
    return false;
  }
}

export function loadDesignSettings(): DesignLayoutSettings {
  try {
    const raw = localStorage.getItem(DESIGN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          ...DEFAULT_DESIGN_LAYOUT,
          ...(parsed as Partial<DesignLayoutSettings>),
        };
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return DEFAULT_DESIGN_LAYOUT;
}

export function saveDesignSettings(settings: DesignLayoutSettings): void {
  try {
    localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(settings));
  } catch {
  }
}
