import React from 'react';
import {
  Activity,
  Box,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { type LangCode, t } from '../i18n/translations';
import type { SlottingResult } from '../types/warehouse';

interface KPIComparisonBarProps {
  baseline: SlottingResult;
  optimized: SlottingResult;
  activeLayout: 'baseline_2d' | 'optimized_3d';
  goldenZoneMinM: number;
  goldenZoneMaxM: number;
  simpleMode?: boolean;
  lang?: LangCode;
}

function formatDelta(val: number, suffix: string): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}${suffix}`;
}

export const KPIComparisonBar: React.FC<KPIComparisonBarProps> = ({
  baseline,
  optimized,
  activeLayout,
  goldenZoneMinM,
  goldenZoneMaxM,
  simpleMode = true,
  lang = 'en',
}) => {
  const b = baseline.kpis;
  const o = optimized.kpis;
  const isOpt = activeLayout === 'optimized_3d';
  const current = isOpt ? o : b;
  const currentResult = isOpt ? optimized : baseline;

  const cycleGainPct =
    b.avgCycleTimeSec > 0
      ? ((b.avgCycleTimeSec - o.avgCycleTimeSec) / b.avgCycleTimeSec) * 100
      : 0;
  const cubicGainPts = o.cubicUtilizationPct - b.cubicUtilizationPct;
  const goldenGainPts = o.goldenZoneHitRatePct - b.goldenZoneHitRatePct;
  const freedBins = b.occupiedBins - o.occupiedBins;

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {simpleMode ? 'Space Fill Efficiency' : t(lang, 'kpiSpaceFit')}
          </span>
          <Box className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">
            {current.cubicUtilizationPct}%
          </span>
          {isOpt ? (
            <span
              className={`text-[11px] font-medium ${
                cubicGainPts >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {cubicGainPts >= 0
                ? formatDelta(cubicGainPts, '%p better')
                : formatDelta(cubicGainPts, '%p')}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              {'After 3D'}: {o.cubicUtilizationPct}%
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {simpleMode
            ? `Empty shelf air: ${current.honeycombingWastePct}%`
            : `Honeycombing waste: ${current.honeycombingWastePct}%`}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {simpleMode ? 'Avg Reach & Pick Time' : t(lang, 'kpiPickSpeed')}
          </span>
          <Clock className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">
            {current.avgCycleTimeSec}s
          </span>
          {isOpt ? (
            <span
              className={`text-[11px] font-medium ${
                cycleGainPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {cycleGainPct >= 0
                ? `+${cycleGainPct.toFixed(1)}% faster`
                : `+${Math.abs(cycleGainPct).toFixed(1)}% slower`}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              {'After 3D'}: {o.avgCycleTimeSec}s
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {simpleMode
            ? `Effort score: ${current.travelEnergyIndex} (${isOpt ? `Before: ${b.travelEnergyIndex}` : `After 3D: ${o.travelEnergyIndex}`})`
            : `Energy idx: ${current.travelEnergyIndex} (${isOpt ? `2D: ${b.travelEnergyIndex}` : `3D: ${o.travelEnergyIndex}`})`}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {simpleMode ? 'Easy-Reach Zone Fit' : t(lang, 'kpiGoldenHit')}
          </span>
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">
            {current.goldenZoneHitRatePct}%
          </span>
          {isOpt ? (
            <span
              className={`text-[11px] font-medium ${
                goldenGainPts >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatDelta(goldenGainPts, '%p')}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              {'After 3D'}: {o.goldenZoneHitRatePct}%
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {goldenZoneMinM}m–{goldenZoneMaxM}m{' '}
          {simpleMode ? 'waist-to-shoulder height' : 'Z-axis ergonomic band'}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {simpleMode ? 'Shelves Used & Comfort' : t(lang, 'kpiSavedBins')}
          </span>
          <Activity className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">
            {current.occupiedBins}/{current.totalBins}
          </span>
          <span
            className={`text-[11px] font-medium ${
              freedBins >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {freedBins >= 0 ? `+${freedBins} ${'free'}` : `${freedBins}`}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {simpleMode
              ? `Comfort score: ${current.ergonomicsScore}/100`
              : `Ergo score: ${current.ergonomicsScore}/100 (${isOpt ? `2D: ${b.ergonomicsScore}` : `3D: ${o.ergonomicsScore}`})`}
          </span>
          {currentResult.unplacedUnits > 0 && (
            <span
              className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300"
              title={(currentResult.unplacedItems ?? [])
                .map((u) => `${u.skuCode} ×${u.count}`)
                .join(', ')}
            >
              {`${currentResult.unplacedUnits} unplaced`}
            </span>
          )}
        </div>
      </div>

      <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/85 p-3 lg:col-span-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {simpleMode ? 'Safety Check (Top Shelves)' : t(lang, 'kpiSafety')}
          </span>
          {current.safetyViolations > 0 ? (
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span
            className={`text-xl font-bold ${
              current.safetyViolations > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {current.safetyViolations === 0
              ? simpleMode
                ? 'Safe (0)'
                : '0'
              : current.safetyViolations}
          </span>
          <span className="text-[11px] text-slate-400">
            {isOpt
              ? `(${'Before'}: ${b.safetyViolations})`
              : `(${'3D fixes to'} ${o.safetyViolations})`}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {simpleMode
            ? 'No heavy items (>16kg) on upper shelves'
            : 'Heavy (>16kg) on upper Z3–Z5'}
        </div>
      </div>
    </div>
  );
};
