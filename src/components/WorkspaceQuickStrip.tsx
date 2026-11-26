import React from 'react';
import { Cpu, Sparkles, Trash2, Truck } from 'lucide-react';
import type { DesignTheme } from '../data/designThemes';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios';
import { WAREHOUSE_TEMPLATES } from '../data/warehouseTemplates';
import { type LangCode, t } from '../i18n/translations';
import type {
  BinAllocation,
  EquipmentMode,
  WarehouseScenario,
} from '../types/warehouse';

interface WorkspaceQuickStripProps {
  lang: LangCode;
  showMapStrip: boolean;
  activeScenarioName: string;
  scenarioId: string;
  mapFilter: 'all' | 'pro' | 'everyday';
  customMaps: WarehouseScenario[];
  activeTheme: DesignTheme;
  simpleMode: boolean;
  showBeginnerGuide: boolean;
  equipmentMode: EquipmentMode;
  firestoreNotice: string;
  activeLayout: 'optimized_3d' | 'baseline_2d';
  allocations: BinAllocation[];
  onChangeMapFilter: (filter: 'all' | 'pro' | 'everyday') => void;
  onSelectScenario: (id: string) => void;
  onDeleteCustomScenario: (id: string) => void;
  onChangeShowBeginnerGuide: (show: boolean) => void;
  onChangeEquipmentMode: (mode: EquipmentMode) => void;
  onOpenTemplateGallery: () => void;
  onToggleActiveLayout: () => void;
  onSelectRecommendedBin: (alloc: BinAllocation) => void;
}

