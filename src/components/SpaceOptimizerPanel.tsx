import React from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Eye,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { type LangCode, t } from '../i18n/translations';
import type { SlottingResult, ZLevelSummary } from '../types/warehouse';

export interface GoldenZonePreset {
  id: string;
  label: string;
  labelKo: string;
  minM: number;
  maxM: number;
}

export const GOLDEN_ZONE_PRESETS: GoldenZonePreset[] = [
  {
    id: 'standard',
    label: 'Standard (0.8m–1.65m · Z2–Z3)',
    labelKo: '표준 허리~가슴 높이 (0.8m–1.65m · 2~3단)',
    minM: 0.8,
    maxM: 1.65,
  },
  {
    id: 'low_ergo',
    label: 'Compact Reach (0.7m–1.45m · Z2)',
    labelKo: '낮은 선반·가정용 손높이 (0.7m–1.45m · 2단)',
    minM: 0.7,
    maxM: 1.45,
  },
  {
    id: 'tall_op',
    label: 'High Reach (0.85m–2.4m · Z2–Z4)',
    labelKo: '높은 선반 작업용 (0.85m–2.4m · 2~4단)',
    minM: 0.85,
    maxM: 2.4,
  },
];

interface SpaceOptimizerPanelProps {
  baseline: SlottingResult;
  optimized: SlottingResult;
  zBreakdown: ZLevelSummary[];
  allowRotationAndCoPack: boolean;
  onToggleRotationAndCoPack: (next: boolean) => void;
  goldenPresetId: string;
  onChangeGoldenPreset: (presetId: string) => void;
  levelFilter: number | 'all';
  onChangeLevelFilter: (level: number | 'all') => void;
  onJumpToOptimization: () => void;
  simpleMode?: boolean;
  lang?: LangCode;
}

