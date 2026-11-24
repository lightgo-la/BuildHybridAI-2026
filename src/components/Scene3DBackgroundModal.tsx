import React from 'react';
import {
  Eye,
  Lightbulb,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import type { LangCode } from '../i18n/translations';

export type FloorTextureStyle =
  | 'glossy_tile'
  | 'warm_wood'
  | 'clean_concrete'
  | 'blueprint_grid';

export interface Scene3DBackgroundSettings {
  presetId: string;
  useThemeDefault: boolean;
  skyTopColor: string;
  skyHorizonColor: string;
  floorColor: string;
  gridMajorColor: string;
  gridMinorColor: string;
  rackFrameColor: string;
  floorStyle: FloorTextureStyle;
  exposure: number; // 0.7 .. 2.2
  ambientIntensity: number; // 0.4 .. 2.5
  sunIntensity: number; // 0.4 .. 2.6
  fogDensityPct: number; // 0 .. 100 (0 = no fog, crystal clear)
  showGrid: boolean;
  showRoomProps: boolean;
  showHeaderSign: boolean;
  showBoxOutlines: boolean;
  enableShadows: boolean;
  xrayBins: boolean;
}

export interface Scene3DPreset {
  id: string;
  nameKo: string;
  nameEn: string;
  badge: string;
  settings: Omit<
    Scene3DBackgroundSettings,
    | 'presetId'
    | 'showGrid'
    | 'showRoomProps'
    | 'showHeaderSign'
    | 'showBoxOutlines'
    | 'enableShadows'
    | 'xrayBins'
  >;
}

export const SCENE_3D_PRESETS: Scene3DPreset[] = [
  {
    id: 'daylight-studio',
    nameKo: '밝은 데이라이트 스튜디오 (기본)',
    nameEn: 'Bright Daylight Studio (Default)',
    badge: 'Bright',
    settings: {
      useThemeDefault: false,
      skyTopColor: '#e0f2fe',
      skyHorizonColor: '#f8fafc',
      floorColor: '#e2e8f0',
      gridMajorColor: '#94a3b8',
      gridMinorColor: '#cbd5e1',
      rackFrameColor: '#334155',
      floorStyle: 'glossy_tile',
      exposure: 1.38,
      ambientIntensity: 1.65,
      sunIntensity: 1.85,
      fogDensityPct: 0,
    },
  },
  {
    id: 'warm-home',
    nameKo: '따뜻한 홈·우드 인테리어',
    nameEn: 'Warm Home & Wood Interior',
    badge: 'Home',
    settings: {
      useThemeDefault: false,
      skyTopColor: '#fef3c7',
      skyHorizonColor: '#fffbeb',
      floorColor: '#e7d5b8',
      gridMajorColor: '#bfa07a',
      gridMinorColor: '#d8c2a3',
      rackFrameColor: '#78350f',
      floorStyle: 'warm_wood',
      exposure: 1.4,
      ambientIntensity: 1.7,
      sunIntensity: 1.8,
      fogDensityPct: 0,
    },
  },
  {
    id: 'pure-white',
    nameKo: '모던 화이트 갤러리 쇼룸',
    nameEn: 'Pure White Gallery Showroom',
    badge: 'Clean',
    settings: {
      useThemeDefault: false,
      skyTopColor: '#f8fafc',
      skyHorizonColor: '#ffffff',
      floorColor: '#f1f5f9',
      gridMajorColor: '#94a3b8',
      gridMinorColor: '#e2e8f0',
      rackFrameColor: '#475569',
      floorStyle: 'glossy_tile',
      exposure: 1.48,
      ambientIntensity: 1.8,
      sunIntensity: 1.9,
      fogDensityPct: 0,
    },
  },
  {
    id: 'ice-clean',
    nameKo: '아이스 클린룸 & 냉장 쇼케이스',
    nameEn: 'Crisp Ice Cleanroom & Fridge',
    badge: 'Cool',
    settings: {
      useThemeDefault: false,
      skyTopColor: '#cffafe',
      skyHorizonColor: '#f0fdff',
      floorColor: '#e0f2fe',
      gridMajorColor: '#38bdf8',
      gridMinorColor: '#bae6fd',
      rackFrameColor: '#0369a1',
      floorStyle: 'glossy_tile',
      exposure: 1.42,
      ambientIntensity: 1.7,
      sunIntensity: 1.8,
      fogDensityPct: 0,
    },
  },
  {
    id: 'sky-atrium',
    nameKo: '스카이 블루 아트리움',
    nameEn: 'Sky Blue Daylight Atrium',
    badge: 'Sky',
    settings: {
      useThemeDefault: false,
      skyTopColor: '#bae6fd',
      skyHorizonColor: '#f0f9ff',
      floorColor: '#dbeafe',
      gridMajorColor: '#60a5fa',
      gridMinorColor: '#bfdbfe',
      rackFrameColor: '#1e3a8a',
      floorStyle: 'clean_concrete',
      exposure: 1.38,
      ambientIntensity: 1.65,
      sunIntensity: 1.85,
      fogDensityPct: 0,
    },
  },
  {
    id: 'natural-sage',
    nameKo: '내추럴 가든 & 자작나무',
    nameEn: 'Natural Sage & Birch Wood',
    badge: 'Nature',
    settings: {
      useThemeDefault: false,
      skyTopColor: '#d1fae5',
      skyHorizonColor: '#f0fdf4',
      floorColor: '#e7e5e4',
      gridMajorColor: '#86efac',
      gridMinorColor: '#d6d3d1',
      rackFrameColor: '#3f6212',
      floorStyle: 'warm_wood',
      exposure: 1.38,
      ambientIntensity: 1.65,
      sunIntensity: 1.75,
      fogDensityPct: 0,
    },
  },
  {
    id: 'sunset-lounge',
    nameKo: '선셋 골든 라운지',
    nameEn: 'Sunset Golden Lounge',
    badge: 'Warm',
    settings: {
      useThemeDefault: false,
      skyTopColor: '#fed7aa',
      skyHorizonColor: '#fff7ed',
      floorColor: '#f5ebe0',
      gridMajorColor: '#fb923c',
      gridMinorColor: '#fdba74',
      rackFrameColor: '#9a3412',
      floorStyle: 'warm_wood',
      exposure: 1.36,
      ambientIntensity: 1.6,
      sunIntensity: 1.9,
      fogDensityPct: 0,
    },
  },
  {
    id: 'bright-factory',
    nameKo: '밝은 스마트 팩토리 & 물류센터',
    nameEn: 'Bright Smart Logistics Center',
    badge: 'Pro',
    settings: {
      useThemeDefault: false,
      skyTopColor: '#cbd5e1',
      skyHorizonColor: '#f1f5f9',
      floorColor: '#d1d5db',
      gridMajorColor: '#64748b',
      gridMinorColor: '#9ca3af',
      rackFrameColor: '#1d4ed8',
      floorStyle: 'clean_concrete',
      exposure: 1.35,
      ambientIntensity: 1.6,
      sunIntensity: 1.85,
      fogDensityPct: 0,
    },
  },
  {
    id: 'studio-lavender',
    nameKo: '소프트 라벤더 크리에이티브 룸',
    nameEn: 'Soft Lavender Creative Studio',
    badge: 'Studio',
    settings: {
      useThemeDefault: false,
      skyTopColor: '#e9d5ff',
      skyHorizonColor: '#faf5ff',
      floorColor: '#f3e8ff',
      gridMajorColor: '#a855f7',
      gridMinorColor: '#d8b4fe',
      rackFrameColor: '#581c87',
      floorStyle: 'glossy_tile',
      exposure: 1.38,
      ambientIntensity: 1.65,
      sunIntensity: 1.75,
      fogDensityPct: 0,
    },
  },
  {
    id: 'bright-blueprint',
    nameKo: '브라이트 엔지니어링 블루프린트',
    nameEn: 'Bright Engineering Blueprint',
    badge: 'CAD',
    settings: {
      useThemeDefault: false,
      skyTopColor: '#1e3a8a',
      skyHorizonColor: '#1d4ed8',
      floorColor: '#172554',
      gridMajorColor: '#38bdf8',
      gridMinorColor: '#1e40af',
      rackFrameColor: '#93c5fd',
      floorStyle: 'blueprint_grid',
      exposure: 1.32,
      ambientIntensity: 1.5,
      sunIntensity: 1.75,
      fogDensityPct: 5,
    },
  },
  {
    id: 'cyber-night',
    nameKo: '다크 네온 디지털 트윈',
    nameEn: 'Dark Neon Digital Twin',
    badge: 'Dark',
    settings: {
      useThemeDefault: false,
      skyTopColor: '#0f172a',
      skyHorizonColor: '#1e293b',
      floorColor: '#1e293b',
      gridMajorColor: '#38bdf8',
      gridMinorColor: '#334155',
      rackFrameColor: '#94a3b8',
      floorStyle: 'blueprint_grid',
      exposure: 1.25,
      ambientIntensity: 1.35,
      sunIntensity: 1.65,
      fogDensityPct: 12,
    },
  },
  {
    id: 'sync-theme',
    nameKo: 'UI 디자인 테마 색상과 동기화',
    nameEn: 'Sync with Active UI Design Theme',
    badge: 'Auto',
    settings: {
      useThemeDefault: true,
      skyTopColor: '#e0f2fe',
      skyHorizonColor: '#f8fafc',
      floorColor: '#e2e8f0',
      gridMajorColor: '#94a3b8',
      gridMinorColor: '#cbd5e1',
      rackFrameColor: '#334155',
      floorStyle: 'glossy_tile',
      exposure: 1.32,
      ambientIntensity: 1.5,
      sunIntensity: 1.75,
      fogDensityPct: 0,
    },
  },
];

export const DEFAULT_SCENE_3D_BACKGROUND: Scene3DBackgroundSettings = {
  presetId: 'daylight-studio',
  ...SCENE_3D_PRESETS[0].settings,
  showGrid: true,
  showRoomProps: true,
  showHeaderSign: true,
  showBoxOutlines: true,
  enableShadows: true,
  xrayBins: false,
};

interface Scene3DBackgroundModalProps {
  open: boolean;
  onClose: () => void;
  settings: Scene3DBackgroundSettings;
  onChange: (next: Scene3DBackgroundSettings) => void;
  lang?: LangCode;
}

export const Scene3DBackgroundModal: React.FC<Scene3DBackgroundModalProps> = ({
  open,
  onClose,
  settings,
  onChange,
  lang = 'ko',
}) => {
  if (!open) return null;

  const applyPreset = (preset: Scene3DPreset) => {
    onChange({
      ...settings,
      presetId: preset.id,
      ...preset.settings,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--t-border)] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Sun className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold">
                {lang === 'ko'
                  ? '3D 배경 화면 & 조명 스튜디오 에디터'
                  : '3D Background & Lighting Studio Editor'}
              </h3>
              <p className="text-[11px] text-[var(--t-muted)]">
                {lang === 'ko'
                  ? '3D 작업창의 하늘·바닥 색상, 바닥 재질, 조명 밝기, 안개, 소품 및 박스 윤곽선을 자유롭게 편집합니다'
                  : 'Customize 3D sky & floor colors, floor material, lighting exposure, fog, room props & carton outlines'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(DEFAULT_SCENE_3D_BACKGROUND)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--t-border)] px-2.5 py-1 text-xs text-[var(--t-muted)] hover:text-[var(--t-text)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {lang === 'ko' ? '밝은 기본값 복원' : 'Reset Bright Default'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--t-muted)] hover:bg-[var(--t-surface-alt)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 text-xs">
          {/* 1. 12 Instant 3D Background & Lighting Presets */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-bold">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                {lang === 'ko'
                  ? '1. 원클릭 3D 배경·조명 프리셋 (12종)'
                  : '1. 1-Click 3D Background & Lighting Presets (12)'}
              </span>
              <span className="text-[11px] text-[var(--t-muted)]">
                {lang === 'ko'
                  ? '클릭 즉시 3D 작업창에 실시간 반영됩니다'
                  : 'Applies to 3D viewport in real time'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SCENE_3D_PRESETS.map((p) => {
                const active = settings.presetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-left transition ${
                      active
                        ? 'border-cyan-400 bg-cyan-500/15 ring-2 ring-cyan-400/50'
                        : 'border-[var(--t-border)] bg-[var(--t-surface-alt)] hover:border-cyan-400/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-bold">
                        {lang === 'ko' ? p.nameKo : p.nameEn}
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-slate-500/40"
                          style={{ backgroundColor: p.settings.skyTopColor }}
                          title="Sky Top"
                        />
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-slate-500/40"
                          style={{ backgroundColor: p.settings.floorColor }}
                          title="Floor"
                        />
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-slate-500/40"
                          style={{ backgroundColor: p.settings.rackFrameColor }}
                          title="Rack Frame"
                        />
                        <span className="ml-1 text-[10px] text-[var(--t-muted)]">
                          {Math.round(p.settings.exposure * 100)}%
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300">
                      {p.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Custom Color Pickers & Floor Material */}
          <section className="space-y-3 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-bold">
                <Palette className="h-3.5 w-3.5 text-cyan-400" />
                {lang === 'ko'
                  ? '2. 3D 배경·바닥·선반 색상 및 바닥 재질 커스텀'
                  : '2. Custom 3D Colors & Floor Surface Material'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(
                [
                  [
                    'skyTopColor',
                    lang === 'ko' ? '하늘 상단 색' : 'Sky Top',
                  ],
                  [
                    'skyHorizonColor',
                    lang === 'ko' ? '지평선 배경색' : 'Horizon',
                  ],
                  [
                    'floorColor',
                    lang === 'ko' ? '3D 바닥 색상' : '3D Floor',
                  ],
                  [
                    'gridMajorColor',
                    lang === 'ko' ? '그리드 눈금색' : 'Grid Line',
                  ],
                  [
                    'rackFrameColor',
                    lang === 'ko' ? '선반 기둥 색' : 'Rack Frame',
                  ],
                ] as const
              ).map(([field, label]) => (
                <label
                  key={field}
                  className="flex flex-col gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] p-2"
                >
                  <span className="text-[10px] font-medium text-[var(--t-muted)]">
                    {label}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings[field]}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          presetId: 'custom',
                          useThemeDefault: false,
                          [field]: e.target.value,
                        })
                      }
                      className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent"
                    />
                    <span className="font-mono text-[10px]">
                      {settings[field]}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-medium text-[var(--t-muted)]">
                {lang === 'ko' ? '3D 바닥 표면 스타일' : '3D Floor Surface Style'}
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    [
                      'glossy_tile',
                      lang === 'ko'
                        ? '밝은 쇼룸 타일'
                        : 'Glossy Showroom Tile',
                    ],
                    [
                      'warm_wood',
                      lang === 'ko' ? '따뜻한 원목 마루' : 'Warm Wood Floor',
                    ],
                    [
                      'clean_concrete',
                      lang === 'ko'
                        ? '클린 매트 콘크리트'
                        : 'Clean Matte Concrete',
                    ],
                    [
                      'blueprint_grid',
                      lang === 'ko' ? 'CAD 블루프린트' : 'CAD Blueprint',
                    ],
                  ] as const
                ).map(([styleId, label]) => (
                  <button
                    key={styleId}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...settings,
                        floorStyle: styleId,
                      })
                    }
                    className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition ${
                      settings.floorStyle === styleId
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                        : 'border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-muted)] hover:text-[var(--t-text)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 3. Lighting Exposure, Sun, Ambient & Fog Sliders */}
          <section className="space-y-3 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-4">
            <div className="flex items-center gap-1.5 font-bold">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              {lang === 'ko'
                ? '3. 3D 조명 밝기·노출·안개 정밀 조절'
                : '3. 3D Lighting Exposure, Brightness & Fog'}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--t-muted)]">
                    {lang === 'ko'
                      ? '전체 화면 밝기 (Tone Exposure)'
                      : 'Overall Brightness (Exposure)'}
                  </span>
                  <span className="font-bold text-amber-400">
                    {Math.round(settings.exposure * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.75}
                  max={2.2}
                  step={0.05}
                  value={settings.exposure}
                  onChange={(e) =>
                    onChange({ ...settings, exposure: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--t-muted)]">
                    {lang === 'ko'
                      ? '환경 자연광 세기 (Ambient Light)'
                      : 'Ambient & Sky Fill Light'}
                  </span>
                  <span className="font-bold text-cyan-400">
                    {settings.ambientIntensity.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.6}
                  step={0.05}
                  value={settings.ambientIntensity}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      ambientIntensity: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--t-muted)]">
                    {lang === 'ko'
                      ? '주조명 직사광 세기 (Sun Key Light)'
                      : 'Directional Sun Key Light'}
                  </span>
                  <span className="font-bold text-emerald-400">
                    {settings.sunIntensity.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.8}
                  step={0.05}
                  value={settings.sunIntensity}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      sunIntensity: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--t-muted)]">
                    {lang === 'ko'
                      ? '원거리 안개 농도 (0% = 선명함)'
                      : 'Distance Fog Density (0% = Crisp)'}
                  </span>
                  <span className="font-bold">
                    {settings.fogDensityPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={2}
                  value={settings.fogDensityPct}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      fogDensityPct: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full accent-cyan-400"
                />
              </div>
            </div>
          </section>

          {/* 4. 3D Scene Elements & Visual Clarity Toggles */}
          <section className="space-y-2.5 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-4">
            <div className="flex items-center gap-1.5 font-bold">
              <Eye className="h-3.5 w-3.5 text-emerald-400" />
              {lang === 'ko'
                ? '4. 3D 작업창 구성요소 & 선명도 옵션'
                : '4. 3D Studio Elements & Visual Clarity Options'}
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {(
                [
                  [
                    'showBoxOutlines',
                    lang === 'ko'
                      ? '적재 박스 윤곽선 강조'
                      : 'Crisp Carton Outlines',
                  ],
                  [
                    'showRoomProps',
                    lang === 'ko'
                      ? '공간별 3D 인테리어 소품'
                      : '3D Room & Facility Props',
                  ],
                  [
                    'showHeaderSign',
                    lang === 'ko'
                      ? '3D 공간 상단 타이틀 보드'
                      : '3D Space Header Sign',
                  ],
                  [
                    'showGrid',
                    lang === 'ko'
                      ? '바닥 1m 눈금 그리드'
                      : '1m Floor Grid Lines',
                  ],
                  [
                    'enableShadows',
                    lang === 'ko'
                      ? '입체 그림자 렌더링'
                      : 'Soft 3D Shadows',
                  ],
                  [
                    'xrayBins',
                    lang === 'ko'
                      ? '선반 X-Ray 반투명 투시'
                      : 'X-Ray Translucent Racks',
                  ],
                ] as const
              ).map(([field, label]) => (
                <label
                  key={field}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] px-3 py-2 hover:border-cyan-400/50"
                >
                  <input
                    type="checkbox"
                    checked={settings[field]}
                    onChange={(e) =>
                      onChange({ ...settings, [field]: e.target.checked })
                    }
                    className="h-4 w-4 accent-cyan-400"
                  />
                  <span className="text-[11px] font-medium">{label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
