import { type Dispatch, type SetStateAction, useCallback } from 'react';
import { INTERIOR_PROP_CATALOG } from '../components/InteriorStudioModal';
import type { LangCode } from '../i18n/translations';
import type {
  BinAllocation,
  BinSpec,
  InteriorProp,
  InteriorPropType,
  PinnedCargoPlacement,
  WarehouseConfig,
} from '../types/warehouse';

interface UseWarehouseTransformsParams {
  bins: BinSpec[];
  config: WarehouseConfig;
  lang: LangCode;
  pushWorkspaceUndo: () => void;
  showToast: (msg: string) => void;
  setConfigPatch: Dispatch<SetStateAction<Partial<WarehouseConfig>>>;
  setCustomBinsOverride: Dispatch<SetStateAction<BinSpec[] | null>>;
  setExtraBins: Dispatch<SetStateAction<BinSpec[]>>;
  setRemovedBinIds: Dispatch<SetStateAction<string[]>>;
  setPinnedPlacements: Dispatch<SetStateAction<PinnedCargoPlacement[]>>;
  setSelectedBinId: Dispatch<SetStateAction<string | null>>;
  setSelectedPropId: Dispatch<SetStateAction<string | null>>;
  setCameraResetTick: Dispatch<SetStateAction<number>>;
  setAppView: Dispatch<SetStateAction<'workspace' | 'home'>>;
}

