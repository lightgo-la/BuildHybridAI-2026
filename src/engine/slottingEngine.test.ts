import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExactBinSkuPins,
  buildTransferredSkuPins,
  checkShelfPairOverlap3D,
  computeAisleTravelDistanceM,
  computeCycleTimeSec,
  computeZLevelBreakdown,
  generateWarehouseBins,
  resolveShelfCollisions3D,
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
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios.ts';
import { WAREHOUSE_TEMPLATES } from '../data/warehouseTemplates.ts';
import type {
  ABCClass,
  EquipmentMode,
  OptimizationPreset,
  SKUItem,
  WarehouseConfig,
} from '../types/warehouse.ts';

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

  const baseline = runBaseline2DSlotting(bins, mediumHeavySkus, safetyConfig);
  assert.ok(
    baseline.kpis.safetyViolations > 0,
    'Baseline 2D with 12kg on Z3/Z4 must be flagged in Max Safety (>10kg) mode'
  );

  const optimized = runOptimized3DSlotting(bins, mediumHeavySkus, safetyConfig);
  assert.equal(optimized.kpis.safetyViolations, 0);
});

test('Aisle corridor routing adds cross-aisle detour when switching aisles deep inside bays', () => {
  const sameAisleDist = computeAisleTravelDistanceM(0, 3.25, 0, 4.7, 0.75);
  assert.ok(Math.abs(sameAisleDist - 1.45) < 0.001);

  const crossAisleDist = computeAisleTravelDistanceM(0, 3.25, 3.4, 3.25, 0.75);
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

test('CSV parser imports SKU master data with standard English columns and BOM', () => {
  const csv = `\uFEFFskuCode,name,category,abcClass,dailyPicks,lengthCm,widthCm,heightCm,weightKg,quantity,fragile
WTR-500,"Spring Water 500mL Pack",Beverage,A,180,36,24,22,11.5,6,false
GLS-10,"Glass Container Set",Kitchen,B,45,28,22,18,3.2,4,true`;

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

  const reportEn = generateLocalDeterministicAudit(
    'Analyze Golden Zone pick route, heavy cargo safety, and heatmap congestion',
    context
  );
  assert.ok(
    reportEn.includes('Local On-Device Slotting Engine Quantitative Audit')
  );

  const extractedBins = extractBinIdsFromText(reportEn);
  assert.ok(extractedBins.length > 0);

  const actions = deriveRecommendedActions(
    'Analyze Golden Zone pick route, heavy cargo safety, and heatmap congestion',
    context,
    reportEn
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
    name: `High-Volume Stress Test Item #${i + 1}`,
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

test('3D shelf AABB physics solver prevents 3D shelf overlap during resizing, dragging, and pillar collision', () => {
  const crowdedConfig: WarehouseConfig = {
    ...sampleConfig,
    aisles: 3,
    baysPerAisle: 4,
    levels: 3,
    aisleSpacingM: 1.2,
    baySpacingM: 0.9,
    binLengthCm: 210,
    binWidthCm: 170,
    binHeightCm: 115,
    obstacles: [
      {
        id: 'obs-center',
        label: 'Central Pillar',
        aisle: 1,
        bay: 1,
        xMeters: 0,
        yMeters: 3.25,
      },
    ],
  };

  const rawBins = generateWarehouseBins(crowdedConfig);
  const collidedBins = rawBins.map((b, idx) =>
    idx === 3
      ? {
          ...b,
          xMeters: rawBins[0].xMeters,
          yMeters: rawBins[0].yMeters,
          zMeters: rawBins[0].zMeters,
        }
      : b
  );

  const resolved = resolveShelfCollisions3D(
    collidedBins,
    crowdedConfig,
    [collidedBins[3].id]
  );

  for (let i = 0; i < resolved.length; i++) {
    for (let j = i + 1; j < resolved.length; j++) {
      const check = checkShelfPairOverlap3D(resolved[i], resolved[j], 0.04);
      assert.equal(
        check.overlaps,
        false,
        `Shelves ${resolved[i].id} and ${resolved[j].id} must not overlap in 3D space (dx=${check.overlapX.toFixed(3)}, dy=${check.overlapY.toFixed(3)}, dz=${check.overlapZ.toFixed(3)})`
      );
    }
  }
});

test('Exact box count per shelf bin pins all SKU placements and prevents unpinned overflow', () => {
  const bins = generateWarehouseBins(sampleConfig);
  const initial = runOptimized3DSlotting(bins, sampleSkus, sampleConfig);
  const targetBinId = 'A1-B1-Z2';

  const { nextPins, totalPinnedForSku } = buildExactBinSkuPins(
    [],
    initial.allocations,
    targetBinId,
    'sku-fast-a',
    5
  );

  const updatedSkus = sampleSkus.map((s) =>
    s.id === 'sku-fast-a' ? { ...s, quantity: totalPinnedForSku } : s
  );

  const afterExactSet = runOptimized3DSlotting(
    bins,
    updatedSkus,
    sampleConfig,
    nextPins
  );
  const targetAlloc = afterExactSet.allocations.find(
    (a) => a.bin.id === targetBinId
  )!;
  assert.equal(
    targetAlloc.boxes.filter((b) => b.skuId === 'sku-fast-a').length,
    5,
    'Target bin should contain exact 5 boxes of sku-fast-a'
  );

  const zeroResult = buildExactBinSkuPins(
    nextPins,
    afterExactSet.allocations,
    targetBinId,
    'sku-fast-a',
    0
  );
  const afterZeroSkus = sampleSkus.map((s) =>
    s.id === 'sku-fast-a' ? { ...s, quantity: zeroResult.totalPinnedForSku } : s
  );
  const afterZeroSet = runOptimized3DSlotting(
    bins,
    afterZeroSkus,
    sampleConfig,
    zeroResult.nextPins
  );
  const targetAllocAfterZero = afterZeroSet.allocations.find(
    (a) => a.bin.id === targetBinId
  )!;
  assert.equal(
    targetAllocAfterZero.boxes.filter((b) => b.skuId === 'sku-fast-a').length,
    0,
    'Target bin should contain 0 boxes of sku-fast-a after setting count to 0'
  );
});

test('Custom pick route and return-to-depot option dynamically update pickRoute sequence and cycle time KPIs', () => {
  const bins = generateWarehouseBins(sampleConfig);
  const customIds = ['A2-B3-Z2', 'A1-B1-Z1', 'A3-B2-Z2'];
  const resNoReturn = runOptimized3DSlotting(bins, sampleSkus, {
    ...sampleConfig,
    customRouteBinIds: customIds,
    routeReturnToDepot: false,
  });
  assert.deepEqual(
    resNoReturn.pickRoute.map((w) => w.binId),
    customIds,
    'Custom pick route should visit waypoints in exact user-specified sequence'
  );

  const resWithReturn = runOptimized3DSlotting(bins, sampleSkus, {
    ...sampleConfig,
    customRouteBinIds: customIds,
    routeReturnToDepot: true,
  });
  assert.ok(
    resWithReturn.kpis.avgCycleTimeSec > resNoReturn.kpis.avgCycleTimeSec,
    `Enabling routeReturnToDepot (${resWithReturn.kpis.avgCycleTimeSec}s) should add return leg time above one-way route (${resNoReturn.kpis.avgCycleTimeSec}s)`
  );
});

test('10,000-Iteration QC Invariant Suite: 3D bin boundaries, zero intra-bin AABB overlap, weight/NIOSH limits, unit conservation, and 3D shelf collision physics', () => {
  let seed = 0x20261127;
  const nextRand = () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const randInt = (min: number, max: number) =>
    min + Math.floor(nextRand() * (max - min + 1));

  const presets: OptimizationPreset[] = ['balanced', 'speed', 'density', 'safety'];
  const equipments: EquipmentMode[] = ['reach_truck', 'asrs_crane'];
  const abcClasses: ABCClass[] = ['A', 'B', 'C'];

  let totalBoxesVerified = 0;

  for (let iter = 0; iter < 10000; iter++) {
    const aisles = randInt(1, 3);
    const baysPerAisle = randInt(2, 3);
    const levels = randInt(2, 4);
    const binL = randInt(75, 135);
    const binW = randInt(50, 95);
    const binH = randInt(45, 80);
    const preset = presets[iter % presets.length];
    const equipmentMode = equipments[iter % equipments.length];
    const allowRotationAndCoPack = iter % 5 !== 0;

    const cfg: WarehouseConfig = {
      aisles,
      baysPerAisle,
      levels,
      aisleSpacingM: Number((2.2 + nextRand() * 1.4).toFixed(2)),
      baySpacingM: Number((1.05 + nextRand() * 0.5).toFixed(2)),
      binLengthCm: binL,
      binWidthCm: binW,
      binHeightCm: binH,
      equipmentMode,
      goldenZoneMinM: 0.8,
      goldenZoneMaxM: 1.65,
      allowRotationAndCoPack,
      optimizationPreset: preset,
      routeReturnToDepot: iter % 2 === 0,
    };

    const skuCount = randInt(2, 5);
    const skus: SKUItem[] = [];
    let requestedUnits = 0;
    for (let s = 0; s < skuCount; s++) {
      const qty = randInt(1, 4);
      requestedUnits += qty;
      skus.push({
        id: `qc-sku-${s}`,
        skuCode: `QC-${s}`,
        name: `QC Cargo ${s}`,
        category: 'QC',
        abcClass: abcClasses[s % 3],
        dailyPicks: randInt(10, 220),
        lengthCm: randInt(16, Math.max(20, Math.floor(binL * 0.52))),
        widthCm: randInt(14, Math.max(18, Math.floor(binW * 0.52))),
        heightCm: randInt(12, Math.max(16, Math.floor(binH * 0.52))),
        weightKg: Number((1.0 + nextRand() * 24).toFixed(1)),
        quantity: qty,
        fragile: s % 3 === 0,
        color: '#22d3ee',
      });
    }

    const bins = generateWarehouseBins(cfg);
    const pins =
      iter % 7 === 0 && bins.length > 0 && skus.length > 0
        ? [{ binId: bins[0].id, skuId: skus[0].id, count: skus[0].quantity }]
        : [];
    const res =
      iter % 4 === 0
        ? runBaseline2DSlotting(bins, skus, cfg, pins)
        : runOptimized3DSlotting(bins, skus, cfg, pins);

    let placedCount = 0;
    for (const alloc of res.allocations) {
      placedCount += alloc.boxes.length;
      const b = alloc.bin;

      assert.ok(
        alloc.currentWeightKg <= b.maxWeightKg + 1e-4,
        `QC iter ${iter}: bin ${b.id} exceeded max weight (${alloc.currentWeightKg} > ${b.maxWeightKg})`
      );
      assert.ok(
        alloc.cubicUtilizationPct >= -1e-4 && alloc.cubicUtilizationPct <= 100.01,
        `QC iter ${iter}: bin ${b.id} invalid cubicUtilizationPct ${alloc.cubicUtilizationPct}`
      );

      for (let i = 0; i < alloc.boxes.length; i++) {
        const boxA = alloc.boxes[i];
        totalBoxesVerified++;
        assert.ok(
          boxA.xCm >= -1e-4 &&
            boxA.yCm >= -1e-4 &&
            boxA.zCm >= -1e-4 &&
            boxA.xCm + boxA.lengthCm <= b.binLengthCm + 1e-4 &&
            boxA.yCm + boxA.widthCm <= b.binWidthCm + 1e-4 &&
            boxA.zCm + boxA.heightCm <= b.binHeightCm + 1e-4,
          `QC iter ${iter}: box ${boxA.skuCode} out of bounds in bin ${b.id}`
        );

        for (let j = i + 1; j < alloc.boxes.length; j++) {
          const boxB = alloc.boxes[j];
          const sepX =
            boxA.xCm + boxA.lengthCm <= boxB.xCm + 1e-4 ||
            boxB.xCm + boxB.lengthCm <= boxA.xCm + 1e-4;
          const sepY =
            boxA.yCm + boxA.widthCm <= boxB.yCm + 1e-4 ||
            boxB.yCm + boxB.widthCm <= boxA.yCm + 1e-4;
          const sepZ =
            boxA.zCm + boxA.heightCm <= boxB.zCm + 1e-4 ||
            boxB.zCm + boxB.heightCm <= boxA.zCm + 1e-4;
          assert.ok(
            sepX || sepY || sepZ,
            `QC iter ${iter}: 3D AABB overlap between boxes in bin ${b.id}`
          );
        }
      }
    }

    assert.equal(
      placedCount + res.unplacedUnits,
      requestedUnits,
      `QC iter ${iter}: unit conservation mismatch (${placedCount} + ${res.unplacedUnits} !== ${requestedUnits})`
    );

    const unplacedDetailSum = (res.unplacedItems ?? []).reduce(
      (s, u) => s + u.count,
      0
    );
    assert.equal(
      unplacedDetailSum,
      res.unplacedUnits,
      `QC iter ${iter}: unplacedItems sum mismatch`
    );

    if (res.mode === 'optimized_3d') {
      assert.equal(
        res.kpis.safetyViolations,
        0,
        `QC iter ${iter}: 3D optimized slotting produced safety violation`
      );
    }

    if (iter % 20 === 0 && bins.length >= 2) {
      const mutated = bins.map((b, idx) =>
        idx === 0
          ? {
              ...b,
              xMeters: bins[1].xMeters,
              yMeters: bins[1].yMeters,
              zMeters: bins[1].zMeters,
            }
          : b
      );
      const resolved = resolveShelfCollisions3D(mutated, cfg, [bins[0].id]);
      for (let i = 0; i < resolved.length; i++) {
        for (let j = i + 1; j < resolved.length; j++) {
          assert.equal(
            checkShelfPairOverlap3D(resolved[i], resolved[j], 0.04).overlaps,
            false,
            `QC iter ${iter}: shelf collision not resolved between ${resolved[i].id} and ${resolved[j].id}`
          );
        }
      }
    }
  }

  assert.ok(totalBoxesVerified > 50000);
});

test('5,000-Iteration QA End-to-End Workflow Suite: 24 templates, 6 scenarios, exact box count pins, cargo transfers, pick routes, CSV/CAD pipelines, and Hybrid AI audits', () => {
  const allSpaces = [...WAREHOUSE_TEMPLATES, ...SAMPLE_SCENARIOS];
  const hangulRe = /[\uAC00-\uD7A3]/;

  const precomputed = allSpaces.map((space) => {
    const bins = generateWarehouseBins(space.config);
    const base = runBaseline2DSlotting(bins, space.skus, space.config);
    const opt = runOptimized3DSlotting(bins, space.skus, space.config);
    return { space, bins, base, opt };
  });

  for (let qaIter = 0; qaIter < 5000; qaIter++) {
    const entry = precomputed[qaIter % precomputed.length];
    const { space, bins, base, opt } = entry;

    for (const r of [base, opt]) {
      assert.ok(Number.isFinite(r.kpis.cubicUtilizationPct));
      assert.ok(Number.isFinite(r.kpis.honeycombingWastePct));
      assert.ok(Number.isFinite(r.kpis.avgCycleTimeSec));
      assert.ok(Number.isFinite(r.kpis.goldenZoneHitRatePct));
      assert.ok(Number.isFinite(r.kpis.ergonomicsScore));
      assert.ok(Number.isFinite(r.kpis.travelEnergyIndex));
      assert.equal(hangulRe.test(space.name), false, `Scenario ${space.id} contains non-English text`);
    }

    const targetBin = bins[qaIter % bins.length];
    const targetSku = space.skus[qaIter % space.skus.length];
    const exactQty = (qaIter % 4) + 1;

    const { nextPins, totalPinnedForSku } = buildExactBinSkuPins(
      [],
      opt.allocations,
      targetBin.id,
      targetSku.id,
      exactQty
    );
    assert.ok(totalPinnedForSku >= exactQty);
    const pinForTarget = nextPins.find(
      (p) => p.binId === targetBin.id && p.skuId === targetSku.id
    );
    assert.equal(pinForTarget?.count, exactQty);

    if (qaIter % 25 === 0) {
      const anotherBin = bins[(qaIter + 1) % bins.length];
      const transferred = buildTransferredSkuPins(
        nextPins,
        opt.allocations,
        targetBin.id,
        anotherBin.id,
        targetSku.id,
        1
      );
      assert.ok(Array.isArray(transferred.nextPins));

      const zSummary = computeZLevelBreakdown(opt.allocations, space.config);
      assert.ok(zSummary.length > 0);

      const ctx = buildWarehousePromptContext(
        base,
        opt,
        space.config,
        opt.allocations[0] ?? null
      );
      const auditText = generateLocalDeterministicAudit(
        'Check Golden Zone hit rate, safety, and pick route speed',
        ctx
      );
      assert.ok(auditText.includes('Local On-Device Slotting Engine'));
      assert.equal(hangulRe.test(auditText), false);

      const actions = deriveRecommendedActions(
        'Check Golden Zone hit rate, safety, and pick route speed',
        ctx,
        auditText
      );
      assert.ok(actions.length > 0);
    }

    if (qaIter % 100 === 0) {
      const svg = generateWarehouseSVG(opt, space.config, space.name, {
        includeCartons: true,
        includePickRoute: true,
        includeLabels: true,
        includeElevation: true,
        planLevelFilter: 'all',
      });
      assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
      assert.equal(svg.includes('NaN'), false);

      const dxf = generateWarehouseDXF(opt, space.config, space.name, {
        includeCartons: false,
        includePickRoute: true,
        includeLabels: true,
        includeElevation: true,
        planLevelFilter: 'all',
      });
      assert.ok(dxf.includes('EOF'));
      assert.equal(dxf.includes('NaN'), false);

      const csvSample = `skuCode,name,category,abcClass,dailyPicks,lengthCm,widthCm,heightCm,weightKg,quantity,fragile\nQA-${qaIter},QA Box ${qaIter},QA,A,120,30,22,18,3.5,4,false`;
      const parsed = parseSkusFromCSV(csvSample);
      assert.equal(parsed.length, 1);
      assert.equal(parsed[0].skuCode, `QA-${qaIter}`);
    }
  }
});
