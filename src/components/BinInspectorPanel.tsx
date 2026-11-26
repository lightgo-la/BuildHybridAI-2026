import React, { useEffect, useState } from 'react';
import {
  Bot,
  Box,
  Check,
  Maximize2,
  PackagePlus,
  Pin,
  Plus,
  RotateCcw,
  Ruler,
  ShieldAlert,
  Sliders,
  Trash2,
} from 'lucide-react';
import type {
  CustomBoxPlacementInput,
  ShelfResizeScope,
} from '../hooks/useWarehouseTransforms';
import { type LangCode, t } from '../i18n/translations';
import type {
  ABCClass,
  BinAllocation,
  PickWaypoint,
  SKUItem,
  SelectedCargoBox,
} from '../types/warehouse';

interface BinInspectorPanelProps {
  selectedBin: BinAllocation | null;
  allAllocations?: BinAllocation[];
  selectedCargo?: SelectedCargoBox | null;
  pickRoute: PickWaypoint[];
  activeLayout: 'baseline_2d' | 'optimized_3d';
  accentColor: string;
  simpleMode: boolean;
  skus?: SKUItem[];
  onSelectBin?: (alloc: BinAllocation) => void;
  onSelectCargo?: (cargo: SelectedCargoBox | null) => void;
  onPinCargo?: (binId: string, skuId: string, delta: number) => void;
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
  onUpdateBoxDimensions?: (
    skuId: string,
    patch: {
      lengthCm?: number;
      widthCm?: number;
      heightCm?: number;
      weightKg?: number;
      name?: string;
      color?: string;
      fragile?: boolean;
    },
    binIdToAutoExpand?: string
  ) => void;
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
  onMoveSkuToLevel?: (
    fromBinId: string,
    skuId: string,
    targetLevel: number
  ) => void;
  onClearBinPins?: (binId: string) => void;
  onAddBinAbove?: (alloc: BinAllocation) => void;
  onAuditWithAi: (alloc: BinAllocation) => void;
  onDeleteBin: (binId: string) => void;
  lang?: LangCode;
}

const BOX_COLORS = [
  '#22d3ee',
  '#34d399',
  '#f59e0b',
  '#fb7185',
  '#a78bfa',
  '#38bdf8',
];

