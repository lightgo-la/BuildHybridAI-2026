import type { ABCClass, SKUItem, SlottingResult } from '../types/warehouse';

const PALETTE = [
  '#22d3ee',
  '#38bdf8',
  '#34d399',
  '#f59e0b',
  '#fb7185',
  '#a78bfa',
];

function escapeCsvCell(val: string | number | boolean): string {
  let s = String(val ?? '');
  if (
    typeof val === 'string' &&
    /^[=+\-@\t\r]/.test(s) &&
    !/^-[0-9]+(\.[0-9]+)?$/.test(s)
  ) {
    s = `'${s}`;
  }
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function triggerCsvDownload(filename: string, csvContent: string): void {
  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSkusToCSV(skus: SKUItem[], scenarioName: string): void {
  const headers = [
    'skuCode',
    'name',
    'category',
    'abcClass',
    'dailyPicks',
    'lengthCm',
    'widthCm',
    'heightCm',
    'weightKg',
    'quantity',
    'fragile',
    'color',
  ];
  const rows = skus.map((s) =>
    [
      s.skuCode,
      s.name,
      s.category,
      s.abcClass,
      s.dailyPicks,
      s.lengthCm,
      s.widthCm,
      s.heightCm,
      s.weightKg,
      s.quantity,
      s.fragile,
      s.color,
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  const safeSlug = scenarioName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  triggerCsvDownload(
    `${safeSlug || 'cubislot'}-skus.csv`,
    [headers.join(','), ...rows].join('\n')
  );
}

export function exportSlottingResultToCSV(
  result: SlottingResult,
  scenarioName: string
): void {
  const headers = [
    'mode',
    'binId',
    'aisle',
    'bay',
    'levelZ',
    'zMeters',
    'isGoldenZone',
    'binCubicUtilPct',
    'binCurrentWeightKg',
    'binMaxWeightKg',
    'safetyViolation',
    'skuCode',
    'skuName',
    'abcClass',
    'boxXCm',
    'boxYCm',
    'boxZCm',
    'boxLengthCm',
    'boxWidthCm',
    'boxHeightCm',
    'boxWeightKg',
    'rotated6Axis',
    'fragile',
    'dailyPicksShare',
  ];

  const rows: string[] = [];
  for (const alloc of result.allocations) {
    if (alloc.boxes.length === 0) continue;
    const { bin } = alloc;
    for (const box of alloc.boxes) {
      rows.push(
        [
          result.mode,
          bin.id,
          bin.aisle,
          bin.bay,
          bin.level,
          bin.zMeters,
          bin.isGoldenZone,
          alloc.cubicUtilizationPct.toFixed(1),
          alloc.currentWeightKg.toFixed(1),
          bin.maxWeightKg,
          alloc.safetyViolation,
          box.skuCode,
          box.name,
          box.abcClass,
          box.xCm,
          box.yCm,
          box.zCm,
          box.lengthCm,
          box.widthCm,
          box.heightCm,
          box.weightKg,
          box.rotated,
          box.fragile,
          box.dailyPicksShare.toFixed(1),
        ]
          .map(escapeCsvCell)
          .join(',')
      );
    }
  }

  const safeSlug = scenarioName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  triggerCsvDownload(
    `${safeSlug || 'cubislot'}-${result.mode}-allocations.csv`,
    [headers.join(','), ...rows].join('\n')
  );
}

function parseCsvRecords(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cur.trim());
      cur = '';
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') {
        i++;
      }
      row.push(cur.trim());
      cur = '';
      if (row.some((c) => c.length > 0)) {
        rows.push(row);
      }
      row = [];
    } else {
      cur += ch;
    }
  }
  row.push(cur.trim());
  if (row.some((c) => c.length > 0)) {
    rows.push(row);
  }
  return rows;
}

