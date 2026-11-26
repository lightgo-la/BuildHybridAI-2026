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
  lang = 'ko',
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
  const left = Math.min(menu.clientX, window.innerWidth - menuWidth - 12);
  const top = Math.min(menu.clientY, window.innerHeight - menuMaxHeight - 12);
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
                {isKo ? `선반 ${alloc.bin.id}` : `Bin ${alloc.bin.id}`}
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px]">
                Z{alloc.bin.level} ({alloc.bin.zMeters}m)
              </span>
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--t-muted)]">
              {alloc.cubicUtilizationPct.toFixed(1)}% {isKo ? '채움' : 'fill'} ·{' '}
              {alloc.currentWeightKg.toFixed(1)}/{alloc.bin.maxWeightKg}kg ·{' '}
              {alloc.boxes.length} {isKo ? '개 적재됨' : 'boxes'}
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
              {isKo ? '상세 보기 열기' : 'Inspect Details'}
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
              {isKo ? 'AI 정밀 진단' : 'AI Bin Audit'}
            </button>
          </div>

          {onResizeSingleBin && (
            <div className="space-y-1.5 rounded-lg border border-cyan-500/35 bg-slate-950/75 p-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-cyan-300">
                <span>
                  {isKo
                    ? `선반 사이즈 변경 (${alloc.bin.binLengthCm}×${alloc.bin.binWidthCm}×${alloc.bin.binHeightCm}cm)`
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
                    {isKo ? '선반 가로 L(cm)' : 'Shelf L(cm)'}
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
                    {isKo ? '선반 깊이 W(cm)' : 'Shelf W(cm)'}
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
                    {isKo ? '선반 높이 H(cm)' : 'Shelf H(cm)'}
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
                    ? `박스 사이즈 설정해서 이 선반(${alloc.bin.id})에 넣기`
                    : `Set Box Size & Place in [${alloc.bin.id}]`}
                </span>
                <span className="font-mono text-[9px] text-slate-400">
                  {isKo ? '선반' : 'Shelf'} {alloc.bin.binLengthCm}×
                  {alloc.bin.binWidthCm}×{alloc.bin.binHeightCm}cm
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[9px]">
                {[
                  { label: isKo ? '소형 25×20×15' : 'S 25×20×15', l: 25, w: 20, h: 15, kg: 2 },
                  { label: isKo ? '중형 40×30×24' : 'M 40×30×24', l: 40, w: 30, h: 24, kg: 5 },
                  { label: isKo ? '대형 60×40×35' : 'L 60×40×35', l: 60, w: 40, h: 35, kg: 10 },
                  {
                    label: isKo ? '선반 1/2칸' : 'Half Shelf',
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
                    {isKo ? '가로L(cm)' : 'L(cm)'}
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
                    {isKo ? '세로W(cm)' : 'W(cm)'}
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
                    {isKo ? '높이H(cm)' : 'H(cm)'}
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
                    {isKo ? '무게(kg)' : 'kg'}
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
                    {isKo ? '수량' : 'Qty'}
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
                  ? `이 선반에 ${customBoxL}×${customBoxW}×${customBoxH}cm 박스 ${customBoxQty}개 바로 넣기`
                  : `Place ${customBoxQty}× (${customBoxL}×${customBoxW}×${customBoxH}cm) Box Here`}
              </button>
            </div>
          )}

          <div className="space-y-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
            {onSetBinTotalBoxQuota && (
              <div className="flex items-center justify-between gap-1 rounded border border-cyan-500/35 bg-slate-950/90 px-2 py-1 text-[10px]">
                <span className="font-bold text-cyan-300">
                  {isKo ? '선반 총 박스 개수:' : 'Shelf Total Boxes:'}
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
                  ? `품목별 수량 직접 입력 · 전체 ${skus.length}종`
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
                      ? '간략히'
                      : 'Less'
                    : isKo
                      ? `전체 보기(${skus.length})`
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
                  ? '현재 들어있는 물건 다른 층으로 이동 / 빼기'
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
                          title={isKo ? '1단 바닥(Z1)으로 이동' : 'Move to Z1'}
                        >
                          {isKo ? '1단(Z1)' : '→Z1'}
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
                            isKo ? '허리높이 골든존(Z2)으로 이동' : 'Move to Z2'
                          }
                        >
                          {isKo ? '골든존(Z2)' : '→Z2'}
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
                ? `위에 1단 추가 (+Z${alloc.bin.level + 1})`
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
                  ? '전층 모두 보기'
                  : 'Show All Z'
                : isKo
                  ? `Z${alloc.bin.level}층만 단면 보기`
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
              {isKo ? '이 칸 고정 해제' : 'Unpin Bin'}
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
              {isKo ? '이 선반 칸 삭제' : 'Delete Bin'}
            </button>
          </div>
        </>
      ) : null}

      {prop && onUpdateInteriorProp && (
        <div className="space-y-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
            <span>
              {isKo ? `3D 가구: ${prop.label}` : `3D Furniture: ${prop.label}`}
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
              ← 좌
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
              → 우
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
              ↑ 전
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
              ↓ 후
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
                {isKo ? '복제' : 'Copy'}
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
                {isKo ? '삭제' : 'Del'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
        <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--t-muted)]">
          <span>
            {menu.floorPoint
              ? `${isKo ? '커서 바닥 위치' : 'Cursor Floor'} @ (${menu.floorPoint.x}m, ${menu.floorPoint.z}m)`
              : isKo
                ? '3D 공간 빠른 추가'
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
            ? '커서 위치에 새 선반 칸 추가 (+Bin)'
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
                + {isKo ? '기둥/장애물 추가' : 'Add Pillar Here'}
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
                ★ {isKo ? '출입구 이 위치로 이동' : 'Move Depot Here'}
              </button>
            )}
          </div>
        )}

        {onChangeFloorColor && (
          <div className="flex items-center justify-between rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1.5 text-[10px]">
            <span className="font-semibold text-cyan-300">
              {isKo ? '맵 바닥 색상 변경:' : 'Map Floor Color:'}
            </span>
            <div className="flex items-center gap-1">
              {[
                ['#e2e8f0', isKo ? '라이트타일' : 'Light Tile'],
                ['#e7d5b8', isKo ? '우드마루' : 'Warm Wood'],
                ['#cbd5e1', isKo ? '콘크리트' : 'Concrete'],
                ['#bbf7d0', isKo ? '에폭시그린' : 'Epoxy Green'],
                ['#172554', isKo ? '블루도면' : 'Blueprint'],
                ['#1e293b', isKo ? '다크슬레이트' : 'Dark Slate'],
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
                title={isKo ? '사용자 지정 바닥 색상' : 'Custom Floor Color'}
              />
            </div>
          </div>
        )}

        {onAddInteriorPropAt && (
          <div>
            <div className="mb-1 text-[10px] text-[var(--t-muted)]">
              {isKo
                ? '이 위치에 3D 가구·가전·문·창문 바로 배치:'
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
          {isKo ? '실행취소' : 'Undo'}
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
          {isKo ? '다시실행' : 'Redo'}
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
              ? '2D 정리전'
              : '2D Before'
            : isKo
              ? '3D 최적화'
              : '3D After'}
        </button>
      </div>

      {onChangeOptimizationPreset && (
        <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
          <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
            {isKo ? '3D 자동 정리 목표 선택' : '3D Optimization Goal'}
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {(
              [
                ['balanced', isKo ? '균형 맞춤 정리' : 'Balanced'],
                ['speed', isKo ? '빠른 동선 우선' : 'Fast Pick'],
                ['density', isKo ? '공간 최대한 채우기' : 'Max Density'],
                ['safety', isKo ? '무거운 짐 안전 우선' : 'Max Safety'],
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
              ? `6축 회전·합포장: ${allowRotationAndCoPack ? '켜짐' : '꺼짐'}`
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
                ? '일반/리치트럭 동선'
                : 'Reach Truck'
              : isKo
                ? 'AS/RS 크레인 동선'
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
            {isKo ? '낱개 물건 3D 이동' : 'Drag Single Item'}
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
            {isKo ? '낱개 선반 칸 이동' : 'Drag Single Bin'}
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
            {isKo ? '선반 기둥 이동' : 'Drag Rack Column'}
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
            {isKo ? '전체 템플릿 드래그' : 'Drag Whole Template'}
          </button>
        </div>
      )}

      {onTranslateWholeTemplate && (
        <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
          <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
            {isKo
              ? '전체 템플릿 위치·회전·간격 원클릭 변환'
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
                90° {isKo ? '회전' : 'Rot'}
              </button>
            )}
            {onScaleWholeTemplateSpacing && (
              <>
                <button
                  type="button"
                  onClick={() => onScaleWholeTemplateSpacing(1.12)}
                  className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-emerald-400"
                >
                  {isKo ? '간격+' : 'Span+'}
                </button>
                <button
                  type="button"
                  onClick={() => onScaleWholeTemplateSpacing(0.88)}
                  className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-emerald-400"
                >
                  {isKo ? '간격-' : 'Span-'}
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
                {isKo ? '중앙정렬' : 'Center'}
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
            {isKo ? '전체 고정 물품 해제' : 'Clear All Pinned SKUs'}
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
            {isKo ? '공간 편집 초기화' : 'Reset Space Edits'}
          </button>
        )}
      </div>
    </div>
  );

  const renderView3DSection = () => (
    <div className="space-y-2">
      <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
        <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
          {isKo ? '3D 카메라 시점 & 동선 표시' : '3D Camera & Pick Route'}
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
            {isKo ? '3D 입체' : '3D Iso'}
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
            {isKo ? '2D 평면' : '2D Top'}
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
            {isKo ? 'Z 정면' : 'Z-Elev'}
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
            {isKo ? '시점 리셋' : 'Reset'}
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
              ? `최적 이동 동선 애니메이션: ${animateRoute ? '켜짐' : '꺼짐'}`
              : `Pick Route Animation: ${animateRoute ? 'ON' : 'OFF'}`}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
        <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
          {isKo ? '3D 시각화 레이어' : '3D Visualization Layer'}
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
            {isKo ? '3D 적재물' : '3D Pack'}
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
            {isKo ? '빈도 히트맵' : 'Heatmap'}
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
            {isKo ? '골든존' : 'Golden'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
        <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
          {isKo ? '높이 층별(Z) 단면 보기' : 'Z-Level Cross-Section Slice'}
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
            {isKo ? '전층' : 'All'}
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
            <span>{isKo ? '3D 배경·조명 원클릭 전환' : '3D Lighting Preset'}</span>
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
                  ? `X-Ray 투시: ${xrayBins ? '켜짐' : '꺼짐'}`
                  : `X-Ray: ${xrayBins ? 'ON' : 'OFF'}`}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {[
              ['daylight-studio', isKo ? '밝은 스튜디오' : 'Daylight'],
              ['warm-home', isKo ? '따뜻한 홈·우드' : 'Warm Home'],
              ['pure-white', isKo ? '모던 화이트' : 'White Showroom'],
              ['cyber-night', isKo ? '다크 디지털트윈' : 'Dark Twin'],
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
            {isKo ? '3D 인테리어 편집' : '3D Interior Studio'}
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
            {isKo ? '3D 배경·조명 설정' : '3D Background'}
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
              ? '현재 공간 맞춤 3D 가구·소품 자동 배치'
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
              ? '1. 24종 공간 템플릿 갤러리 열기 (가정·매장·물류)'
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
            ? '2. 2D 자유 평면도 에디터 열기 (방 크기·선반 배치)'
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
            ? '3. 2D CAD 설계 도면 미리보기·다운로드 (.DXF/.SVG)'
            : '3. Export 2D CAD Blueprint (.DXF / .SVG)'}
        </button>
      </div>

      {onQuickSelectScenario && (
        <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-2">
          <div className="mb-1 text-[10px] font-semibold text-[var(--t-muted)]">
            {isKo ? '인기 공간 원클릭 바로 전환' : 'Quick Space Switch'}
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {[
              ['everyday-home-pantry', isKo ? '주방 팬트리·다용도실' : 'Home Pantry'],
              ['tpl-life-14-closet', isKo ? '드레스룸 & 옷장' : 'Walk-In Closet'],
              ['tpl-life-18-oneroom', isKo ? '원룸 벽면 수납장' : 'Studio Wall'],
              ['everyday-mini-shop', isKo ? '소형 쇼핑몰 포장실' : 'Mini E-Shop'],
              ['omni-highbay', isKo ? '통합 풀필먼트 센터' : 'Omni High-Bay'],
              ['asrs-cube-tall', isKo ? 'AS/RS 자동화 큐브' : 'AS/RS Cube'],
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
            {isKo ? '좌측 설계·분석 탭 바로가기' : 'Jump to Left Panel Tab'}
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
              {isKo ? '1. 3D 최적화' : '1. Optimize'}
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenLeftTab('editor');
                onClose();
              }}
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-cyan-400"
            >
              {isKo ? '2. 공간·물품' : '2. Space/SKU'}
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenLeftTab('inspector');
                onClose();
              }}
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-cyan-400"
            >
              {isKo ? '3. 상세 보기' : '3. Inspect'}
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
              {isKo ? '품목 목록 CSV 저장' : 'Export SKUs CSV'}
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
              {isKo ? '3D 적재결과 CSV' : 'Slotting CSV'}
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
              ? 'AI 공간 최적화 어시스턴트 원클릭 실행'
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
                  ? '골든존 적중률 & 공간 활용 개선안 3가지 추천'
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
                  ? '상층 중량물 안전 위험 & 통로 병목 진단'
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
                  ? '오프라인 온디바이스 AI 선반 정밀 분석'
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
              {isKo ? '이전 테마' : 'Prev Theme'}
            </button>
            <button
              type="button"
              onClick={() => onCycleTheme(1)}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] py-1.5 hover:border-cyan-400"
            >
              {isKo ? '다음 테마' : 'Next Theme'}
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
            {isKo ? '테마·크기' : '24 Themes'}
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
                ? '3D 작업실로 이동'
                : 'Go to 3D Studio'
              : isKo
                ? '일상 홈 화면으로'
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
                ? '전문가 용어로 전환'
                : 'Switch to Pro Terms'
              : isKo
                ? '쉬운 일상 용어로 전환'
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
            {isKo ? 'English로 전환' : '한국어로 전환'}
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
            {isKo ? '단축키 전체 가이드' : 'Shortcuts Guide'}
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
              ? 'Firebase AI Logic & App Check 연결 설정'
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
              ? '우클릭 전체 기능 빠른 컨트롤 센터'
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
              ['target', isKo ? '현재위치' : 'Target'],
              ['optimize', isKo ? '최적화' : 'Optimize'],
              ['view3d', isKo ? '3D뷰·조명' : '3D View'],
              ['space_data', isKo ? '도면·공간' : 'Space'],
              ['ai_system', isKo ? 'AI·설정' : 'AI/Sys'],
              ['all', isKo ? '전체보기' : 'All'],
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
          {isKo ? '공간·물품 상세 편집 탭' : 'Open Space & SKU Editor'}
        </button>
        <span>
          {isKo ? '어디서나 우클릭으로 전체 기능 실행' : 'Right-click anywhere'}
        </span>
      </div>
    </div>
  );
};
