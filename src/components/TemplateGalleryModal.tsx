import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Check,
  Home,
  LayoutGrid,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  TEMPLATE_CATEGORY_LABELS,
  WAREHOUSE_TEMPLATES,
} from '../data/warehouseTemplates';
import { type LangCode, t } from '../i18n/translations';
import type { TemplateCategory, WarehouseTemplate } from '../types/warehouse';

interface TemplateGalleryModalProps {
  open: boolean;
  onClose: () => void;
  activeTemplateId: string;
  onSelectTemplate: (tpl: WarehouseTemplate) => void;
  lang?: LangCode;
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  open,
  onClose,
  activeTemplateId,
  onSelectTemplate,
  lang = 'en',
}) => {
  const [personaFilter, setPersonaFilter] = useState<
    'all' | 'professional' | 'everyday'
  >('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TemplateCategory>(
    'all'
  );
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return WAREHOUSE_TEMPLATES.filter((t) => {
      if (personaFilter !== 'all' && t.persona !== personaFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.highlights.toLowerCase().includes(q) ||
        t.skus.some((s) => s.name.toLowerCase().includes(q))
      );
    });
  }, [personaFilter, categoryFilter, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text)] shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--t-border)] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="h-5 w-5 text-[var(--t-accent)]" />
            <div>
              <h3 className="text-sm font-bold">
                {t(lang, 'tplModalTitle')} ({WAREHOUSE_TEMPLATES.length})
              </h3>
              <p className="text-[11px] text-[var(--t-muted)]">
                {t(lang, 'tplModalSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--t-muted)] hover:bg-[var(--t-surface-alt)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--t-border)] bg-[var(--t-surface-alt)] px-5 py-2.5 text-xs">
          <div className="flex overflow-hidden rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)]">
            {(
              [
                [
                  'all',
                  lang === 'ko'
                    ? `All (${WAREHOUSE_TEMPLATES.length})`
                    : `All (${WAREHOUSE_TEMPLATES.length})`,
                  null,
                ],
                [
                  'professional',
                  lang === 'ko' ? 'Pro Logistics (12)' : 'Pro Logistics (12)',
                  Briefcase,
                ],
                [
                  'everyday',
                  lang === 'ko' ? 'Everyday / Home (12)' : 'Everyday / Home (12)',
                  Home,
                ],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPersonaFilter(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium ${
                  personaFilter === id
                    ? 'bg-[var(--t-accent)] font-semibold text-[var(--t-accent-text)]'
                    : 'text-[var(--t-muted)]'
                }`}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {label}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'all' | TemplateCategory)
            }
            className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] px-2.5 py-1.5 text-[11px]"
          >
            <option value="all">
              {lang === 'ko' ? 'All Categories' : 'All Categories'}
            </option>
            {(
              Object.entries(TEMPLATE_CATEGORY_LABELS) as Array<
                [TemplateCategory, string]
              >
            ).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          <div className="relative ml-auto min-w-[210px] flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--t-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, 'tplSearchPlaceholder')}
              className="w-full rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] py-1.5 pl-8 pr-3 text-[11px] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tpl) => {
            const isSelected = tpl.id === activeTemplateId;
            const totalUnits = tpl.skus.reduce((acc, s) => acc + s.quantity, 0);
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  onSelectTemplate(tpl);
                  onClose();
                }}
                className={`flex flex-col justify-between overflow-hidden rounded-xl border text-left transition ${
                  isSelected
                    ? 'border-[var(--t-accent)] bg-[var(--t-surface-alt)] ring-2 ring-[var(--t-accent)]'
                    : 'border-[var(--t-border)] bg-[var(--t-surface-alt)] hover:border-[var(--t-accent)]'
                }`}
              >
                {tpl.imageUrl && (
                  <div className="relative aspect-video w-full overflow-hidden border-b border-[var(--t-border)] bg-slate-950">
                    <img
                      src={tpl.imageUrl}
                      alt={tpl.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase backdrop-blur ${
                        tpl.persona === 'everyday'
                          ? 'bg-emerald-950/85 text-emerald-300'
                          : 'bg-sky-950/85 text-sky-300'
                      }`}
                    >
                      {tpl.persona === 'everyday'
                        ? lang === 'ko'
                          ? 'Everyday'
                          : 'Everyday'
                        : 'Pro'}
                    </span>
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-between p-3.5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold leading-snug">
                      {tpl.name}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--t-muted)]">
                    {tpl.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tpl.skus.map((sku) => (
                      <span
                        key={sku.id}
                        className="inline-flex items-center gap-1 rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--t-text)]"
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

                <div className="mt-3 space-y-1.5 border-t border-[var(--t-border)] pt-2.5 text-[10px]">
                  <div className="flex items-center gap-1 text-[var(--t-accent)]">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span className="truncate font-medium">
                      {tpl.highlights}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--t-muted)]">
                    <span>
                      {tpl.config.mapTag} · {tpl.config.binLengthCm}×
                      {tpl.config.binWidthCm}×{tpl.config.binHeightCm}cm
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--t-text)]">
                      {isSelected && <Check className="h-3 w-3 text-emerald-400" />}
                      {tpl.skus.length} SKUs ({totalUnits} units)
                    </span>
                  </div>
                </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
