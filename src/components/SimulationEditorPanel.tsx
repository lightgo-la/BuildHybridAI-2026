import React, { useEffect, useState } from 'react';
import {
  Grid,
  Minus,
  Package,
  Pin,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { type LangCode } from '../i18n/translations';
import type {
  ABCClass,
  BinSpec,
  PinnedCargoPlacement,
  SKUItem,
  WarehouseConfig,
} from '../types/warehouse';

interface SimulationEditorPanelProps {
  config: WarehouseConfig;
  bins: BinSpec[];
  extraBinsCount: number;
  removedBinsCount: number;
  skus: SKUItem[];
  pinnedPlacements: PinnedCargoPlacement[];
  selectedBinId: string | null;
  onUpdateConfig: (patch: Partial<WarehouseConfig>) => void;
  onAddBin: (bin: BinSpec) => void;
  onDeleteBin: (binId: string) => void;
  onResetSpaceEdits: () => void;
  onChangeSkus: (next: SKUItem[]) => void;
  onPinCargo: (binId: string, skuId: string, delta: number) => void;
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
  onUpdateConfig,
  onAddBin,
  onDeleteBin,
  onResetSpaceEdits,
  onChangeSkus,
  onPinCargo,
  onClearAllPins,
  lang = 'ko',
}) => {
  const [step, setStep] = useState<'space' | 'cargo'>('space');

  // Step 1: Custom Bin Add Form
  const [newAisle, setNewAisle] = useState(1);
  const [newBay, setNewBay] = useState(config.baysPerAisle + 1);
  const [newLevel, setNewLevel] = useState(2);
  const [newMaxWeight, setNewMaxWeight] = useState(750);

  // Step 2: Cargo Designer Form
  const maxL = (config.binLengthCm ?? 120) - 2;
  const maxW = (config.binWidthCm ?? 90) - 2;
  const maxH = (config.binHeightCm ?? 70) - 2;
  const [skuCode, setSkuCode] = useState('CAD-105');
  const [skuName, setSkuName] = useState('Custom Designed Carton');
  const [abcClass, setAbcClass] = useState<ABCClass>('A');
  const [dailyPicks, setDailyPicks] = useState(120);
  const [lengthCm, setLengthCm] = useState(Math.min(40, maxL));
  const [widthCm, setWidthCm] = useState(Math.min(30, maxW));
  const [heightCm, setHeightCm] = useState(Math.min(24, maxH));
  const [weightKg, setWeightKg] = useState(8);
  const [quantity, setQuantity] = useState(6);
  const [fragile, setFragile] = useState(false);

  // Sync dimension form defaults whenever active template/rack bin bounds change
  useEffect(() => {
    setNewBay(config.baysPerAisle + 1);
    setLengthCm((prev) => Math.max(10, Math.min(maxL, prev)));
    setWidthCm((prev) => Math.max(10, Math.min(maxW, prev)));
    setHeightCm((prev) => Math.max(10, Math.min(maxH, prev)));
  }, [config.baysPerAisle, maxL, maxW, maxH]);

  const handleAddCustomBin = (e: React.FormEvent) => {
    e.preventDefault();
    const aisleSpacing = config.aisleSpacingM ?? 3.4;
    const baySpacing = config.baySpacingM ?? 1.45;
    const levelHeights = [0.05, 0.85, 1.55, 2.35, 3.15, 3.95];
    const zMeters =
      levelHeights[newLevel - 1] ?? Number(((newLevel - 1) * 0.82 + 0.05).toFixed(2));
    const binId = `A${newAisle}-B${newBay}-Z${newLevel}`;
    onAddBin({
      id: binId,
      aisle: newAisle,
      bay: newBay,
      level: newLevel,
      xMeters: Number(((newAisle - 1) * aisleSpacing).toFixed(2)),
      yMeters: Number(((newBay - 1) * baySpacing + 1.8).toFixed(2)),
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
    const newSku: SKUItem = {
      id: `sku-${Date.now()}`,
      skuCode: skuCode.trim() || 'CUSTOM',
      name: skuName.trim() || 'Custom Cargo',
      category: 'Designed',
      abcClass,
      dailyPicks: Math.max(1, dailyPicks),
      lengthCm: Math.max(10, Math.min(maxL, lengthCm)),
      widthCm: Math.max(10, Math.min(maxW, widthCm)),
      heightCm: Math.max(10, Math.min(maxH, heightCm)),
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
                <span className="text-[10px] text-slate-400">Aisles (X)</span>
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
                <span className="text-[10px] text-slate-400">Bays (Y)</span>
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
                <span className="text-[10px] text-slate-400">Levels (Z)</span>
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
                <span className="text-[10px] text-slate-400">Bin L (cm)</span>
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
                <span className="text-[10px] text-slate-400">Bin W (cm)</span>
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
                <span className="text-[10px] text-slate-400">Bin H (cm)</span>
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
                <span className="text-[10px] text-slate-500">Aisle</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newAisle}
                  onChange={(e) => setNewAisle(Number(e.target.value))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Bay</span>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={newBay}
                  onChange={(e) => setNewBay(Number(e.target.value))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Level Z</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={newLevel}
                  onChange={(e) => setNewLevel(Number(e.target.value))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Max kg</span>
                <input
                  type="number"
                  min={100}
                  max={2000}
                  value={newMaxWeight}
                  onChange={(e) => setNewMaxWeight(Number(e.target.value))}
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
          {/* 1-Click Quick Item Chips (No typing required) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="mb-1.5 text-[10px] font-semibold text-slate-400">
              Quick Add Item (1-Click · 클릭 한 번으로 물건 추가)
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
            className="grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-[11px]"
          >
            <input
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value)}
              placeholder="SKU Code"
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            />
            <input
              value={skuName}
              onChange={(e) => setSkuName(e.target.value)}
              placeholder="Cargo Name"
              className="col-span-2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            />
            <div>
              <span className="text-[10px] text-slate-500">ABC</span>
              <select
                value={abcClass}
                onChange={(e) => setAbcClass(e.target.value as ABCClass)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
              >
                <option value="A">Class A</option>
                <option value="B">Class B</option>
                <option value="C">Class C</option>
              </select>
            </div>
            <div>
              <span className="text-[10px] text-slate-500">Picks/d</span>
              <input
                type="number"
                value={dailyPicks}
                onChange={(e) => setDailyPicks(Number(e.target.value))}
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">Weight (kg)</span>
              <input
                type="number"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">L (≤{maxL})</span>
              <input
                type="number"
                max={maxL}
                value={lengthCm}
                onChange={(e) => setLengthCm(Number(e.target.value))}
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">W (≤{maxW})</span>
              <input
                type="number"
                max={maxW}
                value={widthCm}
                onChange={(e) => setWidthCm(Number(e.target.value))}
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">H (≤{maxH}) / Qty</span>
              <div className="flex gap-1">
                <input
                  type="number"
                  max={maxH}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-1/2 rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                />
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
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
              Fragile (upright only, block top stacking)
            </label>
            <button
              type="submit"
              className="col-span-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/90 py-1.5 font-semibold text-slate-950 hover:bg-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Cargo SKU
            </button>
          </form>

          {/* Pinned Cargo Summary */}
          {pinnedPlacements.length > 0 && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-2.5 text-[11px]">
              <div className="flex items-center justify-between font-semibold text-cyan-300">
                <span className="inline-flex items-center gap-1">
                  <Pin className="h-3 w-3" />
                  Manual Bin Pins ({pinnedPlacements.length})
                </span>
                <button
                  type="button"
                  onClick={onClearAllPins}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Clear All
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
                        {p.binId} ← {sku?.skuCode ?? p.skuId} ×{p.count}
                      </span>
                      <button
                        type="button"
                        onClick={() => onPinCargo(p.binId, p.skuId, -p.count)}
                        className="text-rose-400 hover:underline"
                      >
                        Unpin
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cargo List with Qty +/-, Pin to Bin, Delete */}
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {skus.map((sku) => (
              <div
                key={sku.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-[11px]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: sku.color }}
                    />
                    <span className="font-semibold text-white">
                      {sku.skuCode}
                    </span>
                    <span className="truncate text-slate-400">{sku.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {sku.lengthCm}×{sku.widthCm}×{sku.heightCm}cm ·{' '}
                    {sku.weightKg}kg · qty {sku.quantity}
                  </div>
                </div>
                <div className="ml-2 flex items-center gap-1">
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
                            ? { ...s, quantity: Math.min(50, s.quantity + 1) }
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
                      +Pin
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onChangeSkus(skus.filter((s) => s.id !== sku.id))}
                    className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400"
                    title="Delete SKU"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
