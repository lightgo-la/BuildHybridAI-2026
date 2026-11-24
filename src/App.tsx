import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Camera,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Compass,
  Copy,
  Cpu,
  Flame,
  Home,
  Keyboard,
  Languages,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  Move,
  Palette,
  Pin,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Ruler,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Truck,
} from 'lucide-react';
import { DESIGN_THEMES } from './data/designThemes';
import { SAMPLE_SCENARIOS } from './data/sampleScenarios';
import { WAREHOUSE_TEMPLATES } from './data/warehouseTemplates';
import { type LangCode, t } from './i18n/translations';
import {
  computeZLevelBreakdown,
  generateWarehouseBins,
  runBaseline2DSlotting,
  runOptimized3DSlotting,
} from './engine/slottingEngine';
import {
  type FirebaseRuntimeConfig,
  type FirebaseServicesState,
  initFirebaseServices,
  saveSlottingSnapshotToFirestore,
} from './services/firebaseClient';
import {
  type ChromeNanoDiagnostics,
  type HybridModeChoice,
  checkChromeGeminiNanoStatus,
} from './services/hybridAi';
import type {
  BinAllocation,
  BinSpec,
  EquipmentMode,
  InteriorProp,
  InteriorPropType,
  OptimizationPreset,
  PinnedCargoPlacement,
  RoomEnclosureStyle,
  SKUItem,
  ViewLayerMode,
  WarehouseConfig,
  WarehouseScenario,
} from './types/warehouse';
import { Warehouse3DViewport } from './components/Warehouse3DViewport';
import { KPIComparisonBar } from './components/KPIComparisonBar';
import { HybridAICopilotPanel } from './components/HybridAICopilotPanel';
import { FirebaseSetupModal } from './components/FirebaseSetupModal';
import {
  GOLDEN_ZONE_PRESETS,
  SpaceOptimizerPanel,
} from './components/SpaceOptimizerPanel';
import {
  DEFAULT_DESIGN_LAYOUT,
  type DesignLayoutSettings,
  DesignStudioMenu,
} from './components/DesignStudioMenu';
import { CadPreviewModal } from './components/CadPreviewModal';
import { MapEditorModal } from './components/MapEditorModal';
import { TemplateGalleryModal } from './components/TemplateGalleryModal';
import { SimulationEditorPanel } from './components/SimulationEditorPanel';
import { BinInspectorPanel } from './components/BinInspectorPanel';
import { EverydayHomeView } from './components/EverydayHomeView';
import {
  INTERIOR_PROP_CATALOG,
  InteriorStudioModal,
} from './components/InteriorStudioModal';
import {
  DEFAULT_SCENE_3D_BACKGROUND,
  SCENE_3D_PRESETS,
  Scene3DBackgroundModal,
  type Scene3DBackgroundSettings,
} from './components/Scene3DBackgroundModal';
import {
  ViewportContextMenu,
  type ViewportContextState,
} from './components/ViewportContextMenu';

const DESIGN_STORAGE_KEY = 'cubislot_design_layout_v1';
const CUSTOM_MAPS_KEY = 'cubislot_custom_maps_v1';
const LANG_STORAGE_KEY = 'cubislot_lang_v1';
const SCENE_3D_BG_KEY = 'cubislot_scene_3d_bg_v1';

function loadScene3DBg(): Scene3DBackgroundSettings {
  try {
    const raw = localStorage.getItem(SCENE_3D_BG_KEY);
    if (raw) {
      return {
        ...DEFAULT_SCENE_3D_BACKGROUND,
        ...(JSON.parse(raw) as Partial<Scene3DBackgroundSettings>),
      };
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_SCENE_3D_BACKGROUND;
}

function loadLang(): LangCode {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'ko' || saved === 'en') return saved;
  } catch {
    // ignore storage errors
  }
  return 'ko';
}

function loadCustomMaps(): WarehouseScenario[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MAPS_KEY);
    if (raw) {
      return JSON.parse(raw) as WarehouseScenario[];
    }
  } catch {
    // ignore malformed storage
  }
  return [];
}

