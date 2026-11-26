import { type Dispatch, type SetStateAction, useCallback } from 'react';
import { INTERIOR_PROP_CATALOG } from '../components/InteriorStudioModal';
import {
  buildExactBinSkuPins,
  buildTransferredSkuPins,
  resolveShelfCollisions3D,
} from '../engine/slottingEngine';
import type { LangCode } from '../i18n/translations';
import type {
  ABCClass,
  BinAllocation,
  BinSpec,
  InteriorProp,
  InteriorPropType,
  PinnedCargoPlacement,
  SKUItem,
  SelectedCargoBox,
  WarehouseConfig,
  WarehouseObstacle,
} from '../types/warehouse';

export type ShelfResizeScope = 'single' | 'column' | 'all';

function adjustColumnZLevelsForTallBins(
  updatedBins: BinSpec[],
  goldenMinM: number,
  goldenMaxM: number,
  forceRecalc = false
): BinSpec[] {
  const byCol = new Map<string, BinSpec[]>();
  for (const b of updatedBins) {
    const key = `${b.xMeters.toFixed(2)}_${b.yMeters.toFixed(2)}`;
    const list = byCol.get(key) ?? [];
    list.push(b);
    byCol.set(key, list);
  }

  const zAdjustedIds = new Map<string, number>();
  for (const colBins of byCol.values()) {
    colBins.sort((a, b) => a.level - b.level);
    for (let i = 1; i < colBins.length; i++) {
      const prevBin = colBins[i - 1];
      const prevZ = zAdjustedIds.get(prevBin.id) ?? prevBin.zMeters;
      const minNextZ = Number(
        (prevZ + prevBin.binHeightCm / 100 + 0.08).toFixed(2)
      );
      const curBin = colBins[i];
      if (curBin.zMeters < minNextZ || forceRecalc) {
        const defaultLevelZ =
          [0.05, 0.85, 1.55, 2.35, 3.15, 3.95, 4.75, 5.55][
            curBin.level - 1
          ] ?? Number(((curBin.level - 1) * 0.82 + 0.05).toFixed(2));
        const nextZ = Math.max(defaultLevelZ, minNextZ);
        zAdjustedIds.set(curBin.id, nextZ);
      }
    }
  }

  if (zAdjustedIds.size === 0) return updatedBins;
  return updatedBins.map((b) => {
    const nextZ = zAdjustedIds.get(b.id) ?? b.zMeters;
    return {
      ...b,
      zMeters: nextZ,
      isGoldenZone: nextZ >= goldenMinM && nextZ <= goldenMaxM,
    };
  });
}

export interface CustomBoxPlacementInput {
  binId: string;
  name?: string;
  skuCode?: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg?: number;
  quantity?: number;
  abcClass?: ABCClass;
  fragile?: boolean;
  color?: string;
  autoExpandBin?: boolean;
}

interface UseWarehouseTransformsParams {
  bins: BinSpec[];
  allocations: BinAllocation[];
  config: WarehouseConfig;
  effectiveInteriorProps?: InteriorProp[];
  lang: LangCode;
  pushWorkspaceUndo: () => void;
  showToast: (msg: string) => void;
  setSkus: Dispatch<SetStateAction<SKUItem[]>>;
  setConfigPatch: Dispatch<SetStateAction<Partial<WarehouseConfig>>>;
  setCustomBinsOverride: Dispatch<SetStateAction<BinSpec[] | null>>;
  setExtraBins: Dispatch<SetStateAction<BinSpec[]>>;
  setRemovedBinIds: Dispatch<SetStateAction<string[]>>;
  setPinnedPlacements: Dispatch<SetStateAction<PinnedCargoPlacement[]>>;
  setSelectedBinId: Dispatch<SetStateAction<string | null>>;
  setSelectedPropId: Dispatch<SetStateAction<string | null>>;
  setSelectedCargo: Dispatch<SetStateAction<SelectedCargoBox | null>>;
  setCameraResetTick: Dispatch<SetStateAction<number>>;
  setAppView: Dispatch<SetStateAction<'workspace' | 'home'>>;
}

