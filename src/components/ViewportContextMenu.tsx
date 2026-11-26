import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  Bot,
  Boxes,
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
  Copy,
  Cpu,
  Download,
  Eraser,
  Eye,
  FileSpreadsheet,
  Flame,
  Home,
  Keyboard,
  Languages,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  Move,
  PackagePlus,
  Palette,
  Play,
  PlusSquare,
  Redo2,
  RotateCcw,
  RotateCw,
  Ruler,
  Settings,
  Sliders,
  Sparkles,
  Sun,
  Trash2,
  Truck,
  Undo2,
} from 'lucide-react';
import { INTERIOR_PROP_CATALOG } from './InteriorStudioModal';
import type {
  CustomBoxPlacementInput,
  ShelfResizeScope,
} from '../hooks/useWarehouseTransforms';
import type { LangCode } from '../i18n/translations';
import type {
  BinAllocation,
  DragScope,
  EquipmentMode,
  InteriorProp,
  InteriorPropType,
  OptimizationPreset,
  SKUItem,
  ViewLayerMode,
} from '../types/warehouse';

export interface ViewportContextState {
  clientX: number;
  clientY: number;
  binAlloc: BinAllocation | null;
  interiorProp?: InteriorProp | null;
  floorPoint: { x: number; z: number } | null;
}

type ContextTab = 'target' | 'optimize' | 'view3d' | 'space_data' | 'ai_system' | 'all';

interface ViewportContextMenuProps {
  menu: ViewportContextState | null;
  skus: SKUItem[];
  selectedProp?: InteriorProp | null;
  levelFilter: number | 'all';
  maxLevels?: number;
  activeLayout: 'baseline_2d' | 'optimized_3d';
  optimizationPreset?: OptimizationPreset;
  allowRotationAndCoPack?: boolean;
  equipmentMode?: EquipmentMode;
  viewLayer?: ViewLayerMode;
  cameraPreset?: 'iso' | 'top' | 'elevation' | 'closeup';
  animateRoute?: boolean;
  dragMoveMode?: boolean;
  dragScope?: DragScope;
  canUndo?: boolean;
  canRedo?: boolean;
  scenePresetId?: string;
  floorColor?: string;
  xrayBins?: boolean;
  appView?: 'workspace' | 'home';
  simpleMode?: boolean;
  lang?: LangCode;
  onClose: () => void;
  onInspectBin: (alloc: BinAllocation) => void;
  onPinSkuToBin: (binId: string, skuId: string, delta?: number) => void;
  onSetCargoCountInBin?: (
    binId: string,
    skuId: string,
    exactCount: number,
    autoExpandBin?: boolean
  ) => void;
  onSetBinTotalBoxQuota?: (
    binId: string,
    targetTotalBoxes: number,
    fallbackSkuId?: string
  ) => void;
  onPlaceCustomBoxInBin?: (input: CustomBoxPlacementInput) => void;
  onResizeSingleBin?: (
    binId: string,
    patch: {
      binLengthCm?: number;
      binWidthCm?: number;
      binHeightCm?: number;
      maxWeightKg?: number;
    },
    scope?: ShelfResizeScope
  ) => void;
  onChangeFloorColor?: (color: string) => void;
  onAddObstacleAtFloor?: (x: number, z: number) => void;
  onMoveDepotToFloor?: (x: number, z: number) => void;
  onMoveSkuToLevel?: (
    fromBinId: string,
    skuId: string,
    targetLevel: number
  ) => void;
  onClearBinPins: (binId: string) => void;
  onClearAllPins?: () => void;
  onAddBinAbove: (alloc: BinAllocation) => void;
  onAddBinAtFloor: (x: number, z: number) => void;
  onDeleteBin: (binId: string) => void;
  onAddInteriorPropAt?: (
    type: InteriorPropType,
    x?: number,
    z?: number
  ) => void;
  onUpdateInteriorProp?: (id: string, patch: Partial<InteriorProp>) => void;
  onDuplicateInteriorProp?: (id: string) => void;
  onDeleteInteriorProp?: (id: string) => void;
  onAutoPopulateInterior?: () => void;
  onToggleLevelSlice: (level: number | 'all') => void;
  onAuditBinWithAi: (alloc: BinAllocation) => void;
  onRunQuickAiPrompt?: (kind: 'efficiency' | 'safety' | 'offline') => void;
  onOpenCadExport: () => void;
  onOpenMapEditor: () => void;
  onOpenTemplateGallery?: () => void;
  onQuickSelectScenario?: (scenarioId: string) => void;
  onExportSkusCsv?: () => void;
  onExportSlottingCsv?: () => void;
  onOpenEditor: () => void;
  onOpenLeftTab?: (tab: 'optimizer' | 'editor' | 'inspector') => void;
  onChangeViewLayer: (layer: ViewLayerMode) => void;
  onChangeCameraPreset?: (preset: 'iso' | 'top' | 'elevation' | 'closeup') => void;
  onToggleAnimateRoute?: () => void;
  onToggleLayout: () => void;
  onChangeOptimizationPreset?: (preset: OptimizationPreset) => void;
  onToggleRotationAndCoPack?: () => void;
  onChangeEquipmentMode?: (mode: EquipmentMode) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleDragMove?: (scope: DragScope) => void;
  onTranslateWholeTemplate?: (dx: number, dy: number) => void;
  onRotateWholeTemplate90?: () => void;
  onScaleWholeTemplateSpacing?: (factor: number) => void;
  onCenterWholeTemplate?: () => void;
  onResetSpaceEdits?: () => void;
  onResetCamera: () => void;
  onApplyScenePreset?: (presetId: string) => void;
  onToggleXrayBins?: () => void;
  onOpenInteriorModal?: (tab?: 'interior' | 'shortcuts') => void;
  onOpenSceneBgModal?: () => void;
  onOpenDesignMenu?: () => void;
  onCycleTheme?: (delta: number) => void;
  onToggleAppView?: () => void;
  onToggleSimpleMode?: () => void;
  onToggleLanguage?: () => void;
  onOpenFirebaseSetup?: () => void;
}

