import {
  type CSSProperties,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Camera,
  Compass,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Home,
  Keyboard,
  Layers,
  Lock,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Move,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Route,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  Unlock,
} from 'lucide-react';
import { DESIGN_THEMES } from './data/designThemes';
import { SAMPLE_SCENARIOS } from './data/sampleScenarios';
import { WAREHOUSE_TEMPLATES } from './data/warehouseTemplates';
import { type LangCode, t } from './i18n/translations';
import {
  computeZLevelBreakdown,
  generateWarehouseBins,
  resolveShelfCollisions3D,
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
  type HybridAIAction,
  type HybridModeChoice,
  checkChromeGeminiNanoStatus,
} from './services/hybridAi';
import type {
  BinAllocation,
  BinSpec,
  DragScope,
  EquipmentMode,
  InteriorProp,
  OptimizationPreset,
  PinnedCargoPlacement,
  RoomEnclosureStyle,
  SKUItem,
  SelectedCargoBox,
  ViewLayerMode,
  WarehouseConfig,
  WarehouseObstacle,
  WarehouseScenario,
} from './types/warehouse';
import { useWarehouseShortcuts } from './hooks/useWarehouseShortcuts';
import { useWarehouseTransforms } from './hooks/useWarehouseTransforms';
import { getEffectiveInteriorProps } from './utils/threeContentBuilder';
import { generateWarehouseSVG } from './utils/cadExporter';
import {
  exportSkusToCSV,
  exportSlottingResultToCSV,
} from './utils/csvExporter';
import {
  type WorkspaceHistorySnapshot,
  loadCustomMaps,
  loadDesignSettings,
  loadLang,
  loadSavedWorkspaceSession,
  loadScene3DBg,
  saveCustomMaps,
  saveDesignSettings,
  saveLang,
  saveScene3DBg,
  saveWorkspaceSession,
} from './utils/workspaceStorage';
import { TopHeaderBar } from './components/TopHeaderBar';
import { WorkspaceQuickStrip } from './components/WorkspaceQuickStrip';
import { Warehouse3DViewport } from './components/Warehouse3DViewport';
import { KPIComparisonBar } from './components/KPIComparisonBar';
import { HybridAICopilotPanel } from './components/HybridAICopilotPanel';
import {
  GOLDEN_ZONE_PRESETS,
  SpaceOptimizerPanel,
} from './components/SpaceOptimizerPanel';
import {
  type DesignLayoutSettings,
  DesignStudioMenu,
} from './components/DesignStudioMenu';
import { SimulationEditorPanel } from './components/SimulationEditorPanel';
import { BinInspectorPanel } from './components/BinInspectorPanel';
import { EverydayHomeView } from './components/EverydayHomeView';
import {
  INTERIOR_PROP_CATALOG,
  InteriorStudioModal,
} from './components/InteriorStudioModal';
import {
  SCENE_3D_PRESETS,
  Scene3DBackgroundModal,
  type Scene3DBackgroundSettings,
} from './components/Scene3DBackgroundModal';
import {
  ViewportContextMenu,
  type ViewportContextState,
} from './components/ViewportContextMenu';
import { Plan2DBoxInspectorModal } from './components/Plan2DBoxInspectorModal';

const CadPreviewModal = lazy(() =>
  import('./components/CadPreviewModal').then((m) => ({
    default: m.CadPreviewModal,
  }))
);
const MapEditorModal = lazy(() =>
  import('./components/MapEditorModal').then((m) => ({
    default: m.MapEditorModal,
  }))
);
const TemplateGalleryModal = lazy(() =>
  import('./components/TemplateGalleryModal').then((m) => ({
    default: m.TemplateGalleryModal,
  }))
);
const FirebaseSetupModal = lazy(() =>
  import('./components/FirebaseSetupModal').then((m) => ({
    default: m.FirebaseSetupModal,
  }))
);

