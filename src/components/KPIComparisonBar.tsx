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
  lang = 'ko',
}) => {
  const b = baseline.kpis;
  const o = optimized.kpis;
  const isOpt = activeLayout === 'optimized_3d';
  const current = isOpt ? o : b;

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
          <span>{lang === 'ko' && simpleMode ? t(lang, 'kpiSpaceFit') : '3D Cubic Utilization'}</span>
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
              {formatDelta(cubicGainPts, lang === 'ko' ? '%p 향상' : '%p better')}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              {lang === 'ko' ? '3D 후' : 'After 3D'}: {o.cubicUtilizationPct}%
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {lang === 'ko' && simpleMode
            ? `빈틈 낭비 ${current.honeycombingWastePct}%`
            : `Honeycombing waste: ${current.honeycombingWastePct}%`}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{lang === 'ko' && simpleMode ? t(lang, 'kpiPickSpeed') : 'Avg 3D Pick Cycle'}</span>
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
              {formatDelta(-cycleGainPct, lang === 'ko' ? '% 단축' : '% faster')}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              {lang === 'ko' ? '3D 후' : 'After 3D'}: {o.avgCycleTimeSec}s
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {lang === 'ko' && simpleMode
            ? `이동 에너지 지수 ${current.travelEnergyIndex}`
            : `Energy idx: ${current.travelEnergyIndex} (${isOpt ? `2D: ${b.travelEnergyIndex}` : `3D: ${o.travelEnergyIndex}`})`}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{lang === 'ko' && simpleMode ? t(lang, 'kpiGoldenHit') : 'Golden Zone Hit (A)'}</span>
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
              {lang === 'ko' ? '3D 후' : 'After 3D'}: {o.goldenZoneHitRatePct}%
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {goldenZoneMinM}m–{goldenZoneMaxM}m{' '}
          {lang === 'ko' && simpleMode ? '편한 손높이 구역' : 'Z-axis ergonomic band'}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{lang === 'ko' && simpleMode ? t(lang, 'kpiSavedBins') : 'Ergonomics & Bins'}</span>
          <Activity className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">
            {current.occupiedBins}/{current.totalBins}
          </span>
          <span className="text-[11px] font-medium text-emerald-400">
            {freedBins >= 0 ? `+${freedBins} ${lang === 'ko' ? '여유' : 'free'}` : `${freedBins}`}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {lang === 'ko' && simpleMode
            ? `인체공학 점수 ${current.ergonomicsScore}/100`
            : `Ergo score: ${current.ergonomicsScore}/100 (2D: ${b.ergonomicsScore})`}
        </div>
      </div>

      <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/85 p-3 lg:col-span-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{lang === 'ko' && simpleMode ? t(lang, 'kpiSafety') : 'Rack Safety Hazards'}</span>
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
              ? lang === 'ko' && simpleMode
                ? '안전 (0)'
                : '0'
              : current.safetyViolations}
          </span>
          <span className="text-[11px] text-slate-400">
            {isOpt
              ? `(${lang === 'ko' ? '이전' : 'Before'}: ${b.safetyViolations})`
              : `(${lang === 'ko' ? '3D 개선' : '3D fixes to'} ${o.safetyViolations})`}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {lang === 'ko' && simpleMode
            ? '무거운 짐(>16kg) 위층 배치 방지'
            : 'Heavy (>16kg) on upper Z3–Z5'}
        </div>
      </div>
    </div>
  );
};