export const ViewportContextMenu: React.FC<ViewportContextMenuProps> = ({
  menu,
  skus,
  selectedProp,
  levelFilter,
  maxLevels = 5,
  activeLayout,
  optimizationPreset = 'balanced',
  allowRotationAndCoPack = true,
  equipmentMode = 'reach_truck',
  viewLayer = 'slotting',
  cameraPreset = 'iso',
  animateRoute = true,
  dragMoveMode = false,
  dragScope = 'whole_template',
  canUndo = false,
  canRedo = false,
  scenePresetId = 'daylight-studio',
  floorColor = '#e2e8f0',
  xrayBins = false,
  appView = 'workspace',
  simpleMode = true,
  lang = 'en',
  onClose,
  onInspectBin,
  onPinSkuToBin,
  onSetCargoCountInBin,
  onSetBinTotalBoxQuota,
  onPlaceCustomBoxInBin,
  onResizeSingleBin,
  onChangeFloorColor,
  onAddObstacleAtFloor,
  onMoveDepotToFloor,
  onMoveSkuToLevel,
  onClearBinPins,
  onClearAllPins,
  onAddBinAbove,
  onAddBinAtFloor,
  onDeleteBin,
  onAddInteriorPropAt,
  onUpdateInteriorProp,
  onDuplicateInteriorProp,
  onDeleteInteriorProp,
  onAutoPopulateInterior,
  onToggleLevelSlice,
  onAuditBinWithAi,
  onRunQuickAiPrompt,
  onOpenCadExport,
  onOpenMapEditor,
  onOpenTemplateGallery,
  onQuickSelectScenario,
  onExportSkusCsv,
  onExportSlottingCsv,
  onOpenEditor,
  onOpenLeftTab,
  onChangeViewLayer,
  onChangeCameraPreset,
  onToggleAnimateRoute,
  onToggleLayout,
  onChangeOptimizationPreset,
  onToggleRotationAndCoPack,
  onChangeEquipmentMode,
  onUndo,
  onRedo,
  onToggleDragMove,
  onTranslateWholeTemplate,
  onRotateWholeTemplate90,
  onScaleWholeTemplateSpacing,
  onCenterWholeTemplate,
  onResetSpaceEdits,
  onResetCamera,
  onApplyScenePreset,
  onToggleXrayBins,
  onOpenInteriorModal,
  onOpenSceneBgModal,
  onOpenDesignMenu,
  onCycleTheme,
  onToggleAppView,
  onToggleSimpleMode,
  onToggleLanguage,
  onOpenFirebaseSetup,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<ContextTab>('target');
  const [showAllSkus, setShowAllSkus] = useState(false);
  const [customBoxL, setCustomBoxL] = useState(40);
  const [customBoxW, setCustomBoxW] = useState(30);
  const [customBoxH, setCustomBoxH] = useState(24);
  const [customBoxKg, setCustomBoxKg] = useState(5);
  const [customBoxQty, setCustomBoxQty] = useState(1);

  useEffect(() => {
    if (!menu) return;
    setTab('target');
    setShowAllSkus(false);
    if (menu.binAlloc) {
      setCustomBoxL(Math.min(40, Math.max(10, menu.binAlloc.bin.binLengthCm - 4)));
      setCustomBoxW(Math.min(30, Math.max(10, menu.binAlloc.bin.binWidthCm - 4)));
      setCustomBoxH(Math.min(24, Math.max(10, menu.binAlloc.bin.binHeightCm - 4)));
    }
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const isKo = lang === 'ko';
  const menuWidth = 340;
  const menuMaxHeight = 560;
  const left = Math.max(
    8,
    Math.min(menu.clientX, window.innerWidth - menuWidth - 12)
  );
  const top = Math.max(
    8,
    Math.min(menu.clientY, window.innerHeight - menuMaxHeight - 12)
  );
  const alloc = menu.binAlloc;
  const prop = menu.interiorProp ?? selectedProp ?? null;

  const visibleSkus = showAllSkus ? skus : skus.slice(0, 6);

  const renderTargetSection = () => (
    <div className="space-y-1.5">
      {alloc ? (
        <>
          <div className="rounded-lg border border-cyan-500/30 bg-slate-950/70 px-2.5 py-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300">
                {isKo ? `Bin ${alloc.bin.id}` : `Bin ${alloc.bin.id}`}
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px]">
                Z{alloc.bin.level} ({alloc.bin.zMeters}m)
              </span>
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--t-muted)]">
              {alloc.cubicUtilizationPct.toFixed(1)}% {isKo ? 'fill' : 'fill'} ·{' '}
              {alloc.currentWeightKg.toFixed(1)}/{alloc.bin.maxWeightKg}kg ·{' '}
              {alloc.boxes.length} {isKo ? 'boxes' : 'boxes'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                onInspectBin(alloc);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2 py-1.5 text-left text-[11px] font-medium hover:border-[var(--t-accent)]"
            >
              <Eye className="h-3.5 w-3.5 text-cyan-400" />
              {isKo ? 'Inspect Details' : 'Inspect Details'}
            </button>
            <button
              type="button"
              onClick={() => {
                onAuditBinWithAi(alloc);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2 py-1.5 text-left text-[11px] font-medium hover:border-[var(--t-accent)]"
            >
              <Bot className="h-3.5 w-3.5 text-cyan-400" />
              {isKo ? 'AI Bin Audit' : 'AI Bin Audit'}
            </button>
          </div>

          {onResizeSingleBin && (
            <div className="space-y-1.5 rounded-lg border border-cyan-500/35 bg-slate-950/75 p-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-cyan-300">
                <span>
                  {isKo
                    ? `Resize Shelf (${alloc.bin.binLengthCm}×${alloc.bin.binWidthCm}×${alloc.bin.binHeightCm}cm)`
                    : `Resize Shelf (${alloc.bin.binLengthCm}×${alloc.bin.binWidthCm}×${alloc.bin.binHeightCm}cm)`}
                </span>
                <div className="flex gap-1 text-[9px]">
                  <button
                    type="button"
                    onClick={() =>
                      onResizeSingleBin(
                        alloc.bin.id,
                        {
                          binLengthCm: Math.round(alloc.bin.binLengthCm * 0.9),
                          binWidthCm: Math.round(alloc.bin.binWidthCm * 0.9),
                          binHeightCm: Math.round(alloc.bin.binHeightCm * 0.9),
                        },
                        'single'
                      )
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-slate-300 hover:border-cyan-400"
                  >
                    -10%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onResizeSingleBin(
                        alloc.bin.id,
                        {
                          binLengthCm: Math.round(alloc.bin.binLengthCm * 1.1),
                          binWidthCm: Math.round(alloc.bin.binWidthCm * 1.1),
                          binHeightCm: Math.round(alloc.bin.binHeightCm * 1.1),
                        },
                        'single'
                      )
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-slate-300 hover:border-cyan-400"
                  >
                    +10%
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div>
                  <span className="text-[9px] text-slate-400">
                    {isKo ? 'Shelf L(cm)' : 'Shelf L(cm)'}
                  </span>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={alloc.bin.binLengthCm}
                    onChange={(e) =>
                      onResizeSingleBin(
                        alloc.bin.id,
                        {
                          binLengthCm: Math.max(
                            20,
                            Math.min(300, Number(e.target.value) || 60)
                          ),
                        },
                        'single'
                      )
                    }
                    className="w-full rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center font-mono text-white"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400">
                    {isKo ? 'Shelf W(cm)' : 'Shelf W(cm)'}
                  </span>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={alloc.bin.binWidthCm}
                    onChange={(e) =>
                      onResizeSingleBin(
                        alloc.bin.id,
                        {
                          binWidthCm: Math.max(
                            20,
                            Math.min(300, Number(e.target.value) || 50)
                          ),
                        },
                        'single'
                      )
                    }
                    className="w-full rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center font-mono text-white"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400">
                    {isKo ? 'Shelf H(cm)' : 'Shelf H(cm)'}
                  </span>
                  <input
                    type="number"
                    min={15}
                    max={250}
                    value={alloc.bin.binHeightCm}
                    onChange={(e) =>
                      onResizeSingleBin(
                        alloc.bin.id,
                        {
                          binHeightCm: Math.max(
                            15,
                            Math.min(250, Number(e.target.value) || 40)
                          ),
                        },
                        'single'
                      )
                    }
                    className="w-full rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center font-mono text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {onPlaceCustomBoxInBin && (
            <div className="space-y-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300">
                <span className="inline-flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  {isKo
                    ? `Set Box Size & Place in [${alloc.bin.id}]`
                    : `Set Box Size & Place in [${alloc.bin.id}]`}
                </span>
                <span className="font-mono text-[9px] text-slate-400">
                  {isKo ? 'Shelf' : 'Shelf'} {alloc.bin.binLengthCm}×
                  {alloc.bin.binWidthCm}×{alloc.bin.binHeightCm}cm
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[9px]">
                {[
                  { label: isKo ? 'S 25×20×15' : 'S 25×20×15', l: 25, w: 20, h: 15, kg: 2 },
                  { label: isKo ? 'M 40×30×24' : 'M 40×30×24', l: 40, w: 30, h: 24, kg: 5 },
                  { label: isKo ? 'L 60×40×35' : 'L 60×40×35', l: 60, w: 40, h: 35, kg: 10 },
                  {
                    label: isKo ? 'Half Shelf' : 'Half Shelf',
                    l: Math.max(12, Math.floor((alloc.bin.binLengthCm - 4) / 2)),
                    w: Math.max(12, alloc.bin.binWidthCm - 6),
                    h: Math.max(12, Math.floor(alloc.bin.binHeightCm * 0.75)),
                    kg: 7,
                  },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setCustomBoxL(p.l);
                      setCustomBoxW(p.w);
                      setCustomBoxH(p.h);
                      setCustomBoxKg(p.kg);
                    }}
                    className="truncate rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-1 py-0.5 font-medium hover:border-emerald-400"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1 text-[10px]">
                <div>
                  <span className="text-[9px] text-slate-400">
                    {isKo ? 'L(cm)' : 'L(cm)'}
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={280}
                    value={customBoxL}
                    onChange={(e) =>
                      setCustomBoxL(Math.max(5, Math.min(280, Number(e.target.value) || 10)))
                    }
                    className="w-full rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono text-white"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400">
                    {isKo ? 'W(cm)' : 'W(cm)'}
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={280}
                    value={customBoxW}
                    onChange={(e) =>
                      setCustomBoxW(Math.max(5, Math.min(280, Number(e.target.value) || 10)))
                    }
                    className="w-full rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono text-white"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400">
                    {isKo ? 'H(cm)' : 'H(cm)'}
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={customBoxH}
                    onChange={(e) =>
                      setCustomBoxH(Math.max(5, Math.min(240, Number(e.target.value) || 10)))
                    }
                    className="w-full rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono text-white"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400">
                    {isKo ? 'kg' : 'kg'}
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min={0.1}
                    max={500}
                    value={customBoxKg}
                    onChange={(e) =>
                      setCustomBoxKg(Math.max(0.1, Math.min(500, Number(e.target.value) || 1)))
                    }
                    className="w-full rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono text-white"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400">
                    {isKo ? 'Qty' : 'Qty'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={customBoxQty}
                    onChange={(e) =>
                      setCustomBoxQty(Math.max(1, Math.min(30, Number(e.target.value) || 1)))
                    }
                    className="w-full rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono font-bold text-emerald-300"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onPlaceCustomBoxInBin({
                    binId: alloc.bin.id,
                    lengthCm: customBoxL,
                    widthCm: customBoxW,
                    heightCm: customBoxH,
                    weightKg: customBoxKg,
                    quantity: customBoxQty,
                    autoExpandBin: true,
                  });
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-500 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-emerald-400"
              >
                <PackagePlus className="h-3.5 w-3.5" />
                {isKo
                  ? `Place ${customBoxQty}× (${customBoxL}×${customBoxW}×${customBoxH}cm) Box Here`
                  : `Place ${customBoxQty}× (${customBoxL}×${customBoxW}×${customBoxH}cm) Box Here`}
              </button>
            </div>
          )}

          <div className="space-y-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
            {onSetBinTotalBoxQuota && (
              <div className="flex items-center justify-between gap-1 rounded border border-cyan-500/35 bg-slate-950/90 px-2 py-1 text-[10px]">
                <span className="font-bold text-cyan-300">
                  {isKo ? 'Shelf Total Boxes:' : 'Shelf Total Boxes:'}
                </span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 4, 6, 8].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() =>
                        onSetBinTotalBoxQuota(alloc.bin.id, q, skus[0]?.id)
                      }
                      className={`rounded border px-1 py-0.5 font-mono font-bold ${
                        alloc.boxes.length === q
                          ? 'border-cyan-400 bg-cyan-500 text-slate-950'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-400'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={alloc.boxes.length}
                    onChange={(e) =>
                      onSetBinTotalBoxQuota(
                        alloc.bin.id,
                        Math.max(
                          0,
                          Math.min(100, Math.round(Number(e.target.value) || 0))
                        ),
                        skus[0]?.id
                      )
                    }
                    className="w-11 rounded border border-cyan-500/50 bg-slate-900 px-1 py-0.5 text-center font-mono font-bold text-amber-300"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--t-muted)]">
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <PackagePlus className="h-3 w-3" />
                {isKo
                  ? `Exact SKU Quantity in Bin · ${skus.length} SKUs`
                  : `Exact SKU Quantity in Bin · ${skus.length} SKUs`}
              </span>
              {skus.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllSkus((v) => !v)}
                  className="text-[10px] text-cyan-300 hover:underline"
                >
                  {showAllSkus
                    ? isKo
                      ? 'Less'
                      : 'Less'
                    : isKo
                      ? `All (${skus.length})`
                      : `All (${skus.length})`}
                </button>
              )}
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto pr-0.5">
              {visibleSkus.map((sku) => {
                const cntInBin = alloc.boxes.filter(
                  (b) => b.skuId === sku.id
                ).length;
                return (
                  <div
                    key={sku.id}
                    className={`flex items-center justify-between gap-1 rounded border px-1.5 py-1 text-[10px] ${
                      cntInBin > 0
                        ? 'border-emerald-500/50 bg-emerald-950/25'
                        : 'border-[var(--t-border)] bg-[var(--t-surface)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (onSetCargoCountInBin) {
                          onSetCargoCountInBin(
                            alloc.bin.id,
                            sku.id,
                            cntInBin + 1,
                            true
                          );
                        } else {
                          onPinSkuToBin(alloc.bin.id, sku.id, 1);
                        }
                      }}
                      className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left"
                      title={`${sku.name} (${sku.lengthCm}×${sku.widthCm}×${sku.heightCm}cm, ${sku.weightKg}kg)`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: sku.color }}
                      />
                      <span className="truncate font-medium">
                        {isKo ? sku.name.split(' (')[0] : sku.skuCode}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={cntInBin <= 0}
                        onClick={() =>
                          onSetCargoCountInBin
                            ? onSetCargoCountInBin(
                                alloc.bin.id,
                                sku.id,
                                Math.max(0, cntInBin - 1),
                                true
                              )
                            : onPinSkuToBin(alloc.bin.id, sku.id, -1)
                        }
                        className="rounded border border-slate-700 bg-slate-900 px-1 py-0.2 font-bold text-rose-300 hover:border-rose-400 disabled:opacity-35"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={cntInBin}
                        onChange={(e) => {
                          const nextVal = Math.max(
                            0,
                            Math.min(
                              100,
                              Math.round(Number(e.target.value) || 0)
                            )
                          );
                          if (onSetCargoCountInBin) {
                            onSetCargoCountInBin(
                              alloc.bin.id,
                              sku.id,
                              nextVal,
                              true
                            );
                          } else {
                            onPinSkuToBin(
                              alloc.bin.id,
                              sku.id,
                              nextVal - cntInBin
                            );
                          }
                        }}
                        className="w-10 rounded border border-slate-700 bg-slate-950 px-1 py-0.2 text-center font-mono font-bold text-amber-300"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onSetCargoCountInBin
                            ? onSetCargoCountInBin(
                                alloc.bin.id,
                                sku.id,
                                cntInBin + 1,
                                true
                              )
                            : onPinSkuToBin(alloc.bin.id, sku.id, 1)
                        }
                        className="rounded border border-slate-700 bg-slate-900 px-1 py-0.2 font-bold text-emerald-300 hover:border-emerald-400"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {alloc.boxes.length > 0 && onMoveSkuToLevel && (
            <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
              <div className="mb-1 text-[10px] font-semibold text-amber-300">
                {isKo
                  ? 'Move / Remove Packed Items in Bin'
                  : 'Move / Remove Packed Items in Bin'}
              </div>
              <div className="max-h-28 space-y-1 overflow-y-auto pr-0.5">
                {Array.from(
                  new Map(alloc.boxes.map((b) => [b.skuId, b])).values()
                ).map((box) => (
                  <div
                    key={box.skuId}
                    className="flex items-center justify-between gap-1 rounded bg-[var(--t-surface)] px-1.5 py-1 text-[10px]"
                  >
                    <span className="truncate font-medium">
                      {box.name.split(' (')[0]}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      {alloc.bin.level !== 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            onMoveSkuToLevel(alloc.bin.id, box.skuId, 1);
                            onClose();
                          }}
                          className="rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] text-emerald-300 hover:bg-emerald-500/25"
                          title={isKo ? 'Move to Z1' : 'Move to Z1'}
                        >
                          {isKo ? '→Z1' : '→Z1'}
                        </button>
                      )}
                      {alloc.bin.level !== 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            onMoveSkuToLevel(alloc.bin.id, box.skuId, 2);
                            onClose();
                          }}
                          className="rounded border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 text-[9px] text-cyan-300 hover:bg-cyan-500/25"
                          title={
                            isKo ? 'Move to Z2' : 'Move to Z2'
                          }
                        >
                          {isKo ? '→Z2' : '→Z2'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                onAddBinAbove(alloc);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-left text-[11px] text-emerald-300 hover:bg-emerald-500/20"
            >
              <PlusSquare className="h-3.5 w-3.5" />
              {isKo
                ? `Add +Z${alloc.bin.level + 1}`
                : `Add +Z${alloc.bin.level + 1}`}
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleLevelSlice(
                  levelFilter === alloc.bin.level ? 'all' : alloc.bin.level
                );
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2 py-1.5 text-left text-[11px] hover:border-[var(--t-accent)]"
            >
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              {levelFilter === alloc.bin.level
                ? isKo
                  ? 'Show All Z'
                  : 'Show All Z'
                : isKo
                  ? `Slice Z${alloc.bin.level}`
                  : `Slice Z${alloc.bin.level}`}
            </button>
            <button
              type="button"
              onClick={() => {
                onClearBinPins(alloc.bin.id);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2 py-1.5 text-left text-[11px] hover:border-amber-400"
            >
              <Eraser className="h-3.5 w-3.5 text-amber-400" />
              {isKo ? 'Unpin Bin' : 'Unpin Bin'}
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteBin(alloc.bin.id);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-left text-[11px] text-rose-300 hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isKo ? 'Delete Bin' : 'Delete Bin'}
            </button>
          </div>
        </>
      ) : null}

      {prop && onUpdateInteriorProp && (
        <div className="space-y-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
            <span>
              {isKo ? `3D Furniture: ${prop.label}` : `3D Furniture: ${prop.label}`}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              ({prop.xMeters}m, {prop.yMeters}m)
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <button
              type="button"
              onClick={() =>
                onUpdateInteriorProp(prop.id, {
                  xMeters: Number((prop.xMeters - 0.5).toFixed(2)),
                })
              }
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-cyan-400"
            >
              ← Left
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateInteriorProp(prop.id, {
                  xMeters: Number((prop.xMeters + 0.5).toFixed(2)),
                })
              }
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-cyan-400"
            >
              → Right
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateInteriorProp(prop.id, {
                  yMeters: Number((prop.yMeters - 0.5).toFixed(2)),
                })
              }
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-cyan-400"
            >
              ↑ Fwd
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateInteriorProp(prop.id, {
                  yMeters: Number((prop.yMeters + 0.5).toFixed(2)),
                })
              }
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-cyan-400"
            >
              ↓ Back
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <button
              type="button"
              onClick={() =>
                onUpdateInteriorProp(prop.id, {
                  rotationDeg: (prop.rotationDeg + 45) % 360,
                })
              }
              className="inline-flex items-center justify-center gap-0.5 rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 text-cyan-300 hover:border-cyan-400"
            >
              <RotateCw className="h-3 w-3" />
              45°
            </button>
            <button
              type="button"
              onClick={() => {
                const nextScale =
                  prop.scale >= 1.6
                    ? 0.8
                    : Number((prop.scale + 0.2).toFixed(1));
                onUpdateInteriorProp(prop.id, { scale: nextScale });
              }}
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-cyan-400"
            >
              {prop.scale.toFixed(1)}x
            </button>
            {onDuplicateInteriorProp && (
              <button
                type="button"
                onClick={() => {
                  onDuplicateInteriorProp(prop.id);
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-0.5 rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-emerald-400"
              >
                <Copy className="h-3 w-3" />
                {isKo ? 'Copy' : 'Copy'}
              </button>
            )}
            {onDeleteInteriorProp && (
              <button
                type="button"
                onClick={() => {
                  onDeleteInteriorProp(prop.id);
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-0.5 rounded border border-rose-500/40 bg-rose-500/15 py-1 text-rose-300 hover:bg-rose-500/25"
              >
                <Trash2 className="h-3 w-3" />
                {isKo ? 'Del' : 'Del'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
        <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--t-muted)]">
          <span>
            {menu.floorPoint
              ? `${isKo ? 'Cursor Floor' : 'Cursor Floor'} @ (${menu.floorPoint.x}m, ${menu.floorPoint.z}m)`
              : isKo
                ? 'Quick Add to 3D Space'
                : 'Quick Add to 3D Space'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            const pt = menu.floorPoint ?? { x: 0, z: 1.8 };
            onAddBinAtFloor(pt.x, pt.z);
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-left text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
        >
          <PlusSquare className="h-3.5 w-3.5" />
          {isKo
            ? 'Add Storage Rack Bin at Cursor'
            : 'Add Storage Rack Bin at Cursor'}
        </button>

        {(onAddObstacleAtFloor || onMoveDepotToFloor) && (
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {onAddObstacleAtFloor && (
              <button
                type="button"
                onClick={() => {
                  const pt = menu.floorPoint ?? { x: 1.5, z: 1.8 };
                  onAddObstacleAtFloor(pt.x, pt.z);
                  onClose();
                }}
                className="flex items-center justify-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-1.5 font-semibold text-amber-300 hover:bg-amber-500/25"
              >
                + {isKo ? 'Add Pillar Here' : 'Add Pillar Here'}
              </button>
            )}
            {onMoveDepotToFloor && (
              <button
                type="button"
                onClick={() => {
                  const pt = menu.floorPoint ?? { x: 0, z: 0 };
                  onMoveDepotToFloor(pt.x, pt.z);
                  onClose();
                }}
                className="flex items-center justify-center gap-1 rounded-lg border border-sky-500/40 bg-sky-500/15 px-2 py-1.5 font-semibold text-sky-300 hover:bg-sky-500/25"
              >
                ★ {isKo ? 'Move Depot Here' : 'Move Depot Here'}
              </button>
            )}
          </div>
        )}

        {onChangeFloorColor && (
          <div className="flex items-center justify-between rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1.5 text-[10px]">
            <span className="font-semibold text-cyan-300">
              {isKo ? 'Map Floor Color:' : 'Map Floor Color:'}
            </span>
            <div className="flex items-center gap-1">
              {[
                ['#e2e8f0', isKo ? 'Light Tile' : 'Light Tile'],
                ['#e7d5b8', isKo ? 'Warm Wood' : 'Warm Wood'],
                ['#cbd5e1', isKo ? 'Concrete' : 'Concrete'],
                ['#bbf7d0', isKo ? 'Epoxy Green' : 'Epoxy Green'],
                ['#172554', isKo ? 'Blueprint' : 'Blueprint'],
                ['#1e293b', isKo ? 'Dark Slate' : 'Dark Slate'],
              ].map(([col, title]) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => onChangeFloorColor(col)}
                  title={title}
                  className={`h-4 w-4 rounded-full border ${
                    floorColor.toLowerCase() === col
                      ? 'scale-110 border-white ring-1 ring-cyan-400'
                      : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
              <input
                type="color"
                value={floorColor}
                onChange={(e) => onChangeFloorColor(e.target.value)}
                className="h-5 w-6 cursor-pointer border-0 bg-transparent"
                title={isKo ? 'Custom Floor Color' : 'Custom Floor Color'}
              />
            </div>
          </div>
        )}

        {onAddInteriorPropAt && (
          <div>
            <div className="mb-1 text-[10px] text-[var(--t-muted)]">
              {isKo
                ? 'Place 3D Furniture / Appliance Here:'
                : 'Place 3D Furniture / Appliance Here:'}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {INTERIOR_PROP_CATALOG.slice(0, 9).map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    onAddInteriorPropAt(
                      item.type,
                      menu.floorPoint?.x,
                      menu.floorPoint?.z
                    );
                    onClose();
                  }}
                  className="flex items-center gap-1 truncate rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-1.5 py-1 text-left text-[10px] hover:border-emerald-400"
                >
                  <span>{item.icon}</span>
                  <span className="truncate">
                    {isKo ? item.nameKo.split(' ')[0] : item.nameEn.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderOptimizeSection = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1">
        <button
          type="button"
          disabled={!canUndo}
          onClick={() => {
            onUndo?.();
            onClose();
          }}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 text-[11px] font-medium hover:border-[var(--t-accent)] disabled:opacity-35"
        >
          <Undo2 className="h-3.5 w-3.5 text-cyan-400" />
          {isKo ? 'Undo' : 'Undo'}
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => {
            onRedo?.();
            onClose();
          }}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 text-[11px] font-medium hover:border-[var(--t-accent)] disabled:opacity-35"
        >
          <Redo2 className="h-3.5 w-3.5 text-cyan-400" />
          {isKo ? 'Redo' : 'Redo'}
        </button>
        <button
          type="button"
          onClick={() => {
            onToggleLayout();
            onClose();
          }}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {activeLayout === 'optimized_3d'
            ? isKo
              ? '2D Before'
              : '2D Before'
            : isKo
              ? '3D After'
              : '3D After'}
        </button>
      </div>

      {onChangeOptimizationPreset && (
        <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
          <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
            {isKo ? '3D Optimization Goal' : '3D Optimization Goal'}
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {(
              [
                ['balanced', isKo ? 'Balanced' : 'Balanced'],
                ['speed', isKo ? 'Fast Pick' : 'Fast Pick'],
                ['density', isKo ? 'Max Density' : 'Max Density'],
                ['safety', isKo ? 'Max Safety' : 'Max Safety'],
              ] as const
            ).map(([preset, label]) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onChangeOptimizationPreset(preset);
                  onClose();
                }}
                className={`rounded border px-2 py-1 font-medium ${
                  optimizationPreset === preset
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'border-[var(--t-border)] bg-[var(--t-surface)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1 text-[10px]">
        {onToggleRotationAndCoPack && (
          <button
            type="button"
            onClick={() => {
              onToggleRotationAndCoPack();
              onClose();
            }}
            className={`rounded-lg border px-2 py-1.5 font-medium ${
              allowRotationAndCoPack
                ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
                : 'border-[var(--t-border)] bg-[var(--t-surface-alt)]'
            }`}
          >
            {isKo
              ? `6-Axis Co-Pack: ${allowRotationAndCoPack ? 'ON' : 'OFF'}`
              : `6-Axis Co-Pack: ${allowRotationAndCoPack ? 'ON' : 'OFF'}`}
          </button>
        )}
        {onChangeEquipmentMode && (
          <button
            type="button"
            onClick={() => {
              onChangeEquipmentMode(
                equipmentMode === 'reach_truck' ? 'asrs_crane' : 'reach_truck'
              );
              onClose();
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2 py-1.5 font-medium hover:border-[var(--t-accent)]"
          >
            {equipmentMode === 'reach_truck' ? (
              <Truck className="h-3 w-3 text-cyan-400" />
            ) : (
              <Cpu className="h-3 w-3 text-emerald-400" />
            )}
            {equipmentMode === 'reach_truck'
              ? isKo
                ? 'Reach Truck'
                : 'Reach Truck'
              : isKo
                ? 'AS/RS Crane'
                : 'AS/RS Crane'}
          </button>
        )}
      </div>

      {onToggleDragMove && (
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => {
              onToggleDragMove('single_cargo');
              onClose();
            }}
            className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 font-semibold ${
              dragMoveMode && dragScope === 'single_cargo'
                ? 'border-amber-400 bg-amber-500 text-slate-950'
                : 'border-[var(--t-border)] bg-[var(--t-surface-alt)] text-amber-300'
            }`}
          >
            <Move className="h-3 w-3" />
            {isKo ? 'Drag Single Item' : 'Drag Single Item'}
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleDragMove('single_bin');
              onClose();
            }}
            className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 font-semibold ${
              dragMoveMode && dragScope === 'single_bin'
                ? 'border-sky-400 bg-sky-500 text-slate-950'
                : 'border-[var(--t-border)] bg-[var(--t-surface-alt)] text-sky-300'
            }`}
          >
            <Move className="h-3 w-3" />
            {isKo ? 'Drag Single Bin' : 'Drag Single Bin'}
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleDragMove('column');
              onClose();
            }}
            className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 font-semibold ${
              dragMoveMode && dragScope === 'column'
                ? 'border-cyan-400 bg-cyan-500 text-slate-950'
                : 'border-[var(--t-border)] bg-[var(--t-surface-alt)] text-cyan-300'
            }`}
          >
            <Move className="h-3 w-3" />
            {isKo ? 'Drag Rack Column' : 'Drag Rack Column'}
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleDragMove('whole_template');
              onClose();
            }}
            className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 font-semibold ${
              dragMoveMode && dragScope === 'whole_template'
                ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                : 'border-[var(--t-border)] bg-[var(--t-surface-alt)] text-emerald-300'
            }`}
          >
            <Move className="h-3 w-3" />
            {isKo ? 'Drag Whole Template' : 'Drag Whole Template'}
          </button>
        </div>
      )}

      {onTranslateWholeTemplate && (
        <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
          <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
            {isKo
              ? 'Whole-Template 1-Click Transform'
              : 'Whole-Template 1-Click Transform'}
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => onTranslateWholeTemplate(-0.5, 0)}
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-emerald-400"
            >
              ← 0.5m
            </button>
            <button
              type="button"
              onClick={() => onTranslateWholeTemplate(0.5, 0)}
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-emerald-400"
            >
              → 0.5m
            </button>
            <button
              type="button"
              onClick={() => onTranslateWholeTemplate(0, -0.5)}
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-emerald-400"
            >
              ↑ 0.5m
            </button>
            <button
              type="button"
              onClick={() => onTranslateWholeTemplate(0, 0.5)}
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-emerald-400"
            >
              ↓ 0.5m
            </button>
            {onRotateWholeTemplate90 && (
              <button
                type="button"
                onClick={() => {
                  onRotateWholeTemplate90();
                  onClose();
                }}
                className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 font-semibold text-emerald-300 hover:border-emerald-400"
              >
                90° {isKo ? 'Rot' : 'Rot'}
              </button>
            )}
            {onScaleWholeTemplateSpacing && (
              <>
                <button
                  type="button"
                  onClick={() => onScaleWholeTemplateSpacing(1.12)}
                  className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-emerald-400"
                >
                  {isKo ? 'Span+' : 'Span+'}
                </button>
                <button
                  type="button"
                  onClick={() => onScaleWholeTemplateSpacing(0.88)}
                  className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-emerald-400"
                >
                  {isKo ? 'Span-' : 'Span-'}
                </button>
              </>
            )}
            {onCenterWholeTemplate && (
              <button
                type="button"
                onClick={() => {
                  onCenterWholeTemplate();
                  onClose();
                }}
                className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 font-semibold text-cyan-300 hover:border-cyan-400"
              >
                {isKo ? 'Center' : 'Center'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1 text-[10px]">
        {onClearAllPins && (
          <button
            type="button"
            onClick={() => {
              onClearAllPins();
              onClose();
            }}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 py-1.5 font-medium text-amber-300 hover:bg-amber-500/20"
          >
            {isKo ? 'Clear All Pinned SKUs' : 'Clear All Pinned SKUs'}
          </button>
        )}
        {onResetSpaceEdits && (
          <button
            type="button"
            onClick={() => {
              onResetSpaceEdits();
              onClose();
            }}
            className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 font-medium hover:border-rose-400"
          >
            {isKo ? 'Reset Space Edits' : 'Reset Space Edits'}
          </button>
        )}
      </div>
    </div>
  );

  const renderView3DSection = () => (
    <div className="space-y-2">
      <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
        <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
          {isKo ? '3D Camera & Pick Route' : '3D Camera & Pick Route'}
        </div>
        <div className="grid grid-cols-4 gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => {
              onChangeCameraPreset?.('iso');
              onClose();
            }}
            className={`inline-flex flex-col items-center gap-0.5 rounded border py-1 ${
              cameraPreset === 'iso'
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold'
                : 'border-[var(--t-border)] bg-[var(--t-surface)]'
            }`}
          >
            <Compass className="h-3 w-3" />
            {isKo ? '3D Iso' : '3D Iso'}
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeCameraPreset?.('top');
              onClose();
            }}
            className={`inline-flex flex-col items-center gap-0.5 rounded border py-1 ${
              cameraPreset === 'top'
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold'
                : 'border-[var(--t-border)] bg-[var(--t-surface)]'
            }`}
          >
            <Camera className="h-3 w-3" />
            {isKo ? '2D Top' : '2D Top'}
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeCameraPreset?.('elevation');
              onClose();
            }}
            className={`inline-flex flex-col items-center gap-0.5 rounded border py-1 ${
              cameraPreset === 'elevation'
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold'
                : 'border-[var(--t-border)] bg-[var(--t-surface)]'
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            {isKo ? 'Z-Elev' : 'Z-Elev'}
          </button>
          <button
            type="button"
            onClick={() => {
              onResetCamera();
              onClose();
            }}
            className="inline-flex flex-col items-center gap-0.5 rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 text-emerald-300 hover:border-emerald-400"
          >
            <Compass className="h-3 w-3" />
            {isKo ? 'Reset' : 'Reset'}
          </button>
        </div>

        {onToggleAnimateRoute && (
          <button
            type="button"
            onClick={() => {
              onToggleAnimateRoute();
              onClose();
            }}
            className={`mt-1.5 flex w-full items-center justify-center gap-1.5 rounded border py-1 text-[10px] font-semibold ${
              animateRoute
                ? 'border-amber-400/50 bg-amber-500/20 text-amber-300'
                : 'border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-muted)]'
            }`}
          >
            <Play className="h-3 w-3" />
            {isKo
              ? `Pick Route Animation: ${animateRoute ? 'ON' : 'OFF'}`
              : `Pick Route Animation: ${animateRoute ? 'ON' : 'OFF'}`}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
        <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
          {isKo ? '3D Visualization Layer' : '3D Visualization Layer'}
        </div>
        <div className="grid grid-cols-3 gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => {
              onChangeViewLayer('slotting');
              onClose();
            }}
            className={`flex items-center justify-center gap-1 rounded border py-1.5 font-medium ${
              viewLayer === 'slotting'
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold'
                : 'border-[var(--t-border)] bg-[var(--t-surface)]'
            }`}
          >
            <Layers className="h-3 w-3" />
            {isKo ? '3D Pack' : '3D Pack'}
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeViewLayer('heatmap');
              onClose();
            }}
            className={`flex items-center justify-center gap-1 rounded border py-1.5 font-medium ${
              viewLayer === 'heatmap'
                ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                : 'border-[var(--t-border)] bg-[var(--t-surface)]'
            }`}
          >
            <Flame className="h-3 w-3" />
            {isKo ? 'Heatmap' : 'Heatmap'}
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeViewLayer('golden_zone');
              onClose();
            }}
            className={`flex items-center justify-center gap-1 rounded border py-1.5 font-medium ${
              viewLayer === 'golden_zone'
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold'
                : 'border-[var(--t-border)] bg-[var(--t-surface)]'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            {isKo ? 'Golden' : 'Golden'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
        <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
          {isKo ? 'Z-Level Cross-Section Slice' : 'Z-Level Cross-Section Slice'}
        </div>
        <div className="flex flex-wrap gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => {
              onToggleLevelSlice('all');
              onClose();
            }}
            className={`rounded border px-2 py-1 font-semibold ${
              levelFilter === 'all'
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                : 'border-[var(--t-border)] bg-[var(--t-surface)]'
            }`}
          >
            {isKo ? 'All' : 'All'}
          </button>
          {Array.from({ length: maxLevels }, (_, i) => i + 1).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                onToggleLevelSlice(levelFilter === lvl ? 'all' : lvl);
                onClose();
              }}
              className={`rounded border px-2 py-1 font-semibold ${
                levelFilter === lvl
                  ? 'border-cyan-400 bg-cyan-500 text-slate-950'
                  : 'border-[var(--t-border)] bg-[var(--t-surface)]'
              }`}
            >
              Z{lvl}
            </button>
          ))}
        </div>
      </div>

      {onApplyScenePreset && (
        <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
          <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[var(--t-muted)]">
            <span>{isKo ? '3D Lighting Preset' : '3D Lighting Preset'}</span>
            {onToggleXrayBins && (
              <button
                type="button"
                onClick={() => {
                  onToggleXrayBins();
                  onClose();
                }}
                className="text-cyan-300 hover:underline"
              >
                {isKo
                  ? `X-Ray: ${xrayBins ? 'ON' : 'OFF'}`
                  : `X-Ray: ${xrayBins ? 'ON' : 'OFF'}`}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {[
              ['daylight-studio', isKo ? 'Daylight' : 'Daylight'],
              ['warm-home', isKo ? 'Warm Home' : 'Warm Home'],
              ['pure-white', isKo ? 'White Showroom' : 'White Showroom'],
              ['cyber-night', isKo ? 'Dark Twin' : 'Dark Twin'],
            ].map(([pid, label]) => (
              <button
                key={pid}
                type="button"
                onClick={() => {
                  onApplyScenePreset(pid);
                  onClose();
                }}
                className={`rounded border py-1 font-medium ${
                  scenePresetId === pid
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-bold'
                    : 'border-[var(--t-border)] bg-[var(--t-surface)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1 text-[10px]">
        {onOpenInteriorModal && (
          <button
            type="button"
            onClick={() => {
              onOpenInteriorModal('interior');
              onClose();
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 py-1.5 font-semibold text-emerald-300 hover:bg-emerald-500/25"
          >
            <Home className="h-3.5 w-3.5" />
            {isKo ? '3D Interior Studio' : '3D Interior Studio'}
          </button>
        )}
        {onOpenSceneBgModal && (
          <button
            type="button"
            onClick={() => {
              onOpenSceneBgModal();
              onClose();
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 py-1.5 font-semibold text-amber-300 hover:bg-amber-500/25"
          >
            <Sun className="h-3.5 w-3.5" />
            {isKo ? '3D Background' : '3D Background'}
          </button>
        )}
        {onAutoPopulateInterior && (
          <button
            type="button"
            onClick={() => {
              onAutoPopulateInterior();
              onClose();
            }}
            className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 font-medium hover:border-emerald-400"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            {isKo
              ? 'Auto-Populate Matching 3D Interior Props'
              : 'Auto-Populate Matching 3D Interior Props'}
          </button>
        )}
      </div>
    </div>
  );

  const renderSpaceDataSection = () => (
    <div className="space-y-2">
      <div className="space-y-1">
        {onOpenTemplateGallery && (
          <button
            type="button"
            onClick={() => {
              onOpenTemplateGallery();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2.5 py-1.5 text-left text-[11px] font-semibold hover:border-cyan-400"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
            {isKo
              ? '1. Open 24-Template Gallery'
              : '1. Open 24-Template Gallery'}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onOpenMapEditor();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2.5 py-1.5 text-left text-[11px] font-semibold hover:border-emerald-400"
        >
          <MapIcon className="h-3.5 w-3.5 text-emerald-400" />
          {isKo
            ? '2. Open 2D Free-Canvas Map Editor'
            : '2. Open 2D Free-Canvas Map Editor'}
        </button>
        <button
          type="button"
          onClick={() => {
            onOpenCadExport();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2.5 py-1.5 text-left text-[11px] font-semibold hover:border-cyan-400"
        >
          <Ruler className="h-3.5 w-3.5 text-cyan-400" />
          {isKo
            ? '3. Export 2D CAD Blueprint (.DXF / .SVG)'
            : '3. Export 2D CAD Blueprint (.DXF / .SVG)'}
        </button>
      </div>

      {onQuickSelectScenario && (
        <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
          <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
            {isKo ? 'Quick Space Switch' : 'Quick Space Switch'}
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {[
              ['everyday-home-pantry', isKo ? 'Home Pantry' : 'Home Pantry'],
              ['tpl-life-14-closet', isKo ? 'Walk-In Closet' : 'Walk-In Closet'],
              ['tpl-life-18-oneroom', isKo ? 'Studio Wall' : 'Studio Wall'],
              ['everyday-mini-shop', isKo ? 'Mini E-Shop' : 'Mini E-Shop'],
              ['omni-highbay', isKo ? 'Omni High-Bay' : 'Omni High-Bay'],
              ['asrs-cube-tall', isKo ? 'AS/RS Cube' : 'AS/RS Cube'],
            ].map(([scId, label]) => (
              <button
                key={scId}
                type="button"
                onClick={() => {
                  onQuickSelectScenario(scId);
                  onClose();
                }}
                className="truncate rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1 text-left hover:border-cyan-400"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {onOpenLeftTab && (
        <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
          <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
            {isKo ? 'Jump to Left Panel Tab' : 'Jump to Left Panel Tab'}
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => {
                onOpenLeftTab('optimizer');
                onClose();
              }}
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-cyan-400"
            >
              {isKo ? '1. Optimize' : '1. Optimize'}
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenLeftTab('editor');
                onClose();
              }}
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-cyan-400"
            >
              {isKo ? '2. Space/SKU' : '2. Space/SKU'}
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenLeftTab('inspector');
                onClose();
              }}
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-cyan-400"
            >
              {isKo ? '3. Inspect' : '3. Inspect'}
            </button>
          </div>
        </div>
      )}

      {(onExportSkusCsv || onExportSlottingCsv) && (
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          {onExportSkusCsv && (
            <button
              type="button"
              onClick={() => {
                onExportSkusCsv();
                onClose();
              }}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 font-medium hover:border-cyan-400"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
              {isKo ? 'Export SKUs CSV' : 'Export SKUs CSV'}
            </button>
          )}
          {onExportSlottingCsv && (
            <button
              type="button"
              onClick={() => {
                onExportSlottingCsv();
                onClose();
              }}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-1.5 font-semibold text-emerald-300 hover:bg-emerald-500/20"
            >
              <Download className="h-3.5 w-3.5" />
              {isKo ? 'Slotting CSV' : 'Slotting CSV'}
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderAiSystemSection = () => (
    <div className="space-y-2">
      {onRunQuickAiPrompt && (
        <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-cyan-300">
            <Bot className="h-3 w-3" />
            {isKo
              ? '1-Click Hybrid AI Co-Pilot'
              : '1-Click Hybrid AI Co-Pilot'}
          </div>
          <div className="space-y-1 text-[10px]">
            <button
              type="button"
              onClick={() => {
                onRunQuickAiPrompt('efficiency');
                onClose();
              }}
              className="flex w-full items-center justify-between rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1.5 text-left hover:border-cyan-400"
            >
              <span>
                {isKo
                  ? 'Space Efficiency & Golden Zone Audit'
                  : 'Space Efficiency & Golden Zone Audit'}
              </span>
              <Sparkles className="h-3 w-3 text-cyan-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                onRunQuickAiPrompt('safety');
                onClose();
              }}
              className="flex w-full items-center justify-between rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1.5 text-left hover:border-cyan-400"
            >
              <span>
                {isKo
                  ? 'Heavy Load Safety & Congestion Check'
                  : 'Heavy Load Safety & Congestion Check'}
              </span>
              <Sparkles className="h-3 w-3 text-amber-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                onRunQuickAiPrompt('offline');
                onClose();
              }}
              className="flex w-full items-center justify-between rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1.5 text-left hover:border-cyan-400"
            >
              <span>
                {isKo
                  ? 'Offline On-Device Bin Audit'
                  : 'Offline On-Device Bin Audit'}
              </span>
              <Cpu className="h-3 w-3 text-emerald-400" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1 text-[10px]">
        {onCycleTheme && (
          <>
            <button
              type="button"
              onClick={() => onCycleTheme(-1)}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 hover:border-cyan-400"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {isKo ? 'Prev Theme' : 'Prev Theme'}
            </button>
            <button
              type="button"
              onClick={() => onCycleTheme(1)}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 hover:border-cyan-400"
            >
              {isKo ? 'Next Theme' : 'Next Theme'}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {onOpenDesignMenu && (
          <button
            type="button"
            onClick={() => {
              onOpenDesignMenu();
              onClose();
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 py-1.5 font-semibold text-cyan-300 hover:bg-cyan-500/25"
          >
            <Palette className="h-3.5 w-3.5" />
            {isKo ? '24 Themes' : '24 Themes'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1 text-[10px]">
        {onToggleAppView && (
          <button
            type="button"
            onClick={() => {
              onToggleAppView();
              onClose();
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 font-medium hover:border-emerald-400"
          >
            {appView === 'home' ? (
              <Boxes className="h-3.5 w-3.5 text-cyan-400" />
            ) : (
              <Home className="h-3.5 w-3.5 text-emerald-400" />
            )}
            {appView === 'home'
              ? isKo
                ? 'Go to 3D Studio'
                : 'Go to 3D Studio'
              : isKo
                ? 'Go to Home View'
                : 'Go to Home View'}
          </button>
        )}
        {onToggleSimpleMode && (
          <button
            type="button"
            onClick={() => {
              onToggleSimpleMode();
              onClose();
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 font-medium hover:border-cyan-400"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            {simpleMode
              ? isKo
                ? 'Switch to Pro Terms'
                : 'Switch to Pro Terms'
              : isKo
                ? 'Switch to Easy Mode'
                : 'Switch to Easy Mode'}
          </button>
        )}
        {onToggleLanguage && (
          <button
            type="button"
            onClick={() => {
              onToggleLanguage();
              onClose();
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 font-medium text-amber-300 hover:border-amber-400"
          >
            <Languages className="h-3.5 w-3.5" />
            English (EN)
          </button>
        )}
        {onOpenInteriorModal && (
          <button
            type="button"
            onClick={() => {
              onOpenInteriorModal('shortcuts');
              onClose();
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 font-medium hover:border-cyan-400"
          >
            <Keyboard className="h-3.5 w-3.5 text-cyan-400" />
            {isKo ? 'Shortcuts Guide' : 'Shortcuts Guide'}
          </button>
        )}
        {onOpenFirebaseSetup && (
          <button
            type="button"
            onClick={() => {
              onOpenFirebaseSetup();
              onClose();
            }}
            className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 font-medium hover:border-cyan-400"
          >
            <Settings className="h-3.5 w-3.5 text-amber-400" />
            {isKo
              ? 'Firebase AI Logic & App Check Setup'
              : 'Firebase AI Logic & App Check Setup'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={menuRef}
      style={{ left: `${Math.max(8, left)}px`, top: `${Math.max(8, top)}px` }}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-50 flex max-h-[560px] w-[340px] flex-col overflow-hidden rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] text-xs text-[var(--t-text)] shadow-2xl backdrop-blur-md"
    >
      <div className="border-b border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2.5 pt-2 pb-1.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-cyan-300">
            {isKo
              ? 'Right-Click All-Features Command Center'
              : 'Right-Click All-Features Command Center'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-1.5 py-0.5 text-[10px] text-[var(--t-muted)] hover:text-white"
          >
            ESC ×
          </button>
        </div>

        <div className="grid grid-cols-6 gap-0.5 text-[10px]">
          {(
            [
              ['target', isKo ? 'Target' : 'Target'],
              ['optimize', isKo ? 'Optimize' : 'Optimize'],
              ['view3d', isKo ? '3D View' : '3D View'],
              ['space_data', isKo ? 'Space' : 'Space'],
              ['ai_system', isKo ? 'AI/Sys' : 'AI/Sys'],
              ['all', isKo ? 'All' : 'All'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md py-1 text-center font-semibold transition ${
                tab === id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-[var(--t-muted)] hover:bg-[var(--t-surface)] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5">
        {tab === 'target' && renderTargetSection()}
        {tab === 'optimize' && renderOptimizeSection()}
        {tab === 'view3d' && renderView3DSection()}
        {tab === 'space_data' && renderSpaceDataSection()}
        {tab === 'ai_system' && renderAiSystemSection()}
        {tab === 'all' && (
          <div className="space-y-3">
            {renderTargetSection()}
            <div className="border-t border-[var(--t-border)] pt-2">
              {renderOptimizeSection()}
            </div>
            <div className="border-t border-[var(--t-border)] pt-2">
              {renderView3DSection()}
            </div>
            <div className="border-t border-[var(--t-border)] pt-2">
              {renderSpaceDataSection()}
            </div>
            <div className="border-t border-[var(--t-border)] pt-2">
              {renderAiSystemSection()}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2.5 py-1.5 text-[10px] text-[var(--t-muted)]">
        <button
          type="button"
          onClick={() => {
            onOpenEditor();
            onClose();
          }}
          className="inline-flex items-center gap-1 font-medium text-cyan-300 hover:underline"
        >
          <ArrowDownToLine className="h-3 w-3" />
          {isKo ? 'Open Space & SKU Editor' : 'Open Space & SKU Editor'}
        </button>
        <span>
          {isKo ? 'Right-click anywhere' : 'Right-click anywhere'}
        </span>
      </div>
    </div>
  );
};