export function App() {
  const [customMaps, setCustomMaps] = useState<WarehouseScenario[]>(loadCustomMaps);
  const allScenarios = useMemo(
    () => [...SAMPLE_SCENARIOS, ...WAREHOUSE_TEMPLATES, ...customMaps],
    [customMaps]
  );

  const initialSession = useMemo(() => loadSavedWorkspaceSession(), []);
  const defaultScenario =
    SAMPLE_SCENARIOS.find((s) => s.id === 'everyday-home-pantry') ??
    SAMPLE_SCENARIOS[0];

  const [scenarioId, setScenarioId] = useState(
    initialSession?.scenarioId ?? defaultScenario.id
  );
  const activeScenario = useMemo(
    () =>
      allScenarios.find((s) => s.id === scenarioId) ?? defaultScenario,
    [allScenarios, scenarioId, defaultScenario]
  );

  const [skus, setSkus] = useState<SKUItem[]>(
    initialSession?.skus && initialSession.skus.length > 0
      ? initialSession.skus
      : activeScenario.skus
  );
  const [configPatch, setConfigPatch] = useState<Partial<WarehouseConfig>>(
    initialSession?.configPatch ?? {}
  );
  const [customBinsOverride, setCustomBinsOverride] = useState<BinSpec[] | null>(
    initialSession?.customBinsOverride ?? null
  );
  const [extraBins, setExtraBins] = useState<BinSpec[]>(
    initialSession?.extraBins ?? []
  );
  const [removedBinIds, setRemovedBinIds] = useState<string[]>(
    initialSession?.removedBinIds ?? []
  );
  const [pinnedPlacements, setPinnedPlacements] = useState<
    PinnedCargoPlacement[]
  >(initialSession?.pinnedPlacements ?? []);
  const [undoStack, setUndoStack] = useState<WorkspaceHistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<WorkspaceHistorySnapshot[]>([]);
  const lastUndoPushMsRef = useRef<number>(0);

  useEffect(() => {
    saveWorkspaceSession({
      scenarioId,
      skus,
      configPatch,
      customBinsOverride,
      extraBins,
      removedBinIds,
      pinnedPlacements,
    });
  }, [
    scenarioId,
    skus,
    configPatch,
    customBinsOverride,
    extraBins,
    removedBinIds,
    pinnedPlacements,
  ]);

  const pushWorkspaceUndo = useCallback(() => {
    const now = performance.now();
    if (now - lastUndoPushMsRef.current < 350) {
      return;
    }
    lastUndoPushMsRef.current = now;
    setUndoStack((prev) => [
      ...prev.slice(-24),
      {
        skus,
        configPatch,
        customBinsOverride,
        extraBins,
        removedBinIds,
        pinnedPlacements,
      },
    ]);
    setRedoStack([]);
  }, [
    skus,
    configPatch,
    customBinsOverride,
    extraBins,
    removedBinIds,
    pinnedPlacements,
  ]);

  const handleWorkspaceUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    lastUndoPushMsRef.current = 0;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((r) => [
      ...r.slice(-24),
      {
        skus,
        configPatch,
        customBinsOverride,
        extraBins,
        removedBinIds,
        pinnedPlacements,
      },
    ]);
    setSkus(last.skus);
    setConfigPatch(last.configPatch);
    setCustomBinsOverride(last.customBinsOverride);
    setExtraBins(last.extraBins);
    setRemovedBinIds(last.removedBinIds);
    setPinnedPlacements(last.pinnedPlacements);
  }, [
    undoStack,
    skus,
    configPatch,
    customBinsOverride,
    extraBins,
    removedBinIds,
    pinnedPlacements,
  ]);

  const handleWorkspaceRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    lastUndoPushMsRef.current = 0;
    const last = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((u) => [
      ...u.slice(-24),
      {
        skus,
        configPatch,
        customBinsOverride,
        extraBins,
        removedBinIds,
        pinnedPlacements,
      },
    ]);
    setSkus(last.skus);
    setConfigPatch(last.configPatch);
    setCustomBinsOverride(last.customBinsOverride);
    setExtraBins(last.extraBins);
    setRemovedBinIds(last.removedBinIds);
    setPinnedPlacements(last.pinnedPlacements);
  }, [
    redoStack,
    skus,
    configPatch,
    customBinsOverride,
    extraBins,
    removedBinIds,
    pinnedPlacements,
  ]);

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
  const [alwaysOptimizedLock, setAlwaysOptimizedLock] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('cubislot_always_opt_lock_v1');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(
        'cubislot_always_opt_lock_v1',
        String(alwaysOptimizedLock)
      );
    } catch {
    }
    if (alwaysOptimizedLock && activeLayout !== 'optimized_3d') {
      setActiveLayout('optimized_3d');
    }
  }, [alwaysOptimizedLock, activeLayout]);

  const [main2DPlanMode, setMain2DPlanMode] = useState<
    'off' | 'split' | 'full_2d'
  >('split');
  const [split2DSize, setSplit2DSize] = useState<
    'collapsed' | 'compact' | 'normal' | 'large'
  >('normal');
  const [plan2DTool, setPlan2DTool] = useState<
    'drag_edit' | 'add_shelf' | 'add_obstacle' | 'route_toggle'
  >('drag_edit');
  const [plan2DSnapGrid, setPlan2DSnapGrid] = useState<boolean>(true);
  const [plan2DDragPreview, setPlan2DDragPreview] = useState<{
    kind: 'rack_col' | 'depot' | 'obstacle' | 'prop';
    id: string;
    origX: number;
    origY: number;
    curX: number;
    curY: number;
  } | null>(null);
  const plan2DSvgRef = useRef<SVGSVGElement | null>(null);
  const plan2DDidDragRef = useRef<boolean>(false);
  const [windowMaximized, setWindowMaximized] = useState<boolean>(false);
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setWindowMaximized(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  const [lang, setLang] = useState<LangCode>(loadLang);
  const [appView, setAppView] = useState<'workspace' | 'home'>('workspace');
  const [viewLayer, setViewLayer] = useState<ViewLayerMode>('slotting');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [cameraPreset, setCameraPreset] = useState<
    'iso' | 'top' | 'elevation' | 'closeup'
  >('iso');
  const [cameraResetTick, setCameraResetTick] = useState(0);
  const [cameraFocusTick, setCameraFocusTick] = useState(0);
  const [autoZoomEnabled, setAutoZoomEnabled] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('cubislot_auto_zoom_v1');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(
        'cubislot_auto_zoom_v1',
        String(autoZoomEnabled)
      );
    } catch {
      // ignore storage errors
    }
  }, [autoZoomEnabled]);
  const [animateRoute, setAnimateRoute] = useState(true);
  const [dragMoveMode, setDragMoveMode] = useState(false);
  const [dragScope, setDragScope] = useState<DragScope>('single_cargo');
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [selectedObstacleId, setSelectedObstacleId] = useState<string | null>(
    null
  );
  const [selectedDepot, setSelectedDepot] = useState<boolean>(false);
  const [selectedCargo, setSelectedCargo] = useState<SelectedCargoBox | null>(
    null
  );
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
  const [plan2DBoxModalOpen, setPlan2DBoxModalOpen] = useState(false);
  const [suppress3DAutoZoom, setSuppress3DAutoZoom] = useState(false);
  const [simpleMode, setSimpleMode] = useState(true);
  const [showAdvanced3DTools, setShowAdvanced3DTools] = useState(false);
  const [showQuickInteriorBar, setShowQuickInteriorBar] = useState(false);
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
    saveScene3DBg(sceneBg);
  }, [sceneBg]);

  useEffect(() => {
    saveDesignSettings(designSettings);
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
      cloudModelName: 'gemini-2.5-flash',
      liteModelName: 'gemini-2.5-flash-lite',
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
    setUndoStack([]);
    setRedoStack([]);
    setEquipmentMode(found.config.equipmentMode);
    setLevelFilter('all');
    setSelectedBinId(null);
    setSelectedPropId(null);
    setSelectedObstacleId(null);
    setSelectedDepot(false);
    setSelectedCargo(null);
    setCameraResetTick((t) => t + 1);
  };

  const handleSaveCustomScenario = useCallback((customMap: WarehouseScenario) => {
    setCustomMaps((prev) => {
      const next = [...prev, customMap];
      saveCustomMaps(next);
      return next;
    });
    setScenarioId(customMap.id);
    setSkus(customMap.skus);
    setConfigPatch({});
    setCustomBinsOverride(customMap.customBins ?? null);
    setExtraBins([]);
    setRemovedBinIds([]);
  }, []);

  const handleDeleteCustomScenario = useCallback(
    (id: string) => {
      setCustomMaps((prev) => {
        const next = prev.filter((m) => m.id !== id);
        saveCustomMaps(next);
        return next;
      });
      if (scenarioId === id) {
        const fallback = SAMPLE_SCENARIOS[0];
        setScenarioId(fallback.id);
        setSkus(fallback.skus);
        setConfigPatch({});
        setCustomBinsOverride(fallback.customBins ?? null);
        setExtraBins([]);
        setRemovedBinIds([]);
        setPinnedPlacements([]);
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
    return resolveShelfCollisions3D(merged, config);
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

  const [showBeginnerGuide, setShowBeginnerGuide] = useState<boolean>(true);

  const handleSelectBin = useCallback((alloc: BinAllocation | null) => {
    setSuppress3DAutoZoom(false);
    setSelectedBinId(alloc ? alloc.bin.id : null);
    if (alloc) setLeftTab('inspector');
  }, []);

  const handleSelectBinFrom2D = useCallback(
    (alloc: BinAllocation, openInspectorModal = true) => {
      setSuppress3DAutoZoom(true);
      setSelectedBinId(alloc.bin.id);
      setSelectedPropId(null);
      setSelectedDepot(false);
      setSelectedObstacleId(null);
      setLeftTab('inspector');
      if (openInspectorModal) {
        setPlan2DBoxModalOpen(true);
      }
    },
    []
  );

  const toggleLanguage = useCallback(() => {
    setLang(() => {
      const next: LangCode = 'en';
      saveLang(next);
      return next;
    });
  }, []);

  const effectiveInteriorProps = useMemo(() => {
    const aisleSp = config.aisleSpacingM ?? 3.4;
    const depotX =
      config.depotXMeters ?? ((Math.max(1, config.aisles) - 1) * aisleSp) / 2;
    const depotZ = config.depotYMeters ?? 0;
    const xs = [
      ...shownResult.allocations.map((a) => a.bin.xMeters),
      ...(config.obstacles ?? []).map((o) => o.xMeters),
      depotX,
      ...(config.floorWidthM ? [-1.0, -1.0 + config.floorWidthM] : []),
    ];
    const zs = [
      ...shownResult.allocations.map((a) => a.bin.yMeters),
      ...(config.obstacles ?? []).map((o) => o.yMeters),
      depotZ,
      ...(config.floorDepthM ? [-1.0, -1.0 + config.floorDepthM] : []),
    ];
    const minX = Math.min(-1.0, ...(xs.length ? xs.map((x) => x - 1.2) : [-1.0]));
    const minZ = Math.min(-1.0, ...(zs.length ? zs.map((z) => z - 1.2) : [-1.0]));
    const maxX = Math.max(
      minX + (config.floorWidthM ?? 0),
      ...(xs.length ? xs.map((x) => x + 1.5) : [10])
    );
    const maxZ = Math.max(
      minZ + (config.floorDepthM ?? 0),
      ...(zs.length ? zs.map((z) => z + 1.5) : [10])
    );
    return getEffectiveInteriorProps({
      scenarioName: activeScenario.name,
      config,
      bounds: {
        minX,
        minZ,
        maxX,
        maxZ,
        width: Math.max(12, maxX - minX),
        depth: Math.max(12, maxZ - minZ),
        centerX: (minX + maxX) / 2,
        centerZ: (minZ + maxZ) / 2,
      },
      depotX,
      depotZ,
    });
  }, [activeScenario.name, config, shownResult.allocations]);

  const selectedProp: InteriorProp | null = useMemo(() => {
    if (!selectedPropId) return null;
    return (
      effectiveInteriorProps.find((p) => p.id === selectedPropId) ?? null
    );
  }, [effectiveInteriorProps, selectedPropId]);

  const selectedObstacle: WarehouseObstacle | null = useMemo(() => {
    if (!selectedObstacleId) return null;
    return (
      (config.obstacles ?? []).find((o) => o.id === selectedObstacleId) ?? null
    );
  }, [config.obstacles, selectedObstacleId]);

  const activeDepotX =
    config.depotXMeters ??
    ((Math.max(1, config.aisles) - 1) * (config.aisleSpacingM ?? 3.4)) / 2;
  const activeDepotZ = config.depotYMeters ?? 0;

  const handleChangeFloorColor = useCallback((nextColor: string) => {
    setSceneBg((prev) => ({
      ...prev,
      presetId: 'custom',
      useThemeDefault: false,
      floorColor: nextColor,
    }));
  }, []);

  const showToast = useCallback((msg: string) => {
    setShortcutToast(msg);
  }, []);

  useEffect(() => {
    if (!shortcutToast) return;
    const timer = window.setTimeout(() => setShortcutToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [shortcutToast]);

  const {
    handleAddBin,
    handleDeleteBin,
    handlePinCargo,
    handleSetCargoCountInBin,
    handleSetBinTotalBoxQuota,
    handlePlaceCustomBoxInBin,
    handleUpdateBoxDimensions,
    handleResizeSingleBin,
    handleMoveDepot,
    handleAddObstacleAt,
    handleUpdateObstacle,
    handleDeleteObstacle,
    handleMoveSingleCargoToBin,
    handleMoveSingleCargoToFloor,
    handleNudgeSingleCargo,
    handleMoveSkuToLevel,
    handleAddBinAbove,
    handleAddBinAtFloor,
    handleMoveSingleBin,
    handleMoveRackColumn,
    handleTranslateWholeTemplate,
    handleRotateWholeTemplate90,
    handleScaleWholeTemplateSpacing,
    handleCenterWholeTemplate,
    handleCreateCustomHomeSpace,
    handleAddInteriorProp,
    handleUpdateInteriorProp,
    handleDuplicateInteriorProp,
    handleDeleteInteriorProp,
    handleAutoPopulateInterior,
  } = useWarehouseTransforms({
    bins,
    allocations: shownResult.allocations,
    config,
    skus,
    effectiveInteriorProps,
    lang,
    pushWorkspaceUndo,
    showToast,
    setSkus,
    setConfigPatch,
    setCustomBinsOverride,
    setExtraBins,
    setRemovedBinIds,
    setPinnedPlacements,
    setSelectedBinId,
    setSelectedPropId,
    setSelectedCargo,
    setCameraResetTick,
    setAppView,
  });

  useWarehouseShortcuts({
    lang,
    appView,
    mapEditorOpen,
    anyModalOpen:
      mapEditorOpen ||
      interiorModalOpen ||
      sceneBgModalOpen ||
      cadModalOpen ||
      templateGalleryOpen ||
      setupOpen ||
      designMenuOpen ||
      plan2DBoxModalOpen,
    alwaysOptimizedLock,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    onUnlockAlwaysOptimized: () => setAlwaysOptimizedLock(false),
    dragMoveMode,
    dragScope,
    selectedBin,
    selectedProp,
    selectedObstacle,
    selectedDepot,
    depotX: activeDepotX,
    depotZ: activeDepotZ,
    selectedCargo,
    showToast,
    toggleLanguage,
    handleWorkspaceUndo,
    handleWorkspaceRedo,
    handleAddBinAbove,
    handleDeleteBin,
    handleDeleteInteriorProp,
    handleUpdateInteriorProp,
    handleUpdateObstacle,
    handleDeleteObstacle,
    handleMoveDepot,
    handleMoveSingleBin,
    handleMoveRackColumn,
    handleNudgeSingleCargo,
    handlePinCargo,
    handleTranslateWholeTemplate,
    setCameraPreset,
    setCameraResetTick,
    setCameraFocusTick,
    setAutoZoomEnabled,
    onClearAllSelection: () => {
      setSelectedBinId(null);
      setSelectedCargo(null);
      setSelectedPropId(null);
      setSelectedObstacleId(null);
      setSelectedDepot(false);
    },
    setActiveLayout,
    setDragMoveMode,
    setInteriorInitialTab,
    setInteriorModalOpen,
    setSceneBgModalOpen,
    setMapEditorOpen,
    setTemplateGalleryOpen,
    setCadModalOpen,
    setViewLayer,
    setAppView,
    setLevelFilter,
    setSelectedCargo,
  });

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
      const msg = `Saved run ${id.slice(0, 8)} to Firestore`;
      setFirestoreNotice(msg);
      showToast(msg);
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : 'Unable to save snapshot';
      setFirestoreNotice(errMsg);
      showToast(errMsg);
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
      onContextMenu={(e) => {
        if (mapEditorOpen) return;
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setContextMenu({
          clientX: e.clientX,
          clientY: e.clientY,
          binAlloc: selectedBin,
          interiorProp: selectedProp,
          floorPoint: null,
        });
      }}
    >
      <TopHeaderBar
        lang={lang}
        appView={appView}
        simpleMode={simpleMode}
        activeTheme={activeTheme}
        designSettings={designSettings}
        firebaseConfigured={firebaseState.configured}
        onChangeAppView={setAppView}
        onOpenTemplateGallery={() => setTemplateGalleryOpen(true)}
        onOpenMapEditor={() => setMapEditorOpen(true)}
        onOpenCadModal={() => setCadModalOpen(true)}
        onToggleLanguage={toggleLanguage}
        onToggleSimpleMode={() => setSimpleMode((v) => !v)}
        onCycleTheme={cycleTheme}
        onSelectThemeId={(themeId) =>
          setDesignSettings((prev) => ({ ...prev, themeId }))
        }
        onOpenDesignMenu={() => setDesignMenuOpen(true)}
        onSaveSnapshot={handleSaveSnapshot}
        onOpenFirebaseSetup={() => setSetupOpen(true)}
      />

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
          <WorkspaceQuickStrip
            lang={lang}
            showMapStrip={designSettings.showMapStrip}
            activeScenarioName={activeScenario.name}
            scenarioId={scenarioId}
            mapFilter={mapFilter}
            customMaps={customMaps}
            activeTheme={activeTheme}
            simpleMode={simpleMode}
            showBeginnerGuide={showBeginnerGuide}
            equipmentMode={equipmentMode}
            firestoreNotice={firestoreNotice}
            activeLayout={activeLayout}
            allocations={shownResult.allocations}
            onChangeMapFilter={setMapFilter}
            onSelectScenario={handleSelectScenario}
            onDeleteCustomScenario={handleDeleteCustomScenario}
            onChangeShowBeginnerGuide={setShowBeginnerGuide}
            onChangeEquipmentMode={setEquipmentMode}
            onOpenTemplateGallery={() => setTemplateGalleryOpen(true)}
            onToggleActiveLayout={() => {
              const next =
                activeLayout === 'optimized_3d'
                  ? 'baseline_2d'
                  : 'optimized_3d';
              if (alwaysOptimizedLock && next === 'baseline_2d') {
                setAlwaysOptimizedLock(false);
              }
              setActiveLayout(next);
              showToast(
                next === 'baseline_2d'
                  ? 'Switched to Before (2D Baseline)'
                  : 'Switched to After (3D Optimized)'
              );
            }}
            onDismissFirestoreNotice={() => setFirestoreNotice('')}
            onSelectRecommendedBin={(targetAlloc) => {
              setSelectedBinId(targetAlloc.bin.id);
              setLeftTab('inspector');
              showToast(
                `Selected [${targetAlloc.bin.id}] in Inspector`
              );
            }}
          />

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

          <main className="workspace-grid flex-1 p-4" style={workspaceStyle}>
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
              onClick={() => {
                if (!selectedBin) {
                  const target =
                    shownResult.allocations.find((a) => a.bin.isGoldenZone) ??
                    shownResult.allocations[0] ??
                    null;
                  if (target) setSelectedBinId(target.bin.id);
                }
                setLeftTab('inspector');
              }}
              className={`flex-1 py-2.5 ${
                leftTab === 'inspector'
                  ? 'border-b-2 font-bold text-emerald-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={
                leftTab === 'inspector'
                  ? { borderColor: activeTheme.accent }
                  : undefined
              }
            >
              3. {t(lang, 'tabInspect')}
              {selectedBin ? ` (${selectedBin.bin.id})` : ''}
            </button>
          </div>

          {leftTab !== 'inspector' && (
            <div className="border-b border-slate-800/80 bg-emerald-950/25 px-3.5 py-2">
              <button
                type="button"
                onClick={() => {
                  const target =
                    selectedBin ??
                    shownResult.allocations.find((a) => a.bin.isGoldenZone) ??
                    shownResult.allocations[0] ??
                    null;
                  if (target) setSelectedBinId(target.bin.id);
                  setLeftTab('inspector');
                }}
                className="flex w-full items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-left text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
              >
                <span>
                  {'📦 Resize Shelf / Set Box Size & Place'}
                </span>
                <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                  {'Open →'}
                </span>
              </button>
            </div>
          )}

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
                scenarioName={activeScenario.name}
                activeResult={shownResult}
                lang={lang}
                onUpdateConfig={(patch) => {
                  pushWorkspaceUndo();
                  setConfigPatch((prev) => ({ ...prev, ...patch }));
                  if (
                    patch.aisles !== undefined ||
                    patch.baysPerAisle !== undefined ||
                    patch.levels !== undefined
                  ) {
                    setCustomBinsOverride(null);
                  } else if (
                    patch.binLengthCm !== undefined ||
                    patch.binWidthCm !== undefined ||
                    patch.binHeightCm !== undefined
                  ) {
                    if (customBinsOverride !== null) {
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
                    if (extraBins.length > 0) {
                      setExtraBins((prev) =>
                        prev.map((b) => ({
                          ...b,
                          binLengthCm: patch.binLengthCm ?? b.binLengthCm,
                          binWidthCm: patch.binWidthCm ?? b.binWidthCm,
                          binHeightCm: patch.binHeightCm ?? b.binHeightCm,
                        }))
                      );
                    }
                  }
                }}
                onAddBin={handleAddBin}
                onDeleteBin={handleDeleteBin}
                onResetSpaceEdits={() => {
                  pushWorkspaceUndo();
                  setCustomBinsOverride(null);
                  setExtraBins([]);
                  setRemovedBinIds([]);
                }}
                onChangeSkus={(nextSkus) => {
                  pushWorkspaceUndo();
                  setSkus(nextSkus);
                  const validIds = new Set(nextSkus.map((s) => s.id));
                  setPinnedPlacements((prev) =>
                    prev.filter((p) => validIds.has(p.skuId))
                  );
                }}
                onPinCargo={handlePinCargo}
                onPlaceCustomBoxInBin={handlePlaceCustomBoxInBin}
                onClearAllPins={() => {
                  pushWorkspaceUndo();
                  setPinnedPlacements([]);
                }}
              />
            ) : (
              <BinInspectorPanel
                selectedBin={selectedBin}
                allAllocations={shownResult.allocations}
                selectedCargo={selectedCargo}
                pickRoute={shownResult.pickRoute}
                activeLayout={activeLayout}
                accentColor={activeTheme.accent}
                simpleMode={simpleMode}
                skus={skus}
                onSelectBin={handleSelectBin}
                onSelectCargo={setSelectedCargo}
                onPinCargo={handlePinCargo}
                onSetCargoCountInBin={handleSetCargoCountInBin}
                onSetBinTotalBoxQuota={handleSetBinTotalBoxQuota}
                onPlaceCustomBoxInBin={handlePlaceCustomBoxInBin}
                onUpdateBoxDimensions={handleUpdateBoxDimensions}
                onResizeSingleBin={handleResizeSingleBin}
                onMoveSkuToLevel={handleMoveSkuToLevel}
                onClearBinPins={(binId) => {
                  pushWorkspaceUndo();
                  setPinnedPlacements((prev) =>
                    prev.filter((p) => p.binId !== binId)
                  );
                }}
                onAddBinAbove={handleAddBinAbove}
                lang={lang}
                onAuditWithAi={(alloc) => {
                  setExternalAiPrompt({
                    id: Date.now(),
                    mode: 'prefer_on_device',
                    prompt:
                      `Audit bin ${alloc.bin.id} (Z${alloc.bin.level}, ${alloc.bin.zMeters}m, cubic=${alloc.cubicUtilizationPct.toFixed(1)}%, load=${alloc.currentWeightKg.toFixed(1)}/${alloc.bin.maxWeightKg}kg). Give concise 3D slotting advice.`,
                  });
                }}
                onDeleteBin={handleDeleteBin}
              />
            )}
          </div>
        </section>

        <section
          className={`relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 ${
            windowMaximized ? 'fixed inset-2 z-40 shadow-2xl' : ''
          }`}
          style={{
            minHeight: windowMaximized
              ? '95vh'
              : `${designSettings.viewportMinHeightPx}px`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-3 py-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                <button
                  type="button"
                  onClick={() => {
                    if (alwaysOptimizedLock) {
                      setAlwaysOptimizedLock(false);
                    }
                    setActiveLayout('baseline_2d');
                  }}
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

              <button
                type="button"
                onClick={() => {
                  const next = !alwaysOptimizedLock;
                  setAlwaysOptimizedLock(next);
                  if (next) setActiveLayout('optimized_3d');
                  showToast(
                    next
                      ? ('🔒 Always-Optimized Lock ON')
                      : ('🔓 Always-Optimized Lock OFF')
                  );
                }}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                  alwaysOptimizedLock
                    ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                    : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'
                }`}
                title={
                  'Keep viewport locked to 3D Optimized layout at all times'
                }
              >
                {alwaysOptimizedLock ? (
                  <Lock className="h-3 w-3 text-emerald-300" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
                {`Lock 3D ${alwaysOptimizedLock ? 'ON' : 'OFF'}`}
              </button>

              <div className="flex overflow-hidden rounded-lg border border-cyan-500/40 bg-slate-950 text-[10px]">
                {(
                  [
                    ['off', ('3D Only')],
                    ['split', ('3D + 2D Plan')],
                    ['full_2d', ('2D Plan Full')],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMain2DPlanMode(m)}
                    className={`inline-flex items-center gap-1 px-2 py-1 font-semibold transition ${
                      main2DPlanMode === m
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-cyan-300 hover:bg-slate-900'
                    }`}
                    title={
                      'View 2D Layout & Pick Route directly on the main screen'
                    }
                  >
                    <MapIcon className="h-2.5 w-2.5" />
                    {label}
                  </button>
                ))}
              </div>

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

              <button
                type="button"
                onClick={() => {
                  const next = !windowMaximized;
                  setWindowMaximized(next);
                  if (!document.fullscreenElement && next) {
                    document.documentElement.requestFullscreen?.().catch(() => {});
                  } else if (document.fullscreenElement && !next) {
                    document.exitFullscreen?.().catch(() => {});
                  }
                }}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold ${
                  windowMaximized
                    ? 'border-amber-400 bg-amber-500/25 text-amber-200'
                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-400'
                }`}
                title={
                  'Maximize Optimization Viewport to Full Window'
                }
              >
                {windowMaximized ? (
                  <Minimize2 className="h-3 w-3 text-amber-300" />
                ) : (
                  <Maximize2 className="h-3 w-3 text-cyan-300" />
                )}
                {windowMaximized ? 'Restore' : 'Fullscreen'}
              </button>
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

              <button
                type="button"
                onClick={() => {
                  setInteriorInitialTab('interior');
                  setInteriorModalOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-1 font-semibold text-emerald-200 hover:bg-emerald-500/30"
                title={
                  'Open 3D Space Interior & Furniture Studio (Shortcut: I)'
                }
              >
                <Home className="h-3.5 w-3.5 text-emerald-300" />
                {'3D Interior'}
              </button>

              <button
                type="button"
                onClick={() => setSceneBgModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-amber-400/50 bg-amber-500/20 px-2.5 py-1 font-semibold text-amber-200 hover:bg-amber-500/30"
                title={
                  'Open 3D Background & Lighting Studio Editor (Shortcut: B)'
                }
              >
                <Sun className="h-3.5 w-3.5 text-amber-300" />
                {'3D Background'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setInteriorInitialTab('shortcuts');
                  setInteriorModalOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 font-semibold text-cyan-300 hover:border-cyan-400"
                title={
                  'Open Keyboard Shortcuts Guide (Shortcut: ? or K)'
                }
              >
                <Keyboard className="h-3.5 w-3.5" />
                {'Keys'}
              </button>
            </div>
          </div>

          <div className="border-b border-slate-800/80 bg-slate-950/85 px-3 py-1.5 text-[10px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const target =
                      selectedBin ??
                      shownResult.allocations.find((a) => a.bin.isGoldenZone) ??
                      shownResult.allocations[0] ??
                      null;
                    if (target) {
                      setSelectedBinId(target.bin.id);
                      setLeftTab('inspector');
                      showToast(
                        `Opened Box & Shelf Size Configurator for [${target.bin.id}].`
                      );
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-400/60 bg-emerald-500/20 px-2.5 py-1 font-bold text-emerald-200 hover:bg-emerald-500/30"
                  title={
                    'Resize shelf or configure custom box dimensions (L×W×H cm) and place into shelf'
                  }
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-300" />
                  {'Shelf & Custom Box Size'}
                </button>

                <select
                  value=""
                  onChange={(e) => {
                    const skuId = e.target.value;
                    if (!skuId) return;
                    const foundAlloc = shownResult.allocations.find((a) =>
                      a.boxes.some((b) => b.skuId === skuId)
                    );
                    if (foundAlloc) {
                      const boxIdx = foundAlloc.boxes.findIndex(
                        (b) => b.skuId === skuId
                      );
                      const box = foundAlloc.boxes[boxIdx];
                      setSelectedBinId(foundAlloc.bin.id);
                      if (box) {
                        setSelectedCargo({
                          binId: foundAlloc.bin.id,
                          boxIndex: boxIdx,
                          skuId: box.skuId,
                          skuCode: box.skuCode,
                          name: box.name,
                          weightKg: box.weightKg,
                          lengthCm: box.lengthCm,
                          widthCm: box.widthCm,
                          heightCm: box.heightCm,
                          color: box.color,
                        });
                      }
                      setCameraFocusTick((n) => n + 1);
                      setLeftTab('inspector');
                      const totalInBin = foundAlloc.boxes.filter(
                        (b) => b.skuId === skuId
                      ).length;
                      showToast(
                        `🔍 Located [${box?.name.split(' (')[0]}] in Bin ${foundAlloc.bin.id} (Z${foundAlloc.bin.level}, ${totalInBin} pcs) — Zoomed in!`
                      );
                    } else {
                      showToast(
                        'This SKU is currently unplaced.'
                      );
                    }
                  }}
                  className="max-w-[175px] cursor-pointer rounded-md border border-cyan-500/45 bg-slate-900 px-2 py-1 font-semibold text-cyan-200 hover:border-cyan-400"
                  title={
                    'Select any item to automatically locate and zoom to its 3D shelf and box'
                  }
                >
                  <option value="">
                    {'🔍 Find Item in 3D...'}
                  </option>
                  {skus.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name.split(' (')[0]} ({s.skuCode})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowQuickInteriorBar((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-bold transition ${
                    showQuickInteriorBar || selectedProp !== null
                      ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                      : 'border-emerald-500/45 bg-slate-900 text-emerald-300 hover:border-emerald-400'
                  }`}
                  title={
                    'Quickly add or delete 3D interior furniture, appliances, doors & windows inline'
                  }
                >
                  <Home className="h-3.5 w-3.5 text-emerald-300" />
                  {`🛋️ Quick Interior (${effectiveInteriorProps.length}) ${
                        showQuickInteriorBar ? '▴' : '▾'
                      }`}
                </button>

                {selectedBin ? (
                  <>
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
                  </>
                ) : null}

                <div className="flex items-center overflow-hidden rounded-md border border-slate-700 bg-slate-900">
                  <button
                    type="button"
                    disabled={undoStack.length === 0}
                    onClick={() => {
                      handleWorkspaceUndo();
                      showToast(
                        'Undo 3D Edit'
                      );
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-slate-200 hover:bg-slate-800 disabled:opacity-35"
                    title="Undo 3D Workspace Edit (Ctrl+Z)"
                  >
                    <Undo2 className="h-3 w-3 text-cyan-400" />
                    {'Undo'}
                  </button>
                  <button
                    type="button"
                    disabled={redoStack.length === 0}
                    onClick={() => {
                      handleWorkspaceRedo();
                      showToast(
                        'Redo 3D Edit'
                      );
                    }}
                    className="inline-flex items-center gap-1 border-l border-slate-700 px-2 py-0.5 text-slate-200 hover:bg-slate-800 disabled:opacity-35"
                    title="Redo 3D Workspace Edit (Ctrl+Y / Ctrl+Shift+Z)"
                  >
                    <Redo2 className="h-3 w-3 text-cyan-400" />
                    {'Redo'}
                  </button>
                </div>

                {pinnedPlacements.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      pushWorkspaceUndo();
                      setPinnedPlacements([]);
                    }}
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
                      pushWorkspaceUndo();
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

              <div className="flex flex-wrap items-center gap-1.5">
                {(!simpleMode || showAdvanced3DTools) && (
                  <>
                    <div className="flex items-center gap-1 rounded-md border border-cyan-500/35 bg-slate-900 px-1.5 py-0.5">
                      <span className="font-semibold text-cyan-300">
                        {'Floor:'}
                      </span>
                      {[
                        ['#e2e8f0', ('Light Tile')],
                        ['#e7d5b8', ('Warm Wood')],
                        ['#cbd5e1', ('Concrete')],
                        ['#bbf7d0', ('Epoxy Green')],
                        ['#172554', ('Blueprint')],
                        ['#1e293b', ('Dark Slate')],
                      ].map(([col, title]) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => handleChangeFloorColor(col)}
                          title={title}
                          className={`h-3.5 w-3.5 rounded-full border ${
                            !sceneBg.useThemeDefault &&
                            sceneBg.floorColor.toLowerCase() === col
                              ? 'scale-110 border-white ring-1 ring-cyan-400'
                              : 'border-slate-600'
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                      <input
                        type="color"
                        value={
                          sceneBg.useThemeDefault
                            ? activeTheme.scene.floor
                            : sceneBg.floorColor
                        }
                        onChange={(e) => handleChangeFloorColor(e.target.value)}
                        className="h-4 w-5 cursor-pointer border-0 bg-transparent"
                        title={
                          'Pick Custom Map Floor Color'
                        }
                      />
                    </div>

                    <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5">
                      <Sun className="h-3 w-3 text-amber-400" />
                      {[
                        ['daylight-studio', ('Daylight')],
                        ['warm-home', ('Warm Home')],
                        ['pure-white', ('White')],
                        ['cyber-night', ('Dark')],
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
                  </>
                )}

                {simpleMode && (
                  <button
                    type="button"
                    onClick={() => setShowAdvanced3DTools((v) => !v)}
                    className={`rounded-md border px-2 py-0.5 font-semibold transition ${
                      showAdvanced3DTools || dragMoveMode
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-400'
                    }`}
                  >
                    {showAdvanced3DTools
                        ? 'Hide Scene & Drag Tools ▴'
                        : 'Scene & Drag Tools ▾'}
                  </button>
                )}
              </div>
            </div>

            {(showQuickInteriorBar || selectedProp !== null) && (
              <div className="mt-1.5 space-y-1.5 rounded-lg border border-emerald-500/35 bg-slate-900/95 p-2 text-[10px]">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-bold text-emerald-300">
                      {'+ Quick Add:'}
                    </span>
                    {INTERIOR_PROP_CATALOG.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleAddInteriorProp(item.type)}
                        className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-medium text-slate-200 hover:border-emerald-400 hover:bg-emerald-500/15 hover:text-white"
                        title={
                          `Click to add [${item.nameEn}] to 3D space`
                        }
                      >
                        <span>{item.icon}</span>
                        <span>
                          {item.nameEn.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {(
                      [
                        ['cutaway_corner', ('L-Wall')],
                        ['three_walls', ('3-Wall')],
                        ['glass_room', ('Glass')],
                        ['open_floor', ('Open')],
                      ] as const
                    ).map(([st, label]) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() =>
                          setConfigPatch((prev) => ({
                            ...prev,
                            roomEnclosure: st,
                          }))
                        }
                        className={`rounded border px-1.5 py-0.5 font-semibold ${
                          (config.roomEnclosure ?? 'cutaway_corner') === st
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                            : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={config.wallColor || '#334155'}
                      onChange={(e) =>
                        setConfigPatch((prev) => ({
                          ...prev,
                          wallColor: e.target.value,
                        }))
                      }
                      className="h-4 w-5 cursor-pointer border-0 bg-transparent"
                      title={'Wall Color'}
                    />
                    <button
                      type="button"
                      onClick={handleAutoPopulateInterior}
                      className="rounded border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300 hover:bg-emerald-500/30"
                    >
                      {'✨ Auto Set'}
                    </button>

                    <label
                      className="cursor-pointer rounded border border-cyan-500/45 bg-cyan-500/15 px-2 py-0.5 font-bold text-cyan-200 hover:bg-cyan-500/25"
                      title={
                        'Import 100-item sample JSON (Interior, Obstacles, Bins, SKUs, Custom Boxes) or Full Workspace JSON'
                      }
                    >
                      {'📂 Load JSON'}
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            try {
                              const data = JSON.parse(String(reader.result ?? ''));
                              pushWorkspaceUndo();
                              if (Array.isArray(data) && data.length > 0) {
                                const first = data[0];
                                if (first.rotationDeg !== undefined && first.type) {
                                  setConfigPatch((prev) => ({
                                    ...prev,
                                    interiorProps: data as InteriorProp[],
                                  }));
                                  showToast(
                                    `Loaded ${data.length} 3D interior props from JSON!`
                                  );
                                } else if (first.binLengthCm !== undefined && first.zMeters !== undefined) {
                                  setCustomBinsOverride(data as BinSpec[]);
                                  setExtraBins([]);
                                  setRemovedBinIds([]);
                                  showToast(
                                    `Loaded ${data.length} 3D shelf bins from JSON!`
                                  );
                                } else if (first.dailyPicks !== undefined && first.skuCode) {
                                  setSkus(data as SKUItem[]);
                                  showToast(
                                    `Loaded ${data.length} SKUs from JSON!`
                                  );
                                } else if (first.sampleId !== undefined && first.binId && first.lengthCm) {
                                  const convertedSkus: SKUItem[] = data.map((c: any, idx: number) => ({
                                    id: `sku-cbox-${idx + 1}`,
                                    skuCode: c.skuCode || `CBOX-${idx + 1}`,
                                    name: c.name || `Custom Box ${idx + 1}`,
                                    category: 'CustomBox',
                                    abcClass: c.abcClass || 'A',
                                    dailyPicks: c.abcClass === 'A' ? 110 : 45,
                                    lengthCm: Number(c.lengthCm) || 36,
                                    widthCm: Number(c.widthCm) || 28,
                                    heightCm: Number(c.heightCm) || 24,
                                    weightKg: Number(c.weightKg) || 5,
                                    quantity: Number(c.quantity) || 1,
                                    fragile: Boolean(c.fragile),
                                    color: c.color || '#22d3ee',
                                  }));
                                  setSkus(convertedSkus);
                                  showToast(
                                    `Loaded ${data.length} custom box samples from JSON!`
                                  );
                                } else if (first.aisle !== undefined && first.bay !== undefined && first.xMeters !== undefined) {
                                  setConfigPatch((prev) => ({
                                    ...prev,
                                    obstacles: data as WarehouseObstacle[],
                                  }));
                                  showToast(
                                    `Loaded ${data.length} obstacles from JSON!`
                                  );
                                }
                              } else if (data && typeof data === 'object') {
                                if (
                                  typeof data.scenarioId === 'string' &&
                                  allScenarios.some((s) => s.id === data.scenarioId)
                                ) {
                                  setScenarioId(data.scenarioId);
                                }
                                if (Array.isArray(data.skus)) setSkus(data.skus);
                                if (data.configPatch && typeof data.configPatch === 'object') {
                                  setConfigPatch(data.configPatch);
                                }
                                if (Array.isArray(data.interiorProps)) {
                                  setConfigPatch((prev) => ({
                                    ...prev,
                                    interiorProps: data.interiorProps,
                                  }));
                                }
                                if (Array.isArray(data.obstacles)) {
                                  setConfigPatch((prev) => ({
                                    ...prev,
                                    obstacles: data.obstacles,
                                  }));
                                }
                                if (
                                  data.customBinsOverride === null ||
                                  Array.isArray(data.customBinsOverride)
                                ) {
                                  setCustomBinsOverride(data.customBinsOverride);
                                }
                                if (Array.isArray(data.extraBins)) {
                                  setExtraBins(data.extraBins);
                                }
                                if (Array.isArray(data.removedBinIds)) {
                                  setRemovedBinIds(data.removedBinIds);
                                }
                                if (Array.isArray(data.pinnedPlacements)) {
                                  setPinnedPlacements(data.pinnedPlacements);
                                }
                                showToast(
                                  'Loaded full workspace settings JSON!'
                                );
                              }
                            } catch {
                              showToast(
                                'Invalid JSON file format.'
                              );
                            }
                          };
                          reader.readAsText(file);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const payload = {
                          exportedAt: new Date().toISOString(),
                          scenarioId,
                          scenarioName: activeScenario.name,
                          config,
                          configPatch,
                          interiorProps: effectiveInteriorProps,
                          obstacles: config.obstacles ?? [],
                          customBinsOverride,
                          skus,
                          pinnedPlacements,
                        };
                        const blob = new Blob([JSON.stringify(payload, null, 2)], {
                          type: 'application/json;charset=utf-8;',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'cubislot-3d-workspace-settings.json';
                        a.click();
                        URL.revokeObjectURL(url);
                        showToast(
                          'Saved current 3D interior & workspace settings to JSON.'
                        );
                      }}
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-0.5 font-semibold text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
                      title={
                        'Export current interior, shelf & SKU settings to JSON'
                      }
                    >
                      {'⬇ Save JSON'}
                    </button>
                    {effectiveInteriorProps.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          pushWorkspaceUndo();
                          setConfigPatch((prev) => ({
                            ...prev,
                            interiorProps: [],
                          }));
                          setSelectedPropId(null);
                          showToast(
                            'Cleared all 3D interior props.'
                          );
                        }}
                        className="rounded border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 font-bold text-rose-300 hover:bg-rose-500/25"
                      >
                        {'🗑️ Clear All'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex max-h-20 flex-wrap items-center gap-1 overflow-y-auto border-t border-slate-800 pt-1">
                  <span className="font-semibold text-slate-400">
                    {`Placed (${effectiveInteriorProps.length} · Click:Select · ×:Delete):`}
                  </span>
                  {effectiveInteriorProps.length === 0 ? (
                    <span className="text-slate-500">
                      {'No props placed. Click any icon above to add.'}
                    </span>
                  ) : (
                    effectiveInteriorProps.map((p) => {
                      const meta = INTERIOR_PROP_CATALOG.find(
                        (c) => c.type === p.type
                      );
                      const isSel = p.id === selectedPropId;
                      return (
                        <span
                          key={p.id}
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${
                            isSel
                              ? 'border-emerald-400 bg-emerald-500/25 font-bold text-emerald-200'
                              : 'border-slate-700 bg-slate-950 text-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPropId(p.id);
                              setSelectedBinId(null);
                              setSelectedCargo(null);
                              setCameraFocusTick((n) => n + 1);
                            }}
                            className="inline-flex items-center gap-1 hover:text-cyan-300"
                            title={
                              'Click to focus & edit this prop'
                            }
                          >
                            <span>{meta?.icon ?? '🛋️'}</span>
                            <span>{p.label.split(' (')[0]}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInteriorProp(p.id)}
                            className="ml-0.5 rounded px-1 text-rose-400 hover:bg-rose-500/25 hover:text-rose-200"
                            title={'Delete prop'}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {(!simpleMode || showAdvanced3DTools || dragMoveMode) && (
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-800/80 pt-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-cyan-300">
                    {'Drag Scope:'}
                  </span>
                  <div className="flex items-center overflow-hidden rounded-md border border-slate-700 bg-slate-900">
                    <button
                      type="button"
                      onClick={() => {
                        if (dragMoveMode && dragScope === 'single_cargo') {
                          setDragMoveMode(false);
                        } else {
                          setDragMoveMode(true);
                          setDragScope('single_cargo');
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 font-semibold transition ${
                        dragMoveMode && dragScope === 'single_cargo'
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-amber-300 hover:bg-slate-800'
                      }`}
                    >
                      <Move className="h-3 w-3" />
                      {'Single Item'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (dragMoveMode && dragScope === 'single_bin') {
                          setDragMoveMode(false);
                        } else {
                          setDragMoveMode(true);
                          setDragScope('single_bin');
                        }
                      }}
                      className={`border-l border-slate-700 px-2 py-0.5 font-semibold transition ${
                        dragMoveMode && dragScope === 'single_bin'
                          ? 'bg-sky-400 text-slate-950'
                          : 'text-sky-300 hover:bg-slate-800'
                      }`}
                    >
                      {'Single Bin'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (dragMoveMode && dragScope === 'column') {
                          setDragMoveMode(false);
                        } else {
                          setDragMoveMode(true);
                          setDragScope('column');
                        }
                      }}
                      className={`border-l border-slate-700 px-2 py-0.5 font-semibold transition ${
                        dragMoveMode && dragScope === 'column'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {'Rack Column'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (dragMoveMode && dragScope === 'whole_template') {
                          setDragMoveMode(false);
                        } else {
                          setDragMoveMode(true);
                          setDragScope('whole_template');
                        }
                      }}
                      className={`border-l border-slate-700 px-2 py-0.5 font-semibold transition ${
                        dragMoveMode && dragScope === 'whole_template'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-emerald-300 hover:bg-slate-800'
                      }`}
                    >
                      {'Whole Template'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/30 px-1.5 py-0.5">
                  <span className="font-semibold text-emerald-300">
                    {'Whole Space:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTranslateWholeTemplate(-0.5, 0)}
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                    title={'Move All Left 0.5m'}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTranslateWholeTemplate(0.5, 0)}
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                    title={'Move All Right 0.5m'}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTranslateWholeTemplate(0, -0.5)}
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                    title={'Move All Front 0.5m'}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTranslateWholeTemplate(0, 0.5)}
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                    title={'Move All Back 0.5m'}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleRotateWholeTemplate90();
                      showToast(
                        'Rotated Whole Template 90°'
                      );
                    }}
                    className="inline-flex items-center gap-0.5 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 text-emerald-300 hover:border-emerald-400"
                  >
                    <RotateCw className="h-2.5 w-2.5" />
                    90°
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScaleWholeTemplateSpacing(1.12)}
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                  >
                    {'Span+'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScaleWholeTemplateSpacing(0.88)}
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 hover:border-emerald-400"
                  >
                    {'Span-'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCenterWholeTemplate}
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.2 text-cyan-300 hover:border-cyan-400"
                  >
                    {'Center'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
            {shortcutToast && (
              <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-cyan-400/60 bg-slate-950/90 px-4 py-1.5 text-xs font-bold text-cyan-200 shadow-2xl backdrop-blur">
                {shortcutToast}
              </div>
            )}

            {selectedCargo && !selectedProp && (
              <div className="absolute left-1/2 top-12 z-20 flex -translate-x-1/2 flex-wrap items-center gap-1.5 rounded-xl border border-amber-400/70 bg-slate-950/95 px-3 py-1.5 text-[11px] text-slate-100 shadow-2xl backdrop-blur">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: selectedCargo.color }}
                />
                <span className="font-bold text-amber-300">
                  {selectedCargo.name.split(' (')[0]}
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                  {selectedCargo.binId}
                </span>

                <div className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-slate-900/90 px-1.5 py-0.5 text-[10px]">
                  <span className="font-semibold text-emerald-300">
                    {'Size:'}
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={280}
                    value={selectedCargo.lengthCm}
                    onChange={(e) => {
                      if (e.target.value.trim() === '') return;
                      handleUpdateBoxDimensions(
                        selectedCargo.skuId,
                        {
                          lengthCm: Math.max(
                            5,
                            Math.min(280, Number(e.target.value) || 10)
                          ),
                        },
                        selectedCargo.binId
                      );
                    }}
                    className="w-11 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono text-white"
                    title={'Length L (cm)'}
                  />
                  <span className="text-slate-500">×</span>
                  <input
                    type="number"
                    min={5}
                    max={280}
                    value={selectedCargo.widthCm}
                    onChange={(e) => {
                      if (e.target.value.trim() === '') return;
                      handleUpdateBoxDimensions(
                        selectedCargo.skuId,
                        {
                          widthCm: Math.max(
                            5,
                            Math.min(280, Number(e.target.value) || 10)
                          ),
                        },
                        selectedCargo.binId
                      );
                    }}
                    className="w-11 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono text-white"
                    title={'Width W (cm)'}
                  />
                  <span className="text-slate-500">×</span>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={selectedCargo.heightCm}
                    onChange={(e) => {
                      if (e.target.value.trim() === '') return;
                      handleUpdateBoxDimensions(
                        selectedCargo.skuId,
                        {
                          heightCm: Math.max(
                            5,
                            Math.min(240, Number(e.target.value) || 10)
                          ),
                        },
                        selectedCargo.binId
                      );
                    }}
                    className="w-11 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono text-white"
                    title={'Height H (cm)'}
                  />
                  <span className="text-slate-400">cm</span>
                </div>

                <span className="text-[10px] text-slate-400">
                  {'Move Item:'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleNudgeSingleCargo(
                      selectedCargo.binId,
                      selectedCargo.skuId,
                      -1,
                      0
                    )
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-amber-400"
                  title={'Move to Left Bin (←)'}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleNudgeSingleCargo(
                      selectedCargo.binId,
                      selectedCargo.skuId,
                      1,
                      0
                    )
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-amber-400"
                  title={'Move to Right Bin (→)'}
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleNudgeSingleCargo(
                      selectedCargo.binId,
                      selectedCargo.skuId,
                      0,
                      -1
                    )
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-amber-400"
                  title={'Move to Front Bin (↑)'}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleNudgeSingleCargo(
                      selectedCargo.binId,
                      selectedCargo.skuId,
                      0,
                      1
                    )
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-amber-400"
                  title={'Move to Back Bin (↓)'}
                >
                  ↓
                </button>
                <div className="flex items-center gap-0.5 border-l border-slate-800 pl-1">
                  {Array.from(
                    { length: Math.max(config.levels, zBreakdown.length) },
                    (_, i) => i + 1
                  ).map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() =>
                        handleMoveSkuToLevel(
                          selectedCargo.binId,
                          selectedCargo.skuId,
                          lv
                        )
                      }
                      className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 hover:border-emerald-400"
                      title={
                        `Move this item to Z${lv}`
                      }
                    >
                      Z{lv}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handlePinCargo(selectedCargo.binId, selectedCargo.skuId, 1)
                  }
                  className="rounded border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-500/25"
                  title={'Add +1 here'}
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targetGolden =
                      shownResult.allocations.find(
                        (a) =>
                          a.bin.id !== selectedCargo.binId &&
                          a.bin.isGoldenZone &&
                          a.cubicUtilizationPct < 80
                      ) ??
                      shownResult.allocations.find(
                        (a) => a.bin.id !== selectedCargo.binId
                      );
                    if (targetGolden) {
                      handleMoveSingleCargoToBin(
                        selectedCargo.binId,
                        selectedCargo.skuId,
                        targetGolden.bin.id,
                        'all'
                      );
                    }
                  }}
                  className="rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
                  title={
                    'Move entire SKU batch in this bin to Golden Zone'
                  }
                >
                  {'Move Batch'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePinCargo(selectedCargo.binId, selectedCargo.skuId, -1);
                    setSelectedCargo(null);
                  }}
                  className="rounded border border-rose-500/40 bg-rose-500/20 p-1 text-rose-300 hover:bg-rose-500/30"
                  title={'Remove 1 unit (Del)'}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCargo(null)}
                  className="ml-1 text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}

            {selectedBin &&
              !selectedCargo &&
              !selectedProp &&
              !selectedObstacle &&
              !selectedDepot && (
                <div className="absolute left-1/2 top-12 z-20 flex -translate-x-1/2 flex-wrap items-center gap-1.5 rounded-xl border border-sky-400/70 bg-slate-950/95 px-3 py-1.5 text-[11px] text-slate-100 shadow-2xl backdrop-blur">
                  <span className="font-bold text-sky-300">
                    {`Shelf [${selectedBin.bin.id}]`}
                  </span>

                  <div className="flex items-center gap-1 rounded-md border border-emerald-500/45 bg-slate-900/95 px-1.5 py-0.5 text-[10px]">
                    <span className="font-semibold text-emerald-300">
                      {'Boxes:'}
                    </span>
                    {[0, 1, 2, 4, 6].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() =>
                          handleSetBinTotalBoxQuota(
                            selectedBin.bin.id,
                            q,
                            skus[0]?.id
                          )
                        }
                        className={`rounded border px-1 py-0.2 font-mono font-bold ${
                          selectedBin.boxes.length === q
                            ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                            : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedBin.boxes.length}
                      onChange={(e) => {
                        if (e.target.value.trim() === '') return;
                        handleSetBinTotalBoxQuota(
                          selectedBin.bin.id,
                          Math.max(
                            0,
                            Math.min(100, Math.round(Number(e.target.value) || 0))
                          ),
                          skus[0]?.id
                        );
                      }}
                      className="w-10 rounded border border-emerald-500/50 bg-slate-950 px-1 py-0.2 text-center font-mono font-bold text-amber-300"
                      title={
                        'Enter exact total box count for this shelf bin'
                      }
                    />
                  </div>

                  <div className="flex items-center gap-1 rounded-md border border-cyan-500/40 bg-slate-900/90 px-1.5 py-0.5 text-[10px]">
                    <span className="font-semibold text-cyan-300">
                      {'Shelf Size:'}
                    </span>
                    <input
                      type="number"
                      min={20}
                      max={300}
                      value={selectedBin.bin.binLengthCm}
                      onChange={(e) => {
                        if (e.target.value.trim() === '') return;
                        handleResizeSingleBin(
                          selectedBin.bin.id,
                          {
                            binLengthCm: Math.max(
                              20,
                              Math.min(300, Number(e.target.value) || 60)
                            ),
                          },
                          dragScope === 'single_bin'
                            ? 'single'
                            : dragScope === 'whole_template'
                              ? 'all'
                              : 'column'
                        );
                      }}
                      className="w-11 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono text-white"
                      title={'Shelf Length L (cm)'}
                    />
                    <span className="text-slate-500">×</span>
                    <input
                      type="number"
                      min={20}
                      max={300}
                      value={selectedBin.bin.binWidthCm}
                      onChange={(e) => {
                        if (e.target.value.trim() === '') return;
                        handleResizeSingleBin(
                          selectedBin.bin.id,
                          {
                            binWidthCm: Math.max(
                              20,
                              Math.min(300, Number(e.target.value) || 50)
                            ),
                          },
                          dragScope === 'single_bin'
                            ? 'single'
                            : dragScope === 'whole_template'
                              ? 'all'
                              : 'column'
                        );
                      }}
                      className="w-11 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono text-white"
                      title={'Shelf Width W (cm)'}
                    />
                    <span className="text-slate-500">×</span>
                    <input
                      type="number"
                      min={15}
                      max={250}
                      value={selectedBin.bin.binHeightCm}
                      onChange={(e) => {
                        if (e.target.value.trim() === '') return;
                        handleResizeSingleBin(
                          selectedBin.bin.id,
                          {
                            binHeightCm: Math.max(
                              15,
                              Math.min(250, Number(e.target.value) || 40)
                            ),
                          },
                          dragScope === 'single_bin'
                            ? 'single'
                            : dragScope === 'whole_template'
                              ? 'all'
                              : 'column'
                        );
                      }}
                      className="w-11 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono text-white"
                      title={'Shelf Height H (cm)'}
                    />
                    <span className="text-slate-400">cm</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleResizeSingleBin(
                          selectedBin.bin.id,
                          {
                            binLengthCm: Math.round(
                              selectedBin.bin.binLengthCm * 0.9
                            ),
                            binWidthCm: Math.round(
                              selectedBin.bin.binWidthCm * 0.9
                            ),
                            binHeightCm: Math.round(
                              selectedBin.bin.binHeightCm * 0.9
                            ),
                          },
                          'single'
                        )
                      }
                      className="rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-[9px] text-slate-300 hover:border-cyan-400"
                      title={'Scale this bin -10%'}
                    >
                      -10%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleResizeSingleBin(
                          selectedBin.bin.id,
                          {
                            binLengthCm: Math.round(
                              selectedBin.bin.binLengthCm * 1.1
                            ),
                            binWidthCm: Math.round(
                              selectedBin.bin.binWidthCm * 1.1
                            ),
                            binHeightCm: Math.round(
                              selectedBin.bin.binHeightCm * 1.1
                            ),
                          },
                          'single'
                        )
                      }
                      className="rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-[9px] text-slate-300 hover:border-cyan-400"
                      title={'Scale this bin +10%'}
                    >
                      +10%
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleMoveSingleBin(
                        selectedBin.bin.id,
                        Number((selectedBin.bin.xMeters - 0.25).toFixed(2)),
                        selectedBin.bin.yMeters
                      )
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-sky-400"
                    title={'Move Left'}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleMoveSingleBin(
                        selectedBin.bin.id,
                        Number((selectedBin.bin.xMeters + 0.25).toFixed(2)),
                        selectedBin.bin.yMeters
                      )
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-sky-400"
                    title={'Move Right'}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleMoveSingleBin(
                        selectedBin.bin.id,
                        selectedBin.bin.xMeters,
                        Number((selectedBin.bin.yMeters - 0.25).toFixed(2))
                      )
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-sky-400"
                    title={'Move Front'}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleMoveSingleBin(
                        selectedBin.bin.id,
                        selectedBin.bin.xMeters,
                        Number((selectedBin.bin.yMeters + 0.25).toFixed(2))
                      )
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-sky-400"
                    title={'Move Back'}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleMoveSingleBin(
                        selectedBin.bin.id,
                        selectedBin.bin.xMeters,
                        selectedBin.bin.yMeters,
                        Math.max(1, selectedBin.bin.level - 1)
                      )
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-cyan-300 hover:border-sky-400"
                  >
                    {'Z-'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleMoveSingleBin(
                        selectedBin.bin.id,
                        selectedBin.bin.xMeters,
                        selectedBin.bin.yMeters,
                        Math.min(8, selectedBin.bin.level + 1)
                      )
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-cyan-300 hover:border-sky-400"
                  >
                    {'Z+'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBinId(null)}
                    className="ml-1 text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              )}

            {selectedObstacle && (
              <div className="absolute left-1/2 top-12 z-20 flex -translate-x-1/2 flex-wrap items-center gap-1.5 rounded-xl border border-yellow-400/70 bg-slate-950/95 px-3 py-1.5 text-[11px] text-slate-100 shadow-2xl backdrop-blur">
                <span className="font-bold text-yellow-300">
                  {`Obstacle: ${selectedObstacle.label}`}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  ({selectedObstacle.xMeters}m, {selectedObstacle.yMeters}m)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateObstacle(selectedObstacle.id, {
                      xMeters: Number((selectedObstacle.xMeters - 0.25).toFixed(2)),
                    })
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-yellow-400"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateObstacle(selectedObstacle.id, {
                      xMeters: Number((selectedObstacle.xMeters + 0.25).toFixed(2)),
                    })
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-yellow-400"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateObstacle(selectedObstacle.id, {
                      yMeters: Number((selectedObstacle.yMeters - 0.25).toFixed(2)),
                    })
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-yellow-400"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateObstacle(selectedObstacle.id, {
                      yMeters: Number((selectedObstacle.yMeters + 0.25).toFixed(2)),
                    })
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-yellow-400"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteObstacle(selectedObstacle.id);
                    setSelectedObstacleId(null);
                  }}
                  className="rounded border border-rose-500/40 bg-rose-500/20 p-1 text-rose-300 hover:bg-rose-500/30"
                  title="Delete Obstacle (Del)"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedObstacleId(null)}
                  className="ml-1 text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}

            {selectedDepot && (
              <div className="absolute left-1/2 top-12 z-20 flex -translate-x-1/2 flex-wrap items-center gap-1.5 rounded-xl border border-sky-400/70 bg-slate-950/95 px-3 py-1.5 text-[11px] text-slate-100 shadow-2xl backdrop-blur">
                <span className="font-bold text-sky-300">
                  {'★ I/O Depot / Entry Point'}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  ({activeDepotX.toFixed(2)}m, {activeDepotZ.toFixed(2)}m)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleMoveDepot(activeDepotX - 0.5, activeDepotZ)
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-sky-400"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleMoveDepot(activeDepotX + 0.5, activeDepotZ)
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-sky-400"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleMoveDepot(activeDepotX, activeDepotZ - 0.5)
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-sky-400"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleMoveDepot(activeDepotX, activeDepotZ + 0.5)
                  }
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 hover:border-sky-400"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleMoveDepot(
                      ((Math.max(1, config.aisles) - 1) *
                        (config.aisleSpacingM ?? 3.4)) /
                        2,
                      0
                    )
                  }
                  className="rounded border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 text-[10px] text-cyan-300 hover:bg-cyan-500/25"
                >
                  {'Reset Center'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDepot(false)}
                  className="ml-1 text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}

            {selectedProp && (
              <div className="absolute left-1/2 top-12 z-20 flex -translate-x-1/2 flex-wrap items-center gap-1.5 rounded-xl border border-emerald-400/60 bg-slate-950/95 px-3 py-1.5 text-[11px] text-slate-100 shadow-2xl backdrop-blur">
                <span className="font-bold text-emerald-300">
                  {selectedProp.label}
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

            {main2DPlanMode !== 'full_2d' && (
              <div className="relative min-h-[420px] min-w-0 flex-1">
                <Warehouse3DViewport
                  allocations={shownResult.allocations}
                  pickRoute={shownResult.pickRoute}
                  config={config}
                  scenarioName={activeScenario.name}
                  viewLayer={viewLayer}
                  selectedBinId={selectedBinId}
                  selectedPropId={selectedPropId}
                  selectedObstacleId={selectedObstacleId}
                  selectedDepot={selectedDepot}
                  selectedCargo={selectedCargo}
                  levelFilter={levelFilter}
                  theme={activeTheme}
                  sceneBg={sceneBg}
                  onSelectBin={handleSelectBin}
                  onSelectProp={(id) => {
                    if (id) setSuppress3DAutoZoom(false);
                    setSelectedPropId(id);
                  }}
                  onSelectObstacle={(id) => {
                    if (id) setSuppress3DAutoZoom(false);
                    setSelectedObstacleId(id);
                  }}
                  onSelectDepot={(sel) => {
                    if (sel) setSuppress3DAutoZoom(false);
                    setSelectedDepot(sel);
                  }}
                  onSelectCargo={(c) => {
                    if (c) setSuppress3DAutoZoom(false);
                    setSelectedCargo(c);
                  }}
                  onContextAction={setContextMenu}
                  dragMoveMode={dragMoveMode}
                  dragScope={dragScope}
                  onMoveSingleBin={handleMoveSingleBin}
                  onMoveRackColumn={handleMoveRackColumn}
                  onMoveWholeTemplate={handleTranslateWholeTemplate}
                  onMoveInteriorProp={(propId, nx, ny) =>
                    handleUpdateInteriorProp(propId, { xMeters: nx, yMeters: ny })
                  }
                  onMoveObstacle={(obsId, nx, ny) =>
                    handleUpdateObstacle(obsId, { xMeters: nx, yMeters: ny })
                  }
                  onMoveDepot={handleMoveDepot}
                  onMoveSingleCargoToBin={handleMoveSingleCargoToBin}
                  onMoveSingleCargoToFloor={handleMoveSingleCargoToFloor}
                  cameraPreset={cameraPreset}
                  cameraResetTick={cameraResetTick}
                  cameraFocusTick={cameraFocusTick}
                  autoZoomEnabled={autoZoomEnabled}
                  suppressAutoZoom={suppress3DAutoZoom}
                  onToggleAutoZoom={() =>
                    setAutoZoomEnabled((prev) => {
                      const next = !prev;
                      showToast(
                        next
                          ? ('✨ Smart Auto-Zoom ON')
                          : ('Smart Auto-Zoom OFF')
                      );
                      return next;
                    })
                  }
                  onEnableAnimateRoute={() => setAnimateRoute(true)}
                  onChangeCameraPreset={setCameraPreset}
                  animateRoute={animateRoute}
                  lang={lang}
                />

                <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 p-1.5 text-[10px] backdrop-blur">
                  <button
                    type="button"
                    onClick={() => {
                      setCameraPreset('iso');
                      setCameraResetTick((t) => t + 1);
                    }}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
                      cameraPreset === 'iso'
                        ? 'bg-slate-800 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={
                      '3D Isometric Auto-Fit (Shortcut: 1)'
                    }
                  >
                    <Compass className="h-3 w-3" />
                    {'3D Iso'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraPreset('top');
                      setCameraResetTick((t) => t + 1);
                    }}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
                      cameraPreset === 'top'
                        ? 'bg-slate-800 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={
                      '2D Top-Down Auto-Fit (Shortcut: 2)'
                    }
                  >
                    <Camera className="h-3 w-3" />
                    {'2D Top'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraPreset('elevation');
                      setCameraResetTick((t) => t + 1);
                    }}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
                      cameraPreset === 'elevation'
                        ? 'bg-slate-800 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={
                      'Z-Elevation Auto-Fit (Shortcut: 3)'
                    }
                  >
                    <RotateCcw className="h-3 w-3" />
                    {'Z-Elevation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraPreset('closeup');
                      setCameraResetTick((t) => t + 1);
                    }}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
                      cameraPreset === 'closeup'
                        ? 'bg-slate-800 text-emerald-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={
                      'Eye-Level Golden Zone Closeup View (Shortcut: 4)'
                    }
                  >
                    <Sparkles className="h-3 w-3" />
                    {'Closeup'}
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
                      ? ('Route On')
                      : ('Route Off')}
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
                      ? ('3D Drag: ON')
                      : ('Move 3D')}
                  </button>

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
                      {'All'}
                    </button>
                    {zBreakdown.map((z) => (
                      <button
                        key={z.level}
                        type="button"
                        onClick={() =>
                          setLevelFilter(
                            levelFilter === z.level ? 'all' : z.level
                          )
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

                <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-800/90 bg-slate-900/80 px-2.5 py-1.5 text-[10px] text-slate-300 backdrop-blur">
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: activeTheme.scene.golden }}
                    />
                    {simpleMode
                      ? `Easy-Reach (${config.goldenZoneMinM}–${config.goldenZoneMaxM}m)`
                      : `Golden Zone (${config.goldenZoneMinM}m–${config.goldenZoneMaxM}m)`}
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: activeTheme.scene.route }}
                    />
                    {simpleMode ? 'Pick Path' : 'Active Pick Wave'}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    {simpleMode ? 'Heavy Alert' : 'Heavy Violation'}
                  </div>
                </div>
              </div>
            )}

            {main2DPlanMode !== 'off' && (
              <div
                className={`flex flex-col border-t border-cyan-500/35 bg-[#06101f] transition-all lg:border-l lg:border-t-0 ${
                  main2DPlanMode === 'full_2d'
                    ? 'flex-1 min-h-[540px]'
                    : split2DSize === 'collapsed'
                      ? 'h-9 shrink-0 overflow-hidden lg:h-auto lg:w-10'
                      : split2DSize === 'compact'
                        ? 'h-64 shrink-0 lg:h-auto lg:w-[340px]'
                        : split2DSize === 'large'
                          ? 'h-[440px] shrink-0 lg:h-auto lg:w-[540px]'
                          : 'h-80 shrink-0 lg:h-auto lg:w-[430px]'
                }`}
              >
                {main2DPlanMode === 'split' && split2DSize === 'collapsed' ? (
                  <button
                    type="button"
                    onClick={() => setSplit2DSize('normal')}
                    className="flex h-full w-full items-center justify-center gap-2 bg-slate-900/95 px-2 py-2 text-[11px] font-bold text-cyan-300 hover:bg-slate-800 lg:flex-col"
                    title="Expand Right 2D Floor Plan"
                  >
                    <MapIcon className="h-4 w-4 text-cyan-400" />
                    <span className="lg:[writing-mode:vertical-rl]">
                      {'Expand 2D Floor Plan ◀'}
                    </span>
                  </button>
                ) : (
                  <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/95 px-3 py-1.5 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <MapIcon className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="font-bold text-cyan-200">
                      {`Main Screen Live 2D Floor Plan & Pick Route (${activeScenario.name})`}
                    </span>
                    <span className="rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      {'⚡ 2D ↔ 3D Live Sync'}
                    </span>

                    <div className="ml-1 flex items-center overflow-hidden rounded-md border border-slate-700 bg-slate-950 p-0.5 text-[10px]">
                      {(
                        [
                          ['drag_edit', '✋ Select & Drag 2D'],
                          ['add_shelf', '➕ Click +Shelf'],
                          ['add_obstacle', '🧱 Click +Pillar'],
                          ['route_toggle', '🚩 Click Pick Stop'],
                        ] as const
                      ).map(([toolId, label]) => (
                        <button
                          key={toolId}
                          type="button"
                          onClick={() => setPlan2DTool(toolId)}
                          className={`rounded px-2 py-0.5 font-semibold transition ${
                            plan2DTool === toolId
                              ? 'bg-cyan-500 text-slate-950'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPlan2DSnapGrid((v) => !v)}
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold transition ${
                        plan2DSnapGrid
                          ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-200'
                          : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                      title="Snap 2D drag movements to 0.25m metric grid"
                    >
                      {plan2DSnapGrid ? 'Grid 0.25m: ON' : 'Free Drag'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <div className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-slate-950/90 px-1.5 py-0.5">
                      <span className="font-semibold text-emerald-300">
                        {'Route:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const occupied = shownResult.allocations.filter(
                            (a) => a.boxes.length > 0
                          );
                          const remaining = [...occupied];
                          const ordered: string[] = [];
                          let cx = activeDepotX;
                          let cy = activeDepotZ;
                          while (remaining.length > 0 && ordered.length < 12) {
                            remaining.sort(
                              (a, b) =>
                                Math.hypot(
                                  a.bin.xMeters - cx,
                                  a.bin.yMeters - cy
                                ) -
                                Math.hypot(
                                  b.bin.xMeters - cx,
                                  b.bin.yMeters - cy
                                )
                            );
                            const next = remaining.shift()!;
                            ordered.push(next.bin.id);
                            cx = next.bin.xMeters;
                            cy = next.bin.yMeters;
                          }
                          pushWorkspaceUndo();
                          setConfigPatch((prev) => ({
                            ...prev,
                            customRouteBinIds: ordered,
                          }));
                          setAnimateRoute(true);
                          showToast(
                            `Updated 2D & 3D Pick Route to Shortest TSP (${ordered.length} stops)`
                          );
                        }}
                        className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-semibold text-emerald-200 hover:bg-emerald-500/35"
                        title="Auto-compute shortest nearest-neighbor pick route and sync to 3D"
                      >
                        {'Shortest TSP'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const golden = shownResult.allocations
                            .filter(
                              (a) => a.boxes.length > 0 && a.bin.isGoldenZone
                            )
                            .sort(
                              (a, b) =>
                                a.bin.aisle - b.bin.aisle ||
                                a.bin.bay - b.bin.bay
                            )
                            .slice(0, 10)
                            .map((a) => a.bin.id);
                          pushWorkspaceUndo();
                          setConfigPatch((prev) => ({
                            ...prev,
                            customRouteBinIds: golden,
                          }));
                          setAnimateRoute(true);
                          showToast(
                            `Updated 2D & 3D Pick Route to Golden Zone Priority (${golden.length} stops)`
                          );
                        }}
                        className="rounded bg-cyan-500/20 px-1.5 py-0.5 font-semibold text-cyan-200 hover:bg-cyan-500/35"
                        title="Route through Golden Zone shelves first"
                      >
                        {'Golden First'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          pushWorkspaceUndo();
                          setConfigPatch((prev) => ({
                            ...prev,
                            customRouteBinIds: undefined,
                          }));
                          showToast('Reset Pick Route to Auto Top-Wave');
                        }}
                        className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 hover:text-white"
                        title="Reset custom route to default wave"
                      >
                        {'Auto'}
                      </button>
                    </div>

                    {main2DPlanMode === 'split' && (
                      <div className="inline-flex items-center rounded border border-slate-700 bg-slate-950/90 p-0.5">
                        {(
                          [
                            { id: 'collapsed', en: 'Fold' },
                            { id: 'compact', en: 'Small' },
                            { id: 'normal', en: 'Medium' },
                            { id: 'large', en: 'Large' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSplit2DSize(opt.id)}
                            className={`rounded px-1.5 py-0.5 font-semibold transition ${
                              split2DSize === opt.id
                                ? 'bg-cyan-500 text-slate-950'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            {opt.en}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSuppress3DAutoZoom(true);
                        if (!selectedBinId) {
                          const firstAlloc =
                            shownResult.allocations.find(
                              (a) => a.boxes.length > 0 && a.bin.isGoldenZone
                            ) ??
                            shownResult.allocations.find(
                              (a) => a.boxes.length > 0
                            ) ??
                            shownResult.allocations[0];
                          if (firstAlloc) setSelectedBinId(firstAlloc.bin.id);
                        }
                        setPlan2DBoxModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded border border-emerald-400/60 bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-200 hover:bg-emerald-500/30"
                      title="Open 2D Box & Content Item Count Window without triggering 3D camera zoom"
                    >
                      {'📦 Box & Item Counts'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapEditorOpen(true)}
                      className="inline-flex items-center gap-1 rounded border border-cyan-500/50 bg-cyan-500/20 px-2 py-0.5 font-semibold text-cyan-200 hover:bg-cyan-500/30"
                    >
                      <Route className="h-3 w-3" />
                      {'Full 2D Studio'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const svgMarkup = generateWarehouseSVG(
                          shownResult,
                          config,
                          activeScenario.name,
                          {
                            includeCartons: true,
                            includePickRoute: true,
                            includeLabels: true,
                            includeElevation: true,
                            planLevelFilter: levelFilter,
                          }
                        );
                        const win = window.open('', '_blank', 'width=1280,height=860');
                        if (win) {
                          const safeName = activeScenario.name
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;');
                          win.document.write(
                            `<!doctype html><html><head><meta charset="utf-8"/><title>2D Floor Plan - ${safeName}</title><style>body{margin:0;background:#071326;color:#e2e8f0;font-family:sans-serif;display:flex;flex-direction:column;height:100vh}header{padding:10px 16px;background:#0f172a;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center}main{flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;padding:12px}svg{max-width:100%;height:auto}</style></head><body><header><strong>${safeName} — 2D Floor Plan & Pick Route (Standalone Window)</strong><button onclick="window.print()" style="background:#22d3ee;color:#082f49;border:0;padding:6px 12px;border-radius:6px;font-weight:bold;cursor:pointer">Print / Save PDF</button></header><main>${svgMarkup}</main></body></html>`
                          );
                          win.document.close();
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-500/20 px-2 py-0.5 font-semibold text-amber-200 hover:bg-amber-500/30"
                      title={
                        'Pop out 2D layout blueprint in a standalone desktop window'
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                      {'Pop-out'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const svgMarkup = generateWarehouseSVG(
                          shownResult,
                          config,
                          activeScenario.name,
                          {
                            includeCartons: true,
                            includePickRoute: true,
                            includeLabels: true,
                            includeElevation: true,
                            planLevelFilter: levelFilter,
                          }
                        );
                        const blob = new Blob([svgMarkup], {
                          type: 'image/svg+xml;charset=utf-8',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${activeScenario.name.replace(/[^a-zA-Z0-9_-]+/g, '_')}_2D_layout.svg`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="inline-flex items-center gap-1 rounded border border-emerald-500/50 bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-200 hover:bg-emerald-500/30"
                    >
                      <Download className="h-3 w-3" />
                      {'.SVG'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950/90 px-3 py-1 text-[10px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-cyan-300">
                      {'Room Floor (m):'}
                    </span>
                    <label className="inline-flex items-center gap-1 text-slate-300">
                      {'W'}
                      <input
                        type="number"
                        step={0.5}
                        min={2}
                        max={60}
                        value={
                          config.floorWidthM ??
                          Number(
                            Math.max(
                              10,
                              config.aisles * (config.aisleSpacingM ?? 3.4) + 2
                            ).toFixed(1)
                          )
                        }
                        onChange={(e) => {
                          const w = Math.max(
                            2,
                            Math.min(60, Number(e.target.value) || 6)
                          );
                          pushWorkspaceUndo();
                          setConfigPatch((prev) => ({
                            ...prev,
                            floorWidthM: w,
                          }));
                        }}
                        className="w-12 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center font-mono text-white"
                      />
                    </label>
                    <span className="text-slate-500">×</span>
                    <label className="inline-flex items-center gap-1 text-slate-300">
                      {'D'}
                      <input
                        type="number"
                        step={0.5}
                        min={2}
                        max={60}
                        value={
                          config.floorDepthM ??
                          Number(
                            Math.max(
                              8,
                              config.baysPerAisle * (config.baySpacingM ?? 1.45) +
                                3.5
                            ).toFixed(1)
                          )
                        }
                        onChange={(e) => {
                          const d = Math.max(
                            2,
                            Math.min(60, Number(e.target.value) || 6)
                          );
                          pushWorkspaceUndo();
                          setConfigPatch((prev) => ({
                            ...prev,
                            floorDepthM: d,
                          }));
                        }}
                        className="w-12 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center font-mono text-white"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const maxX = bins.reduce(
                          (m, b) => Math.max(m, b.xMeters),
                          0
                        );
                        const avgY =
                          bins.length > 0
                            ? bins.reduce((s, b) => s + b.yMeters, 0) /
                              bins.length
                            : 1.8;
                        handleAddBinAtFloor(
                          Number((maxX + 1.1).toFixed(2)),
                          Number(avgY.toFixed(2))
                        );
                        showToast('Added new 3D shelf rack on floor plan');
                      }}
                      className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300 hover:bg-emerald-500/25"
                    >
                      {'+ Add Shelf Rack'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleRotateWholeTemplate90();
                        showToast('Rotated 2D/3D Floor Layout 90°');
                      }}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-300 hover:border-cyan-400 hover:text-white"
                    >
                      {'↻ Rotate 90°'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCenterWholeTemplate();
                        showToast('Centered 2D/3D Floor Layout');
                      }}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-300 hover:border-cyan-400 hover:text-white"
                    >
                      {'⊕ Center'}
                    </button>
                  </div>

                  {selectedBin ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-amber-300">
                        {`Selected [${selectedBin.bin.id}]:`}
                      </span>
                      <span className="text-slate-400">{'Pos(m)'}</span>
                      <input
                        type="number"
                        step={0.25}
                        value={selectedBin.bin.xMeters}
                        onChange={(e) => {
                          if (e.target.value.trim() === '') return;
                          const val = Number(e.target.value);
                          if (!Number.isFinite(val)) return;
                          handleMoveRackColumn(
                            selectedBin.bin.xMeters,
                            selectedBin.bin.yMeters,
                            val,
                            selectedBin.bin.yMeters
                          );
                        }}
                        className="w-12 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center font-mono text-cyan-200"
                        title="X Coordinate (m)"
                      />
                      <input
                        type="number"
                        step={0.25}
                        value={selectedBin.bin.yMeters}
                        onChange={(e) => {
                          if (e.target.value.trim() === '') return;
                          const val = Number(e.target.value);
                          if (!Number.isFinite(val)) return;
                          handleMoveRackColumn(
                            selectedBin.bin.xMeters,
                            selectedBin.bin.yMeters,
                            selectedBin.bin.xMeters,
                            val
                          );
                        }}
                        className="w-12 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center font-mono text-cyan-200"
                        title="Y Coordinate (m)"
                      />
                      <span className="text-slate-400">{'Boxes:'}</span>
                      <input
                        type="number"
                        min={0}
                        max={80}
                        value={selectedBin.boxes.length}
                        onChange={(e) => {
                          if (e.target.value.trim() === '') return;
                          handleSetBinTotalBoxQuota(
                            selectedBin.bin.id,
                            Math.max(
                              0,
                              Math.min(80, Math.round(Number(e.target.value) || 0))
                            ),
                            skus[0]?.id
                          );
                        }}
                        className="w-10 rounded border border-emerald-500/50 bg-slate-900 px-1 py-0.5 text-center font-mono font-bold text-emerald-300"
                        title="Exact box count in this shelf (syncs to 3D)"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddBinAbove(selectedBin)}
                        className="rounded border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 font-semibold text-cyan-200 hover:bg-cyan-500/25"
                      >
                        {'+1 Z-Level'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBin(selectedBin.bin.id)}
                        className="rounded border border-rose-500/40 bg-rose-500/15 px-1.5 py-0.5 font-semibold text-rose-300 hover:bg-rose-500/25"
                      >
                        {'Delete'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400">
                      {
                        '💡 Drag any Shelf, ★ Depot, Furniture, or Pillar on the 2D plan — 3D Digital Twin updates live!'
                      }
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-2">
                  {(() => {
                    const byPos = new Map<string, BinAllocation[]>();
                    for (const a of shownResult.allocations) {
                      if (levelFilter !== 'all' && a.bin.level !== levelFilter) {
                        continue;
                      }
                      const key = `${a.bin.xMeters.toFixed(2)}_${a.bin.yMeters.toFixed(2)}`;
                      const list = byPos.get(key) ?? [];
                      list.push(a);
                      byPos.set(key, list);
                    }
                    const depotX =
                      plan2DDragPreview?.kind === 'depot'
                        ? plan2DDragPreview.curX
                        : activeDepotX;
                    const depotY =
                      plan2DDragPreview?.kind === 'depot'
                        ? plan2DDragPreview.curY
                        : activeDepotZ;
                    const floorW =
                      config.floorWidthM ??
                      Math.max(10, config.aisles * (config.aisleSpacingM ?? 3.4) + 2);
                    const floorD =
                      config.floorDepthM ??
                      Math.max(8, config.baysPerAisle * (config.baySpacingM ?? 1.45) + 3.5);
                    const pxPerM = main2DPlanMode === 'full_2d' ? 48 : 34;
                    const minWX = -1.5;
                    const minWY = -1.5;
                    const maxWX = Math.max(
                      floorW - 0.5,
                      ...shownResult.allocations.map((a) => a.bin.xMeters + 1.8),
                      depotX + 2
                    );
                    const maxWY = Math.max(
                      floorD - 0.5,
                      ...shownResult.allocations.map((a) => a.bin.yMeters + 1.8),
                      depotY + 2
                    );
                    const wPx = Math.max(520, Math.round((maxWX - minWX) * pxPerM));
                    const hPx = Math.max(230, Math.round((maxWY - minWY) * pxPerM));
                    const sx = (wx: number) => (wx - minWX) * pxPerM;
                    const sy = (wy: number) => (maxWY - wy) * pxPerM;

                    const clientToWorld = (clientX: number, clientY: number) => {
                      const svgEl = plan2DSvgRef.current;
                      if (!svgEl) return { wx: 0, wy: 0 };
                      const rect = svgEl.getBoundingClientRect();
                      const scaleX = wPx / Math.max(1, rect.width);
                      const scaleY = hPx / Math.max(1, rect.height);
                      const svgX = (clientX - rect.left) * scaleX;
                      const svgY = (clientY - rect.top) * scaleY;
                      const rawWX = svgX / pxPerM + minWX;
                      const rawWY = maxWY - svgY / pxPerM;
                      const snap = plan2DSnapGrid ? 0.25 : 0.05;
                      return {
                        wx: Number((Math.round(rawWX / snap) * snap).toFixed(2)),
                        wy: Number((Math.round(rawWY / snap) * snap).toFixed(2)),
                      };
                    };

                    const corridorY = depotY + 0.75;
                    const routePts: Array<{ x: number; y: number }> = [
                      { x: depotX, y: depotY },
                    ];
                    let cx = depotX;
                    let cy = depotY;
                    for (const wp of shownResult.pickRoute) {
                      const isDraggedStop =
                        plan2DDragPreview?.kind === 'rack_col' &&
                        Math.abs(wp.xMeters - plan2DDragPreview.origX) < 0.05 &&
                        Math.abs(wp.yMeters - plan2DDragPreview.origY) < 0.05;
                      const wx = isDraggedStop
                        ? plan2DDragPreview.curX
                        : wp.xMeters;
                      const wy = isDraggedStop
                        ? plan2DDragPreview.curY
                        : wp.yMeters;
                      if (
                        Math.abs(wx - cx) >= 0.35 &&
                        cy > corridorY &&
                        wy > corridorY
                      ) {
                        routePts.push({ x: cx, y: corridorY });
                        routePts.push({ x: wx, y: corridorY });
                      } else {
                        routePts.push({ x: wx, y: cy });
                      }
                      routePts.push({ x: wx, y: wy });
                      cx = wx;
                      cy = wy;
                    }
                    if (
                      config.routeReturnToDepot !== false &&
                      shownResult.pickRoute.length > 0
                    ) {
                      if (Math.abs(depotX - cx) >= 0.35 && cy > corridorY) {
                        routePts.push({ x: cx, y: corridorY });
                        routePts.push({ x: depotX, y: corridorY });
                      } else {
                        routePts.push({ x: depotX, y: cy });
                      }
                      routePts.push({ x: depotX, y: depotY });
                    }

                    return (
                      <svg
                        ref={plan2DSvgRef}
                        width={wPx}
                        height={hPx}
                        viewBox={`0 0 ${wPx} ${hPx}`}
                        className={`mx-auto block rounded border border-sky-500/30 bg-[#071326] select-none ${
                          plan2DTool === 'add_shelf' ||
                          plan2DTool === 'add_obstacle'
                            ? 'cursor-crosshair'
                            : 'cursor-default'
                        }`}
                        onPointerMove={(e) => {
                          if (!plan2DDragPreview) return;
                          const { wx, wy } = clientToWorld(e.clientX, e.clientY);
                          if (
                            Math.hypot(
                              wx - plan2DDragPreview.origX,
                              wy - plan2DDragPreview.origY
                            ) >= 0.05
                          ) {
                            plan2DDidDragRef.current = true;
                          }
                          setPlan2DDragPreview((prev) =>
                            prev ? { ...prev, curX: wx, curY: wy } : null
                          );
                        }}
                        onPointerCancel={() => {
                          setPlan2DDragPreview(null);
                        }}
                        onPointerLeave={() => {
                          if (plan2DDragPreview) {
                            setPlan2DDragPreview(null);
                          }
                        }}
                        onPointerUp={() => {
                          if (!plan2DDragPreview) return;
                          const drag = plan2DDragPreview;
                          setPlan2DDragPreview(null);
                          if (
                            Math.hypot(
                              drag.curX - drag.origX,
                              drag.curY - drag.origY
                            ) < 0.05
                          ) {
                            return;
                          }
                          plan2DDidDragRef.current = true;
                          if (drag.kind === 'rack_col') {
                            handleMoveRackColumn(
                              drag.origX,
                              drag.origY,
                              drag.curX,
                              drag.curY
                            );
                            showToast(
                              `Moved 2D/3D Rack Column to (${drag.curX.toFixed(2)}m, ${drag.curY.toFixed(2)}m)`
                            );
                          } else if (drag.kind === 'depot') {
                            handleMoveDepot(drag.curX, drag.curY);
                            showToast(
                              `Moved ★ Depot to (${drag.curX.toFixed(2)}m, ${drag.curY.toFixed(2)}m)`
                            );
                          } else if (drag.kind === 'obstacle') {
                            handleUpdateObstacle(drag.id, {
                              xMeters: drag.curX,
                              yMeters: drag.curY,
                            });
                            showToast(
                              `Moved Pillar/Obstacle to (${drag.curX.toFixed(2)}m, ${drag.curY.toFixed(2)}m)`
                            );
                          } else if (drag.kind === 'prop') {
                            handleUpdateInteriorProp(drag.id, {
                              xMeters: drag.curX,
                              yMeters: drag.curY,
                            });
                            showToast(
                              `Moved 3D Furniture Prop to (${drag.curX.toFixed(2)}m, ${drag.curY.toFixed(2)}m)`
                            );
                          }
                        }}
                        onClick={(e) => {
                          if (plan2DDidDragRef.current) {
                            plan2DDidDragRef.current = false;
                            return;
                          }
                          if (plan2DTool === 'drag_edit') {
                            setSuppress3DAutoZoom(true);
                            if (!selectedBinId) {
                              const firstAlloc =
                                shownResult.allocations.find(
                                  (a) => a.boxes.length > 0 && a.bin.isGoldenZone
                                ) ??
                                shownResult.allocations.find(
                                  (a) => a.boxes.length > 0
                                ) ??
                                shownResult.allocations[0];
                              if (firstAlloc) setSelectedBinId(firstAlloc.bin.id);
                            }
                            setPlan2DBoxModalOpen(true);
                            return;
                          }
                          if (
                            plan2DTool !== 'add_shelf' &&
                            plan2DTool !== 'add_obstacle'
                          ) {
                            return;
                          }
                          const { wx, wy } = clientToWorld(e.clientX, e.clientY);
                          if (plan2DTool === 'add_shelf') {
                            handleAddBinAtFloor(wx, wy);
                            showToast(
                              `Added new 3D shelf at (${wx.toFixed(2)}m, ${wy.toFixed(2)}m)`
                            );
                          } else if (plan2DTool === 'add_obstacle') {
                            const obs = handleAddObstacleAt(wx, wy);
                            setSelectedObstacleId(obs.id);
                            showToast(
                              `Added pillar obstacle at (${wx.toFixed(2)}m, ${wy.toFixed(2)}m)`
                            );
                          }
                        }}
                      >
                        <rect
                          x={sx(-1.0)}
                          y={sy(-1.0 + floorD)}
                          width={floorW * pxPerM}
                          height={floorD * pxPerM}
                          fill={
                            sceneBg.useThemeDefault
                              ? activeTheme.scene.floor
                              : sceneBg.floorColor
                          }
                          fillOpacity={0.22}
                          stroke="#38bdf8"
                          strokeDasharray="5,4"
                          strokeWidth={1.2}
                        />

                        {effectiveInteriorProps.map((prop) => {
                          const isDraggingProp =
                            plan2DDragPreview?.kind === 'prop' &&
                            plan2DDragPreview.id === prop.id;
                          const px = isDraggingProp
                            ? plan2DDragPreview.curX
                            : prop.xMeters;
                          const py = isDraggingProp
                            ? plan2DDragPreview.curY
                            : prop.yMeters;
                          const isSelProp = selectedPropId === prop.id;
                          return (
                            <g
                              key={prop.id}
                              className="cursor-grab active:cursor-grabbing"
                              onPointerDown={(e) => {
                                if (e.button !== 0) return;
                                e.stopPropagation();
                                setSuppress3DAutoZoom(true);
                                setSelectedPropId(prop.id);
                                setSelectedBinId(null);
                                setSelectedDepot(false);
                                setSelectedObstacleId(null);
                                if (plan2DTool === 'drag_edit') {
                                  setPlan2DDragPreview({
                                    kind: 'prop',
                                    id: prop.id,
                                    origX: prop.xMeters,
                                    origY: prop.yMeters,
                                    curX: prop.xMeters,
                                    curY: prop.yMeters,
                                  });
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <rect
                                x={sx(px - 0.45)}
                                y={sy(py + 0.35)}
                                width={0.9 * pxPerM}
                                height={0.7 * pxPerM}
                                rx={4}
                                fill="rgba(16, 185, 129, 0.22)"
                                stroke={isSelProp ? '#facc15' : '#34d399'}
                                strokeWidth={isSelProp ? 2 : 1.1}
                                strokeDasharray="3,2"
                              />
                              <text
                                x={sx(px)}
                                y={sy(py) + 3}
                                textAnchor="middle"
                                fill="#a7f3d0"
                                fontSize="8"
                                fontWeight="bold"
                              >
                                {prop.label.split(' (')[0].slice(0, 10)}
                              </text>
                            </g>
                          );
                        })}

                        <g
                          className="cursor-grab active:cursor-grabbing"
                          onPointerDown={(e) => {
                            if (e.button !== 0) return;
                            e.stopPropagation();
                            setSuppress3DAutoZoom(true);
                            setSelectedDepot(true);
                            setSelectedBinId(null);
                            setSelectedPropId(null);
                            setSelectedObstacleId(null);
                            if (plan2DTool === 'drag_edit') {
                              setPlan2DDragPreview({
                                kind: 'depot',
                                id: 'depot',
                                origX: activeDepotX,
                                origY: activeDepotZ,
                                curX: activeDepotX,
                                curY: activeDepotZ,
                              });
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <rect
                            x={sx(depotX - 1.1)}
                            y={sy(depotY + 0.45)}
                            width={2.2 * pxPerM}
                            height={0.9 * pxPerM}
                            rx={4}
                            fill="rgba(2, 132, 199, 0.45)"
                            stroke={selectedDepot ? '#facc15' : '#38bdf8'}
                            strokeWidth={selectedDepot ? 2.2 : 1.6}
                          />
                          <text
                            x={sx(depotX)}
                            y={sy(depotY) + 3}
                            textAnchor="middle"
                            fill="#e0f2fe"
                            fontSize="9"
                            fontWeight="bold"
                          >
                            ★ DEPOT (Drag)
                          </text>
                        </g>

                        {(config.obstacles ?? []).map((obs) => {
                          const isDraggingObs =
                            plan2DDragPreview?.kind === 'obstacle' &&
                            plan2DDragPreview.id === obs.id;
                          const ox = isDraggingObs
                            ? plan2DDragPreview.curX
                            : obs.xMeters;
                          const oy = isDraggingObs
                            ? plan2DDragPreview.curY
                            : obs.yMeters;
                          const isSelObs = selectedObstacleId === obs.id;
                          return (
                            <g
                              key={obs.id}
                              className="cursor-grab active:cursor-grabbing"
                              onPointerDown={(e) => {
                                if (e.button !== 0) return;
                                e.stopPropagation();
                                setSuppress3DAutoZoom(true);
                                setSelectedObstacleId(obs.id);
                                setSelectedBinId(null);
                                setSelectedPropId(null);
                                setSelectedDepot(false);
                                if (plan2DTool === 'drag_edit') {
                                  setPlan2DDragPreview({
                                    kind: 'obstacle',
                                    id: obs.id,
                                    origX: obs.xMeters,
                                    origY: obs.yMeters,
                                    curX: obs.xMeters,
                                    curY: obs.yMeters,
                                  });
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <rect
                                x={sx(ox - 0.35)}
                                y={sy(oy + 0.35)}
                                width={0.7 * pxPerM}
                                height={0.7 * pxPerM}
                                fill="rgba(234,179,8,0.35)"
                                stroke={isSelObs ? '#ef4444' : '#facc15'}
                                strokeWidth={isSelObs ? 2.2 : 1.4}
                              />
                              <text
                                x={sx(ox)}
                                y={sy(oy) + 3}
                                textAnchor="middle"
                                fill="#fef08a"
                                fontSize="8"
                                fontWeight="bold"
                              >
                                🧱
                              </text>
                            </g>
                          );
                        })}

                        {[...byPos.entries()].map(([posKey, stack]) => {
                          const topBin = stack[0].bin;
                          const isDraggingCol =
                            plan2DDragPreview?.kind === 'rack_col' &&
                            plan2DDragPreview.id === posKey;
                          const dispX = isDraggingCol
                            ? plan2DDragPreview.curX
                            : topBin.xMeters;
                          const dispY = isDraggingCol
                            ? plan2DDragPreview.curY
                            : topBin.yMeters;
                          const totalBoxes = stack.reduce(
                            (s, a) => s + a.boxes.length,
                            0
                          );
                          const isSelectedStack = stack.some(
                            (a) => a.bin.id === selectedBinId
                          );
                          const targetAlloc =
                            stack.find((a) => a.bin.isGoldenZone) ?? stack[0];
                          const wM = topBin.binWidthCm / 100;
                          const lM = topBin.binLengthCm / 100;
                          const rx = sx(dispX - wM / 2);
                          const ry = sy(dispY + lM / 2);
                          const rw = wM * pxPerM;
                          const rh = lM * pxPerM;
                          const stopIdx = shownResult.pickRoute.findIndex((wp) =>
                            stack.some((a) => a.bin.id === wp.binId)
                          );

                          const toggleRouteStopForStack = () => {
                            const curRoute =
                              config.customRouteBinIds &&
                              config.customRouteBinIds.length > 0
                                ? [...config.customRouteBinIds]
                                : shownResult.pickRoute.map((w) => w.binId);
                            const existingIdx = curRoute.findIndex((id) =>
                              stack.some((a) => a.bin.id === id)
                            );
                            const nextRoute =
                              existingIdx !== -1
                                ? curRoute.filter((_, i) => i !== existingIdx)
                                : [...curRoute, targetAlloc.bin.id];
                            pushWorkspaceUndo();
                            setConfigPatch((prev) => ({
                              ...prev,
                              customRouteBinIds: nextRoute,
                            }));
                            showToast(
                              existingIdx !== -1
                                ? `Removed [${targetAlloc.bin.id}] from Pick Route`
                                : `Added [${targetAlloc.bin.id}] as Route Stop #${nextRoute.length}`
                            );
                          };

                          return (
                            <g
                              key={posKey}
                              className={
                                plan2DTool === 'route_toggle'
                                  ? 'cursor-pointer'
                                  : 'cursor-grab active:cursor-grabbing'
                              }
                              onPointerDown={(e) => {
                                if (e.button !== 0) return;
                                e.stopPropagation();
                                plan2DDidDragRef.current = false;
                                setSuppress3DAutoZoom(true);
                                setSelectedBinId(targetAlloc.bin.id);
                                setSelectedPropId(null);
                                setSelectedDepot(false);
                                setSelectedObstacleId(null);
                                if (plan2DTool === 'route_toggle') {
                                  toggleRouteStopForStack();
                                  return;
                                }
                                if (plan2DTool === 'drag_edit') {
                                  setPlan2DDragPreview({
                                    kind: 'rack_col',
                                    id: posKey,
                                    origX: topBin.xMeters,
                                    origY: topBin.yMeters,
                                    curX: topBin.xMeters,
                                    curY: topBin.yMeters,
                                  });
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (plan2DDidDragRef.current) {
                                  plan2DDidDragRef.current = false;
                                  return;
                                }
                                if (plan2DTool === 'route_toggle') {
                                  return;
                                }
                                handleSelectBinFrom2D(targetAlloc, true);
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleRouteStopForStack();
                              }}
                            >
                              {isSelectedStack && (
                                <rect
                                  x={rx - 3.5}
                                  y={ry - 3.5}
                                  width={rw + 7}
                                  height={rh + 7}
                                  rx={5}
                                  fill="none"
                                  stroke="#facc15"
                                  strokeWidth={2}
                                  strokeDasharray="4,2"
                                />
                              )}
                              <rect
                                x={rx}
                                y={ry}
                                width={rw}
                                height={rh}
                                rx={3}
                                fill={
                                  isDraggingCol
                                    ? 'rgba(250, 204, 21, 0.35)'
                                    : totalBoxes > 0
                                      ? 'rgba(34, 211, 238, 0.28)'
                                      : 'rgba(51, 65, 85, 0.35)'
                                }
                                stroke={
                                  isSelectedStack
                                    ? '#facc15'
                                    : stopIdx !== -1
                                      ? '#10b981'
                                      : '#22d3ee'
                                }
                                strokeWidth={isSelectedStack ? 2.4 : 1.3}
                              />
                              <text
                                x={rx + rw / 2}
                                y={ry + rh / 2 + 3}
                                textAnchor="middle"
                                fill="#f8fafc"
                                fontSize="9"
                                fontWeight="bold"
                              >
                                A{topBin.aisle}-B{topBin.bay}
                              </text>
                              {totalBoxes > 0 && (
                                <g>
                                  <circle
                                    cx={rx + rw - 1}
                                    cy={ry + 1}
                                    r={7.5}
                                    fill="#f59e0b"
                                    stroke="#0f172a"
                                    strokeWidth={1.2}
                                  />
                                  <text
                                    x={rx + rw - 1}
                                    y={ry + 3.8}
                                    textAnchor="middle"
                                    fill="#0f172a"
                                    fontSize="8"
                                    fontWeight="bold"
                                  >
                                    {totalBoxes}
                                  </text>
                                </g>
                              )}
                              {stopIdx !== -1 && (
                                <g>
                                  <circle
                                    cx={rx + 2}
                                    cy={ry + 2}
                                    r={7.5}
                                    fill="#10b981"
                                    stroke="#022c22"
                                    strokeWidth={1.2}
                                  />
                                  <text
                                    x={rx + 2}
                                    y={ry + 4.8}
                                    textAnchor="middle"
                                    fill="#022c22"
                                    fontSize="8"
                                    fontWeight="bold"
                                  >
                                    #{stopIdx + 1}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        })}

                        {animateRoute && routePts.length > 1 && (
                          <polyline
                            points={routePts
                              .map((p) => `${sx(p.x)},${sy(p.y)}`)
                              .join(' ')}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth={2.2}
                            strokeDasharray="5,3"
                            pointerEvents="none"
                          />
                        )}
                      </svg>
                    );
                  })()}
                </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

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
            onFocusBinId={(binId) => {
              setSelectedBinId(binId);
              setCameraFocusTick((n) => n + 1);
              setLeftTab('inspector');
              showToast(
                `Focused & Zoomed to Recommended Bin [${binId}]`
              );
            }}
            onExecuteAiAction={(action: HybridAIAction) => {
              if (action.kind === 'apply_preset_safety') {
                setOptimizationPreset('safety');
                setActiveLayout('optimized_3d');
              } else if (action.kind === 'apply_preset_speed') {
                setOptimizationPreset('speed');
                setActiveLayout('optimized_3d');
              } else if (action.kind === 'apply_preset_density') {
                setOptimizationPreset('density');
                setActiveLayout('optimized_3d');
              } else if (action.kind === 'enable_smart_fit') {
                setAllowRotationAndCoPack(true);
                setActiveLayout('optimized_3d');
              } else if (action.kind === 'switch_view_heatmap') {
                setViewLayer('heatmap');
              } else if (action.kind === 'switch_view_golden_zone') {
                setViewLayer('golden_zone');
              } else if (action.kind === 'switch_equipment_asrs') {
                setEquipmentMode('asrs_crane');
              } else {
                setActiveLayout('optimized_3d');
              }
              showToast(
                `Applied Action: ${action.labelEn}`
              );
            }}
            lang={lang}
          />
        </section>
      </main>
        </>
      )}

      <ViewportContextMenu
        menu={
          contextMenu
            ? {
                ...contextMenu,
                binAlloc: contextMenu.binAlloc
                  ? (shownResult.allocations.find(
                      (a) => a.bin.id === contextMenu.binAlloc?.bin.id
                    ) ?? contextMenu.binAlloc)
                  : null,
                interiorProp: contextMenu.interiorProp
                  ? (effectiveInteriorProps.find(
                      (p) => p.id === contextMenu.interiorProp?.id
                    ) ?? contextMenu.interiorProp)
                  : null,
              }
            : null
        }
        skus={skus}
        selectedProp={selectedProp}
        levelFilter={levelFilter}
        maxLevels={Math.max(config.levels, zBreakdown.length)}
        activeLayout={activeLayout}
        optimizationPreset={optimizationPreset}
        allowRotationAndCoPack={allowRotationAndCoPack}
        equipmentMode={equipmentMode}
        viewLayer={viewLayer}
        cameraPreset={cameraPreset}
        animateRoute={animateRoute}
        dragMoveMode={dragMoveMode}
        dragScope={dragScope}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        scenePresetId={sceneBg.presetId}
        floorColor={
          sceneBg.useThemeDefault ? activeTheme.scene.floor : sceneBg.floorColor
        }
        xrayBins={sceneBg.xrayBins}
        appView={appView}
        simpleMode={simpleMode}
        lang={lang}
        onClose={() => setContextMenu(null)}
        onInspectBin={(alloc) => {
          setSelectedBinId(alloc.bin.id);
          setLeftTab('inspector');
          setAppView('workspace');
        }}
        onPinSkuToBin={(binId, skuId, delta = 1) =>
          handlePinCargo(binId, skuId, delta)
        }
        onSetCargoCountInBin={handleSetCargoCountInBin}
        onSetBinTotalBoxQuota={handleSetBinTotalBoxQuota}
        onPlaceCustomBoxInBin={handlePlaceCustomBoxInBin}
        onResizeSingleBin={handleResizeSingleBin}
        onChangeFloorColor={handleChangeFloorColor}
        onAddObstacleAtFloor={(x, z) => {
          const obs = handleAddObstacleAt(x, z);
          setSelectedObstacleId(obs.id);
        }}
        onMoveDepotToFloor={(x, z) => {
          handleMoveDepot(x, z);
          setSelectedDepot(true);
        }}
        onMoveSkuToLevel={handleMoveSkuToLevel}
        onClearBinPins={(binId) => {
          pushWorkspaceUndo();
          setPinnedPlacements((prev) => prev.filter((p) => p.binId !== binId));
        }}
        onClearAllPins={() => {
          pushWorkspaceUndo();
          setPinnedPlacements([]);
        }}
        onAddBinAbove={handleAddBinAbove}
        onAddBinAtFloor={handleAddBinAtFloor}
        onDeleteBin={handleDeleteBin}
        onAddInteriorPropAt={handleAddInteriorProp}
        onUpdateInteriorProp={handleUpdateInteriorProp}
        onDuplicateInteriorProp={handleDuplicateInteriorProp}
        onDeleteInteriorProp={handleDeleteInteriorProp}
        onAutoPopulateInterior={handleAutoPopulateInterior}
        onToggleLevelSlice={setLevelFilter}
        onAuditBinWithAi={(alloc) => {
          setSelectedBinId(alloc.bin.id);
          setAppView('workspace');
          setExternalAiPrompt({
            id: Date.now(),
            mode: 'prefer_on_device',
            prompt:
              `Audit bin ${alloc.bin.id} (Z${alloc.bin.level}, ${alloc.bin.zMeters}m, cubic=${alloc.cubicUtilizationPct.toFixed(1)}%, load=${alloc.currentWeightKg.toFixed(1)}/${alloc.bin.maxWeightKg}kg). Recommend exact 3D slotting improvements.`,
          });
        }}
        onRunQuickAiPrompt={(kind) => {
          setAppView('workspace');
          const promptMap = {
            efficiency:
              `Audit the Golden Zone (${config.goldenZoneMinM}m-${config.goldenZoneMaxM}m) hit rate and space usage.`,
            safety:
              'Check for heavy items placed too high or aisle congestion.',
            offline:
              'Run a local-only check on the currently focused bin.',
          };
          setExternalAiPrompt({
            id: Date.now(),
            mode: kind === 'offline' ? 'only_on_device' : 'prefer_on_device',
            prompt: promptMap[kind],
          });
        }}
        onOpenCadExport={() => setCadModalOpen(true)}
        onOpenMapEditor={() => setMapEditorOpen(true)}
        onOpenTemplateGallery={() => setTemplateGalleryOpen(true)}
        onQuickSelectScenario={(id) => {
          handleSelectScenario(id);
          setAppView('workspace');
        }}
        onExportSkusCsv={() => exportSkusToCSV(skus, activeScenario.name)}
        onExportSlottingCsv={() =>
          exportSlottingResultToCSV(shownResult, activeScenario.name)
        }
        onOpenEditor={() => {
          setLeftTab('editor');
          setAppView('workspace');
        }}
        onOpenLeftTab={(tab) => {
          setLeftTab(tab);
          setAppView('workspace');
        }}
        onChangeViewLayer={(layer) => {
          setViewLayer(layer);
          setAppView('workspace');
        }}
        onChangeCameraPreset={(preset) => {
          setCameraPreset(preset);
          setAppView('workspace');
        }}
        onToggleAnimateRoute={() => setAnimateRoute((v) => !v)}
        onToggleLayout={() => {
          if (alwaysOptimizedLock && activeLayout === 'optimized_3d') {
            setAlwaysOptimizedLock(false);
            setActiveLayout('baseline_2d');
            showToast(
              'Unlocked Always-Optimized lock and switched to 2D Baseline comparison.'
            );
            return;
          }
          setActiveLayout((l) =>
            l === 'optimized_3d' ? 'baseline_2d' : 'optimized_3d'
          );
        }}
        onChangeOptimizationPreset={(preset) => {
          setOptimizationPreset(preset);
          setActiveLayout('optimized_3d');
        }}
        onToggleRotationAndCoPack={() =>
          setAllowRotationAndCoPack((v) => !v)
        }
        onChangeEquipmentMode={setEquipmentMode}
        onUndo={handleWorkspaceUndo}
        onRedo={handleWorkspaceRedo}
        onToggleDragMove={(scope) => {
          if (dragMoveMode && dragScope === scope) {
            setDragMoveMode(false);
          } else {
            setDragMoveMode(true);
            setDragScope(scope);
          }
        }}
        onTranslateWholeTemplate={handleTranslateWholeTemplate}
        onRotateWholeTemplate90={handleRotateWholeTemplate90}
        onScaleWholeTemplateSpacing={handleScaleWholeTemplateSpacing}
        onCenterWholeTemplate={handleCenterWholeTemplate}
        onResetSpaceEdits={() => {
          pushWorkspaceUndo();
          setConfigPatch({});
          setCustomBinsOverride(null);
          setExtraBins([]);
          setRemovedBinIds([]);
          setPinnedPlacements([]);
        }}
        onResetCamera={() => {
          setCameraPreset('iso');
          setCameraResetTick((t) => t + 1);
        }}
        onApplyScenePreset={(pid) => {
          const found = SCENE_3D_PRESETS.find((x) => x.id === pid);
          if (found) {
            setSceneBg((prev) => ({
              ...prev,
              presetId: found.id,
              ...found.settings,
            }));
          }
        }}
        onToggleXrayBins={() =>
          setSceneBg((prev) => ({ ...prev, xrayBins: !prev.xrayBins }))
        }
        onOpenInteriorModal={(tab = 'interior') => {
          setInteriorInitialTab(tab);
          setInteriorModalOpen(true);
        }}
        onOpenSceneBgModal={() => setSceneBgModalOpen(true)}
        onOpenDesignMenu={() => setDesignMenuOpen(true)}
        onCycleTheme={cycleTheme}
        onToggleAppView={() =>
          setAppView((v) => (v === 'home' ? 'workspace' : 'home'))
        }
        onToggleSimpleMode={() => setSimpleMode((v) => !v)}
        onToggleLanguage={toggleLanguage}
        onOpenFirebaseSetup={() => setSetupOpen(true)}
      />

      <Suspense fallback={null}>
        {templateGalleryOpen && (
          <TemplateGalleryModal
            open={templateGalleryOpen}
            onClose={() => setTemplateGalleryOpen(false)}
            activeTemplateId={scenarioId}
            onSelectTemplate={(tpl) => {
              handleSelectScenario(tpl.id);
            }}
            lang={lang}
          />
        )}

        {mapEditorOpen && (
          <MapEditorModal
            open={mapEditorOpen}
            onClose={() => setMapEditorOpen(false)}
            config={config}
            bins={bins}
            scenario={activeScenario}
            skus={skus}
            floorColor={
              sceneBg.useThemeDefault
                ? activeTheme.scene.floor
                : sceneBg.floorColor
            }
            onChangeFloorColor={handleChangeFloorColor}
            lang={lang}
            allocations={shownResult.allocations}
            onPinCargo={handlePinCargo}
            onSetCargoCountInBin={handleSetCargoCountInBin}
            onSetBinTotalBoxQuota={handleSetBinTotalBoxQuota}
            onPlaceCustomBoxInBin={handlePlaceCustomBoxInBin}
            onApplyMapEdits={({ configPatch: nextPatch, customBins, closeModal = true }) => {
              pushWorkspaceUndo();
              setConfigPatch((prev) => ({ ...prev, ...nextPatch }));
              setCustomBinsOverride(customBins);
              setRemovedBinIds([]);
              setExtraBins([]);
              setSelectedBinId(null);
              setCameraResetTick((t) => t + 1);
              if (closeModal) setMapEditorOpen(false);
            }}
            onSaveCustomScenario={handleSaveCustomScenario}
          />
        )}

        {cadModalOpen && (
          <CadPreviewModal
            open={cadModalOpen}
            onClose={() => setCadModalOpen(false)}
            result={shownResult}
            config={config}
            scenarioName={activeScenario.name}
            lang={lang}
          />
        )}

        {setupOpen && (
          <FirebaseSetupModal
            open={setupOpen}
            onClose={() => setSetupOpen(false)}
            onApplyConfig={handleApplyFirebaseConfig}
            lang={lang}
          />
        )}

        {interiorModalOpen && (
          <InteriorStudioModal
            open={interiorModalOpen}
            initialTab={interiorInitialTab}
            onClose={() => setInteriorModalOpen(false)}
            lang={lang}
            interiorProps={effectiveInteriorProps}
            selectedPropId={selectedPropId}
            roomEnclosure={config.roomEnclosure ?? 'cutaway_corner'}
            wallColor={config.wallColor ?? '#b45309'}
            onSelectProp={setSelectedPropId}
            onAddProp={handleAddInteriorProp}
            onUpdateProp={handleUpdateInteriorProp}
            onDuplicateProp={handleDuplicateInteriorProp}
            onDeleteProp={handleDeleteInteriorProp}
            onClearProps={() => {
              pushWorkspaceUndo();
              setConfigPatch((prev) => ({ ...prev, interiorProps: [] }));
              setSelectedPropId(null);
            }}
            onAutoPopulateInterior={handleAutoPopulateInterior}
            onChangeRoomEnclosure={(style: RoomEnclosureStyle) => {
              pushWorkspaceUndo();
              setConfigPatch((prev) => ({ ...prev, roomEnclosure: style }));
            }}
            onChangeWallColor={(color: string) => {
              pushWorkspaceUndo();
              setConfigPatch((prev) => ({ ...prev, wallColor: color }));
            }}
          />
        )}
      </Suspense>

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

      <Plan2DBoxInspectorModal
        open={plan2DBoxModalOpen}
        onClose={() => setPlan2DBoxModalOpen(false)}
        scenarioName={activeScenario.name}
        config={config}
        result={shownResult}
        skus={skus}
        selectedBin={selectedBin}
        onSelectBinWithoutZoom={(alloc) =>
          handleSelectBinFrom2D(alloc, false)
        }
        onSetBinTotalBoxQuota={handleSetBinTotalBoxQuota}
        onSetCargoCountInBin={handleSetCargoCountInBin}
        onPinCargo={handlePinCargo}
        onPlaceCustomBoxInBin={handlePlaceCustomBoxInBin}
        onAddBinAbove={handleAddBinAbove}
      />
    </div>
  );
}

export default App;
