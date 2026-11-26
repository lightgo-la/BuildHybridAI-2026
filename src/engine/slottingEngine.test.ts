import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTransferredSkuPins,
  computeAisleTravelDistanceM,
  computeCycleTimeSec,
  computeZLevelBreakdown,
  generateWarehouseBins,
  runBaseline2DSlotting,
  runOptimized3DSlotting,
} from './slottingEngine.ts';
import { parseSkusFromCSV } from '../utils/csvExporter.ts';
import { generateWarehouseDXF, generateWarehouseSVG } from '../utils/cadExporter.ts';
import {
  buildWarehousePromptContext,
  deriveRecommendedActions,
  extractBinIdsFromText,
  generateLocalDeterministicAudit,
} from '../services/hybridAi.ts';
import type { SKUItem, WarehouseConfig } from '../types/warehouse.ts';

const sampleConfig: WarehouseConfig = {
  aisles: 3,
  baysPerAisle: 4,
  levels: 4,
  equipmentMode: 'reach_truck',
  goldenZoneMinM: 0.8,
  goldenZoneMaxM: 1.65,
  allowRotationAndCoPack: true,
  optimizationPreset: 'balanced',
};

const sampleSkus: SKUItem[] = [
  {
    id: 'sku-heavy-a',
    skuCode: 'HVY-20',
    name: 'Heavy Motor Assembly',
    category: 'Industrial',
    abcClass: 'A',
    dailyPicks: 140,
    lengthCm: 50,
    widthCm: 40,
    heightCm: 30,
    weightKg: 22,
    quantity: 4,
    fragile: false,
    color: '#38bdf8',
  },
  {
    id: 'sku-fast-a',
    skuCode: 'FST-01',
    name: 'Fast Pick Carton',
    category: 'Consumer',
    abcClass: 'A',
    dailyPicks: 220,
    lengthCm: 35,
    widthCm: 25,
    heightCm: 22,
    weightKg: 4.5,
    quantity: 8,
    fragile: false,
    color: '#34d399',
  },
  {
    id: 'sku-fragile-b',
    skuCode: 'FRG-02',
    name: 'Glass Sensor Kit',
    category: 'Tech',
    abcClass: 'B',
    dailyPicks: 65,
    lengthCm: 30,
    widthCm: 20,
    heightCm: 20,
    weightKg: 2.5,
    quantity: 4,
    fragile: true,
    color: '#fb7185',
  },
];

test('3D Optimized Slotting enforces 0 safety violations and outperforms 2D Baseline', () => {
  const bins = generateWarehouseBins(sampleConfig);
  assert.equal(bins.length, 48);

  const baseline = runBaseline2DSlotting(bins, sampleSkus, sampleConfig);
  const optimized = runOptimized3DSlotting(bins, sampleSkus, sampleConfig);

  assert.equal(optimized.kpis.safetyViolations, 0);
  assert.equal(optimized.unplacedUnits, 0);
  assert.ok(
    optimized.kpis.cubicUtilizationPct >= baseline.kpis.cubicUtilizationPct,
    '3D Optimized should improve or equal 3D cubic utilization via co-packing & rotation'
  );
  assert.ok(
    optimized.kpis.ergonomicsScore >= baseline.kpis.ergonomicsScore,
    '3D Optimized should improve ergonomics score'
  );

  // Verify heavy items (>16kg) never land on level >= 3 in 3D Optimized mode
  for (const alloc of optimized.allocations) {
    if (alloc.bin.level >= 3) {
      for (const box of alloc.boxes) {
        assert.ok(
          box.weightKg <= 16,
          `Heavy box (${box.weightKg}kg) must not be placed on Z${alloc.bin.level}`
        );
      }
    }
  }
});

