import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  Briefcase,
  Check,
  Copy,
  Download,
  Eraser,
  Home,
  Map as MapIcon,
  Maximize2,
  MousePointer2,
  Navigation,
  PlusSquare,
  RotateCcw,
  RotateCw,
  Save,
  Trash2,
  Undo2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  BinSpec,
  WarehouseConfig,
  WarehouseObstacle,
  WarehouseScenario,
} from '../types/warehouse';

type CanvasTool = 'select' | 'add_rack' | 'add_low' | 'add_obstacle' | 'move_depot' | 'erase';
type EditorPersona = 'professional' | 'everyday';

interface CanvasRackNode {
  key: string;
  aisle: number;
  bay: number;
  xMeters: number;
  yMeters: number;
  levels: number;
  binLengthCm: number;
  binWidthCm: number;
  binHeightCm: number;
}

interface CanvasSnapshot {
  racks: CanvasRackNode[];
  obstacles: WarehouseObstacle[];
  depotX: number;
  depotY: number;
  floorWidthM: number;
  floorDepthM: number;
}

interface CanvasContextMenuState {
  clientX: number;
  clientY: number;
  worldX: number;
  worldY: number;
  rackKey: string | null;
  obstacleId: string | null;
}

type DragState =
  | {
      type: 'rack_group';
      leadKey: string;
      startWorldX: number;
      startWorldY: number;
      initialPositions: Map<string, { xMeters: number; yMeters: number }>;
      committedUndo: boolean;
    }
  | {
      type: 'obstacle';
      id: string;
      offsetX: number;
      offsetY: number;
      committedUndo: boolean;
    }
  | {
      type: 'depot';
      offsetX: number;
      offsetY: number;
      committedUndo: boolean;
    }
  | {
      type: 'resize_floor';
      axis: 'x' | 'y' | 'xy';
      committedUndo: boolean;
    }
  | {
      type: 'marquee';
      startX: number;
      startY: number;
      currX: number;
      currY: number;
    };

interface MapEditorModalProps {
  open: boolean;
  onClose: () => void;
  config: WarehouseConfig;
  bins: BinSpec[];
  scenario: WarehouseScenario;
  onApplyMapEdits: (params: {
    configPatch: Partial<WarehouseConfig>;
    customBins: BinSpec[];
  }) => void;
  onSaveCustomScenario: (customMap: WarehouseScenario) => void;
}

const LEVEL_HEIGHTS_M = [0.05, 0.85, 1.55, 2.35, 3.15, 3.95];
const LEVEL_MAX_WEIGHTS_KG = [1200, 750, 600, 420, 280, 200];

const SHELF_PRESETS = {
  professional: [
    { label: 'Euro Pallet (120×90×70)', l: 120, w: 90, h: 70, sA: 3.4, sB: 1.45 },
    { label: 'Compact Tote (100×80×60)', l: 100, w: 80, h: 60, sA: 3.0, sB: 1.35 },
  ],
  everyday: [
    { label: 'Home Pantry (80×50×45)', l: 80, w: 50, h: 45, sA: 2.2, sB: 1.05 },
    { label: 'Garage Shelf (100×60×50)', l: 100, w: 60, h: 50, sA: 2.6, sB: 1.25 },
    { label: 'Closet Cube (60×45×40)', l: 60, w: 45, h: 40, sA: 2.0, sB: 0.95 },
  ],
};

const FLOOR_SIZE_PRESETS = [
  { label: 'S (8×7m)', w: 8, d: 7 },
  { label: 'M (12×10m)', w: 12, d: 10 },
  { label: 'L (18×14m)', w: 18, d: 14 },
  { label: 'XL (26×20m)', w: 26, d: 20 },
];

function safeNum(
  raw: string,
  fallback: number,
  min?: number,
  max?: number
): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  let val = parsed;
  if (min !== undefined) val = Math.max(min, val);
  if (max !== undefined) val = Math.min(max, val);
  return val;
}

function groupBinsToCanvasRacks(bins: BinSpec[]): CanvasRackNode[] {
  const byPos = new Map<string, BinSpec[]>();
  for (const b of bins) {
    const posKey = `${b.xMeters.toFixed(2)}_${b.yMeters.toFixed(2)}`;
    const list = byPos.get(posKey) ?? [];
    list.push(b);
    byPos.set(posKey, list);
  }
  const nodes: CanvasRackNode[] = [];
  let idx = 1;
  for (const [, list] of byPos) {
    const base = list[0];
    const maxLvl = list.reduce((m, x) => Math.max(m, x.level), 1);
    nodes.push({
      key: `R-${idx++}`,
      aisle: base.aisle,
      bay: base.bay,
      xMeters: base.xMeters,
      yMeters: base.yMeters,
      levels: Math.min(6, Math.max(1, maxLvl)),
      binLengthCm: base.binLengthCm,
      binWidthCm: base.binWidthCm,
      binHeightCm: base.binHeightCm,
    });
  }
  return nodes;
}