export function useWarehouseTransforms({
  bins,
  config,
  lang,
  pushWorkspaceUndo,
  showToast,
  setConfigPatch,
  setCustomBinsOverride,
  setExtraBins,
  setRemovedBinIds,
  setPinnedPlacements,
  setSelectedBinId,
  setSelectedPropId,
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
    },
    [
      pushWorkspaceUndo,
      setExtraBins,
      setPinnedPlacements,
      setRemovedBinIds,
      setSelectedBinId,
    ]
  );

  const handlePinCargo = useCallback(
    (binId: string, skuId: string, delta: number = 1) => {
      pushWorkspaceUndo();
      setPinnedPlacements((prev) => {
        const idx = prev.findIndex(
          (p) => p.binId === binId && p.skuId === skuId
        );
        if (idx === -1) {
          return delta > 0 ? [...prev, { binId, skuId, count: delta }] : prev;
        }
        const nextCount = prev[idx].count + delta;
        if (nextCount <= 0) {
          return prev.filter((_, i) => i !== idx);
        }
        return prev.map((p, i) =>
          i === idx ? { ...p, count: nextCount } : p
        );
      });
    },
    [pushWorkspaceUndo, setPinnedPlacements]
  );

  const handleMoveSkuToLevel = useCallback(
    (fromBinId: string, skuId: string, targetLevel: number) => {
      const fromBin = bins.find((b) => b.id === fromBinId);
      const sameColBin = fromBin
        ? bins.find(
            (b) =>
              b.aisle === fromBin.aisle &&
              b.bay === fromBin.bay &&
              b.level === targetLevel
          )
        : null;
      const targetBin =
        sameColBin ??
        bins.find((b) => b.level === targetLevel) ??
        bins[0] ??
        null;
      if (!targetBin) return;

      pushWorkspaceUndo();
      setPinnedPlacements((prev) => {
        const filtered = prev
          .map((p) =>
            p.binId === fromBinId && p.skuId === skuId
              ? { ...p, count: p.count - 1 }
              : p
          )
          .filter((p) => p.count > 0);
        const existingIdx = filtered.findIndex(
          (p) => p.binId === targetBin.id && p.skuId === skuId
        );
        if (existingIdx === -1) {
          return [...filtered, { binId: targetBin.id, skuId, count: 1 }];
        }
        return filtered.map((p, i) =>
          i === existingIdx ? { ...p, count: p.count + 1 } : p
        );
      });
      setSelectedBinId(targetBin.id);
      showToast(
        lang === 'ko'
          ? `물품을 [${targetBin.id}] (Z${targetLevel}층) 선반으로 이동했습니다.`
          : `Moved item to [${targetBin.id}] (Level Z${targetLevel}).`
      );
    },
    [bins, lang, pushWorkspaceUndo, setPinnedPlacements, setSelectedBinId, showToast]
  );

  const handleAddBinAbove = useCallback(
    (alloc: BinAllocation) => {
      const nextLevel = alloc.bin.level + 1;
      const levelHeights = [0.05, 0.85, 1.55, 2.35, 3.15, 3.95, 4.75, 5.55];
      const maxWeights = [1200, 750, 600, 420, 280, 200, 160, 140];
      const zMeters =
        levelHeights[nextLevel - 1] ??
        Number(((nextLevel - 1) * 0.82 + 0.05).toFixed(2));
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

      // Pick lowest unoccupied Z-level at this actual (snappedX, snappedY) floor coordinate
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
      const nextBins = bins.map((b) => {
        if (
          Math.abs(b.xMeters - oldX) < 0.05 &&
          Math.abs(b.yMeters - oldY) < 0.05
        ) {
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
      setCustomBinsOverride(nextBins);
      setExtraBins([]);
      setRemovedBinIds([]);
    },
    [
      bins,
      config.aisleSpacingM,
      config.baySpacingM,
      pushWorkspaceUndo,
      setCustomBinsOverride,
      setExtraBins,
      setRemovedBinIds,
    ]
  );

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
        interiorProps: (prev.interiorProps ?? config.interiorProps ?? []).map(
          (p) => ({
            ...p,
            xMeters: Number((p.xMeters + dx).toFixed(2)),
            yMeters: Number((p.yMeters + dy).toFixed(2)),
          })
        ),
      }));
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

    const nextBins = bins.map((b) => {
      const { nx, ny } = rot(b.xMeters, b.yMeters);
      return {
        ...b,
        xMeters: nx,
        yMeters: ny,
        binLengthCm: b.binWidthCm,
        binWidthCm: b.binLengthCm,
      };
    });
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
      interiorProps: (prev.interiorProps ?? config.interiorProps ?? []).map(
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

      const nextBins = bins.map((b) => {
        const { nx, ny } = sc(b.xMeters, b.yMeters);
        return { ...b, xMeters: nx, yMeters: ny };
      });
      setCustomBinsOverride(nextBins);
      setExtraBins([]);
      setRemovedBinIds([]);

      setConfigPatch((prev) => ({
        ...prev,
        obstacles: (prev.obstacles ?? config.obstacles ?? []).map((o) => {
          const ro = sc(o.xMeters, o.yMeters);
          return { ...o, xMeters: ro.nx, yMeters: ro.ny };
        }),
        interiorProps: (prev.interiorProps ?? config.interiorProps ?? []).map(
          (p) => {
            const rp = sc(p.xMeters, p.yMeters);
            return { ...p, xMeters: rp.nx, yMeters: rp.ny };
          }
        ),
      }));
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
      setSelectedPropId,
    ]
  );

  const handleAddInteriorProp = useCallback(
    (type: InteriorPropType, customX?: number, customY?: number) => {
      pushWorkspaceUndo();
      const cat =
        INTERIOR_PROP_CATALOG.find((c) => c.type === type) ??
        INTERIOR_PROP_CATALOG[0];
      const existing = config.interiorProps ?? [];
      const offsetIdx = existing.length;
      const newProp: InteriorProp = {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        label: lang === 'ko' ? cat.nameKo : cat.nameEn,
        xMeters:
          customX !== undefined
            ? Number(customX.toFixed(2))
            : Number((-0.8 + (offsetIdx % 4) * 1.4).toFixed(2)),
        yMeters:
          customY !== undefined
            ? Number(customY.toFixed(2))
            : Number((0.4 + Math.floor(offsetIdx / 4) * 1.3).toFixed(2)),
        rotationDeg: 0,
        scale: 1.0,
        color: cat.defaultColor,
      };
      setConfigPatch((prev) => ({
        ...prev,
        interiorProps: [...(prev.interiorProps ?? config.interiorProps ?? []), newProp],
      }));
      setSelectedPropId(newProp.id);
      setSelectedBinId(null);
      showToast(
        lang === 'ko'
          ? `3D 인테리어 추가됨: ${newProp.label}`
          : `Added 3D Interior: ${newProp.label}`
      );
    },
    [
      config.interiorProps,
      lang,
      pushWorkspaceUndo,
      setConfigPatch,
      setSelectedBinId,
      setSelectedPropId,
      showToast,
    ]
  );

  const handleUpdateInteriorProp = useCallback(
    (id: string, patch: Partial<InteriorProp>) => {
      pushWorkspaceUndo();
      setConfigPatch((prev) => ({
        ...prev,
        interiorProps: (prev.interiorProps ?? config.interiorProps ?? []).map(
          (p) => (p.id === id ? { ...p, ...patch } : p)
        ),
      }));
    },
    [config.interiorProps, pushWorkspaceUndo, setConfigPatch]
  );

  const handleDuplicateInteriorProp = useCallback(
    (id: string) => {
      const src = (config.interiorProps ?? []).find((p) => p.id === id);
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
        interiorProps: [...(prev.interiorProps ?? config.interiorProps ?? []), copy],
      }));
      setSelectedPropId(copy.id);
    },
    [config.interiorProps, pushWorkspaceUndo, setConfigPatch, setSelectedPropId]
  );

  const handleDeleteInteriorProp = useCallback(
    (id: string) => {
      pushWorkspaceUndo();
      setConfigPatch((prev) => ({
        ...prev,
        interiorProps: (prev.interiorProps ?? config.interiorProps ?? []).filter(
          (p) => p.id !== id
        ),
      }));
      setSelectedPropId((curr) => (curr === id ? null : curr));
    },
    [config.interiorProps, pushWorkspaceUndo, setConfigPatch, setSelectedPropId]
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
        label: lang === 'ko' ? '책상 & 모니터 작업대' : 'Study & Packing Desk',
        xMeters: Number((maxX + 1.8).toFixed(2)),
        yMeters: 0.8,
        rotationDeg: 270,
        scale: 1,
        color: '#b45309',
      },
      {
        id: `prop-auto-2-${Date.now()}`,
        type: 'sofa_lounge',
        label: lang === 'ko' ? '패브릭 소파·휴식존' : 'Cozy Lounge Sofa',
        xMeters: -1.4,
        yMeters: Number((maxZ * 0.45).toFixed(2)),
        rotationDeg: 90,
        scale: 1,
        color: '#6366f1',
      },
      {
        id: `prop-auto-3-${Date.now()}`,
        type: 'plant_pot',
        label: lang === 'ko' ? '대형 인테리어 화분' : 'Indoor Monstera Plant',
        xMeters: -1.3,
        yMeters: 0.4,
        rotationDeg: 0,
        scale: 1.1,
        color: '#10b981',
      },
      {
        id: `prop-auto-4-${Date.now()}`,
        type: 'door_entry',
        label: lang === 'ko' ? '실내 출입문' : 'Room Entrance Door',
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
        ? '맞춤 3D 인테리어(책상·소파·화분·출입문·3면 룸)가 자동 배치되었습니다.'
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

  return {
    handleAddBin,
    handleDeleteBin,
    handlePinCargo,
    handleMoveSkuToLevel,
    handleAddBinAbove,
    handleAddBinAtFloor,
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
