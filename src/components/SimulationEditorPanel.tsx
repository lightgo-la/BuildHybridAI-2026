import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Grid,
  Minus,
  Package,
  Pin,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { type LangCode } from '../i18n/translations';
import type { CustomBoxPlacementInput } from '../hooks/useWarehouseTransforms';
import type {
  ABCClass,
  BinSpec,
  PinnedCargoPlacement,
  SKUItem,
  SlottingResult,
  WarehouseConfig,
} from '../types/warehouse';
import {
  exportSkusToCSV,
  exportSlottingResultToCSV,
  parseSkusFromCSV,
} from '../utils/csvExporter';

interface SimulationEditorPanelProps {
  config: WarehouseConfig;
  bins: BinSpec[];
  extraBinsCount: number;
  removedBinsCount: number;
  skus: SKUItem[];
  pinnedPlacements: PinnedCargoPlacement[];
  selectedBinId: string | null;
  scenarioName?: string;
  activeResult?: SlottingResult;
  onUpdateConfig: (patch: Partial<WarehouseConfig>) => void;
  onAddBin: (bin: BinSpec) => void;
  onDeleteBin: (binId: string) => void;
  onResetSpaceEdits: () => void;
  onChangeSkus: (next: SKUItem[]) => void;
  onPinCargo: (binId: string, skuId: string, delta: number) => void;
  onPlaceCustomBoxInBin?: (input: CustomBoxPlacementInput) => void;
  onClearAllPins: () => void;
  lang?: LangCode;
}

const PALETTE = ['#22d3ee', '#38bdf8', '#34d399', '#f59e0b', '#fb7185', '#a78bfa'];

const QUICK_ITEM_PRESETS: Array<{
  label: string;
  code: string;
  name: string;
  abc: ABCClass;
  picks: number;
  l: number;
  w: number;
  h: number;
  kg: number;
  qty: number;
  fragile: boolean;
}> = [
  { label: '+ 생수 2L팩', code: 'WTR-2L', name: '생수 2L×12팩', abc: 'A', picks: 110, l: 36, w: 24, h: 32, kg: 24, qty: 4, fragile: false },
  { label: '+ 택배박스', code: 'PKG-M', name: '중형 택배박스', abc: 'A', picks: 130, l: 40, w: 30, h: 24, kg: 4.5, qty: 6, fragile: false },
  { label: '+ 캠핑박스', code: 'CMP-01', name: '캠핑 수납 폴딩박스', abc: 'B', picks: 45, l: 50, w: 35, h: 28, kg: 7.5, qty: 4, fragile: false },
  { label: '+ 깨짐주의 기기', code: 'FRG-09', name: '정밀/유리 보관함', abc: 'A', picks: 90, l: 32, w: 24, h: 20, kg: 3.2, qty: 4, fragile: true },
];