export function parseSkusFromCSV(
  rawText: string,
  maxDims = { maxL: 280, maxW: 280, maxH: 240 }
): SKUItem[] {
  const cleaned = rawText.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return [];

  const records = parseCsvRecords(cleaned);
  if (records.length < 2) return [];

  const headerCells = records[0].map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  const claimedCols = new Set<number>();
  const matchHeader = (aliases: string[]): number => {
    const idx = headerCells.findIndex(
      (h, i) => !claimedCols.has(i) && aliases.includes(h)
    );
    if (idx >= 0) claimedCols.add(idx);
    return idx;
  };

  const matchedCode = matchHeader(['skucode', 'code', 'sku', 'itemcode']);
  const matchedName = matchHeader(['name', 'skuname', 'item', 'itemname', 'title']);
  const matchedCat = matchHeader(['category', 'cat', 'group', 'type']);
  const matchedAbc = matchHeader(['abcclass', 'abc', 'class', 'grade']);
  const matchedPicks = matchHeader(['dailypicks', 'picks', 'velocity', 'demand', 'dailypicksshare']);
  const matchedL = matchHeader(['lengthcm', 'length', 'l', 'depthcm', 'boxlengthcm']);
  const matchedW = matchHeader(['widthcm', 'width', 'w', 'boxwidthcm']);
  const matchedH = matchHeader(['heightcm', 'height', 'h', 'boxheightcm']);
  const matchedKg = matchHeader(['weightkg', 'weight', 'kg', 'mass', 'boxweightkg']);
  const matchedQty = matchHeader(['quantity', 'qty', 'count', 'units']);
  const matchedFragile = matchHeader(['fragile', 'breakable']);
  const matchedColor = matchHeader(['color', 'hex']);

  const hasAnyKnownHeader = claimedCols.size > 0;
  const fallbackCol = (matched: number, fallbackIdx: number) =>
    matched >= 0
      ? matched
      : !hasAnyKnownHeader && !claimedCols.has(fallbackIdx)
        ? fallbackIdx
        : -1;

  const colCode = fallbackCol(matchedCode, 0);
  const colName = fallbackCol(matchedName, 1);
  const colCat = fallbackCol(matchedCat, 2);
  const colAbc = fallbackCol(matchedAbc, 3);
  const colPicks = fallbackCol(matchedPicks, 4);
  const colL = fallbackCol(matchedL, 5);
  const colW = fallbackCol(matchedW, 6);
  const colH = fallbackCol(matchedH, 7);
  const colKg = fallbackCol(matchedKg, 8);
  const colQty = fallbackCol(matchedQty, 9);
  const colFragile = fallbackCol(matchedFragile, 10);
  const colColor = fallbackCol(matchedColor, 11);

  const cellAt = (row: string[], idx: number): string | undefined =>
    idx >= 0 && idx < row.length ? row[idx]?.replace(/^'(?=[=+\-@\t\r])/, '') : undefined;

  const limitL = Math.max(118, maxDims.maxL);
  const limitW = Math.max(88, maxDims.maxW);
  const limitH = Math.max(68, maxDims.maxH);

  const parsed: SKUItem[] = [];
  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (row.length < 2) continue;

    const rawAbc = (cellAt(row, colAbc) ?? 'B').toUpperCase();
    const abcClass: ABCClass =
      rawAbc === 'A' || rawAbc === 'B' || rawAbc === 'C' ? rawAbc : 'B';

    const num = (val: string | undefined, def: number, allowZero = false) => {
      if (val === undefined || val.trim() === '') return def;
      const n = Number(val);
      return Number.isFinite(n) && (allowZero ? n >= 0 : n > 0) ? n : def;
    };

    const rawFragile = (cellAt(row, colFragile) ?? '').toLowerCase();
    const fragile =
      rawFragile === 'true' ||
      rawFragile === '1' ||
      rawFragile === 'yes' ||
      rawFragile === 'y';

    const rawColor = cellAt(row, colColor) ?? '';
    const color = /^#[0-9a-fA-F]{6}$/.test(rawColor)
      ? rawColor
      : PALETTE[(i - 1) % PALETTE.length];

    parsed.push({
      id: `sku-csv-${Date.now()}-${i}`,
      skuCode: (cellAt(row, colCode) || `SKU-${100 + i}`).slice(0, 24),
      name: (cellAt(row, colName) || `Imported Item ${i}`).slice(0, 80),
      category: cellAt(row, colCat) || 'CSV Imported',
      abcClass,
      dailyPicks: Math.max(0, Math.min(2000, Math.round(num(cellAt(row, colPicks), 50, true)))),
      lengthCm: Math.max(5, Math.min(limitL, Math.round(num(cellAt(row, colL), 36)))),
      widthCm: Math.max(5, Math.min(limitW, Math.round(num(cellAt(row, colW), 28)))),
      heightCm: Math.max(5, Math.min(limitH, Math.round(num(cellAt(row, colH), 24)))),
      weightKg: Number(Math.max(0.1, Math.min(1000, num(cellAt(row, colKg), 5))).toFixed(1)),
      quantity: Math.max(1, Math.min(200, Math.round(num(cellAt(row, colQty), 4)))),
      fragile,
      color,
    });
  }

  return parsed;
}
