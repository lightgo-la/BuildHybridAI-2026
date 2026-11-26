import type {
  BinAllocation,
  BinSpec,
  EquipmentMode,
  PackedBox,
  PickWaypoint,
  PinnedCargoPlacement,
  SKUItem,
  SlottingResult,
  UnplacedItemDetail,
  WarehouseConfig,
  WarehouseKPIs,
  ZLevelSummary,
} from '../types/warehouse';

const LEVEL_HEIGHTS_M = [0.05, 0.85, 1.55, 2.35, 3.15, 3.95];
const LEVEL_MAX_WEIGHTS_KG = [1200, 750, 600, 420, 280, 200];
const DEFAULT_BIN_L_CM = 120;
const DEFAULT_BIN_W_CM = 90;
const DEFAULT_BIN_H_CM = 70;
const DEFAULT_AISLE_SPACING_M = 3.4;
const DEFAULT_BAY_SPACING_M = 1.45;

export function generateWarehouseBins(config: WarehouseConfig): BinSpec[] {
  const bins: BinSpec[] = [];
  const aisleSpacingM = config.aisleSpacingM ?? DEFAULT_AISLE_SPACING_M;
  const baySpacingM = config.baySpacingM ?? DEFAULT_BAY_SPACING_M;
  const binLengthCm = config.binLengthCm ?? DEFAULT_BIN_L_CM;
  const binWidthCm = config.binWidthCm ?? DEFAULT_BIN_W_CM;
  const binHeightCm = config.binHeightCm ?? DEFAULT_BIN_H_CM;

  for (let a = 1; a <= config.aisles; a++) {
    for (let b = 1; b <= config.baysPerAisle; b++) {
      const customPitchM =
        binHeightCm > 72 ? Number((binHeightCm / 100 + 0.12).toFixed(2)) : null;
      for (let l = 1; l <= config.levels; l++) {
        const zMeters =
          customPitchM !== null
            ? Number((0.05 + (l - 1) * customPitchM).toFixed(2))
            : LEVEL_HEIGHTS_M[l - 1] ?? Number(((l - 1) * 0.82 + 0.05).toFixed(2));
        const maxWeightKg = LEVEL_MAX_WEIGHTS_KG[l - 1] ?? 200;
        const isGoldenZone =
          zMeters >= config.goldenZoneMinM && zMeters <= config.goldenZoneMaxM;

        bins.push({
          id: `A${a}-B${b}-Z${l}`,
          aisle: a,
          bay: b,
          level: l,
          xMeters: Number(((a - 1) * aisleSpacingM).toFixed(2)),
          yMeters: Number(((b - 1) * baySpacingM + 1.8).toFixed(2)),
          zMeters,
          binLengthCm,
          binWidthCm,
          binHeightCm,
          maxWeightKg,
          isGoldenZone,
        });
      }
    }
  }
  return bins;
}

interface Orientation {
  l: number;
  w: number;
  h: number;
  rotated: boolean;
}

