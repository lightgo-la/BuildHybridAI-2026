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
  const s = String(val ?? '');
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
    .replace(/[^a-z0-9가-힣]+/g, '-')
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
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '');
  triggerCsvDownload(
    `${safeSlug || 'cubislot'}-${result.mode}-allocations.csv`,
    [headers.join(','), ...rows].join('\n')
  );
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
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
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

export function parseSkusFromCSV(
  rawText: string,
  maxDims = { maxL: 118, maxW: 88, maxH: 68 }
): SKUItem[] {
  const cleaned = rawText.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return [];

  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headerCells = splitCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')
  );

  const findCol = (aliases: string[], fallbackIdx: number) => {
    const idx = headerCells.findIndex((h) => aliases.includes(h));
    return idx >= 0 ? idx : fallbackIdx;
  };

  const colCode = findCol(['skucode', 'code', 'sku', '품목코드', '코드'], 0);
  const colName = findCol(['name', 'skuname', 'item', '품명', '이름', '물품명'], 1);
  const colCat = findCol(['category', 'cat', '카테고리', '분류'], 2);
  const colAbc = findCol(['abcclass', 'abc', '등급'], 3);
  const colPicks = findCol(['dailypicks', 'picks', '일일피킹', '피킹수'], 4);
  const colL = findCol(['lengthcm', 'length', 'l', '가로', '길이'], 5);
  const colW = findCol(['widthcm', 'width', 'w', '세로', '폭'], 6);
  const colH = findCol(['heightcm', 'height', 'h', '높이'], 7);
  const colKg = findCol(['weightkg', 'weight', 'kg', '중량', '무게'], 8);
  const colQty = findCol(['quantity', 'qty', '수량'], 9);
  const colFragile = findCol(['fragile', '파손주의', '취급주의'], 10);
  const colColor = findCol(['color', '색상'], 11);

  const parsed: SKUItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i]);
    if (row.length < 2) continue;

    const rawAbc = (row[colAbc] ?? 'B').toUpperCase();
    const abcClass: ABCClass =
      rawAbc === 'A' || rawAbc === 'B' || rawAbc === 'C' ? rawAbc : 'B';

    const num = (val: string | undefined, def: number) => {
      const n = Number(val);
      return Number.isFinite(n) && n > 0 ? n : def;
    };

    const rawFragile = (row[colFragile] ?? '').toLowerCase();
    const fragile =
      rawFragile === 'true' ||
      rawFragile === '1' ||
      rawFragile === 'yes' ||
      rawFragile === 'y';

    const rawColor = row[colColor] ?? '';
    const color = /^#[0-9a-fA-F]{6}$/.test(rawColor)
      ? rawColor
      : PALETTE[(i - 1) % PALETTE.length];

    parsed.push({
      id: `sku-csv-${Date.now()}-${i}`,
      skuCode: (row[colCode] || `SKU-${100 + i}`).slice(0, 24),
      name: (row[colName] || `Imported Item ${i}`).slice(0, 80),
      category: row[colCat] || 'CSV Imported',
      abcClass,
      dailyPicks: Math.max(1, Math.min(2000, Math.round(num(row[colPicks], 50)))),
      lengthCm: Math.max(8, Math.min(maxDims.maxL, Math.round(num(row[colL], 36)))),
      widthCm: Math.max(8, Math.min(maxDims.maxW, Math.round(num(row[colW], 28)))),
      heightCm: Math.max(8, Math.min(maxDims.maxH, Math.round(num(row[colH], 24)))),
      weightKg: Number(Math.max(0.2, Math.min(400, num(row[colKg], 5))).toFixed(1)),
      quantity: Math.max(1, Math.min(60, Math.round(num(row[colQty], 4)))),
      fragile,
      color,
    });
  }

  return parsed;
}