test('Max Safety preset enforces stricter 10kg cutoff on Z3+ in both baseline evaluation and 3D optimization', () => {
  const safetyConfig: WarehouseConfig = {
    ...sampleConfig,
    optimizationPreset: 'safety',
  };
  const bins = generateWarehouseBins(safetyConfig);
  const mediumHeavySkus: SKUItem[] = [
    {
      id: 'sku-12kg',
      skuCode: 'MED-12',
      name: '12kg Medium-Heavy Case',
      category: 'Hardware',
      abcClass: 'A',
      dailyPicks: 120,
      lengthCm: 40,
      widthCm: 30,
      heightCm: 25,
      weightKg: 12,
      quantity: 8,
      fragile: false,
      color: '#f59e0b',
    },
  ];

  // Baseline 2D fills upper Z4/Z3 first, triggering safety violation in Max Safety (>10kg) mode
  const baseline = runBaseline2DSlotting(bins, mediumHeavySkus, safetyConfig);
  assert.ok(
    baseline.kpis.safetyViolations > 0,
    'Baseline 2D with 12kg on Z3/Z4 must be flagged in Max Safety (>10kg) mode'
  );

  // 3D Optimized keeps all 12kg units on Z1-Z2 in Max Safety mode -> 0 violations
  const optimized = runOptimized3DSlotting(bins, mediumHeavySkus, safetyConfig);
  assert.equal(optimized.kpis.safetyViolations, 0);
});

test('Aisle corridor routing adds cross-aisle detour when switching aisles deep inside bays', () => {
  const sameAisleDist = computeAisleTravelDistanceM(0, 3.25, 0, 4.7, 0.75);
  assert.ok(Math.abs(sameAisleDist - 1.45) < 0.001);

  const crossAisleDist = computeAisleTravelDistanceM(0, 3.25, 3.4, 3.25, 0.75);
  // Must exit aisle 1 (3.25 -> 0.75 = 2.5m), cross (3.4m), and enter aisle 2 (0.75 -> 3.25 = 2.5m) = 8.4m
  assert.ok(
    crossAisleDist > 3.4,
    `Expected detour > direct 3.4m, got ${crossAisleDist}`
  );
  assert.ok(Math.abs(crossAisleDist - 8.4) < 0.001);
});

test('Unplaced items detail reports overflow SKUs accurately', () => {
  const tinyBins = generateWarehouseBins({
    ...sampleConfig,
    aisles: 1,
    baysPerAisle: 1,
    levels: 1,
  });
  const overflowSkus: SKUItem[] = [
    {
      ...sampleSkus[0],
      quantity: 30,
    },
  ];
  const res = runOptimized3DSlotting(tinyBins, overflowSkus, sampleConfig);
  assert.ok(res.unplacedUnits > 0);
  assert.ok(res.unplacedItems && res.unplacedItems.length > 0);
  assert.equal(res.unplacedItems[0].skuCode, 'HVY-20');
});

test('Pinned cargo placement and Z-level breakdown compute Golden Zone tiers accurately', () => {
  const bins = generateWarehouseBins(sampleConfig);
  const pinned = [{ binId: 'A1-B1-Z2', skuId: 'sku-fast-a', count: 2 }];
  const optimized = runOptimized3DSlotting(bins, sampleSkus, sampleConfig, pinned);

  const pinnedAlloc = optimized.allocations.find((a) => a.bin.id === 'A1-B1-Z2');
  assert.ok(pinnedAlloc);
  assert.ok(pinnedAlloc.boxes.some((b) => b.skuCode === 'FST-01'));

  const breakdown = computeZLevelBreakdown(optimized.allocations, sampleConfig);
  assert.equal(breakdown.length, 4);
  const z2 = breakdown.find((z) => z.level === 2);
  assert.ok(z2?.isGoldenZone, 'Z2 (0.85m) should be inside Golden Zone 0.80m-1.65m');
});

test('CSV parser imports SKU master data with Korean/English columns and BOM', () => {
  const csv = `\uFEFFskuCode,name,category,abcClass,dailyPicks,lengthCm,widthCm,heightCm,weightKg,quantity,fragile
WTR-500,"생수 500mL 묶음",Beverage,A,180,36,24,22,11.5,6,false
GLS-10,"유리 용기 세트",Kitchen,B,45,28,22,18,3.2,4,true`;

  const parsed = parseSkusFromCSV(csv);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].skuCode, 'WTR-500');
  assert.equal(parsed[0].abcClass, 'A');
  assert.equal(parsed[0].weightKg, 11.5);
  assert.equal(parsed[1].fragile, true);
});

