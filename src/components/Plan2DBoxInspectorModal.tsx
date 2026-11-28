import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  ExternalLink,
  Layers,
  Map as MapIcon,
  Minus,
  PackagePlus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type {
  ABCClass,
  BinAllocation,
  SKUItem,
  SlottingResult,
  WarehouseConfig,
} from '../types/warehouse';
import { generateWarehouseSVG } from '../utils/cadExporter';

export interface Plan2DBoxInspectorModalProps {
  open: boolean;
  onClose: () => void;
  scenarioName: string;
  config: WarehouseConfig;
  result: SlottingResult;
  skus: SKUItem[];
  selectedBin: BinAllocation | null;
  onSelectBinWithoutZoom: (alloc: BinAllocation) => void;
  onSetBinTotalBoxQuota: (
    binId: string,
    totalBoxes: number,
    preferredSkuId?: string
  ) => void;
  onSetCargoCountInBin: (
    binId: string,
    skuId: string,
    exactCount: number
  ) => void;
  onPinCargo: (binId: string, skuId: string, deltaCount?: number) => void;
  onPlaceCustomBoxInBin: (params: {
    binId: string;
    name: string;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    weightKg: number;
    quantity: number;
    abcClass: ABCClass;
    fragile: boolean;
    color: string;
  }) => void;
  onAddBinAbove: (alloc: BinAllocation) => void;
}

const CUSTOM_COLORS = [
  '#22d3ee',
  '#34d399',
  '#f59e0b',
  '#fb7185',
  '#a78bfa',
  '#38bdf8',
];

export const Plan2DBoxInspectorModal: React.FC<
  Plan2DBoxInspectorModalProps