function loadDesignSettings(): DesignLayoutSettings {
  try {
    const raw = localStorage.getItem(DESIGN_STORAGE_KEY);
    if (raw) {
      return {
        ...DEFAULT_DESIGN_LAYOUT,
        ...(JSON.parse(raw) as Partial<DesignLayoutSettings>),
      };
    }
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_DESIGN_LAYOUT;
}

export function App() {
  const [customMaps, setCustomMaps] = useState<WarehouseScenario[]>(loadCustomMaps);
  const allScenarios = useMemo(
    () => [...SAMPLE_SCENARIOS, ...WAREHOUSE_TEMPLATES, ...customMaps],
    [customMaps]
  );

  const [scenarioId, setScenarioId] = useState(SAMPLE_SCENARIOS[0].id);
  const activeScenario = useMemo(
    () =>
      allScenarios.find((s) => s.id === scenarioId) ?? SAMPLE_SCENARIOS[0],
    [allScenarios, scenarioId]
  );

  const [skus, setSkus] = useState<SKUItem[]>(activeScenario.skus);
  const [configPatch, setConfigPatch] = useState<Partial<WarehouseConfig>>({});
  const [customBinsOverride, setCustomBinsOverride] = useState<BinSpec[] | null>(
    null
  );
  const [extraBins, setExtraBins] = useState<BinSpec[]>([]);
  const [removedBinIds, setRemovedBinIds] = useState<string[]>([]);
  const [pinnedPlacements, setPinnedPlacements] = useState<
    PinnedCargoPlacement[]
  >([]);

  const [equipmentMode, setEquipmentMode] = useState<EquipmentMode>(
    activeScenario.config.equipmentMode
  );
  const [allowRotationAndCoPack, setAllowRotationAndCoPack] = useState(true);
  const [optimizationPreset, setOptimizationPreset] =
    useState<OptimizationPreset>('balanced');
  const [goldenPresetId, setGoldenPresetId] = useState('standard');
  const [activeLayout, setActiveLayout] = useState<'optimized_3d' | 'baseline_2d'>(
    'optimized_3d'
  );
  const [lang, setLang] = useState<LangCode>(loadLang);
  const [appView, setAppView] = useState<'workspace' | 'home'>('workspace');
  const [viewLayer, setViewLayer] = useState<ViewLayerMode>('slotting');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'elevation'>(
    'iso'
  );
  const [cameraResetTick, setCameraResetTick] = useState(0);
  const [animateRoute, setAnimateRoute] = useState(true);
  const [dragMoveMode, setDragMoveMode] = useState(false);
  const [dragScope, setDragScope] = useState<'column' | 'whole_template'>(
    'whole_template'
  );
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [interiorModalOpen, setInteriorModalOpen] = useState(false);
  const [interiorInitialTab, setInteriorInitialTab] = useState<
    'interior' | 'shortcuts'
  >('interior');
  const [shortcutToast, setShortcutToast] = useState<string>('');
  const [leftTab, setLeftTab] = useState<'optimizer' | 'editor' | 'inspector'>(
    'optimizer'
  );

  const [designSettings, setDesignSettings] =
    useState<DesignLayoutSettings>(loadDesignSettings);
  const [designMenuOpen, setDesignMenuOpen] = useState(false);
  const [sceneBg, setSceneBg] =
    useState<Scene3DBackgroundSettings>(loadScene3DBg);
  const [sceneBgModalOpen, setSceneBgModalOpen] = useState(false);
  const [cadModalOpen, setCadModalOpen] = useState(false);
  const [mapEditorOpen, setMapEditorOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [simpleMode, setSimpleMode] = useState(true);
  const [mapFilter, setMapFilter] = useState<'all' | 'pro' | 'everyday'>('all');
  const [contextMenu, setContextMenu] = useState<ViewportContextState | null>(
    null
  );
  const [externalAiPrompt, setExternalAiPrompt] = useState<{
    id: number;
    prompt: string;
    mode: HybridModeChoice;
  } | null>(null);

  const activeTheme = useMemo(
    () =>
      DESIGN_THEMES.find((t) => t.id === designSettings.themeId) ??
      DESIGN_THEMES[0],
    [designSettings.themeId]
  );

  useEffect(() => {
    try {
      localStorage.setItem(SCENE_3D_BG_KEY, JSON.stringify(sceneBg));
    } catch {
      // ignore storage errors
    }
  }, [sceneBg]);

  useEffect(() => {
    try {
      localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(designSettings));
    } catch {
      // ignore storage quota errors
    }
    const root = document.documentElement;
    root.style.fontSize = `${(16 * designSettings.uiScalePct) / 100}px`;
    root.style.setProperty('--t-bg', activeTheme.bg);
    root.style.setProperty('--t-surface', activeTheme.surface);
    root.style.setProperty('--t-surface-alt', activeTheme.surfaceAlt);
    root.style.setProperty('--t-border', activeTheme.border);
    root.style.setProperty('--t-text', activeTheme.text);
    root.style.setProperty('--t-muted', activeTheme.textMuted);
    root.style.setProperty('--t-accent', activeTheme.accent);
    root.style.setProperty('--t-accent-text', activeTheme.accentText);
    root.style.setProperty('--left-panel-px', `${designSettings.leftPanelPx}px`);
    root.style.setProperty('--right-panel-px', `${designSettings.rightPanelPx}px`);
  }, [designSettings, activeTheme]);

  const [firebaseState, setFirebaseState] = useState<FirebaseServicesState>({
    configured: false,
    app: null,
    appCheckActive: false,
    appCheckMode: 'unconfigured',
    remoteConfig: null,
    remoteParams: {
      cloudModelName: 'gemini-3.8-flash',
      liteModelName: 'gemini-3.5-flash-lite',
      onDeviceMaxSkus: 8,
      goldenZoneMinM: 0.8,
      goldenZoneMaxM: 1.65,
      source: 'defaults',
    },
    auth: null,
    firestore: null,
    userId: null,
    error: null,
  });

  const [nanoDiag, setNanoDiag] = useState<ChromeNanoDiagnostics>({
    supportedApi: false,
    availability: 'unknown',
    detail: 'Checking Chrome Gemini Nano availability...',
  });

  const [setupOpen, setSetupOpen] = useState(false);
  const [lastInferenceSource, setLastInferenceSource] = useState<string>('');
  const [firestoreNotice, setFirestoreNotice] = useState<string>('');

  useEffect(() => {
    void initFirebaseServices().then(setFirebaseState);
    void checkChromeGeminiNanoStatus().then(setNanoDiag);
  }, []);

  const handleSelectScenario = (nextId: string) => {
    const found = allScenarios.find((s) => s.id === nextId);
    if (!found) return;
    setScenarioId(nextId);
    setSkus(found.skus);
    setConfigPatch({});
    setCustomBinsOverride(found.customBins ?? null);
    setExtraBins([]);
    setRemovedBinIds([]);
    setPinnedPlacements([]);
    setEquipmentMode(found.config.equipmentMode);
    setLevelFilter('all');
    setSelectedBinId(null);
    setSelectedPropId(null);
    setCameraResetTick((t) => t + 1);
  };

  const handleSaveCustomScenario = useCallback((customMap: WarehouseScenario) => {
    setCustomMaps((prev) => {
      const next = [...prev, customMap];
      try {
        localStorage.setItem(CUSTOM_MAPS_KEY, JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
    setScenarioId(customMap.id);
  }, []);

  const handleDeleteCustomScenario = useCallback(
    (id: string) => {
      setCustomMaps((prev) => {
        const next = prev.filter((m) => m.id !== id);
        try {
          localStorage.setItem(CUSTOM_MAPS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      if (scenarioId === id) {
        setScenarioId(SAMPLE_SCENARIOS[0].id);
        setSkus(SAMPLE_SCENARIOS[0].skus);
      }
    },
    [scenarioId]
  );

  const cycleTheme = useCallback(
    (delta: number) => {
      const idx = DESIGN_THEMES.findIndex((t) => t.id === activeTheme.id);
      const nextIdx =
        (idx + delta + DESIGN_THEMES.length) % DESIGN_THEMES.length;
      setDesignSettings((prev) => ({
        ...prev,
        themeId: DESIGN_THEMES[nextIdx].id,
      }));
    },
    [activeTheme.id]
  );

  const activeGoldenPreset = useMemo(
    () =>
      GOLDEN_ZONE_PRESETS.find((p) => p.id === goldenPresetId) ??
      GOLDEN_ZONE_PRESETS[0],
    [goldenPresetId]
  );

  const config = useMemo(
    () => ({
      ...activeScenario.config,
      ...configPatch,
      equipmentMode,
      allowRotationAndCoPack,
      optimizationPreset,
      goldenZoneMinM:
        goldenPresetId === 'standard'
          ? firebaseState.remoteParams.goldenZoneMinM
          : activeGoldenPreset.minM,
      goldenZoneMaxM:
        goldenPresetId === 'standard'
          ? firebaseState.remoteParams.goldenZoneMaxM
          : activeGoldenPreset.maxM,
    }),
    [
      activeScenario.config,
      configPatch,
      equipmentMode,
      allowRotationAndCoPack,
      optimizationPreset,
      goldenPresetId,
      activeGoldenPreset,
      firebaseState.remoteParams,
    ]
  );

  const bins = useMemo(() => {
    const disabledSet = new Set([
      ...(config.disabledBinIds ?? []),
      ...removedBinIds,
    ]);
    const sourceBins =
      customBinsOverride !== null
        ? customBinsOverride.map((b) => ({
            ...b,
            isGoldenZone:
              b.zMeters >= config.goldenZoneMinM &&
              b.zMeters <= config.goldenZoneMaxM,
          }))
        : generateWarehouseBins(config);
    const baseBins = sourceBins.filter((b) => !disabledSet.has(b.id));
    const merged = [...baseBins];
    for (const extra of extraBins) {
      if (!disabledSet.has(extra.id) && !merged.some((b) => b.id === extra.id)) {
        merged.push({
          ...extra,
          isGoldenZone:
            extra.zMeters >= config.goldenZoneMinM &&
            extra.zMeters <= config.goldenZoneMaxM,
        });
      }
    }
    return merged;
  }, [config, customBinsOverride, extraBins, removedBinIds]);

  const baselineResult = useMemo(
    () => runBaseline2DSlotting(bins, skus, config, pinnedPlacements),
    [bins, skus, config, pinnedPlacements]
  );

  const optimizedResult = useMemo(
    () => runOptimized3DSlotting(bins, skus, config, pinnedPlacements),
    [bins, skus, config, pinnedPlacements]
  );

  const shownResult =
    activeLayout === 'optimized_3d' ? optimizedResult : baselineResult;

  const zBreakdown = useMemo(
    () => computeZLevelBreakdown(shownResult.allocations, config),
    [shownResult.allocations, config]
  );

  const selectedBin: BinAllocation | null = useMemo(() => {
    if (!selectedBinId) return null;
    return (
      shownResult.allocations.find((a) => a.bin.id === selectedBinId) ?? null
    );
  }, [shownResult.allocations, selectedBinId]);

  const handleSelectBin = useCallback((alloc: BinAllocation | null) => {
    setSelectedBinId(alloc ? alloc.bin.id : null);
    if (alloc) setLeftTab('inspector');
  }, []);

  const handleAddBin = useCallback((bin: BinSpec) => {
    setRemovedBinIds((prev) => prev.filter((id) => id !== bin.id));
    setExtraBins((prev) => [...prev.filter((b) => b.id !== bin.id), bin]);
    setSelectedBinId(bin.id);
  }, []);

  const handleDeleteBin = useCallback((binId: string) => {
    setRemovedBinIds((prev) => (prev.includes(binId) ? prev : [...prev, binId]));
    setExtraBins((prev) => prev.filter((b) => b.id !== binId));
    setPinnedPlacements((prev) => prev.filter((p) => p.binId !== binId));
    setSelectedBinId((curr) => (curr === binId ? null : curr));
  }, []);

  const handlePinCargo = useCallback(
    (binId: string, skuId: string, delta: number) => {
      setPinnedPlacements((prev) => {
        const idx = prev.findIndex(
          (p) => p.binId === binId && p.skuId === skuId
        );
        if (idx === -1) {
          return delta > 0 ? [...prev, { binId, skuId, count: delta }] : prev;
        }
        const nextCount = prev[idx].count + delta;
        if (nextCount <= 0) {
          return prev.filter((_, i) => i !== idx);
        }
        return prev.map((p, i) =>
          i === idx ? { ...p, count: nextCount } : p
        );
      });
    },
    []
  );

  const handleAddBinAbove = useCallback(
    (alloc: BinAllocation) => {
      const nextLevel = alloc.bin.level + 1;
      const levelHeights = [0.05, 0.85, 1.55, 2.35, 3.15, 3.95, 4.75, 5.55];
      const maxWeights = [1200, 750, 600, 420, 280, 200, 160, 140];
      const zMeters =
        levelHeights[nextLevel - 1] ??
        Number(((nextLevel - 1) * 0.82 + 0.05).toFixed(2));
      const newBin: BinSpec = {
        ...alloc.bin,
        id: `A${alloc.bin.aisle}-B${alloc.bin.bay}-Z${nextLevel}`,
        level: nextLevel,
        zMeters,
        maxWeightKg: maxWeights[nextLevel - 1] ?? 150,
        isGoldenZone:
          zMeters >= config.goldenZoneMinM && zMeters <= config.goldenZoneMaxM,
      };
      handleAddBin(newBin);
    },
    [config.goldenZoneMinM, config.goldenZoneMaxM, handleAddBin]
  );

  const handleAddBinAtFloor = useCallback(
    (x: number, z: number) => {
      const aisleSpacing = config.aisleSpacingM ?? 3.4;
      const baySpacing = config.baySpacingM ?? 1.45;
      const aisle = Math.max(1, Math.round(x / aisleSpacing) + 1);
      const bay = Math.max(1, Math.round((z - 1.8) / baySpacing) + 1);
      const hasObstacle = (config.obstacles ?? []).some(
        (o) => o.aisle === aisle && o.bay === bay
      );
      if (hasObstacle) return;
      const snappedX = Number(((aisle - 1) * aisleSpacing).toFixed(2));
      const snappedY = Number(((bay - 1) * baySpacing + 1.8).toFixed(2));
      const levelHeights = [0.05, 0.85, 1.55, 2.35, 3.15, 3.95, 4.75];
      const maxWeights = [1200, 750, 600, 420, 280, 200, 160];

      // Pick lowest unoccupied Z-level at this (aisle, bay) column
      let targetLevel = 1;
      while (
        targetLevel <= 7 &&
        bins.some((b) => b.aisle === aisle && b.bay === bay && b.level === targetLevel)
      ) {
        targetLevel++;
      }
      const zMeters =
        levelHeights[targetLevel - 1] ??
        Number(((targetLevel - 1) * 0.82 + 0.05).toFixed(2));

      const newBin: BinSpec = {
        id: `A${aisle}-B${bay}-Z${targetLevel}`,
        aisle,
        bay,
        level: targetLevel,
        xMeters: snappedX,
        yMeters: snappedY,
        zMeters,
        binLengthCm: config.binLengthCm ?? 120,
        binWidthCm: config.binWidthCm ?? 90,
        binHeightCm: config.binHeightCm ?? 70,
        maxWeightKg: maxWeights[targetLevel - 1] ?? 150,
        isGoldenZone:
          zMeters >= config.goldenZoneMinM && zMeters <= config.goldenZoneMaxM,
      };
      handleAddBin(newBin);
    },
    [bins, config, handleAddBin]
  );

  const handleMoveRackColumn = useCallback(
    (oldX: number, oldY: number, newX: number, newY: number) => {
      // Check if target (newX, newY) is already occupied by a different rack column; if so, swap their positions so columns never weld together!
      const occupiedAtTarget = bins.some(
        (b) =>
          (Math.abs(b.xMeters - oldX) >= 0.05 ||
            Math.abs(b.yMeters - oldY) >= 0.05) &&
          Math.abs(b.xMeters - newX) < 0.35 &&
          Math.abs(b.yMeters - newY) < 0.35
      );
      const nextBins = bins.map((b) => {
        if (
          Math.abs(b.xMeters - oldX) < 0.05 &&
          Math.abs(b.yMeters - oldY) < 0.05
        ) {
          return { ...b, xMeters: newX, yMeters: newY };
        }
        if (
          occupiedAtTarget &&
          Math.abs(b.xMeters - newX) < 0.35 &&
          Math.abs(b.yMeters - newY) < 0.35
        ) {
          return { ...b, xMeters: oldX, yMeters: oldY };
        }
        return b;
      });
      setCustomBinsOverride(nextBins);
      setExtraBins([]);
      setRemovedBinIds([]);
    },
    [bins]
  );

  // Move the ENTIRE template layout (all bins, obstacles, interior props, and depot) together in 3D
  const handleTranslateWholeTemplate = useCallback(
    (dx: number, dy: number) => {
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;
      const nextBins = bins.map((b) => ({
        ...b,
        xMeters: Number((b.xMeters + dx).toFixed(2)),
        yMeters: Number((b.yMeters + dy).toFixed(2)),
      }));
      setCustomBinsOverride(nextBins);
      setExtraBins([]);
      setRemovedBinIds([]);

      const aisleSp = config.aisleSpacingM ?? 3.4;
      const curDepotX =
        config.depotXMeters ??
        ((Math.max(1, config.aisles) - 1) * aisleSp) / 2;
      const curDepotY = config.depotYMeters ?? 0;

      setConfigPatch((prev) => ({
        ...prev,
        depotXMeters: Number((curDepotX + dx).toFixed(2)),
        depotYMeters: Number((curDepotY + dy).toFixed(2)),
        obstacles: (prev.obstacles ?? config.obstacles ?? []).map((o) => ({
          ...o,
          xMeters: Number((o.xMeters + dx).toFixed(2)),
          yMeters: Number((o.yMeters + dy).toFixed(2)),
        })),
        interiorProps: (prev.interiorProps ?? config.interiorProps ?? []).map(
          (p) => ({
            ...p,
            xMeters: Number((p.xMeters + dx).toFixed(2)),
            yMeters: Number((p.yMeters + dy).toFixed(2)),
          })
        ),
      }));
    },
    [bins, config]
  );

  // Rotate the ENTIRE template layout 90 degrees around its centroid in 3D
  const handleRotateWholeTemplate90 = useCallback(() => {
    if (bins.length === 0) return;
    const xs = bins.map((b) => b.xMeters);
    const ys = bins.map((b) => b.yMeters);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const rot = (x: number, y: number) => ({
      nx: Number((cx - (y - cy)).toFixed(2)),
      ny: Number((cy + (x - cx)).toFixed(2)),
    });

    const nextBins = bins.map((b) => {
      const { nx, ny } = rot(b.xMeters, b.yMeters);
      return {
        ...b,
        xMeters: nx,
        yMeters: ny,
        binLengthCm: b.binWidthCm,
        binWidthCm: b.binLengthCm,
      };
    });
    setCustomBinsOverride(nextBins);
    setExtraBins([]);
    setRemovedBinIds([]);

    const aisleSp = config.aisleSpacingM ?? 3.4;
    const curDepotX =
      config.depotXMeters ?? ((Math.max(1, config.aisles) - 1) * aisleSp) / 2;
    const curDepotY = config.depotYMeters ?? 0;
    const rotDepot = rot(curDepotX, curDepotY);

    setConfigPatch((prev) => ({
      ...prev,
      depotXMeters: rotDepot.nx,
      depotYMeters: rotDepot.ny,
      obstacles: (prev.obstacles ?? config.obstacles ?? []).map((o) => {
        const ro = rot(o.xMeters, o.yMeters);
        return { ...o, xMeters: ro.nx, yMeters: ro.ny };
      }),
      interiorProps: (prev.interiorProps ?? config.interiorProps ?? []).map(
        (p) => {
          const rp = rot(p.xMeters, p.yMeters);
          return {
            ...p,
            xMeters: rp.nx,
            yMeters: rp.ny,
            rotationDeg: (p.rotationDeg + 90) % 360,
          };
        }
      ),
    }));
  }, [bins, config]);

  // Expand or compact the ENTIRE template's aisle/bay spacing in 3D
  const handleScaleWholeTemplateSpacing = useCallback(
    (factor: number) => {
      if (bins.length === 0) return;
      const xs = bins.map((b) => b.xMeters);
      const ys = bins.map((b) => b.yMeters);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const sc = (x: number, y: number) => ({
        nx: Number((cx + (x - cx) * factor).toFixed(2)),
        ny: Number((cy + (y - cy) * factor).toFixed(2)),
      });

      const nextBins = bins.map((b) => {
        const { nx, ny } = sc(b.xMeters, b.yMeters);
        return { ...b, xMeters: nx, yMeters: ny };
      });
      setCustomBinsOverride(nextBins);
      setExtraBins([]);
      setRemovedBinIds([]);

      setConfigPatch((prev) => ({
        ...prev,
        obstacles: (prev.obstacles ?? config.obstacles ?? []).map((o) => {
          const ro = sc(o.xMeters, o.yMeters);
          return { ...o, xMeters: ro.nx, yMeters: ro.ny };
        }),
        interiorProps: (prev.interiorProps ?? config.interiorProps ?? []).map(
          (p) => {
            const rp = sc(p.xMeters, p.yMeters);
            return { ...p, xMeters: rp.nx, yMeters: rp.ny };
          }
        ),
      }));
    },
    [bins, config]
  );

  // Center the ENTIRE template layout back to the default floor center
  const handleCenterWholeTemplate = useCallback(() => {
    if (bins.length === 0) return;
    const minX = Math.min(...bins.map((b) => b.xMeters));
    const minY = Math.min(...bins.map((b) => b.yMeters));
    handleTranslateWholeTemplate(-minX, 1.8 - minY);
  }, [bins, handleTranslateWholeTemplate]);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => {
      const next: LangCode = prev === 'ko' ? 'en' : 'ko';
      try {
        localStorage.setItem(LANG_STORAGE_KEY, next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const handleCreateCustomHomeSpace = useCallback(
    (params: {
      floorWidthM: number;
      floorDepthM: number;
      levels: number;
      shelfTier: 'small' | 'medium' | 'large';
    }) => {
      const tierSpecs = {
        small: { l: 75, w: 50, h: 42, aisleSp: 2.1, baySp: 1.0 },
        medium: { l: 95, w: 65, h: 52, aisleSp: 2.5, baySp: 1.2 },
        large: { l: 120, w: 90, h: 70, aisleSp: 3.4, baySp: 1.45 },
      }[params.shelfTier];

      const aisles = Math.max(
        1,
        Math.min(6, Math.floor((params.floorWidthM - 1.2) / tierSpecs.aisleSp) + 1)
      );
      const bays = Math.max(
        2,
        Math.min(9, Math.floor((params.floorDepthM - 2.2) / tierSpecs.baySp) + 1)
      );
      setConfigPatch({
        aisles,
        baysPerAisle: bays,
        levels: params.levels,
        aisleSpacingM: tierSpecs.aisleSp,
        baySpacingM: tierSpecs.baySp,
        binLengthCm: tierSpecs.l,
        binWidthCm: tierSpecs.w,
        binHeightCm: tierSpecs.h,
        floorWidthM: params.floorWidthM,
        floorDepthM: params.floorDepthM,
        obstacles: [],
        disabledBinIds: [],
        mapTag: `${params.floorWidthM}×${params.floorDepthM}m · Z${params.levels}`,
      });
      setCustomBinsOverride(null);
      setExtraBins([]);
      setRemovedBinIds([]);
      setPinnedPlacements([]);
      setSelectedBinId(null);
      setCameraResetTick((n) => n + 1);
      setAppView('workspace');
    },
    []
  );

  const selectedProp: InteriorProp | null = useMemo(() => {
    if (!selectedPropId) return null;
    return (
      (config.interiorProps ?? []).find((p) => p.id === selectedPropId) ?? null
    );
  }, [config.interiorProps, selectedPropId]);

  const showToast = useCallback((msg: string) => {
    setShortcutToast(msg);
  }, []);

  useEffect(() => {
    if (!shortcutToast) return;
    const timer = window.setTimeout(() => setShortcutToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [shortcutToast]);

  const handleAddInteriorProp = useCallback(
    (type: InteriorPropType) => {
      const cat =
        INTERIOR_PROP_CATALOG.find((c) => c.type === type) ??
        INTERIOR_PROP_CATALOG[0];
      const existing = config.interiorProps ?? [];
      const offsetIdx = existing.length;
      const newProp: InteriorProp = {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        label: lang === 'ko' ? cat.nameKo : cat.nameEn,
        xMeters: Number((-0.8 + (offsetIdx % 4) * 1.4).toFixed(2)),
        yMeters: Number((0.4 + Math.floor(offsetIdx / 4) * 1.3).toFixed(2)),
        rotationDeg: 0,
        scale: 1.0,
        color: cat.defaultColor,
      };
      setConfigPatch((prev) => ({
        ...prev,
        interiorProps: [...(prev.interiorProps ?? config.interiorProps ?? []), newProp],
      }));
      setSelectedPropId(newProp.id);
      setSelectedBinId(null);
      showToast(
        lang === 'ko'
          ? `🛋️ 3D 인테리어 추가됨: ${newProp.label} (드래그·방향키로 이동)`
          : `🛋️ Added 3D Interior: ${newProp.label} (Drag or Arrow keys to move)`
      );
    },
    [config.interiorProps, lang, showToast]
  );

  const handleUpdateInteriorProp = useCallback(
    (id: string, patch: Partial<InteriorProp>) => {
      setConfigPatch((prev) => ({
        ...prev,
        interiorProps: (prev.interiorProps ?? config.interiorProps ?? []).map(
          (p) => (p.id === id ? { ...p, ...patch } : p)
        ),
      }));
    },
    [config.interiorProps]
  );

  const handleDuplicateInteriorProp = useCallback(
    (id: string) => {
      const src = (config.interiorProps ?? []).find((p) => p.id === id);
      if (!src) return;
      const copy: InteriorProp = {
        ...src,
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        xMeters: Number((src.xMeters + 0.75).toFixed(2)),
        yMeters: Number((src.yMeters + 0.5).toFixed(2)),
      };
      setConfigPatch((prev) => ({
        ...prev,
        interiorProps: [...(prev.interiorProps ?? config.interiorProps ?? []), copy],
      }));
      setSelectedPropId(copy.id);
    },
    [config.interiorProps]
  );

  const handleDeleteInteriorProp = useCallback(
    (id: string) => {
      setConfigPatch((prev) => ({
        ...prev,
        interiorProps: (prev.interiorProps ?? config.interiorProps ?? []).filter(
          (p) => p.id !== id
        ),
      }));
      setSelectedPropId((curr) => (curr === id ? null : curr));
    },
    [config.interiorProps]
  );

  const handleAutoPopulateInterior = useCallback(() => {
    const aisleSp = config.aisleSpacingM ?? 3.4;
    const baySp = config.baySpacingM ?? 1.45;
    const maxX = (config.aisles - 1) * aisleSp;
    const maxZ = 1.8 + (config.baysPerAisle - 1) * baySp;
    const autoList: InteriorProp[] = [
      {
        id: `prop-auto-1-${Date.now()}`,
        type: 'desk_work',
        label: lang === 'ko' ? '책상 & 모니터 작업대' : 'Study & Packing Desk',
        xMeters: Number((maxX + 1.8).toFixed(2)),
        yMeters: 0.8,
        rotationDeg: 270,
        scale: 1,
        color: '#b45309',
      },
      {
        id: `prop-auto-2-${Date.now()}`,
        type: 'sofa_lounge',
        label: lang === 'ko' ? '패브릭 소파·휴식존' : 'Cozy Lounge Sofa',
        xMeters: -1.4,
        yMeters: Number((maxZ * 0.45).toFixed(2)),
        rotationDeg: 90,
        scale: 1,
        color: '#6366f1',
      },
      {
        id: `prop-auto-3-${Date.now()}`,
        type: 'plant_pot',
        label: lang === 'ko' ? '대형 인테리어 화분' : 'Indoor Monstera Plant',
        xMeters: -1.3,
        yMeters: 0.4,
        rotationDeg: 0,
        scale: 1.1,
        color: '#10b981',
      },
      {
        id: `prop-auto-4-${Date.now()}`,
        type: 'door_entry',
        label: lang === 'ko' ? '실내 출입문' : 'Room Entrance Door',
        xMeters: -1.5,
        yMeters: Number((maxZ - 0.5).toFixed(2)),
        rotationDeg: 90,
        scale: 1,
        color: '#92400e',
      },
    ];
    setConfigPatch((prev) => ({
      ...prev,
      roomEnclosure: 'three_walls',
      interiorProps: autoList,
    }));
    setSelectedPropId(autoList[0].id);
    showToast(
      lang === 'ko'
        ? '✨ 맞춤 3D 인테리어(책상·소파·화분·출입문·3면 룸)가 자동 배치되었습니다!'
        : '✨ Auto-populated 3D Room Interior (Desk, Sofa, Plant, Door & 3-Wall Room)!'
    );
  }, [config.aisleSpacingM, config.aisles, config.baySpacingM, config.baysPerAisle, lang, showToast]);

  // Global Keyboard Shortcuts System
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;
      if (key === '1') {
        setCameraPreset('iso');
        showToast(lang === 'ko' ? '⌨️ [1] 3D 입체뷰 전환' : '⌨️ [1] 3D Isometric View');
      } else if (key === '2') {
        setCameraPreset('top');
        showToast(lang === 'ko' ? '⌨️ [2] 2D 평면뷰 전환' : '⌨️ [2] 2D Top-Down View');
      } else if (key === '3') {
        setCameraPreset('elevation');
        showToast(lang === 'ko' ? '⌨️ [3] Z축 정면뷰 전환' : '⌨️ [3] Z-Elevation View');
      } else if (key === 'r' || key === 'R') {
        setCameraPreset('iso');
        setCameraResetTick((n) => n + 1);
        showToast(lang === 'ko' ? '⌨️ [R] 3D 카메라 시점 초기화' : '⌨️ [R] Reset 3D Camera');
      } else if (key === ' ') {
        e.preventDefault();
        setActiveLayout((prev) => {
          const next = prev === 'optimized_3d' ? 'baseline_2d' : 'optimized_3d';
          showToast(
            next === 'optimized_3d'
              ? lang === 'ko'
                ? '⌨️ [Space] 3D 최적화 배치 적용'
                : '⌨️ [Space] Switched to 3D Optimized'
              : lang === 'ko'
                ? '⌨️ [Space] 2D 일반 배치 비교'
                : '⌨️ [Space] Switched to 2D Baseline'
          );
          return next;
        });
      } else if (key === 'm' || key === 'M') {
        setDragMoveMode((prev) => {
          const next = !prev;
          showToast(
            next
              ? lang === 'ko'
                ? '⌨️ [M] 3D 마우스 드래그 이동 모드: 켜짐'
                : '⌨️ [M] 3D Mouse Drag-Move: ON'
              : lang === 'ko'
                ? '⌨️ [M] 3D 마우스 드래그 이동 모드: 꺼짐'
                : '⌨️ [M] 3D Mouse Drag-Move: OFF'
          );
          return next;
        });
      } else if (key === 'i' || key === 'I') {
        setInteriorInitialTab('interior');
        setInteriorModalOpen((v) => !v);
      } else if (key === 'b' || key === 'B') {
        setSceneBgModalOpen((v) => !v);
      } else if (key === 'e' || key === 'E') {
        setMapEditorOpen((v) => !v);
      } else if (key === 't' || key === 'T') {
        setTemplateGalleryOpen((v) => !v);
      } else if (key === 'c' || key === 'C') {
        setCadModalOpen((v) => !v);
      } else if (key === 'g' || key === 'G') {
        setViewLayer((prev) => (prev === 'golden_zone' ? 'slotting' : 'golden_zone'));
        showToast(lang === 'ko' ? '⌨️ [G] 골든존 강조 뷰 전환' : '⌨️ [G] Toggle Golden Zone View');
      } else if (key === 'h' || key === 'H') {
        setViewLayer((prev) => (prev === 'heatmap' ? 'slotting' : 'heatmap'));
        showToast(lang === 'ko' ? '⌨️ [H] 피킹 빈도 히트맵 전환' : '⌨️ [H] Toggle 3D Heatmap');
      } else if (key === 'w' || key === 'W') {
        setAppView((prev) => (prev === 'home' ? 'workspace' : 'home'));
      } else if (key === 'l' || key === 'L') {
        toggleLanguage();
      } else if (key === '?' || key === '/' || key === 'k' || key === 'K') {
        setInteriorInitialTab('shortcuts');
        setInteriorModalOpen((v) => !v);
      } else if (key === '0') {
        setLevelFilter('all');
        showToast(lang === 'ko' ? '⌨️ [0] 전체 Z층 모두 표시' : '⌨️ [0] Show All Z-Levels');
      } else if ((key === '+' || key === '=') && selectedBin) {
        handleAddBinAbove(selectedBin);
        showToast(lang === 'ko' ? `⌨️ [+] ${selectedBin.bin.id} 위 1단 추가` : `⌨️ [+] Added level above ${selectedBin.bin.id}`);
      } else if (key === 'Delete' || key === 'Backspace') {
        if (selectedProp) {
          handleDeleteInteriorProp(selectedProp.id);
          showToast(lang === 'ko' ? `⌨️ [Del] 인테리어 가구 삭제됨` : `⌨️ [Del] Deleted 3D Interior Prop`);
        } else if (selectedBin) {
          handleDeleteBin(selectedBin.bin.id);
          showToast(lang === 'ko' ? `⌨️ [Del] ${selectedBin.bin.id} 칸 삭제됨` : `⌨️ [Del] Deleted Bin ${selectedBin.bin.id}`);
        }
      } else if (key === '[' && selectedProp) {
        handleUpdateInteriorProp(selectedProp.id, {
          rotationDeg: (selectedProp.rotationDeg + 315) % 360,
        });
      } else if (key === ']' && selectedProp) {
        handleUpdateInteriorProp(selectedProp.id, {
          rotationDeg: (selectedProp.rotationDeg + 45) % 360,
        });
      } else if (
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === 'ArrowUp' ||
        key === 'ArrowDown'
      ) {
        const dx = key === 'ArrowLeft' ? -0.25 : key === 'ArrowRight' ? 0.25 : 0;
        const dy = key === 'ArrowUp' ? -0.25 : key === 'ArrowDown' ? 0.25 : 0;
        if (selectedProp) {
          e.preventDefault();
          handleUpdateInteriorProp(selectedProp.id, {
            xMeters: Number((selectedProp.xMeters + dx).toFixed(2)),
            yMeters: Number((selectedProp.yMeters + dy).toFixed(2)),
          });
        } else if (dragMoveMode && dragScope === 'whole_template') {
          e.preventDefault();
          handleTranslateWholeTemplate(dx * 2, dy * 2);
        } else if (selectedBin) {
          e.preventDefault();
          handleMoveRackColumn(
            selectedBin.bin.xMeters,
            selectedBin.bin.yMeters,
            Number((selectedBin.bin.xMeters + dx).toFixed(2)),
            Number((selectedBin.bin.yMeters + dy).toFixed(2))
          );
        } else {
          e.preventDefault();
          handleTranslateWholeTemplate(dx * 2, dy * 2);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    dragMoveMode,
    dragScope,
    handleAddBinAbove,
    handleDeleteBin,
    handleDeleteInteriorProp,
    handleMoveRackColumn,
    handleTranslateWholeTemplate,
    handleUpdateInteriorProp,
    lang,
    selectedBin,
    selectedProp,
    showToast,
    toggleLanguage,
  ]);

  const handleApplyFirebaseConfig = async (cfg: FirebaseRuntimeConfig) => {
    const nextState = await initFirebaseServices(cfg);
    setFirebaseState(nextState);
  };

  const handleSaveSnapshot = async () => {
    setFirestoreNotice('');
    try {
      const id = await saveSlottingSnapshotToFirestore(firebaseState, {
        scenarioName: activeScenario.name,
        equipmentMode,
        baselineKpis: { ...baselineResult.kpis },
        optimizedKpis: { ...optimizedResult.kpis },
        inferenceSource: lastInferenceSource || 'deterministic_engine',
      });
      setFirestoreNotice(`Saved run ${id.slice(0, 8)} to Firestore`);
    } catch (err) {
      setFirestoreNotice(
        err instanceof Error ? err.message : 'Unable to save snapshot'
      );
    }
  };

  const workspaceStyle = {
    '--left-panel-px': `${designSettings.leftPanelPx}px`,
    '--right-panel-px': `${designSettings.rightPanelPx}px`,
  } as CSSProperties;

  return (
    <div
      className="themed-shell flex min-h-screen flex-col"
      data-theme-mode={activeTheme.mode}
    >
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
            style={{
              backgroundColor: activeTheme.accent,
              color: activeTheme.accentText,
            }}
          >
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                CubiSlot 3D
              </h1>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                #BuildHybridAI 2026 · Web/Chrome
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t(lang, 'appSubtitle')} · {activeTheme.name} ·{' '}
              {designSettings.uiScalePct}%
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* App View Mode Switcher: Everyday Home <-> 3D Workspace */}
          <div className="flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950 p-0.5">
            <button
              type="button"
              onClick={() => setAppView('home')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                appView === 'home'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              {t(lang, 'navHome')}
            </button>
            <button
              type="button"
              onClick={() => setAppView('workspace')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                appView === 'workspace'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Boxes className="h-3.5 w-3.5" />
              {t(lang, 'navWorkspace')}
            </button>
          </div>

          {/* Guided 3-Step Flow */}
          <button
            type="button"
            onClick={() => setTemplateGalleryOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-semibold text-slate-100 hover:border-cyan-500/50"
            title="Step 1: Choose from 24 Pro & Everyday Templates"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
            1. {t(lang, 'navTemplates')} ({WAREHOUSE_TEMPLATES.length})
          </button>

          <button
            type="button"
            onClick={() => setMapEditorOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-semibold text-slate-100 hover:border-emerald-500/50"
            title="Step 2: Drag & Resize Space on 2D Free Canvas"
          >
            <MapIcon className="h-3.5 w-3.5 text-emerald-400" />
            2. {t(lang, 'navMapCanvas')}
          </button>

          <button
            type="button"
            onClick={() => setCadModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-medium text-slate-100 hover:border-cyan-500/50"
            title="Step 3: Export 2D CAD Blueprint (.DXF / .SVG)"
          >
            <Ruler className="h-3.5 w-3.5 text-cyan-400" />
            3. {t(lang, 'navCad')}
          </button>

          {/* Language Switcher (Korean / English) */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 hover:border-amber-400/60"
            title="Switch Language (한국어 / English)"
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === 'ko' ? '한국어/EN' : 'EN/한국어'}
          </button>

          {/* Easy / Pro Terminology Toggle */}
          <button
            type="button"
            onClick={() => setSimpleMode((v) => !v)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-300 hover:border-cyan-500/50"
            title="Switch between Easy Everyday labels and Pro Engineering terms"
          >
            {simpleMode ? t(lang, 'easyModeOn') : t(lang, 'proModeOn')}
          </button>

          {/* Instant 24-Theme Switcher + Design & Size Studio */}
          <div
            className="flex items-center overflow-hidden rounded-lg border"
            style={{
              borderColor: activeTheme.accent,
              backgroundColor: activeTheme.surfaceAlt,
            }}
          >
            <button
              type="button"
              onClick={() => cycleTheme(-1)}
              className="px-1.5 py-1.5 hover:opacity-80"
              style={{ color: activeTheme.accent }}
              title="Previous Theme"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <select
              value={designSettings.themeId}
              onChange={(e) =>
                setDesignSettings((prev) => ({
                  ...prev,
                  themeId: e.target.value,
                }))
              }
              className="max-w-[130px] bg-transparent px-1 py-1.5 text-[11px] font-semibold focus:outline-none"
              style={{ color: activeTheme.text }}
              title="Switch among 24 design themes"
            >
              {DESIGN_THEMES.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  style={{
                    backgroundColor: activeTheme.surface,
                    color: activeTheme.text,
                  }}
                >
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => cycleTheme(1)}
              className="px-1.5 py-1.5 hover:opacity-80"
              style={{ color: activeTheme.accent }}
              title="Next Theme"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDesignMenuOpen(true)}
              className="inline-flex items-center gap-1 border-l px-2 py-1.5 font-semibold transition"
              style={{
                borderColor: activeTheme.border,
                backgroundColor: activeTheme.accent,
                color: activeTheme.accentText,
              }}
              title="Open 24-Theme Gallery & UI Size Sliders"
            >
              <Palette className="h-3.5 w-3.5" />
              {t(lang, 'themeSizeBtn')}
            </button>
          </div>

          {!simpleMode && (
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-200 hover:border-cyan-500/40"
              title="Save KPI snapshot to Firestore"
            >
              <CloudUpload className="h-3.5 w-3.5 text-cyan-400" />
              {t(lang, 'saveRun')}
            </button>
          )}

          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium ${
              firebaseState.configured
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            {firebaseState.configured ? t(lang, 'firebaseOk') : t(lang, 'firebaseSetup')}
          </button>
        </div>
      </header>

      {appView === 'home' ? (
        <EverydayHomeView
          lang={lang}
          activeScenario={activeScenario}
          optimizedResult={optimizedResult}
          config={config}
          optimizationPreset={optimizationPreset}
          onChangePreset={setOptimizationPreset}
          onSelectTemplate={(tpl, openWorkspace) => {
            handleSelectScenario(tpl.id);
            if (openWorkspace) setAppView('workspace');
          }}
          onCreateCustomHomeSpace={handleCreateCustomHomeSpace}
          onGoWorkspace={() => setAppView('workspace')}
          onOpenMapCanvas={() => setMapEditorOpen(true)}
        />
      ) : (
        <>
          {/* Clean Single-Line Quick Space Strip + Direct 24-Template Jump */}
          {designSettings.showMapStrip && (
            <section className="theme-surface flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/50 px-4 py-1.5 text-[11px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-cyan-300">
                  {activeScenario.name}
                </span>
                <span className="text-slate-500">·</span>
                <div className="flex overflow-hidden rounded-md border border-slate-700 bg-slate-950 text-[10px]">
                  {(
                    [
                      ['all', t(lang, 'filterAll')],
                      ['pro', t(lang, 'filterPro')],
                      ['everyday', t(lang, 'filterEveryday')],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMapFilter(key)}
                      className={`px-2 py-0.5 ${
                        mapFilter === key
                          ? 'bg-cyan-500/20 font-semibold text-cyan-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <select
                  value={
                    WAREHOUSE_TEMPLATES.some((x) => x.id === scenarioId)
                      ? scenarioId
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) handleSelectScenario(e.target.value);
                  }}
                  className="max-w-[215px] rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-medium text-emerald-300 focus:border-cyan-500 focus:outline-none"
                  title={t(lang, 'allTemplatesJump')}
                >
                  <option value="">{t(lang, 'allTemplatesJump')}</option>
                  {WAREHOUSE_TEMPLATES.filter((tpl) => {
                    if (mapFilter === 'everyday') return tpl.persona === 'everyday';
                    if (mapFilter === 'pro') return tpl.persona === 'professional';
                    return true;
                  }).map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap items-center gap-1">
                  {[...SAMPLE_SCENARIOS, ...customMaps]
                    .filter((sc) => {
                      const isEvery =
                        sc.id.startsWith('everyday') || sc.id.startsWith('tpl-life');
                      if (mapFilter === 'everyday') return isEvery;
                      if (mapFilter === 'pro') return !isEvery;
                      return true;
                    })
                    .map((sc) => {
                      const selected = sc.id === scenarioId;
                      const isCustom = customMaps.some((c) => c.id === sc.id);
                      return (
                        <div
                          key={sc.id}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 transition ${
                            selected
                              ? 'bg-cyan-950/35 font-semibold text-white'
                              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                          }`}
                          style={
                            selected ? { borderColor: activeTheme.accent } : undefined
                          }
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectScenario(sc.id)}
                          >
                            {sc.name.replace(/^Map \d+ · |^Everyday \d+ · /, '')}
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomScenario(sc.id)}
                              className="text-slate-400 hover:text-rose-400"
                              title="Delete custom map"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!simpleMode && (
                  <div className="flex overflow-hidden rounded-md border border-slate-700 bg-slate-950 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEquipmentMode('reach_truck')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 ${
                        equipmentMode === 'reach_truck'
                          ? 'bg-cyan-500/20 font-semibold text-cyan-300'
                          : 'text-slate-400'
                      }`}
                    >
                      <Truck className="h-3 w-3" />
                      Reach
                    </button>
                    <button
                      type="button"
                      onClick={() => setEquipmentMode('asrs_crane')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 ${
                        equipmentMode === 'asrs_crane'
                          ? 'bg-cyan-500/20 font-semibold text-cyan-300'
                          : 'text-slate-400'
                      }`}
                    >
                      <Cpu className="h-3 w-3" />
                      AS/RS
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {firestoreNotice && (
            <div className="border-b border-slate-800 bg-slate-900 px-4 py-1.5 text-right text-[11px] text-cyan-300">
              {firestoreNotice}
            </div>
          )}

          {/* KPI ROI Strip */}
          {designSettings.showKpiBar && (
            <section className="px-4 pt-3">
              <KPIComparisonBar
                baseline={baselineResult}
                optimized={optimizedResult}
                activeLayout={activeLayout}
                goldenZoneMinM={config.goldenZoneMinM}
                goldenZoneMaxM={config.goldenZoneMaxM}
                simpleMode={simpleMode}
                lang={lang}
              />
            </section>
          )}

          {/* Main Resizable 3-Column Digital Twin Workspace */}
          <main className="workspace-grid flex-1 p-4" style={workspaceStyle}>
        {/* Left Panel: Optimizer / Space & Cargo Editor / Bin Inspector */}
        <section className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/90">
          <div className="flex border-b border-slate-800 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setLeftTab('optimizer')}
              className={`flex-1 py-2.5 ${
                leftTab === 'optimizer'
                  ? 'border-b-2 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={
                leftTab === 'optimizer'
                  ? { borderColor: activeTheme.accent }
                  : undefined
              }
            >
              1. {t(lang, 'tabOptimize')}
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('editor')}
              className={`flex-1 py-2.5 ${
                leftTab === 'editor'
                  ? 'border-b-2 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={
                leftTab === 'editor'
                  ? { borderColor: activeTheme.accent }
                  : undefined
              }
            >
              2. {t(lang, 'tabEditSpaceCargo')}
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('inspector')}
              className={`flex-1 py-2.5 ${
                leftTab === 'inspector'
                  ? 'border-b-2 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={
                leftTab === 'inspector'
                  ? { borderColor: activeTheme.accent }
                  : undefined
              }
            >
              3. {t(lang, 'tabInspect')}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 text-xs">
            {leftTab === 'optimizer' ? (
              <SpaceOptimizerPanel
                baseline={baselineResult}
                optimized={optimizedResult}
                zBreakdown={zBreakdown}
                allowRotationAndCoPack={allowRotationAndCoPack}
                onToggleRotationAndCoPack={setAllowRotationAndCoPack}
                goldenPresetId={goldenPresetId}
                onChangeGoldenPreset={setGoldenPresetId}
                levelFilter={levelFilter}
                onChangeLevelFilter={setLevelFilter}
                onJumpToOptimization={() => setActiveLayout('optimized_3d')}
                simpleMode={simpleMode}
                lang={lang}
              />
            ) : leftTab === 'editor' ? (
              <SimulationEditorPanel
                config={config}
                bins={bins}
                extraBinsCount={extraBins.length}
                removedBinsCount={removedBinIds.length}
                skus={skus}
                pinnedPlacements={pinnedPlacements}
                selectedBinId={selectedBinId}
                lang={lang}
                onUpdateConfig={(patch) => {
                  setConfigPatch((prev) => ({ ...prev, ...patch }));
                  if (
                    patch.aisles !== undefined ||
                    patch.baysPerAisle !== undefined ||
                    patch.levels !== undefined
                  ) {
                    setCustomBinsOverride(null);
                  } else if (
                    customBinsOverride !== null &&
                    (patch.binLengthCm !== undefined ||
                      patch.binWidthCm !== undefined ||
                      patch.binHeightCm !== undefined)
                  ) {
                    setCustomBinsOverride((prev) =>
                      prev
                        ? prev.map((b) => ({
                            ...b,
                            binLengthCm: patch.binLengthCm ?? b.binLengthCm,
                            binWidthCm: patch.binWidthCm ?? b.binWidthCm,
                            binHeightCm: patch.binHeightCm ?? b.binHeightCm,
                          }))
                        : null
                    );
                  }
                }}
                onAddBin={handleAddBin}
                onDeleteBin={handleDeleteBin}
                onResetSpaceEdits={() => {
                  setCustomBinsOverride(null);
                  setExtraBins([]);
                  setRemovedBinIds([]);
                }}
                onChangeSkus={(nextSkus) => {
                  setSkus(nextSkus);
                  const validIds = new Set(nextSkus.map((s) => s.id));
                  setPinnedPlacements((prev) =>
                    prev.filter((p) => validIds.has(p.skuId))
                  );
                }}
                onPinCargo={handlePinCargo}
                onClearAllPins={() => setPinnedPlacements([])}
              />
            ) : (
              <BinInspectorPanel
                selectedBin={selectedBin}
                pickRoute={shownResult.pickRoute}
                activeLayout={activeLayout}
                accentColor={activeTheme.accent}
                simpleMode={simpleMode}
                lang={lang}
                onAuditWithAi={(alloc) => {
                  setExternalAiPrompt({
                    id: Date.now(),
                    mode: 'prefer_on_device',
                    prompt: `Audit bin ${alloc.bin.id} (Z${alloc.bin.level}, ${alloc.bin.zMeters}m, cubic=${alloc.cubicUtilizationPct.toFixed(1)}%, load=${alloc.currentWeightKg.toFixed(1)}/${alloc.bin.maxWeightKg}kg). Give concise 3D slotting advice.`,
                  });
                }}
                onDeleteBin={handleDeleteBin}
              />
            )}
          </div>
        </section>

        {/* Center Panel: 3D Digital Twin Viewport */}
        <section
          className="relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
          style={{ minHeight: `${designSettings.viewportMinHeightPx}px` }}
        >
          {/* Viewport Overlay Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-3 py-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                <button
                  type="button"
                  onClick={() => setActiveLayout('baseline_2d')}
                  className={`px-2.5 py-1 ${
                    activeLayout === 'baseline_2d'
                      ? 'bg-rose-500/20 font-semibold text-rose-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t(lang, 'before2d')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLayout('optimized_3d')}
                  className={`px-2.5 py-1 ${
                    activeLayout === 'optimized_3d'
                      ? 'bg-emerald-500/20 font-semibold text-emerald-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t(lang, 'after3d')}
                </button>
              </div>

              {/* 1-Click 3D Optimization Goal Switcher */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/90 px-1.5 py-0.5 text-[10px]">
                <span className="font-semibold text-slate-400">
                  {t(lang, 'optGoalLabel')}
                </span>
                {(
                  [
                    ['balanced', t(lang, 'goalBalanced')],
                    ['speed', t(lang, 'goalSpeed')],
                    ['density', t(lang, 'goalDensity')],
                    ['safety', t(lang, 'goalSafety')],
                  ] as const
                ).map(([preset, label]) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setOptimizationPreset(preset);
                      setActiveLayout('optimized_3d');
                    }}
                    className={`rounded px-1.5 py-0.5 font-medium transition ${
                      optimizationPreset === preset && activeLayout === 'optimized_3d'
                        ? 'bg-emerald-500/25 text-emerald-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewLayer('slotting')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${
                  viewLayer === 'slotting'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Layers className="h-3 w-3" />
                {t(lang, 'view3dPack')}
              </button>
              <button
                type="button"
                onClick={() => setViewLayer('heatmap')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${
                  viewLayer === 'heatmap'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Flame className="h-3 w-3" />
                {t(lang, 'view3dHeatmap')}
              </button>
              <button
                type="button"
                onClick={() => setViewLayer('golden_zone')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${
                  viewLayer === 'golden_zone'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                {t(lang, 'view3dGolden')}
              </button>

              {/* 1-Click 3D Space Interior & Furniture Builder Button */}
              <button
                type="button"
                onClick={() => {
                  setInteriorInitialTab('interior');
                  setInteriorModalOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-1 font-semibold text-emerald-200 hover:bg-emerald-500/30"
                title={
                  lang === 'ko'
                    ? '3D 공간 인테리어·가구·창문·출입문 배치 스튜디오 열기 (단축키 I)'
                    : 'Open 3D Space Interior & Furniture Studio (Shortcut: I)'
                }
              >
                <Home className="h-3.5 w-3.5 text-emerald-300" />
                {lang === 'ko' ? '3D 인테리어' : '3D Interior'}
              </button>

              {/* 1-Click 3D Background Studio Editor Button */}
              <button
                type="button"
                onClick={() => setSceneBgModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-amber-400/50 bg-amber-500/20 px-2.5 py-1 font-semibold text-amber-200 hover:bg-amber-500/30"
                title={
                  lang === 'ko'
                    ? '3D 배경 색상·밝기·조명·바닥 재질 에디터 열기 (단축키 B)'
                    : 'Open 3D Background & Lighting Studio Editor (Shortcut: B)'
                }
              >
                <Sun className="h-3.5 w-3.5 text-amber-300" />
                {lang === 'ko' ? '3D 배경·조명' : '3D Background'}
              </button>

              {/* Keyboard Shortcuts Help Button */}
              <button
                type="button"
                onClick={() => {
                  setInteriorInitialTab('shortcuts');
                  setInteriorModalOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 font-semibold text-cyan-300 hover:border-cyan-400"
                title={
                  lang === 'ko'
                    ? '키보드 단축키 안내 열기 (단축키 ? 또는 K)'
                    : 'Open Keyboard Shortcuts Guide (Shortcut: ? or K)'
                }
              >
                <Keyboard className="h-3.5 w-3.5" />
                {lang === 'ko' ? '단축키' : 'Keys'}
              </button>
            </div>
          </div>

          {/* Easy Direct 3D Edit Dock + Whole-Template 3D Drag & Transform Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950/80 px-3 py-1.5 text-[10px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-cyan-300">
                {t(lang, 'quickEditBarLabel')}:
              </span>

              {/* 3D Drag Mode + Scope Switcher: Whole Template vs Single Rack */}
              <div className="flex items-center overflow-hidden rounded-md border border-slate-700 bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    if (dragMoveMode && dragScope === 'whole_template') {
                      setDragMoveMode(false);
                    } else {
                      setDragMoveMode(true);
                      setDragScope('whole_template');
                      showToast(
                        lang === 'ko'
                          ? '🌐 전체 템플릿 3D 드래그 이동 켜짐: 마우스로 선반을 끌어 템플릿 전체를 이동하세요!'
                          : '🌐 Whole-Template 3D Drag Move ON: Drag any rack in 3D to move the entire template!'
                      );
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 font-semibold transition ${
                    dragMoveMode && dragScope === 'whole_template'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-emerald-300 hover:bg-slate-800'
                  }`}
                  title={
                    lang === 'ko'
                      ? '3D 화면에서 마우스로 드래그하여 템플릿 전체(선반·장애물·가구·입출고장)를 한꺼번에 이동합니다'
                      : 'Drag anywhere on the racks in 3D to move the entire template layout together'
                  }
                >
                  <Move className="h-3 w-3" />
                  {lang === 'ko'
                    ? dragMoveMode && dragScope === 'whole_template'
                      ? '🌐 전체 템플릿 드래그 중 ✓'
                      : '🌐 전체 템플릿 드래그 이동'
                    : dragMoveMode && dragScope === 'whole_template'
                      ? '🌐 Whole Template Drag: ON'
                      : '🌐 Move Whole Template'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (dragMoveMode && dragScope === 'column') {
                      setDragMoveMode(false);
                    } else {
                      setDragMoveMode(true);
                      setDragScope('column');
                      showToast(
                        lang === 'ko'
                          ? '📦 개별 선반 기둥 3D 드래그 이동 켜짐'
                          : '📦 Single Rack Column 3D Drag Move ON'
                      );
                    }
                  }}
                  className={`border-l border-slate-700 px-2 py-0.5 font-semibold transition ${
                    dragMoveMode && dragScope === 'column'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {lang === 'ko' ? '개별 선반 이동' : 'Single Rack'}
                </button>
              </div>

              {/* Whole-Template 1-Click Transform Controls (Move / Rotate 90° / Spacing / Center) */}
              <div className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/30 px-1.5 py-0.5">
                <span className="font-semibold text-emerald-300">
                  {lang === 'ko' ? '전체 수정:' : 'Template:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleTranslateWholeTemplate(-0.5, 0)}
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                  title={lang === 'ko' ? '전체 좌측 0.5m 이동' : 'Move All Left 0.5m'}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => handleTranslateWholeTemplate(0.5, 0)}
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                  title={lang === 'ko' ? '전체 우측 0.5m 이동' : 'Move All Right 0.5m'}
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => handleTranslateWholeTemplate(0, -0.5)}
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                  title={lang === 'ko' ? '전체 전면 0.5m 이동' : 'Move All Front 0.5m'}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleTranslateWholeTemplate(0, 0.5)}
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                  title={lang === 'ko' ? '전체 후면 0.5m 이동' : 'Move All Back 0.5m'}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRotateWholeTemplate90();
                    showToast(
                      lang === 'ko'
                        ? '↻ 전체 템플릿 90° 회전 완료'
                        : '↻ Rotated Whole Template 90°'
                    );
                  }}
                  className="inline-flex items-center gap-0.5 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 text-emerald-300 hover:border-emerald-400"
                  title={lang === 'ko' ? '전체 템플릿 90° 회전' : 'Rotate Whole Template 90°'}
                >
                  <RotateCw className="h-2.5 w-2.5" />
                  90°
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleWholeTemplateSpacing(1.12)}
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                  title={lang === 'ko' ? '전체 선반 간격 넓히기 (+12%)' : 'Expand Template Spacing (+12%)'}
                >
                  {lang === 'ko' ? '간격+' : 'Span+'}
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleWholeTemplateSpacing(0.88)}
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                  title={lang === 'ko' ? '전체 선반 간격 좁히기 (-12%)' : 'Compact Template Spacing (-12%)'}
                >
                  {lang === 'ko' ? '간격-' : 'Span-'}
                </button>
                <button
                  type="button"
                  onClick={handleCenterWholeTemplate}
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 text-cyan-300 hover:border-cyan-400"
                  title={lang === 'ko' ? '전체 템플릿 중앙 정렬' : 'Center Whole Template'}
                >
                  {lang === 'ko' ? '중앙정렬' : 'Center'}
                </button>
              </div>

              {selectedBin ? (
                <>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-white">
                    {selectedBin.bin.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddBinAbove(selectedBin)}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300 hover:bg-emerald-500/25"
                  >
                    <Plus className="h-3 w-3" />
                    {t(lang, 'quickAddLevel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBin(selectedBin.bin.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-300 hover:bg-rose-500/25"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t(lang, 'quickDeleteBin')}
                  </button>
                  {skus[0] && (
                    <button
                      type="button"
                      onClick={() =>
                        handlePinCargo(selectedBin.bin.id, skus[0].id, 1)
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 font-semibold text-cyan-300 hover:bg-cyan-500/25"
                    >
                      <Pin className="h-3 w-3" />
                      {skus[0].skuCode} {t(lang, 'quickPinTopSku')}
                    </button>
                  )}
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Instant 1-Click 3D Background Brightness Pills */}
              <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5">
                <Sun className="h-3 w-3 text-amber-400" />
                {[
                  ['daylight-studio', lang === 'ko' ? '밝은스튜디오' : 'Daylight'],
                  ['warm-home', lang === 'ko' ? '따뜻한홈' : 'Warm Home'],
                  ['pure-white', lang === 'ko' ? '화이트쇼룸' : 'White'],
                  ['cyber-night', lang === 'ko' ? '다크트윈' : 'Dark'],
                ].map(([pid, label]) => (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => {
                      const found = SCENE_3D_PRESETS.find((x) => x.id === pid);
                      if (found) {
                        setSceneBg((prev) => ({
                          ...prev,
                          presetId: found.id,
                          ...found.settings,
                        }));
                      }
                    }}
                    className={`rounded px-1.5 py-0.5 font-medium ${
                      sceneBg.presetId === pid
                        ? 'bg-amber-500/25 text-amber-200 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {pinnedPlacements.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPinnedPlacements([])}
                  className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-300 hover:bg-amber-500/25"
                >
                  {t(lang, 'quickClearPins')} ({pinnedPlacements.length})
                </button>
              )}
              {(extraBins.length > 0 ||
                removedBinIds.length > 0 ||
                customBinsOverride !== null) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomBinsOverride(null);
                    setExtraBins([]);
                    setRemovedBinIds([]);
                    setPinnedPlacements([]);
                  }}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-300 hover:border-cyan-400"
                >
                  {t(lang, 'quickResetBins')}
                </button>
              )}
            </div>
          </div>

          <div className="relative flex-1">
            {/* Keyboard Shortcut Feedback Toast */}
            {shortcutToast && (
              <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-cyan-400/60 bg-slate-950/90 px-4 py-1.5 text-xs font-bold text-cyan-200 shadow-2xl backdrop-blur">
                {shortcutToast}
              </div>
            )}

            {/* On-Screen Selected 3D Interior Furniture Quick Edit Floating Bar */}
            {selectedProp && (
              <div className="absolute left-1/2 top-12 z-20 flex -translate-x-1/2 flex-wrap items-center gap-1.5 rounded-xl border border-emerald-400/60 bg-slate-950/95 px-3 py-1.5 text-[11px] text-slate-100 shadow-2xl backdrop-blur">
                <span className="font-bold text-emerald-300">
                  🛋️ {selectedProp.label}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateInteriorProp(selectedProp.id, {
                      xMeters: Number((selectedProp.xMeters - 0.25).toFixed(2)),
                    })
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-cyan-400"
                  title="Left (ArrowLeft)"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateInteriorProp(selectedProp.id, {
                      xMeters: Number((selectedProp.xMeters + 0.25).toFixed(2)),
                    })
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-cyan-400"
                  title="Right (ArrowRight)"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateInteriorProp(selectedProp.id, {
                      yMeters: Number((selectedProp.yMeters - 0.25).toFixed(2)),
                    })
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-cyan-400"
                  title="Front (ArrowUp)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateInteriorProp(selectedProp.id, {
                      yMeters: Number((selectedProp.yMeters + 0.25).toFixed(2)),
                    })
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-cyan-400"
                  title="Back (ArrowDown)"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateInteriorProp(selectedProp.id, {
                      rotationDeg: (selectedProp.rotationDeg + 45) % 360,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 hover:border-cyan-400"
                  title="Rotate 45° (])"
                >
                  <RotateCw className="h-3 w-3 text-cyan-300" />
                  {selectedProp.rotationDeg}°
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextScale =
                      selectedProp.scale >= 1.6
                        ? 0.8
                        : Number((selectedProp.scale + 0.2).toFixed(1));
                    handleUpdateInteriorProp(selectedProp.id, {
                      scale: nextScale,
                    });
                  }}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 hover:border-cyan-400"
                >
                  {selectedProp.scale.toFixed(1)}x
                </button>
                <input
                  type="color"
                  value={selectedProp.color}
                  onChange={(e) =>
                    handleUpdateInteriorProp(selectedProp.id, {
                      color: e.target.value,
                    })
                  }
                  className="h-5 w-6 cursor-pointer border-0 bg-transparent"
                  title="Color"
                />
                <button
                  type="button"
                  onClick={() => handleDuplicateInteriorProp(selectedProp.id)}
                  className="rounded border border-slate-700 bg-slate-900 p-1 hover:border-cyan-400"
                  title="Duplicate"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteInteriorProp(selectedProp.id)}
                  className="rounded border border-rose-500/40 bg-rose-500/20 p-1 text-rose-300 hover:bg-rose-500/30"
                  title="Delete (Del)"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPropId(null)}
                  className="ml-1 text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}

            <Warehouse3DViewport
              allocations={shownResult.allocations}
              pickRoute={shownResult.pickRoute}
              config={config}
              scenarioName={activeScenario.name}
              viewLayer={viewLayer}
              selectedBinId={selectedBinId}
              selectedPropId={selectedPropId}
              levelFilter={levelFilter}
              theme={activeTheme}
              sceneBg={sceneBg}
              onSelectBin={handleSelectBin}
              onSelectProp={setSelectedPropId}
              onContextAction={setContextMenu}
              dragMoveMode={dragMoveMode}
              dragScope={dragScope}
              onMoveRackColumn={handleMoveRackColumn}
              onMoveWholeTemplate={handleTranslateWholeTemplate}
              onMoveInteriorProp={(propId, nx, ny) =>
                handleUpdateInteriorProp(propId, { xMeters: nx, yMeters: ny })
              }
              cameraPreset={cameraPreset}
              cameraResetTick={cameraResetTick}
              animateRoute={animateRoute}
              lang={lang}
            />

            {/* Floating Camera, Z-Slice & Route Controls */}
            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 p-1.5 text-[10px] backdrop-blur">
              <button
                type="button"
                onClick={() => setCameraPreset('iso')}
                className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
                  cameraPreset === 'iso'
                    ? 'bg-slate-800 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="h-3 w-3" />
                {lang === 'ko' ? '3D 입체뷰' : '3D Iso'}
              </button>
              <button
                type="button"
                onClick={() => setCameraPreset('top')}
                className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
                  cameraPreset === 'top'
                    ? 'bg-slate-800 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="h-3 w-3" />
                {lang === 'ko' ? '2D 평면뷰' : '2D Top'}
              </button>
              <button
                type="button"
                onClick={() => setCameraPreset('elevation')}
                className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
                  cameraPreset === 'elevation'
                    ? 'bg-slate-800 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <RotateCcw className="h-3 w-3" />
                {lang === 'ko' ? 'Z축 정면뷰' : 'Z-Elevation'}
              </button>
              <button
                type="button"
                onClick={() => setAnimateRoute((v) => !v)}
                className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
                  animateRoute
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Play className="h-3 w-3" />
                {animateRoute
                  ? lang === 'ko'
                    ? '동선 표시: 켜짐'
                    : 'Route On'
                  : lang === 'ko'
                    ? '동선 표시: 꺼짐'
                    : 'Route Off'}
              </button>
              <button
                type="button"
                onClick={() => setDragMoveMode((v) => !v)}
                className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
                  dragMoveMode
                    ? 'bg-cyan-500/25 font-semibold text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Drag any 3D rack column with your mouse to relocate it"
              >
                <Move className="h-3 w-3" />
                {dragMoveMode
                  ? lang === 'ko'
                    ? '3D 이동: 켜짐'
                    : '3D Drag: ON'
                  : lang === 'ko'
                    ? '3D 위치 이동'
                    : 'Move 3D'}
              </button>

              {/* Inline Z-Level Quick Slicer Pills directly inside the 3D Studio */}
              <div className="flex items-center gap-0.5 border-l border-slate-700 pl-1.5">
                <button
                  type="button"
                  onClick={() => setLevelFilter('all')}
                  className={`rounded px-1.5 py-0.5 font-semibold ${
                    levelFilter === 'all'
                      ? 'bg-cyan-500/25 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'ko' ? '전층' : 'All'}
                </button>
                {zBreakdown.map((z) => (
                  <button
                    key={z.level}
                    type="button"
                    onClick={() =>
                      setLevelFilter(levelFilter === z.level ? 'all' : z.level)
                    }
                    className={`rounded px-1.5 py-0.5 font-medium ${
                      levelFilter === z.level
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : z.isGoldenZone
                          ? 'text-emerald-300 hover:bg-slate-800'
                          : 'text-slate-400 hover:bg-slate-800'
                    }`}
                    title={`Z${z.level} (${z.zMeters}m)`}
                  >
                    Z{z.level}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="absolute right-3 top-3 rounded-lg border border-slate-800 bg-slate-900/85 px-2.5 py-2 text-[10px] text-slate-300 backdrop-blur">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: activeTheme.scene.golden }}
                />
                {lang === 'ko'
                  ? `골든존 허리높이 (${config.goldenZoneMinM}m–${config.goldenZoneMaxM}m)`
                  : `Golden Zone (${config.goldenZoneMinM}m–${config.goldenZoneMaxM}m)`}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: activeTheme.scene.route }}
                />
                {lang === 'ko' ? '최적 피킹 이동 동선' : 'Active Pick Wave Path'}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                {lang === 'ko'
                  ? '상층 중량물 안전 위험'
                  : 'Heavy-on-Upper Violation'}
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel: Firebase AI Logic Hybrid Co-Pilot */}
        <section className="min-h-[420px]">
          <HybridAICopilotPanel
            firebaseState={firebaseState}
            nanoDiag={nanoDiag}
            baseline={baselineResult}
            optimized={optimizedResult}
            config={config}
            selectedBin={selectedBin}
            externalPromptRequest={externalAiPrompt}
            onLastInferenceSource={setLastInferenceSource}
            lang={lang}
          />
        </section>
      </main>
        </>
      )}

      <ViewportContextMenu
        menu={contextMenu}
        skus={skus}
        levelFilter={levelFilter}
        activeLayout={activeLayout}
        lang={lang}
        onClose={() => setContextMenu(null)}
        onInspectBin={(alloc) => {
          setSelectedBinId(alloc.bin.id);
          setLeftTab('inspector');
        }}
        onPinSkuToBin={(binId, skuId) => handlePinCargo(binId, skuId, 1)}
        onClearBinPins={(binId) =>
          setPinnedPlacements((prev) => prev.filter((p) => p.binId !== binId))
        }
        onAddBinAbove={handleAddBinAbove}
        onAddBinAtFloor={handleAddBinAtFloor}
        onDeleteBin={handleDeleteBin}
        onToggleLevelSlice={setLevelFilter}
        onAuditBinWithAi={(alloc) => {
          setSelectedBinId(alloc.bin.id);
          setExternalAiPrompt({
            id: Date.now(),
            mode: 'prefer_on_device',
            prompt: `Audit bin ${alloc.bin.id} (Z${alloc.bin.level}, ${alloc.bin.zMeters}m, cubic=${alloc.cubicUtilizationPct.toFixed(1)}%, load=${alloc.currentWeightKg.toFixed(1)}/${alloc.bin.maxWeightKg}kg). Recommend exact 3D slotting improvements.`,
          });
        }}
        onOpenCadExport={() => setCadModalOpen(true)}
        onOpenMapEditor={() => setMapEditorOpen(true)}
        onOpenEditor={() => setLeftTab('editor')}
        onChangeViewLayer={setViewLayer}
        onToggleLayout={() =>
          setActiveLayout((l) =>
            l === 'optimized_3d' ? 'baseline_2d' : 'optimized_3d'
          )
        }
        onResetCamera={() => {
          setCameraPreset('iso');
          setCameraResetTick((t) => t + 1);
        }}
      />

      <TemplateGalleryModal
        open={templateGalleryOpen}
        onClose={() => setTemplateGalleryOpen(false)}
        activeTemplateId={scenarioId}
        onSelectTemplate={(tpl) => {
          handleSelectScenario(tpl.id);
        }}
        lang={lang}
      />

      <MapEditorModal
        open={mapEditorOpen}
        onClose={() => setMapEditorOpen(false)}
        config={config}
        bins={bins}
        scenario={activeScenario}
        onApplyMapEdits={({ configPatch: nextPatch, customBins }) => {
          setConfigPatch((prev) => ({ ...prev, ...nextPatch }));
          setCustomBinsOverride(customBins);
          setRemovedBinIds([]);
          setExtraBins([]);
          setSelectedBinId(null);
          setCameraResetTick((t) => t + 1);
        }}
        onSaveCustomScenario={handleSaveCustomScenario}
      />

      <CadPreviewModal
        open={cadModalOpen}
        onClose={() => setCadModalOpen(false)}
        result={shownResult}
        config={config}
        scenarioName={activeScenario.name}
        lang={lang}
      />

      <DesignStudioMenu
        open={designMenuOpen}
        onClose={() => setDesignMenuOpen(false)}
        settings={designSettings}
        onChange={setDesignSettings}
        lang={lang}
      />

      <Scene3DBackgroundModal
        open={sceneBgModalOpen}
        onClose={() => setSceneBgModalOpen(false)}
        settings={sceneBg}
        onChange={setSceneBg}
        lang={lang}
      />

      <InteriorStudioModal
        open={interiorModalOpen}
        initialTab={interiorInitialTab}
        onClose={() => setInteriorModalOpen(false)}
        lang={lang}
        interiorProps={config.interiorProps ?? []}
        selectedPropId={selectedPropId}
        roomEnclosure={config.roomEnclosure ?? 'cutaway_corner'}
        wallColor={config.wallColor ?? '#b45309'}
        onSelectProp={setSelectedPropId}
        onAddProp={handleAddInteriorProp}
        onUpdateProp={handleUpdateInteriorProp}
        onDuplicateProp={handleDuplicateInteriorProp}
        onDeleteProp={handleDeleteInteriorProp}
        onClearProps={() => {
          setConfigPatch((prev) => ({ ...prev, interiorProps: [] }));
          setSelectedPropId(null);
        }}
        onAutoPopulateInterior={handleAutoPopulateInterior}
        onChangeRoomEnclosure={(style: RoomEnclosureStyle) =>
          setConfigPatch((prev) => ({ ...prev, roomEnclosure: style }))
        }
        onChangeWallColor={(color: string) =>
          setConfigPatch((prev) => ({ ...prev, wallColor: color }))
        }
      />

      <FirebaseSetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onApplyConfig={handleApplyFirebaseConfig}
        lang={lang}
      />
    </div>
  );
}

export default App;