export const MapEditorModal: React.FC<MapEditorModalProps> = ({
  open,
  onClose,
  config,
  bins,
  scenario,
  onApplyMapEdits,
  onSaveCustomScenario,
}) => {
  const isScenarioEveryday =
    scenario.id.startsWith('everyday') || scenario.id.startsWith('tpl-life-');
  const [persona, setPersona] = useState<EditorPersona>(
    isScenarioEveryday ? 'everyday' : 'professional'
  );
  const [mapName, setMapName] = useState(`${scenario.name} (Custom)`);

  // Space Size Controls
  const [floorWidthM, setFloorWidthM] = useState(12);
  const [floorDepthM, setFloorDepthM] = useState(10);
  const [aisles, setAisles] = useState(config.aisles);
  const [baysPerAisle, setBaysPerAisle] = useState(config.baysPerAisle);
  const [levels, setLevels] = useState(config.levels);
  const [aisleSpacingM, setAisleSpacingM] = useState(config.aisleSpacingM ?? 3.4);
  const [baySpacingM, setBaySpacingM] = useState(config.baySpacingM ?? 1.45);
  const [binLengthCm, setBinLengthCm] = useState(config.binLengthCm ?? 120);
  const [binWidthCm, setBinWidthCm] = useState(config.binWidthCm ?? 90);
  const [binHeightCm, setBinHeightCm] = useState(config.binHeightCm ?? 70);

  // Canvas Interaction State
  const [tool, setTool] = useState<CanvasTool>('select');
  const [snapStepM, setSnapStepM] = useState<number>(0.25);
  const [zoom, setZoom] = useState<number>(1);
  const [racks, setRacks] = useState<CanvasRackNode[]>([]);
  const [obstacles, setObstacles] = useState<WarehouseObstacle[]>([]);
  const [depotX, setDepotX] = useState(3.4);
  const [depotY, setDepotY] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [marqueeRect, setMarqueeRect] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [undoStack, setUndoStack] = useState<CanvasSnapshot[]>([]);
  const [ctxMenu, setCtxMenu] = useState<CanvasContextMenuState | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;
    setPersona(
      scenario.id.startsWith('everyday') || scenario.id.startsWith('tpl-life-')
        ? 'everyday'
        : 'professional'
    );
    setMapName(`${scenario.name.replace(/ \(Custom\)$/, '')} (Custom)`);
    const aSp = config.aisleSpacingM ?? 3.4;
    const bSp = config.baySpacingM ?? 1.45;
    setAisles(config.aisles);
    setBaysPerAisle(config.baysPerAisle);
    setLevels(config.levels);
    setAisleSpacingM(aSp);
    setBaySpacingM(bSp);
    setFloorWidthM(
      config.floorWidthM ?? Math.max(8, Number((config.aisles * aSp + 2).toFixed(1)))
    );
    setFloorDepthM(
      config.floorDepthM ?? Math.max(7, Number((config.baysPerAisle * bSp + 3.5).toFixed(1)))
    );
    setBinLengthCm(config.binLengthCm ?? 120);
    setBinWidthCm(config.binWidthCm ?? 90);
    setBinHeightCm(config.binHeightCm ?? 70);
    setRacks(groupBinsToCanvasRacks(bins));
    setObstacles(config.obstacles ?? []);
    setDepotX(
      config.depotXMeters ?? ((Math.max(1, config.aisles) - 1) * aSp) / 2
    );
    setDepotY(config.depotYMeters ?? 0);
    setSelectedKeys([]);
    setMarqueeRect(null);
    setUndoStack([]);
    setCtxMenu(null);
    setZoom(1);
  }, [open, config, bins, scenario.id, scenario.name]);

  const snapshotNow = useCallback(
    (): CanvasSnapshot => ({
      racks: racks.map((r) => ({ ...r })),
      obstacles: obstacles.map((o) => ({ ...o })),
      depotX,
      depotY,
      floorWidthM,
      floorDepthM,
    }),
    [racks, obstacles, depotX, depotY, floorWidthM, floorDepthM]
  );

  const pushUndo = useCallback(
    (snap?: CanvasSnapshot) => {
      const entry = snap ?? snapshotNow();
      setUndoStack((prev) => [...prev.slice(-24), entry]);
    },
    [snapshotNow]
  );

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRacks(last.racks);
      setObstacles(last.obstacles);
      setDepotX(last.depotX);
      setDepotY(last.depotY);
      setFloorWidthM(last.floorWidthM);
      setFloorDepthM(last.floorDepthM);
      return prev.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'Delete' && selectedKeys.length > 0) {
        pushUndo();
        const delSet = new Set(selectedKeys);
        setRacks((prev) => prev.filter((r) => !delSet.has(r.key)));
        setSelectedKeys([]);
      } else if (e.key === 'Escape') {
        setCtxMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleUndo, pushUndo, selectedKeys]);

  const totalBins = useMemo(
    () => racks.reduce((acc, r) => acc + r.levels, 0),
    [racks]
  );

  const primarySelectedRack = useMemo(
    () =>
      selectedKeys.length > 0
        ? racks.find((r) => r.key === selectedKeys[0]) ?? null
        : null,
    [racks, selectedKeys]
  );

  const isEveryday = persona === 'everyday';
  const basePxPerM = 40 * zoom;
  const minWorldX = -1.5;
  const minWorldY = -1.5;
  const maxWorldX = Math.max(
    floorWidthM - 1.5,
    ...racks.map((r) => r.xMeters + 2),
    depotX + 2
  );
  const maxWorldY = Math.max(
    floorDepthM - 1.5,
    ...racks.map((r) => r.yMeters + 2),
    depotY + 2
  );
  const svgW = Math.max(480, Math.round((maxWorldX - minWorldX) * basePxPerM));
  const svgH = Math.max(360, Math.round((maxWorldY - minWorldY) * basePxPerM));

  const toScreenX = (wx: number) => (wx - minWorldX) * basePxPerM;
  const toScreenY = (wy: number) => (maxWorldY - wy) * basePxPerM;

  const snapCoord = useCallback(
    (v: number) => {
      if (snapStepM <= 0.05) return Number(v.toFixed(2));
      return Number((Math.round(v / snapStepM) * snapStepM).toFixed(2));
    },
    [snapStepM]
  );

  const clientToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { wx: 0, wy: 2 };
      const rect = svg.getBoundingClientRect();
      const sx = ((clientX - rect.left) / Math.max(1, rect.width)) * svgW;
      const sy = ((clientY - rect.top) / Math.max(1, rect.height)) * svgH;
      const wx = minWorldX + sx / basePxPerM;
      const wy = maxWorldY - sy / basePxPerM;
      return { wx: snapCoord(wx), wy: snapCoord(wy) };
    },
    [svgW, svgH, basePxPerM, maxWorldY, snapCoord]
  );

  useEffect(() => {
    if (!open) return;

    const onWinMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const { wx, wy } = clientToWorld(e.clientX, e.clientY);

      if (drag.type === 'marquee') {
        drag.currX = wx;
        drag.currY = wy;
        setMarqueeRect({
          x1: Math.min(drag.startX, wx),
          y1: Math.min(drag.startY, wy),
          x2: Math.max(drag.startX, wx),
          y2: Math.max(drag.startY, wy),
        });
        return;
      }

      if (!drag.committedUndo) {
        pushUndo();
        drag.committedUndo = true;
      }

      if (drag.type === 'rack_group') {
        const dx = snapCoord(wx - drag.startWorldX);
        const dy = snapCoord(wy - drag.startWorldY);
        setRacks((prev) =>
          prev.map((r) => {
            const initPos = drag.initialPositions.get(r.key);
            if (!initPos) return r;
            const nx = Math.max(-0.5, Math.min(42, snapCoord(initPos.xMeters + dx)));
            const ny = Math.max(-0.5, Math.min(38, snapCoord(initPos.yMeters + dy)));
            return {
              ...r,
              xMeters: nx,
              yMeters: ny,
              aisle: Math.max(1, Math.round(nx / Math.max(1, aisleSpacingM)) + 1),
              bay: Math.max(1, Math.round((ny - 1.8) / Math.max(0.8, baySpacingM)) + 1),
            };
          })
        );
      } else if (drag.type === 'obstacle') {
        const nx = Math.max(-0.5, Math.min(42, snapCoord(wx - drag.offsetX)));
        const ny = Math.max(-0.5, Math.min(38, snapCoord(wy - drag.offsetY)));
        setObstacles((prev) =>
          prev.map((o) =>
            o.id === drag.id ? { ...o, xMeters: nx, yMeters: ny } : o
          )
        );
      } else if (drag.type === 'depot') {
        const nx = Math.max(-0.5, Math.min(42, snapCoord(wx - drag.offsetX)));
        const ny = Math.max(-1.0, Math.min(38, snapCoord(wy - drag.offsetY)));
        setDepotX(nx);
        setDepotY(ny);
      } else if (drag.type === 'resize_floor') {
        if (drag.axis === 'x' || drag.axis === 'xy') {
          setFloorWidthM(Math.max(6, Math.min(40, snapCoord(wx + 1.0))));
        }
        if (drag.axis === 'y' || drag.axis === 'xy') {
          // Bottom edge in world coords is y = -1.0, top is y = -1.0 + floorDepthM
          // Let dragging top/bottom edge resize depth cleanly:
          const nextD = Math.max(6, Math.min(35, snapCoord(wy + 1.0)));
          setFloorDepthM(nextD);
        }
      }
    };

    const onWinUp = () => {
      const drag = dragRef.current;
      if (drag && drag.type === 'marquee') {
        const x1 = Math.min(drag.startX, drag.currX);
        const y1 = Math.min(drag.startY, drag.currY);
        const x2 = Math.max(drag.startX, drag.currX);
        const y2 = Math.max(drag.startY, drag.currY);
        if (x2 - x1 > 0.25 || y2 - y1 > 0.25) {
          const hits = racks
            .filter(
              (r) =>
                r.xMeters >= x1 &&
                r.xMeters <= x2 &&
                r.yMeters >= y1 &&
                r.yMeters <= y2
            )
            .map((r) => r.key);
          setSelectedKeys(hits);
        }
        setMarqueeRect(null);
      }
      dragRef.current = null;
    };

    window.addEventListener('pointermove', onWinMove);
    window.addEventListener('pointerup', onWinUp);
    return () => {
      window.removeEventListener('pointermove', onWinMove);
      window.removeEventListener('pointerup', onWinUp);
    };
  }, [open, clientToWorld, pushUndo, snapCoord, aisleSpacingM, baySpacingM, racks]);

  if (!open) return null;

  const addRackAt = (wx: number, wy: number, rackLevels: number) => {
    pushUndo();
    const nextIdx = racks.length + 1;
    const aisleEst = Math.max(1, Math.round(wx / Math.max(1, aisleSpacingM)) + 1);
    const bayEst = Math.max(1, Math.round((wy - 1.8) / Math.max(0.8, baySpacingM)) + 1);
    const newNode: CanvasRackNode = {
      key: `R-${Date.now()}-${nextIdx}`,
      aisle: aisleEst,
      bay: bayEst,
      xMeters: wx,
      yMeters: wy,
      levels: Math.max(1, Math.min(6, rackLevels)),
      binLengthCm,
      binWidthCm,
      binHeightCm,
    };
    setRacks((prev) => [...prev, newNode]);
    setSelectedKeys([newNode.key]);
  };

  const addObstacleAt = (wx: number, wy: number) => {
    pushUndo();
    setObstacles((prev) => [
      ...prev,
      {
        id: `OBS-${Date.now()}`,
        aisle: Math.max(1, Math.round(wx / Math.max(1, aisleSpacingM)) + 1),
        bay: Math.max(1, Math.round((wy - 1.8) / Math.max(0.8, baySpacingM)) + 1),
        xMeters: wx,
        yMeters: wy,
        label: isEveryday ? 'WALL' : 'PILLAR',
      },
    ]);
  };

  const scaleAllRacksBy = (factor: number) => {
    pushUndo();
    setBinLengthCm((v) => Math.max(45, Math.min(200, Math.round(v * factor))));
    setBinWidthCm((v) => Math.max(35, Math.min(160, Math.round(v * factor))));
    setBinHeightCm((v) => Math.max(30, Math.min(120, Math.round(v * factor))));
    setRacks((prev) =>
      prev.map((r) => ({
        ...r,
        binLengthCm: Math.max(45, Math.min(200, Math.round(r.binLengthCm * factor))),
        binWidthCm: Math.max(35, Math.min(160, Math.round(r.binWidthCm * factor))),
        binHeightCm: Math.max(30, Math.min(120, Math.round(r.binHeightCm * factor))),
      }))
    );
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setCtxMenu(null);
    if (
      e.target !== svgRef.current &&
      (e.target as Element).getAttribute('data-floor') !== 'true'
    ) {
      return;
    }
    const { wx, wy } = clientToWorld(e.clientX, e.clientY);
    if (tool === 'add_rack') {
      addRackAt(wx, wy, levels);
    } else if (tool === 'add_low') {
      addRackAt(wx, wy, Math.min(2, levels));
    } else if (tool === 'add_obstacle') {
      addObstacleAt(wx, wy);
    } else if (tool === 'move_depot') {
      pushUndo();
      setDepotX(wx);
      setDepotY(wy);
    } else {
      if (!e.shiftKey) setSelectedKeys([]);
      dragRef.current = {
        type: 'marquee',
        startX: wx,
        startY: wy,
        currX: wx,
        currY: wy,
      };
    }
  };

  const regenerateGrid = (
    pattern: 'full' | 'cross_aisle' | 'u_shape' | 'mezzanine'
  ) => {
    pushUndo();
    const nextRacks: CanvasRackNode[] = [];
    const midBay = Math.ceil(baysPerAisle / 2);
    const midAisle = Math.ceil(aisles / 2);
    let idx = 1;
    for (let a = 1; a <= aisles; a++) {
      for (let b = 1; b <= baysPerAisle; b++) {
        let lvls = levels;
        if (pattern === 'cross_aisle' && b === midBay) lvls = 0;
        if (pattern === 'u_shape' && a === midAisle && b <= 2) lvls = 0;
        if (pattern === 'mezzanine' && b <= Math.floor(baysPerAisle / 2)) {
          lvls = Math.min(2, levels);
        }
        if (lvls === 0) continue;
        nextRacks.push({
          key: `R-${idx++}`,
          aisle: a,
          bay: b,
          xMeters: Number(((a - 1) * aisleSpacingM).toFixed(2)),
          yMeters: Number(((b - 1) * baySpacingM + 1.8).toFixed(2)),
          levels: lvls,
          binLengthCm,
          binWidthCm,
          binHeightCm,
        });
      }
    }
    setRacks(nextRacks);
    setObstacles([]);
    setSelectedKeys([]);
  };

  const buildCustomBins = (): BinSpec[] => {
    const result: BinSpec[] = [];
    const usedIds = new Set<string>();
    racks.forEach((r, idx) => {
      const shelfPitchM =
        r.binHeightCm === 70 ? 0.8 : Math.max(0.45, r.binHeightCm / 100 + 0.14);
      for (let l = 1; l <= r.levels; l++) {
        let id = `A${r.aisle}-B${r.bay}-Z${l}`;
        if (usedIds.has(id)) {
          id = `C${idx + 1}-A${r.aisle}-B${r.bay}-Z${l}`;
        }
        usedIds.add(id);
        const zMeters =
          r.binHeightCm === 70 && l <= LEVEL_HEIGHTS_M.length
            ? LEVEL_HEIGHTS_M[l - 1]
            : Number((0.05 + (l - 1) * shelfPitchM).toFixed(2));
        result.push({
          id,
          aisle: r.aisle,
          bay: r.bay,
          level: l,
          xMeters: r.xMeters,
          yMeters: r.yMeters,
          zMeters,
          binLengthCm: r.binLengthCm,
          binWidthCm: r.binWidthCm,
          binHeightCm: r.binHeightCm,
          maxWeightKg: LEVEL_MAX_WEIGHTS_KG[l - 1] ?? 200,
          isGoldenZone:
            zMeters >= config.goldenZoneMinM && zMeters <= config.goldenZoneMaxM,
        });
      }
    });
    return result;
  };

  const handleApply = () => {
    const customBins = buildCustomBins();
    const maxLvl = customBins.reduce((m, b) => Math.max(m, b.level), levels);
    onApplyMapEdits({
      configPatch: {
        aisles,
        baysPerAisle,
        levels: maxLvl,
        aisleSpacingM,
        baySpacingM,
        binLengthCm,
        binWidthCm,
        binHeightCm,
        floorWidthM,
        floorDepthM,
        depotXMeters: depotX,
        depotYMeters: depotY,
        obstacles,
        disabledBinIds: [],
      },
      customBins,
    });
    onClose();
  };

  const handleSaveAsNewMap = () => {
    const customBins = buildCustomBins();
    const configPatch: Partial<WarehouseConfig> = {
      aisles,
      baysPerAisle,
      levels,
      aisleSpacingM,
      baySpacingM,
      binLengthCm,
      binWidthCm,
      binHeightCm,
      floorWidthM,
      floorDepthM,
      depotXMeters: depotX,
      depotYMeters: depotY,
      obstacles,
      disabledBinIds: [],
      mapTag: `${floorWidthM.toFixed(0)}×${floorDepthM.toFixed(0)}m · ${customBins.length} Bins`,
    };
    const customMap: WarehouseScenario = {
      id: `${isEveryday ? 'everyday-' : ''}custom-${Date.now()}`,
      name:
        mapName.trim() ||
        (isEveryday ? 'My Room Shelf Map' : 'Custom Warehouse Map'),
      description: `Free-Canvas ${floorWidthM}×${floorDepthM}m (${customBins.length} bins, ${obstacles.length} obstacles).`,
      config: { ...config, ...configPatch },
      skus: scenario.skus,
      customBins,
    };
    onSaveCustomScenario(customMap);
    onApplyMapEdits({ configPatch, customBins });
    onClose();
  };

  const handleExportJson = () => {
    const payload = JSON.stringify(
      {
        name: mapName,
        persona,
        floorWidthM,
        floorDepthM,
        depotX,
        depotY,
        racks,
        obstacles,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mapName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.canvas.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          name?: string;
          persona?: EditorPersona;
          floorWidthM?: number;
          floorDepthM?: number;
          depotX?: number;
          depotY?: number;
          racks?: CanvasRackNode[];
          obstacles?: WarehouseObstacle[];
        };
        pushUndo();
        if (parsed.name) setMapName(parsed.name);
        if (parsed.persona) setPersona(parsed.persona);
        if (parsed.floorWidthM) setFloorWidthM(parsed.floorWidthM);
        if (parsed.floorDepthM) setFloorDepthM(parsed.floorDepthM);
        if (parsed.depotX !== undefined) setDepotX(parsed.depotX);
        if (parsed.depotY !== undefined) setDepotY(parsed.depotY);
        if (Array.isArray(parsed.racks)) setRacks(parsed.racks);
        if (Array.isArray(parsed.obstacles)) setObstacles(parsed.obstacles);
      } catch {
        // ignore invalid JSON
      }
    };
    reader.readAsText(file);
  };

  const ctxRack = ctxMenu?.rackKey
    ? racks.find((r) => r.key === ctxMenu.rackKey) ?? null
    : null;
  const ctxObstacle = ctxMenu?.obstacleId
    ? obstacles.find((o) => o.id === ctxMenu.obstacleId) ?? null
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text)] shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--t-border)] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <MapIcon className="h-4 w-4 text-[var(--t-accent)]" />
            <div>
              <h3 className="text-sm font-bold">
                Free-Canvas 2D Space & Map Editor (Pro & Everyday)
              </h3>
              <p className="text-[11px] text-[var(--t-muted)]">
                Drag racks/obstacles/depot anywhere · Drag floor handles to
                resize space · Marquee drag to move groups · Right-click to edit
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex overflow-hidden rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)]">
              <button
                type="button"
                onClick={() => setPersona('professional')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium ${
                  persona === 'professional'
                    ? 'bg-[var(--t-accent)] font-semibold text-[var(--t-accent-text)]'
                    : 'text-[var(--t-muted)]'
                }`}
              >
                <Briefcase className="h-3 w-3" />
                Pro
              </button>
              <button
                type="button"
                onClick={() => setPersona('everyday')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium ${
                  persona === 'everyday'
                    ? 'bg-[var(--t-accent)] font-semibold text-[var(--t-accent-text)]'
                    : 'text-[var(--t-muted)]'
                }`}
              >
                <Home className="h-3 w-3" />
                Everyday
              </button>
            </div>

            <button
              type="button"
              disabled={undoStack.length === 0}
              onClick={handleUndo}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2.5 py-1.5 disabled:opacity-40"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2.5 py-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              .JSON
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2.5 py-1.5">
              <Upload className="h-3.5 w-3.5" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--t-muted)] hover:bg-[var(--t-surface-alt)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden p-4 lg:grid-cols-12">
          {/* Left Space Size & Selected Rack Controls */}
          <div className="space-y-3 overflow-y-auto pr-1 text-xs lg:col-span-4">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--t-muted)]">
                Map Name
              </label>
              <input
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                className="w-full rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-2.5 py-1.5 text-xs"
              />
            </div>

            {/* Easy Whole-Space Size Controls */}
            <div className="space-y-2.5 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface-alt)] p-3 text-[11px]">
              <div className="flex items-center justify-between font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5 text-[var(--t-accent)]" />
                  Easy Space Size Controls
                </span>
                <span className="text-[10px] text-[var(--t-accent)]">
                  {floorWidthM}m × {floorDepthM}m
                </span>
              </div>

              {/* 1-Click Floor Size Presets */}
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                {FLOOR_SIZE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      pushUndo();
                      setFloorWidthM(p.w);
                      setFloorDepthM(p.d);
                    }}
                    className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 hover:border-[var(--t-accent)]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Sliders for Width & Depth */}
              <div>
                <div className="flex justify-between text-[10px] text-[var(--t-muted)]">
                  <span>Floor Width</span>
                  <span>{floorWidthM} m</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={40}
                  step={0.5}
                  value={floorWidthM}
                  onChange={(e) => setFloorWidthM(Number(e.target.value))}
                  className="w-full accent-[var(--t-accent)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-[var(--t-muted)]">
                  <span>Floor Depth</span>
                  <span>{floorDepthM} m</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={35}
                  step={0.5}
                  value={floorDepthM}
                  onChange={(e) => setFloorDepthM(Number(e.target.value))}
                  className="w-full accent-[var(--t-accent)]"
                />
              </div>

              {/* Quick Scale All Racks */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5 text-[10px]">
                <span className="text-[var(--t-muted)]">Scale All Shelves:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => scaleAllRacksBy(0.9)}
                    className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-0.5 hover:border-[var(--t-accent)]"
                  >
                    -10%
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleAllRacksBy(1.1)}
                    className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-0.5 hover:border-[var(--t-accent)]"
                  >
                    +10%
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-[var(--t-muted)]">Aisles</span>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={aisles}
                    onChange={(e) =>
                      setAisles(Math.round(safeNum(e.target.value, aisles, 1, 8)))
                    }
                    className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[var(--t-muted)]">Bays</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={baysPerAisle}
                    onChange={(e) =>
                      setBaysPerAisle(
                        Math.round(safeNum(e.target.value, baysPerAisle, 1, 10))
                      )
                    }
                    className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[var(--t-muted)]">Max Z</span>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={levels}
                    onChange={(e) => {
                      const nextL = Math.round(
                        safeNum(e.target.value, levels, 1, 6)
                      );
                      setLevels(nextL);
                      setRacks((prev) => prev.map((r) => ({ ...r, levels: nextL })));
                    }}
                    className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-[var(--t-muted)]">
                    Bin L (cm)
                  </span>
                  <input
                    type="number"
                    min={45}
                    max={200}
                    value={binLengthCm}
                    onChange={(e) => {
                      const val = Math.round(
                        safeNum(e.target.value, binLengthCm, 45, 200)
                      );
                      setBinLengthCm(val);
                      setRacks((prev) => prev.map((r) => ({ ...r, binLengthCm: val })));
                    }}
                    className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[var(--t-muted)]">
                    Bin W (cm)
                  </span>
                  <input
                    type="number"
                    min={35}
                    max={160}
                    value={binWidthCm}
                    onChange={(e) => {
                      const val = Math.round(
                        safeNum(e.target.value, binWidthCm, 35, 160)
                      );
                      setBinWidthCm(val);
                      setRacks((prev) => prev.map((r) => ({ ...r, binWidthCm: val })));
                    }}
                    className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[var(--t-muted)]">
                    Bin H (cm)
                  </span>
                  <input
                    type="number"
                    min={30}
                    max={120}
                    value={binHeightCm}
                    onChange={(e) => {
                      const val = Math.round(
                        safeNum(e.target.value, binHeightCm, 30, 120)
                      );
                      setBinHeightCm(val);
                      setRacks((prev) => prev.map((r) => ({ ...r, binHeightCm: val })));
                    }}
                    className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {SHELF_PRESETS[persona].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      pushUndo();
                      setBinLengthCm(p.l);
                      setBinWidthCm(p.w);
                      setBinHeightCm(p.h);
                      setAisleSpacingM(p.sA);
                      setBaySpacingM(p.sB);
                      setRacks((prev) =>
                        prev.map((r) => ({
                          ...r,
                          binLengthCm: p.l,
                          binWidthCm: p.w,
                          binHeightCm: p.h,
                        }))
                      );
                    }}
                    className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-2 py-1 text-[10px] text-[var(--t-muted)] hover:border-[var(--t-accent)]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => regenerateGrid('full')}
                  className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] py-1.5 font-medium hover:border-[var(--t-accent)]"
                >
                  Rebuild Full Grid
                </button>
                <button
                  type="button"
                  onClick={() => regenerateGrid('cross_aisle')}
                  className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] py-1.5 font-medium hover:border-[var(--t-accent)]"
                >
                  Cross-Aisle Grid
                </button>
                <button
                  type="button"
                  onClick={() => regenerateGrid('u_shape')}
                  className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] py-1.5 font-medium hover:border-[var(--t-accent)]"
                >
                  U-Shape Floor
                </button>
                <button
                  type="button"
                  onClick={() => regenerateGrid('mezzanine')}
                  className="rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] py-1.5 font-medium hover:border-[var(--t-accent)]"
                >
                  Mezzanine Step
                </button>
              </div>
            </div>

            {/* Selected Rack(s) Batch or Single Editor */}
            {selectedKeys.length > 1 ? (
              <div className="space-y-2 rounded-xl border border-[var(--t-accent)] bg-[var(--t-surface-alt)] p-3 text-[11px]">
                <div className="flex items-center justify-between font-semibold text-[var(--t-accent)]">
                  <span>{selectedKeys.length} Racks Selected (Drag Group)</span>
                  <button
                    type="button"
                    onClick={() => {
                      pushUndo();
                      const delSet = new Set(selectedKeys);
                      setRacks((prev) => prev.filter((r) => !delSet.has(r.key)));
                      setSelectedKeys([]);
                    }}
                    className="text-rose-400 hover:underline"
                  >
                    Delete All
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => {
                        pushUndo();
                        const selSet = new Set(selectedKeys);
                        setRacks((prev) =>
                          prev.map((r) =>
                            selSet.has(r.key) ? { ...r, levels: lv } : r
                          )
                        );
                      }}
                      className="rounded border border-[var(--t-border)] bg-[var(--t-surface)] py-1 text-[10px] hover:border-[var(--t-accent)]"
                    >
                      Z{lv}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              primarySelectedRack && (
                <div className="space-y-2 rounded-xl border border-[var(--t-accent)] bg-[var(--t-surface-alt)] p-3 text-[11px]">
                  <div className="flex items-center justify-between font-semibold text-[var(--t-accent)]">
                    <span>
                      Selected Rack (A{primarySelectedRack.aisle}-B
                      {primarySelectedRack.bay})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        pushUndo();
                        setRacks((prev) =>
                          prev.filter((r) => r.key !== primarySelectedRack.key)
                        );
                        setSelectedKeys([]);
                      }}
                      className="text-rose-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <span className="text-[10px] text-[var(--t-muted)]">
                        X (m)
                      </span>
                      <input
                        type="number"
                        step={0.25}
                        value={primarySelectedRack.xMeters}
                        onChange={(e) => {
                          const val = safeNum(
                            e.target.value,
                            primarySelectedRack.xMeters,
                            -4,
                            45
                          );
                          setRacks((prev) =>
                            prev.map((r) =>
                              r.key === primarySelectedRack.key
                                ? { ...r, xMeters: val }
                                : r
                            )
                          );
                        }}
                        className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-1.5 py-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--t-muted)]">
                        Y (m)
                      </span>
                      <input
                        type="number"
                        step={0.25}
                        value={primarySelectedRack.yMeters}
                        onChange={(e) => {
                          const val = safeNum(
                            e.target.value,
                            primarySelectedRack.yMeters,
                            -4,
                            45
                          );
                          setRacks((prev) =>
                            prev.map((r) =>
                              r.key === primarySelectedRack.key
                                ? { ...r, yMeters: val }
                                : r
                            )
                          );
                        }}
                        className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-1.5 py-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--t-muted)]">
                        Levels
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={primarySelectedRack.levels}
                        onChange={(e) => {
                          const val = Math.round(
                            safeNum(
                              e.target.value,
                              primarySelectedRack.levels,
                              1,
                              6
                            )
                          );
                          setRacks((prev) =>
                            prev.map((r) =>
                              r.key === primarySelectedRack.key
                                ? { ...r, levels: val }
                                : r
                            )
                          );
                        }}
                        className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-1.5 py-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <span className="text-[10px] text-[var(--t-muted)]">
                        L (cm)
                      </span>
                      <input
                        type="number"
                        min={40}
                        max={220}
                        value={primarySelectedRack.binLengthCm}
                        onChange={(e) => {
                          const val = Math.round(
                            safeNum(
                              e.target.value,
                              primarySelectedRack.binLengthCm,
                              40,
                              220
                            )
                          );
                          setRacks((prev) =>
                            prev.map((r) =>
                              r.key === primarySelectedRack.key
                                ? { ...r, binLengthCm: val }
                                : r
                            )
                          );
                        }}
                        className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-1.5 py-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--t-muted)]">
                        W (cm)
                      </span>
                      <input
                        type="number"
                        min={35}
                        max={180}
                        value={primarySelectedRack.binWidthCm}
                        onChange={(e) => {
                          const val = Math.round(
                            safeNum(
                              e.target.value,
                              primarySelectedRack.binWidthCm,
                              35,
                              180
                            )
                          );
                          setRacks((prev) =>
                            prev.map((r) =>
                              r.key === primarySelectedRack.key
                                ? { ...r, binWidthCm: val }
                                : r
                            )
                          );
                        }}
                        className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-1.5 py-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--t-muted)]">
                        H (cm)
                      </span>
                      <input
                        type="number"
                        min={30}
                        max={140}
                        value={primarySelectedRack.binHeightCm}
                        onChange={(e) => {
                          const val = Math.round(
                            safeNum(
                              e.target.value,
                              primarySelectedRack.binHeightCm,
                              30,
                              140
                            )
                          );
                          setRacks((prev) =>
                            prev.map((r) =>
                              r.key === primarySelectedRack.key
                                ? { ...r, binHeightCm: val }
                                : r
                            )
                          );
                        }}
                        className="w-full rounded border border-[var(--t-border)] bg-[var(--t-surface)] px-1.5 py-1"
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Right Free-Form 2D Vector Canvas */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--t-border)] bg-[var(--t-surface-alt)] lg:col-span-8">
            {/* Canvas Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--t-border)] bg-[var(--t-surface)] px-3 py-2 text-[11px]">
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    ['select', 'Drag / Select', MousePointer2],
                    ['add_rack', `+Rack (Z${levels})`, PlusSquare],
                    ['add_low', '+Low Shelf', PlusSquare],
                    ['add_obstacle', '+Pillar / Wall', Ban],
                    ['move_depot', 'Move Depot', Navigation],
                    ['erase', 'Erase', Eraser],
                  ] as const
                ).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTool(id)}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${
                      tool === id
                        ? 'border-[var(--t-accent)] bg-[var(--t-surface-alt)] font-semibold text-[var(--t-accent)]'
                        : 'border-[var(--t-border)] text-[var(--t-muted)]'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={snapStepM}
                  onChange={(e) => setSnapStepM(Number(e.target.value))}
                  className="rounded border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-1.5 py-1 text-[10px]"
                  title="Grid snap precision"
                >
                  <option value={0.5}>Snap 0.5m</option>
                  <option value={0.25}>Snap 0.25m</option>
                  <option value={0.05}>Free (0.05m)</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))
                  }
                  className="rounded border border-[var(--t-border)] p-1 text-[var(--t-muted)]"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center text-[10px]">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.min(2, Number((z + 0.15).toFixed(2))))
                  }
                  className="rounded border border-[var(--t-border)] p-1 text-[var(--t-muted)]"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="rounded border border-[var(--t-border)] p-1 text-[var(--t-muted)]"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive SVG Floor Canvas */}
            <div className="relative flex-1 overflow-auto bg-[#06101f] p-3">
              <svg
                ref={svgRef}
                width={svgW}
                height={svgH}
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="mx-auto block cursor-crosshair rounded-lg border border-sky-500/30 select-none touch-none"
                style={{ background: '#071326' }}
                onPointerDown={handleCanvasPointerDown}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const { wx, wy } = clientToWorld(e.clientX, e.clientY);
                  setCtxMenu({
                    clientX: e.clientX,
                    clientY: e.clientY,
                    worldX: wx,
                    worldY: wy,
                    rackKey: null,
                    obstacleId: null,
                  });
                }}
              >
                <defs>
                  <pattern
                    id="editorGrid"
                    width={basePxPerM}
                    height={basePxPerM}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${basePxPerM} 0 L 0 0 0 ${basePxPerM}`}
                      fill="none"
                      stroke="#132a4f"
                      strokeWidth="0.8"
                    />
                  </pattern>
                </defs>

                <rect
                  data-floor="true"
                  width={svgW}
                  height={svgH}
                  fill="url(#editorGrid)"
                />

                {/* Configured Floor Space Boundary + Draggable Resize Handles */}
                <rect
                  data-floor="true"
                  x={toScreenX(-1.0)}
                  y={toScreenY(-1.0 + floorDepthM)}
                  width={floorWidthM * basePxPerM}
                  height={floorDepthM * basePxPerM}
                  fill="rgba(14, 165, 233, 0.05)"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="6,4"
                />
                <text
                  x={toScreenX(-1.0) + 8}
                  y={toScreenY(-1.0 + floorDepthM) + 16}
                  fill="#7dd3fc"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  SPACE: {floorWidthM}m × {floorDepthM}m · {racks.length} stacks (
                  {totalBins} bins) · Drag edges to resize
                </text>

                {/* Right Edge Width Resize Handle */}
                <g
                  className="cursor-ew-resize"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    dragRef.current = {
                      type: 'resize_floor',
                      axis: 'x',
                      committedUndo: false,
                    };
                  }}
                >
                  <rect
                    x={toScreenX(-1.0 + floorWidthM) - 5}
                    y={toScreenY(-1.0 + floorDepthM / 2) - 18}
                    width={10}
                    height={36}
                    rx={4}
                    fill="#38bdf8"
                  />
                </g>

                {/* Top Edge Depth Resize Handle */}
                <g
                  className="cursor-ns-resize"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    dragRef.current = {
                      type: 'resize_floor',
                      axis: 'y',
                      committedUndo: false,
                    };
                  }}
                >
                  <rect
                    x={toScreenX(-1.0 + floorWidthM / 2) - 18}
                    y={toScreenY(-1.0 + floorDepthM) - 5}
                    width={36}
                    height={10}
                    rx={4}
                    fill="#38bdf8"
                  />
                </g>

                {/* Corner Diagonal Resize Handle */}
                <g
                  className="cursor-nesw-resize"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    dragRef.current = {
                      type: 'resize_floor',
                      axis: 'xy',
                      committedUndo: false,
                    };
                  }}
                >
                  <circle
                    cx={toScreenX(-1.0 + floorWidthM)}
                    cy={toScreenY(-1.0 + floorDepthM)}
                    r={7}
                    fill="#facc15"
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                </g>

                {/* I/O Depot / Entry (Draggable) */}
                <g
                  className="cursor-move"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (e.button !== 0) return;
                    const { wx, wy } = clientToWorld(e.clientX, e.clientY);
                    dragRef.current = {
                      type: 'depot',
                      offsetX: wx - depotX,
                      offsetY: wy - depotY,
                      committedUndo: false,
                    };
                  }}
                >
                  <rect
                    x={toScreenX(depotX - 1.35)}
                    y={toScreenY(depotY + 0.5)}
                    width={2.7 * basePxPerM}
                    height={1.0 * basePxPerM}
                    rx={6}
                    fill="rgba(2, 132, 199, 0.38)"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  <text
                    x={toScreenX(depotX)}
                    y={toScreenY(depotY) + 4}
                    textAnchor="middle"
                    fill="#e0f2fe"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {isEveryday ? '★ ENTRY' : '★ I/O DEPOT'}
                  </text>
                </g>

                {/* Obstacles / Pillars */}
                {obstacles.map((obs) => (
                  <g
                    key={obs.id}
                    className="cursor-move"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (e.button !== 0) return;
                      if (tool === 'erase') {
                        pushUndo();
                        setObstacles((prev) => prev.filter((o) => o.id !== obs.id));
                        return;
                      }
                      const { wx, wy } = clientToWorld(e.clientX, e.clientY);
                      dragRef.current = {
                        type: 'obstacle',
                        id: obs.id,
                        offsetX: wx - obs.xMeters,
                        offsetY: wy - obs.yMeters,
                        committedUndo: false,
                      };
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const { wx, wy } = clientToWorld(e.clientX, e.clientY);
                      setCtxMenu({
                        clientX: e.clientX,
                        clientY: e.clientY,
                        worldX: wx,
                        worldY: wy,
                        rackKey: null,
                        obstacleId: obs.id,
                      });
                    }}
                  >
                    <rect
                      x={toScreenX(obs.xMeters - 0.4)}
                      y={toScreenY(obs.yMeters + 0.4)}
                      width={0.8 * basePxPerM}
                      height={0.8 * basePxPerM}
                      rx={3}
                      fill="rgba(234, 179, 8, 0.35)"
                      stroke="#facc15"
                      strokeWidth="1.8"
                    />
                    <text
                      x={toScreenX(obs.xMeters)}
                      y={toScreenY(obs.yMeters) + 3}
                      textAnchor="middle"
                      fill="#fef08a"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {obs.label}
                    </text>
                  </g>
                ))}

                {/* Rack Nodes (Single or Multi-Group Drag & Drop) */}
                {racks.map((rack) => {
                  const wM = rack.binWidthCm / 100;
                  const lM = rack.binLengthCm / 100;
                  const isSel = selectedKeys.includes(rack.key);
                  const rx = toScreenX(rack.xMeters - wM / 2);
                  const ry = toScreenY(rack.yMeters + lM / 2);
                  const rw = wM * basePxPerM;
                  const rh = lM * basePxPerM;
                  return (
                    <g
                      key={rack.key}
                      className="cursor-move"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        if (e.button !== 0) return;
                        setCtxMenu(null);
                        if (tool === 'erase') {
                          pushUndo();
                          setRacks((prev) =>
                            prev.filter((r) => r.key !== rack.key)
                          );
                          setSelectedKeys((prev) =>
                            prev.filter((k) => k !== rack.key)
                          );
                          return;
                        }
                        let activeSelection = selectedKeys;
                        if (e.shiftKey) {
                          activeSelection = isSel
                            ? selectedKeys.filter((k) => k !== rack.key)
                            : [...selectedKeys, rack.key];
                          setSelectedKeys(activeSelection);
                        } else if (!isSel) {
                          activeSelection = [rack.key];
                          setSelectedKeys(activeSelection);
                        }

                        const { wx, wy } = clientToWorld(e.clientX, e.clientY);
                        const initialPositions = new Map<
                          string,
                          { xMeters: number; yMeters: number }
                        >();
                        for (const r of racks) {
                          if (activeSelection.includes(r.key)) {
                            initialPositions.set(r.key, {
                              xMeters: r.xMeters,
                              yMeters: r.yMeters,
                            });
                          }
                        }
                        dragRef.current = {
                          type: 'rack_group',
                          leadKey: rack.key,
                          startWorldX: wx,
                          startWorldY: wy,
                          initialPositions,
                          committedUndo: false,
                        };
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!selectedKeys.includes(rack.key)) {
                          setSelectedKeys([rack.key]);
                        }
                        const { wx, wy } = clientToWorld(e.clientX, e.clientY);
                        setCtxMenu({
                          clientX: e.clientX,
                          clientY: e.clientY,
                          worldX: wx,
                          worldY: wy,
                          rackKey: rack.key,
                          obstacleId: null,
                        });
                      }}
                    >
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        rx={4}
                        fill={
                          rack.levels <= 2
                            ? 'rgba(16, 185, 129, 0.25)'
                            : 'rgba(34, 211, 238, 0.22)'
                        }
                        stroke={
                          isSel
                            ? '#facc15'
                            : rack.levels <= 2
                              ? '#34d399'
                              : '#22d3ee'
                        }
                        strokeWidth={isSel ? 2.4 : 1.4}
                      />
                      <text
                        x={rx + rw / 2}
                        y={ry + rh / 2 - 2}
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        Z1–{rack.levels}
                      </text>
                      <text
                        x={rx + rw / 2}
                        y={ry + rh / 2 + 10}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8"
                      >
                        {rack.binLengthCm}×{rack.binWidthCm}
                      </text>
                    </g>
                  );
                })}

                {/* Marquee Selection Box */}
                {marqueeRect && (
                  <rect
                    x={toScreenX(marqueeRect.x1)}
                    y={toScreenY(marqueeRect.y2)}
                    width={(marqueeRect.x2 - marqueeRect.x1) * basePxPerM}
                    height={(marqueeRect.y2 - marqueeRect.y1) * basePxPerM}
                    fill="rgba(56, 189, 248, 0.14)"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="4,3"
                  />
                )}
              </svg>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--t-border)] bg-[var(--t-surface)] px-3 py-2.5 text-xs">
              <span className="text-[11px] text-[var(--t-muted)]">
                Drag racks/depot/edges freely · Drag empty floor to multi-select
                group · Right-click anywhere to edit
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsNewMap}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface-alt)] px-3 py-1.5 font-semibold hover:border-[var(--t-accent)]"
                >
                  <Save className="h-3.5 w-3.5 text-emerald-400" />
                  Save as New Map Card
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 font-semibold"
                  style={{
                    backgroundColor: 'var(--t-accent)',
                    color: 'var(--t-accent-text)',
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                  Apply Canvas to 3D Twin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right-Click Context Menu Inside Map Editor Canvas */}
      {ctxMenu && (
        <div
          style={{
            left: `${Math.min(ctxMenu.clientX, window.innerWidth - 245)}px`,
            top: `${Math.min(ctxMenu.clientY, window.innerHeight - 310)}px`,
          }}
          className="fixed z-[60] w-56 rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-1.5 text-xs text-[var(--t-text)] shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {ctxRack ? (
            <>
              <div className="border-b border-[var(--t-border)] px-2 py-1 text-[11px] font-bold">
                Rack @ ({ctxRack.xMeters}m, {ctxRack.yMeters}m)
              </div>
              <div className="px-2 py-1.5">
                <div className="mb-1 text-[10px] text-[var(--t-muted)]">
                  Set Z-Levels:
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => {
                        pushUndo();
                        setRacks((prev) =>
                          prev.map((r) =>
                            r.key === ctxRack.key ? { ...r, levels: lv } : r
                          )
                        );
                        setCtxMenu(null);
                      }}
                      className={`rounded border py-0.5 text-[10px] font-semibold ${
                        ctxRack.levels === lv
                          ? 'border-[var(--t-accent)] bg-[var(--t-accent)] text-[var(--t-accent-text)]'
                          : 'border-[var(--t-border)] bg-[var(--t-surface-alt)]'
                      }`}
                    >
                      Z{lv}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  pushUndo();
                  setRacks((prev) =>
                    prev.map((r) =>
                      r.key === ctxRack.key
                        ? {
                            ...r,
                            binLengthCm: r.binWidthCm,
                            binWidthCm: r.binLengthCm,
                          }
                        : r
                    )
                  );
                  setCtxMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
              >
                <RotateCw className="h-3.5 w-3.5 text-cyan-400" />
                Rotate 90° (Swap L ↔ W)
              </button>
              <button
                type="button"
                onClick={() => {
                  pushUndo();
                  const dup: CanvasRackNode = {
                    ...ctxRack,
                    key: `R-${Date.now()}`,
                    xMeters: Number((ctxRack.xMeters + 1.2).toFixed(2)),
                  };
                  setRacks((prev) => [...prev, dup]);
                  setSelectedKeys([dup.key]);
                  setCtxMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
              >
                <Copy className="h-3.5 w-3.5 text-emerald-400" />
                Duplicate Rack Nearby
              </button>
              <button
                type="button"
                onClick={() => {
                  pushUndo();
                  setRacks((prev) => prev.filter((r) => r.key !== ctxRack.key));
                  addObstacleAt(ctxRack.xMeters, ctxRack.yMeters);
                  setCtxMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
              >
                <Ban className="h-3.5 w-3.5 text-amber-400" />
                Convert to Pillar / Block
              </button>
              <button
                type="button"
                onClick={() => {
                  pushUndo();
                  setRacks((prev) => prev.filter((r) => r.key !== ctxRack.key));
                  setSelectedKeys((prev) =>
                    prev.filter((k) => k !== ctxRack.key)
                  );
                  setCtxMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-rose-400 hover:bg-rose-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete This Rack
              </button>
            </>
          ) : ctxObstacle ? (
            <>
              <div className="border-b border-[var(--t-border)] px-2 py-1 text-[11px] font-bold">
                Obstacle @ ({ctxObstacle.xMeters}m, {ctxObstacle.yMeters}m)
              </div>
              <button
                type="button"
                onClick={() => {
                  pushUndo();
                  setObstacles((prev) =>
                    prev.filter((o) => o.id !== ctxObstacle.id)
                  );
                  addRackAt(ctxObstacle.xMeters, ctxObstacle.yMeters, levels);
                  setCtxMenu(null);
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
              >
                <PlusSquare className="h-3.5 w-3.5 text-cyan-400" />
                Convert to Rack Stack
              </button>
              <button
                type="button"
                onClick={() => {
                  pushUndo();
                  setObstacles((prev) =>
                    prev.filter((o) => o.id !== ctxObstacle.id)
                  );
                  setCtxMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-rose-400 hover:bg-rose-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Obstacle
              </button>
            </>
          ) : (
            <>
              <div className="border-b border-[var(--t-border)] px-2 py-1 text-[11px] font-bold">
                Floor @ ({ctxMenu.worldX}m, {ctxMenu.worldY}m)
              </div>
              <button
                type="button"
                onClick={() => {
                  addRackAt(ctxMenu.worldX, ctxMenu.worldY, levels);
                  setCtxMenu(null);
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
              >
                <PlusSquare className="h-3.5 w-3.5 text-cyan-400" />
                Add Rack Stack Here (Z1–{levels})
              </button>
              <button
                type="button"
                onClick={() => {
                  addRackAt(ctxMenu.worldX, ctxMenu.worldY, Math.min(2, levels));
                  setCtxMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
              >
                <PlusSquare className="h-3.5 w-3.5 text-emerald-400" />
                Add Low Shelf Here (Z1–2)
              </button>
              <button
                type="button"
                onClick={() => {
                  addObstacleAt(ctxMenu.worldX, ctxMenu.worldY);
                  setCtxMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
              >
                <Ban className="h-3.5 w-3.5 text-amber-400" />
                Add Pillar / Wall Here
              </button>
              <button
                type="button"
                onClick={() => {
                  pushUndo();
                  setDepotX(ctxMenu.worldX);
                  setDepotY(ctxMenu.worldY);
                  setCtxMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--t-surface-alt)]"
              >
                <Navigation className="h-3.5 w-3.5 text-sky-400" />
                Move I/O Depot / Entry Here
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