> = ({
  open,
  onClose,
  scenarioName,
  config,
  result,
  skus,
  selectedBin,
  onSelectBinWithoutZoom,
  onSetBinTotalBoxQuota,
  onSetCargoCountInBin,
  onPinCargo,
  onPlaceCustomBoxInBin,
  onAddBinAbove,
}) => {
  const activeBin = useMemo(() => {
    if (selectedBin) {
      return (
        result.allocations.find((a) => a.bin.id === selectedBin.bin.id) ??
        selectedBin
      );
    }
    return (
      result.allocations.find((a) => a.boxes.length > 0 && a.bin.isGoldenZone) ??
      result.allocations.find((a) => a.boxes.length > 0) ??
      result.allocations[0] ??
      null
    );
  }, [result.allocations, selectedBin]);

  const columnsByKey = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        aisle: number;
        bay: number;
        xMeters: number;
        yMeters: number;
        bins: BinAllocation[];
        totalBoxes: number;
        totalSkuTypes: number;
        totalWeightKg: number;
      }
    >();

    for (const alloc of result.allocations) {
      const key = `A${alloc.bin.aisle}-B${alloc.bin.bay}`;
      const existing = map.get(key);
      if (!existing) {
        const skuSet = new Set(alloc.boxes.map((b) => b.skuId));
        map.set(key, {
          key,
          aisle: alloc.bin.aisle,
          bay: alloc.bin.bay,
          xMeters: alloc.bin.xMeters,
          yMeters: alloc.bin.yMeters,
          bins: [alloc],
          totalBoxes: alloc.boxes.length,
          totalSkuTypes: skuSet.size,
          totalWeightKg: alloc.currentWeightKg,
        });
      } else {
        existing.bins.push(alloc);
        existing.totalBoxes += alloc.boxes.length;
        existing.totalWeightKg += alloc.currentWeightKg;
        const skuSet = new Set(
          existing.bins.flatMap((b) => b.boxes.map((x) => x.skuId))
        );
        existing.totalSkuTypes = skuSet.size;
      }
    }

    for (const col of map.values()) {
      col.bins.sort((a, b) => a.bin.level - b.bin.level);
    }

    return map;
  }, [result.allocations]);

  const activeColumn = useMemo(() => {
    if (!activeBin) return null;
    const key = `A${activeBin.bin.aisle}-B${activeBin.bin.bay}`;
    return columnsByKey.get(key) ?? null;
  }, [activeBin, columnsByKey]);

  const skuBreakdownInBin = useMemo(() => {
    if (!activeBin) return [];
    const grouped = new Map<
      string,
      {
        skuId: string;
        skuCode: string;
        name: string;
        abcClass: ABCClass;
        color: string;
        lengthCm: number;
        widthCm: number;
        heightCm: number;
        unitWeightKg: number;
        count: number;
        fragile: boolean;
      }
    >();

    for (const box of activeBin.boxes) {
      const prev = grouped.get(box.skuId);
      if (prev) {
        prev.count += 1;
      } else {
        grouped.set(box.skuId, {
          skuId: box.skuId,
          skuCode: box.skuCode,
          name: box.name,
          abcClass: box.abcClass,
          color: box.color,
          lengthCm: box.lengthCm,
          widthCm: box.widthCm,
          heightCm: box.heightCm,
          unitWeightKg: box.weightKg,
          count: 1,
          fragile: box.fragile,
        });
      }
    }
    return [...grouped.values()];
  }, [activeBin]);

  const [selectedAddSkuId, setSelectedAddSkuId] = useState<string>(
    skus[0]?.id ?? ''
  );
  const [addSkuQty, setAddSkuQty] = useState<number>(2);

  const [customName, setCustomName] = useState<string>('구성품 박스');
  const [customL, setCustomL] = useState<number>(34);
  const [customW, setCustomW] = useState<number>(26);
  const [customH, setCustomH] = useState<number>(22);
  const [customKg, setCustomKg] = useState<number>(4.0);
  const [customQty, setCustomQty] = useState<number>(2);
  const [customAbc, setCustomAbc] = useState<ABCClass>('A');
  const [customColor, setCustomColor] = useState<string>(CUSTOM_COLORS[0]);

  useEffect(() => {
    if (skus.length > 0 && !skus.some((s) => s.id === selectedAddSkuId)) {
      setSelectedAddSkuId(skus[0].id);
    }
  }, [skus, selectedAddSkuId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const totalWarehouseBoxes = useMemo(
    () => result.allocations.reduce((sum, a) => sum + a.boxes.length, 0),
    [result.allocations]
  );

  const totalWarehouseSkuTypes = useMemo(() => {
    const s = new Set<string>();
    for (const a of result.allocations) {
      for (const b of a.boxes) {
        s.add(b.skuId);
      }
    }
    return s.size;
  }, [result.allocations]);

  const handleOpenStandalonePopupWindow = () => {
    const win = window.open(
      '',
      'CubiSlot2DBoxInspectorWindow',
      'width=1280,height=880,resizable=yes,scrollbars=yes'
    );
    if (!win) return;

    const svgMarkup = generateWarehouseSVG(result, config, scenarioName, {
      includeCartons: true,
      includePickRoute: true,
      includeLabels: true,
      includeElevation: true,
      planLevelFilter: 'all',
    });

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const wAny = window as unknown as {
      __cubislotSetBinQuota?: (binId: string, qty: number) => void;
      __cubislotSetSkuCount?: (
        binId: string,
        skuId: string,
        qty: number
      ) => void;
    };

    wAny.__cubislotSetBinQuota = (binId: string, qty: number) => {
      onSetBinTotalBoxQuota(
        binId,
        Math.max(0, Math.min(100, Math.round(qty))),
        skus[0]?.id
      );
    };
    wAny.__cubislotSetSkuCount = (
      binId: string,
      skuId: string,
      qty: number
    ) => {
      onSetCargoCountInBin(binId, skuId, Math.max(0, Math.min(100, Math.round(qty))));
    };

    const rowsHtml = result.allocations
      .map((alloc) => {
        const skuCounts = new Map<
          string,
          { skuId: string; name: string; code: string; count: number; color: string }
        >();
        for (const b of alloc.boxes) {
          const cur = skuCounts.get(b.skuId);
          if (cur) {
            cur.count += 1;
          } else {
            skuCounts.set(b.skuId, {
              skuId: b.skuId,
              name: b.name.split(' (')[0],
              code: b.skuCode,
              count: 1,
              color: b.color,
            });
          }
        }
        const itemsHtml =
          skuCounts.size === 0
            ? `<span style="color:#64748b">비어 있음 (0개)</span>`
            : [...skuCounts.values()]
                .map(
                  (item) => `
                  <span style="display:inline-flex;align-items:center;gap:6px;background:#0f172a;border:1px solid #334155;border-radius:6px;padding:3px 8px;margin:2px;">
                    <span style="width:8px;height:8px;border-radius:50%;background:${escapeHtml(item.color)}"></span>
                    <strong>${escapeHtml(item.name)}</strong>
                    <span style="color:#94a3b8;font-size:11px">(${escapeHtml(item.code)})</span>
                    <button onclick="window.opener && window.opener.__cubislotSetSkuCount('${escapeHtml(alloc.bin.id)}','${escapeHtml(item.skuId)}',${Math.max(0, item.count - 1)}); setTimeout(()=>location.reload(), 60);" style="background:#1e293b;color:#e2e8f0;border:1px solid #475569;border-radius:4px;padding:0 6px;cursor:pointer">-</button>
                    <strong style="color:#34d399;font-family:monospace">${item.count}개</strong>
                    <button onclick="window.opener && window.opener.__cubislotSetSkuCount('${escapeHtml(alloc.bin.id)}','${escapeHtml(item.skuId)}',${item.count + 1}); setTimeout(()=>location.reload(), 60);" style="background:#1e293b;color:#e2e8f0;border:1px solid #475569;border-radius:4px;padding:0 6px;cursor:pointer">+</button>
                  </span>`
                )
                .join('');

        const isSel = activeBin?.bin.id === alloc.bin.id;
        return `
          <tr style="background:${isSel ? 'rgba(14,116,144,0.28)' : alloc.boxes.length > 0 ? 'rgba(15,23,42,0.75)' : 'rgba(15,23,42,0.35)'};border-bottom:1px solid #1e293b;">
            <td style="padding:8px 10px;font-family:monospace;font-weight:bold;color:${isSel ? '#facc15' : '#38bdf8'}">
              ${escapeHtml(alloc.bin.id)}
              ${alloc.bin.isGoldenZone ? '<span style="background:#065f46;color:#6ee7b7;font-size:10px;padding:1px 5px;border-radius:4px;margin-left:4px">★ 골든존</span>' : ''}
            </td>
            <td style="padding:8px 10px;color:#cbd5e1">Z${alloc.bin.level} (${alloc.bin.zMeters}m)</td>
            <td style="padding:8px 10px">
              <div style="display:inline-flex;align-items:center;gap:6px">
                <button onclick="window.opener && window.opener.__cubislotSetBinQuota('${escapeHtml(alloc.bin.id)}',${Math.max(0, alloc.boxes.length - 1)});" style="background:#1e293b;color:#fff;border:1px solid #475569;border-radius:4px;padding:2px 8px;cursor:pointer">-</button>
                <strong style="color:#fbbf24;font-family:monospace;font-size:14px">${alloc.boxes.length} 박스</strong>
                <button onclick="window.opener && window.opener.__cubislotSetBinQuota('${escapeHtml(alloc.bin.id)}',${alloc.boxes.length + 1});" style="background:#1e293b;color:#fff;border:1px solid #475569;border-radius:4px;padding:2px 8px;cursor:pointer">+</button>
              </div>
            </td>
            <td style="padding:8px 10px">${itemsHtml}</td>
            <td style="padding:8px 10px;font-family:monospace;color:#94a3b8">${alloc.cubicUtilizationPct.toFixed(1)}% (${alloc.currentWeightKg.toFixed(1)}/${alloc.bin.maxWeightKg}kg)</td>
          </tr>`;
      })
      .join('');

    const safeTitle = escapeHtml(scenarioName);
    win.document.open();
    win.document.write(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <title>2D 도면 & 박스·구성품 개수 확인 창 — ${safeTitle}</title>
  <style>
    body { margin:0; background:#06101f; color:#e2e8f0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
    header { position:sticky; top:0; z-index:10; padding:12px 20px; background:#0f172a; border-bottom:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; }
    .container { display:grid; grid-template-columns: 1fr; gap:16px; padding:16px; max-width:1600px; margin:0 auto; }
    .card { background:#0b172a; border:1px solid #1e293b; border-radius:12px; padding:14px; overflow:auto; }
    table { width:100%; border-collapse:collapse; font-size:12px; text-align:left; }
    th { background:#0f172a; color:#38bdf8; padding:9px 10px; border-bottom:1px solid #334155; }
    svg { max-width:100%; height:auto; display:block; margin:0 auto; border-radius:8px; }
    .badge { background:#082f49; color:#7dd3fc; border:1px solid #0284c7; border-radius:6px; padding:4px 10px; font-size:12px; font-weight:bold; }
  </style>
</head>
<body>
  <header>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <strong style="font-size:15px;color:#38bdf8">📦 ${safeTitle} — 2D 도면 & 선반별 박스·내용 구성품 개수 창</strong>
      <span class="badge">총 박스: ${totalWarehouseBoxes}개</span>
      <span class="badge">적재 구성품 종류: ${totalWarehouseSkuTypes}종</span>
      <span class="badge">사용 선반: ${result.kpis.occupiedBins} / ${result.kpis.totalBins}개</span>
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="window.print()" style="background:#22d3ee;color:#082f49;border:0;padding:7px 14px;border-radius:6px;font-weight:bold;cursor:pointer">🖨️ 인쇄 / PDF 저장</button>
      <button onclick="window.close()" style="background:#334155;color:#f8fafc;border:0;padding:7px 14px;border-radius:6px;font-weight:bold;cursor:pointer">닫기</button>
    </div>
  </header>
  <div class="container">
    <div class="card">
      <h3 style="margin:0 0 10px 0;font-size:13px;color:#7dd3fc">1. 2D 평면도 & 층별 정면도 (1:1 도면)</h3>
      ${svgMarkup}
    </div>
    <div class="card">
      <h3 style="margin:0 0 10px 0;font-size:13px;color:#34d399">2. 선반별 박스 개수 & 내부 내용 구성품(품목) 개수 현황 및 실시간 조절</h3>
      <table>
        <thead>
          <tr>
            <th>선반 ID (Bin)</th>
            <th>층 / 높이</th>
            <th>선반 총 박스 개수</th>
            <th>내용 구성품 (품목명 · 코드 · 개별 개수 조절)</th>
            <th>적재율 / 중량</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`);
    win.document.close();
  };

  if (!open || !activeBin) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/90 px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/15 text-cyan-300">
              <Box className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  {`2D 선반 박스 & 내용 구성품 개수 확인·설정 창 — [${activeBin.bin.id}]`}
                </h2>
                <span className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  {`현재 선반 박스: ${activeBin.boxes.length}개 (${skuBreakdownInBin.length}종 구성품)`}
                </span>
                <span className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                  {`전체 창고 총 박스: ${totalWarehouseBoxes}개 (${totalWarehouseSkuTypes}종)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {
                  '3D 카메라 줌 확대 없이 새 창에서 각 2D 선반의 총 박스 개수와 내부 내용 구성품(품목)별 개수를 확인하고 즉시 조절합니다.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenStandalonePopupWindow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/30"
              title="별도의 독립된 브라우저 새 창으로 2D 도면과 전체 박스/구성품 개수 표를 띄웁니다"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {'↗ 별도 브라우저 새 창으로 띄우기'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              {'닫기 (Esc)'}
            </button>
          </div>
        </div>

        {/* Body Grid */}
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-12">
          {/* Left Column: 2D Rack Map Selector & Z-Level Stack */}
          <div className="flex flex-col gap-3 lg:col-span-5">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <MapIcon className="h-3.5 w-3.5" />
                  {'1. 2D 선반 위치 선택 (클릭 시 줌 없이 즉시 전환)'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {`총 ${columnsByKey.size}개 선반 기둥`}
                </span>
              </div>

              <div className="grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3">
                {[...columnsByKey.values()].map((col) => {
                  const isSelCol =
                    activeBin.bin.aisle === col.aisle &&
                    activeBin.bin.bay === col.bay;
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => {
                        const target =
                          col.bins.find(
                            (b) => b.bin.level === activeBin.bin.level
                          ) ??
                          col.bins.find((b) => b.bin.isGoldenZone) ??
                          col.bins[0];
                        if (target) onSelectBinWithoutZoom(target);
                      }}
                      className={`flex flex-col items-start justify-between rounded-lg border p-2 text-left transition ${
                        isSelCol
                          ? 'border-amber-400 bg-cyan-950/60 ring-1 ring-amber-400/60'
                          : col.totalBoxes > 0
                            ? 'border-cyan-500/35 bg-slate-900 hover:border-cyan-400'
                            : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">
                          {col.key}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            col.totalBoxes > 0
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {`${col.totalBoxes}박스`}
                        </span>
                      </div>
                      <div className="mt-1 flex w-full items-center justify-between text-[10px] text-slate-400">
                        <span>{`구성품 ${col.totalSkuTypes}종`}</span>
                        <span>{`${col.bins.length}개 층`}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Z-Level Stack in Selected Rack Column */}
            {activeColumn && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Layers className="h-3.5 w-3.5" />
                    {`2. [${activeColumn.key}] 층별(Z1~Z${activeColumn.bins.length}) 박스 & 구성품 현황`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddBinAbove(activeBin)}
                    className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/25"
                  >
                    <Plus className="h-3 w-3" />
                    {'+ 위층 추가'}
                  </button>
                </div>

                <div className="space-y-1.5">
                  {[...activeColumn.bins]
                    .sort((a, b) => b.bin.level - a.bin.level)
                    .map((binAlloc) => {
                      const isCurrentLevel =
                        binAlloc.bin.id === activeBin.bin.id;
                      const skuMap = new Map<string, { name: string; count: number }>();
                      for (const bx of binAlloc.boxes) {
                        const prev = skuMap.get(bx.skuId);
                        if (prev) prev.count += 1;
                        else
                          skuMap.set(bx.skuId, {
                            name: bx.name.split(' (')[0],
                            count: 1,
                          });
                      }

                      return (
                        <div
                          key={binAlloc.bin.id}
                          onClick={() => onSelectBinWithoutZoom(binAlloc)}
                          className={`cursor-pointer rounded-lg border p-2.5 transition ${
                            isCurrentLevel
                              ? 'border-cyan-400 bg-cyan-950/45 ring-1 ring-cyan-400/50'
                              : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-cyan-300">
                                {binAlloc.bin.id}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {`(${binAlloc.bin.zMeters}m)`}
                              </span>
                              {binAlloc.bin.isGoldenZone && (
                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                                  {'★ 골든존'}
                                </span>
                              )}
                            </div>

                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  onSetBinTotalBoxQuota(
                                    binAlloc.bin.id,
                                    Math.max(0, binAlloc.boxes.length - 1),
                                    skus[0]?.id
                                  )
                                }
                                className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-xs font-bold text-slate-300 hover:border-cyan-400"
                                title="박스 1개 감소"
                              >
                                -
                              </button>
                              <span className="min-w-[54px] text-center font-mono text-xs font-bold text-amber-300">
                                {`${binAlloc.boxes.length} 박스`}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onSetBinTotalBoxQuota(
                                    binAlloc.bin.id,
                                    binAlloc.boxes.length + 1,
                                    skus[0]?.id
                                  )
                                }
                                className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-xs font-bold text-slate-300 hover:border-cyan-400"
                                title="박스 1개 추가"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px]">
                            {skuMap.size === 0 ? (
                              <span className="text-slate-500">
                                {'비어 있음 (우측에서 박스/구성품 개수를 추가하세요)'}
                              </span>
                            ) : (
                              [...skuMap.values()].map((item, idx) => (
                                <span
                                  key={idx}
                                  className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-slate-200"
                                >
                                  {`${item.name} × `}
                                  <strong className="text-emerald-300">
                                    {`${item.count}개`}
                                  </strong>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Detailed Box Count & Content Item Count Manager */}
          <div className="flex flex-col gap-3 lg:col-span-7">
            {/* Section 1: Total Box Count in Current Shelf */}
            <div className="rounded-xl border border-cyan-500/35 bg-slate-950/90 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-cyan-300">
                    {`3. 선택 선반 [${activeBin.bin.id}] 총 박스 개수 설정`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {`선반 크기: ${activeBin.bin.binLengthCm}×${activeBin.bin.binWidthCm}×${activeBin.bin.binHeightCm}cm · 적재율: ${activeBin.cubicUtilizationPct.toFixed(1)}% · 중량: ${activeBin.currentWeightKg.toFixed(1)} / ${activeBin.bin.maxWeightKg}kg`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onSetBinTotalBoxQuota(
                        activeBin.bin.id,
                        Math.max(0, activeBin.boxes.length - 1),
                        skus[0]?.id
                      )
                    }
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={activeBin.boxes.length}
                    onChange={(e) => {
                      if (e.target.value.trim() === '') return;
                      const next = Math.max(
                        0,
                        Math.min(100, Math.round(Number(e.target.value) || 0))
                      );
                      onSetBinTotalBoxQuota(
                        activeBin.bin.id,
                        next,
                        skus[0]?.id
                      );
                    }}
                    className="h-7 w-16 rounded-lg border border-amber-400/60 bg-slate-900 px-2 text-center font-mono text-sm font-bold text-amber-300"
                  />
                  <span className="text-xs font-bold text-slate-300">
                    {'박스'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onSetBinTotalBoxQuota(
                        activeBin.bin.id,
                        activeBin.boxes.length + 1,
                        skus[0]?.id
                      )
                    }
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-800/80 pt-2.5 text-[11px]">
                <span className="font-semibold text-slate-400">
                  {'빠른 박스 개수 선택:'}
                </span>
                {[0, 1, 2, 3, 4, 6, 8, 10, 12].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() =>
                      onSetBinTotalBoxQuota(
                        activeBin.bin.id,
                        cnt,
                        skus[0]?.id
                      )
                    }
                    className={`rounded-md border px-2 py-0.5 font-mono font-bold transition ${
                      activeBin.boxes.length === cnt
                        ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-400'
                    }`}
                  >
                    {cnt === 0 ? '0 (비우기)' : `${cnt}개`}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Content Items (SKUs) currently in this bin & individual quantity controls */}
            <div className="rounded-xl border border-emerald-500/35 bg-slate-950/90 p-3.5">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-emerald-300">
                  {`4. 선반 [${activeBin.bin.id}] 내부 내용 구성품(품목)별 개수 조절 (${skuBreakdownInBin.length}종)`}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {'각 구성품의 개수를 직접 입력하거나 +/- 버튼으로 조절하세요'}
                </span>
              </div>

              {skuBreakdownInBin.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/50 p-4 text-center text-xs text-slate-400">
                  {
                    '현재 이 선반에 적재된 구성품이 없습니다. 아래에서 구성품(품목)을 선택해 개수를 추가하세요.'
                  }
                </div>
              ) : (
                <div className="space-y-2">
                  {skuBreakdownInBin.map((item) => (
                    <div
                      key={item.skuId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/90 p-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-white">
                              {item.name}
                            </span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                              {item.skuCode}
                            </span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                              {`Class ${item.abcClass}`}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {`치수: ${item.lengthCm}×${item.widthCm}×${item.heightCm}cm · 개당 ${item.unitWeightKg}kg (합계 ${(item.unitWeightKg * item.count).toFixed(1)}kg)`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onSetCargoCountInBin(
                              activeBin.bin.id,
                              item.skuId,
                              Math.max(0, item.count - 1)
                            )
                          }
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-950 text-slate-200 hover:border-emerald-400"
                          title="구성품 개수 -1"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.count}
                          onChange={(e) => {
                            if (e.target.value.trim() === '') return;
                            const nextCnt = Math.max(
                              0,
                              Math.min(
                                100,
                                Math.round(Number(e.target.value) || 0)
                              )
                            );
                            onSetCargoCountInBin(
                              activeBin.bin.id,
                              item.skuId,
                              nextCnt
                            );
                          }}
                          className="h-7 w-14 rounded border border-emerald-500/50 bg-slate-950 px-1.5 text-center font-mono text-xs font-bold text-emerald-300"
                          title="이 구성품의 정확한 개수 입력"
                        />
                        <span className="text-[11px] font-semibold text-slate-300">
                          {'개'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onSetCargoCountInBin(
                              activeBin.bin.id,
                              item.skuId,
                              item.count + 1
                            )
                          }
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-950 text-slate-200 hover:border-emerald-400"
                          title="구성품 개수 +1"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onSetCargoCountInBin(
                              activeBin.bin.id,
                              item.skuId,
                              0
                            )
                          }
                          className="ml-1 inline-flex h-7 items-center gap-1 rounded border border-rose-500/40 bg-rose-500/15 px-2 text-[10px] font-semibold text-rose-300 hover:bg-rose-500/25"
                          title="이 구성품을 선반에서 제거 (0개)"
                        >
                          <Trash2 className="h-3 w-3" />
                          {'제거'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add from existing SKU catalog with exact count */}
              <div className="mt-3 border-t border-slate-800 pt-3">
                <div className="mb-1.5 text-[11px] font-bold text-cyan-300">
                  {'+ 전체 구성품(SKU) 카탈로그에서 선택하여 개수 추가/변경'}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedAddSkuId}
                    onChange={(e) => setSelectedAddSkuId(e.target.value)}
                    className="min-w-[210px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100"
                  >
                    {skus.map((s) => {
                      const curInBin = activeBin.boxes.filter(
                        (b) => b.skuId === s.id
                      ).length;
                      return (
                        <option key={s.id} value={s.id}>
                          {`${s.name.split(' (')[0]} (${s.skuCode}) — ${s.lengthCm}×${s.widthCm}×${s.heightCm}cm, ${s.weightKg}kg [현재 이 선반: ${curInBin}개]`}
                        </option>
                      );
                    })}
                  </select>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">{'개수:'}</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={addSkuQty}
                      onChange={(e) => {
                        if (e.target.value.trim() === '') return;
                        setAddSkuQty(
                          Math.max(
                            1,
                            Math.min(100, Math.round(Number(e.target.value) || 1))
                          )
                        );
                      }}
                      className="h-7 w-14 rounded-lg border border-cyan-500/50 bg-slate-900 px-2 text-center font-mono text-xs font-bold text-cyan-200"
                    />
                    <span className="text-[11px] text-slate-400">{'개'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedAddSkuId) return;
                      onPinCargo(activeBin.bin.id, selectedAddSkuId, addSkuQty);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/60 bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {`+${addSkuQty}개 추가`}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedAddSkuId) return;
                      onSetCargoCountInBin(
                        activeBin.bin.id,
                        selectedAddSkuId,
                        addSkuQty
                      );
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30"
                  >
                    {`정확히 ${addSkuQty}개로 설정`}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Create & Place New Custom Content Item / Box with Quantity */}
            <div className="rounded-xl border border-amber-500/35 bg-slate-950/90 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <PackagePlus className="h-3.5 w-3.5" />
                  {`5. 새 맞춤 박스 / 내용 구성품 직접 생성 및 개수 지정 적재`}
                </h3>
                <span className="text-[10px] text-slate-400">
                  {'선반보다 큰 박스나 많은 개수를 입력하면 선반이 자동 확장됩니다'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-6">
                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-slate-400">{'구성품 / 박스 이름'}</span>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="예: 부품 박스 A"
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-bold text-emerald-300">
                    {'넣을 개수 (개)'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={customQty}
                    onChange={(e) => {
                      if (e.target.value.trim() === '') return;
                      setCustomQty(
                        Math.max(
                          1,
                          Math.min(50, Math.round(Number(e.target.value) || 1))
                        )
                      );
                    }}
                    className="rounded border border-emerald-500/60 bg-slate-900 px-2 py-1 text-center font-mono font-bold text-emerald-300"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-slate-400">{'가로 L (cm)'}</span>
                  <input
                    type="number"
                    min={5}
                    max={280}
                    value={customL}
                    onChange={(e) => {
                      if (e.target.value.trim() === '') return;
                      setCustomL(
                        Math.max(5, Math.min(280, Number(e.target.value) || 20))
                      );
                    }}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-center font-mono text-white"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-slate-400">{'세로 W (cm)'}</span>
                  <input
                    type="number"
                    min={5}
                    max={280}
                    value={customW}
                    onChange={(e) => {
                      if (e.target.value.trim() === '') return;
                      setCustomW(
                        Math.max(5, Math.min(280, Number(e.target.value) || 20))
                      );
                    }}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-center font-mono text-white"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-slate-400">{'높이 H (cm)'}</span>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={customH}
                    onChange={(e) => {
                      if (e.target.value.trim() === '') return;
                      setCustomH(
                        Math.max(5, Math.min(240, Number(e.target.value) || 15))
                      );
                    }}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-center font-mono text-white"
                  />
                </label>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <label className="inline-flex items-center gap-1">
                    <span className="text-slate-400">{'개당 무게(kg):'}</span>
                    <input
                      type="number"
                      step={0.5}
                      min={0.1}
                      max={500}
                      value={customKg}
                      onChange={(e) => {
                        if (e.target.value.trim() === '') return;
                        setCustomKg(
                          Math.max(
                            0.1,
                            Math.min(500, Number(e.target.value) || 1)
                          )
                        );
                      }}
                      className="w-16 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-center font-mono text-white"
                    />
                  </label>

                  <label className="inline-flex items-center gap-1">
                    <span className="text-slate-400">{'등급:'}</span>
                    <select
                      value={customAbc}
                      onChange={(e) => setCustomAbc(e.target.value as ABCClass)}
                      className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-white"
                    >
                      <option value="A">Class A (고빈도)</option>
                      <option value="B">Class B (중빈도)</option>
                      <option value="C">Class C (저빈도)</option>
                    </select>
                  </label>

                  <div className="inline-flex items-center gap-1">
                    {CUSTOM_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCustomColor(col)}
                        className={`h-4 w-4 rounded-full border ${
                          customColor === col
                            ? 'scale-110 border-white ring-1 ring-amber-400'
                            : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onPlaceCustomBoxInBin({
                      binId: activeBin.bin.id,
                      name: customName.trim() || '구성품 박스',
                      lengthCm: customL,
                      widthCm: customW,
                      heightCm: customH,
                      weightKg: customKg,
                      quantity: customQty,
                      abcClass: customAbc,
                      fragile: false,
                      color: customColor,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/60 bg-amber-500/25 px-3.5 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/35"
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                  {`+ [${activeBin.bin.id}] 선반에 ${customQty}개 생성·적재`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
