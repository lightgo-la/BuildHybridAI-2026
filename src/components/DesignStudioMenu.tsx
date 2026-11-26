import React, { useState } from 'react';
import {
  LayoutTemplate,
  Maximize2,
  Palette,
  RotateCcw,
  Sliders,
  X,
} from 'lucide-react';
import { DESIGN_THEMES, type DesignTheme } from '../data/designThemes';
import { type LangCode, t } from '../i18n/translations';

export interface DesignLayoutSettings {
  themeId: string;
  uiScalePct: number; // 85..120
  leftPanelPx: number; // 240..460
  rightPanelPx: number; // 260..520
  viewportMinHeightPx: number; // 380..820
  showMapStrip: boolean;
  showKpiBar: boolean;
}

export const DEFAULT_DESIGN_LAYOUT: DesignLayoutSettings = {
  themeId: 'cyber-slate',
  uiScalePct: 100,
  leftPanelPx: 320,
  rightPanelPx: 370,
  viewportMinHeightPx: 540,
  showMapStrip: true,
  showKpiBar: true,
};

interface DesignStudioMenuProps {
  open: boolean;
  onClose: () => void;
  settings: DesignLayoutSettings;
  onChange: (next: DesignLayoutSettings) => void;
  lang?: LangCode;
}

export const DesignStudioMenu: React.FC<DesignStudioMenuProps> = ({
  open,
  onClose,
  settings,
  onChange,
  lang = 'ko',
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'dark' | 'light'>('all');

  if (!open) return null;

  const filteredThemes = DESIGN_THEMES.filter((t) =>
    filterMode === 'all' ? true : t.mode === filterMode
  );

  const applyPreset = (
    preset: 'balanced' | 'cinema_3d' | 'compact_dense' | 'large_accessible'
  ) => {
    if (preset === 'balanced') {
      onChange({ ...DEFAULT_DESIGN_LAYOUT, themeId: settings.themeId });
    } else if (preset === 'cinema_3d') {
      onChange({
        ...settings,
        leftPanelPx: 260,
        rightPanelPx: 290,
        viewportMinHeightPx: 680,
        showMapStrip: false,
      });
    } else if (preset === 'compact_dense') {
      onChange({
        ...settings,
        uiScalePct: 88,
        leftPanelPx: 280,
        rightPanelPx: 320,
        viewportMinHeightPx: 500,
        showMapStrip: true,
        showKpiBar: true,
      });
    } else {
      onChange({
        ...settings,
        uiScalePct: 115,
        leftPanelPx: 360,
        rightPanelPx: 420,
        viewportMinHeightPx: 600,
        showMapStrip: true,
        showKpiBar: true,
      });
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text)] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[var(--t-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-[var(--t-accent)]" />
          <h3 className="text-sm font-bold">
            {t(lang, 'designStudioTitle')} ({DESIGN_THEMES.length})
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_DESIGN_LAYOUT)}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--t-border)] px-2 py-1 text-[11px] text-[var(--t-muted)] hover:text-[var(--t-text)]"
            title="Reset all design & size settings"
          >
            <RotateCcw className="h-3 w-3" />
            {lang === 'ko' ? '초기화' : 'Reset'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--t-muted)] hover:bg-[var(--t-surface-alt)] hover:text-[var(--t-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 text-xs">
        <section className="space-y-3 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Maximize2 className="h-3.5 w-3.5 text-[var(--t-accent)]" />
            {lang === 'ko' ? '화면 & 패널 크기 조절' : 'Menu & Panel Size Controls'}
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => applyPreset('balanced')}
              className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] px-2.5 py-1.5 font-medium hover:border-[var(--t-accent)]"
            >
              {lang === 'ko' ? '기본 3단 균형' : 'Balanced 3-Col'}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('cinema_3d')}
              className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] px-2.5 py-1.5 font-medium hover:border-[var(--t-accent)]"
            >
              {lang === 'ko' ? '3D 화면 와이드 집중' : '3D Cinema Focus'}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('compact_dense')}
              className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] px-2.5 py-1.5 font-medium hover:border-[var(--t-accent)]"
            >
              {lang === 'ko' ? '컴팩트 뷰 (88%)' : 'Compact (88%)'}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('large_accessible')}
              className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] px-2.5 py-1.5 font-medium hover:border-[var(--t-accent)]"
            >
              {lang === 'ko' ? '큰 글씨 뷰 (115%)' : 'Large UI (115%)'}
            </button>
          </div>

          <div className="space-y-2.5 pt-1 text-[11px]">
            <div>
              <div className="flex justify-between">
                <span className="text-[var(--t-muted)]">
                  {lang === 'ko' ? 'UI 메뉴·글자 크기' : 'UI Menu & Text Scale'}
                </span>
                <span className="font-semibold text-[var(--t-accent)]">
                  {settings.uiScalePct}%
                </span>
              </div>
              <input
                type="range"
                min={85}
                max={120}
                step={5}
                value={settings.uiScalePct}
                onChange={(e) =>
                  onChange({ ...settings, uiScalePct: Number(e.target.value) })
                }
                className="mt-1 w-full accent-[var(--t-accent)]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span className="text-[var(--t-muted)]">
                  {lang === 'ko' ? '좌측 패널 폭' : 'Left Optimizer Menu Width'}
                </span>
                <span className="font-semibold">{settings.leftPanelPx}px</span>
              </div>
              <input
                type="range"
                min={240}
                max={460}
                step={10}
                value={settings.leftPanelPx}
                onChange={(e) =>
                  onChange({ ...settings, leftPanelPx: Number(e.target.value) })
                }
                className="mt-1 w-full accent-[var(--t-accent)]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span className="text-[var(--t-muted)]">
                  {lang === 'ko' ? '우측 AI 패널 폭' : 'Right AI Co-Pilot Width'}
                </span>
                <span className="font-semibold">{settings.rightPanelPx}px</span>
              </div>
              <input
                type="range"
                min={260}
                max={520}
                step={10}
                value={settings.rightPanelPx}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    rightPanelPx: Number(e.target.value),
                  })
                }
                className="mt-1 w-full accent-[var(--t-accent)]"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <span className="text-[var(--t-muted)]">
                  {lang === 'ko' ? '3D 화면 최소 높이' : '3D Twin Viewport Height'}
                </span>
                <span className="font-semibold">
                  {settings.viewportMinHeightPx}px
                </span>
              </div>
              <input
                type="range"
                min={380}
                max={820}
                step={20}
                value={settings.viewportMinHeightPx}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    viewportMinHeightPx: Number(e.target.value),
                  })
                }
                className="mt-1 w-full accent-[var(--t-accent)]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1 text-[11px]">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={settings.showMapStrip}
                onChange={(e) =>
                  onChange({ ...settings, showMapStrip: e.target.checked })
                }
                className="accent-[var(--t-accent)]"
              />
              <LayoutTemplate className="h-3 w-3 text-[var(--t-muted)]" />
              {lang === 'ko' ? '상단 공간 선택 바 표시' : 'Show Map Strip'}
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={settings.showKpiBar}
                onChange={(e) =>
                  onChange({ ...settings, showKpiBar: e.target.checked })
                }
                className="accent-[var(--t-accent)]"
              />
              <Sliders className="h-3 w-3 text-[var(--t-muted)]" />
              {lang === 'ko' ? 'KPI 요약 카드 표시' : 'Show KPI Bar'}
            </label>
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">
              {lang === 'ko' ? '테마 팔레트' : 'Theme Palette'} (
              {filteredThemes.length} / {DESIGN_THEMES.length})
            </span>
            <div className="flex overflow-hidden rounded-lg border border-[var(--t-border)] text-[10px]">
              {(['all', 'dark', 'light'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFilterMode(m)}
                  className={`px-2 py-1 capitalize ${
                    filterMode === m
                      ? 'bg-[var(--t-accent)] font-semibold text-[var(--t-accent-text)]'
                      : 'bg-[var(--t-surface-alt)] text-[var(--t-muted)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {filteredThemes.map((t: DesignTheme) => {
              const active = t.id === settings.themeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChange({ ...settings, themeId: t.id })}
                  className={`flex flex-col gap-1.5 rounded-xl border p-2.5 text-left transition ${
                    active ? 'ring-2 ring-[var(--t-accent)]' : ''
                  }`}
                  style={{
                    backgroundColor: t.surface,
                    borderColor: active ? t.accent : t.border,
                    color: t.text,
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[11px] font-semibold">
                      {t.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: t.bg }}
                      title="Background"
                    />
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: t.accent }}
                      title="Accent"
                    />
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: t.scene.golden }}
                      title="3D Golden Zone"
                    />
                    <span
                      className="ml-auto rounded px-1 py-0.5 text-[9px] uppercase"
                      style={{
                        backgroundColor: t.surfaceAlt,
                        color: t.textMuted,
                      }}
                    >
                      {t.mode}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
