import React from 'react';
import {
  Copy,
  Home,
  Keyboard,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { LangCode } from '../i18n/translations';
import type {
  InteriorProp,
  InteriorPropType,
  RoomEnclosureStyle,
} from '../types/warehouse';

export interface InteriorCatalogEntry {
  type: InteriorPropType;
  icon: string;
  nameKo: string;
  nameEn: string;
  defaultColor: string;
}

export const INTERIOR_PROP_CATALOG: InteriorCatalogEntry[] = [
  {
    type: 'desk_work',
    icon: '🖥️',
    nameKo: 'Study & Packing Desk',
    nameEn: 'Study & Packing Desk',
    defaultColor: '#b45309',
  },
  {
    type: 'island_counter',
    icon: '🍽️',
    nameKo: 'Kitchen / Cafe Counter',
    nameEn: 'Kitchen / Cafe Counter',
    defaultColor: '#d97706',
  },
  {
    type: 'fridge_unit',
    icon: '🧊',
    nameKo: 'French-Door Refrigerator',
    nameEn: 'French-Door Refrigerator',
    defaultColor: '#38bdf8',
  },
  {
    type: 'washer_dryer',
    icon: '🫧',
    nameKo: 'Front-Load Washer',
    nameEn: 'Front-Load Washer',
    defaultColor: '#f8fafc',
  },
  {
    type: 'wardrobe_mirror',
    icon: '🪞',
    nameKo: 'Full-Length Mirror',
    nameEn: 'Full-Length Mirror',
    defaultColor: '#fbbf24',
  },
  {
    type: 'sofa_lounge',
    icon: '🛋️',
    nameKo: 'Cozy Lounge Sofa',
    nameEn: 'Cozy Lounge Sofa',
    defaultColor: '#6366f1',
  },
  {
    type: 'window_frame',
    icon: '🪟',
    nameKo: 'Daylight Window',
    nameEn: 'Daylight Window',
    defaultColor: '#fef08a',
  },
  {
    type: 'door_entry',
    icon: '🚪',
    nameKo: 'Room Entrance Door',
    nameEn: 'Room Entrance Door',
    defaultColor: '#92400e',
  },
  {
    type: 'plant_pot',
    icon: '🪴',
    nameKo: 'Indoor Monstera Plant',
    nameEn: 'Indoor Monstera Plant',
    defaultColor: '#10b981',
  },
  {
    type: 'rug_carpet',
    icon: '🧶',
    nameKo: 'Floor Carpet Runner',
    nameEn: 'Floor Carpet Runner',
    defaultColor: '#be185d',
  },
  {
    type: 'tool_cabinet',
    icon: '🧰',
    nameKo: 'Rolling Tool Cabinet',
    nameEn: 'Rolling Tool Cabinet',
    defaultColor: '#dc2626',
  },
  {
    type: 'forklift_unit',
    icon: '🚜',
    nameKo: '3D Reach-Truck Forklift',
    nameEn: '3D Reach-Truck Forklift',
    defaultColor: '#f59e0b',
  },
];

export const KEYBOARD_SHORTCUT_LIST: Array<{
  keyLabel: string;
  descKo: string;
  descEn: string;
}> = [
  {
    keyLabel: '1 / 2 / 3',
    descKo: 'Switch Camera Preset (1: 3D Iso, 2: 2D Top, 3: Z-Elevation)',
    descEn: 'Switch Camera Preset (1: 3D Iso, 2: 2D Top, 3: Z-Elevation)',
  },
  {
    keyLabel: 'R',
    descKo: 'Reset 3D Camera Framing to Center',
    descEn: 'Reset 3D Camera Framing to Center',
  },
  {
    keyLabel: 'Space',
    descKo: 'Toggle Before (2D Baseline) ↔ After (3D Optimized)',
    descEn: 'Toggle Before (2D Baseline) ↔ After (3D Optimized)',
  },
  {
    keyLabel: 'M',
    descKo: 'Toggle 3D Mouse Drag-Move Mode (Racks & Interior Furniture)',
    descEn: 'Toggle 3D Mouse Drag-Move Mode (Racks & Interior Furniture)',
  },
  {
    keyLabel: 'I',
    descKo: 'Open 3D Space Interior & Furniture Studio',
    descEn: 'Open 3D Space Interior & Furniture Studio',
  },
  {
    keyLabel: 'B',
    descKo: 'Open 3D Background & Lighting Studio',
    descEn: 'Open 3D Background & Lighting Studio',
  },
  {
    keyLabel: 'E',
    descKo: 'Open 2D Free-Canvas Map Editor',
    descEn: 'Open 2D Free-Canvas Map Editor',
  },
  {
    keyLabel: 'T',
    descKo: 'Open 24-Template Library Gallery',
    descEn: 'Open 24-Template Library Gallery',
  },
  {
    keyLabel: 'C',
    descKo: 'Open 2D CAD Blueprint (.DXF / .SVG) Exporter',
    descEn: 'Open 2D CAD Blueprint (.DXF / .SVG) Exporter',
  },
  {
    keyLabel: 'G / H',
    descKo: 'G: Golden Zone View · H: Pick Frequency Heatmap View',
    descEn: 'G: Golden Zone View · H: Pick Frequency Heatmap View',
  },
  {
    keyLabel: 'W / L',
    descKo: 'W: Everyday Home ↔ 3D Studio · L: Toggle Korean ↔ English',
    descEn: 'W: Everyday Home ↔ 3D Studio · L: Toggle Korean ↔ English',
  },
  {
    keyLabel: '← ↑ ↓ →',
    descKo: 'Nudge Selected 3D Furniture Prop or Rack Column by 0.25m',
    descEn: 'Nudge Selected 3D Furniture Prop or Rack Column by 0.25m',
  },
  {
    keyLabel: '[ / ]',
    descKo: 'Rotate Selected 3D Interior Furniture Prop by 45°',
    descEn: 'Rotate Selected 3D Interior Furniture Prop by 45°',
  },
  {
    keyLabel: '+ / Delete',
    descKo: '+: Add +1 Z-Level Above Bin · Delete: Remove Selected Bin/Prop',
    descEn: '+: Add +1 Z-Level Above Bin · Delete: Remove Selected Bin/Prop',
  },
  {
    keyLabel: 'Ctrl+Z / Ctrl+Y',
    descKo: 'Undo / Redo 3D Workspace Edits',
    descEn: 'Undo / Redo 3D Workspace Edits',
  },
  {
    keyLabel: '? (or K)',
    descKo: 'Toggle Keyboard Shortcuts & Interior Studio Modal',
    descEn: 'Toggle Keyboard Shortcuts & Interior Studio Modal',
  },
];

interface InteriorStudioModalProps {
  open: boolean;
  initialTab?: 'interior' | 'shortcuts';
  onClose: () => void;
  lang: LangCode;
  interiorProps: InteriorProp[];
  selectedPropId: string | null;
  roomEnclosure: RoomEnclosureStyle;
  wallColor: string;
  onSelectProp: (id: string | null) => void;
  onAddProp: (type: InteriorPropType) => void;
  onUpdateProp: (id: string, patch: Partial<InteriorProp>) => void;
  onDuplicateProp: (id: string) => void;
  onDeleteProp: (id: string) => void;
  onClearProps: () => void;
  onAutoPopulateInterior: () => void;
  onChangeRoomEnclosure: (style: RoomEnclosureStyle) => void;
  onChangeWallColor: (color: string) => void;
}

export const InteriorStudioModal: React.FC<InteriorStudioModalProps> = ({
  open,
  initialTab = 'interior',
  onClose,
  lang,
  interiorProps,
  selectedPropId,
  roomEnclosure,
  wallColor,
  onSelectProp,
  onAddProp,
  onUpdateProp,
  onDuplicateProp,
  onDeleteProp,
  onClearProps,
  onAutoPopulateInterior,
  onChangeRoomEnclosure,
  onChangeWallColor,
}) => {
  const [tab, setTab] = React.useState<'interior' | 'shortcuts'>(initialTab);

  React.useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text)] shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--t-border)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('interior')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                tab === 'interior'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-[var(--t-surface-alt)] text-[var(--t-muted)] hover:text-[var(--t-text)]'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              {lang === 'ko'
                ? `3D Space Interior & Props (${interiorProps.length})`
                : `3D Space Interior & Props (${interiorProps.length})`}
            </button>
            <button
              type="button"
              onClick={() => setTab('shortcuts')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                tab === 'shortcuts'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-[var(--t-surface-alt)] text-[var(--t-muted)] hover:text-[var(--t-text)]'
              }`}
            >
              <Keyboard className="h-3.5 w-3.5" />
              {lang === 'ko'
                ? 'Keyboard Shortcuts Guide'
                : 'Keyboard Shortcuts Guide'}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--t-muted)] hover:bg-[var(--t-surface-alt)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {tab === 'interior' ? (
          <div className="flex-1 space-y-5 overflow-y-auto p-5 text-xs">
            <section className="space-y-3 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">
                  {lang === 'ko'
                    ? '1. 3D Room Wall Enclosure & Wall Color'
                    : '1. 3D Room Wall Enclosure & Wall Color'}
                </span>
                <button
                  type="button"
                  onClick={onAutoPopulateInterior}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {lang === 'ko'
                    ? 'Auto-Populate Matching Room Interior'
                    : 'Auto-Populate Matching Room Interior'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(
                  [
                    [
                      'cutaway_corner',
                      lang === 'ko' ? 'L-Cutaway Room' : 'L-Cutaway Room',
                    ],
                    [
                      'three_walls',
                      lang === 'ko' ? '3-Wall Room' : '3-Wall Room',
                    ],
                    [
                      'glass_room',
                      lang === 'ko' ? 'Glass Showroom' : 'Glass Showroom',
                    ],
                    [
                      'open_floor',
                      lang === 'ko' ? 'Open Floor' : 'Open Floor',
                    ],
                  ] as const
                ).map(([styleId, label]) => (
                  <button
                    key={styleId}
                    type="button"
                    onClick={() => onChangeRoomEnclosure(styleId)}
                    className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition ${
                      roomEnclosure === styleId
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : 'border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-muted)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}

                <label className="flex items-center justify-between rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] px-3 py-1.5">
                  <span className="text-[10px] font-medium text-[var(--t-muted)]">
                    {lang === 'ko' ? 'Wall Color' : 'Wall Color'}
                  </span>
                  <input
                    type="color"
                    value={wallColor}
                    onChange={(e) => onChangeWallColor(e.target.value)}
                    className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {lang === 'ko'
                    ? '2. 1-Click Add 3D Furniture, Appliances, Doors & Windows'
                    : '2. 1-Click Add 3D Furniture, Appliances, Doors & Windows'}
                </span>
                <span className="text-[11px] text-[var(--t-muted)]">
                  {lang === 'ko'
                    ? 'Click & drag props in 3D or nudge with Arrow keys!'
                    : 'Click & drag props in 3D or nudge with Arrow keys!'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {INTERIOR_PROP_CATALOG.map((item) => {
                  const matchingProps = interiorProps.filter(
                    (p) => p.type === item.type
                  );
                  const count = matchingProps.length;
                  return (
                    <div
                      key={item.type}
                      className={`flex flex-col justify-between gap-2 rounded-xl border p-2.5 text-left transition ${
                        count > 0
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-[var(--t-border)] bg-[var(--t-surface-alt)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl">{item.icon}</span>
                          <div className="truncate text-[11px] font-bold">
                            {lang === 'ko' ? item.nameKo : item.nameEn}
                          </div>
                        </div>
                        {count > 0 && (
                          <span className="shrink-0 rounded-full bg-emerald-500/25 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                            {count}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAddProp(item.type)}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/30"
                        >
                          <Plus className="h-3 w-3" />
                          {lang === 'ko' ? 'Add' : 'Add'}
                        </button>
                        {count > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onDeleteProp(
                                matchingProps[matchingProps.length - 1].id
                              )
                            }
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-500/25"
                            title={
                              lang === 'ko'
                                ? 'Remove 1 placed prop of this type'
                                : 'Remove 1 placed prop of this type'
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                            {lang === 'ko' ? 'Del' : 'Del'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-2.5 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {lang === 'ko'
                    ? `3. Placed 3D Interior Props (${interiorProps.length})`
                    : `3. Placed 3D Interior Props (${interiorProps.length})`}
                </span>
                {interiorProps.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearProps}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    {lang === 'ko' ? 'Clear All Props' : 'Clear All Props'}
                  </button>
                )}
              </div>

              {interiorProps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--t-border)] p-4 text-center text-[var(--t-muted)]">
                  {lang === 'ko'
                    ? 'Click any furniture or appliance card above to place it in 3D space.'
                    : 'Click any furniture or appliance card above to place it in 3D space.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {interiorProps.map((prop) => {
                    const meta = INTERIOR_PROP_CATALOG.find(
                      (c) => c.type === prop.type
                    );
                    const isSel = prop.id === selectedPropId;
                    return (
                      <div
                        key={prop.id}
                        onClick={() => onSelectProp(prop.id)}
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 transition ${
                          isSel
                            ? 'border-emerald-400 bg-emerald-500/10'
                            : 'border-[var(--t-border)] bg-[var(--t-surface)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{meta?.icon ?? '🛋️'}</span>
                          <div>
                            <div className="text-[11px] font-bold">
                              {prop.label}
                            </div>
                            <div className="text-[10px] text-[var(--t-muted)]">
                              X: {prop.xMeters.toFixed(2)}m · Y:{' '}
                              {prop.yMeters.toFixed(2)}m · {prop.rotationDeg}° ·{' '}
                              {prop.scale.toFixed(1)}x
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateProp(prop.id, {
                                xMeters: Number((prop.xMeters - 0.5).toFixed(2)),
                              });
                            }}
                            className="rounded border border-[var(--t-border)] px-2 py-1 hover:border-cyan-400"
                            title="Move Left (-X)"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateProp(prop.id, {
                                xMeters: Number((prop.xMeters + 0.5).toFixed(2)),
                              });
                            }}
                            className="rounded border border-[var(--t-border)] px-2 py-1 hover:border-cyan-400"
                            title="Move Right (+X)"
                          >
                            →
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateProp(prop.id, {
                                yMeters: Number((prop.yMeters - 0.5).toFixed(2)),
                              });
                            }}
                            className="rounded border border-[var(--t-border)] px-2 py-1 hover:border-cyan-400"
                            title="Move Front (-Y)"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateProp(prop.id, {
                                yMeters: Number((prop.yMeters + 0.5).toFixed(2)),
                              });
                            }}
                            className="rounded border border-[var(--t-border)] px-2 py-1 hover:border-cyan-400"
                            title="Move Back (+Y)"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateProp(prop.id, {
                                rotationDeg: (prop.rotationDeg + 45) % 360,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded border border-[var(--t-border)] px-2 py-1 hover:border-cyan-400"
                            title="Rotate 45°"
                          >
                            <RotateCw className="h-3 w-3" />
                            {prop.rotationDeg}°
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextScale =
                                prop.scale >= 1.6
                                  ? 0.8
                                  : Number((prop.scale + 0.2).toFixed(1));
                              onUpdateProp(prop.id, { scale: nextScale });
                            }}
                            className="rounded border border-[var(--t-border)] px-2 py-1 hover:border-cyan-400"
                            title="Cycle Size Scale"
                          >
                            {prop.scale.toFixed(1)}x
                          </button>
                          <input
                            type="color"
                            value={prop.color}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              onUpdateProp(prop.id, { color: e.target.value })
                            }
                            className="h-6 w-7 cursor-pointer border-0 bg-transparent"
                            title="Change Color"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateProp(prop.id);
                            }}
                            className="rounded border border-[var(--t-border)] p-1 hover:border-cyan-400"
                            title="Duplicate"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProp(prop.id);
                            }}
                            className="rounded border border-rose-500/40 bg-rose-500/15 p-1 text-rose-300 hover:bg-rose-500/25"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto p-5 text-xs">
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-[11px] text-cyan-200">
              {lang === 'ko'
                ? '💡 Press any shortcut key below (outside text inputs) to control the 3D camera, layout mode, drag-move, and interior furniture.'
                : '💡 Press any shortcut key below (outside text inputs) to control the 3D camera, layout mode, drag-move, and interior furniture.'}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {KEYBOARD_SHORTCUT_LIST.map((item) => (
                <div
                  key={item.keyLabel}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-3.5 py-2.5"
                >
                  <span className="text-[11px] text-[var(--t-text)]">
                    {lang === 'ko' ? item.descKo : item.descEn}
                  </span>
                  <kbd className="shrink-0 rounded-lg border border-cyan-500/40 bg-slate-950 px-2.5 py-1 font-mono text-[11px] font-bold text-cyan-300 shadow">
                    {item.keyLabel}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