export const SpaceOptimizerPanel: React.FC<SpaceOptimizerPanelProps> = ({
  baseline,
  optimized,
  zBreakdown,
  allowRotationAndCoPack,
  onToggleRotationAndCoPack,
  goldenPresetId,
  onChangeGoldenPreset,
  levelFilter,
  onChangeLevelFilter,
  onJumpToOptimization,
  simpleMode = true,
  lang = 'ko',
}) => {
  const freedBins = baseline.kpis.occupiedBins - optimized.kpis.occupiedBins;
  const wasteSavedPts = (
    baseline.kpis.honeycombingWastePct - optimized.kpis.honeycombingWastePct
  ).toFixed(1);

  return (
    <div className="space-y-3.5 text-xs">
      {/* Instant ROI Highlight */}
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 to-slate-950 p-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t(lang, 'optimizerSummaryTitle')}
          </span>
          <button
            type="button"
            onClick={onJumpToOptimization}
            className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-500/30"
          >
            {t(lang, 'optimizerView3d')}
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-950/70 p-2">
            <div className="text-[10px] text-slate-400">{t(lang, 'optimizerFreedBins')}</div>
            <div className="text-base font-bold text-emerald-300">
              {freedBins >= 0 ? `+${freedBins}` : freedBins} {lang === 'ko' ? '칸' : 'bins'}
            </div>
            <div className="text-[10px] text-slate-500">
              {baseline.kpis.occupiedBins} → {optimized.kpis.occupiedBins} {lang === 'ko' ? '사용' : 'used'}
            </div>
          </div>
          <div className="rounded-lg bg-slate-950/70 p-2">
            <div className="text-[10px] text-slate-400">{t(lang, 'optimizerWasteCut')}</div>
            <div className="text-base font-bold text-cyan-300">
              {Number(wasteSavedPts) >= 0 ? `-${wasteSavedPts}%p` : `+${Math.abs(Number(wasteSavedPts))}%p`}
            </div>
            <div className="text-[10px] text-slate-500">
              {lang === 'ko'
                ? `미적재: 2D ${baseline.unplacedUnits}개 → 3D ${optimized.unplacedUnits}개`
                : `Unplaced: 2D ${baseline.unplacedUnits} / 3D ${optimized.unplacedUnits}`}
            </div>
          </div>
        </div>
        {(baseline.unplacedUnits > 0 || optimized.unplacedUnits > 0) && (
          <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-950/40 px-2.5 py-1.5 text-[10px] text-amber-200">
            {lang === 'ko'
              ? `선반 용량 초과 안내: 2D 배치에서 ${baseline.unplacedUnits}개, 3D 최적화에서 ${optimized.unplacedUnits}개가 남았습니다. 자동 회전 & 빈틈 채움을 켜거나 선반을 추가해 보세요.`
              : `Overflow detected: 2D left ${baseline.unplacedUnits} units unplaced, 3D left ${optimized.unplacedUnits} units unplaced. Enable 3D Rotation & Co-Pack or reduce SKU quantity.`}
          </div>
        )}
      </div>

      {/* Interactive Space Improvement Levers */}
      <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
          <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
          {t(lang, 'optimizerControlsTitle')}
        </div>

        <label className="flex cursor-pointer items-start justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 hover:border-cyan-500/40">
          <div>
            <div className="flex items-center gap-1.5 font-medium text-white">
              <RotateCw className="h-3.5 w-3.5 text-cyan-400" />
              {lang === 'ko' && simpleMode
                ? t(lang, 'optimizerSmartFitTitle')
                : '3D Rotation & Divider Co-Pack'}
            </div>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
              {lang === 'ko' && simpleMode
                ? t(lang, 'optimizerSmartFitDesc')
                : 'Rotates cartons in 6 axes & shares bins across compatible SKUs to eliminate honeycombing.'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={allowRotationAndCoPack}
            onChange={(e) => onToggleRotationAndCoPack(e.target.checked)}
            className="mt-1 h-4 w-4 accent-cyan-400"
          />
        </label>

        <div>
          <label className="mb-1 flex items-center gap-1 text-[10px] font-medium text-slate-400">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            {lang === 'ko' && simpleMode ? t(lang, 'optimizerGoldenBandLabel') : 'Golden Zone Elevation Band'}
          </label>
          <select
            value={goldenPresetId}
            onChange={(e) => onChangeGoldenPreset(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-slate-100 focus:border-cyan-500 focus:outline-none"
          >
            {GOLDEN_ZONE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {lang === 'ko' ? preset.labelKo : preset.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Z-Axis Layer-by-Layer Slice & Utilization Chart */}
      <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
            <Box className="h-3.5 w-3.5 text-cyan-400" />
            {t(lang, 'optimizerZSliceTitle')}
          </span>
          {levelFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onChangeLevelFilter('all')}
              className="text-[10px] font-medium text-cyan-400 hover:underline"
            >
              {t(lang, 'optimizerShowAllZ')}
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {[...zBreakdown].reverse().map((row) => {
            const isActive = levelFilter === row.level;
            return (
              <button
                key={row.level}
                type="button"
                onClick={() =>
                  onChangeLevelFilter(isActive ? 'all' : row.level)
                }
                className={`w-full rounded-lg border p-2 text-left transition ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/40'
                    : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">
                      {lang === 'ko' && simpleMode ? `${row.level}단 (Z${row.level})` : `Z${row.level}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({row.zMeters}m)
                    </span>
                    {row.isGoldenZone && (
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                        {lang === 'ko' ? '허리높이' : 'Golden'}
                      </span>
                    )}
                    {row.safetyViolations > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/20 px-1 py-0.5 text-[9px] text-rose-300">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {row.safetyViolations}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300">
                    <span>
                      {row.occupiedBins}/{row.totalBins} {lang === 'ko' ? '칸' : 'bins'}
                    </span>
                    <span className="font-semibold text-cyan-300">
                      {row.avgCubicPct}% {lang === 'ko' ? '채움' : 'fill'}
                    </span>
                    <Eye
                      className={`h-3 w-3 ${
                        isActive ? 'text-cyan-300' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        row.safetyViolations > 0
                          ? 'bg-rose-500'
                          : row.isGoldenZone
                            ? 'bg-emerald-400'
                            : 'bg-cyan-400'
                      }`}
                      style={{ width: `${Math.min(100, row.avgCubicPct)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-[9px] text-slate-400">
                    {row.pickLoadSharePct}% {lang === 'ko' ? '사용빈도' : 'picks'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
