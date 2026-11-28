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

const LEVEL_HEIGHTS_M = [0.05, 0.85, 1.61, 2.38, 3.15, 3.95];
const LEVEL_MAX_WEIGHTS_KG = [1200, 750, 600, 420, 280, 200];
const DEFAULT_BIN_L_CM = 120;
const DEFAULT_BIN_W_CM = 90;
const DEFAULT_BIN_H_CM = 70;
const DEFAULT_AISLE_SPACING_M = 3.4;
const DEFAULT_BAY_SPACING_M = 1.45;

export function generateWarehouseBins(config: WarehouseConfig): BinSpec[] {
  const bins: BinSpec[] = [];
  const disabledSet = new Set(config.disabledBinIds ?? []);
  const binLengthCm = config.binLengthCm ?? DEFAULT_BIN_L_CM;
  const binWidthCm = config.binWidthCm ?? DEFAULT_BIN_W_CM;
  const binHeightCm = config.binHeightCm ?? DEFAULT_BIN_H_CM;
  const minSafeAisleSpacingM = Number((binWidthCm / 100 + 0.24).toFixed(2));
  const minSafeBaySpacingM = Number((binLengthCm / 100 + 0.14).toFixed(2));
  const aisleSpacingM = Math.max(
    config.aisleSpacingM ?? DEFAULT_AISLE_SPACING_M,
    minSafeAisleSpacingM
  );
  const baySpacingM = Math.max(
    config.baySpacingM ?? DEFAULT_BAY_SPACING_M,
    minSafeBaySpacingM
  );

  for (let a = 1; a <= config.aisles; a++) {
    for (let b = 1; b <= config.baysPerAisle; b++) {
      const customPitchM =
        binHeightCm > 70 ? Number((binHeightCm / 100 + 0.12).toFixed(2)) : null;
      for (let l = 1; l <= config.levels; l++) {
        const id = `A${a}-B${b}-Z${l}`;
        if (disabledSet.has(id)) continue;
        const zMeters =
          customPitchM !== null
            ? Number((0.05 + (l - 1) * customPitchM).toFixed(2))
            : LEVEL_HEIGHTS_M[l - 1] ?? Number(((l - 1) * 0.82 + 0.05).toFixed(2));
        const maxWeightKg = LEVEL_MAX_WEIGHTS_KG[l - 1] ?? 200;
        const isGoldenZone =
          zMeters >= config.goldenZoneMinM && zMeters <= config.goldenZoneMaxM;

        bins.push({
          id,
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

export function checkShelfPairOverlap3D(
  a: BinSpec,
  b: BinSpec,
  clearanceM = 0.06
): {
  overlaps: boolean;
  overlapX: number;
  overlapY: number;
  overlapZ: number;
} {
  if (a.id === b.id) {
    return { overlaps: false, overlapX: 0, overlapY: 0, overlapZ: 0 };
  }
  const halfXA = a.binWidthCm / 200;
  const halfXB = b.binWidthCm / 200;
  const halfYA = a.binLengthCm / 200;
  const halfYB = b.binLengthCm / 200;
  const minZA = a.zMeters;
  const maxZA = a.zMeters + a.binHeightCm / 100;
  const minZB = b.zMeters;
  const maxZB = b.zMeters + b.binHeightCm / 100;

  const overlapX =
    halfXA + halfXB + clearanceM - Math.abs(b.xMeters - a.xMeters);
  const overlapY =
    halfYA + halfYB + clearanceM - Math.abs(b.yMeters - a.yMeters);
  const overlapZ =
    Math.min(maxZA + clearanceM * 0.5, maxZB + clearanceM * 0.5) -
    Math.max(minZA - clearanceM * 0.5, minZB - clearanceM * 0.5);

  return {
    overlaps: overlapX > 0.002 && overlapY > 0.002 && overlapZ > 0.002,
    overlapX,
    overlapY,
    overlapZ,
  };
}

export function resolveShelfCollisions3D(
  inputBins: BinSpec[],
  config: WarehouseConfig,
  movedBinIds: string[] = []
): BinSpec[] {
  if (inputBins.length <= 1) return inputBins;

  const movedSet = new Set(movedBinIds);
  const working = inputBins.map((b) => ({ ...b }));
  const clearanceXY = 0.08;
  const clearanceZ = 0.06;

  // Phase 1: Group bins that belong to the same vertical rack column (distinct Z levels at same X-Y center)
  // If a moved single bin lands on the exact same (X, Y) and same level as an existing bin, separate it horizontally
  const colGroups: Array<{
    key: string;
    cx: number;
    cy: number;
    halfX: number;
    halfY: number;
    isMovedGroup: boolean;
    memberIndices: number[];
  }> = [];

  for (let i = 0; i < working.length; i++) {
    const b = working[i];
    const bHalfX = b.binWidthCm / 200;
    const bHalfY = b.binLengthCm / 200;
    const isMoved = movedSet.has(b.id);

    let matchedGroup: (typeof colGroups)[number] | undefined;
    for (const g of colGroups) {
      if (Math.hypot(g.cx - b.xMeters, g.cy - b.yMeters) < 0.14) {
        const hasSameLevelConflict = g.memberIndices.some(
          (idx) => working[idx].level === b.level
        );
        if (!hasSameLevelConflict) {
          matchedGroup = g;
          break;
        }
      }
    }

    if (matchedGroup) {
      matchedGroup.memberIndices.push(i);
      matchedGroup.halfX = Math.max(matchedGroup.halfX, bHalfX);
      matchedGroup.halfY = Math.max(matchedGroup.halfY, bHalfY);
      if (isMoved) matchedGroup.isMovedGroup = true;
    } else {
      colGroups.push({
        key: `${b.id}_${i}`,
        cx: b.xMeters,
        cy: b.yMeters,
        halfX: bHalfX,
        halfY: bHalfY,
        isMovedGroup: isMoved,
        memberIndices: [i],
      });
    }
  }

  // Phase 2: Iterative 2D Rigid-Body AABB Minimum Translation Vector (MTV) Solver across Rack Columns & Obstacles
  const obstacles = config.obstacles ?? [];
  for (let iter = 0; iter < 64; iter++) {
    let anyMoved = false;

    // Obstacle / Pillar collision repulsion
    for (const g of colGroups) {
      for (const obs of obstacles) {
        const minDX = g.halfX + 0.42 + clearanceXY;
        const minDY = g.halfY + 0.42 + clearanceXY;
        const dx = g.cx - obs.xMeters;
        const dy = g.cy - obs.yMeters;
        const penX = minDX - Math.abs(dx);
        const penY = minDY - Math.abs(dy);
        if (penX > 0.001 && penY > 0.001) {
          if (penX <= penY) {
            const sign = dx >= 0 ? 1 : -1;
            g.cx += sign * (penX + 0.015);
          } else {
            const sign = dy >= 0 ? 1 : -1;
            g.cy += sign * (penY + 0.015);
          }
          anyMoved = true;
        }
      }
    }

    // Column-to-Column AABB collision resolution
    for (let i = 0; i < colGroups.length; i++) {
      for (let j = i + 1; j < colGroups.length; j++) {
        const gA = colGroups[i];
        const gB = colGroups[j];

        // Check if any member bins between gA and gB actually overlap in Z elevation
        let zConflict = false;
        for (const idxA of gA.memberIndices) {
          const bA = working[idxA];
          const minZA = bA.zMeters - clearanceZ * 0.5;
          const maxZA = bA.zMeters + bA.binHeightCm / 100 + clearanceZ * 0.5;
          for (const idxB of gB.memberIndices) {
            const bB = working[idxB];
            const minZB = bB.zMeters - clearanceZ * 0.5;
            const maxZB = bB.zMeters + bB.binHeightCm / 100 + clearanceZ * 0.5;
            if (Math.min(maxZA, maxZB) - Math.max(minZA, minZB) > 0.001) {
              zConflict = true;
              break;
            }
          }
          if (zConflict) break;
        }
        if (gA.memberIndices.length > 1 || gB.memberIndices.length > 1) {
          zConflict = true;
        }
        if (!zConflict) continue;

        const minDX = gA.halfX + gB.halfX + clearanceXY;
        const minDY = gA.halfY + gB.halfY + clearanceXY;
        const dx = gB.cx - gA.cx;
        const dy = gB.cy - gA.cy;
        const penX = minDX - Math.abs(dx);
        const penY = minDY - Math.abs(dy);

        if (penX > 0.001 && penY > 0.001) {
          anyMoved = true;
          const weightA =
            iter < 8
              ? gA.isMovedGroup && !gB.isMovedGroup
                ? 0.75
                : !gA.isMovedGroup && gB.isMovedGroup
                  ? 0.25
                  : 0.5
              : 0.5;
          const weightB = 1 - weightA;

          if (penX <= penY) {
            const sign = dx > 0.0001 ? 1 : dx < -0.0001 ? -1 : i < j ? 1 : -1;
            const push = (penX + 0.015) * 0.85;
            gA.cx -= sign * push * weightA;
            gB.cx += sign * push * weightB;
          } else {
            const sign = dy > 0.0001 ? 1 : dy < -0.0001 ? -1 : i < j ? 1 : -1;
            const push = (penY + 0.015) * 0.85;
            gA.cy -= sign * push * weightA;
            gB.cy += sign * push * weightB;
          }
        }
      }
    }

    if (!anyMoved) break;
  }

  // Fallback exact separation guard: if any column still overlaps after relaxation, snap it to nearest free spot
  const isGroupClearAt = (
    idx: number,
    testX: number,
    testY: number
  ): boolean => {
    const g = colGroups[idx];
    for (const obs of obstacles) {
      if (
        Math.abs(testX - obs.xMeters) < g.halfX + 0.42 + clearanceXY - 0.002 &&
        Math.abs(testY - obs.yMeters) < g.halfY + 0.42 + clearanceXY - 0.002
      ) {
        return false;
      }
    }
    for (let otherIdx = 0; otherIdx < colGroups.length; otherIdx++) {
      if (otherIdx === idx) continue;
      const other = colGroups[otherIdx];
      let zConflict = g.memberIndices.length > 1 || other.memberIndices.length > 1;
      if (!zConflict) {
        for (const idxA of g.memberIndices) {
          const bA = working[idxA];
          const minZA = bA.zMeters - clearanceZ * 0.5;
          const maxZA = bA.zMeters + bA.binHeightCm / 100 + clearanceZ * 0.5;
          for (const idxB of other.memberIndices) {
            const bB = working[idxB];
            const minZB = bB.zMeters - clearanceZ * 0.5;
            const maxZB = bB.zMeters + bB.binHeightCm / 100 + clearanceZ * 0.5;
            if (Math.min(maxZA, maxZB) - Math.max(minZA, minZB) > 0.001) {
              zConflict = true;
              break;
            }
          }
          if (zConflict) break;
        }
      }
      if (!zConflict) continue;
      if (
        Math.abs(testX - other.cx) <
          g.halfX + other.halfX + clearanceXY - 0.002 &&
        Math.abs(testY - other.cy) <
          g.halfY + other.halfY + clearanceXY - 0.002
      ) {
        return false;
      }
    }
    return true;
  };

  for (let i = 0; i < colGroups.length; i++) {
    const g = colGroups[i];
    g.cx = Number(g.cx.toFixed(2));
    g.cy = Number(g.cy.toFixed(2));
    if (!isGroupClearAt(i, g.cx, g.cy)) {
      const baseX = g.cx;
      const baseY = g.cy;
      let found = false;
      for (let r = 1; r <= 30 && !found; r++) {
        const dist = r * 0.35;
        for (let a = 0; a < 16; a++) {
          const angle = (a * Math.PI) / 8;
          const candX = Number((baseX + Math.cos(angle) * dist).toFixed(2));
          const candY = Number((baseY + Math.sin(angle) * dist).toFixed(2));
          if (isGroupClearAt(i, candX, candY)) {
            g.cx = candX;
            g.cy = candY;
            found = true;
            break;
          }
        }
      }
    }
  }

  // Apply resolved column X-Y coordinates and Phase 3 Vertical Z-Stacking anti-overlap within each column
  const aisleSp = Math.max(0.8, config.aisleSpacingM ?? DEFAULT_AISLE_SPACING_M);
  const baySp = Math.max(0.6, config.baySpacingM ?? DEFAULT_BAY_SPACING_M);

  for (const g of colGroups) {
    const snappedX = Number(g.cx.toFixed(2));
    const snappedY = Number(g.cy.toFixed(2));
    const newAisle = Math.max(1, Math.round(snappedX / aisleSp) + 1);
    const newBay = Math.max(1, Math.round((snappedY - 1.8) / baySp) + 1);

    g.memberIndices.sort(
      (ia, ib) =>
        working[ia].level - working[ib].level ||
        working[ia].zMeters - working[ib].zMeters
    );

    for (let k = 0; k < g.memberIndices.length; k++) {
      const idx = g.memberIndices[k];
      const bin = working[idx];
      bin.xMeters = snappedX;
      bin.yMeters = snappedY;
      bin.aisle = newAisle;
      bin.bay = newBay;

      if (k > 0) {
        const prevBin = working[g.memberIndices[k - 1]];
        const minSafeZ = Number(
          (prevBin.zMeters + prevBin.binHeightCm / 100 + clearanceZ).toFixed(2)
        );
        bin.zMeters = Math.max(bin.zMeters, minSafeZ);
      }
      bin.isGoldenZone =
        bin.zMeters >= config.goldenZoneMinM &&
        bin.zMeters <= config.goldenZoneMaxM;
    }
  }

  return working;
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
  const baseArea = l * w;
  if (baseArea <= 0) return false;
  if (z === 0) return true;

  let supportedArea = 0;
  for (const b of boxes) {
    if (Math.abs(b.zCm + b.heightCm - z) > 0.01) continue;
    const overlapX = Math.max(0, Math.min(x + l, b.xCm + b.lengthCm) - Math.max(x, b.xCm));
    const overlapY = Math.max(0, Math.min(y + w, b.yCm + b.widthCm) - Math.max(y, b.yCm));
    if (overlapX > 0 && overlapY > 0) {
      if (b.fragile) return false;
      if (enforceWeightStability) {
        if (candidateWeightKg > b.weightKg * 1.45) {
          return false;
        }
        const bTop = b.zCm + b.heightCm;
        let overheadLoadOnB =
          candidateWeightKg * ((overlapX * overlapY) / baseArea);
        for (const upper of boxes) {
          if (upper.zCm < bTop - 0.01) continue;
          const ux = Math.max(
            0,
            Math.min(upper.xCm + upper.lengthCm, b.xCm + b.lengthCm) -
              Math.max(upper.xCm, b.xCm)
          );
          const uy = Math.max(
            0,
            Math.min(upper.yCm + upper.widthCm, b.yCm + b.widthCm) -
              Math.max(upper.yCm, b.yCm)
          );
          if (ux > 0 && uy > 0) {
            const upperArea = Math.max(1, upper.lengthCm * upper.widthCm);
            overheadLoadOnB += upper.weightKg * ((ux * uy) / upperArea);
          }
        }
        if (overheadLoadOnB > b.weightKg * 2.2) {
          return false;
        }
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
  if (
    sku.lengthCm <= 0 ||
    sku.widthCm <= 0 ||
    sku.heightCm <= 0 ||
    sku.weightKg < 0
  ) {
    return null;
  }
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
  const corridorY = depotY + 0.75;
  const horizontalDist = computeAisleTravelDistanceM(
    depotX,
    depotY,
    bin.xMeters,
    bin.yMeters,
    corridorY
  );
  const verticalDist = bin.zMeters;

  let obstacleDetourSec = 0;
  if (obstacles && obstacles.length > 0) {
    for (const obs of obstacles) {
      const dist = Math.hypot(bin.xMeters - obs.xMeters, bin.yMeters - obs.yMeters);
      if (dist < 1.15) {
        obstacleDetourSec += 1.8;
        break;
      }
      const inSameAisle = Math.abs(bin.xMeters - obs.xMeters) < 0.45;
      const blocksAislePath =
        (obs.yMeters > corridorY && obs.yMeters < bin.yMeters) ||
        (obs.yMeters < corridorY && obs.yMeters > bin.yMeters);
      if (inSameAisle && blocksAislePath) {
        obstacleDetourSec += 0.9;
        break;
      }
    }
  }

  if (equipmentMode === 'asrs_crane') {
    const vx = 2.6; // m/s
    const vz = 1.35; // m/s
    const oneWay = Math.max(horizontalDist / vx, verticalDist / vz);
    return oneWay * 2 + 2.4 + obstacleDetourSec; // + shuttle engage
  }

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
  const honeycombingWastePct =
    totalCapVol > 0 ? Math.max(0, 100 - cubicUtilizationPct) : 0;
  const avgCycleTimeSec =
    totalPickLoad > 0 ? weightedCycleSum / totalPickLoad : 0;
  const goldenZoneHitRatePct =
    totalAPicks > 0 ? (goldenAPicks / totalAPicks) * 100 : 100;

  const normalizedPenalty = totalPickLoad > 0 ? totalErgoPenalty / totalPickLoad : 0;
  const ergonomicsScore = Math.max(
    15,
    Math.min(100, 100 - normalizedPenalty * 42 - safetyViolations * 6)
  );

  const avgZ =
    occupied.length > 0 && totalPickLoad > 0
      ? occupied.reduce((acc, a) => acc + a.bin.zMeters * a.dailyPickLoad, 0) /
        totalPickLoad
      : 1;

  const idealPerOccupied = totalPickLoad / Math.max(1, occupied.length);
  const maxCongestionPct =
    idealPerOccupied > 0
      ? Math.min(100, (maxPickLoad / (idealPerOccupied * 3.2)) * 100)
      : 0;

  const hotBinsRaw = [...occupied]
    .sort((a, b) => b.dailyPickLoad - a.dailyPickLoad)
    .slice(0, 5);

  const depotX =
    config.depotXMeters ??
    ((Math.max(1, config.aisles) - 1) * (config.aisleSpacingM ?? DEFAULT_AISLE_SPACING_M)) /
      2;
  const depotY = config.depotYMeters ?? 0;
  const corridorY = depotY + 0.75;

  const allocById = new Map(allocations.map((a) => [a.bin.id, a]));
  const customRouteAllocs = (config.customRouteBinIds ?? [])
    .map((id) => allocById.get(id))
    .filter((a): a is BinAllocation => Boolean(a));

  let orderedHotBins = hotBinsRaw;
  if (customRouteAllocs.length > 0) {
    orderedHotBins = customRouteAllocs;
  } else if (mode === 'optimized_3d' && hotBinsRaw.length > 1) {
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

  const customRouteTimeSum = pickRoute.reduce(
    (sum, wp) => sum + wp.stepTimeSec,
    0
  );
  const returnToDepotSec =
    config.routeReturnToDepot && pickRoute.length > 0
      ? (() => {
          const returnDist = computeAisleTravelDistanceM(
            prevX,
            prevY,
            depotX,
            depotY,
            corridorY
          );
          const returnVert = prevZ;
          return config.equipmentMode === 'asrs_crane'
            ? Math.max(returnDist / 2.6, returnVert / 1.35) + 0.8
            : returnDist / 1.9 + returnVert / 0.55 + 1.0;
        })()
      : 0;
  const effectiveCycleTimeSec =
    customRouteAllocs.length > 0 && pickRoute.length > 0
      ? Number(
          ((customRouteTimeSum + returnToDepotSec) / pickRoute.length).toFixed(1)
        )
      : Number(
          (
            avgCycleTimeSec +
            returnToDepotSec / Math.max(1, pickRoute.length)
          ).toFixed(1)
        );
  const effectiveTravelEnergyIndex = effectiveCycleTimeSec * (1 + avgZ * 0.14);

  const kpis: WarehouseKPIs = {
    cubicUtilizationPct: Number(cubicUtilizationPct.toFixed(1)),
    honeycombingWastePct: Number(honeycombingWastePct.toFixed(1)),
    avgCycleTimeSec: effectiveCycleTimeSec,
    travelEnergyIndex: Number(effectiveTravelEnergyIndex.toFixed(1)),
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
  unplacedMap?: Map<string, UnplacedItemDetail>,
  heavyCutoffKg?: number
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

    if (
      heavyCutoffKg !== undefined &&
      sku.weightKg > heavyCutoffKg &&
      alloc.bin.level >= 3
    ) {
      // Redirect Z3+ heavy pins to safe lower levels (Z1-Z2) in the same column or let optimizer place safely
      const safeColAlloc = allocations
        .filter(
          (a) =>
            a.bin.level <= 2 &&
            (Math.hypot(
              a.bin.xMeters - alloc.bin.xMeters,
              a.bin.yMeters - alloc.bin.yMeters
            ) < 0.35 ||
              (a.bin.aisle === alloc.bin.aisle && a.bin.bay === alloc.bin.bay))
        )
        .sort((a, b) => a.bin.level - b.bin.level)[0];
      if (!safeColAlloc) {
        continue;
      }
      for (let i = 0; i < pin.count; i++) {
        const avail = remainingQty.get(sku.id) ?? 0;
        if (avail <= 0) break;
        const packed = tryPackIntoBin(
          safeColAlloc,
          sku,
          allowRotation,
          bestFitMode
        );
        if (packed) {
          remainingQty.set(sku.id, avail - 1);
        }
      }
      continue;
    }

    for (let i = 0; i < pin.count; i++) {
      const avail = remainingQty.get(sku.id) ?? 0;
      if (avail <= 0) break;
      const packed = tryPackIntoBin(alloc, sku, allowRotation, bestFitMode);
      if (packed) {
        remainingQty.set(sku.id, avail - 1);
      } else if (bestFitMode) {
        remainingQty.set(sku.id, avail - 1);
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

  const orderedBins = [...allocations].sort((a, b) => {
    if (a.bin.bay !== b.bin.bay) return a.bin.bay - b.bin.bay;
    if (a.bin.aisle !== b.bin.aisle) return a.bin.aisle - b.bin.aisle;
    return b.bin.level - a.bin.level; // poor Z-discipline: fills upper racks early
  });

  const sortedSkus = [...remainingSkus].sort((a, b) => b.dailyPicks - a.dailyPicks);
  let unplacedUnits = unplacedPinned;

  let binCursor = 0;
  for (const sku of sortedSkus) {
    let remaining = sku.quantity;
    while (remaining > 0) {
      let placed = false;
      for (let offset = 0; offset < orderedBins.length; offset++) {
        const candidate = orderedBins[(binCursor + offset) % orderedBins.length];
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
    unplacedMap,
    heavyCutoffKg
  );

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
    const scoredBins = allocations
      .map((alloc) => {
        const { bin } = alloc;
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
          if (bin.isGoldenZone) score -= 95;
          else if (bin.level >= 4 && sku.weightKg <= 12) score += 75;
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
      const hasWeightCapableBin = allocations.some(
        (a) =>
          (sku.weightKg <= heavyCutoffKg || a.bin.level <= 2) &&
          a.currentWeightKg + sku.weightKg <= a.bin.maxWeightKg
      );
      const reason: UnplacedItemDetail['reason'] =
        !hasWeightCapableBin || scoredBins.length === 0
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
    const defaultZ =
      LEVEL_HEIGHTS_M[level - 1] ??
      Number(((level - 1) * 0.82 + 0.05).toFixed(2));
    const repZMeters =
      levelBins.length > 0
        ? Number(
            (
              levelBins.reduce((s, a) => s + a.bin.zMeters, 0) /
              levelBins.length
            ).toFixed(2)
          )
        : defaultZ;
    const isGolden =
      levelBins.length > 0
        ? levelBins.some((a) => a.bin.isGoldenZone)
        : repZMeters >= config.goldenZoneMinM &&
          repZMeters <= config.goldenZoneMaxM;

    summaries.push({
      level,
      zMeters: repZMeters,
      isGoldenZone: isGolden,
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

export function buildExactBinSkuPins(
  prevPins: PinnedCargoPlacement[],
  allocations: BinAllocation[],
  targetBinId: string,
  skuId: string,
  exactCount: number
): { nextPins: PinnedCargoPlacement[]; totalPinnedForSku: number } {
  const sanitizedCount = Math.max(0, Math.min(200, Math.round(exactCount)));
  const validBinIds = new Set(allocations.map((a) => a.bin.id));
  const currentCounts = new Map<string, number>();

  for (const alloc of allocations) {
    const cnt = alloc.boxes.filter((b) => b.skuId === skuId).length;
    if (cnt > 0) {
      currentCounts.set(alloc.bin.id, cnt);
    }
  }

  for (const p of prevPins) {
    if (
      p.skuId === skuId &&
      p.count > 0 &&
      validBinIds.has(p.binId) &&
      !currentCounts.has(p.binId)
    ) {
      currentCounts.set(p.binId, p.count);
    }
  }

  if (sanitizedCount <= 0) {
    currentCounts.delete(targetBinId);
  } else {
    currentCounts.set(targetBinId, sanitizedCount);
  }

  const otherSkuPins = prevPins.filter(
    (p) => p.skuId !== skuId && (validBinIds.size === 0 || validBinIds.has(p.binId))
  );
  const updatedSkuPins: PinnedCargoPlacement[] = [];
  let totalPinnedForSku = 0;

  if (currentCounts.has(targetBinId)) {
    const c = currentCounts.get(targetBinId)!;
    updatedSkuPins.push({ binId: targetBinId, skuId, count: c });
    totalPinnedForSku += c;
  }

  for (const [bId, count] of currentCounts.entries()) {
    if (bId !== targetBinId && count > 0) {
      updatedSkuPins.push({ binId: bId, skuId, count });
      totalPinnedForSku += count;
    }
  }

  return {
    nextPins: [...updatedSkuPins, ...otherSkuPins],
    totalPinnedForSku,
  };
}

export function buildTransferredSkuPins(
  prevPins: PinnedCargoPlacement[],
  allocations: BinAllocation[],
  fromBinId: string,
  toBinId: string | null,
  skuId: string,
  transferCount: number | 'all' = 1
): { nextPins: PinnedCargoPlacement[]; movedCount: number } {
  const validBinIds = new Set(allocations.map((a) => a.bin.id));
  const currentCounts = new Map<string, number>();
  for (const alloc of allocations) {
    const cnt = alloc.boxes.filter((b) => b.skuId === skuId).length;
    if (cnt > 0) {
      currentCounts.set(alloc.bin.id, cnt);
    }
  }

  for (const p of prevPins) {
    if (
      p.skuId === skuId &&
      p.count > 0 &&
      (validBinIds.size === 0 || validBinIds.has(p.binId)) &&
      !currentCounts.has(p.binId)
    ) {
      currentCounts.set(p.binId, p.count);
    }
  }

  const fromCount = currentCounts.get(fromBinId) ?? 0;
  if (fromCount <= 0) {
    return {
      nextPins: prevPins.filter(
        (p) => validBinIds.size === 0 || validBinIds.has(p.binId)
      ),
      movedCount: 0,
    };
  }

  const actualMove =
    transferCount === 'all'
      ? fromCount
      : Math.max(1, Math.min(fromCount, transferCount));

  if (fromCount <= actualMove) {
    currentCounts.delete(fromBinId);
  } else {
    currentCounts.set(fromBinId, fromCount - actualMove);
  }

  if (toBinId) {
    currentCounts.set(toBinId, (currentCounts.get(toBinId) ?? 0) + actualMove);
  }

  const otherSkuPins = prevPins.filter(
    (p) => p.skuId !== skuId && (validBinIds.size === 0 || validBinIds.has(p.binId))
  );
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