export function useWarehouseTransforms({
  bins,
  allocations,
  config,
  effectiveInteriorProps,
  lang,
  pushWorkspaceUndo,
  showToast,
  setSkus,
  setConfigPatch,
  setCustomBinsOverride,
  setExtraBins,
  setRemovedBinIds,
  setPinnedPlacements,
  setSelectedBinId,
  setSelectedPropId,
  setSelectedCargo,
  setCameraResetTick,
  setAppView,
}: UseWarehouseTransformsParams) {
  const handleAddBin = useCallback(
    (bin: BinSpec) => {
      pushWorkspaceUndo();
      setRemovedBinIds((prev) => prev.filter((id) => id !== bin.id));
      setExtraBins((prev) => [...prev.filter((b) => b.id !== bin.id), bin]);
      setSelectedBinId(bin.id);
    },
    [pushWorkspaceUndo, setExtraBins, setRemovedBinIds, setSelectedBinId]
  );

  const handleDeleteBin = useCallback(
    (binId: string) => {
      pushWorkspaceUndo();
      setRemovedBinIds((prev) => (prev.includes(binId) ? prev : [...prev, binId]));
      setExtraBins((prev) => prev.filter((b) => b.id !== binId));
      setPinnedPlacements((prev) => prev.filter((p) => p.binId !== binId));
      setSelectedBinId((curr) => (curr === binId ? null : curr));
      setSelectedCargo((curr) => (curr?.binId === binId ? null : curr));
    },
    [
      pushWorkspaceUndo,
      setExtraBins,
      setPinnedPlacements,
      setRemovedBinIds,
      setSelectedBinId,
      setSelectedCargo,
    ]
  );

  const handlePinCargo = useCallback(
    (binId: string, skuId: string, delta: number = 1) => {
      pushWorkspaceUndo();
      const currentInBin =
        allocations
          .find((a) => a.bin.id === binId)
          ?.boxes.filter((b) => b.skuId === skuId).length ?? 0;

      setPinnedPlacements((prev) => {
        const existingPin = prev.find(
          (p) => p.binId === binId && p.skuId === skuId
        );
        const baseCount = existingPin
          ? Math.max(existingPin.count, currentInBin)
          : currentInBin;
        const targetCount = Math.max(0, baseCount + delta);

        const { nextPins, totalPinnedForSku } = buildExactBinSkuPins(
          prev,
          allocations,
          binId,
          skuId,
          targetCount
        );

        setSkus((currSkus) =>
          currSkus.map((s) =>
            s.id === skuId ? { ...s, quantity: Math.max(0, totalPinnedForSku) } : s
          )
        );
        return nextPins;
      });
    },
    [allocations, pushWorkspaceUndo, setPinnedPlacements, setSkus]
  );

  const handleSetCargoCountInBin = useCallback(
    (binId: string, skuId: string, exactCount: number, autoExpandBin = true) => {
      pushWorkspaceUndo();
      const clampedCount = Math.max(0, Math.min(120, Math.round(exactCount)));

      if (autoExpandBin && clampedCount > 0) {
        const targetBin = bins.find((b) => b.id === binId);
        const targetAlloc = allocations.find((a) => a.bin.id === binId);
        const sampleBox = targetAlloc?.boxes.find((b) => b.skuId === skuId);
        if (targetBin && sampleBox) {
          const singleVol =
            sampleBox.lengthCm * sampleBox.widthCm * sampleBox.heightCm;
          const otherBoxesVol = (targetAlloc?.boxes ?? [])
            .filter((b) => b.skuId !== skuId)
            .reduce((acc, b) => acc + b.lengthCm * b.widthCm * b.heightCm, 0);
          const otherBoxesWeight = (targetAlloc?.boxes ?? [])
            .filter((b) => b.skuId !== skuId)
            .reduce((acc, b) => acc + b.weightKg, 0);
          const neededVol = (otherBoxesVol + singleVol * clampedCount) * 1.18;
          const currentVol =
            targetBin.binLengthCm * targetBin.binWidthCm * targetBin.binHeightCm;
          const neededWeight =
            otherBoxesWeight + sampleBox.weightKg * clampedCount;

          if (neededVol > currentVol || neededWeight > targetBin.maxWeightKg) {
            const scale =
              neededVol > currentVol ? Math.cbrt(neededVol / currentVol) : 1;
            const nextL = Math.min(
              300,
              Math.max(
                targetBin.binLengthCm,
                Math.ceil(targetBin.binLengthCm * scale)
              )
            );
            const nextW = Math.min(
              300,
              Math.max(
                targetBin.binWidthCm,
                Math.ceil(targetBin.binWidthCm * scale)
              )
            );
            const nextH = Math.min(
              250,
              Math.max(
                targetBin.binHeightCm,
                Math.ceil(targetBin.binHeightCm * scale)
              )
            );
            const nextBins = resolveShelfCollisions3D(
              adjustColumnZLevelsForTallBins(
                bins.map((b) =>
                  b.id === binId
                    ? {
                        ...b,
                        binLengthCm: nextL,
                        binWidthCm: nextW,
                        binHeightCm: nextH,
                        maxWeightKg: Math.max(
                          b.maxWeightKg,
                          Math.ceil(neededWeight + 25)
                        ),
                      }
                    : b
                ),
                config.goldenZoneMinM,
                config.goldenZoneMaxM,
                nextH > targetBin.binHeightCm
              ),
              config,
              [binId]
            );
            setCustomBinsOverride(nextBins);
            setExtraBins([]);
            setRemovedBinIds([]);
            if (
              nextL > targetBin.binLengthCm ||
              nextW > targetBin.binWidthCm ||
              nextH > targetBin.binHeightCm
            ) {
              showToast(
                lang === 'ko'
                  ? `Shelf [${binId}] auto-expanded from ${targetBin.binLengthCm}×${targetBin.binWidthCm}×${targetBin.binHeightCm}cm to ${nextL}×${nextW}×${nextH}cm to fit ${clampedCount} boxes.`
                  : `Shelf [${binId}] auto-expanded from ${targetBin.binLengthCm}×${targetBin.binWidthCm}×${targetBin.binHeightCm}cm to ${nextL}×${nextW}×${nextH}cm to fit ${clampedCount} boxes.`
              );
            }
          }
        }
      }

      setPinnedPlacements((prev) => {
        const { nextPins, totalPinnedForSku } = buildExactBinSkuPins(
          prev,
          allocations,
          binId,
          skuId,
          clampedCount
        );
        setSkus((currSkus) =>
          currSkus.map((s) =>
            s.id === skuId
              ? { ...s, quantity: Math.max(0, totalPinnedForSku) }
              : s
          )
        );
        return nextPins;
      });
    },
    [
      allocations,
      bins,
      config,
      pushWorkspaceUndo,
      setCustomBinsOverride,
      setExtraBins,
      setPinnedPlacements,
      setRemovedBinIds,
      setSkus,
    ]
  );

  const handleSetBinTotalBoxQuota = useCallback(
    (binId: string, targetTotalBoxes: number, fallbackSkuId?: string) => {
      const clampedTotal = Math.max(0, Math.min(120, Math.round(targetTotalBoxes)));
      const targetAlloc = allocations.find((a) => a.bin.id === binId);
      if (!targetAlloc) return;

      if (targetAlloc.boxes.length === 0) {
        if (clampedTotal > 0 && fallbackSkuId) {
          handleSetCargoCountInBin(binId, fallbackSkuId, clampedTotal, true);
        }
        return;
      }

      const skuCounts = new Map<string, number>();
      for (const b of targetAlloc.boxes) {
        skuCounts.set(b.skuId, (skuCounts.get(b.skuId) ?? 0) + 1);
      }
      const entries = [...skuCounts.entries()];
      if (clampedTotal === 0) {
        pushWorkspaceUndo();
        setPinnedPlacements((prev) => {
          let working = prev;
          for (const [sId] of entries) {
            const res = buildExactBinSkuPins(working, allocations, binId, sId, 0);
            working = res.nextPins;
            const totalForSku = res.totalPinnedForSku;
            setSkus((curr) =>
              curr.map((s) =>
                s.id === sId ? { ...s, quantity: Math.max(0, totalForSku) } : s
              )
            );
          }
          return working;
        });
        return;
      }

      if (entries.length === 1) {
        handleSetCargoCountInBin(binId, entries[0][0], clampedTotal, true);
        return;
      }

      const currentSum = targetAlloc.boxes.length;
      const newCounts = new Map<string, number>();
      let assigned = 0;
      entries.forEach(([sId, cnt], idx) => {
        if (idx === entries.length - 1) {
          newCounts.set(sId, Math.max(0, clampedTotal - assigned));
        } else {
          const share = Math.max(
            0,
            Math.round((cnt / Math.max(1, currentSum)) * clampedTotal)
          );
          newCounts.set(sId, share);
          assigned += share;
        }
      });

      for (const [sId, nextCnt] of newCounts.entries()) {
        handleSetCargoCountInBin(binId, sId, nextCnt, true);
      }
    },
    [
      allocations,
      handleSetCargoCountInBin,
      pushWorkspaceUndo,
      setPinnedPlacements,
      setSkus,
    ]
  );

  const handleMoveSingleCargoToBin = useCallback(
    (
      fromBinId: string,
      skuId: string,
      toBinId: string,
      transferCount: number | 'all' = 1
    ) => {
      if (fromBinId === toBinId) return;
      const targetBin = bins.find((b) => b.id === toBinId);
      if (!targetBin) return;

      const sourceAlloc = allocations.find((a) => a.bin.id === fromBinId);
      const targetAlloc = allocations.find((a) => a.bin.id === toBinId);
      const sampleBox = sourceAlloc?.boxes.find((b) => b.skuId === skuId);
      const boxVol = sampleBox
        ? sampleBox.lengthCm * sampleBox.widthCm * sampleBox.heightCm
        : 0;
      const boxWeight = sampleBox?.weightKg ?? 0;

      const swappedSkuId =
        targetAlloc &&
        targetAlloc.boxes.length > 0 &&
        (targetAlloc.usedVolumeCm3 + boxVol > targetAlloc.totalVolumeCm3 * 0.92 ||
          targetAlloc.currentWeightKg + boxWeight > targetAlloc.bin.maxWeightKg)
          ? targetAlloc.boxes.find((b) => b.skuId !== skuId)?.skuId ?? null
          : null;

      pushWorkspaceUndo();
      let movedUnits = 1;
      setPinnedPlacements((prev) => {
        const step1 = buildTransferredSkuPins(
          prev,
          allocations,
          fromBinId,
          toBinId,
          skuId,
          transferCount
        );
        movedUnits = step1.movedCount;
        if (swappedSkuId) {
          return buildTransferredSkuPins(
            step1.nextPins,
            allocations,
            toBinId,
            fromBinId,
            swappedSkuId,
            1
          ).nextPins;
        }
        return step1.nextPins;
      });
      setSelectedBinId(toBinId);
      setSelectedCargo((prev) =>
        prev && prev.skuId === skuId
          ? { ...prev, binId: toBinId, boxIndex: 0 }
          : prev
      );
      showToast(
        swappedSkuId
          ? lang === 'ko'
            ? `Swapped item between [${fromBinId}] and [${toBinId}].`
            : `Swapped item between [${fromBinId}] and [${toBinId}].`
          : transferCount === 'all' && movedUnits > 1
            ? lang === 'ko'
              ? `Moved batch of ${movedUnits} items from [${fromBinId}] to [${toBinId}] (Z${targetBin.level}).`
              : `Moved batch of ${movedUnits} items from [${fromBinId}] to [${toBinId}] (Z${targetBin.level}).`
            : lang === 'ko'
              ? `Moved individual item from [${fromBinId}] to [${toBinId}] (Z${targetBin.level}).`
              : `Moved individual item from [${fromBinId}] to [${toBinId}] (Z${targetBin.level}).`
      );
    },
    [
      allocations,
      bins,
      lang,
      pushWorkspaceUndo,
      setPinnedPlacements,
      setSelectedBinId,
      setSelectedCargo,
      showToast,
    ]
  );

  const handleMoveSingleCargoToFloor = useCallback(
    (
      fromBinId: string,
      skuId: string,
      floorX: number,
      floorZ: number,
      transferCount: number | 'all' = 1
    ) => {
      const snappedX = Number((Math.round(floorX / 0.25) * 0.25).toFixed(2));
      const snappedY = Number((Math.round(floorZ / 0.25) * 0.25).toFixed(2));

      const existingFloorBin = bins.find(
        (b) =>
          Math.hypot(b.xMeters - snappedX, b.yMeters - snappedY) < 0.45 &&
          b.level === 1
      );
      if (existingFloorBin) {
        handleMoveSingleCargoToBin(
          fromBinId,
          skuId,
          existingFloorBin.id,
          transferCount
        );
        return;
      }

      pushWorkspaceUndo();
      const aisleSpacing = config.aisleSpacingM ?? 3.4;
      const baySpacing = config.baySpacingM ?? 1.45;
      const aisle = Math.max(1, Math.round(snappedX / aisleSpacing) + 1);
      const bay = Math.max(1, Math.round((snappedY - 1.8) / baySpacing) + 1);
      const zMeters = 0.05;
      let binId = `A${aisle}-B${bay}-Z1`;
      if (bins.some((b) => b.id === binId)) {
        binId = `C${bins.length + 1}-A${aisle}-B${bay}-Z1`;
      }

      const newFloorBin: BinSpec = {
        id: binId,
        aisle,
        bay,
        level: 1,
        xMeters: snappedX,
        yMeters: snappedY,
        zMeters,
        binLengthCm: config.binLengthCm ?? 120,
        binWidthCm: config.binWidthCm ?? 90,
        binHeightCm: config.binHeightCm ?? 70,
        maxWeightKg: 1200,
        isGoldenZone:
          zMeters >= config.goldenZoneMinM && zMeters <= config.goldenZoneMaxM,
      };

      setRemovedBinIds((prev) => prev.filter((id) => id !== binId));
      setExtraBins((prev) => [...prev.filter((b) => b.id !== binId), newFloorBin]);
      setPinnedPlacements(
        (prev) =>
          buildTransferredSkuPins(
            prev,
            allocations,
            fromBinId,
            binId,
            skuId,
            transferCount
          ).nextPins
      );
      setSelectedBinId(binId);
      setSelectedCargo((prev) =>
        prev && prev.skuId === skuId
          ? { ...prev, binId, boxIndex: 0 }
          : prev
      );
      showToast(
        lang === 'ko'
          ? `Moved item to 3D floor spot [${binId}] (${snappedX}m, ${snappedY}m).`
          : `Moved item to 3D floor spot [${binId}] (${snappedX}m, ${snappedY}m).`
      );
    },
    [
      allocations,
      bins,
      config,
      handleMoveSingleCargoToBin,
      lang,
      pushWorkspaceUndo,
      setExtraBins,
      setPinnedPlacements,
      setRemovedBinIds,
      setSelectedBinId,
      setSelectedCargo,
      showToast,
    ]
  );

  const handleNudgeSingleCargo = useCallback(
    (fromBinId: string, skuId: string, dxSign: number, dySign: number) => {
      const fromBin = bins.find((b) => b.id === fromBinId);
      if (!fromBin) return;

      const candidates = bins
        .filter((b) => {
          if (b.id === fromBinId) return false;
          const dx = b.xMeters - fromBin.xMeters;
          const dy = b.yMeters - fromBin.yMeters;
          if (dxSign < 0 && dx >= -0.1) return false;
          if (dxSign > 0 && dx <= 0.1) return false;
          if (dySign < 0 && dy >= -0.1) return false;
          if (dySign > 0 && dy <= 0.1) return false;
          return true;
        })
        .sort((a, b) => {
          const levelPenaltyA = Math.abs(a.level - fromBin.level) * 2.5;
          const levelPenaltyB = Math.abs(b.level - fromBin.level) * 2.5;
          const distA =
            Math.hypot(a.xMeters - fromBin.xMeters, a.yMeters - fromBin.yMeters) +
            levelPenaltyA;
          const distB =
            Math.hypot(b.xMeters - fromBin.xMeters, b.yMeters - fromBin.yMeters) +
            levelPenaltyB;
          return distA - distB;
        });

      if (candidates.length > 0) {
        handleMoveSingleCargoToBin(fromBinId, skuId, candidates[0].id);
      } else {
        const stepX = dxSign * (config.aisleSpacingM ?? 1.5);
        const stepY = dySign * (config.baySpacingM ?? 1.2);
        handleMoveSingleCargoToFloor(
          fromBinId,
          skuId,
          fromBin.xMeters + stepX,
          fromBin.yMeters + stepY
        );
      }
    },
    [
      bins,
      config.aisleSpacingM,
      config.baySpacingM,
      handleMoveSingleCargoToBin,
      handleMoveSingleCargoToFloor,
    ]
  );

  const handleMoveSkuToLevel = useCallback(
    (fromBinId: string, skuId: string, targetLevel: number) => {
      const fromBin = bins.find((b) => b.id === fromBinId);
      const sameColBin = fromBin
        ? bins.find(
            (b) =>
              (Math.hypot(b.xMeters - fromBin.xMeters, b.yMeters - fromBin.yMeters) <
                0.35 ||
                (b.aisle === fromBin.aisle && b.bay === fromBin.bay)) &&
              b.level === targetLevel
          )
        : null;
      const targetBin =
        sameColBin ??
        bins.find((b) => b.level === targetLevel) ??
        bins[0] ??
        null;
      if (!targetBin) return;

      handleMoveSingleCargoToBin(fromBinId, skuId, targetBin.id);
    },
    [bins, handleMoveSingleCargoToBin]
  );

  const handleAddBinAbove = useCallback(
    (alloc: BinAllocation) => {
      const nextLevel = alloc.bin.level + 1;
      const levelHeights = [0.05, 0.85, 1.55, 2.35, 3.15, 3.95, 4.75, 5.55];
      const maxWeights = [1200, 750, 600, 420, 280, 200, 160, 140];
      const defaultZ =
        levelHeights[nextLevel - 1] ??
        Number(((nextLevel - 1) * 0.82 + 0.05).toFixed(2));
      const minSafeZ = Number(
        (alloc.bin.zMeters + alloc.bin.binHeightCm / 100 + 0.08).toFixed(2)
      );
      const zMeters = Math.max(defaultZ, minSafeZ);
      const newBin: BinSpec = {
        ...alloc.bin,
        id: `A${alloc.bin.aisle}-B${alloc.bin.bay}-Z${nextLevel}`,
        level: nextLevel,
        zMeters,
        maxWeightKg: maxWeights[nextLevel - 1] ?? 150,
        isGoldenZone:
          zMeters >= config.goldenZoneMinM && zMeters <= config.goldenZoneMaxM,
      };
      handleAddBin(newBin);
    },
    [config.goldenZoneMinM, config.goldenZoneMaxM, handleAddBin]
  );

  const handleAddBinAtFloor = useCallback(
    (x: number, z: number) => {
      const aisleSpacing = config.aisleSpacingM ?? 3.4;
      const baySpacing = config.baySpacingM ?? 1.45;
      const aisle = Math.max(1, Math.round(x / aisleSpacing) + 1);
      const bay = Math.max(1, Math.round((z - 1.8) / baySpacing) + 1);
      const snappedX = Number(((aisle - 1) * aisleSpacing).toFixed(2));
      const snappedY = Number(((bay - 1) * baySpacing + 1.8).toFixed(2));
      const hasObstacle = (config.obstacles ?? []).some(
        (o) =>
          (o.aisle === aisle && o.bay === bay) ||
          Math.hypot(o.xMeters - snappedX, o.yMeters - snappedY) < 0.45
      );
      if (hasObstacle) return;
      const levelHeights = [0.05, 0.85, 1.55, 2.35, 3.15, 3.95, 4.75];
      const maxWeights = [1200, 750, 600, 420, 280, 200, 160];

      let targetLevel = 1;
      while (
        targetLevel <= 7 &&
        bins.some(
          (b) =>
            Math.hypot(b.xMeters - snappedX, b.yMeters - snappedY) < 0.35 &&
            b.level === targetLevel
        )
      ) {
        targetLevel++;
      }
      const zMeters =
        levelHeights[targetLevel - 1] ??
        Number(((targetLevel - 1) * 0.82 + 0.05).toFixed(2));

      let binId = `A${aisle}-B${bay}-Z${targetLevel}`;
      if (
        bins.some(
          (b) =>
            b.id === binId &&
            Math.hypot(b.xMeters - snappedX, b.yMeters - snappedY) >= 0.35
        )
      ) {
        binId = `C${bins.length + 1}-A${aisle}-B${bay}-Z${targetLevel}`;
      }

      const newBin: BinSpec = {
        id: binId,
        aisle,
        bay,
        level: targetLevel,
        xMeters: snappedX,
        yMeters: snappedY,
        zMeters,
        binLengthCm: config.binLengthCm ?? 120,
        binWidthCm: config.binWidthCm ?? 90,
        binHeightCm: config.binHeightCm ?? 70,
        maxWeightKg: maxWeights[targetLevel - 1] ?? 150,
        isGoldenZone:
          zMeters >= config.goldenZoneMinM && zMeters <= config.goldenZoneMaxM,
      };
      handleAddBin(newBin);
    },
    [bins, config, handleAddBin]
  );

  const handleMoveSingleBin = useCallback(
    (binId: string, newX: number, newY: number, newLevel?: number) => {
      const target = bins.find((b) => b.id === binId);
      if (!target) return;
      pushWorkspaceUndo();
      const aisleSp = Math.max(0.8, config.aisleSpacingM ?? 3.4);
      const baySp = Math.max(0.6, config.baySpacingM ?? 1.45);
      const newAisle = Math.max(1, Math.round(newX / aisleSp) + 1);
      const newBay = Math.max(1, Math.round((newY - 1.8) / baySp) + 1);
      const levelHeights = [0.05, 0.85, 1.55, 2.35, 3.15, 3.95, 4.75, 5.55];
      const maxWeights = [1200, 750, 600, 420, 280, 200, 160, 140];

      const nextLevel =
        newLevel !== undefined ? Math.max(1, Math.min(8, newLevel)) : target.level;
      const nextZ =
        newLevel !== undefined
          ? levelHeights[nextLevel - 1] ??
            Number(((nextLevel - 1) * 0.82 + 0.05).toFixed(2))
          : target.zMeters;

      const nextBins = resolveShelfCollisions3D(
        bins.map((b) => {
          if (b.id !== binId) return b;
          return {
            ...b,
            xMeters: Number(newX.toFixed(2)),
            yMeters: Number(newY.toFixed(2)),
            zMeters: nextZ,
            level: nextLevel,
            maxWeightKg:
              newLevel !== undefined
                ? maxWeights[nextLevel - 1] ?? b.maxWeightKg
                : b.maxWeightKg,
            isGoldenZone:
              nextZ >= config.goldenZoneMinM && nextZ <= config.goldenZoneMaxM,
            aisle: newAisle,
            bay: newBay,
          };
        }),
        config,
        [binId]
      );
      const resolvedTarget = nextBins.find((b) => b.id === binId);
      const finalX = resolvedTarget ? resolvedTarget.xMeters : newX;
      const finalY = resolvedTarget ? resolvedTarget.yMeters : newY;
      setCustomBinsOverride(nextBins);
      setExtraBins([]);
      setRemovedBinIds([]);
      showToast(
        lang === 'ko'
          ? `Placed single bin [${binId}] at (${finalX.toFixed(2)}m, ${finalY.toFixed(2)}m, Z${nextLevel})`
          : `Placed single bin [${binId}] at (${finalX.toFixed(2)}m, ${finalY.toFixed(2)}m, Z${nextLevel})`
      );
    },
    [
      bins,
      config,
      lang,
      pushWorkspaceUndo,
      setCustomBinsOverride,
      setExtraBins,
      setRemovedBinIds,
      showToast,
    ]
  );

  const handleMoveRackColumn = useCallback(
    (oldX: number, oldY: number, newX: number, newY: number) => {
      pushWorkspaceUndo();
      const aisleSp = Math.max(0.8, config.aisleSpacingM ?? 3.4);
      const baySp = Math.max(0.6, config.baySpacingM ?? 1.45);
      const newAisle = Math.max(1, Math.round(newX / aisleSp) + 1);
      const newBay = Math.max(1, Math.round((newY - 1.8) / baySp) + 1);
      const oldAisle = Math.max(1, Math.round(oldX / aisleSp) + 1);
      const oldBay = Math.max(1, Math.round((oldY - 1.8) / baySp) + 1);

      const occupiedAtTarget = bins.some(
        (b) =>
          (Math.abs(b.xMeters - oldX) >= 0.05 ||
            Math.abs(b.yMeters - oldY) >= 0.05) &&
          Math.abs(b.xMeters - newX) < 0.35 &&
          Math.abs(b.yMeters - newY) < 0.35
      );
      const movedColumnIds: string[] = [];
      const rawBins = bins.map((b) => {
        if (
          Math.abs(b.xMeters - oldX) < 0.05 &&
          Math.abs(b.yMeters - oldY) < 0.05
        ) {
          movedColumnIds.push(b.id);
          return {
            ...b,
            xMeters: newX,
            yMeters: newY,
            aisle: newAisle,
            bay: newBay,
          };
        }
        if (
          occupiedAtTarget &&
          Math.abs(b.xMeters - newX) < 0.35 &&
          Math.abs(b.yMeters - newY) < 0.35
        ) {
          return {
            ...b,
            xMeters: oldX,
            yMeters: oldY,
            aisle: oldAisle,
            bay: oldBay,
          };
        }
        return b;
      });
      const nextBins = resolveShelfCollisions3D(rawBins, config, movedColumnIds);
      setCustomBinsOverride(nextBins);
      setExtraBins([]);
      setRemovedBinIds([]);
    },
    [
      bins,
      config,
      pushWorkspaceUndo,
      setCustomBinsOverride,
      setExtraBins,
      setRemovedBinIds,
    ]
  );

  const activePropsList =
    config.interiorProps ?? effectiveInteriorProps ?? [];

  const handleTranslateWholeTemplate = useCallback(
    (dx: number, dy: number) => {
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;
      pushWorkspaceUndo();
      const nextBins = bins.map((b) => ({
        ...b,
        xMeters: Number((b.xMeters + dx).toFixed(2)),
        yMeters: Number((b.yMeters + dy).toFixed(2)),
      }));
      setCustomBinsOverride(nextBins);
      setExtraBins([]);
      setRemovedBinIds([]);

      const aisleSp = config.aisleSpacingM ?? 3.4;
      const curDepotX =
        config.depotXMeters ??
        ((Math.max(1, config.aisles) - 1) * aisleSp) / 2;
      const curDepotY = config.depotYMeters ?? 0;

      setConfigPatch((prev) => ({
        ...prev,
        depotXMeters: Number((curDepotX + dx).toFixed(2)),
        depotYMeters: Number((curDepotY + dy).toFixed(2)),
        obstacles: (prev.obstacles ?? config.obstacles ?? []).map((o) => ({
          ...o,
          xMeters: Number((o.xMeters + dx).toFixed(2)),
          yMeters: Number((o.yMeters + dy).toFixed(2)),
        })),
        interiorProps: (prev.interiorProps ?? activePropsList).map(
          (p) => ({
            ...p,
            xMeters: Number((p.xMeters + dx).toFixed(2)),
            yMeters: Number((p.yMeters + dy).toFixed(2)),
          })
        ),
      }));
    },
    [
      activePropsList,
      bins,
      config,
      pushWorkspaceUndo,
      setConfigPatch,
      setCustomBinsOverride,
      setExtraBins,
      setRemovedBinIds,
    ]
  );

  const handleRotateWholeTemplate90 = useCallback(() => {
    if (bins.length === 0) return;
    pushWorkspaceUndo();
    const xs = bins.map((b) => b.xMeters);
    const ys = bins.map((b) => b.yMeters);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const rot = (x: number, y: number) => ({
      nx: Number((cx - (y - cy)).toFixed(2)),
      ny: Number((cy + (x - cx)).toFixed(2)),
    });

    const nextBins = resolveShelfCollisions3D(
      bins.map((b) => {
        const { nx, ny } = rot(b.xMeters, b.yMeters);
        return {
          ...b,
          xMeters: nx,
          yMeters: ny,
          binLengthCm: b.binWidthCm,
          binWidthCm: b.binLengthCm,
        };
      }),
      config
    );
    setCustomBinsOverride(nextBins);
    setExtraBins([]);
    setRemovedBinIds([]);

    const aisleSp = config.aisleSpacingM ?? 3.4;
    const curDepotX =
      config.depotXMeters ?? ((Math.max(1, config.aisles) - 1) * aisleSp) / 2;
    const curDepotY = config.depotYMeters ?? 0;
    const rotDepot = rot(curDepotX, curDepotY);

    setConfigPatch((prev) => ({
      ...prev,
      depotXMeters: rotDepot.nx,
      depotYMeters: rotDepot.ny,
      obstacles: (prev.obstacles ?? config.obstacles ?? []).map((o) => {
        const ro = rot(o.xMeters, o.yMeters);
        return { ...o, xMeters: ro.nx, yMeters: ro.ny };
      }),
      interiorProps: (prev.interiorProps ?? activePropsList).map(
        (p) => {
          const rp = rot(p.xMeters, p.yMeters);
          return {
            ...p,
            xMeters: rp.nx,
            yMeters: rp.ny,
            rotationDeg: (p.rotationDeg + 90) % 360,
          };
        }
      ),
    }));
  }, [
    activePropsList,
    bins,
    config,
    pushWorkspaceUndo,
    setConfigPatch,
    setCustomBinsOverride,
    setExtraBins,
    setRemovedBinIds,
  ]);

  const handleScaleWholeTemplateSpacing = useCallback(
    (factor: number) => {
      if (bins.length === 0) return;
      pushWorkspaceUndo();
      const xs = bins.map((b) => b.xMeters);
      const ys = bins.map((b) => b.yMeters);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const sc = (x: number, y: number) => ({
        nx: Number((cx + (x - cx) * factor).toFixed(2)),
        ny: Number((cy + (y - cy) * factor).toFixed(2)),
      });

      const nextBins = resolveShelfCollisions3D(
        bins.map((b) => {
          const { nx, ny } = sc(b.xMeters, b.yMeters);
          return { ...b, xMeters: nx, yMeters: ny };
        }),
        config
      );
      setCustomBinsOverride(nextBins);
      setExtraBins([]);
      setRemovedBinIds([]);

      setConfigPatch((prev) => ({
        ...prev,
        obstacles: (prev.obstacles ?? config.obstacles ?? []).map((o) => {
          const ro = sc(o.xMeters, o.yMeters);
          return { ...o, xMeters: ro.nx, yMeters: ro.ny };
        }),
        interiorProps: (prev.interiorProps ?? activePropsList).map(
          (p) => {
            const rp = sc(p.xMeters, p.yMeters);
            return { ...p, xMeters: rp.nx, yMeters: rp.ny };
          }
        ),
      }));
    },
    [
      activePropsList,
      bins,
      config,
      pushWorkspaceUndo,
      setConfigPatch,
      setCustomBinsOverride,
      setExtraBins,
      setRemovedBinIds,
    ]
  );

  const handleCenterWholeTemplate = useCallback(() => {
    if (bins.length === 0) return;
    const minX = Math.min(...bins.map((b) => b.xMeters));
    const minY = Math.min(...bins.map((b) => b.yMeters));
    handleTranslateWholeTemplate(-minX, 1.8 - minY);
  }, [bins, handleTranslateWholeTemplate]);

  const handleCreateCustomHomeSpace = useCallback(
    (params: {
      floorWidthM: number;
      floorDepthM: number;
      levels: number;
      shelfTier: 'small' | 'medium' | 'large';
    }) => {
      pushWorkspaceUndo();
      const tierSpecs = {
        small: { l: 75, w: 50, h: 42, aisleSp: 2.1, baySp: 1.0 },
        medium: { l: 95, w: 65, h: 52, aisleSp: 2.5, baySp: 1.2 },
        large: { l: 120, w: 90, h: 70, aisleSp: 3.4, baySp: 1.45 },
      }[params.shelfTier];

      const aisles = Math.max(
        1,
        Math.min(6, Math.floor((params.floorWidthM - 1.2) / tierSpecs.aisleSp) + 1)
      );
      const bays = Math.max(
        2,
        Math.min(9, Math.floor((params.floorDepthM - 2.2) / tierSpecs.baySp) + 1)
      );
      setConfigPatch({
        aisles,
        baysPerAisle: bays,
        levels: params.levels,
        aisleSpacingM: tierSpecs.aisleSp,
        baySpacingM: tierSpecs.baySp,
        binLengthCm: tierSpecs.l,
        binWidthCm: tierSpecs.w,
        binHeightCm: tierSpecs.h,
        floorWidthM: params.floorWidthM,
        floorDepthM: params.floorDepthM,
        obstacles: [],
        disabledBinIds: [],
        interiorProps: [],
        mapTag: `${params.floorWidthM}×${params.floorDepthM}m · Z${params.levels}`,
      });
      setCustomBinsOverride(null);
      setExtraBins([]);
      setRemovedBinIds([]);
      setPinnedPlacements([]);
      setSelectedBinId(null);
      setSelectedPropId(null);
      setSelectedCargo(null);
      setCameraResetTick((n) => n + 1);
      setAppView('workspace');
    },
    [
      pushWorkspaceUndo,
      setAppView,
      setCameraResetTick,
      setConfigPatch,
      setCustomBinsOverride,
      setExtraBins,
      setPinnedPlacements,
      setRemovedBinIds,
      setSelectedBinId,
      setSelectedCargo,
      setSelectedPropId,
    ]
  );

  const handleAddInteriorProp = useCallback(
    (type: InteriorPropType, customX?: number, customY?: number) => {
      pushWorkspaceUndo();
      const cat =
        INTERIOR_PROP_CATALOG.find((c) => c.type === type) ??
        INTERIOR_PROP_CATALOG[0];
      const existing = activePropsList;

      let chosenX = customX;
      let chosenY = customY;

      if (chosenX === undefined || chosenY === undefined) {
        const binXs = bins.map((b) => b.xMeters);
        const binYs = bins.map((b) => b.yMeters);
        const minBX = binXs.length > 0 ? Math.min(...binXs) : 0;
        const maxBX = binXs.length > 0 ? Math.max(...binXs) : 6;
        const minBY = binYs.length > 0 ? Math.min(...binYs) : 1.8;
        const maxBY = binYs.length > 0 ? Math.max(...binYs) : 6;

        const candidateSpots: Array<[number, number]> = [];
        for (let ring = 0; ring < 5; ring++) {
          const margin = 1.6 + ring * 1.35;
          for (let x = minBX - 1.2; x <= maxBX + 1.5; x += 1.35) {
            candidateSpots.push([x, minBY - margin + 0.6]);
            candidateSpots.push([x, maxBY + margin]);
          }
          for (let y = minBY - 0.5; y <= maxBY + 1.5; y += 1.35) {
            candidateSpots.push([minBX - margin, y]);
            candidateSpots.push([maxBX + margin, y]);
          }
        }

        const isOccupied = (cx: number, cy: number) => {
          for (const b of bins) {
            if (Math.hypot(b.xMeters - cx, b.yMeters - cy) < 1.15) return true;
          }
          for (const o of config.obstacles ?? []) {
            if (Math.hypot(o.xMeters - cx, o.yMeters - cy) < 1.05) return true;
          }
          for (const p of existing) {
            if (Math.hypot(p.xMeters - cx, p.yMeters - cy) < 1.15) return true;
          }
          return false;
        };

        const foundSpot = candidateSpots.find(([cx, cy]) => !isOccupied(cx, cy));
        if (foundSpot) {
          chosenX = foundSpot[0];
          chosenY = foundSpot[1];
        } else {
          const offsetIdx = existing.length;
          chosenX = -1.6 + (offsetIdx % 8) * 1.4;
          chosenY = -0.8 - Math.floor(offsetIdx / 8) * 1.4;
        }
      }

      const newProp: InteriorProp = {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        label: lang === 'ko' ? cat.nameKo : cat.nameEn,
        xMeters: Number(chosenX.toFixed(2)),
        yMeters: Number(chosenY.toFixed(2)),
        rotationDeg: 0,
        scale: 1.0,
        color: cat.defaultColor,
      };
      setConfigPatch((prev) => ({
        ...prev,
        interiorProps: [...(prev.interiorProps ?? activePropsList), newProp],
      }));
      setSelectedPropId(newProp.id);
      setSelectedBinId(null);
      setSelectedCargo(null);
      showToast(
        lang === 'ko'
          ? `Added 3D Interior: ${newProp.label} (${newProp.xMeters}m, ${newProp.yMeters}m)`
          : `Added 3D Interior: ${newProp.label} (${newProp.xMeters}m, ${newProp.yMeters}m)`
      );
    },
    [
      activePropsList,
      bins,
      config.obstacles,
      lang,
      pushWorkspaceUndo,
      setConfigPatch,
      setSelectedBinId,
      setSelectedCargo,
      setSelectedPropId,
      showToast,
    ]
  );

  const handleUpdateInteriorProp = useCallback(
    (id: string, patch: Partial<InteriorProp>) => {
      pushWorkspaceUndo();
      setConfigPatch((prev) => ({
        ...prev,
        interiorProps: (prev.interiorProps ?? activePropsList).map(
          (p) => (p.id === id ? { ...p, ...patch } : p)
        ),
      }));
    },
    [activePropsList, pushWorkspaceUndo, setConfigPatch]
  );

  const handleDuplicateInteriorProp = useCallback(
    (id: string) => {
      const src = activePropsList.find((p) => p.id === id);
      if (!src) return;
      pushWorkspaceUndo();
      const copy: InteriorProp = {
        ...src,
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        xMeters: Number((src.xMeters + 0.75).toFixed(2)),
        yMeters: Number((src.yMeters + 0.5).toFixed(2)),
      };
      setConfigPatch((prev) => ({
        ...prev,
        interiorProps: [...(prev.interiorProps ?? activePropsList), copy],
      }));
      setSelectedPropId(copy.id);
    },
    [activePropsList, pushWorkspaceUndo, setConfigPatch, setSelectedPropId]
  );

  const handleDeleteInteriorProp = useCallback(
    (id: string) => {
      pushWorkspaceUndo();
      setConfigPatch((prev) => ({
        ...prev,
        interiorProps: (prev.interiorProps ?? activePropsList).filter(
          (p) => p.id !== id
        ),
      }));
      setSelectedPropId((curr) => (curr === id ? null : curr));
    },
    [activePropsList, pushWorkspaceUndo, setConfigPatch, setSelectedPropId]
  );

  const handleAutoPopulateInterior = useCallback(() => {
    pushWorkspaceUndo();
    const aisleSp = config.aisleSpacingM ?? 3.4;
    const baySp = config.baySpacingM ?? 1.45;
    const maxX = (config.aisles - 1) * aisleSp;
    const maxZ = 1.8 + (config.baysPerAisle - 1) * baySp;
    const autoList: InteriorProp[] = [
      {
        id: `prop-auto-1-${Date.now()}`,
        type: 'desk_work',
        label: lang === 'ko' ? 'Study & Packing Desk' : 'Study & Packing Desk',
        xMeters: Number((maxX + 1.8).toFixed(2)),
        yMeters: 0.8,
        rotationDeg: 270,
        scale: 1,
        color: '#b45309',
      },
      {
        id: `prop-auto-2-${Date.now()}`,
        type: 'sofa_lounge',
        label: lang === 'ko' ? 'Cozy Lounge Sofa' : 'Cozy Lounge Sofa',
        xMeters: -1.4,
        yMeters: Number((maxZ * 0.45).toFixed(2)),
        rotationDeg: 90,
        scale: 1,
        color: '#6366f1',
      },
      {
        id: `prop-auto-3-${Date.now()}`,
        type: 'plant_pot',
        label: lang === 'ko' ? 'Indoor Monstera Plant' : 'Indoor Monstera Plant',
        xMeters: -1.3,
        yMeters: 0.4,
        rotationDeg: 0,
        scale: 1.1,
        color: '#10b981',
      },
      {
        id: `prop-auto-4-${Date.now()}`,
        type: 'door_entry',
        label: lang === 'ko' ? 'Room Entrance Door' : 'Room Entrance Door',
        xMeters: -1.5,
        yMeters: Number((maxZ - 0.5).toFixed(2)),
        rotationDeg: 90,
        scale: 1,
        color: '#92400e',
      },
    ];
    setConfigPatch((prev) => ({
      ...prev,
      roomEnclosure: 'three_walls',
      interiorProps: autoList,
    }));
    setSelectedPropId(autoList[0].id);
    showToast(
      lang === 'ko'
        ? 'Auto-populated 3D Room Interior (Desk, Sofa, Plant, Door & 3-Wall Room).'
        : 'Auto-populated 3D Room Interior (Desk, Sofa, Plant, Door & 3-Wall Room).'
    );
  }, [
    config.aisleSpacingM,
    config.aisles,
    config.baySpacingM,
    config.baysPerAisle,
    lang,
    pushWorkspaceUndo,
    setConfigPatch,
    setSelectedPropId,
    showToast,
  ]);

  const handleResizeSingleBin = useCallback(
    (
      binId: string,
      patch: {
        binLengthCm?: number;
        binWidthCm?: number;
        binHeightCm?: number;
        maxWeightKg?: number;
      },
      scope: ShelfResizeScope = 'single'
    ) => {
      const target = bins.find((b) => b.id === binId) ?? bins[0];
      if (!target) return;
      pushWorkspaceUndo();

      const clampL = (v: number) => Math.max(20, Math.min(300, Math.round(v)));
      const clampW = (v: number) => Math.max(20, Math.min(300, Math.round(v)));
      const clampH = (v: number) => Math.max(15, Math.min(250, Math.round(v)));
      const clampKg = (v: number) => Math.max(10, Math.min(5000, Math.round(v)));

      const matchesScope = (b: BinSpec) => {
        if (scope === 'all') return true;
        if (scope === 'column') {
          return (
            Math.hypot(b.xMeters - target.xMeters, b.yMeters - target.yMeters) <
              0.35 ||
            (b.aisle === target.aisle && b.bay === target.bay)
          );
        }
        return b.id === binId;
      };

      const updatedBins = bins.map((b) => {
        if (!matchesScope(b)) return b;
        return {
          ...b,
          binLengthCm:
            patch.binLengthCm !== undefined
              ? clampL(patch.binLengthCm)
              : b.binLengthCm,
          binWidthCm:
            patch.binWidthCm !== undefined
              ? clampW(patch.binWidthCm)
              : b.binWidthCm,
          binHeightCm:
            patch.binHeightCm !== undefined
              ? clampH(patch.binHeightCm)
              : b.binHeightCm,
          maxWeightKg:
            patch.maxWeightKg !== undefined
              ? clampKg(patch.maxWeightKg)
              : b.maxWeightKg,
        };
      });

      const finalBins = resolveShelfCollisions3D(
        adjustColumnZLevelsForTallBins(
          updatedBins,
          config.goldenZoneMinM,
          config.goldenZoneMaxM,
          patch.binHeightCm !== undefined
        ),
        config,
        scope === 'single' ? [binId] : []
      );

      if (scope === 'all') {
        setConfigPatch((prev) => ({
          ...prev,
          ...(patch.binLengthCm !== undefined
            ? { binLengthCm: clampL(patch.binLengthCm) }
            : {}),
          ...(patch.binWidthCm !== undefined
            ? { binWidthCm: clampW(patch.binWidthCm) }
            : {}),
          ...(patch.binHeightCm !== undefined
            ? { binHeightCm: clampH(patch.binHeightCm) }
            : {}),
        }));
      }

      setCustomBinsOverride(finalBins);
      setExtraBins([]);
      setRemovedBinIds([]);
    },
    [
      bins,
      config,
      pushWorkspaceUndo,
      setConfigPatch,
      setCustomBinsOverride,
      setExtraBins,
      setRemovedBinIds,
    ]
  );

  const handleMoveDepot = useCallback(
    (newX: number, newY: number) => {
      pushWorkspaceUndo();
      const nx = Number(newX.toFixed(2));
      const ny = Number(newY.toFixed(2));
      setConfigPatch((prev) => ({
        ...prev,
        depotXMeters: nx,
        depotYMeters: ny,
      }));
      showToast(
        lang === 'ko'
          ? `★ Moved I/O Depot to (${nx}m, ${ny}m)`
          : `★ Moved I/O Depot to (${nx}m, ${ny}m)`
      );
    },
    [lang, pushWorkspaceUndo, setConfigPatch, showToast]
  );

  const handleAddObstacleAt = useCallback(
    (x: number, y: number, label?: string) => {
      pushWorkspaceUndo();
      const nx = Number((Math.round(x / 0.25) * 0.25).toFixed(2));
      const ny = Number((Math.round(y / 0.25) * 0.25).toFixed(2));
      const aisleSp = Math.max(0.8, config.aisleSpacingM ?? 3.4);
      const baySp = Math.max(0.6, config.baySpacingM ?? 1.45);
      const newObs: WarehouseObstacle = {
        id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        aisle: Math.max(1, Math.round(nx / aisleSp) + 1),
        bay: Math.max(1, Math.round((ny - 1.8) / baySp) + 1),
        xMeters: nx,
        yMeters: ny,
        label: label || (lang === 'ko' ? 'PILLAR' : 'PILLAR'),
      };
      setConfigPatch((prev) => ({
        ...prev,
        obstacles: [...(prev.obstacles ?? config.obstacles ?? []), newObs],
      }));
      showToast(
        lang === 'ko'
          ? `Added 3D Pillar/Obstacle at (${nx}m, ${ny}m)`
          : `Added 3D Pillar/Obstacle at (${nx}m, ${ny}m)`
      );
      return newObs;
    },
    [
      config.aisleSpacingM,
      config.baySpacingM,
      config.obstacles,
      lang,
      pushWorkspaceUndo,
      setConfigPatch,
      showToast,
    ]
  );

  const handleUpdateObstacle = useCallback(
    (id: string, patch: Partial<WarehouseObstacle>) => {
      pushWorkspaceUndo();
      const aisleSp = Math.max(0.8, config.aisleSpacingM ?? 3.4);
      const baySp = Math.max(0.6, config.baySpacingM ?? 1.45);
      setConfigPatch((prev) => ({
        ...prev,
        obstacles: (prev.obstacles ?? config.obstacles ?? []).map((o) => {
          if (o.id !== id) return o;
          const nx =
            patch.xMeters !== undefined
              ? Number(patch.xMeters.toFixed(2))
              : o.xMeters;
          const ny =
            patch.yMeters !== undefined
              ? Number(patch.yMeters.toFixed(2))
              : o.yMeters;
          return {
            ...o,
            ...patch,
            xMeters: nx,
            yMeters: ny,
            aisle: Math.max(1, Math.round(nx / aisleSp) + 1),
            bay: Math.max(1, Math.round((ny - 1.8) / baySp) + 1),
          };
        }),
      }));
    },
    [
      config.aisleSpacingM,
      config.baySpacingM,
      config.obstacles,
      pushWorkspaceUndo,
      setConfigPatch,
    ]
  );

  const handleDeleteObstacle = useCallback(
    (id: string) => {
      pushWorkspaceUndo();
      setConfigPatch((prev) => ({
        ...prev,
        obstacles: (prev.obstacles ?? config.obstacles ?? []).filter(
          (o) => o.id !== id
        ),
      }));
      showToast(
        lang === 'ko' ? 'Deleted obstacle.' : 'Deleted obstacle.'
      );
    },
    [config.obstacles, lang, pushWorkspaceUndo, setConfigPatch, showToast]
  );

  const handlePlaceCustomBoxInBin = useCallback(
    (input: CustomBoxPlacementInput) => {
      const targetBin = bins.find((b) => b.id === input.binId) ?? bins[0];
      if (!targetBin) return;

      pushWorkspaceUndo();
      const qty = Math.max(1, Math.min(40, Math.round(input.quantity ?? 1)));
      const boxL = Math.max(5, Math.min(280, Math.round(input.lengthCm)));
      const boxW = Math.max(5, Math.min(280, Math.round(input.widthCm)));
      const boxH = Math.max(5, Math.min(240, Math.round(input.heightCm)));
      const boxKg = Math.max(0.1, Math.min(1000, Number((input.weightKg ?? 4).toFixed(1))));
      const autoExpand = input.autoExpandBin ?? true;

      const targetAlloc = allocations.find((a) => a.bin.id === targetBin.id);
      const existingWeight = targetAlloc?.currentWeightKg ?? 0;

      const needsLengthExpand = boxL > targetBin.binLengthCm;
      const needsWidthExpand = boxW > targetBin.binWidthCm;
      const needsHeightExpand = boxH > targetBin.binHeightCm;
      const needsWeightExpand =
        existingWeight + boxKg * qty > targetBin.maxWeightKg;

      let expandedDimsNotice = '';
      if (
        autoExpand &&
        (needsLengthExpand ||
          needsWidthExpand ||
          needsHeightExpand ||
          needsWeightExpand)
      ) {
        const nextL = Math.max(targetBin.binLengthCm, boxL + 4);
        const nextW = Math.max(targetBin.binWidthCm, boxW + 4);
        const nextH = Math.max(targetBin.binHeightCm, boxH + 4);
        const nextBins = adjustColumnZLevelsForTallBins(
          bins.map((b) =>
            b.id === targetBin.id
              ? {
                  ...b,
                  binLengthCm: nextL,
                  binWidthCm: nextW,
                  binHeightCm: nextH,
                  maxWeightKg: Math.max(
                    b.maxWeightKg,
                    Math.ceil(existingWeight + boxKg * qty + 20)
                  ),
                }
              : b
          ),
          config.goldenZoneMinM,
          config.goldenZoneMaxM,
          needsHeightExpand
        );
        setCustomBinsOverride(nextBins);
        setExtraBins([]);
        setRemovedBinIds([]);
        if (needsLengthExpand || needsWidthExpand || needsHeightExpand) {
          expandedDimsNotice =
            lang === 'ko'
              ? ` (Shelf auto-expanded to ${nextL}×${nextW}×${nextH}cm)`
              : ` (Shelf auto-expanded to ${nextL}×${nextW}×${nextH}cm)`;
        }
      }

      const idSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      const skuCode =
        input.skuCode?.trim() || `BOX-${boxL}x${boxW}x${boxH}`;
      const name =
        input.name?.trim() ||
        (lang === 'ko'
          ? `Custom Box ${boxL}×${boxW}×${boxH}cm`
          : `Custom Box ${boxL}×${boxW}×${boxH}cm`);
      const abcClass: ABCClass =
        input.abcClass ?? (targetBin.isGoldenZone ? 'A' : 'B');
      const color = input.color || '#22d3ee';
      const fragile = Boolean(input.fragile);

      const newSku: SKUItem = {
        id: `sku-custom-${Date.now()}-${idSuffix}`,
        skuCode,
        name,
        category: 'CustomBox',
        abcClass,
        dailyPicks: abcClass === 'A' ? 110 : abcClass === 'B' ? 50 : 18,
        lengthCm: boxL,
        widthCm: boxW,
        heightCm: boxH,
        weightKg: boxKg,
        quantity: qty,
        fragile,
        color,
      };

      setSkus((prev) => [newSku, ...prev]);
      setPinnedPlacements((prev) => [
        { binId: targetBin.id, skuId: newSku.id, count: qty },
        ...prev,
      ]);
      setSelectedBinId(targetBin.id);
      setSelectedCargo({
        binId: targetBin.id,
        boxIndex: 0,
        skuId: newSku.id,
        skuCode: newSku.skuCode,
        name: newSku.name,
        weightKg: newSku.weightKg,
        lengthCm: newSku.lengthCm,
        widthCm: newSku.widthCm,
        heightCm: newSku.heightCm,
        color: newSku.color,
      });

      showToast(
        lang === 'ko'
          ? `Placed ${qty}× custom box (${boxL}×${boxW}×${boxH}cm, ${boxKg}kg) into shelf [${targetBin.id}].${expandedDimsNotice}`
          : `Placed ${qty}× custom box (${boxL}×${boxW}×${boxH}cm, ${boxKg}kg) into shelf [${targetBin.id}].${expandedDimsNotice}`
      );
    },
    [
      allocations,
      bins,
      config.goldenZoneMaxM,
      config.goldenZoneMinM,
      lang,
      pushWorkspaceUndo,
      setCustomBinsOverride,
      setExtraBins,
      setPinnedPlacements,
      setRemovedBinIds,
      setSelectedBinId,
      setSelectedCargo,
      setSkus,
      showToast,
    ]
  );

  const handleUpdateBoxDimensions = useCallback(
    (
      skuId: string,
      patch: {
        lengthCm?: number;
        widthCm?: number;
        heightCm?: number;
        weightKg?: number;
        name?: string;
        color?: string;
        fragile?: boolean;
      },
      binIdToAutoExpand?: string
    ) => {
      pushWorkspaceUndo();
      const clampedL =
        patch.lengthCm !== undefined
          ? Math.max(5, Math.min(280, Math.round(patch.lengthCm)))
          : undefined;
      const clampedW =
        patch.widthCm !== undefined
          ? Math.max(5, Math.min(280, Math.round(patch.widthCm)))
          : undefined;
      const clampedH =
        patch.heightCm !== undefined
          ? Math.max(5, Math.min(240, Math.round(patch.heightCm)))
          : undefined;
      const clampedKg =
        patch.weightKg !== undefined
          ? Math.max(0.1, Math.min(1000, Number(patch.weightKg.toFixed(1))))
          : undefined;

      if (binIdToAutoExpand) {
        const targetBin = bins.find((b) => b.id === binIdToAutoExpand);
        if (
          targetBin &&
          ((clampedL !== undefined && clampedL > targetBin.binLengthCm) ||
            (clampedW !== undefined && clampedW > targetBin.binWidthCm) ||
            (clampedH !== undefined && clampedH > targetBin.binHeightCm))
        ) {
          const nextL = Math.max(
            targetBin.binLengthCm,
            (clampedL ?? targetBin.binLengthCm) + 4
          );
          const nextW = Math.max(
            targetBin.binWidthCm,
            (clampedW ?? targetBin.binWidthCm) + 4
          );
          const nextH = Math.max(
            targetBin.binHeightCm,
            (clampedH ?? targetBin.binHeightCm) + 4
          );
          const nextBins = adjustColumnZLevelsForTallBins(
            bins.map((b) =>
              b.id === targetBin.id
                ? {
                    ...b,
                    binLengthCm: nextL,
                    binWidthCm: nextW,
                    binHeightCm: nextH,
                  }
                : b
            ),
            config.goldenZoneMinM,
            config.goldenZoneMaxM,
            clampedH !== undefined && clampedH > targetBin.binHeightCm
          );
          setCustomBinsOverride(nextBins);
          setExtraBins([]);
          setRemovedBinIds([]);
          showToast(
            lang === 'ko'
              ? `Shelf [${targetBin.id}] auto-expanded to ${nextL}×${nextW}×${nextH}cm to fit updated box dimensions.`
              : `Shelf [${targetBin.id}] auto-expanded to ${nextL}×${nextW}×${nextH}cm to fit updated box dimensions.`
          );
        }
      }

      setSkus((prev) =>
        prev.map((s) =>
          s.id === skuId
            ? {
                ...s,
                lengthCm: clampedL ?? s.lengthCm,
                widthCm: clampedW ?? s.widthCm,
                heightCm: clampedH ?? s.heightCm,
                weightKg: clampedKg ?? s.weightKg,
                name: patch.name !== undefined ? patch.name : s.name,
                color: patch.color !== undefined ? patch.color : s.color,
                fragile: patch.fragile !== undefined ? patch.fragile : s.fragile,
              }
            : s
        )
      );

      setSelectedCargo((prev) =>
        prev && prev.skuId === skuId
          ? {
              ...prev,
              lengthCm: clampedL ?? prev.lengthCm,
              widthCm: clampedW ?? prev.widthCm,
              heightCm: clampedH ?? prev.heightCm,
              weightKg: clampedKg ?? prev.weightKg,
              name: patch.name !== undefined ? patch.name : prev.name,
              color: patch.color !== undefined ? patch.color : prev.color,
            }
          : prev
      );
    },
    [
      bins,
      config.goldenZoneMaxM,
      config.goldenZoneMinM,
      pushWorkspaceUndo,
      setCustomBinsOverride,
      setExtraBins,
      setRemovedBinIds,
      setSelectedCargo,
      setSkus,
    ]
  );

  return {
    handleAddBin,
    handleDeleteBin,
    handlePinCargo,
    handleSetCargoCountInBin,
    handleSetBinTotalBoxQuota,
    handlePlaceCustomBoxInBin,
    handleUpdateBoxDimensions,
    handleResizeSingleBin,
    handleMoveDepot,
    handleAddObstacleAt,
    handleUpdateObstacle,
    handleDeleteObstacle,
    handleMoveSingleCargoToBin,
    handleMoveSingleCargoToFloor,
    handleNudgeSingleCargo,
    handleMoveSkuToLevel,
    handleAddBinAbove,
    handleAddBinAtFloor,
    handleMoveSingleBin,
    handleMoveRackColumn,
    handleTranslateWholeTemplate,
    handleRotateWholeTemplate90,
    handleScaleWholeTemplateSpacing,
    handleCenterWholeTemplate,
    handleCreateCustomHomeSpace,
    handleAddInteriorProp,
    handleUpdateInteriorProp,
    handleDuplicateInteriorProp,
    handleDeleteInteriorProp,
    handleAutoPopulateInterior,
  };
}