export const BinInspectorPanel: React.FC<BinInspectorPanelProps> = ({
  selectedBin,
  allAllocations = [],
  selectedCargo = null,
  pickRoute,
  activeLayout,
  accentColor,
  simpleMode: _simpleMode,
  skus = [],
  onSelectBin,
  onSelectCargo,
  onPinCargo,
  onSetCargoCountInBin,
  onSetBinTotalBoxQuota,
  onPlaceCustomBoxInBin,
  onUpdateBoxDimensions,
  onResizeSingleBin,
  onMoveSkuToLevel,
  onClearBinPins,
  onAddBinAbove,
  onAuditWithAi,
  onDeleteBin,
  lang = 'en',
}) => {

  const binL = selectedBin?.bin.binLengthCm ?? 120;
  const binW = selectedBin?.bin.binWidthCm ?? 90;
  const binH = selectedBin?.bin.binHeightCm ?? 70;

  const [boxName, setBoxName] = useState(
    'Custom Storage Box'
  );
  const [boxL, setBoxL] = useState(Math.min(40, Math.max(10, binL - 4)));
  const [boxW, setBoxW] = useState(Math.min(30, Math.max(10, binW - 4)));
  const [boxH, setBoxH] = useState(Math.min(24, Math.max(10, binH - 4)));
  const [boxKg, setBoxKg] = useState(5);
  const [boxQty, setBoxQty] = useState(1);
  const [boxColor, setBoxColor] = useState(BOX_COLORS[0]);
  const [boxFragile, setBoxFragile] = useState(false);
  const [boxAbc, setBoxAbc] = useState<ABCClass>('A');
  const [autoExpandBin, setAutoExpandBin] = useState(true);
  const [justAddedFlash, setJustAddedFlash] = useState(false);

  const [showBinResize, setShowBinResize] = useState(true);
  const [shelfResizeScope, setShelfResizeScope] =
    useState<ShelfResizeScope>('single');
  const [resizingSkuId, setResizingSkuId] = useState<string | null>(null);
  const [showAllExistingSkus, setShowAllExistingSkus] = useState(false);

  useEffect(() => {
    if (selectedCargo?.skuId) {
      setResizingSkuId(selectedCargo.skuId);
    }
  }, [selectedCargo?.skuId]);

  const clampNum = (val: string, fallback: number, min: number, max: number) => {
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.round(parsed)));
  };

  const clampFloat = (
    val: string,
    fallback: number,
    min: number,
    max: number
  ) => {
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Number(parsed.toFixed(1))));
  };

  if (!selectedBin) {
    const quickBins = allAllocations.slice(0, 8);
    return (
      <div className="space-y-3 text-slate-400">
        <div className="rounded-xl border border-cyan-500/40 bg-slate-950/80 p-3">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
            <Box className="h-4 w-4" />
            <span>
              {'Select a Shelf Bin to Configure & Place Boxes'}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
            {'Click any shelf bin in the 3D scene or choose a shelf below to configure custom box dimensions (L×W×H cm) and place them directly.'}
          </p>

          {onSelectBin && allAllocations.length > 0 && (
            <div className="mt-2.5 space-y-2">
              <select
                value=""
                onChange={(e) => {
                  const found = allAllocations.find(
                    (a) => a.bin.id === e.target.value
                  );
                  if (found) onSelectBin(found);
                }}
                className="w-full rounded-lg border border-cyan-500/40 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white"
              >
                <option value="">
                  {`Choose a shelf bin (${allAllocations.length} bins)...`}
                </option>
                {allAllocations.map((a) => (
                  <option key={a.bin.id} value={a.bin.id}>
                    {a.bin.id} · Level Z{a.bin.level} ({a.bin.binLengthCm}×
                    {a.bin.binWidthCm}×{a.bin.binHeightCm}cm · Fill{' '}
                    {a.cubicUtilizationPct.toFixed(0)}%)
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-1.5">
                {quickBins.map((a) => (
                  <button
                    key={a.bin.id}
                    type="button"
                    onClick={() => onSelectBin(a)}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-left text-[10px] text-slate-200 hover:border-cyan-400 hover:text-white"
                  >
                    <span className="font-mono font-bold text-cyan-300">
                      {a.bin.id}
                    </span>
                    <span className="text-slate-400">
                      {a.bin.binLengthCm}×{a.bin.binWidthCm}×{a.bin.binHeightCm}cm
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px]">
          <div className="font-semibold text-slate-200">
            {t(lang, 'inspectorTopWave')} (
            {activeLayout === 'optimized_3d' ? '3D' : '2D'})
          </div>
          {pickRoute.map((wp, i) => (
            <div
              key={`${wp.binId}-${i}`}
              className="flex items-center justify-between text-slate-400"
            >
              <span>
                #{i + 1} {wp.binId} ({wp.skuCode})
              </span>
              <span className="text-amber-300">{wp.stepTimeSec}s</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const singleBoxVolCm3 = boxL * boxW * boxH;
  const totalAddVolCm3 = singleBoxVolCm3 * boxQty;
  const singleBoxVolPct =
    selectedBin.totalVolumeCm3 > 0
      ? (singleBoxVolCm3 / selectedBin.totalVolumeCm3) * 100
      : 0;
  const projectedFillPct =
    selectedBin.totalVolumeCm3 > 0
      ? ((selectedBin.usedVolumeCm3 + totalAddVolCm3) /
          selectedBin.totalVolumeCm3) *
        100
      : 0;
  const fitOrient1 =
    Math.floor(binL / Math.max(1, boxL)) *
    Math.floor(binW / Math.max(1, boxW)) *
    Math.floor(binH / Math.max(1, boxH));
  const fitOrient2 =
    Math.floor(binL / Math.max(1, boxW)) *
    Math.floor(binW / Math.max(1, boxL)) *
    Math.floor(binH / Math.max(1, boxH));
  const maxBoxesPerEmptyBin = Math.max(fitOrient1, fitOrient2);
  const exceedsBinBounds = boxL > binL || boxW > binW || boxH > binH;

  const handleSubmitCustomBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onPlaceCustomBoxInBin) return;
    onPlaceCustomBoxInBin({
      binId: selectedBin.bin.id,
      name: boxName.trim() || (('Custom Box')),
      skuCode: `BOX-${boxL}x${boxW}x${boxH}`,
      lengthCm: boxL,
      widthCm: boxW,
      heightCm: boxH,
      weightKg: boxKg,
      quantity: boxQty,
      abcClass: boxAbc,
      fragile: boxFragile,
      color: boxColor,
      autoExpandBin,
    });
    setBoxColor(
      BOX_COLORS[(BOX_COLORS.indexOf(boxColor) + 1) % BOX_COLORS.length]
    );
    setJustAddedFlash(true);
    window.setTimeout(() => setJustAddedFlash(false), 1200);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-white">
              {`Bin ${selectedBin.bin.id}`}
            </div>
            {selectedBin.bin.isGoldenZone && (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                {'Golden Zone'}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            {`Aisle ${selectedBin.bin.aisle} · Bay ${selectedBin.bin.bay} · Level Z${selectedBin.bin.level} (${selectedBin.bin.zMeters}m)`}
          </div>
        </div>

        {onSelectBin && allAllocations.length > 1 && (
          <select
            value={selectedBin.bin.id}
            onChange={(e) => {
              const found = allAllocations.find(
                (a) => a.bin.id === e.target.value
              );
              if (found) onSelectBin(found);
            }}
            className="max-w-[125px] rounded-lg border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] font-semibold text-cyan-300"
            title={'Switch shelf bin'}
          >
            {allAllocations.map((a) => (
              <option key={a.bin.id} value={a.bin.id}>
                {a.bin.id} ({a.boxes.length} boxes)
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedBin.safetyViolation && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/50 p-2 text-[11px] text-rose-200">
          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
          {`NIOSH / Rack Hazard: Heavy SKU placed on upper rack Z${selectedBin.bin.level}.`}
        </div>
      )}

      <div className="space-y-2 rounded-lg bg-slate-950 p-2.5 text-[11px]">
        <div>
          <div className="flex justify-between text-slate-400">
            <span>{'3D Cubic Fill'}</span>
            <span className="font-bold text-cyan-300">
              {selectedBin.cubicUtilizationPct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400"
              style={{
                width: `${Math.min(100, selectedBin.cubicUtilizationPct)}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>
              {'Shelf:'}{' '}
              <strong className="text-slate-200">
                {binL}×{binW}×{binH} cm
              </strong>{' '}
              · {'Void'}{' '}
              {(100 - selectedBin.cubicUtilizationPct).toFixed(1)}%
            </span>
            {onResizeSingleBin && (
              <button
                type="button"
                onClick={() => setShowBinResize((v) => !v)}
                className="inline-flex items-center gap-0.5 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300 hover:border-cyan-400"
              >
                <Sliders className="h-2.5 w-2.5" />
                {showBinResize
                    ? 'Close'
                    : 'Resize Shelf'}
              </button>
            )}
          </div>
        </div>

        {showBinResize && onResizeSingleBin && (
          <div className="space-y-2 rounded-lg border border-cyan-500/35 bg-slate-900/95 p-2.5 text-[10px]">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="font-bold text-cyan-300">
                {`Shelf Size (${binL}×${binW}×${binH}cm)`}
              </span>
              <div className="flex overflow-hidden rounded border border-slate-700 bg-slate-950 text-[9px]">
                {(
                  [
                    ['single', ('This Bin')],
                    ['column', ('This Column')],
                    ['all', ('All Shelves')],
                  ] as const
                ).map(([sc, label]) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setShelfResizeScope(sc)}
                    className={`px-1.5 py-0.5 font-semibold transition ${
                      shelfResizeScope === sc
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 text-[9px]">
              {[
                { label: 'Slim 80×45×40', l: 80, w: 45, h: 40 },
                { label: 'Std 100×60×55', l: 100, w: 60, h: 55 },
                { label: 'Pallet 120×90×70', l: 120, w: 90, h: 70 },
                { label: 'XL 150×110×85', l: 150, w: 110, h: 85 },
                {
                  label: 'Scale -10%',
                  l: Math.max(30, Math.round(binL * 0.9)),
                  w: Math.max(25, Math.round(binW * 0.9)),
                  h: Math.max(20, Math.round(binH * 0.9)),
                },
                {
                  label: 'Scale +10%',
                  l: Math.min(280, Math.round(binL * 1.1)),
                  w: Math.min(260, Math.round(binW * 1.1)),
                  h: Math.min(220, Math.round(binH * 1.1)),
                },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() =>
                    onResizeSingleBin(
                      selectedBin.bin.id,
                      {
                        binLengthCm: p.l,
                        binWidthCm: p.w,
                        binHeightCm: p.h,
                      },
                      shelfResizeScope
                    )
                  }
                  className="truncate rounded border border-slate-700 bg-slate-950 px-1.5 py-1 text-left font-medium text-slate-200 hover:border-cyan-400 hover:text-cyan-200"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <div>
                <span className="text-slate-400">
                  {'L(cm)'}
                </span>
                <input
                  type="number"
                  min={20}
                  max={300}
                  value={binL}
                  onChange={(e) =>
                    onResizeSingleBin(
                      selectedBin.bin.id,
                      {
                        binLengthCm: clampNum(e.target.value, binL, 20, 300),
                      },
                      shelfResizeScope
                    )
                  }
                  className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-1 font-mono text-white"
                />
              </div>
              <div>
                <span className="text-slate-400">
                  {'W(cm)'}
                </span>
                <input
                  type="number"
                  min={20}
                  max={300}
                  value={binW}
                  onChange={(e) =>
                    onResizeSingleBin(
                      selectedBin.bin.id,
                      {
                        binWidthCm: clampNum(e.target.value, binW, 20, 300),
                      },
                      shelfResizeScope
                    )
                  }
                  className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-1 font-mono text-white"
                />
              </div>
              <div>
                <span className="text-slate-400">
                  {'H(cm)'}
                </span>
                <input
                  type="number"
                  min={15}
                  max={250}
                  value={binH}
                  onChange={(e) =>
                    onResizeSingleBin(
                      selectedBin.bin.id,
                      {
                        binHeightCm: clampNum(e.target.value, binH, 15, 250),
                      },
                      shelfResizeScope
                    )
                  }
                  className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-1 font-mono text-white"
                />
              </div>
              <div>
                <span className="text-slate-400">
                  {'Max kg'}
                </span>
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={selectedBin.bin.maxWeightKg}
                  onChange={(e) =>
                    onResizeSingleBin(
                      selectedBin.bin.id,
                      {
                        maxWeightKg: clampNum(
                          e.target.value,
                          selectedBin.bin.maxWeightKg,
                          10,
                          5000
                        ),
                      },
                      shelfResizeScope
                    )
                  }
                  className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-1 font-mono text-white"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between text-slate-400">
            <span>{'Rack Load'}</span>
            <span className="font-bold text-white">
              {selectedBin.currentWeightKg.toFixed(1)} /{' '}
              {selectedBin.bin.maxWeightKg} kg
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${
                selectedBin.currentWeightKg > selectedBin.bin.maxWeightKg * 0.85
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (selectedBin.currentWeightKg / selectedBin.bin.maxWeightKg) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {onPlaceCustomBoxInBin && (
        <form
          onSubmit={handleSubmitCustomBox}
          className="space-y-2.5 rounded-xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 to-slate-950/90 p-3 text-[11px] shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-300">
              <Ruler className="h-3.5 w-3.5" />
              {`Set Box Size & Place in [${selectedBin.bin.id}]`}
            </span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              {boxL}×{boxW}×{boxH}cm
            </span>
          </div>

          <div>
            <div className="mb-1 text-[10px] text-slate-400">
              {'Quick Box Size Presets:'}
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {[
                {
                  label: 'Small (25×20×15)',
                  l: 25,
                  w: 20,
                  h: 15,
                  kg: 2,
                  name: 'Small Carton',
                },
                {
                  label: 'Medium (40×30×24)',
                  l: 40,
                  w: 30,
                  h: 24,
                  kg: 5,
                  name: 'Medium Box',
                },
                {
                  label: 'Large (60×40×35)',
                  l: 60,
                  w: 40,
                  h: 35,
                  kg: 10,
                  name: 'Large Crate',
                },
                {
                  label: 'Tote (50×35×28)',
                  l: 50,
                  w: 35,
                  h: 28,
                  kg: 6.5,
                  name: 'Storage Tote',
                },
                {
                  label: 'Half Shelf Fit',
                  l: Math.max(12, Math.floor((binL - 4) / 2)),
                  w: Math.max(12, Math.floor(binW - 6)),
                  h: Math.max(12, Math.floor(binH * 0.75)),
                  kg: 7,
                  name: 'Half-Shelf Box',
                },
                {
                  label: 'Full Shelf Fit',
                  l: Math.max(15, binL - 4),
                  w: Math.max(15, binW - 4),
                  h: Math.max(15, binH - 4),
                  kg: 12,
                  name: 'Full-Shelf Box',
                },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setBoxL(preset.l);
                    setBoxW(preset.w);
                    setBoxH(preset.h);
                    setBoxKg(preset.kg);
                    setBoxName(preset.name);
                  }}
                  className="truncate rounded border border-slate-700 bg-slate-900/90 px-1.5 py-1 text-left font-medium text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-cyan-300">
                  {'Length L'}
                </span>
                <span className="text-[9px] text-slate-500">
                  /{binL}cm
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="number"
                  min={5}
                  max={280}
                  value={boxL}
                  onChange={(e) =>
                    setBoxL(clampNum(e.target.value, boxL, 5, 280))
                  }
                  className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-center font-mono text-xs font-bold text-white"
                />
                <span className="text-[10px] text-slate-400">cm</span>
              </div>
              <input
                type="range"
                min={8}
                max={Math.max(binL, 120)}
                value={Math.min(boxL, Math.max(binL, 120))}
                onChange={(e) => setBoxL(Number(e.target.value))}
                className="mt-1 h-1 w-full cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-emerald-300">
                  {'Width W'}
                </span>
                <span className="text-[9px] text-slate-500">
                  /{binW}cm
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="number"
                  min={5}
                  max={280}
                  value={boxW}
                  onChange={(e) =>
                    setBoxW(clampNum(e.target.value, boxW, 5, 280))
                  }
                  className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-center font-mono text-xs font-bold text-white"
                />
                <span className="text-[10px] text-slate-400">cm</span>
              </div>
              <input
                type="range"
                min={8}
                max={Math.max(binW, 100)}
                value={Math.min(boxW, Math.max(binW, 100))}
                onChange={(e) => setBoxW(Number(e.target.value))}
                className="mt-1 h-1 w-full cursor-pointer accent-emerald-400"
              />
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-amber-300">
                  {'Height H'}
                </span>
                <span className="text-[9px] text-slate-500">
                  /{binH}cm
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={boxH}
                  onChange={(e) =>
                    setBoxH(clampNum(e.target.value, boxH, 5, 240))
                  }
                  className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-center font-mono text-xs font-bold text-white"
                />
                <span className="text-[10px] text-slate-400">cm</span>
              </div>
              <input
                type="range"
                min={8}
                max={Math.max(binH, 90)}
                value={Math.min(boxH, Math.max(binH, 90))}
                onChange={(e) => setBoxH(Number(e.target.value))}
                className="mt-1 h-1 w-full cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-1.5">
            <div className="col-span-5">
              <span className="text-[10px] text-slate-400">
                {'Box Label'}
              </span>
              <input
                type="text"
                value={boxName}
                onChange={(e) => setBoxName(e.target.value)}
                placeholder={'Custom Box'}
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-white"
              />
            </div>
            <div className="col-span-3">
              <span className="text-[10px] text-slate-400">
                {'Weight(kg)'}
              </span>
              <input
                type="number"
                step="0.5"
                min={0.1}
                max={500}
                value={boxKg}
                onChange={(e) =>
                  setBoxKg(clampFloat(e.target.value, boxKg, 0.1, 500))
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[11px] text-white"
              />
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-400">
                {'Qty'}
              </span>
              <input
                type="number"
                min={1}
                max={30}
                value={boxQty}
                onChange={(e) =>
                  setBoxQty(clampNum(e.target.value, boxQty, 1, 30))
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-center font-bold text-emerald-300"
              />
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-400">
                {'ABC'}
              </span>
              <select
                value={boxAbc}
                onChange={(e) => setBoxAbc(e.target.value as ABCClass)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-1 py-1 text-[11px] text-white"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">{'Color:'}</span>
              {BOX_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBoxColor(c)}
                  className={`h-4 w-4 rounded-full border ${
                    boxColor === c
                      ? 'scale-110 border-white ring-1 ring-white'
                      : 'border-slate-700 opacity-75'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={boxColor}
                onChange={(e) => setBoxColor(e.target.value)}
                className="h-4 w-5 cursor-pointer border-0 bg-transparent"
              />
            </div>
            <label className="inline-flex cursor-pointer items-center gap-1 text-slate-300">
              <input
                type="checkbox"
                checked={boxFragile}
                onChange={(e) => setBoxFragile(e.target.checked)}
                className="accent-amber-400"
              />
              {'Fragile'}
            </label>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 text-[10px]">
            <div className="flex items-center justify-between text-slate-300">
              <span>
                {'1 Box Volume Share:'}{' '}
                <strong className="text-cyan-300">
                  {singleBoxVolPct.toFixed(1)}%
                </strong>
              </span>
              <span>
                {'Max in Empty Bin:'}{' '}
                <strong className="text-emerald-300">
                  {maxBoxesPerEmptyBin > 0
                    ? `${maxBoxesPerEmptyBin}${' pcs'}`
                    : ('Needs Bin Expand')}
                </strong>
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-slate-400">
              <span>
                {`Ratio: L ${Math.round((boxL / binL) * 100)}% · W ${Math.round((boxW / binW) * 100)}% · H ${Math.round((boxH / binH) * 100)}%`}
              </span>
              <span
                className={
                  projectedFillPct > 100 ? 'text-amber-300' : 'text-slate-400'
                }
              >
                {`Est. Fill: ${Math.min(100, projectedFillPct).toFixed(1)}%`}
              </span>
            </div>

            {exceedsBinBounds && (
              <label className="mt-1 flex cursor-pointer items-center gap-1.5 rounded bg-amber-500/15 px-1.5 py-1 text-[10px] text-amber-200">
                <input
                  type="checkbox"
                  checked={autoExpandBin}
                  onChange={(e) => setAutoExpandBin(e.target.checked)}
                  className="accent-emerald-400"
                />
                <span>
                  {`Box exceeds shelf (${binL}×${binW}×${binH}cm). Auto-expand shelf to fit`}
                </span>
              </label>
            )}
          </div>

          <button
            type="submit"
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold shadow transition ${
              justAddedFlash
                ? 'bg-cyan-400 text-slate-950'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {justAddedFlash ? (
              <>
                <Check className="h-4 w-4" />
                {`Placed into [${selectedBin.bin.id}]!`}
              </>
            ) : (
              <>
                <PackagePlus className="h-4 w-4" />
                {`Place ${boxQty}× (${boxL}×${boxW}×${boxH}cm) Box in [${selectedBin.bin.id}]`}
              </>
            )}
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <button
          type="button"
          onClick={() => onAuditWithAi(selectedBin)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cyan-500/20 px-2 py-1.5 font-semibold text-cyan-300 hover:bg-cyan-500/30"
        >
          <Bot className="h-3.5 w-3.5" />
          {t(lang, 'inspectorAiAudit')}
        </button>
        {onAddBinAbove && (
          <button
            type="button"
            onClick={() => onAddBinAbove(selectedBin)}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 font-semibold text-emerald-300 hover:bg-emerald-500/25"
            title={'Add level above'}
          >
            <Plus className="h-3.5 w-3.5" />
            {'+1 Level'}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDeleteBin(selectedBin.bin.id)}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1.5 font-semibold text-rose-300 hover:bg-rose-500/25"
          title="Delete this storage bin"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t(lang, 'inspectorDeleteBin')}
        </button>
      </div>

      {onPinCargo && skus.length > 0 && (
        <div className="space-y-2 rounded-xl border border-cyan-500/40 bg-slate-950/85 p-2.5 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-cyan-300">
              <Pin className="h-3.5 w-3.5" />
              {`Set Exact Box Count & SKU Qty in [${selectedBin.bin.id}]`}
            </span>
            <div className="flex items-center gap-2">
              {skus.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllExistingSkus((v) => !v)}
                  className="text-[10px] font-semibold text-cyan-300 hover:underline"
                >
                  {showAllExistingSkus
                    ? ('Less')
                    : (`All(${skus.length})`)}
                </button>
              )}
              {onClearBinPins && (
                <button
                  type="button"
                  onClick={() => onClearBinPins(selectedBin.bin.id)}
                  className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-white"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  {'Clear Pins'}
                </button>
              )}
            </div>
          </div>

          {onSetBinTotalBoxQuota && (
            <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-1.5 text-[10px]">
              <span className="font-semibold text-slate-200">
                {'Shelf Total Box Count:'}
              </span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 4, 6, 8, 12].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() =>
                      onSetBinTotalBoxQuota(
                        selectedBin.bin.id,
                        q,
                        skus[0]?.id
                      )
                    }
                    className={`rounded border px-1.5 py-0.5 font-mono font-bold transition ${
                      selectedBin.boxes.length === q
                        ? 'border-cyan-400 bg-cyan-500 text-slate-950'
                        : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-400'
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
                  onChange={(e) =>
                    onSetBinTotalBoxQuota(
                      selectedBin.bin.id,
                      clampNum(e.target.value, selectedBin.boxes.length, 0, 100),
                      skus[0]?.id
                    )
                  }
                  className="w-12 rounded border border-cyan-500/50 bg-slate-950 px-1 py-0.5 text-center font-mono text-xs font-bold text-amber-300"
                  title={
                    'Enter exact total box count for this shelf bin'
                  }
                />
                <span className="text-slate-400">{'pcs'}</span>
              </div>
            </div>
          )}

          <div className="max-h-56 space-y-1 overflow-y-auto pr-0.5">
            {(showAllExistingSkus ? skus : skus.slice(0, 6)).map((sku) => {
              const countInBin = selectedBin.boxes.filter(
                (b) => b.skuId === sku.id
              ).length;
              return (
                <div
                  key={sku.id}
                  className={`flex items-center justify-between gap-1.5 rounded-lg border px-2 py-1 text-[10px] transition ${
                    countInBin > 0
                      ? 'border-emerald-500/50 bg-emerald-950/25'
                      : 'border-slate-800 bg-slate-900/90'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: sku.color }}
                      />
                      <span
                        className="truncate font-semibold text-white"
                        title={`${sku.name} (${sku.lengthCm}×${sku.widthCm}×${sku.heightCm}cm, ${sku.weightKg}kg)`}
                      >
                        {sku.name.split(' (')[0]}
                      </span>
                    </div>
                    <span className="pl-3.5 font-mono text-[9px] text-slate-400">
                      {sku.lengthCm}×{sku.widthCm}×{sku.heightCm}cm · {sku.weightKg}kg
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onSetCargoCountInBin
                          ? onSetCargoCountInBin(
                              selectedBin.bin.id,
                              sku.id,
                              Math.max(0, countInBin - 1)
                            )
                          : onPinCargo(selectedBin.bin.id, sku.id, -1)
                      }
                      disabled={countInBin <= 0}
                      className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-bold text-rose-300 hover:border-rose-400 disabled:opacity-35"
                      title={'Remove 1'}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={countInBin}
                      onChange={(e) => {
                        const nextCnt = clampNum(
                          e.target.value,
                          countInBin,
                          0,
                          100
                        );
                        if (onSetCargoCountInBin) {
                          onSetCargoCountInBin(
                            selectedBin.bin.id,
                            sku.id,
                            nextCnt
                          );
                        } else {
                          onPinCargo(
                            selectedBin.bin.id,
                            sku.id,
                            nextCnt - countInBin
                          );
                        }
                      }}
                      className="w-11 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-mono text-[11px] font-bold text-amber-300 focus:border-cyan-400 focus:outline-none"
                      title={
                        'Enter exact quantity of this SKU in this shelf bin'
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onSetCargoCountInBin
                          ? onSetCargoCountInBin(
                              selectedBin.bin.id,
                              sku.id,
                              countInBin + 1
                            )
                          : onPinCargo(selectedBin.bin.id, sku.id, 1)
                      }
                      className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-bold text-emerald-300 hover:border-emerald-400"
                      title={'Add 1'}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-300">
          <span>
            {'3D Packed Boxes'} (
            {selectedBin.boxes.length})
          </span>
          <span className="text-[10px] font-normal text-amber-300">
            {'Click to move or resize in 3D'}
          </span>
        </div>
        {selectedBin.boxes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 p-3 text-center text-slate-500">
            {'Empty shelf bin. Configure a box size above to place it here!'}
          </div>
        ) : (
          <div className="space-y-1.5">
            {selectedBin.boxes.map((box, idx) => {
              const isSelectedBox =
                selectedCargo?.binId === selectedBin.bin.id &&
                selectedCargo?.boxIndex === idx;
              const skuObj = skus.find((s) => s.id === box.skuId);
              const isResizing = resizingSkuId === box.skuId;

              return (
                <div
                  key={`${box.skuId}-${idx}`}
                  onClick={() =>
                    onSelectCargo?.(
                      isSelectedBox
                        ? null
                        : {
                            binId: selectedBin.bin.id,
                            boxIndex: idx,
                            skuId: box.skuId,
                            skuCode: box.skuCode,
                            name: box.name,
                            weightKg: box.weightKg,
                            lengthCm: box.lengthCm,
                            widthCm: box.widthCm,
                            heightCm: box.heightCm,
                            color: box.color,
                          }
                    )
                  }
                  className={`cursor-pointer rounded-lg border p-2 text-[11px] transition ${
                    isSelectedBox
                      ? 'border-amber-400 bg-amber-950/35 ring-1 ring-amber-400/50'
                      : 'border-slate-800 bg-slate-950/70 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="inline-flex items-center gap-1.5 truncate font-semibold text-white">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: box.color }}
                      />
                      {box.name.split(' (')[0]}{' '}
                      <span className="font-mono text-[10px] text-slate-400">
                        [{box.skuCode}·{box.abcClass}]
                      </span>
                    </span>
                    <div className="flex shrink-0 gap-1">
                      {onUpdateBoxDimensions && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResizingSkuId(isResizing ? null : box.skuId);
                          }}
                          className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[9px] font-semibold ${
                            isResizing
                              ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                              : 'border-slate-700 bg-slate-900 text-cyan-300 hover:border-cyan-400'
                          }`}
                          title={
                            'Resize this box (L×W×H cm)'
                          }
                        >
                          <Maximize2 className="h-2.5 w-2.5" />
                          {isResizing
                              ? 'Done'
                              : 'Resize'}
                        </button>
                      )}
                      {box.fragile && (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-300">
                          {'Fragile'}
                        </span>
                      )}
                      {box.rotated && (
                        <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] text-cyan-300">
                          {'Rotated'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-slate-400">
                    <span className="font-mono text-slate-300">
                      {box.lengthCm}×{box.widthCm}×{box.heightCm} cm ·{' '}
                      {box.weightKg}kg · @({box.xCm},{box.yCm},{box.zCm})
                    </span>
                    <div
                      className="flex shrink-0 gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onMoveSkuToLevel && selectedBin.bin.level !== 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onMoveSkuToLevel(selectedBin.bin.id, box.skuId, 1)
                          }
                          className="rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
                          title={
                            'Move to Z1 floor'
                          }
                        >
                          {'→Z1'}
                        </button>
                      )}
                      {onMoveSkuToLevel && selectedBin.bin.level !== 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            onMoveSkuToLevel(selectedBin.bin.id, box.skuId, 2)
                          }
                          className="rounded border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300 hover:bg-cyan-500/25"
                          title={
                            'Move to Golden Zone Z2'
                          }
                        >
                          {'→Z2'}
                        </button>
                      )}
                      {onPinCargo && (
                        <button
                          type="button"
                          onClick={() =>
                            onPinCargo(selectedBin.bin.id, box.skuId, 1)
                          }
                          className="rounded border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300 hover:bg-cyan-500/25"
                          title={'Add 1 more'}
                        >
                          +1
                        </button>
                      )}
                      {onPinCargo && (
                        <button
                          type="button"
                          onClick={() =>
                            onPinCargo(selectedBin.bin.id, box.skuId, -1)
                          }
                          className="rounded border border-rose-500/40 bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-rose-300 hover:bg-rose-500/25"
                          title={'Remove 1 unit'}
                        >
                          -1
                        </button>
                      )}
                    </div>
                  </div>

                  {isResizing && onUpdateBoxDimensions && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 space-y-1.5 rounded-lg border border-emerald-500/40 bg-slate-900/95 p-2 text-[10px]"
                    >
                      <div className="flex items-center justify-between font-semibold text-emerald-300">
                        <span>
                          {'Live Box Size Adjustment (cm)'}
                        </span>
                        <span className="font-mono text-white">
                          {skuObj?.lengthCm ?? box.lengthCm}×
                          {skuObj?.widthCm ?? box.widthCm}×
                          {skuObj?.heightCm ?? box.heightCm} cm
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <div>
                          <span className="text-slate-400">
                            {'L(cm)'}
                          </span>
                          <input
                            type="number"
                            min={5}
                            max={280}
                            value={skuObj?.lengthCm ?? box.lengthCm}
                            onChange={(e) =>
                              onUpdateBoxDimensions(
                                box.skuId,
                                {
                                  lengthCm: clampNum(
                                    e.target.value,
                                    skuObj?.lengthCm ?? box.lengthCm,
                                    5,
                                    280
                                  ),
                                },
                                selectedBin.bin.id
                              )
                            }
                            className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-1 font-mono text-white"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400">
                            {'W(cm)'}
                          </span>
                          <input
                            type="number"
                            min={5}
                            max={280}
                            value={skuObj?.widthCm ?? box.widthCm}
                            onChange={(e) =>
                              onUpdateBoxDimensions(
                                box.skuId,
                                {
                                  widthCm: clampNum(
                                    e.target.value,
                                    skuObj?.widthCm ?? box.widthCm,
                                    5,
                                    280
                                  ),
                                },
                                selectedBin.bin.id
                              )
                            }
                            className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-1 font-mono text-white"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400">
                            {'H(cm)'}
                          </span>
                          <input
                            type="number"
                            min={5}
                            max={240}
                            value={skuObj?.heightCm ?? box.heightCm}
                            onChange={(e) =>
                              onUpdateBoxDimensions(
                                box.skuId,
                                {
                                  heightCm: clampNum(
                                    e.target.value,
                                    skuObj?.heightCm ?? box.heightCm,
                                    5,
                                    240
                                  ),
                                },
                                selectedBin.bin.id
                              )
                            }
                            className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-1 font-mono text-white"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400">
                            {'kg'}
                          </span>
                          <input
                            type="number"
                            step="0.5"
                            min={0.1}
                            max={500}
                            value={skuObj?.weightKg ?? box.weightKg}
                            onChange={(e) =>
                              onUpdateBoxDimensions(
                                box.skuId,
                                {
                                  weightKg: clampFloat(
                                    e.target.value,
                                    skuObj?.weightKg ?? box.weightKg,
                                    0.1,
                                    500
                                  ),
                                },
                                selectedBin.bin.id
                              )
                            }
                            className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-1 font-mono text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