test('CAD Exporter generates valid AutoCAD R12 DXF and vector SVG blueprints', () => {
  const bins = generateWarehouseBins(sampleConfig);
  const optimized = runOptimized3DSlotting(bins, sampleSkus, sampleConfig);
  const opts = {
    includeCartons: true,
    includePickRoute: true,
    includeLabels: true,
    includeElevation: true,
    planLevelFilter: 'all' as const,
  };

  const dxf = generateWarehouseDXF(optimized, sampleConfig, 'Unit Test Hub', opts);
  assert.ok(dxf.includes('$ACADVER'));
  assert.ok(dxf.includes('PICK_ROUTE'));
  assert.ok(dxf.includes('EOF'));

  const svg = generateWarehouseSVG(optimized, sampleConfig, 'Unit Test Hub', opts);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('CUBISLOT 2D CAD BLUEPRINT'));
  assert.ok(svg.endsWith('</svg>'));
});

test('Hybrid AI context builder, bin ID extractor, and action engine produce actionable recommendations', () => {
  const bins = generateWarehouseBins(sampleConfig);
  const baseline = runBaseline2DSlotting(bins, sampleSkus, sampleConfig);
  const optimized = runOptimized3DSlotting(bins, sampleSkus, sampleConfig);

  const context = buildWarehousePromptContext(
    baseline,
    optimized,
    sampleConfig,
    optimized.allocations[0]
  );
  assert.ok(context.includes('3D Improvement Deltas:'));
  assert.ok(context.includes('Focused Bin A1-B1-Z1'));

  const reportKo = generateLocalDeterministicAudit(
    '골든존 동선과 중량물 안전, 히트맵을 분석해줘',
    context
  );
  assert.ok(reportKo.includes('로컬 온디바이스 슬로팅 엔진 정량 분석 리포트'));

  const extractedBins = extractBinIdsFromText(reportKo);
  assert.ok(extractedBins.length > 0);

  const actions = deriveRecommendedActions(
    '골든존 동선과 중량물 안전, 히트맵을 분석해줘',
    context,
    reportKo
  );
  assert.ok(actions.some((a) => a.kind === 'apply_preset_safety'));
  assert.ok(actions.some((a) => a.kind === 'apply_preset_speed'));
  assert.ok(actions.some((a) => a.kind === 'switch_view_heatmap'));
});

test('3D single-item and batch cargo transfer snapshot live bin allocations accurately', () => {
  const bins = generateWarehouseBins(sampleConfig);
  const initial = runOptimized3DSlotting(bins, sampleSkus, sampleConfig);
  const sourceAlloc = initial.allocations.find((a) =>
    a.boxes.some((b) => b.skuId === 'sku-fast-a')
  );
  assert.ok(sourceAlloc, 'Expected fast-pick SKU to be placed in at least one bin');
  const sourceCountBefore = sourceAlloc.boxes.filter(
    (b) => b.skuId === 'sku-fast-a'
  ).length;

  const emptyAlloc = initial.allocations.find((a) => a.boxes.length === 0);
  assert.ok(emptyAlloc, 'Expected at least one empty target bin');

  // Move 1 individual box from sourceAlloc to emptyAlloc
  const { nextPins, movedCount } = buildTransferredSkuPins(
    [],
    initial.allocations,
    sourceAlloc.bin.id,
    emptyAlloc.bin.id,
    'sku-fast-a',
    1
  );
  assert.equal(movedCount, 1);

  const afterMove = runOptimized3DSlotting(
    bins,
    sampleSkus,
    sampleConfig,
    nextPins
  );
  const sourceAfter = afterMove.allocations.find(
    (a) => a.bin.id === sourceAlloc.bin.id
  )!;
  const targetAfter = afterMove.allocations.find(
    (a) => a.bin.id === emptyAlloc.bin.id
  )!;

  assert.equal(
    sourceAfter.boxes.filter((b) => b.skuId === 'sku-fast-a').length,
    sourceCountBefore - 1
  );
  assert.equal(
    targetAfter.boxes.filter((b) => b.skuId === 'sku-fast-a').length,
    1
  );
});