function getOrientations(sku: SKUItem): Orientation[] {
  const { lengthCm: L, widthCm: W, heightCm: H, fragile } = sku;
  if (fragile) {
    // Fragile items keep vertical orientation (H upright)
    return [
      { l: L, w: W, h: H, rotated: false },
      { l: W, w: L, h: H, rotated: true },
    ];
  }
  const perms: Orientation[] = [
    { l: L, w: W, h: H, rotated: false },
    { l: W, w: L, h: H, rotated: true },
    { l: L, w: H, h: W, rotated: true },
    { l: H, w: L, h: W, rotated: true },
    { l: W, w: H, h: L, rotated: true },
    { l: H, w: W, h: L, rotated: true },
  ];
  // Deduplicate identical dimensions
  const seen = new Set<string>();
  return perms.filter((p) => {
    const key = `${p.l}x${p.w}x${p.h}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function boxesOverlap(
  ax: number,
  ay: number,
  az: number,
  al: number,
  aw: number,
  ah: number,
  b: PackedBox
): boolean {
  return (
    ax < b.xCm + b.lengthCm &&
    ax + al > b.xCm &&
    ay < b.yCm + b.widthCm &&
    ay + aw > b.yCm &&
    az < b.zCm + b.heightCm &&
    az + ah > b.zCm
  );
}

function hasPhysicalSupport(
  x: number,
  y: number,
  z: number,
  l: number,
  w: number,
  candidateWeightKg: number,
  enforceWeightStability: boolean,
  boxes: PackedBox[]
): boolean {
  if (z === 0) return true;
  const baseArea = l * w;
  if (baseArea <= 0) return false;

  let supportedArea = 0;
  for (const b of boxes) {
    if (Math.abs(b.zCm + b.heightCm - z) > 0.01) continue;
    const overlapX = Math.max(0, Math.min(x + l, b.xCm + b.lengthCm) - Math.max(x, b.xCm));
    const overlapY = Math.max(0, Math.min(y + w, b.yCm + b.widthCm) - Math.max(y, b.yCm));
    if (overlapX > 0 && overlapY > 0) {
      // Do not stack items directly onto a fragile carton
      if (b.fragile) return false;
      // In 3D Optimized mode, block crushing heavy-on-light stacking (>1.45x weight ratio)
      if (enforceWeightStability && candidateWeightKg > b.weightKg * 1.45) {
        return false;
      }
      supportedArea += overlapX * overlapY;
    }
  }
  return supportedArea >= baseArea * 0.7;
}

function tryPackIntoBin(
  alloc: BinAllocation,
  sku: SKUItem,
  allowRotation: boolean,
  bestFitMode = false
): PackedBox | null {
  if (alloc.currentWeightKg + sku.weightKg > alloc.bin.maxWeightKg) {
    return null;
  }
  const unitVolumeCm3 = sku.lengthCm * sku.widthCm * sku.heightCm;
  if (alloc.usedVolumeCm3 + unitVolumeCm3 > alloc.totalVolumeCm3) {
    return null;
  }

  const orientations = allowRotation
    ? getOrientations(sku)
    : [{ l: sku.lengthCm, w: sku.widthCm, h: sku.heightCm, rotated: false }];

  // Generate candidate bottom-left-front anchor coordinates from existing boxes
  const xs = new Set<number>([0]);
  const ys = new Set<number>([0]);
  const zs = new Set<number>([0]);

  for (const b of alloc.boxes) {
    xs.add(b.xCm + b.lengthCm);
    ys.add(b.yCm + b.widthCm);
    zs.add(b.zCm + b.heightCm);
  }

  const sortedX = [...xs].sort((a, b) => a - b);
  const sortedY = [...ys].sort((a, b) => a - b);
  const sortedZ = [...zs].sort((a, b) => a - b);

  const { binLengthCm: BL, binWidthCm: BW, binHeightCm: BH } = alloc.bin;

  // Prefer lower Z first (stability), then Y, then X; in Best-Fit mode evaluate all valid orientations at the first fit anchor
  for (const z of sortedZ) {
    for (const y of sortedY) {
      for (const x of sortedX) {
        let bestOri: Orientation | null = null;
        let bestPenalty = Infinity;

        for (const ori of orientations) {
          if (x + ori.l > BL || y + ori.w > BW || z + ori.h > BH) {
            continue;
          }
          if (
            !hasPhysicalSupport(
              x,
              y,
              z,
              ori.l,
              ori.w,
              sku.weightKg,
              bestFitMode,
              alloc.boxes
            )
          ) {
            continue;
          }
          let collides = false;
          for (const existing of alloc.boxes) {
            if (boxesOverlap(x, y, z, ori.l, ori.w, ori.h, existing)) {
              collides = true;
              break;
            }
          }
          if (!collides) {
            if (!bestFitMode) {
              bestOri = ori;
              break;
            }
            // Score orientation: favor lower stack height (center of gravity) & tight edge alignment
            const remX = BL - (x + ori.l);
            const remY = BW - (y + ori.w);
            const remZ = BH - (z + ori.h);
            const tightBonus =
              (remX < 4 ? 0 : remX * 0.25) +
              (remY < 4 ? 0 : remY * 0.25) +
              remZ * 0.12 +
              ori.h * 0.65;
            if (tightBonus < bestPenalty) {
              bestPenalty = tightBonus;
              bestOri = ori;
            }
          }
        }

        if (bestOri) {
          const box: PackedBox = {
            skuId: sku.id,
            skuCode: sku.skuCode,
            name: sku.name,
            abcClass: sku.abcClass,
            xCm: x,
            yCm: y,
            zCm: z,
            lengthCm: bestOri.l,
            widthCm: bestOri.w,
            heightCm: bestOri.h,
            weightKg: sku.weightKg,
            fragile: sku.fragile,
            rotated: bestOri.rotated,
            color: sku.color,
            dailyPicksShare: sku.dailyPicks / Math.max(1, sku.quantity),
          };
          alloc.boxes.push(box);
          alloc.usedVolumeCm3 += bestOri.l * bestOri.w * bestOri.h;
          alloc.currentWeightKg += sku.weightKg;
          alloc.dailyPickLoad += box.dailyPicksShare;
          alloc.cubicUtilizationPct =
            alloc.totalVolumeCm3 > 0
              ? (alloc.usedVolumeCm3 / alloc.totalVolumeCm3) * 100
              : 0;
          return box;
        }
      }
    }
  }
  return null;
}

export function computeAisleTravelDistanceM(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  corridorYMeters = 0.75
): number {
  const dx = Math.abs(x2 - x1);
  if (dx < 0.35) {
    return dx + Math.abs(y2 - y1);
  }
  // Changing aisles: if both points are deep inside rack bays (> corridorYMeters),
  // route via the front cross-aisle corridor rather than cutting through solid racks.
  if (y1 > corridorYMeters && y2 > corridorYMeters) {
    return (y1 - corridorYMeters) + dx + (y2 - corridorYMeters);
  }
  return dx + Math.abs(y2 - y1);
}

export function computeCycleTimeSec(
  bin: BinSpec,
  equipmentMode: EquipmentMode,
  aisles = 3,
  aisleSpacingM = DEFAULT_AISLE_SPACING_M,
  depotXMeters?: number,
  depotYMeters?: number,
  obstacles?: WarehouseConfig['obstacles']
): number {
  const depotX = depotXMeters ?? ((Math.max(1, aisles) - 1) * aisleSpacingM) / 2;
  const depotY = depotYMeters ?? 0;
  const corridorY = Math.min(depotY + 0.75, 0.85);
  const horizontalDist = computeAisleTravelDistanceM(
    depotX,
    depotY,
    bin.xMeters,
    bin.yMeters,
    corridorY
  );
  const verticalDist = bin.zMeters;

  // Obstacle / pillar proximity detour penalty when a structural pillar blocks direct bay access
  let obstacleDetourSec = 0;
  if (obstacles && obstacles.length > 0) {
    for (const obs of obstacles) {
      const dist = Math.hypot(bin.xMeters - obs.xMeters, bin.yMeters - obs.yMeters);
      if (dist < 1.15) {
        obstacleDetourSec += 1.8;
        break;
      }
    }
  }

  if (equipmentMode === 'asrs_crane') {
    // Chebyshev distance: simultaneous horizontal & vertical crane motion
    const vx = 2.6; // m/s
    const vz = 1.35; // m/s
    const oneWay = Math.max(horizontalDist / vx, verticalDist / vz);
    return oneWay * 2 + 2.4 + obstacleDetourSec; // + shuttle engage
  }

  // Reach Truck: horizontal travel + sequential mast lift/lower
  const walkSpeed = 1.9; // m/s
  const mastSpeed = 0.55; // m/s
  const oneWay = horizontalDist / walkSpeed + verticalDist / mastSpeed;
  return oneWay * 2 + 3.5 + obstacleDetourSec; // + pick & confirm
}

function createEmptyAllocations(bins: BinSpec[]): BinAllocation[] {
  return bins.map((bin) => ({
    bin,
    boxes: [],
    usedVolumeCm3: 0,
    totalVolumeCm3: bin.binLengthCm * bin.binWidthCm * bin.binHeightCm,
    cubicUtilizationPct: 0,
    currentWeightKg: 0,
    dailyPickLoad: 0,
    ergonomicsPenalty: 0,
    safetyViolation: false,
    goldenZoneAligned: false,
  }));
}

function evaluateAllocations(
  allocations: BinAllocation[],
  config: WarehouseConfig,
  skus: SKUItem[],
  mode: 'baseline_2d' | 'optimized_3d',
  unplacedUnits: number,
  unplacedItems: UnplacedItemDetail[] = []
): SlottingResult {
  const occupied = allocations.filter((a) => a.boxes.length > 0);
  let totalUsedVol = 0;
  let totalCapVol = 0;
  let weightedCycleSum = 0;
  let totalPickLoad = 0;
  let goldenAPicks = 0;
  let totalAPicks = 0;
  let safetyViolations = 0;
  let totalErgoPenalty = 0;
  let maxPickLoad = 0;

  const skuMap = new Map(skus.map((s) => [s.id, s]));
  const heavyCutoffKg = config.optimizationPreset === 'safety' ? 10 : 16;

  for (const alloc of occupied) {
    totalUsedVol += alloc.usedVolumeCm3;
    totalCapVol += alloc.totalVolumeCm3;

    const cycleSec = computeCycleTimeSec(
      alloc.bin,
      config.equipmentMode,
      config.aisles,
      config.aisleSpacingM,
      config.depotXMeters,
      config.depotYMeters,
      config.obstacles
    );
    weightedCycleSum += cycleSec * alloc.dailyPickLoad;
    totalPickLoad += alloc.dailyPickLoad;

    if (alloc.dailyPickLoad > maxPickLoad) {
      maxPickLoad = alloc.dailyPickLoad;
    }

    let binPenalty = 0;
    let binSafetyViolation = false;
    let hasClassA = false;

    for (const box of alloc.boxes) {
      const sku = skuMap.get(box.skuId);
      if (!sku) continue;
      if (sku.abcClass === 'A') {
        hasClassA = true;
        totalAPicks += box.dailyPicksShare;
        if (alloc.bin.isGoldenZone) {
          goldenAPicks += box.dailyPicksShare;
        } else {
          binPenalty += box.dailyPicksShare * (alloc.bin.level >= 4 ? 1.8 : 1.1);
        }
      }
      // Heavy items (>16kg, or >10kg in safety preset) on high racks (level >= 3) pose ergonomic/stability hazard
      if (box.weightKg > heavyCutoffKg && alloc.bin.level >= 3) {
        binSafetyViolation = true;
        binPenalty += 25 * (alloc.bin.level - 1);
      }
    }

    if (binSafetyViolation) safetyViolations++;
    alloc.safetyViolation = binSafetyViolation;
    alloc.ergonomicsPenalty = binPenalty;
    alloc.goldenZoneAligned = hasClassA && alloc.bin.isGoldenZone;
    totalErgoPenalty += binPenalty;
  }

  const cubicUtilizationPct =
    totalCapVol > 0 ? (totalUsedVol / totalCapVol) * 100 : 0;
  const honeycombingWastePct = Math.max(0, 100 - cubicUtilizationPct);
  const avgCycleTimeSec =
    totalPickLoad > 0 ? weightedCycleSum / totalPickLoad : 0;
  const goldenZoneHitRatePct =
    totalAPicks > 0 ? (goldenAPicks / totalAPicks) * 100 : 100;

  // Ergonomics score (0..100)
  const normalizedPenalty = totalPickLoad > 0 ? totalErgoPenalty / totalPickLoad : 0;
  const ergonomicsScore = Math.max(
    15,
    Math.min(100, 100 - normalizedPenalty * 42 - safetyViolations * 6)
  );

  // Energy index combining cycle time + vertical lift penalty
  const avgZ =
    occupied.length > 0
      ? occupied.reduce((acc, a) => acc + a.bin.zMeters * a.dailyPickLoad, 0) /
        Math.max(1, totalPickLoad)
      : 1;
  const travelEnergyIndex = avgCycleTimeSec * (1 + avgZ * 0.14);

  // Max single-bin congestion relative to ideal balanced load
  const idealPerOccupied = totalPickLoad / Math.max(1, occupied.length);
  const maxCongestionPct =
    idealPerOccupied > 0
      ? Math.min(100, (maxPickLoad / (idealPerOccupied * 3.2)) * 100)
      : 0;

  // Build sample 5-stop wave pick route for the top A-class bins
  const hotBinsRaw = [...occupied]
    .sort((a, b) => b.dailyPickLoad - a.dailyPickLoad)
    .slice(0, 5);

  const depotX =
    config.depotXMeters ??
    ((Math.max(1, config.aisles) - 1) * (config.aisleSpacingM ?? DEFAULT_AISLE_SPACING_M)) /
      2;
  const depotY = config.depotYMeters ?? 0;
  const corridorY = Math.min(depotY + 0.75, 0.85);

  let orderedHotBins = hotBinsRaw;
  if (mode === 'optimized_3d' && hotBinsRaw.length > 1) {
    // Nearest-Neighbor TSP ordering starting from I/O Depot using real aisle-corridor travel
    const remaining = [...hotBinsRaw];
    orderedHotBins = [];
    let curX = depotX;
    let curY = depotY;
    let curZ = 0;
    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestCost = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const b = remaining[i].bin;
        const dXY = computeAisleTravelDistanceM(
          curX,
          curY,
          b.xMeters,
          b.yMeters,
          corridorY
        );
        const dZ = Math.abs(b.zMeters - curZ);
        const cost = dXY + dZ * 1.6;
        if (cost < bestCost) {
          bestCost = cost;
          bestIdx = i;
        }
      }
      const nextStop = remaining.splice(bestIdx, 1)[0];
      orderedHotBins.push(nextStop);
      curX = nextStop.bin.xMeters;
      curY = nextStop.bin.yMeters;
      curZ = nextStop.bin.zMeters;
    }
  }

  let prevX = depotX;
  let prevY = depotY;
  let prevZ = 0;
  const pickRoute: PickWaypoint[] = orderedHotBins.map((a) => {
    const legH = computeAisleTravelDistanceM(
      prevX,
      prevY,
      a.bin.xMeters,
      a.bin.yMeters,
      corridorY
    );
    const legV = Math.abs(a.bin.zMeters - prevZ);
    const legSec =
      config.equipmentMode === 'asrs_crane'
        ? Math.max(legH / 2.6, legV / 1.35) + 1.4
        : legH / 1.9 + legV / 0.55 + 2.2;
    prevX = a.bin.xMeters;
    prevY = a.bin.yMeters;
    prevZ = a.bin.zMeters;
    return {
      binId: a.bin.id,
      xMeters: a.bin.xMeters,
      yMeters: a.bin.yMeters,
      zMeters: a.bin.zMeters,
      skuCode: a.boxes[0]?.skuCode ?? 'SKU',
      stepTimeSec: Number(legSec.toFixed(1)),
    };
  });

  const kpis: WarehouseKPIs = {
    cubicUtilizationPct: Number(cubicUtilizationPct.toFixed(1)),
    honeycombingWastePct: Number(honeycombingWastePct.toFixed(1)),
    avgCycleTimeSec: Number(avgCycleTimeSec.toFixed(1)),
    travelEnergyIndex: Number(travelEnergyIndex.toFixed(1)),
    goldenZoneHitRatePct: Number(goldenZoneHitRatePct.toFixed(1)),
    ergonomicsScore: Number(ergonomicsScore.toFixed(1)),
    safetyViolations,
    maxCongestionPct: Number(maxCongestionPct.toFixed(1)),
    occupiedBins: occupied.length,
    totalBins: allocations.length,
  };

  return {
    mode,
    allocations,
    unplacedUnits,
    unplacedItems,
    kpis,
    pickRoute,
  };
}

function recordUnplaced(
  map: Map<string, UnplacedItemDetail>,
  sku: SKUItem,
  count: number,
  reason: UnplacedItemDetail['reason']
): void {
  if (count <= 0) return;
  const existing = map.get(sku.id);
  if (existing) {
    existing.count += count;
  } else {
    map.set(sku.id, {
      skuId: sku.id,
      skuCode: sku.skuCode,
      name: sku.name,
      count,
      reason,
    });
  }
}

function applyPinnedPlacements(
  allocations: BinAllocation[],
  skus: SKUItem[],
  pinnedPlacements: PinnedCargoPlacement[],
  allowRotation: boolean,
  bestFitMode = false,
  unplacedMap?: Map<string, UnplacedItemDetail>
): { remainingSkus: SKUItem[]; unplacedPinned: number } {
  if (pinnedPlacements.length === 0) {
    return { remainingSkus: skus, unplacedPinned: 0 };
  }

  const allocMap = new Map(allocations.map((a) => [a.bin.id, a]));
  const remainingQty = new Map(skus.map((s) => [s.id, s.quantity]));
  const skuMap = new Map(skus.map((s) => [s.id, s]));
  let unplacedPinned = 0;

  for (const pin of pinnedPlacements) {
    const alloc = allocMap.get(pin.binId);
    const sku = skuMap.get(pin.skuId);
    if (!alloc || !sku) continue;

    for (let i = 0; i < pin.count; i++) {
      const avail = remainingQty.get(sku.id) ?? 0;
      if (avail <= 0) break;
      const packed = tryPackIntoBin(alloc, sku, allowRotation, bestFitMode);
      if (packed) {
        remainingQty.set(sku.id, avail - 1);
      } else {
        unplacedPinned++;
        if (unplacedMap) {
          const reason: UnplacedItemDetail['reason'] =
            alloc.currentWeightKg + sku.weightKg > alloc.bin.maxWeightKg
              ? 'weight_or_safety_limit'
              : 'volume_full';
          recordUnplaced(unplacedMap, sku, 1, reason);
        }
      }
    }
  }

  const remainingSkus = skus.map((s) => ({
    ...s,
    quantity: remainingQty.get(s.id) ?? 0,
  }));

  return { remainingSkus, unplacedPinned };
}

export function runBaseline2DSlotting(
  bins: BinSpec[],
  skus: SKUItem[],
  config: WarehouseConfig,
  pinnedPlacements: PinnedCargoPlacement[] = []
): SlottingResult {
  const allocations = createEmptyAllocations(bins);
  const unplacedMap = new Map<string, UnplacedItemDetail>();
  const { remainingSkus, unplacedPinned } = applyPinnedPlacements(
    allocations,
    skus,
    pinnedPlacements,
    false,
    false,
    unplacedMap
  );

  // 2D sort: strictly by Bay (Y), then Aisle (X), filling Z top-to-bottom or sequentially (ignoring ergonomics)
  const orderedBins = [...allocations].sort((a, b) => {
    if (a.bin.bay !== b.bin.bay) return a.bin.bay - b.bin.bay;
    if (a.bin.aisle !== b.bin.aisle) return a.bin.aisle - b.bin.aisle;
    return b.bin.level - a.bin.level; // poor Z-discipline: fills upper racks early
  });

  // 2D slotting puts SKUs sequentially by pick frequency without 3D divider mixing optimization
  const sortedSkus = [...remainingSkus].sort((a, b) => b.dailyPicks - a.dailyPicks);
  let unplacedUnits = unplacedPinned;

  let binCursor = 0;
  for (const sku of sortedSkus) {
    let remaining = sku.quantity;
    while (remaining > 0) {
      let placed = false;
      for (let offset = 0; offset < orderedBins.length; offset++) {
        const candidate = orderedBins[(binCursor + offset) % orderedBins.length];
        // Naive 2D: don't mix SKUs inside a bin and don't rotate in 3D
        const sameSkuOnly =
          candidate.boxes.length === 0 ||
          candidate.boxes.every((b) => b.skuId === sku.id);
        if (!sameSkuOnly) continue;

        const box = tryPackIntoBin(candidate, sku, false);
        if (box) {
          placed = true;
          remaining--;
          if (candidate.boxes.length >= 4) {
            binCursor = (binCursor + offset + 1) % orderedBins.length;
          }
          break;
        }
      }
      if (!placed) {
        // Fallback pass for high-SKU-count catalogs (e.g. 100+ distinct SKUs): allow sharing partially filled bins in 2D unrotated mode
        for (let offset = 0; offset < orderedBins.length; offset++) {
          const candidate = orderedBins[(binCursor + offset) % orderedBins.length];
          const box = tryPackIntoBin(candidate, sku, false);
          if (box) {
            placed = true;
            remaining--;
            break;
          }
        }
      }
      if (!placed) {
        unplacedUnits += remaining;
        recordUnplaced(unplacedMap, sku, remaining, 'volume_full');
        break;
      }
    }
  }

  return evaluateAllocations(
    allocations,
    config,
    skus,
    'baseline_2d',
    unplacedUnits,
    [...unplacedMap.values()]
  );
}

export function runOptimized3DSlotting(
  bins: BinSpec[],
  skus: SKUItem[],
  config: WarehouseConfig,
  pinnedPlacements: PinnedCargoPlacement[] = []
): SlottingResult {
  const allocations = createEmptyAllocations(bins);
  const preset = config.optimizationPreset ?? 'balanced';
  const heavyCutoffKg = preset === 'safety' ? 10 : 16;
  const allowRotation = config.allowRotationAndCoPack ?? true;
  const unplacedMap = new Map<string, UnplacedItemDetail>();
  const { remainingSkus, unplacedPinned } = applyPinnedPlacements(
    allocations,
    skus,
    pinnedPlacements,
    allowRotation,
    true,
    unplacedMap
  );

  // Prioritize heavy items first (weight base layer stability), then ABC tier & dailyPicks velocity
  const prioritizedUnits: SKUItem[] = [];
  const sortedSkus = [...remainingSkus].sort((a, b) => {
    const tierA = a.abcClass === 'A' ? 90 : a.abcClass === 'B' ? 30 : 0;
    const tierB = b.abcClass === 'A' ? 90 : b.abcClass === 'B' ? 30 : 0;
    const scoreA =
      tierA +
      a.dailyPicks * 1.4 +
      (a.weightKg > heavyCutoffKg ? 250 : a.weightKg * 2.5);
    const scoreB =
      tierB +
      b.dailyPicks * 1.4 +
      (b.weightKg > heavyCutoffKg ? 250 : b.weightKg * 2.5);
    return scoreB - scoreA;
  });

  for (const sku of sortedSkus) {
    for (let q = 0; q < sku.quantity; q++) {
      prioritizedUnits.push(sku);
    }
  }

  let unplacedUnits = unplacedPinned;

  const goldenBonusA = preset === 'speed' ? 210 : preset === 'safety' ? 120 : 140;
  const cycleMultA = preset === 'speed' ? 6.5 : preset === 'density' ? 3.2 : 4.2;
  const coPackMaxUtil = preset === 'density' ? 95 : preset === 'safety' ? 75 : 88;
  const coPackBonus = preset === 'density' ? 42 : 24;
  const sameSkuBonus = preset === 'density' ? 76 : 65;
  const allowCoPack = config.allowRotationAndCoPack ?? true;

  // Precompute constant cycle time per bin once (eliminates O(Units * Bins) redundant kinematics calls)
  const binCycleCache = new Map<string, number>();
  for (const alloc of allocations) {
    binCycleCache.set(
      alloc.bin.id,
      computeCycleTimeSec(
        alloc.bin,
        config.equipmentMode,
        config.aisles,
        config.aisleSpacingM,
        config.depotXMeters,
        config.depotYMeters,
        config.obstacles
      )
    );
  }

  for (const sku of prioritizedUnits) {
    // Score candidate bins dynamically for this SKU unit
    const scoredBins = allocations
      .map((alloc) => {
        const { bin } = alloc;
        // Hard safety constraint in 3D optimization: heavy items stay on Z1-Z2
        if (sku.weightKg > heavyCutoffKg && bin.level > 2) {
          return { alloc, score: -Infinity };
        }
        if (alloc.currentWeightKg + sku.weightKg > bin.maxWeightKg) {
          return { alloc, score: -Infinity };
        }

        let score = 0;
        const cycleSec = binCycleCache.get(bin.id) ?? 10;

        if (sku.abcClass === 'A') {
          if (bin.isGoldenZone) score += goldenBonusA;
          else if (bin.level === 1 && sku.weightKg > heavyCutoffKg) score += 110;
          else score -= 45 * Math.abs(bin.level - 2.5);
        } else if (sku.abcClass === 'B') {
          if (bin.isGoldenZone) score += 45;
          else if (bin.level === 4) score += 25;
        } else {
          if (bin.level >= 4 && sku.weightKg <= 12) score += 75;
          if (bin.isGoldenZone) score -= 55;
        }

        if (sku.weightKg > heavyCutoffKg && bin.level === 1) {
          score += preset === 'safety' ? 135 : 95;
        }

        score -= cycleSec * (sku.abcClass === 'A' ? cycleMultA : 1.4);

        if (alloc.boxes.length > 0) {
          const sameSkuCount = alloc.boxes.filter((b) => b.skuId === sku.id).length;
          if (sameSkuCount > 0) {
            score += sameSkuBonus;
          } else if (allowCoPack && alloc.cubicUtilizationPct < coPackMaxUtil) {
            score += coPackBonus;
          } else if (!allowCoPack) {
            return { alloc, score: -Infinity };
          }
        }

        score -= alloc.dailyPickLoad * (preset === 'density' ? 0.25 : 0.45);

        return { alloc, score };
      })
      .filter((item) => item.score > -Infinity)
      .sort((a, b) => b.score - a.score);

    const allowRotation = config.allowRotationAndCoPack ?? true;
    let placed = false;
    for (const candidate of scoredBins) {
      if (tryPackIntoBin(candidate.alloc, sku, allowRotation, true)) {
        placed = true;
        break;
      }
    }
    if (!placed) {
      unplacedUnits++;
      const reason: UnplacedItemDetail['reason'] =
        sku.weightKg > heavyCutoffKg || scoredBins.length === 0
          ? 'weight_or_safety_limit'
          : 'volume_full';
      recordUnplaced(unplacedMap, sku, 1, reason);
    }
  }

  return evaluateAllocations(
    allocations,
    config,
    skus,
    'optimized_3d',
    unplacedUnits,
    [...unplacedMap.values()]
  );
}

export function computeZLevelBreakdown(
  allocations: BinAllocation[],
  config: WarehouseConfig
): ZLevelSummary[] {
  const totalPickLoad = allocations.reduce((acc, a) => acc + a.dailyPickLoad, 0);
  const maxLevel = allocations.reduce(
    (max, a) => Math.max(max, a.bin.level),
    config.levels
  );
  const summaries: ZLevelSummary[] = [];

  for (let level = 1; level <= maxLevel; level++) {
    const levelBins = allocations.filter((a) => a.bin.level === level);
    const occupied = levelBins.filter((a) => a.boxes.length > 0);
    const avgCubicPct =
      occupied.length > 0
        ? occupied.reduce((acc, a) => acc + a.cubicUtilizationPct, 0) /
          occupied.length
        : 0;
    const levelPickLoad = levelBins.reduce((acc, a) => acc + a.dailyPickLoad, 0);
    const safetyViolations = levelBins.filter((a) => a.safetyViolation).length;

    summaries.push({
      level,
      zMeters: levelBins[0]?.bin.zMeters ?? 0,
      isGoldenZone: Boolean(levelBins[0]?.bin.isGoldenZone),
      totalBins: levelBins.length,
      occupiedBins: occupied.length,
      avgCubicPct: Number(avgCubicPct.toFixed(1)),
      pickLoadSharePct:
        totalPickLoad > 0
          ? Number(((levelPickLoad / totalPickLoad) * 100).toFixed(1))
          : 0,
      safetyViolations,
    });
  }
  return summaries;
}

export function buildTransferredSkuPins(
  prevPins: PinnedCargoPlacement[],
  allocations: BinAllocation[],
  fromBinId: string,
  toBinId: string | null,
  skuId: string,
  transferCount: number | 'all' = 1
): { nextPins: PinnedCargoPlacement[]; movedCount: number } {
  const currentCounts = new Map<string, number>();
  for (const alloc of allocations) {
    const cnt = alloc.boxes.filter((b) => b.skuId === skuId).length;
    if (cnt > 0) {
      currentCounts.set(alloc.bin.id, cnt);
    }
  }

  if (currentCounts.size === 0) {
    for (const p of prevPins) {
      if (p.skuId === skuId && p.count > 0) {
        currentCounts.set(p.binId, (currentCounts.get(p.binId) ?? 0) + p.count);
      }
    }
  }

  const fromCount = currentCounts.get(fromBinId) ?? 0;
  const actualMove =
    transferCount === 'all'
      ? Math.max(1, fromCount)
      : Math.max(1, Math.min(fromCount || 1, transferCount));

  if (fromCount <= actualMove) {
    currentCounts.delete(fromBinId);
  } else {
    currentCounts.set(fromBinId, fromCount - actualMove);
  }

  if (toBinId) {
    currentCounts.set(toBinId, (currentCounts.get(toBinId) ?? 0) + actualMove);
  }

  const otherSkuPins = prevPins.filter((p) => p.skuId !== skuId);
  const updatedSkuPins: PinnedCargoPlacement[] = [];

  if (toBinId && currentCounts.has(toBinId)) {
    updatedSkuPins.push({
      binId: toBinId,
      skuId,
      count: currentCounts.get(toBinId)!,
    });
  }
  for (const [bId, count] of currentCounts.entries()) {
    if (bId !== toBinId && count > 0) {
      updatedSkuPins.push({ binId: bId, skuId, count });
    }
  }

  return {
    nextPins: [...updatedSkuPins, ...otherSkuPins],
    movedCount: actualMove,
  };
}
