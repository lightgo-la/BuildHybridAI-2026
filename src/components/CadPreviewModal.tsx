import React, { useMemo, useState } from 'react';
import { Download, FileCode2, Printer, Ruler, X } from 'lucide-react';
import { type LangCode, t } from '../i18n/translations';
import type { SlottingResult, WarehouseConfig } from '../types/warehouse';
import {
  type CadExportOptions,
  generateWarehouseDXF,
  generateWarehouseSVG,
} from '../utils/cadExporter';

interface CadPreviewModalProps {
  open: boolean;
  onClose: () => void;
  result: SlottingResult;
  config: WarehouseConfig;
  scenarioName: string;
  lang?: LangCode;
}

function triggerTextDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const CadPreviewModal: React.FC<CadPreviewModalProps> = ({
  open,
  onClose,
  result,
  config,
  scenarioName,
  lang = 'en',
}) => {
  const [options, setOptions] = useState<CadExportOptions>({
    includeCartons: true,
    includePickRoute: true,
    includeLabels: true,
    includeElevation: true,
    planLevelFilter: 'all',
  });

  const svgMarkup = useMemo(
    () =>
      open ? generateWarehouseSVG(result, config, scenarioName, options) : '',
    [open, result, config, scenarioName, options]
  );

  if (!open) return null;

  const safeSlug =
    scenarioName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'cubislot-plan';

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const handleDownloadDxf = () => {
    const dxf = generateWarehouseDXF(result, config, scenarioName, options);
    triggerTextDownload(
      `${safeSlug}-${result.mode}.dxf`,
      dxf,
      'application/dxf'
    );
  };

  const handleDownloadSvg = () => {
    triggerTextDownload(
      `${safeSlug}-${result.mode}.svg`,
      svgMarkup,
      'image/svg+xml'
    );
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=1100,height=780');
    if (!win) return;
    win.document.write(
      `<!doctype html><html><head><title>CubiSlot 2D CAD - ${escapeHtml(scenarioName)}</title><style>body{margin:0;background:#071326;display:flex;justify-content:center;align-items:center;min-height:100vh}svg{max-width:100%;height:auto}</style></head><body>${svgMarkup}</body></html>`
    );
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text)] shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--t-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-[var(--t-accent)]" />
            <div>
              <h3 className="text-sm font-bold">
                {t(lang, 'cadTitle')}
              </h3>
              <p className="text-[11px] text-[var(--t-muted)]">
                {t(lang, 'cadSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleDownloadDxf}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold"
              style={{
                backgroundColor: 'var(--t-accent)',
                color: 'var(--t-accent-text)',
              }}
            >
              <FileCode2 className="h-3.5 w-3.5" />
              {t(lang, 'cadDownloadDxf')}
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-3 py-1.5 font-medium hover:border-[var(--t-accent)]"
            >
              <Download className="h-3.5 w-3.5" />
              {t(lang, 'cadDownloadSvg')}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-3 py-1.5 font-medium hover:border-[var(--t-accent)]"
            >
              <Printer className="h-3.5 w-3.5" />
              {t(lang, 'cadPrint')}
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

        <div className="flex flex-wrap items-center gap-4 border-b border-[var(--t-border)] bg-[var(--t-surface-alt)] px-4 py-2 text-[11px]">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={options.includeCartons}
              onChange={(e) =>
                setOptions((o) => ({ ...o, includeCartons: e.target.checked }))
              }
              className="accent-[var(--t-accent)]"
            />
            {'Packed Cartons'}
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={options.includePickRoute}
              onChange={(e) =>
                setOptions((o) => ({ ...o, includePickRoute: e.target.checked }))
              }
              className="accent-[var(--t-accent)]"
            />
            {'Pick Route'}
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={options.includeLabels}
              onChange={(e) =>
                setOptions((o) => ({ ...o, includeLabels: e.target.checked }))
              }
              className="accent-[var(--t-accent)]"
            />
            {'CAD Callouts'}
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={options.includeElevation}
              onChange={(e) =>
                setOptions((o) => ({ ...o, includeElevation: e.target.checked }))
              }
              className="accent-[var(--t-accent)]"
            />
            {'Z-Elevation View'}
          </label>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[var(--t-muted)]">
              {'Plan Slice:'}
            </span>
            <select
              value={String(options.planLevelFilter)}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  planLevelFilter:
                    e.target.value === 'all' ? 'all' : Number(e.target.value),
                }))
              }
              className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-0.5 text-[11px]"
            >
              <option value="all">
                {'All Levels'}
              </option>
              {Array.from(
                {
                  length: result.allocations.reduce(
                    (max, a) => Math.max(max, a.bin.level),
                    config.levels
                  ),
                },
                (_, i) => i + 1
              ).map((lvl) => (
                <option key={lvl} value={lvl}>
                  {`Level Z${lvl}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[#071326] p-4">
          <div
            className="mx-auto w-fit rounded-lg border border-sky-500/30 shadow-xl"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        </div>
      </div>
    </div>
  );
};