test('Custom shelf sizing (>72cm height) scales Z-elevation pitch without vertical shelf overlap', () => {
  const tallShelfConfig: WarehouseConfig = {
    ...sampleConfig,
    aisles: 1,
    baysPerAisle: 1,
    levels: 3,
    binLengthCm: 150,
    binWidthCm: 110,
    binHeightCm: 110,
  };
  const bins = generateWarehouseBins(tallShelfConfig);
  assert.equal(bins.length, 3);
  for (let i = 1; i < bins.length; i++) {
    const lowerTop = bins[i - 1].zMeters + bins[i - 1].binHeightCm / 100;
    assert.ok(
      bins[i].zMeters > lowerTop,
      `Level Z${bins[i].level} (${bins[i].zMeters}m) must be above Z${bins[i - 1].level} top (${lowerTop}m)`
    );
  }
});

test('Structural obstacle proximity penalty adds detour time to blocked bins', () => {
  const bins = generateWarehouseBins(sampleConfig);
  const targetBin = bins[0];
  const baseSec = computeCycleTimeSec(
    targetBin,
    'reach_truck',
    sampleConfig.aisles,
    sampleConfig.aisleSpacingM,
    sampleConfig.depotXMeters,
    sampleConfig.depotYMeters,
    []
  );
  const blockedSec = computeCycleTimeSec(
    targetBin,
    'reach_truck',
    sampleConfig.aisles,
    sampleConfig.aisleSpacingM,
    sampleConfig.depotXMeters,
    sampleConfig.depotYMeters,
    [
      {
        id: 'obs-1',
        label: 'Pillar P1',
        aisle: 1,
        bay: 1,
        xMeters: targetBin.xMeters + 0.3,
        yMeters: targetBin.yMeters,
      },
    ]
  );
  assert.ok(
    blockedSec > baseSec + 1.5,
    `Blocked bin cycle time (${blockedSec}s) should include obstacle detour penalty above base (${baseSec}s)`
  );
});

test('100-SKU x 100-Bin high-volume stress test places 100% of items with 0 safety violations', () => {
  const config100: WarehouseConfig = {
    ...sampleConfig,
    aisles: 5,
    baysPerAisle: 5,
    levels: 4,
    binLengthCm: 130,
    binWidthCm: 95,
    binHeightCm: 75,
  };
  const bins100 = generateWarehouseBins(config100);
  assert.equal(bins100.length, 100);

  const skus100: SKUItem[] = Array.from({ length: 100 }, (_, i) => ({
    id: `sku-stress-${i + 1}`,
    skuCode: `STRESS-${i + 1}`,
    name: `대량 테스트 품목 #${i + 1} (Stress Item ${i + 1})`,
    category: 'Stress',
    abcClass: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C',
    dailyPicks: 20 + (i % 100),
    lengthCm: 24 + ((i * 5) % 44),
    widthCm: 20 + ((i * 3) % 34),
    heightCm: 16 + ((i * 4) % 28),
    weightKg: Number((1.2 + ((i * 1.9) % 24)).toFixed(1)),
    quantity: 2 + (i % 3),
    fragile: i % 9 === 0,
    color: '#38bdf8',
  }));

  const baseRes = runBaseline2DSlotting(bins100, skus100, config100);
  const optRes = runOptimized3DSlotting(bins100, skus100, config100);

  assert.equal(baseRes.unplacedUnits, 0);
  assert.equal(optRes.unplacedUnits, 0);
  assert.equal(optRes.kpis.safetyViolations, 0);
  assert.ok(
    optRes.kpis.goldenZoneHitRatePct > baseRes.kpis.goldenZoneHitRatePct
  );
});
