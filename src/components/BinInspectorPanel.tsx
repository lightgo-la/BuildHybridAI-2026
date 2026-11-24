import React from 'react';
import { Bot, Pin, Plus, RotateCcw, ShieldAlert, Trash2 } from 'lucide-react';
import { type LangCode, t } from '../i18n/translations';
import type { BinAllocation, PickWaypoint, SKUItem } from '../types/warehouse';

interface BinInspectorPanelProps {
  selectedBin: BinAllocation | null;
  pickRoute: PickWaypoint[];
  activeLayout: 'baseline_2d' | 'optimized_3d';
  accentColor: string;
  simpleMode: boolean;
  skus?: SKUItem[];
  onPinCargo?: (binId: string, skuId: string, delta: number) => void;
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

export const BinInspectorPanel: React.FC<BinInspectorPanelProps> = ({
  selectedBin,
  pickRoute,
  activeLayout,
  accentColor,
  simpleMode,
  skus = [],
  onPinCargo,
  onMoveSkuToLevel,
  onClearBinPins,
  onAddBinAbove,
  onAuditWithAi,
  onDeleteBin,
  lang = 'ko',
}) => {
  const isKo = lang === 'ko' || simpleMode;

  if (!selectedBin) {
    return (
      <div className="space-y-3 text-slate-400">
        <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/50 p-3">
          <p className="font-medium text-slate-200">
            {isKo
              ? t(lang, 'inspectorClickHint')
              : 'Left-click to Inspect · Right-click for Actions'}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed">
            {isKo
              ? t(lang, 'inspectorClickDesc')
              : 'Click any rack bin to inspect 3D Bin Packing coordinates, or right-click anywhere in 3D space to add/delete bins, pin cargo, or export 2D CAD.'}
          </p>
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

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold text-white">
            {isKo ? `선반 ${selectedBin.bin.id}` : `Bin ${selectedBin.bin.id}`}
          </div>
          <div className="text-[11px] text-slate-400">
            {isKo
              ? `${selectedBin.bin.aisle}열 · ${selectedBin.bin.bay}번 칸 · Z${selectedBin.bin.level}층 (${selectedBin.bin.zMeters}m)`
              : `Aisle ${selectedBin.bin.aisle} · Bay ${selectedBin.bin.bay} · Level Z${selectedBin.bin.level} (${selectedBin.bin.zMeters}m)`}
          </div>
        </div>
        {selectedBin.bin.isGoldenZone && (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            {isKo ? '허리높이 골든존' : 'Golden Zone'}
          </span>
        )}
      </div>

      {selectedBin.safetyViolation && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/50 p-2 text-[11px] text-rose-200">
          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
          {isKo
            ? `무거운 물건이 높은 Z${selectedBin.bin.level}층에 있습니다. 안전을 위해 아래층(Z1~Z2)으로 옮기세요.`
            : `NIOSH / Rack Hazard: Heavy SKU placed on upper rack Z${selectedBin.bin.level}.`}
        </div>
      )}

      <div className="space-y-2 rounded-lg bg-slate-950 p-2.5 text-[11px]">
        <div>
          <div className="flex justify-between text-slate-400">
            <span>{isKo ? '공간 채움률' : '3D Cubic Fill'}</span>
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
          <div className="mt-0.5 text-[10px] text-slate-500">
            {selectedBin.bin.binLengthCm}×{selectedBin.bin.binWidthCm}×
            {selectedBin.bin.binHeightCm} cm · {isKo ? '남은 여유 공간' : 'Void'}{' '}
            {(100 - selectedBin.cubicUtilizationPct).toFixed(1)}%
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-400">
            <span>{isKo ? '현재 무게 / 허용 무게' : 'Rack Load'}</span>
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
          <div className="mt-0.5 text-[10px] text-slate-500">
            {selectedBin.dailyPickLoad.toFixed(0)}{' '}
            {isKo ? '회/일 꺼냄' : 'picks/day'}
          </div>
        </div>
      </div>

      {/* 1-Click Bin Actions */}
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
            title={isKo ? '이 칸 위에 1단 선반 추가' : 'Add level above'}
          >
            <Plus className="h-3.5 w-3.5" />
            {isKo ? '+1단 추가' : '+1 Level'}
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

      {/* Direct 1-Click Cargo Placement into Selected Bin */}
      {onPinCargo && skus.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-2.5 text-[11px]">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 font-semibold text-cyan-300">
              <Pin className="h-3 w-3" />
              {isKo
                ? '이 선반 칸에 물건 바로 넣기 (+1)'
                : 'Quick Place Item Here (+1)'}
            </span>
            {onClearBinPins && (
              <button
                type="button"
                onClick={() => onClearBinPins(selectedBin.bin.id)}
                className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-white"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                {isKo ? '고정 초기화' : 'Clear Pins'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {skus.slice(0, 6).map((sku) => (
              <button
                key={sku.id}
                type="button"
                onClick={() => onPinCargo(selectedBin.bin.id, sku.id, 1)}
                className="flex items-center gap-1.5 truncate rounded-md border border-slate-800 bg-slate-900/90 px-2 py-1 text-left text-[10px] text-slate-200 hover:border-cyan-400 hover:text-white"
                title={`${sku.name} (${sku.lengthCm}×${sku.widthCm}×${sku.heightCm}cm, ${sku.weightKg}kg)`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: sku.color }}
                />
                <span className="truncate font-medium">
                  + {sku.name.split(' (')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1.5 text-[11px] font-semibold text-slate-300">
          {isKo ? '현재 들어있는 물건' : '3D Packed Units'} (
          {selectedBin.boxes.length})
        </div>
        {selectedBin.boxes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 p-3 text-center text-slate-500">
            {isKo ? '비어 있는 여유 칸입니다' : 'Empty Reserve Location'}
          </div>
        ) : (
          <div className="space-y-1.5">
            {selectedBin.boxes.map((box, idx) => (
              <div
                key={`${box.skuId}-${idx}`}
                className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-[11px]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate font-semibold text-white">
                    {box.name.split(' (')[0]}{' '}
                    <span className="font-mono text-[10px] text-slate-400">
                      [{box.skuCode}·{box.abcClass}]
                    </span>
                  </span>
                  <div className="flex shrink-0 gap-1">
                    {box.fragile && (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-300">
                        {isKo ? '파손주의' : 'Fragile'}
                      </span>
                    )}
                    {box.rotated && (
                      <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] text-cyan-300">
                        {isKo ? '90° 회전' : '3D Rotated'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-1 text-[10px] text-slate-400">
                  <span>
                    {box.lengthCm}×{box.widthCm}×{box.heightCm} cm ·{' '}
                    {box.weightKg}kg · {isKo ? '위치' : '@'}({box.xCm},
                    {box.yCm},{box.zCm})
                  </span>
                  {onMoveSkuToLevel && (
                    <div className="flex shrink-0 gap-1">
                      {selectedBin.bin.level !== 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onMoveSkuToLevel(selectedBin.bin.id, box.skuId, 1)
                          }
                          className="rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
                          title={
                            isKo ? '1단 바닥(Z1)으로 이동' : 'Move to Z1 floor'
                          }
                        >
                          {isKo ? '→1단(Z1)' : '→Z1'}
                        </button>
                      )}
                      {selectedBin.bin.level !== 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            onMoveSkuToLevel(selectedBin.bin.id, box.skuId, 2)
                          }
                          className="rounded border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300 hover:bg-cyan-500/25"
                          title={
                            isKo
                              ? '허리높이 골든존(Z2)으로 이동'
                              : 'Move to Golden Zone Z2'
                          }
                        >
                          {isKo ? '→골든존(Z2)' : '→Z2'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
