import React from 'react';
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Home,
  Languages,
  LayoutGrid,
  Map as MapIcon,
  Palette,
  Ruler,
  Settings,
} from 'lucide-react';
import { DESIGN_THEMES, type DesignTheme } from '../data/designThemes';
import { WAREHOUSE_TEMPLATES } from '../data/warehouseTemplates';
import { type LangCode, t } from '../i18n/translations';
import type { DesignLayoutSettings } from './DesignStudioMenu';

interface TopHeaderBarProps {
  lang: LangCode;
  appView: 'workspace' | 'home';
  simpleMode: boolean;
  activeTheme: DesignTheme;
  designSettings: DesignLayoutSettings;
  firebaseConfigured: boolean;
  onChangeAppView: (view: 'workspace' | 'home') => void;
  onOpenTemplateGallery: () => void;
  onOpenMapEditor: () => void;
  onOpenCadModal: () => void;
  onToggleLanguage: () => void;
  onToggleSimpleMode: () => void;
  onCycleTheme: (delta: number) => void;
  onSelectThemeId: (themeId: string) => void;
  onOpenDesignMenu: () => void;
  onSaveSnapshot: () => void;
  onOpenFirebaseSetup: () => void;
}

export const TopHeaderBar: React.FC<TopHeaderBarProps> = ({
  lang,
  appView,
  simpleMode,
  activeTheme,
  designSettings,
  firebaseConfigured,
  onChangeAppView,
  onOpenTemplateGallery,
  onOpenMapEditor,
  onOpenCadModal,
  onToggleLanguage,
  onToggleSimpleMode,
  onCycleTheme,
  onSelectThemeId,
  onOpenDesignMenu,
  onSaveSnapshot,
  onOpenFirebaseSetup,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
          style={{
            backgroundColor: activeTheme.accent,
            color: activeTheme.accentText,
          }}
        >
          <Boxes className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white">
              CubiSlot 3D
            </h1>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
              #BuildHybridAI 2026 · Web/Chrome
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {t(lang, 'appSubtitle')} · {activeTheme.name} ·{' '}
            {designSettings.uiScalePct}%
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* App View Mode Switcher: Everyday Home <-> 3D Workspace */}
        <div className="flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950 p-0.5">
          <button
            type="button"
            onClick={() => onChangeAppView('home')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
              appView === 'home'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            {t(lang, 'navHome')}
          </button>
          <button
            type="button"
            onClick={() => onChangeAppView('workspace')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
              appView === 'workspace'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            {t(lang, 'navWorkspace')}
          </button>
        </div>

        {/* Guided 3-Step Flow */}
        <button
          type="button"
          onClick={onOpenTemplateGallery}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-semibold text-slate-100 hover:border-cyan-500/50"
          title="Step 1: Choose from 24 Pro & Everyday Templates"
        >
          <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
          1. {t(lang, 'navTemplates')} ({WAREHOUSE_TEMPLATES.length})
        </button>

        <button
          type="button"
          onClick={onOpenMapEditor}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-semibold text-slate-100 hover:border-emerald-500/50"
          title="Step 2: Drag & Resize Space on 2D Free Canvas"
        >
          <MapIcon className="h-3.5 w-3.5 text-emerald-400" />
          2. {t(lang, 'navMapCanvas')}
        </button>

        <button
          type="button"
          onClick={onOpenCadModal}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-medium text-slate-100 hover:border-cyan-500/50"
          title="Step 3: Export 2D CAD Blueprint (.DXF / .SVG)"
        >
          <Ruler className="h-3.5 w-3.5 text-cyan-400" />
          3. {t(lang, 'navCad')}
        </button>

        {/* Language Switcher (Korean / English) */}
        <button
          type="button"
          onClick={onToggleLanguage}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 hover:border-amber-400/60"
          title="Switch Language (한국어 / English)"
        >
          <Languages className="h-3.5 w-3.5" />
          {lang === 'ko' ? '한국어/EN' : 'EN/한국어'}
        </button>

        {/* Easy / Pro Terminology Toggle */}
        <button
          type="button"
          onClick={onToggleSimpleMode}
          className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-300 hover:border-cyan-500/50"
          title="Switch between Easy Everyday labels and Pro Engineering terms"
        >
          {simpleMode ? t(lang, 'easyModeOn') : t(lang, 'proModeOn')}
        </button>

        {/* Instant 24-Theme Switcher + Design & Size Studio */}
        <div
          className="flex items-center overflow-hidden rounded-lg border"
          style={{
            borderColor: activeTheme.accent,
            backgroundColor: activeTheme.surfaceAlt,
          }}
        >
          <button
            type="button"
            onClick={() => onCycleTheme(-1)}
            className="px-1.5 py-1.5 hover:opacity-80"
            style={{ color: activeTheme.accent }}
            title="Previous Theme"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <select
            value={designSettings.themeId}
            onChange={(e) => onSelectThemeId(e.target.value)}
            className="max-w-[130px] bg-transparent px-1 py-1.5 text-[11px] font-semibold focus:outline-none"
            style={{ color: activeTheme.text }}
            title="Switch among 24 design themes"
          >
            {DESIGN_THEMES.map((themeItem) => (
              <option
                key={themeItem.id}
                value={themeItem.id}
                style={{
                  backgroundColor: activeTheme.surface,
                  color: activeTheme.text,
                }}
              >
                {themeItem.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onCycleTheme(1)}
            className="px-1.5 py-1.5 hover:opacity-80"
            style={{ color: activeTheme.accent }}
            title="Next Theme"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenDesignMenu}
            className="inline-flex items-center gap-1 border-l px-2 py-1.5 font-semibold transition"
            style={{
              borderColor: activeTheme.border,
              backgroundColor: activeTheme.accent,
              color: activeTheme.accentText,
            }}
            title="Open 24-Theme Gallery & UI Size Sliders"
          >
            <Palette className="h-3.5 w-3.5" />
            {t(lang, 'themeSizeBtn')}
          </button>
        </div>

        {!simpleMode && (
          <button
            type="button"
            onClick={onSaveSnapshot}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-200 hover:border-cyan-500/40"
            title="Save KPI snapshot to Firestore"
          >
            <CloudUpload className="h-3.5 w-3.5 text-cyan-400" />
            {t(lang, 'saveRun')}
          </button>
        )}

        <button
          type="button"
          onClick={onOpenFirebaseSetup}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium ${
            firebaseConfigured
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          {firebaseConfigured ? t(lang, 'firebaseOk') : t(lang, 'firebaseSetup')}
        </button>
      </div>
    </header>
  );
};