export const WorkspaceQuickStrip: React.FC<WorkspaceQuickStripProps> = ({
  lang,
  showMapStrip,
  activeScenarioName,
  scenarioId,
  mapFilter,
  customMaps,
  activeTheme,
  simpleMode,
  showBeginnerGuide,
  equipmentMode,
  firestoreNotice,
  activeLayout,
  allocations,
  onChangeMapFilter,
  onSelectScenario,
  onDeleteCustomScenario,
  onChangeShowBeginnerGuide,
  onChangeEquipmentMode,
  onOpenTemplateGallery,
  onToggleActiveLayout,
  onSelectRecommendedBin,
}) => {
  return (
    <>
      {showMapStrip && (
        <section className="theme-surface flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/50 px-4 py-1.5 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-cyan-300">
              {activeScenarioName}
            </span>
            <span className="text-slate-500">·</span>
            <div className="flex overflow-hidden rounded-md border border-slate-700 bg-slate-950 text-[10px]">
              {(
                [
                  ['all', t(lang, 'filterAll')],
                  ['pro', t(lang, 'filterPro')],
                  ['everyday', t(lang, 'filterEveryday')],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChangeMapFilter(key)}
                  className={`px-2 py-0.5 ${
                    mapFilter === key
                      ? 'bg-cyan-500/20 font-semibold text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={
                WAREHOUSE_TEMPLATES.some((x) => x.id === scenarioId)
                  ? scenarioId
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) onSelectScenario(e.target.value);
              }}
              className="max-w-[215px] rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-medium text-emerald-300 focus:border-cyan-500 focus:outline-none"
              title={t(lang, 'allTemplatesJump')}
            >
              <option value="">{t(lang, 'allTemplatesJump')}</option>
              {WAREHOUSE_TEMPLATES.filter((tpl) => {
                if (mapFilter === 'everyday') return tpl.persona === 'everyday';
                if (mapFilter === 'pro') return tpl.persona === 'professional';
                return true;
              }).map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap items-center gap-1">
              {[...SAMPLE_SCENARIOS, ...customMaps]
                .filter((sc) => {
                  const isEvery =
                    sc.id.startsWith('everyday') || sc.id.startsWith('tpl-life');
                  if (mapFilter === 'everyday') return isEvery;
                  if (mapFilter === 'pro') return !isEvery;
                  return true;
                })
                .map((sc) => {
                  const selected = sc.id === scenarioId;
                  const isCustom = customMaps.some((c) => c.id === sc.id);
                  return (
                    <div
                      key={sc.id}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 transition ${
                        selected
                          ? 'bg-cyan-950/35 font-semibold text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                      style={
                        selected ? { borderColor: activeTheme.accent } : undefined
                      }
                    >
                      <button
                        type="button"
                        onClick={() => onSelectScenario(sc.id)}
                      >
                        {sc.name.replace(/^Map \d+ · |^Everyday \d+ · /, '')}
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => onDeleteCustomScenario(sc.id)}
                          className="text-slate-400 hover:text-rose-400"
                          title="Delete custom map"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {simpleMode && !showBeginnerGuide && (
              <button
                type="button"
                onClick={() => onChangeShowBeginnerGuide(true)}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
              >
                <Sparkles className="h-3 w-3" />
                {lang === 'ko' ? '초보자 가이드 열기' : 'Show Quick Guide'}
              </button>
            )}
            {!simpleMode && (
              <div className="flex overflow-hidden rounded-md border border-slate-700 bg-slate-950 text-[10px]">
                <button
                  type="button"
                  onClick={() => onChangeEquipmentMode('reach_truck')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 ${
                    equipmentMode === 'reach_truck'
                      ? 'bg-cyan-500/20 font-semibold text-cyan-300'
                      : 'text-slate-400'
                  }`}
                >
                  <Truck className="h-3 w-3" />
                  Reach
                </button>
                <button
                  type="button"
                  onClick={() => onChangeEquipmentMode('asrs_crane')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 ${
                    equipmentMode === 'asrs_crane'
                      ? 'bg-cyan-500/20 font-semibold text-cyan-300'
                      : 'text-slate-400'
                  }`}
                >
                  <Cpu className="h-3 w-3" />
                  AS/RS
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {firestoreNotice && (
        <div className="border-b border-slate-800 bg-slate-900 px-4 py-1.5 text-right text-[11px] text-cyan-300">
          {firestoreNotice}
        </div>
      )}

      {/* 3-Step Interactive Beginner Onboarding Bar (Visible in Simple Mode) */}
      {simpleMode && showBeginnerGuide && (
        <section className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/30 bg-emerald-950/25 px-4 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
              <Sparkles className="h-3 w-3" />
              {lang === 'ko'
                ? '초보자 3단계 빠른 시작:'
                : '3-Step Quick Start:'}
            </span>

            <button
              type="button"
              onClick={onOpenTemplateGallery}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[11px] font-medium text-slate-100 hover:border-cyan-400"
            >
              <span className="font-bold text-cyan-400">STEP 1</span>
              {lang === 'ko'
                ? '우리집·매장 공간 템플릿 고르기'
                : 'Choose Space Template'}
            </button>

            <button
              type="button"
              onClick={onToggleActiveLayout}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[11px] font-medium text-slate-100 hover:border-emerald-400"
            >
              <span className="font-bold text-emerald-400">STEP 2</span>
              {lang === 'ko'
                ? `정리 전(2D) ↔ 3D 자동 정리 비교 (${activeLayout === 'optimized_3d' ? '현재: 3D 정리 후' : '현재: 정리 전'})`
                : 'Compare Before (2D) ↔ After (3D)'}
            </button>

            <button
              type="button"
              onClick={() => {
                const targetAlloc =
                  allocations.find(
                    (a) => a.bin.isGoldenZone && a.boxes.length > 0
                  ) ??
                  allocations[0] ??
                  null;
                if (targetAlloc) {
                  onSelectRecommendedBin(targetAlloc);
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[11px] font-medium text-slate-100 hover:border-amber-400"
            >
              <span className="font-bold text-amber-400">STEP 3</span>
              {lang === 'ko'
                ? '추천 선반 클릭해 내 물건 바로 넣어보기'
                : 'Select Golden Zone Shelf & Place Item'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => onChangeShowBeginnerGuide(false)}
            className="text-[11px] text-slate-400 hover:text-white"
          >
            {lang === 'ko' ? '가이드 접기 ×' : 'Hide ×'}
          </button>
        </section>
      )}
    </>
  );
};
