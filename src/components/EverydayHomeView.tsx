import React, { useMemo, useState } from 'react';
import {
  Box,
  Briefcase,
  Check,
  Clock,
  Home,
  LayoutGrid,
  Map as MapIcon,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  TEMPLATE_CATEGORY_LABELS,
  WAREHOUSE_TEMPLATES,
} from '../data/warehouseTemplates';
import { type LangCode, t } from '../i18n/translations';
import type {
  OptimizationPreset,
  SlottingResult,
  WarehouseConfig,
  WarehouseScenario,
  WarehouseTemplate,
} from '../types/warehouse';

interface EverydayHomeViewProps {
  lang: LangCode;
  activeScenario: WarehouseScenario;
  optimizedResult: SlottingResult;
  config: WarehouseConfig;
  optimizationPreset: OptimizationPreset;
  onChangePreset: (preset: OptimizationPreset) => void;
  onSelectTemplate: (tpl: WarehouseTemplate, openWorkspace?: boolean) => void;
  onCreateCustomHomeSpace: (params: {
    floorWidthM: number;
    floorDepthM: number;
    levels: number;
    shelfTier: 'small' | 'medium' | 'large';
  }) => void;
  onGoWorkspace: () => void;
  onOpenMapCanvas: () => void;
}

export const EverydayHomeView: React.FC<EverydayHomeViewProps> = ({
  lang,
  activeScenario,
  optimizedResult,
  config,
  optimizationPreset,
  onChangePreset,
  onSelectTemplate,
  onCreateCustomHomeSpace,
  onGoWorkspace,
  onOpenMapCanvas,
}) => {
  const [personaFilter, setPersonaFilter] = useState<
    'everyday' | 'professional' | 'all'
  >('everyday');
  const [search, setSearch] = useState('');

  const [roomWidthM, setRoomWidthM] = useState(4.5);
  const [roomDepthM, setRoomDepthM] = useState(4.0);
  const [roomLevels, setRoomLevels] = useState(4);
  const [shelfTier, setShelfTier] = useState<'small' | 'medium' | 'large'>(
    'medium'
  );

  const activeTemplateImg = useMemo(() => {
    const found = WAREHOUSE_TEMPLATES.find((x) => x.id === activeScenario.id);
    return found?.imageUrl ?? `/templates/${WAREHOUSE_TEMPLATES[12].id}.png`;
  }, [activeScenario.id]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return WAREHOUSE_TEMPLATES.filter((tpl) => {
      if (personaFilter !== 'all' && tpl.persona !== personaFilter) return false;
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.highlights.toLowerCase().includes(q) ||
        tpl.skus.some((s) => s.name.toLowerCase().includes(q))
      );
    });
  }, [personaFilter, search]);

  const o = optimizedResult.kpis;

  return (
    <div className="mx-auto flex w-full max-w-[1650px] flex-1 flex-col gap-5 p-4 md:p-6">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="theme-surface flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/85 p-5 lg:col-span-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative w-full shrink-0 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950 sm:w-56">
              <img
                src={activeTemplateImg}
                alt={activeScenario.name}
                className="aspect-video w-full object-cover"
              />
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-slate-950/85 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 backdrop-blur">
                {config.mapTag ?? `${config.aisles}×${config.baysPerAisle}×${config.levels}`}
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <Home className="h-3.5 w-3.5" />
                {t(lang, 'homeBadge')}
              </span>
              <h2 className="text-lg font-bold tracking-tight text-white md:text-xl">
                {t(lang, 'homeTitle')}
              </h2>
              <p className="text-xs leading-relaxed text-slate-400">
                {t(lang, 'homeSubtitle')}
              </p>

              <div className="pt-1 text-[11px] text-cyan-300">
                <span className="text-slate-400">
                  {t(lang, 'homeActiveSpaceLabel')}:{' '}
                </span>
                <strong className="font-semibold text-white">
                  {activeScenario.name}
                </strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Box className="h-3 w-3 text-cyan-400" />
                {t(lang, 'kpiSpaceFit')}
              </div>
              <div className="mt-0.5 text-lg font-bold text-white">
                {o.cubicUtilizationPct}%
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock className="h-3 w-3 text-amber-400" />
                {t(lang, 'kpiPickSpeed')}
              </div>
              <div className="mt-0.5 text-lg font-bold text-white">
                {o.avgCycleTimeSec}s
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                {t(lang, 'kpiSafety')}
              </div>
              <div className="mt-0.5 text-lg font-bold text-emerald-400">
                {o.safetyViolations === 0 ? (lang === 'ko' ? '안전 (0)' : 'Safe (0)') : o.safetyViolations}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <span className="mr-1 font-semibold text-slate-400">
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
                  onClick={() => onChangePreset(preset)}
                  className={`rounded-lg border px-2.5 py-1 font-medium transition ${
                    optimizationPreset === preset
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                      : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={onOpenMapCanvas}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 font-semibold text-slate-100 hover:border-emerald-400"
              >
                <MapIcon className="h-3.5 w-3.5 text-emerald-400" />
                {t(lang, 'homeOpenCanvasBtn')}
              </button>
              <button
                type="button"
                onClick={onGoWorkspace}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-400"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t(lang, 'homeOpen3dBtn')}
              </button>
            </div>
          </div>
        </div>

        <div className="theme-surface flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/85 p-5 lg:col-span-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Plus className="h-4 w-4 text-emerald-400" />
              {t(lang, 'homeBuilderTitle')}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {t(lang, 'homeBuilderSubtitle')}
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-slate-300">{t(lang, 'homeWidthLabel')}</span>
                  <span className="font-bold text-cyan-300">{roomWidthM.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min={2.5}
                  max={14}
                  step={0.5}
                  value={roomWidthM}
                  onChange={(e) => setRoomWidthM(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-slate-300">{t(lang, 'homeDepthLabel')}</span>
                  <span className="font-bold text-cyan-300">{roomDepthM.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min={2.5}
                  max={12}
                  step={0.5}
                  value={roomDepthM}
                  onChange={(e) => setRoomDepthM(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-slate-300">{t(lang, 'homeLevelsLabel')}</span>
                  <span className="font-bold text-emerald-300">Z1 ~ Z{roomLevels}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  step={1}
                  value={roomLevels}
                  onChange={(e) => setRoomLevels(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="mb-1 text-[11px] text-slate-300">
                  {t(lang, 'homeShelfSizeLabel')}
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  {(
                    [
                      ['small', t(lang, 'homeShelfSmall')],
                      ['medium', t(lang, 'homeShelfMedium')],
                      ['large', t(lang, 'homeShelfLarge')],
                    ] as const
                  ).map(([tier, label]) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setShelfTier(tier)}
                      className={`rounded-lg border px-2 py-1.5 font-medium transition ${
                        shelfTier === tier
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                          : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onCreateCustomHomeSpace({
                floorWidthM: roomWidthM,
                floorDepthM: roomDepthM,
                levels: roomLevels,
                shelfTier,
              })
            }
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
          >
            <LayoutGrid className="h-4 w-4" />
            {t(lang, 'homeApplyRoomBtn')}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
            {(
              [
                ['everyday', t(lang, 'homeFilterEveryday'), Home],
                ['professional', t(lang, 'homeFilterPro'), Briefcase],
                ['all', t(lang, 'homeFilterAll'), LayoutGrid],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPersonaFilter(id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                  personaFilter === id
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px] flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, 'homeSearchPlaceholder')}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((tpl) => {
            const isSelected = tpl.id === activeScenario.id;
            const totalUnits = tpl.skus.reduce((acc, s) => acc + s.quantity, 0);
            return (
              <div
                key={tpl.id}
                className={`theme-surface group flex flex-col overflow-hidden rounded-2xl border transition ${
                  isSelected
                    ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img
                    src={tpl.imageUrl}
                    alt={tpl.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span
                    className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur ${
                      tpl.persona === 'everyday'
                        ? 'bg-emerald-950/85 text-emerald-300'
                        : 'bg-sky-950/85 text-sky-300'
                    }`}
                  >
                    {TEMPLATE_CATEGORY_LABELS[tpl.category]}
                  </span>
                  {isSelected && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                      <Check className="h-3 w-3" />
                      {lang === 'ko' ? '적용됨' : 'Active'}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-3.5">
                  <div>
                    <h3 className="text-xs font-bold text-white">{tpl.name}</h3>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                      {tpl.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tpl.skus.map((sku) => (
                        <span
                          key={sku.id}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-950/90 px-1.5 py-0.5 text-[9px] font-medium text-slate-200"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: sku.color }}
                          />
                          {sku.name} ×{sku.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 border-t border-slate-800/80 pt-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{tpl.config.mapTag}</span>
                      <span className="font-semibold text-slate-200">
                        {tpl.skus.length} SKUs · {totalUnits} pcs
                      </span>
                    </div>

                    <div className="flex gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => onSelectTemplate(tpl, false)}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-950 py-1.5 font-medium text-slate-200 hover:border-cyan-400"
                      >
                        {t(lang, 'homeCardApplyHere')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectTemplate(tpl, true)}
                        className="flex-1 rounded-lg bg-cyan-500 py-1.5 font-bold text-slate-950 hover:bg-cyan-400"
                      >
                        {t(lang, 'homeCardOpen3d')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