export const SimulationEditorPanel: React.FC<SimulationEditorPanelProps> = ({
  config,
  bins,
  extraBinsCount,
  removedBinsCount,
  skus,
  pinnedPlacements,
  selectedBinId,
  scenarioName = 'CubiSlot 3D',
  activeResult,
  onUpdateConfig,
  onAddBin,
  onDeleteBin,
  onResetSpaceEdits,
  onChangeSkus,
  onPinCargo,
  onPlaceCustomBoxInBin,
  onClearAllPins,
  lang = 'ko',
}) => {
  const [step, setStep] = useState<'space' | 'cargo'>('space');
  const [targetPlacementBinId, setTargetPlacementBinId] = useState<string>(
    selectedBinId ?? ''
  );

  useEffect(() => {
    if (selectedBinId) {
      setTargetPlacementBinId(selectedBinId);
    }
  }, [selectedBinId]);

  // Step 1: Custom Bin Add Form
  const [newAisle, setNewAisle] = useState(1);
  const [newBay, setNewBay] = useState(config.baysPerAisle + 1);
  const [newLevel, setNewLevel] = useState(2);
  const [newMaxWeight, setNewMaxWeight] = useState(750);

  // Step 2: Cargo Designer Form
  const maxL = (config.binLengthCm ?? 120) - 2;
  const maxW = (config.binWidthCm ?? 90) - 2;
  const maxH = (config.binHeightCm ?? 70) - 2;
  const [skuCode, setSkuCode] = useState('ITEM-01');
  const [skuName, setSkuName] = useState('다용도 수납 박스 (Storage Box)');
  const [abcClass, setAbcClass] = useState<ABCClass>('A');
  const [dailyPicks, setDailyPicks] = useState(120);
  const [lengthCm, setLengthCm] = useState(Math.min(40, maxL));
  const [widthCm, setWidthCm] = useState(Math.min(30, maxW));
  const [heightCm, setHeightCm] = useState(Math.min(24, maxH));
  const [weightKg, setWeightKg] = useState(8);
  const [quantity, setQuantity] = useState(6);
  const [fragile, setFragile] = useState(false);
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);

  // Sync dimension form defaults whenever active template/rack bin bounds change
  useEffect(() => {
    setNewBay(config.baysPerAisle + 1);
    setLengthCm((prev) => Math.max(10, Math.min(maxL, prev)));
    setWidthCm((prev) => Math.max(10, Math.min(maxW, prev)));
    setHeightCm((prev) => Math.max(10, Math.min(maxH, prev)));
  }, [config.baysPerAisle, maxL, maxW, maxH]);

  const parseInputInt = (raw: string, fallback: number, min: number, max: number) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
  };

  const parseInputFloat = (raw: string, fallback: number, min: number, max: number) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  };

  const handleAddCustomBin = (e: React.FormEvent) => {
    e.preventDefault();
    const aisleSpacing = config.aisleSpacingM ?? 3.4;
    const baySpacing = config.baySpacingM ?? 1.45;
    const xMeters = Number(((newAisle - 1) * aisleSpacing).toFixed(2));
    const yMeters = Number(((newBay - 1) * baySpacing + 1.8).toFixed(2));
    const hasObstacle = (config.obstacles ?? []).some(
      (o) =>
        (o.aisle === newAisle && o.bay === newBay) ||
        Math.hypot(o.xMeters - xMeters, o.yMeters - yMeters) < 0.45
    );
    if (hasObstacle) return;

    const levelHeights = [0.05, 0.85, 1.55, 2.35, 3.15, 3.95];
    const zMeters =
      levelHeights[newLevel - 1] ?? Number(((newLevel - 1) * 0.82 + 0.05).toFixed(2));
    const binId = `A${newAisle}-B${newBay}-Z${newLevel}`;
    onAddBin({
      id: binId,
      aisle: newAisle,
      bay: newBay,
      level: newLevel,
      xMeters,
      yMeters,
      zMeters,
      binLengthCm: config.binLengthCm ?? 120,
      binWidthCm: config.binWidthCm ?? 90,
      binHeightCm: config.binHeightCm ?? 70,
      maxWeightKg: newMaxWeight,
      isGoldenZone:
        zMeters >= config.goldenZoneMinM && zMeters <= config.goldenZoneMaxM,
    });
  };

  const handleAddCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetPlacementBinId && onPlaceCustomBoxInBin) {
      onPlaceCustomBoxInBin({
        binId: targetPlacementBinId,
        skuCode: skuCode.trim() || `BOX-${lengthCm}x${widthCm}x${heightCm}`,
        name: skuName.trim() || 'Custom Cargo',
        abcClass,
        lengthCm: Math.max(5, Math.min(280, lengthCm)),
        widthCm: Math.max(5, Math.min(280, widthCm)),
        heightCm: Math.max(5, Math.min(240, heightCm)),
        weightKg: Math.max(0.2, weightKg),
        quantity: Math.max(1, Math.min(40, quantity)),
        fragile,
        color: PALETTE[skus.length % PALETTE.length],
        autoExpandBin: true,
      });
      return;
    }
    const newSku: SKUItem = {
      id: `sku-${Date.now()}`,
      skuCode: skuCode.trim() || 'CUSTOM',
      name: skuName.trim() || 'Custom Cargo',
      category: 'Designed',
      abcClass,
      dailyPicks: Math.max(1, dailyPicks),
      lengthCm: Math.max(8, Math.min(maxL, lengthCm)),
      widthCm: Math.max(8, Math.min(maxW, widthCm)),
      heightCm: Math.max(8, Math.min(maxH, heightCm)),
      weightKg: Math.max(0.5, weightKg),
      quantity: Math.max(1, Math.min(40, quantity)),
      fragile,
      color: PALETTE[skus.length % PALETTE.length],
    };
    onChangeSkus([newSku, ...skus]);
  };

  return (
    <div className="space-y-3 text-xs">
      {/* 2-Step Guided Switcher */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-950/70 p-1">
        <button
          type="button"
          onClick={() => setStep('space')}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition ${
            step === 'space'
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Grid className="h-3.5 w-3.5" />
          {lang === 'ko' ? '1. 공간·선반 설계' : '1. Space Designer'}
        </button>
        <button
          type="button"
          onClick={() => setStep('cargo')}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition ${
            step === 'cargo'
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          {lang === 'ko' ? '2. 수납 물품 설계' : '2. Cargo Designer'}
        </button>
      </div>

      {step === 'space' ? (
        <div className="space-y-3">
          {/* Grid Dimensions */}
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
              <span>
                {lang === 'ko' ? '공간 격자 & 선반 규격' : 'Warehouse Space Geometry'}
              </span>
              <span className="text-[10px] text-cyan-300">
                {bins.length} {lang === 'ko' ? '개 활성 선반' : 'active bins'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400">
                  {lang === 'ko' ? '선반 열 수 (X)' : 'Aisles (X)'}
                </span>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={config.aisles}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isFinite(val)) return;
                    onUpdateConfig({
                      aisles: Math.max(1, Math.min(7, Math.round(val || 1))),
                    });
                  }}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">
                  {lang === 'ko' ? '가로 칸 수 (Y)' : 'Bays (Y)'}
                </span>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={config.baysPerAisle}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isFinite(val)) return;
                    onUpdateConfig({
                      baysPerAisle: Math.max(
                        2,
                        Math.min(10, Math.round(val || 2))
                      ),
                    });
                  }}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">
                  {lang === 'ko' ? '높이 단수 (Z)' : 'Levels (Z)'}
                </span>
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={config.levels}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isFinite(val)) return;
                    onUpdateConfig({
                      levels: Math.max(2, Math.min(6, Math.round(val || 2))),
                    });
                  }}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400">
                  {lang === 'ko' ? '칸 가로 L (cm)' : 'Bin L (cm)'}
                </span>
                <input
                  type="number"
                  min={60}
                  max={180}
                  value={config.binLengthCm ?? 120}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isFinite(val)) return;
                    onUpdateConfig({
                      binLengthCm: Math.max(60, Math.min(180, val || 60)),
                    });
                  }}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">
                  {lang === 'ko' ? '칸 깊이 W (cm)' : 'Bin W (cm)'}
                </span>
                <input
                  type="number"
                  min={50}
                  max={150}
                  value={config.binWidthCm ?? 90}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isFinite(val)) return;
                    onUpdateConfig({
                      binWidthCm: Math.max(50, Math.min(150, val || 50)),
                    });
                  }}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">
                  {lang === 'ko' ? '칸 높이 H (cm)' : 'Bin H (cm)'}
                </span>
                <input
                  type="number"
                  min={40}
                  max={120}
                  value={config.binHeightCm ?? 70}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isFinite(val)) return;
                    onUpdateConfig({
                      binHeightCm: Math.max(40, Math.min(120, val || 40)),
                    });
                  }}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Add / Delete Individual Storage Rack Bin */}
          <form
            onSubmit={handleAddCustomBin}
            className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px]"
          >
            <div className="flex items-center justify-between font-semibold text-slate-200">
              <span>
                {lang === 'ko'
                  ? '개별 선반 칸 추가 / 삭제'
                  : 'Add / Delete Storage Bin'}
              </span>
              {(extraBinsCount > 0 || removedBinsCount > 0) && (
                <button
                  type="button"
                  onClick={onResetSpaceEdits}
                  className="inline-flex items-center gap-1 text-[10px] text-amber-300 hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  {lang === 'ko'
                    ? `초기화 (+${extraBinsCount} / -${removedBinsCount})`
                    : `Reset (${extraBinsCount} added / ${removedBinsCount} removed)`}
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <div>
                <span className="text-[10px] text-slate-500">
                  {lang === 'ko' ? '열(Aisle)' : 'Aisle'}
                </span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newAisle}
                  onChange={(e) =>
                    setNewAisle(parseInputInt(e.target.value, newAisle, 1, 10))
                  }
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">
                  {lang === 'ko' ? '칸(Bay)' : 'Bay'}
                </span>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={newBay}
                  onChange={(e) =>
                    setNewBay(parseInputInt(e.target.value, newBay, 1, 14))
                  }
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">
                  {lang === 'ko' ? '층(Z)' : 'Level Z'}
                </span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={newLevel}
                  onChange={(e) =>
                    setNewLevel(parseInputInt(e.target.value, newLevel, 1, 8))
                  }
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">
                  {lang === 'ko' ? '하중(kg)' : 'Max kg'}
                </span>
                <input
                  type="number"
                  min={100}
                  max={2000}
                  value={newMaxWeight}
                  onChange={(e) =>
                    setNewMaxWeight(
                      parseInputInt(e.target.value, newMaxWeight, 100, 2000)
                    )
                  }
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-cyan-500 py-1.5 font-semibold text-slate-950 hover:bg-cyan-400"
              >
                <Plus className="h-3.5 w-3.5" />
                {lang === 'ko' ? '선반 칸 추가' : 'Add Rack Bin'}
              </button>
              {selectedBinId && (
                <button
                  type="button"
                  onClick={() => onDeleteBin(selectedBinId)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1.5 font-semibold text-rose-300 hover:bg-rose-500/25"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {lang === 'ko' ? `${selectedBinId} 삭제` : `Delete ${selectedBinId}`}
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              {lang === 'ko'
                ? '팁: 3D 화면에서 마우스 오른쪽 버튼을 누르면 커서 위치에 바로 선반을 추가·삭제할 수 있습니다.'
                : 'Tip: Right-click anywhere in the 3D scene to add or delete bins directly at the cursor.'}
            </p>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Unplaced Cargo Warning Alert (if capacity or weight constraints overflow) */}
          {activeResult &&
            activeResult.unplacedUnits > 0 &&
            activeResult.unplacedItems &&
            activeResult.unplacedItems.length > 0 && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-2.5 text-[11px] text-amber-200">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {lang === 'ko'
                      ? `미적재 물품 ${activeResult.unplacedUnits}개 발생 (공간 또는 안전 하중 초과)`
                      : `${activeResult.unplacedUnits} units could not be placed (Volume / Weight limit)`}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1 text-[10px]">
                  {activeResult.unplacedItems.map((u) => (
                    <div
                      key={u.skuId}
                      className="flex items-center justify-between rounded bg-slate-950/60 px-2 py-0.5"
                    >
                      <span className="font-mono font-semibold text-white">
                        {u.skuCode} ({u.name.slice(0, 12)}) ×{u.count}
                      </span>
                      <span className="text-amber-300/90">
                        {u.reason === 'weight_or_safety_limit'
                          ? lang === 'ko'
                            ? 'Z1~Z2 하중/안전층 부족'
                            : 'Z1-Z2 weight/safety limit'
                          : lang === 'ko'
                            ? '선반 부피 부족'
                            : 'Bin volume full'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* CSV Import / Export Bar for Real Warehouse Master Data */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span className="inline-flex items-center gap-1">
                <FileSpreadsheet className="h-3 w-3 text-emerald-400" />
                {lang === 'ko'
                  ? '실무 CSV 데이터 가져오기 / 내보내기'
                  : 'CSV Master Data Import / Export'}
              </span>
              <span className="text-slate-500">{skus.length} SKUs</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] sm:grid-cols-4">
              <label className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-medium text-cyan-300 hover:border-cyan-400">
                <Upload className="h-3 w-3" />
                {lang === 'ko' ? 'SKU CSV 업로드' : 'Import CSV'}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const imported = parseSkusFromCSV(String(reader.result ?? ''), {
                        maxL: Math.max(maxL, 140),
                        maxW: Math.max(maxW, 110),
                        maxH: Math.max(maxH, 90),
                      });
                      if (imported.length > 0) {
                        onResetSpaceEdits();
                        const importedVolCm3 = imported.reduce(
                          (sum, s) =>
                            sum + s.lengthCm * s.widthCm * s.heightCm * s.quantity,
                          0
                        );
                        const singleBinVolCm3 =
                          (config.binLengthCm ?? 120) *
                          (config.binWidthCm ?? 90) *
                          (config.binHeightCm ?? 70);
                        const currentTotalVolCm3 =
                          Math.max(1, bins.length) * singleBinVolCm3;
                        if (
                          importedVolCm3 > currentTotalVolCm3 * 0.62 ||
                          imported.length > bins.length
                        ) {
                          const neededBins = Math.max(
                            imported.length,
                            Math.ceil(
                              (importedVolCm3 / Math.max(1, singleBinVolCm3)) * 1.55
                            )
                          );
                          const nextLevels = Math.max(
                            config.levels,
                            Math.min(6, neededBins >= 75 ? 4 : 3)
                          );
                          const colsNeeded = Math.ceil(neededBins / nextLevels);
                          const nextAisles = Math.max(
                            config.aisles,
                            Math.min(8, Math.ceil(Math.sqrt(colsNeeded / 1.2)))
                          );
                          const nextBays = Math.max(
                            config.baysPerAisle,
                            Math.min(12, Math.ceil(colsNeeded / nextAisles))
                          );
                          onUpdateConfig({
                            aisles: nextAisles,
                            baysPerAisle: nextBays,
                            levels: nextLevels,
                          });
                        }
                        onChangeSkus(imported);
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
                  const cats = [
                    ['Beverage', '생수·음료 묶음', 'Beverage Crate', '#38bdf8', false],
                    ['PantryFood', '팬트리 식품팩', 'Pantry Pack', '#f59e0b', false],
                    ['ColdChain', '신선 냉장·냉동팩', 'Cold-Chain Box', '#22d3ee', false],
                    ['Apparel', '의류 리빙박스', 'Apparel Tote', '#a78bfa', false],
                    ['Electronics', '정밀 전자 모듈', 'ESD Tech Module', '#fb7185', true],
                  ] as const;
                  const generated100: SKUItem[] = Array.from(
                    { length: 100 },
                    (_, i) => {
                      const idx = i + 1;
                      const [cat, ko, en, color, frag] = cats[i % cats.length];
                      const abcClass: ABCClass =
                        i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C';
                      return {
                        id: `sku-sample100-${idx}`,
                        skuCode: `SKU-${String(idx).padStart(3, '0')}`,
                        name: `${ko} #${idx} (${en} ${idx})`,
                        category: cat,
                        abcClass,
                        dailyPicks:
                          abcClass === 'A'
                            ? 95 + ((i * 7) % 110)
                            : abcClass === 'B'
                              ? 35 + ((i * 5) % 50)
                              : 6 + ((i * 3) % 24),
                        lengthCm: 24 + ((i * 5) % 44),
                        widthCm: 20 + ((i * 3) % 34),
                        heightCm: 16 + ((i * 4) % 28),
                        weightKg: Number((1.2 + ((i * 1.9) % 24)).toFixed(1)),
                        quantity: 2 + (i % 3),
                        fragile: frag || i % 11 === 0,
                        color,
                      };
                    }
                  );
                  onResetSpaceEdits();
                  onUpdateConfig({
                    aisles: 5,
                    baysPerAisle: 5,
                    levels: 4,
                    binLengthCm: Math.max(config.binLengthCm ?? 120, 130),
                    binWidthCm: Math.max(config.binWidthCm ?? 90, 95),
                    binHeightCm: Math.max(config.binHeightCm ?? 70, 75),
                  });
                  onChangeSkus(generated100);
                }}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-500/45 bg-amber-500/15 px-2 py-1.5 font-semibold text-amber-300 hover:bg-amber-500/25"
                title={
                  lang === 'ko'
                    ? '100종 품목(299박스)과 100개 선반(5×5×4) 대량 시뮬레이션 샘플을 원클릭으로 즉시 로드합니다'
                    : 'Load 100-SKU (299 boxes) & 100-Bin (5×5×4) benchmark sample in 1 click'
                }
              >
                {lang === 'ko' ? '🧪 100개 샘플 로드' : '🧪 Load 100 SKUs'}
              </button>
              <button
                type="button"
                onClick={() => exportSkusToCSV(skus, scenarioName)}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-medium text-slate-200 hover:border-cyan-400"
              >
                <Download className="h-3 w-3 text-cyan-400" />
                {lang === 'ko' ? 'SKU 목록 CSV' : 'Export SKUs'}
              </button>
              {activeResult && (
                <button
                  type="button"
                  onClick={() =>
                    exportSlottingResultToCSV(activeResult, scenarioName)
                  }
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2 py-1.5 font-semibold text-emerald-300 hover:bg-emerald-500/25"
                >
                  <Download className="h-3 w-3" />
                  {lang === 'ko' ? '적재결과 CSV' : 'Slotting CSV'}
                </button>
              )}
            </div>
          </div>

          {/* 1-Click Quick Item Chips (No typing required) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="mb-1.5 text-[10px] font-semibold text-slate-400">
              {lang === 'ko'
                ? '원클릭 빠른 물품 추가 (클릭 한 번으로 바로 추가)'
                : 'Quick Add Item (1-Click)'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ITEM_PRESETS.map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => {
                    const item: SKUItem = {
                      id: `sku-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      skuCode: preset.code,
                      name: preset.name,
                      category: 'Quick',
                      abcClass: preset.abc,
                      dailyPicks: preset.picks,
                      lengthCm: Math.min(maxL, preset.l),
                      widthCm: Math.min(maxW, preset.w),
                      heightCm: Math.min(maxH, preset.h),
                      weightKg: preset.kg,
                      quantity: preset.qty,
                      fragile: preset.fragile,
                      color: PALETTE[skus.length % PALETTE.length],
                    };
                    onChangeSkus([item, ...skus]);
                  }}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-medium text-cyan-300 hover:border-cyan-400"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Design New Cargo */}
          <form
            onSubmit={handleAddCargo}
            className="grid grid-cols-3 gap-2 rounded-xl border border-emerald-500/35 bg-slate-950/70 p-2.5 text-[11px]"
          >
            <div className="col-span-3 flex items-center justify-between">
              <span className="font-bold text-emerald-300">
                {lang === 'ko'
                  ? '맞춤 박스 사이즈 설정 & 선반 투입'
                  : 'Custom Box Size & Shelf Placement'}
              </span>
              <span className="font-mono text-[10px] text-cyan-300">
                {lengthCm}×{widthCm}×{heightCm} cm
              </span>
            </div>

            {/* Target Shelf Bin Selector */}
            <div className="col-span-3">
              <span className="text-[10px] text-slate-400">
                {lang === 'ko'
                  ? '투입할 목표 선반 선택 (특정 선반 지정 또는 자동 배치)'
                  : 'Target Shelf Bin'}
              </span>
              <select
                value={targetPlacementBinId}
                onChange={(e) => setTargetPlacementBinId(e.target.value)}
                className="mt-0.5 w-full rounded border border-emerald-500/40 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-emerald-200"
              >
                <option value="">
                  {lang === 'ko'
                    ? '자동 최적 선반 배치 (3D 엔진 자동 할당)'
                    : 'Auto Optimal Placement (3D Engine)'}
                </option>
                {bins.map((b) => (
                  <option key={b.id} value={b.id}>
                    {lang === 'ko'
                      ? `선반 [${b.id}]에 바로 넣기 (Z${b.level}층 · 규격 ${b.binLengthCm}×${b.binWidthCm}×${b.binHeightCm}cm)`
                      : `Place Directly in [${b.id}] (Z${b.level} · ${b.binLengthCm}×${b.binWidthCm}×${b.binHeightCm}cm)`}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Box Dimension Presets */}
            <div className="col-span-3">
              <div className="mb-1 text-[10px] text-slate-400">
                {lang === 'ko'
                  ? '빠른 박스 사이즈 선택 (가로×세로×높이 cm):'
                  : 'Quick Box Size Presets (L×W×H cm):'}
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                {[
                  { label: lang === 'ko' ? '소형 25×20×15' : 'S 25×20×15', l: 25, w: 20, h: 15, kg: 2 },
                  { label: lang === 'ko' ? '중형 40×30×24' : 'M 40×30×24', l: 40, w: 30, h: 24, kg: 5 },
                  { label: lang === 'ko' ? '대형 60×40×35' : 'L 60×40×35', l: 60, w: 40, h: 35, kg: 10 },
                  {
                    label: lang === 'ko' ? '선반 1/2칸' : 'Half Bin',
                    l: Math.max(12, Math.floor(maxL / 2)),
                    w: Math.max(12, maxW - 4),
                    h: Math.max(12, Math.floor(maxH * 0.75)),
                    kg: 7,
                  },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setLengthCm(p.l);
                      setWidthCm(p.w);
                      setHeightCm(p.h);
                      setWeightKg(p.kg);
                      setSkuCode(`BOX-${p.l}x${p.w}x${p.h}`);
                    }}
                    className="truncate rounded border border-slate-700 bg-slate-900 px-1.5 py-1 font-medium text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <input
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value)}
              placeholder={lang === 'ko' ? '물품 코드/라벨' : 'SKU Code'}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            />
            <input
              value={skuName}
              onChange={(e) => setSkuName(e.target.value)}
              placeholder={lang === 'ko' ? '물품 이름' : 'Cargo Name'}
              className="col-span-2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            />
            <div>
              <span className="text-[10px] text-slate-500">
                {lang === 'ko' ? '사용 빈도' : 'ABC'}
              </span>
              <select
                value={abcClass}
                onChange={(e) => setAbcClass(e.target.value as ABCClass)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
              >
                <option value="A">
                  {lang === 'ko' ? '자주 씀 (A)' : 'Class A'}
                </option>
                <option value="B">
                  {lang === 'ko' ? '보통 (B)' : 'Class B'}
                </option>
                <option value="C">
                  {lang === 'ko' ? '가끔·보관 (C)' : 'Class C'}
                </option>
              </select>
            </div>
            <div>
              <span className="text-[10px] text-slate-500">
                {lang === 'ko' ? '하루 꺼내는 횟수' : 'Picks/d'}
              </span>
              <input
                type="number"
                value={dailyPicks}
                onChange={(e) =>
                  setDailyPicks(parseInputInt(e.target.value, dailyPicks, 1, 5000))
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">
                {lang === 'ko' ? '무게 (kg)' : 'Weight (kg)'}
              </span>
              <input
                type="number"
                step="0.5"
                value={weightKg}
                onChange={(e) =>
                  setWeightKg(parseInputFloat(e.target.value, weightKg, 0.2, 500))
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">
                {lang === 'ko' ? `가로 L (≤${maxL})` : `L (≤${maxL})`}
              </span>
              <input
                type="number"
                max={maxL}
                value={lengthCm}
                onChange={(e) =>
                  setLengthCm(parseInputInt(e.target.value, lengthCm, 8, maxL))
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">
                {lang === 'ko' ? `세로 W (≤${maxW})` : `W (≤${maxW})`}
              </span>
              <input
                type="number"
                max={maxW}
                value={widthCm}
                onChange={(e) =>
                  setWidthCm(parseInputInt(e.target.value, widthCm, 8, maxW))
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">
                {lang === 'ko' ? `높이 H (≤${maxH}) / 수량` : `H (≤${maxH}) / Qty`}
              </span>
              <div className="flex gap-1">
                <input
                  type="number"
                  max={maxH}
                  value={heightCm}
                  onChange={(e) =>
                    setHeightCm(parseInputInt(e.target.value, heightCm, 8, maxH))
                  }
                  className="w-1/2 rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                />
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(parseInputInt(e.target.value, quantity, 1, 60))
                  }
                  className="w-1/2 rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                />
              </div>
            </div>
            <label className="col-span-3 flex items-center gap-2 text-[10px] text-slate-300">
              <input
                type="checkbox"
                checked={fragile}
                onChange={(e) => setFragile(e.target.checked)}
                className="accent-amber-400"
              />
              {lang === 'ko'
                ? '파손주의 (세워서만 보관 · 상단 적재 금지)'
                : 'Fragile (upright only, block top stacking)'}
            </label>
            <button
              type="submit"
              className="col-span-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/90 py-1.5 font-semibold text-slate-950 hover:bg-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" />
              {targetPlacementBinId
                ? lang === 'ko'
                  ? `선반 [${targetPlacementBinId}]에 ${lengthCm}×${widthCm}×${heightCm}cm 박스 ${quantity}개 바로 넣기`
                  : `Place ${quantity}× (${lengthCm}×${widthCm}×${heightCm}cm) Box in [${targetPlacementBinId}]`
                : lang === 'ko'
                  ? `새 수납 박스 추가 (${lengthCm}×${widthCm}×${heightCm}cm ×${quantity}개)`
                  : `Create Cargo Box (${lengthCm}×${widthCm}×${heightCm}cm ×${quantity})`}
            </button>
          </form>

          {/* Pinned Cargo Summary */}
          {pinnedPlacements.length > 0 && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-2.5 text-[11px]">
              <div className="flex items-center justify-between font-semibold text-cyan-300">
                <span className="inline-flex items-center gap-1">
                  <Pin className="h-3 w-3" />
                  {lang === 'ko'
                    ? `수동 고정된 물품 (${pinnedPlacements.length})`
                    : `Manual Bin Pins (${pinnedPlacements.length})`}
                </span>
                <button
                  type="button"
                  onClick={onClearAllPins}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  {lang === 'ko' ? '전체 해제' : 'Clear All'}
                </button>
              </div>
              <div className="mt-1.5 space-y-1">
                {pinnedPlacements.map((p) => {
                  const sku = skus.find((s) => s.id === p.skuId);
                  return (
                    <div
                      key={`${p.binId}-${p.skuId}`}
                      className="flex items-center justify-between text-[10px]"
                    >
                      <span>
                        {p.binId} ← {sku?.name ?? sku?.skuCode ?? p.skuId} ×{p.count}
                      </span>
                      <button
                        type="button"
                        onClick={() => onPinCargo(p.binId, p.skuId, -p.count)}
                        className="text-rose-400 hover:underline"
                      >
                        {lang === 'ko' ? '해제' : 'Unpin'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cargo List with Qty +/-, Inline Edit, Pin to Bin, Delete */}
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {skus.map((sku) => {
              const isEditing = editingSkuId === sku.id;
              return (
                <div
                  key={sku.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: sku.color }}
                        />
                        <span className="font-semibold text-white">
                          {sku.skuCode}
                        </span>
                        <span className="truncate text-slate-300">
                          {sku.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {sku.lengthCm}×{sku.widthCm}×{sku.heightCm}cm ·{' '}
                        {sku.weightKg}kg ·{' '}
                        {lang === 'ko'
                          ? `수량 ${sku.quantity}개`
                          : `qty ${sku.quantity}`}
                      </div>
                    </div>
                    <div className="ml-2 flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingSkuId(isEditing ? null : sku.id)
                        }
                        className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${
                          isEditing
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                            : 'border-slate-700 text-slate-300 hover:border-cyan-400'
                        }`}
                      >
                        {lang === 'ko'
                          ? isEditing
                            ? '닫기'
                            : '수정'
                          : isEditing
                            ? 'Close'
                            : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onChangeSkus(
                            skus.map((s) =>
                              s.id === sku.id
                                ? { ...s, quantity: Math.max(1, s.quantity - 1) }
                                : s
                            )
                          )
                        }
                        className="rounded border border-slate-700 p-0.5 text-slate-300 hover:bg-slate-800"
                        title="Decrease qty"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onChangeSkus(
                            skus.map((s) =>
                              s.id === sku.id
                                ? {
                                    ...s,
                                    quantity: Math.min(50, s.quantity + 1),
                                  }
                                : s
                            )
                          )
                        }
                        className="rounded border border-slate-700 p-0.5 text-slate-300 hover:bg-slate-800"
                        title="Increase qty"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      {selectedBinId && (
                        <button
                          type="button"
                          onClick={() => onPinCargo(selectedBinId, sku.id, 1)}
                          className="rounded border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300 hover:bg-cyan-500/25"
                          title={`Pin 1 unit into ${selectedBinId}`}
                        >
                          {lang === 'ko' ? '+고정' : '+Pin'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onChangeSkus(skus.filter((s) => s.id !== sku.id))
                        }
                        className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400"
                        title="Delete SKU"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-slate-800 pt-2 text-[10px]">
                      <input
                        value={sku.name}
                        onChange={(e) =>
                          onChangeSkus(
                            skus.map((s) =>
                              s.id === sku.id
                                ? { ...s, name: e.target.value }
                                : s
                            )
                          )
                        }
                        placeholder={lang === 'ko' ? '물품 이름' : 'Name'}
                        className="col-span-2 rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                      />
                      <select
                        value={sku.abcClass}
                        onChange={(e) =>
                          onChangeSkus(
                            skus.map((s) =>
                              s.id === sku.id
                                ? { ...s, abcClass: e.target.value as ABCClass }
                                : s
                            )
                          )
                        }
                        className="rounded border border-slate-700 bg-slate-900 px-1 py-1 text-slate-100"
                      >
                        <option value="A">
                          {lang === 'ko' ? '자주 씀 (A)' : 'Class A'}
                        </option>
                        <option value="B">
                          {lang === 'ko' ? '보통 (B)' : 'Class B'}
                        </option>
                        <option value="C">
                          {lang === 'ko' ? '가끔 (C)' : 'Class C'}
                        </option>
                      </select>
                      <div className="col-span-3 grid grid-cols-4 gap-1.5">
                        <div>
                          <span className="text-slate-500">
                            {lang === 'ko' ? '가로 L(cm)' : 'L(cm)'}
                          </span>
                          <input
                            type="number"
                            value={sku.lengthCm}
                            onChange={(e) =>
                              onChangeSkus(
                                skus.map((s) =>
                                  s.id === sku.id
                                    ? {
                                        ...s,
                                        lengthCm: parseInputInt(
                                          e.target.value,
                                          s.lengthCm,
                                          5,
                                          280
                                        ),
                                      }
                                    : s
                                )
                              )
                            }
                            className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-slate-100"
                          />
                        </div>
                        <div>
                          <span className="text-slate-500">
                            {lang === 'ko' ? '세로 W(cm)' : 'W(cm)'}
                          </span>
                          <input
                            type="number"
                            value={sku.widthCm}
                            onChange={(e) =>
                              onChangeSkus(
                                skus.map((s) =>
                                  s.id === sku.id
                                    ? {
                                        ...s,
                                        widthCm: parseInputInt(
                                          e.target.value,
                                          s.widthCm,
                                          5,
                                          280
                                        ),
                                      }
                                    : s
                                )
                              )
                            }
                            className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-slate-100"
                          />
                        </div>
                        <div>
                          <span className="text-slate-500">
                            {lang === 'ko' ? '높이 H(cm)' : 'H(cm)'}
                          </span>
                          <input
                            type="number"
                            value={sku.heightCm}
                            onChange={(e) =>
                              onChangeSkus(
                                skus.map((s) =>
                                  s.id === sku.id
                                    ? {
                                        ...s,
                                        heightCm: parseInputInt(
                                          e.target.value,
                                          s.heightCm,
                                          5,
                                          240
                                        ),
                                      }
                                    : s
                                )
                              )
                            }
                            className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-slate-100"
                          />
                        </div>
                        <div>
                          <span className="text-slate-500">
                            {lang === 'ko' ? '무게(kg)' : 'kg'}
                          </span>
                          <input
                            type="number"
                            step="0.5"
                            value={sku.weightKg}
                            onChange={(e) =>
                              onChangeSkus(
                                skus.map((s) =>
                                  s.id === sku.id
                                    ? {
                                        ...s,
                                        weightKg: parseInputFloat(
                                          e.target.value,
                                          s.weightKg,
                                          0.2,
                                          500
                                        ),
                                      }
                                    : s
                                )
                              )
                            }
                            className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
