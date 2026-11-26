import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { DesignTheme } from '../data/designThemes';
import type { LangCode } from '../i18n/translations';
import type {
  BinAllocation,
  DragScope,
  InteriorProp,
  PackedBox,
  PickWaypoint,
  SelectedCargoBox,
  ViewLayerMode,
  WarehouseConfig,
  WarehouseObstacle,
} from '../types/warehouse';
import {
  buildTemplateEnvironmentProps,
  createInteriorPropMesh,
  createRichCargoGroup,
  getEffectiveInteriorProps,
} from '../utils/threeContentBuilder';
import {
  DEFAULT_SCENE_3D_BACKGROUND,
  type Scene3DBackgroundSettings,
} from './Scene3DBackgroundModal';
import type { ViewportContextState } from './ViewportContextMenu';

const skyTextureCache = new Map<string, THREE.CanvasTexture>();
const MAX_SKY_TEXTURES = 32;

function getSkyGradientTexture(topColor: string, horizonColor: string): THREE.CanvasTexture {
  const key = `${topColor}_${horizonColor}`;
  const existing = skyTextureCache.get(key);
  if (existing) {
    skyTextureCache.delete(key);
    skyTextureCache.set(key, existing);
    return existing;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, topColor);
  grad.addColorStop(0.65, horizonColor);
  grad.addColorStop(1, horizonColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  if (skyTextureCache.size >= MAX_SKY_TEXTURES) {
    const oldestKey = skyTextureCache.keys().next().value;
    if (oldestKey !== undefined) {
      skyTextureCache.get(oldestKey)?.dispose();
      skyTextureCache.delete(oldestKey);
    }
  }
  skyTextureCache.set(key, tex);
  return tex;
}

interface Warehouse3DViewportProps {
  allocations: BinAllocation[];
  pickRoute: PickWaypoint[];
  config: WarehouseConfig;
  scenarioName?: string;
  viewLayer: ViewLayerMode;
  selectedBinId: string | null;
  selectedPropId?: string | null;
  selectedObstacleId?: string | null;
  selectedDepot?: boolean;
  selectedCargo?: SelectedCargoBox | null;
  levelFilter: number | 'all';
  theme: DesignTheme;
  sceneBg?: Scene3DBackgroundSettings;
  onSelectBin: (alloc: BinAllocation | null) => void;
  onSelectProp?: (propId: string | null) => void;
  onSelectObstacle?: (obstacleId: string | null) => void;
  onSelectDepot?: (selected: boolean) => void;
  onSelectCargo?: (cargo: SelectedCargoBox | null) => void;
  onContextAction?: (state: ViewportContextState) => void;
  dragMoveMode?: boolean;
  dragScope?: DragScope;
  onMoveSingleBin?: (
    binId: string,
    newX: number,
    newY: number,
    newLevel?: number
  ) => void;
  onMoveRackColumn?: (
    oldX: number,
    oldY: number,
    newX: number,
    newY: number
  ) => void;
  onMoveWholeTemplate?: (dxMeters: number, dyMeters: number) => void;
  onMoveInteriorProp?: (propId: string, newX: number, newY: number) => void;
  onMoveObstacle?: (obstacleId: string, newX: number, newY: number) => void;
  onMoveDepot?: (newX: number, newY: number) => void;
  onMoveSingleCargoToBin?: (
    fromBinId: string,
    skuId: string,
    toBinId: string,
    transferCount?: number | 'all'
  ) => void;
  onMoveSingleCargoToFloor?: (
    fromBinId: string,
    skuId: string,
    floorX: number,
    floorZ: number,
    transferCount?: number | 'all'
  ) => void;
  cameraPreset: 'iso' | 'top' | 'elevation' | 'closeup';
  cameraResetTick?: number;
  cameraFocusTick?: number;
  autoZoomEnabled?: boolean;
  onToggleAutoZoom?: () => void;
  onEnableAnimateRoute?: () => void;
  onChangeCameraPreset?: (preset: 'iso' | 'top' | 'elevation' | 'closeup') => void;
  animateRoute: boolean;
  lang?: LangCode;
}

function disposeObjectTree(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      geometries.add(mesh.geometry);
    }
    const mat = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => materials.add(m));
    } else if (mat) {
      materials.add(mat);
    }
  });

  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}

function heatColor(ratio: number): THREE.Color {
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped < 0.35) {
    return new THREE.Color().lerpColors(
      new THREE.Color('#0ea5e9'),
      new THREE.Color('#10b981'),
      clamped / 0.35
    );
  }
  if (clamped < 0.7) {
    return new THREE.Color().lerpColors(
      new THREE.Color('#10b981'),
      new THREE.Color('#f59e0b'),
      (clamped - 0.35) / 0.35
    );
  }
  return new THREE.Color().lerpColors(
    new THREE.Color('#f59e0b'),
    new THREE.Color('#ef4444'),
    (clamped - 0.7) / 0.3
  );
}

export const Warehouse3DViewport: React.FC<Warehouse3DViewportProps> = ({
  allocations,
  pickRoute,
  config,
  scenarioName = 'CubiSlot 3D Space',
  viewLayer,
  selectedBinId,
  selectedPropId = null,
  selectedObstacleId = null,
  selectedDepot = false,
  selectedCargo = null,
  levelFilter,
  theme,
  sceneBg = DEFAULT_SCENE_3D_BACKGROUND,
  onSelectBin,
  onSelectProp,
  onSelectObstacle,
  onSelectDepot,
  onSelectCargo,
  onContextAction,
  dragMoveMode = false,
  dragScope = 'single_cargo',
  onMoveSingleBin,
  onMoveRackColumn,
  onMoveWholeTemplate,
  onMoveInteriorProp,
  onMoveObstacle,
  onMoveDepot,
  onMoveSingleCargoToBin,
  onMoveSingleCargoToFloor,
  cameraPreset,
  cameraResetTick = 0,
  cameraFocusTick = 0,
  autoZoomEnabled = true,
  onToggleAutoZoom,
  onEnableAnimateRoute,
  onChangeCameraPreset,
  animateRoute,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredBin, setHoveredBin] = useState<BinAllocation | null>(null);
  const [hoveredCargo, setHoveredCargo] = useState<SelectedCargoBox | null>(
    null
  );
  const [hoveredOtherLabel, setHoveredOtherLabel] = useState<string | null>(
    null
  );
  const [dragFitStatus, setDragFitStatus] = useState<
    'fit' | 'swap' | 'hazard' | null
  >(null);
  const [wheelZoomStyle, setWheelZoomStyle] = useState<'cursor' | 'center'>(
    'cursor'
  );
  const wheelZoomStyleRef = useRef(wheelZoomStyle);
  wheelZoomStyleRef.current = wheelZoomStyle;
  const [followPickerCam, setFollowPickerCam] = useState<boolean>(false);
  const followPickerCamRef = useRef<boolean>(false);
  followPickerCamRef.current = followPickerCam;
  const goldenCycleIdxRef = useRef<number>(0);
  const priorityCycleIdxRef = useRef<number>(0);
  const hadSelectionRef = useRef<boolean>(false);
  const prevLayoutSigRef = useRef<string>('');
  const prevLevelFilterRef = useRef<number | 'all'>(levelFilter);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [routeSpeed, setRouteSpeed] = useState<number>(1);
  const routeSpeedRef = useRef<number>(1);
  routeSpeedRef.current = routeSpeed;
  const baseCameraDistRef = useRef<number>(14);
  const cameraGoalRef = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const hitMeshesRef = useRef<Map<THREE.Object3D, BinAllocation>>(new Map());
  const propHitMeshesRef = useRef<Map<THREE.Object3D, InteriorProp>>(new Map());
  const obstacleHitMeshesRef = useRef<Map<THREE.Object3D, WarehouseObstacle>>(
    new Map()
  );
  const depotHitMeshesRef = useRef<
    Map<THREE.Object3D, { xMeters: number; yMeters: number; group: THREE.Object3D }>
  >(new Map());
  const cargoHitMeshesRef = useRef<
    Map<
      THREE.Object3D,
      {
        alloc: BinAllocation;
        box: PackedBox;
        boxIndex: number;
        cargoGroup: THREE.Object3D;
      }
    >
  >(new Map());
  const hitTargetsCacheRef = useRef<{
    bins: THREE.Object3D[];
    props: THREE.Object3D[];
    obstacles: THREE.Object3D[];
    depot: THREE.Object3D[];
    cargo: THREE.Object3D[];
  }>({
    bins: [],
    props: [],
    obstacles: [],
    depot: [],
    cargo: [],
  });
  const selectedBinIdRef = useRef(selectedBinId);
  selectedBinIdRef.current = selectedBinId;
  const onSelectBinRef = useRef(onSelectBin);
  onSelectBinRef.current = onSelectBin;
  const onContextActionRef = useRef(onContextAction);
  onContextActionRef.current = onContextAction;
  const dragMoveModeRef = useRef(dragMoveMode);
  dragMoveModeRef.current = dragMoveMode;
  const dragScopeRef = useRef(dragScope);
  dragScopeRef.current = dragScope;
  const onMoveSingleBinRef = useRef(onMoveSingleBin);
  onMoveSingleBinRef.current = onMoveSingleBin;
  const onMoveRackColumnRef = useRef(onMoveRackColumn);
  onMoveRackColumnRef.current = onMoveRackColumn;
  const onMoveWholeTemplateRef = useRef(onMoveWholeTemplate);
  onMoveWholeTemplateRef.current = onMoveWholeTemplate;
  const onMoveInteriorPropRef = useRef(onMoveInteriorProp);
  onMoveInteriorPropRef.current = onMoveInteriorProp;
  const onMoveObstacleRef = useRef(onMoveObstacle);
  onMoveObstacleRef.current = onMoveObstacle;
  const onMoveDepotRef = useRef(onMoveDepot);
  onMoveDepotRef.current = onMoveDepot;
  const onMoveSingleCargoToBinRef = useRef(onMoveSingleCargoToBin);
  onMoveSingleCargoToBinRef.current = onMoveSingleCargoToBin;
  const onMoveSingleCargoToFloorRef = useRef(onMoveSingleCargoToFloor);
  onMoveSingleCargoToFloorRef.current = onMoveSingleCargoToFloor;
  const onSelectPropRef = useRef(onSelectProp);
  onSelectPropRef.current = onSelectProp;
  const onSelectObstacleRef = useRef(onSelectObstacle);
  onSelectObstacleRef.current = onSelectObstacle;
  const onSelectDepotRef = useRef(onSelectDepot);
  onSelectDepotRef.current = onSelectDepot;
  const onSelectCargoRef = useRef(onSelectCargo);
  onSelectCargoRef.current = onSelectCargo;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const environmentGroupRef = useRef<THREE.Group | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const selectionOverlayGroupRef = useRef<THREE.Group | null>(null);
  const pickerMarkerRef = useRef<THREE.Mesh | null>(null);
  const routeCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const animateRouteRef = useRef<boolean>(animateRoute);
  animateRouteRef.current = animateRoute;

  const aisleSpacingM = config.aisleSpacingM ?? 3.4;
  const baySpacingM = config.baySpacingM ?? 1.45;
  const gridCenterX = ((Math.max(1, config.aisles) - 1) * aisleSpacingM) / 2;
  const gridCenterZ = 1.8 + ((Math.max(1, config.baysPerAisle) - 1) * baySpacingM) / 2;
  const depotX = config.depotXMeters ?? gridCenterX;
  const depotZ = config.depotYMeters ?? 0;

  const bounds = React.useMemo(() => {
    const xs = [
      ...allocations.map((a) => a.bin.xMeters),
      ...(config.obstacles ?? []).map((o) => o.xMeters),
      depotX,
      ...(config.floorWidthM ? [-1.0, -1.0 + config.floorWidthM] : []),
    ];
    const zs = [
      ...allocations.map((a) => a.bin.yMeters),
      ...(config.obstacles ?? []).map((o) => o.yMeters),
      depotZ,
      ...(config.floorDepthM ? [-1.0, -1.0 + config.floorDepthM] : []),
    ];
    const minX = Math.min(-1.0, ...(xs.length ? xs.map((x) => x - 1.2) : [-1.0]));
    const minZ = Math.min(-1.0, ...(zs.length ? zs.map((z) => z - 1.2) : [-1.0]));
    const maxX = Math.max(
      minX + (config.floorWidthM ?? 0),
      ...(xs.length ? xs.map((x) => x + 1.5) : [10])
    );
    const maxZ = Math.max(
      minZ + (config.floorDepthM ?? 0),
      ...(zs.length ? zs.map((z) => z + 1.5) : [10])
    );
    const width = Math.max(12, maxX - minX);
    const depth = Math.max(12, maxZ - minZ);
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    return { minX, minZ, maxX, maxZ, width, depth, centerX, centerZ };
  }, [allocations, config.obstacles, config.floorWidthM, config.floorDepthM, depotX, depotZ]);

  const centerX = bounds.centerX || gridCenterX;
  const centerZ = bounds.centerZ || gridCenterZ;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.scene.background);
    scene.fog = new THREE.FogExp2(theme.scene.fog, 0.018);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.05,
      220
    );
    camera.position.set(centerX + 8.5, 8.6, centerZ + 8.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = sceneBg.exposure;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.target.set(centerX, 1.8, centerZ);
    controls.maxPolarAngle = Math.PI / 2 - 0.015;
    controls.minDistance = 0.55;
    controls.maxDistance = 95;
    controls.zoomSpeed = 1.25;
    controls.rotateSpeed = 0.92;
    controls.panSpeed = 1.1;
    controls.screenSpacePanning = true;
    controls.zoomToCursor = wheelZoomStyleRef.current === 'cursor';
    controlsRef.current = controls;

    const onCancelAutoGlide = () => {
      cameraGoalRef.current = null;
      if (followPickerCamRef.current) {
        followPickerCamRef.current = false;
        setFollowPickerCam(false);
      }
    };
    controls.addEventListener('start', onCancelAutoGlide);
    renderer.domElement.addEventListener('wheel', onCancelAutoGlide, {
      passive: true,
    });

    let lastReportedZoom = 100;
    const onControlsChange = () => {
      const dist = Math.max(0.65, camera.position.distanceTo(controls.target));
      const pct = Math.round(
        Math.max(25, Math.min(350, (baseCameraDistRef.current / dist) * 100))
      );
      if (Math.abs(pct - lastReportedZoom) >= 1) {
        lastReportedZoom = pct;
        setZoomPercent(pct);
      }
    };
    controls.addEventListener('change', onControlsChange);

    const ambient = new THREE.AmbientLight('#ffffff', sceneBg.ambientIntensity);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    const hemiLight = new THREE.HemisphereLight(
      sceneBg.skyHorizonColor,
      sceneBg.floorColor,
      sceneBg.ambientIntensity * 0.72
    );
    hemiLight.position.set(0, 22, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const keyLight = new THREE.DirectionalLight('#ffffff', sceneBg.sunIntensity);
    keyLight.position.set(14, 22, 14);
    keyLight.castShadow = sceneBg.enableShadows;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.DirectionalLight(
      '#f8fafc',
      sceneBg.sunIntensity * 0.58
    );
    fillLight.position.set(-14, 15, -10);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const envGroup = new THREE.Group();
    scene.add(envGroup);
    environmentGroupRef.current = envGroup;

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    const selectionOverlayGroup = new THREE.Group();
    scene.add(selectionOverlayGroup);
    selectionOverlayGroupRef.current = selectionOverlayGroup;

    const pickerGeo = new THREE.SphereGeometry(0.16, 18, 18);
    const pickerMat = new THREE.MeshStandardMaterial({
      color: theme.scene.route,
      emissive: theme.scene.route,
      emissiveIntensity: 0.9,
    });
    const pickerMarker = new THREE.Mesh(pickerGeo, pickerMat);
    pickerMarker.visible = false;
    scene.add(pickerMarker);
    pickerMarkerRef.current = pickerMarker;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const floorHitVec = new THREE.Vector3();

    const dragGhostGeo = new THREE.BoxGeometry(0.95, 3.6, 1.25);
    const dragGhostMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.35,
      wireframe: false,
      depthWrite: false,
    });
    const dragGhost = new THREE.Mesh(dragGhostGeo, dragGhostMat);
    dragGhost.visible = false;
    scene.add(dragGhost);

    let active3DDrag: {
      kind:
        | 'rack'
        | 'single_bin'
        | 'cargo'
        | 'prop'
        | 'obstacle'
        | 'depot'
        | 'whole_template';
      binId?: string;
      binZ?: number;
      binH?: number;
      binW?: number;
      binL?: number;
      sourceBinId?: string;
      sourceAlloc?: BinAllocation;
      targetBinId?: string;
      cargoInfo?: SelectedCargoBox;
      cargoObject?: THREE.Object3D;
      boxH?: number;
      moveBatch?: boolean;
      propId?: string;
      propObject?: THREE.Object3D;
      obstacleId?: string;
      obstacleObject?: THREE.Object3D;
      depotObject?: THREE.Object3D;
      oldX: number;
      oldY: number;
      newX: number;
      newY: number;
      grabFloorX: number;
      grabFloorZ: number;
    } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      if (e.button === 0) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        const hasFloorHit = Boolean(
          raycaster.ray.intersectPlane(floorPlane, floorHitVec)
        );
        const grabFloorX = hasFloorHit ? floorHitVec.x : 0;
        const grabFloorZ = hasFloorHit ? floorHitVec.z : 0;

        if (
          dragMoveModeRef.current &&
          dragScopeRef.current === 'whole_template'
        ) {
          const hits = raycaster.intersectObjects(
            dynamicGroup.children,
            true
          );
          if (hits.length > 0 && hasFloorHit) {
            controls.enabled = false;
            const startX = Number(
              (Math.round(grabFloorX / 0.25) * 0.25).toFixed(2)
            );
            const startZ = Number(
              (Math.round(grabFloorZ / 0.25) * 0.25).toFixed(2)
            );
            active3DDrag = {
              kind: 'whole_template',
              oldX: startX,
              oldY: startZ,
              newX: startX,
              newY: startZ,
              grabFloorX,
              grabFloorZ,
            };
            return;
          }
        }

        const cachedTargets = hitTargetsCacheRef.current;
        const propHits = raycaster.intersectObjects(cachedTargets.props, false);
        if (propHits.length > 0 && hasFloorHit) {
          const hitMesh = propHits[0].object;
          const prop = propHitMeshesRef.current.get(hitMesh);
          if (prop) {
            onSelectPropRef.current?.(prop.id);
            onSelectObstacleRef.current?.(null);
            onSelectDepotRef.current?.(false);
            onSelectCargoRef.current?.(null);
            onSelectBinRef.current(null);
            controls.enabled = false;
            let rootPropObj: THREE.Object3D = hitMesh;
            while (
              rootPropObj.parent &&
              rootPropObj.parent !== dynamicGroup
            ) {
              rootPropObj = rootPropObj.parent;
            }
            active3DDrag = {
              kind: 'prop',
              propId: prop.id,
              propObject: rootPropObj,
              oldX: prop.xMeters,
              oldY: prop.yMeters,
              newX: prop.xMeters,
              newY: prop.yMeters,
              grabFloorX,
              grabFloorZ,
            };
            return;
          }
        }

        const obsHits = raycaster.intersectObjects(cachedTargets.obstacles, false);
        if (obsHits.length > 0 && hasFloorHit) {
          const hitMesh = obsHits[0].object;
          const obs = obstacleHitMeshesRef.current.get(hitMesh);
          if (obs) {
            onSelectObstacleRef.current?.(obs.id);
            onSelectPropRef.current?.(null);
            onSelectDepotRef.current?.(false);
            onSelectCargoRef.current?.(null);
            onSelectBinRef.current(null);
            controls.enabled = false;
            let rootObsObj: THREE.Object3D = hitMesh;
            while (
              rootObsObj.parent &&
              rootObsObj.parent !== dynamicGroup
            ) {
              rootObsObj = rootObsObj.parent;
            }
            active3DDrag = {
              kind: 'obstacle',
              obstacleId: obs.id,
              obstacleObject: rootObsObj,
              oldX: obs.xMeters,
              oldY: obs.yMeters,
              newX: obs.xMeters,
              newY: obs.yMeters,
              grabFloorX,
              grabFloorZ,
            };
            return;
          }
        }

        const depotHits = raycaster.intersectObjects(cachedTargets.depot, false);
        if (depotHits.length > 0 && hasFloorHit) {
          const hitMesh = depotHits[0].object;
          const depotInfo = depotHitMeshesRef.current.get(hitMesh);
          if (depotInfo) {
            onSelectDepotRef.current?.(true);
            onSelectObstacleRef.current?.(null);
            onSelectPropRef.current?.(null);
            onSelectCargoRef.current?.(null);
            onSelectBinRef.current(null);
            controls.enabled = false;
            active3DDrag = {
              kind: 'depot',
              depotObject: depotInfo.group,
              oldX: depotInfo.xMeters,
              oldY: depotInfo.yMeters,
              newX: depotInfo.xMeters,
              newY: depotInfo.yMeters,
              grabFloorX,
              grabFloorZ,
            };
            return;
          }
        }

        if (
          hasFloorHit &&
          (!dragMoveModeRef.current || dragScopeRef.current === 'single_cargo')
        ) {
          const cargoHits = raycaster.intersectObjects(cachedTargets.cargo, false);
          if (cargoHits.length > 0) {
            const hitEntry = cargoHitMeshesRef.current.get(cargoHits[0].object);
            if (hitEntry) {
              controls.enabled = false;
              const { alloc, box, boxIndex, cargoGroup } = hitEntry;
              const boxW = box.widthCm / 100;
              const boxH = box.heightCm / 100;
              const boxL = box.lengthCm / 100;
              dragGhostMat.color.set(box.color || '#38bdf8');
              dragGhost.scale.set(
                Math.max(0.18, boxW / 0.95),
                Math.max(0.08, boxH / 3.6),
                Math.max(0.18, boxL / 1.25)
              );
              dragGhost.position.copy(cargoGroup.position);
              active3DDrag = {
                kind: 'cargo',
                sourceBinId: alloc.bin.id,
                sourceAlloc: alloc,
                targetBinId: alloc.bin.id,
                cargoObject: cargoGroup,
                boxH,
                moveBatch: e.shiftKey,
                cargoInfo: {
                  binId: alloc.bin.id,
                  boxIndex,
                  skuId: box.skuId,
                  skuCode: box.skuCode,
                  name: box.name,
                  weightKg: box.weightKg,
                  lengthCm: box.lengthCm,
                  widthCm: box.widthCm,
                  heightCm: box.heightCm,
                  color: box.color,
                },
                oldX: alloc.bin.xMeters,
                oldY: alloc.bin.yMeters,
                newX: alloc.bin.xMeters,
                newY: alloc.bin.yMeters,
                grabFloorX,
                grabFloorZ,
              };
              return;
            }
          }
        }

        if (hasFloorHit) {
          const hits = raycaster.intersectObjects(cachedTargets.bins, false);
          if (hits.length > 0) {
            const alloc = hitMeshesRef.current.get(hits[0].object);
            if (
              alloc &&
              (dragMoveModeRef.current ||
                e.altKey ||
                alloc.bin.id === selectedBinIdRef.current)
            ) {
              controls.enabled = false;
              if (
                dragMoveModeRef.current &&
                dragScopeRef.current === 'single_cargo' &&
                alloc.boxes.length > 0
              ) {
                const box = alloc.boxes[alloc.boxes.length - 1];
                const boxIndex = alloc.boxes.length - 1;
                const boxW = box.widthCm / 100;
                const boxH = box.heightCm / 100;
                const boxL = box.lengthCm / 100;
                dragGhostMat.color.set(box.color || '#38bdf8');
                dragGhost.scale.set(
                  Math.max(0.18, boxW / 0.95),
                  Math.max(0.08, boxH / 3.6),
                  Math.max(0.18, boxL / 1.25)
                );
                dragGhost.position.set(
                  alloc.bin.xMeters,
                  alloc.bin.zMeters + boxH / 2 + 0.04,
                  alloc.bin.yMeters
                );
                dragGhost.visible = true;
                active3DDrag = {
                  kind: 'cargo',
                  sourceBinId: alloc.bin.id,
                  sourceAlloc: alloc,
                  targetBinId: alloc.bin.id,
                  boxH,
                  cargoInfo: {
                    binId: alloc.bin.id,
                    boxIndex,
                    skuId: box.skuId,
                    skuCode: box.skuCode,
                    name: box.name,
                    weightKg: box.weightKg,
                    lengthCm: box.lengthCm,
                    widthCm: box.widthCm,
                    heightCm: box.heightCm,
                    color: box.color,
                  },
                  oldX: alloc.bin.xMeters,
                  oldY: alloc.bin.yMeters,
                  newX: alloc.bin.xMeters,
                  newY: alloc.bin.yMeters,
                  grabFloorX,
                  grabFloorZ,
                };
                onSelectBinRef.current(alloc);
                return;
              }

              const isSingleBin = dragScopeRef.current === 'single_bin';
              const binH = alloc.bin.binHeightCm / 100;
              const binW = alloc.bin.binWidthCm / 100;
              const binL = alloc.bin.binLengthCm / 100;
              dragGhostMat.color.set(isSingleBin ? '#38bdf8' : '#22d3ee');
              active3DDrag = {
                kind: isSingleBin ? 'single_bin' : 'rack',
                binId: alloc.bin.id,
                binZ: alloc.bin.zMeters,
                binH,
                binW,
                binL,
                oldX: alloc.bin.xMeters,
                oldY: alloc.bin.yMeters,
                newX: alloc.bin.xMeters,
                newY: alloc.bin.yMeters,
                grabFloorX,
                grabFloorZ,
              };
              dragGhost.scale.set(
                alloc.bin.binWidthCm / 95,
                isSingleBin ? binH / 3.6 : 1,
                alloc.bin.binLengthCm / 125
              );
              dragGhost.position.set(
                alloc.bin.xMeters,
                isSingleBin ? alloc.bin.zMeters + binH / 2 : 1.8,
                alloc.bin.yMeters
              );
              dragGhost.visible = true;
              onSelectBinRef.current(alloc);
            }
          }
        }
      }
    };

    let hoverRafId = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        if (!active3DDrag) setHoveredBin(null);
        return;
      }
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (active3DDrag) {
        const dragDist = Math.hypot(
          e.clientX - pointerDownPos.x,
          e.clientY - pointerDownPos.y
        );
        raycaster.setFromCamera(pointer, camera);

        if (active3DDrag.kind === 'cargo') {
          if (dragDist > 5) {
            dragGhost.visible = true;
            if (active3DDrag.cargoObject) {
              active3DDrag.cargoObject.visible = false;
            }
          }
          const binHits = raycaster.intersectObjects(
            hitTargetsCacheRef.current.bins,
            false
          );
          const boxH = active3DDrag.boxH ?? 0.25;
          const info = active3DDrag.cargoInfo;
          const itemVol = info
            ? info.lengthCm * info.widthCm * info.heightCm
            : 0;
          const itemWeight = info?.weightKg ?? 0;

          if (binHits.length > 0) {
            const targetAlloc = hitMeshesRef.current.get(binHits[0].object) ?? null;
            if (targetAlloc) {
              active3DDrag.targetBinId = targetAlloc.bin.id;
              active3DDrag.newX = targetAlloc.bin.xMeters;
              active3DDrag.newY = targetAlloc.bin.yMeters;
              dragGhost.position.set(
                targetAlloc.bin.xMeters,
                targetAlloc.bin.zMeters + boxH / 2 + 0.04,
                targetAlloc.bin.yMeters
              );

              const isUpperHeavyHazard =
                itemWeight > 16 && targetAlloc.bin.level >= 3;
              const isNearFull =
                targetAlloc.usedVolumeCm3 + itemVol >
                  targetAlloc.totalVolumeCm3 * 0.92 ||
                targetAlloc.currentWeightKg + itemWeight >
                  targetAlloc.bin.maxWeightKg;

              if (isUpperHeavyHazard) {
                dragGhostMat.color.set('#f43f5e');
                setDragFitStatus('hazard');
              } else if (
                isNearFull &&
                targetAlloc.bin.id !== active3DDrag.sourceBinId
              ) {
                dragGhostMat.color.set('#f59e0b');
                setDragFitStatus('swap');
              } else {
                dragGhostMat.color.set('#10b981');
                setDragFitStatus('fit');
              }

              setHoveredBin((prev) =>
                prev?.bin.id === targetAlloc.bin.id ? prev : targetAlloc
              );
              return;
            }
          }
          if (raycaster.ray.intersectPlane(floorPlane, floorHitVec)) {
            const deltaX = floorHitVec.x - active3DDrag.grabFloorX;
            const deltaZ = floorHitVec.z - active3DDrag.grabFloorZ;
            const snapX = Number(
              (Math.round((active3DDrag.oldX + deltaX) / 0.25) * 0.25).toFixed(2)
            );
            const snapZ = Number(
              (Math.round((active3DDrag.oldY + deltaZ) / 0.25) * 0.25).toFixed(2)
            );
            active3DDrag.targetBinId = undefined;
            active3DDrag.newX = snapX;
            active3DDrag.newY = snapZ;
            dragGhostMat.color.set('#38bdf8');
            setDragFitStatus('fit');
            dragGhost.position.set(snapX, boxH / 2 + 0.04, snapZ);
            setHoveredBin(null);
          }
          return;
        }

        if (raycaster.ray.intersectPlane(floorPlane, floorHitVec)) {
          const deltaX = floorHitVec.x - active3DDrag.grabFloorX;
          const deltaZ = floorHitVec.z - active3DDrag.grabFloorZ;
          const snapX = Number(
            (Math.round((active3DDrag.oldX + deltaX) / 0.25) * 0.25).toFixed(2)
          );
          const snapZ = Number(
            (Math.round((active3DDrag.oldY + deltaZ) / 0.25) * 0.25).toFixed(2)
          );
          active3DDrag.newX = snapX;
          active3DDrag.newY = snapZ;

          if (active3DDrag.kind === 'whole_template') {
            dynamicGroup.position.set(
              snapX - active3DDrag.oldX,
              0,
              snapZ - active3DDrag.oldY
            );
          } else if (
            active3DDrag.kind === 'prop' &&
            active3DDrag.propObject
          ) {
            active3DDrag.propObject.position.set(snapX, 0, snapZ);
          } else if (
            active3DDrag.kind === 'obstacle' &&
            active3DDrag.obstacleObject
          ) {
            active3DDrag.obstacleObject.position.set(snapX, 0, snapZ);
          } else if (
            active3DDrag.kind === 'depot' &&
            active3DDrag.depotObject
          ) {
            active3DDrag.depotObject.position.set(snapX, 0, snapZ);
          } else if (active3DDrag.kind === 'single_bin' || active3DDrag.kind === 'rack') {
            const dragW = active3DDrag.binW ?? 0.95;
            const dragL = active3DDrag.binL ?? 1.25;
            const dragH = active3DDrag.binH ?? 0.72;
            const dragZ = active3DDrag.binZ ?? 0.05;
            let hasCollision = false;

            for (const otherAlloc of hitMeshesRef.current.values()) {
              const ob = otherAlloc.bin;
              if (active3DDrag.kind === 'single_bin') {
                if (ob.id === active3DDrag.binId) continue;
              } else {
                if (
                  Math.abs(ob.xMeters - active3DDrag.oldX) < 0.14 &&
                  Math.abs(ob.yMeters - active3DDrag.oldY) < 0.14
                ) {
                  continue;
                }
              }
              const otherW = ob.binWidthCm / 100;
              const otherL = ob.binLengthCm / 100;
              const otherH = ob.binHeightCm / 100;
              const xyOverlap =
                Math.abs(ob.xMeters - snapX) < (dragW + otherW) / 2 + 0.08 &&
                Math.abs(ob.yMeters - snapZ) < (dragL + otherL) / 2 + 0.08;
              if (!xyOverlap) continue;

              if (active3DDrag.kind === 'rack') {
                hasCollision = true;
                break;
              }
              const zOverlap =
                dragZ < ob.zMeters + otherH + 0.08 &&
                dragZ + dragH + 0.08 > ob.zMeters;
              if (zOverlap) {
                hasCollision = true;
                break;
              }
            }

            if (!hasCollision) {
              for (const obs of obstacleHitMeshesRef.current.values()) {
                const pillarHalf = 0.36;
                if (
                  Math.abs(obs.xMeters - snapX) < dragW / 2 + pillarHalf + 0.08 &&
                  Math.abs(obs.yMeters - snapZ) < dragL / 2 + pillarHalf + 0.08
                ) {
                  hasCollision = true;
                  break;
                }
              }
            }

            dragGhostMat.color.set(hasCollision ? '#f59e0b' : '#10b981');
            setDragFitStatus(hasCollision ? 'swap' : 'fit');

            if (active3DDrag.kind === 'single_bin') {
              const centerZ = dragZ + dragH / 2;
              dragGhost.position.set(snapX, centerZ, snapZ);
            } else {
              dragGhost.position.set(snapX, 1.8, snapZ);
            }
          }
        }
        return;
      }

      if (e.buttons !== 0) return;
      if (hoverRafId) return;

      hoverRafId = requestAnimationFrame(() => {
        hoverRafId = 0;
        raycaster.setFromCamera(pointer, camera);
        const cachedTargets = hitTargetsCacheRef.current;

        const propHits = raycaster.intersectObjects(cachedTargets.props, false);
        if (propHits.length > 0) {
          const prop = propHitMeshesRef.current.get(propHits[0].object);
          if (prop) {
            setHoveredOtherLabel(prop.label);
            setHoveredBin(null);
            setHoveredCargo(null);
            return;
          }
        }

        const obsHits = raycaster.intersectObjects(cachedTargets.obstacles, false);
        if (obsHits.length > 0) {
          const obs = obstacleHitMeshesRef.current.get(obsHits[0].object);
          if (obs) {
            setHoveredOtherLabel(`Pillar / Obstacle (${obs.label})`);
            setHoveredBin(null);
            setHoveredCargo(null);
            return;
          }
        }

        const depotHits = raycaster.intersectObjects(cachedTargets.depot, false);
        if (depotHits.length > 0) {
          setHoveredOtherLabel('★ I/O Depot (Pick Start Point)');
          setHoveredBin(null);
          setHoveredCargo(null);
          return;
        }
        setHoveredOtherLabel((prev) => (prev === null ? null : null));

        const cargoHits = raycaster.intersectObjects(cachedTargets.cargo, false);
        if (cargoHits.length > 0) {
          const entry = cargoHitMeshesRef.current.get(cargoHits[0].object);
          if (entry) {
            setHoveredBin((prev) =>
              prev?.bin.id === entry.alloc.bin.id ? prev : entry.alloc
            );
            setHoveredCargo((prev) =>
              prev?.binId === entry.alloc.bin.id &&
              prev?.boxIndex === entry.boxIndex
                ? prev
                : {
                    binId: entry.alloc.bin.id,
                    boxIndex: entry.boxIndex,
                    skuId: entry.box.skuId,
                    skuCode: entry.box.skuCode,
                    name: entry.box.name,
                    weightKg: entry.box.weightKg,
                    lengthCm: entry.box.lengthCm,
                    widthCm: entry.box.widthCm,
                    heightCm: entry.box.heightCm,
                    color: entry.box.color,
                  }
            );
            return;
          }
        }
        setHoveredCargo((prev) => (prev === null ? null : null));

        const hits = raycaster.intersectObjects(cachedTargets.bins, false);
        if (hits.length > 0) {
          const hitAlloc = hitMeshesRef.current.get(hits[0].object) ?? null;
          setHoveredBin((prev) =>
            prev?.bin.id === hitAlloc?.bin.id ? prev : hitAlloc
          );
        } else {
          setHoveredBin((prev) => (prev === null ? null : null));
        }
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );

      if (active3DDrag) {
        const finished = active3DDrag;
        active3DDrag = null;
        dragGhost.visible = false;
        dragGhostMat.color.set('#38bdf8');
        setDragFitStatus(null);
        if (finished.cargoObject) {
          finished.cargoObject.visible = true;
        }
        dynamicGroup.position.set(0, 0, 0);
        controls.enabled = true;

        if (finished.kind === 'cargo' && finished.cargoInfo && finished.sourceBinId) {
          const transferCount = finished.moveBatch || e.shiftKey ? 'all' : 1;
          if (dist <= 6) {
            if (finished.sourceAlloc) onSelectBinRef.current(finished.sourceAlloc);
            onSelectCargoRef.current?.(finished.cargoInfo);
            onSelectPropRef.current?.(null);
            onSelectObstacleRef.current?.(null);
            onSelectDepotRef.current?.(false);
          } else if (
            finished.targetBinId &&
            finished.targetBinId !== finished.sourceBinId
          ) {
            onMoveSingleCargoToBinRef.current?.(
              finished.sourceBinId,
              finished.cargoInfo.skuId,
              finished.targetBinId,
              transferCount
            );
          } else if (
            !finished.targetBinId &&
            (Math.abs(finished.newX - finished.oldX) > 0.2 ||
              Math.abs(finished.newY - finished.oldY) > 0.2)
          ) {
            onMoveSingleCargoToFloorRef.current?.(
              finished.sourceBinId,
              finished.cargoInfo.skuId,
              finished.newX,
              finished.newY,
              transferCount
            );
          }
          return;
        }

        if (
          Math.abs(finished.newX - finished.oldX) > 0.05 ||
          Math.abs(finished.newY - finished.oldY) > 0.05
        ) {
          if (finished.kind === 'whole_template') {
            onMoveWholeTemplateRef.current?.(
              Number((finished.newX - finished.oldX).toFixed(2)),
              Number((finished.newY - finished.oldY).toFixed(2))
            );
          } else if (finished.kind === 'prop' && finished.propId) {
            onMoveInteriorPropRef.current?.(
              finished.propId,
              finished.newX,
              finished.newY
            );
          } else if (finished.kind === 'obstacle' && finished.obstacleId) {
            onMoveObstacleRef.current?.(
              finished.obstacleId,
              finished.newX,
              finished.newY
            );
          } else if (finished.kind === 'depot') {
            onMoveDepotRef.current?.(finished.newX, finished.newY);
          } else if (finished.kind === 'single_bin' && finished.binId) {
            onMoveSingleBinRef.current?.(
              finished.binId,
              finished.newX,
              finished.newY
            );
          } else {
            onMoveRackColumnRef.current?.(
              finished.oldX,
              finished.oldY,
              finished.newX,
              finished.newY
            );
          }
        }
        return;
      }

      if (dist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const cachedTargets = hitTargetsCacheRef.current;

      const propHits = raycaster.intersectObjects(cachedTargets.props, false);
      if (propHits.length > 0) {
        const prop = propHitMeshesRef.current.get(propHits[0].object) ?? null;
        if (prop) {
          onSelectPropRef.current?.(prop.id);
          onSelectObstacleRef.current?.(null);
          onSelectDepotRef.current?.(false);
          onSelectCargoRef.current?.(null);
          onSelectBinRef.current(null);
          return;
        }
      }

      const obsHits = raycaster.intersectObjects(cachedTargets.obstacles, false);
      if (obsHits.length > 0) {
        const obs = obstacleHitMeshesRef.current.get(obsHits[0].object) ?? null;
        if (obs) {
          onSelectObstacleRef.current?.(obs.id);
          onSelectPropRef.current?.(null);
          onSelectDepotRef.current?.(false);
          onSelectCargoRef.current?.(null);
          onSelectBinRef.current(null);
          return;
        }
      }

      const depotHits = raycaster.intersectObjects(cachedTargets.depot, false);
      if (depotHits.length > 0) {
        onSelectDepotRef.current?.(true);
        onSelectObstacleRef.current?.(null);
        onSelectPropRef.current?.(null);
        onSelectCargoRef.current?.(null);
        onSelectBinRef.current(null);
        return;
      }

      const cargoHits = raycaster.intersectObjects(cachedTargets.cargo, false);
      if (cargoHits.length > 0) {
        const hitEntry = cargoHitMeshesRef.current.get(cargoHits[0].object);
        if (hitEntry) {
          const { alloc, box, boxIndex } = hitEntry;
          onSelectBinRef.current(alloc);
          onSelectPropRef.current?.(null);
          onSelectObstacleRef.current?.(null);
          onSelectDepotRef.current?.(false);
          onSelectCargoRef.current?.({
            binId: alloc.bin.id,
            boxIndex,
            skuId: box.skuId,
            skuCode: box.skuCode,
            name: box.name,
            weightKg: box.weightKg,
            lengthCm: box.lengthCm,
            widthCm: box.widthCm,
            heightCm: box.heightCm,
            color: box.color,
          });
          return;
        }
      }

      const hits = raycaster.intersectObjects(cachedTargets.bins, false);
      if (hits.length > 0) {
        const alloc = hitMeshesRef.current.get(hits[0].object) ?? null;
        onSelectBinRef.current(alloc);
        onSelectPropRef.current?.(null);
        onSelectObstacleRef.current?.(null);
        onSelectDepotRef.current?.(false);
        onSelectCargoRef.current?.(null);
      } else {
        onSelectBinRef.current(null);
        onSelectPropRef.current?.(null);
        onSelectObstacleRef.current?.(null);
        onSelectDepotRef.current?.(false);
        onSelectCargoRef.current?.(null);
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const handler = onContextActionRef.current;
      if (!handler) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hitFloor = raycaster.ray.intersectPlane(floorPlane, floorHitVec);
      const floorPt = hitFloor
        ? { x: Number(floorHitVec.x.toFixed(2)), z: Number(floorHitVec.z.toFixed(2)) }
        : null;
      const cachedTargets = hitTargetsCacheRef.current;

      const propHits = raycaster.intersectObjects(cachedTargets.props, false);
      if (propHits.length > 0) {
        const prop = propHitMeshesRef.current.get(propHits[0].object) ?? null;
        if (prop) {
          onSelectPropRef.current?.(prop.id);
          handler({
            clientX: e.clientX,
            clientY: e.clientY,
            binAlloc: null,
            interiorProp: prop,
            floorPoint: floorPt,
          });
          return;
        }
      }

      const hits = raycaster.intersectObjects(cachedTargets.bins, false);
      if (hits.length > 0) {
        const alloc = hitMeshesRef.current.get(hits[0].object) ?? null;
        if (alloc) onSelectBinRef.current(alloc);
        handler({
          clientX: e.clientX,
          clientY: e.clientY,
          binAlloc: alloc,
          interiorProp: null,
          floorPoint: floorPt,
        });
        return;
      }

      handler({
        clientX: e.clientX,
        clientY: e.clientY,
        binAlloc: null,
        interiorProp: null,
        floorPoint: floorPt,
      });
    };

    const onDoubleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const cachedTargets = hitTargetsCacheRef.current;

      let focusPoint: THREE.Vector3 | null = null;
      let focusDist = 2.8;

      const cargoHits = raycaster.intersectObjects(cachedTargets.cargo, false);
      if (cargoHits.length > 0) {
        focusPoint = cargoHits[0].point.clone();
        focusDist = 1.85;
      }

      if (!focusPoint) {
        const binHits = raycaster.intersectObjects(cachedTargets.bins, false);
        if (binHits.length > 0) {
          const alloc = hitMeshesRef.current.get(binHits[0].object);
          if (alloc) {
            focusPoint = new THREE.Vector3(
              alloc.bin.xMeters,
              alloc.bin.zMeters + alloc.bin.binHeightCm / 200,
              alloc.bin.yMeters
            );
            focusDist = 2.75;
          }
        }
      }

      if (!focusPoint) {
        const propHits = raycaster.intersectObjects(cachedTargets.props, false);
        if (propHits.length > 0) {
          focusPoint = propHits[0].point.clone();
          focusDist = 3.0;
        }
      }

      if (!focusPoint) {
        const obsHits = raycaster.intersectObjects(cachedTargets.obstacles, false);
        if (obsHits.length > 0) {
          focusPoint = obsHits[0].point.clone();
          focusDist = 3.1;
        }
      }

      if (!focusPoint && raycaster.ray.intersectPlane(floorPlane, floorHitVec)) {
        const curDist = camera.position.distanceTo(controls.target);
        if (curDist < baseCameraDistRef.current * 0.58) {
          focusPoint = new THREE.Vector3(floorHitVec.x * 0.35 + controls.target.x * 0.65, 1.35, floorHitVec.z * 0.35 + controls.target.z * 0.65);
          focusDist = baseCameraDistRef.current;
        } else {
          focusPoint = new THREE.Vector3(floorHitVec.x, 0.8, floorHitVec.z);
          focusDist = Math.max(2.2, curDist * 0.52);
        }
      }

      if (focusPoint) {
        const viewDir = camera.position.clone().sub(controls.target);
        if (viewDir.lengthSq() < 0.001) {
          viewDir.set(1, 0.65, 1);
        }
        viewDir.normalize();
        const nextPos = focusPoint.clone().addScaledVector(viewDir, focusDist);
        nextPos.y = Math.max(0.55, nextPos.y);
        cameraGoalRef.current = {
          target: focusPoint,
          position: nextPos,
        };
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (
        animateRouteRef.current &&
        routeCurveRef.current &&
        pickerMarkerRef.current
      ) {
        const t = (elapsed * 0.14 * routeSpeedRef.current) % 1;
        const pos = routeCurveRef.current.getPointAt(t);
        pickerMarkerRef.current.position.copy(pos);
        pickerMarkerRef.current.visible = true;

        if (followPickerCamRef.current) {
          const aheadT = (t + 0.035) % 1;
          const aheadPos = routeCurveRef.current.getPointAt(aheadT);
          const followTarget = new THREE.Vector3(
            aheadPos.x,
            Math.max(0.95, pos.y + 0.25),
            aheadPos.z
          );
          const followCamPos = new THREE.Vector3(
            pos.x + 2.45,
            Math.max(2.35, pos.y + 1.55),
            pos.z + 2.65
          );
          camera.position.lerp(followCamPos, 0.085);
          controls.target.lerp(followTarget, 0.11);
        }
      } else if (pickerMarkerRef.current) {
        pickerMarkerRef.current.visible = false;
      }

      if (cameraGoalRef.current && !followPickerCamRef.current) {
        const goal = cameraGoalRef.current;
        camera.position.lerp(goal.position, 0.22);
        controls.target.lerp(goal.target, 0.24);
        if (
          camera.position.distanceTo(goal.position) < 0.02 &&
          controls.target.distanceTo(goal.target) < 0.02
        ) {
          camera.position.copy(goal.position);
          controls.target.copy(goal.target);
          cameraGoalRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      if (hoverRafId) cancelAnimationFrame(hoverRafId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onCancelAutoGlide);
      controls.removeEventListener('change', onControlsChange);
      renderer.domElement.removeEventListener('wheel', onCancelAutoGlide);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);
      disposeObjectTree(envGroup);
      disposeObjectTree(dynamicGroup);
      disposeObjectTree(selectionOverlayGroup);
      dragGhostGeo.dispose();
      dragGhostMat.dispose();
      pickerGeo.dispose();
      pickerMat.dispose();
      controls.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const effTop = sceneBg.useThemeDefault
      ? theme.scene.background
      : sceneBg.skyTopColor;
    const effHorizon = sceneBg.useThemeDefault
      ? theme.scene.fog
      : sceneBg.skyHorizonColor;
    const effFloor = sceneBg.useThemeDefault
      ? theme.scene.floor
      : sceneBg.floorColor;

    if (scene) {
      scene.background = getSkyGradientTexture(effTop, effHorizon);
      scene.fog =
        sceneBg.fogDensityPct > 0
          ? new THREE.FogExp2(effHorizon, (sceneBg.fogDensityPct / 100) * 0.035)
          : null;
    }
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = sceneBg.exposure;
      if (rendererRef.current.shadowMap.enabled !== sceneBg.enableShadows) {
        rendererRef.current.shadowMap.enabled = sceneBg.enableShadows;
        rendererRef.current.shadowMap.needsUpdate = true;
      }
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = sceneBg.ambientIntensity;
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.color.set(effHorizon);
      hemiLightRef.current.groundColor.set(effFloor);
      hemiLightRef.current.intensity = sceneBg.ambientIntensity * 0.72;
    }
    if (keyLightRef.current) {
      keyLightRef.current.intensity = sceneBg.sunIntensity;
      keyLightRef.current.castShadow = sceneBg.enableShadows;
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = sceneBg.sunIntensity * 0.58;
    }
    if (pickerMarkerRef.current) {
      const mat = pickerMarkerRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(theme.scene.route);
      mat.emissive.set(theme.scene.route);
    }
  }, [theme, sceneBg]);

  useEffect(() => {
    const envGroup = environmentGroupRef.current;
    if (!envGroup) return;

    disposeObjectTree(envGroup);
    envGroup.clear();

    const effFloor = sceneBg.useThemeDefault
      ? theme.scene.floor
      : sceneBg.floorColor;
    const effGridMajor = sceneBg.useThemeDefault
      ? theme.scene.gridMajor
      : sceneBg.gridMajorColor;
    const effGridMinor = sceneBg.useThemeDefault
      ? theme.scene.gridMinor
      : sceneBg.gridMinorColor;

    const spanSize = Math.max(64, bounds.width + 32, bounds.depth + 32);
    const floorGeo = new THREE.PlaneGeometry(spanSize, spanSize);
    const floorRoughness =
      sceneBg.floorStyle === 'glossy_tile'
        ? 0.35
        : sceneBg.floorStyle === 'warm_wood'
          ? 0.58
          : 0.82;
    const floorMetalness = sceneBg.floorStyle === 'glossy_tile' ? 0.18 : 0.08;
    const floorMat = new THREE.MeshStandardMaterial({
      color: effFloor,
      roughness: floorRoughness,
      metalness: floorMetalness,
    });
    const gridAnchorX = Math.round(centerX);
    const gridAnchorZ = Math.round(centerZ);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(gridAnchorX, 0, gridAnchorZ);
    floor.receiveShadow = true;
    envGroup.add(floor);

    if (sceneBg.showGrid) {
      const grid = new THREE.GridHelper(
        spanSize,
        Math.round(spanSize),
        effGridMajor,
        effGridMinor
      );
      grid.position.set(gridAnchorX, 0.005, gridAnchorZ);
      envGroup.add(grid);
    }

    if (config.floorWidthM && config.floorDepthM) {
      const fw = config.floorWidthM;
      const fd = config.floorDepthM;
      const boundaryGeo = new THREE.BoxGeometry(fw, 0.02, fd);
      const boundaryEdges = new THREE.EdgesGeometry(boundaryGeo);
      const boundaryMat = new THREE.LineBasicMaterial({ color: theme.accent });
      const boundaryWire = new THREE.LineSegments(boundaryEdges, boundaryMat);
      boundaryWire.position.set(-1.0 + fw / 2, 0.02, -1.0 + fd / 2);
      envGroup.add(boundaryWire);
      boundaryGeo.dispose();
    }
  }, [
    bounds.width,
    bounds.depth,
    config.floorWidthM,
    config.floorDepthM,
    centerX,
    centerZ,
    theme,
    sceneBg,
  ]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.zoomToCursor = wheelZoomStyle === 'cursor';
    }
  }, [wheelZoomStyle]);

  const maxTopY = React.useMemo(() => {
    let top = Math.max(2.6, config.levels * 0.85);
    for (const a of allocations) {
      const binTop = a.bin.zMeters + a.bin.binHeightCm / 100;
      if (binTop > top) top = binTop;
    }
    return top;
  }, [allocations, config.levels]);

  const computeSmartFitCameraGoal = React.useCallback(
    (presetOverride?: 'iso' | 'top' | 'elevation' | 'closeup') => {
      const camera = cameraRef.current;
      const activePreset = presetOverride ?? cameraPreset;
      const aspect = camera ? Math.max(0.65, camera.aspect) : 1.5;
      const vFovRad = THREE.MathUtils.degToRad(camera ? camera.fov : 45);
      const halfTan = Math.tan(vFovRad / 2);
      const aspectBoost = aspect < 1.25 ? 1.25 / aspect : 1;

      const maxSpanXZ = Math.max(bounds.width, bounds.depth, 7.5);
      const fitDistIso = Math.max(
        5.4,
        ((maxSpanXZ * 0.52) / halfTan) * 0.56 * aspectBoost,
        maxTopY * 1.58
      );
      const defaultTargetY = Math.max(1.1, maxTopY * 0.4);

      const defaultIsoPos = new THREE.Vector3(
        centerX + fitDistIso * 0.64,
        Math.max(4.9, maxTopY * 1.12 + fitDistIso * 0.34),
        centerZ + fitDistIso * 0.68
      );
      const defaultIsoTarget = new THREE.Vector3(
        centerX,
        defaultTargetY,
        centerZ
      );

      const baseDist = Math.max(3.6, defaultIsoPos.distanceTo(defaultIsoTarget));
      const goalPos = defaultIsoPos.clone();
      const goalTarget = defaultIsoTarget.clone();

      if (activePreset === 'top') {
        const effSpan = Math.max(bounds.width / aspect, bounds.depth, 7.5);
        const topHeight = Math.max(11.2, (effSpan * 0.52) / halfTan);
        goalPos.set(centerX, topHeight, centerZ + 0.06);
        goalTarget.set(centerX, 0, centerZ);
      } else if (activePreset === 'elevation') {
        const elevSpan = Math.max(bounds.depth / aspect, maxTopY * 1.35, 5.5);
        const elevDist = Math.max(7.2, (elevSpan * 0.58) / halfTan);
        goalPos.set(
          centerX + elevDist,
          Math.max(1.6, maxTopY * 0.46),
          centerZ
        );
        goalTarget.set(centerX, Math.max(1.35, maxTopY * 0.44), centerZ);
      } else if (activePreset === 'closeup') {
        const gzCenterY = (config.goldenZoneMinM + config.goldenZoneMaxM) / 2;
        const goldenSample =
          allocations.find((a) => a.bin.isGoldenZone && a.boxes.length > 0) ??
          allocations.find((a) => a.bin.isGoldenZone) ??
          null;
        const focusX = goldenSample ? goldenSample.bin.xMeters : centerX;
        const focusZ = goldenSample ? goldenSample.bin.yMeters : centerZ;
        goalTarget.set(focusX, Math.max(1.15, gzCenterY), focusZ);
        goalPos.set(
          focusX + 2.45,
          Math.max(1.65, gzCenterY + 0.45),
          focusZ + 2.55
        );
      }

      return { position: goalPos, target: goalTarget, baseDist };
    },
    [
      allocations,
      bounds.depth,
      bounds.width,
      cameraPreset,
      centerX,
      centerZ,
      config.goldenZoneMaxM,
      config.goldenZoneMinM,
      maxTopY,
    ]
  );

  const applySmartOverviewCamera = React.useCallback(
    (presetOverride?: 'iso' | 'top' | 'elevation' | 'closeup') => {
      if (followPickerCamRef.current) {
        followPickerCamRef.current = false;
        setFollowPickerCam(false);
      }
      const { position, target, baseDist } =
        computeSmartFitCameraGoal(presetOverride);
      baseCameraDistRef.current = baseDist;
      cameraGoalRef.current = { position, target };
      const nextDist = Math.max(0.65, position.distanceTo(target));
      setZoomPercent(
        Math.round(Math.max(25, Math.min(350, (baseDist / nextDist) * 100)))
      );
    },
    [computeSmartFitCameraGoal]
  );

  useEffect(() => {
    applySmartOverviewCamera(cameraPreset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraPreset, cameraResetTick]);

  const applyZoomPercent = React.useCallback((nextPct: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (followPickerCamRef.current) {
      followPickerCamRef.current = false;
      setFollowPickerCam(false);
    }

    const clampedPct = Math.max(25, Math.min(350, Math.round(nextPct)));
    const targetDist = Math.max(
      0.65,
      Math.min(85, baseCameraDistRef.current / (clampedPct / 100))
    );
    const activeTarget = cameraGoalRef.current
      ? cameraGoalRef.current.target.clone()
      : controls.target.clone();
    const activePos = cameraGoalRef.current
      ? cameraGoalRef.current.position.clone()
      : camera.position.clone();
    const dir = activePos.sub(activeTarget);
    if (dir.lengthSq() < 0.001) {
      dir.set(1, 0.7, 1);
    }
    dir.normalize();
    const nextPos = activeTarget.clone().addScaledVector(dir, targetDist);
    nextPos.y = Math.max(0.35, nextPos.y);
    cameraGoalRef.current = {
      target: activeTarget,
      position: nextPos,
    };
    setZoomPercent(clampedPct);
  }, []);

  const computeUnobstructedFocusGoal = React.useCallback(
    (
      focusTarget: THREE.Vector3,
      objectDiagM: number,
      anchorXY?: { x: number; z: number }
    ) => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const vFovRad = THREE.MathUtils.degToRad(camera ? camera.fov : 45);
      const aspect = camera ? Math.max(0.65, camera.aspect) : 1.5;
      const aspectScale = aspect < 1.2 ? 1.2 / aspect : 1;

      const focusDist = Math.max(
        1.55,
        Math.min(
          14,
          (objectDiagM / (2 * Math.tan(vFovRad / 2))) * 1.48 * aspectScale
        )
      );

      const curDir =
        camera && controls
          ? camera.position.clone().sub(controls.target)
          : new THREE.Vector3(1, 0.55, 1);
      if (curDir.lengthSq() < 0.001) curDir.set(1, 0.55, 1);
      const curHoriz = new THREE.Vector2(curDir.x, curDir.z);
      if (curHoriz.lengthSq() < 0.001) curHoriz.set(1, 1);
      curHoriz.normalize();

      if (!anchorXY) {
        const viewDir = new THREE.Vector3(
          curHoriz.x,
          0.48,
          curHoriz.y
        ).normalize();
        const nextPos = focusTarget.clone().addScaledVector(viewDir, focusDist);
        nextPos.y = Math.max(focusTarget.y + 0.4, nextPos.y);
        return { target: focusTarget, position: nextPos };
      }

      const candidates: Array<[number, number]> = [
        [1, 0.36],
        [-1, 0.36],
        [1, -0.36],
        [-1, -0.36],
        [0.42, -1],
        [-0.42, -1],
        [0.42, 1],
        [-0.42, 1],
      ];

      let bestVec = new THREE.Vector2(curHoriz.x, curHoriz.y);
      let bestScore = -Infinity;

      for (const [cx, cz] of candidates) {
        const dir2d = new THREE.Vector2(cx, cz).normalize();
        const camX = anchorXY.x + dir2d.x * focusDist * 0.88;
        const camZ = anchorXY.z + dir2d.y * focusDist * 0.88;
        const midX = (anchorXY.x + camX) * 0.5;
        const midZ = (anchorXY.z + camZ) * 0.5;

        let penalty = 0;
        for (const other of allocations) {
          const ob = other.bin;
          if (
            Math.abs(ob.xMeters - anchorXY.x) < 0.16 &&
            Math.abs(ob.yMeters - anchorXY.z) < 0.16
          ) {
            continue;
          }
          const halfW = ob.binWidthCm / 200 + 0.22;
          const halfL = ob.binLengthCm / 200 + 0.22;
          if (
            Math.abs(camX - ob.xMeters) < halfW &&
            Math.abs(camZ - ob.yMeters) < halfL
          ) {
            penalty += 12;
          } else if (
            Math.abs(midX - ob.xMeters) < halfW &&
            Math.abs(midZ - ob.yMeters) < halfL
          ) {
            penalty += 8;
          }
        }

        const alignBonus = dir2d.dot(curHoriz) * 2.5;
        const aisleSideBonus = Math.abs(dir2d.x) > 0.75 ? 1.2 : 0;
        const score = alignBonus + aisleSideBonus - penalty;
        if (score > bestScore) {
          bestScore = score;
          bestVec = dir2d;
        }
      }

      const finalDir = new THREE.Vector3(
        bestVec.x,
        0.42,
        bestVec.y
      ).normalize();
      const nextPos = focusTarget.clone().addScaledVector(finalDir, focusDist);
      nextPos.y = Math.max(focusTarget.y + 0.38, 0.65, nextPos.y);
      return { target: focusTarget, position: nextPos };
    },
    [allocations]
  );

  const handleFocusSelectedObject = React.useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (followPickerCamRef.current) {
      followPickerCamRef.current = false;
      setFollowPickerCam(false);
    }

    let focusTarget: THREE.Vector3 | null = null;
    let objectDiagM = 1.9;
    let anchorXY: { x: number; z: number } | undefined;

    if (selectedBinId) {
      const selAlloc = allocations.find((a) => a.bin.id === selectedBinId);
      if (selAlloc) {
        const { bin } = selAlloc;
        const binW_m = bin.binWidthCm / 100;
        const binH_m = bin.binHeightCm / 100;
        const binL_m = bin.binLengthCm / 100;
        anchorXY = { x: bin.xMeters, z: bin.yMeters };

        if (selectedCargo && selectedCargo.binId === bin.id) {
          const targetBox =
            selAlloc.boxes[selectedCargo.boxIndex] ??
            selAlloc.boxes.find((b) => b.skuId === selectedCargo.skuId) ??
            null;
          if (targetBox) {
            const wM = targetBox.widthCm / 100;
            const hM = targetBox.heightCm / 100;
            const lM = targetBox.lengthCm / 100;
            focusTarget = new THREE.Vector3(
              bin.xMeters - binW_m / 2 + targetBox.yCm / 100 + wM / 2,
              bin.zMeters + targetBox.zCm / 100 + hM / 2,
              bin.yMeters - binL_m / 2 + targetBox.xCm / 100 + lM / 2
            );
            objectDiagM = Math.max(0.85, Math.hypot(wM, hM, lM) * 1.45);
          }
        }

        if (!focusTarget) {
          focusTarget = new THREE.Vector3(
            bin.xMeters,
            bin.zMeters + binH_m / 2,
            bin.yMeters
          );
          objectDiagM = Math.max(1.55, Math.hypot(binW_m, binH_m, binL_m));
        }
      }
    }

    if (!focusTarget && selectedPropId) {
      const props = getEffectiveInteriorProps({
        scenarioName,
        config,
        bounds,
        depotX,
        depotZ,
      });
      const foundProp = props.find((p) => p.id === selectedPropId);
      if (foundProp) {
        focusTarget = new THREE.Vector3(
          foundProp.xMeters,
          0.95,
          foundProp.yMeters
        );
        objectDiagM = 2.15 * Math.max(0.8, foundProp.scale || 1);
      }
    }

    if (!focusTarget && selectedObstacleId) {
      const foundObs = (config.obstacles ?? []).find(
        (o) => o.id === selectedObstacleId
      );
      if (foundObs) {
        focusTarget = new THREE.Vector3(
          foundObs.xMeters,
          1.35,
          foundObs.yMeters
        );
        objectDiagM = 2.25;
      }
    }

    if (!focusTarget && selectedDepot) {
      focusTarget = new THREE.Vector3(depotX, 0.55, depotZ);
      objectDiagM = 2.4;
    }

    if (!focusTarget) {
      const goldenAlloc =
        allocations.find((a) => a.bin.isGoldenZone && a.boxes.length > 0) ??
        allocations[0];
      if (goldenAlloc) {
        focusTarget = new THREE.Vector3(
          goldenAlloc.bin.xMeters,
          goldenAlloc.bin.zMeters + goldenAlloc.bin.binHeightCm / 200,
          goldenAlloc.bin.yMeters
        );
        anchorXY = {
          x: goldenAlloc.bin.xMeters,
          z: goldenAlloc.bin.yMeters,
        };
        objectDiagM = 2.2;
      } else {
        focusTarget = new THREE.Vector3(centerX, 1.35, centerZ);
        objectDiagM = 2.8;
      }
    }

    cameraGoalRef.current = computeUnobstructedFocusGoal(
      focusTarget,
      objectDiagM,
      anchorXY
    );
  }, [
    allocations,
    bounds,
    centerX,
    centerZ,
    computeUnobstructedFocusGoal,
    config,
    depotX,
    depotZ,
    scenarioName,
    selectedBinId,
    selectedCargo,
    selectedDepot,
    selectedObstacleId,
    selectedPropId,
  ]);

  useEffect(() => {
    if (cameraFocusTick > 0) {
      handleFocusSelectedObject();
    }
  }, [cameraFocusTick, handleFocusSelectedObject]);

  useEffect(() => {
    const hasSelection = Boolean(
      selectedBinId ||
        selectedCargo ||
        selectedPropId ||
        selectedObstacleId ||
        selectedDepot
    );

    if (autoZoomEnabled && !dragMoveMode) {
      if (hasSelection) {
        handleFocusSelectedObject();
      } else if (hadSelectionRef.current) {
        applySmartOverviewCamera();
      }
    }
    hadSelectionRef.current = hasSelection;
  }, [
    autoZoomEnabled,
    dragMoveMode,
    selectedBinId,
    selectedCargo,
    selectedPropId,
    selectedObstacleId,
    selectedDepot,
    handleFocusSelectedObject,
    applySmartOverviewCamera,
  ]);

  useEffect(() => {
    const sig = `${Math.round(bounds.width * 2)}_${Math.round(
      bounds.depth * 2
    )}_${Math.round(maxTopY * 2)}_${allocations.length}`;
    if (
      prevLayoutSigRef.current &&
      prevLayoutSigRef.current !== sig &&
      autoZoomEnabled &&
      !dragMoveMode &&
      !selectedBinId &&
      !selectedCargo &&
      !selectedPropId &&
      !selectedObstacleId &&
      !selectedDepot
    ) {
      applySmartOverviewCamera();
    }
    prevLayoutSigRef.current = sig;
  }, [
    allocations.length,
    applySmartOverviewCamera,
    autoZoomEnabled,
    bounds.depth,
    bounds.width,
    dragMoveMode,
    maxTopY,
    selectedBinId,
    selectedCargo,
    selectedDepot,
    selectedObstacleId,
    selectedPropId,
  ]);

  useEffect(() => {
    if (prevLevelFilterRef.current === levelFilter) return;
    prevLevelFilterRef.current = levelFilter;
    if (!autoZoomEnabled || dragMoveMode) return;

    if (levelFilter === 'all') {
      applySmartOverviewCamera();
      return;
    }

    const levelBins = allocations.filter((a) => a.bin.level === levelFilter);
    if (levelBins.length === 0) return;

    const avgY =
      levelBins.reduce(
        (sum, a) => sum + a.bin.zMeters + a.bin.binHeightCm / 200,
        0
      ) / levelBins.length;
    const { position } = computeSmartFitCameraGoal('iso');
    const levelTarget = new THREE.Vector3(centerX, avgY, centerZ);
    const dir = position.clone().sub(new THREE.Vector3(centerX, avgY, centerZ));
    if (dir.lengthSq() < 0.001) dir.set(1, 0.55, 1);
    dir.normalize();
    const closerDist = Math.max(5.2, position.distanceTo(levelTarget) * 0.78);
    cameraGoalRef.current = {
      target: levelTarget,
      position: levelTarget.clone().addScaledVector(dir, closerDist),
    };
  }, [
    allocations,
    applySmartOverviewCamera,
    autoZoomEnabled,
    centerX,
    centerZ,
    computeSmartFitCameraGoal,
    dragMoveMode,
    levelFilter,
  ]);

  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    disposeObjectTree(group);
    group.clear();
    hitMeshesRef.current.clear();
    propHitMeshesRef.current.clear();
    obstacleHitMeshesRef.current.clear();
    depotHitMeshesRef.current.clear();
    cargoHitMeshesRef.current.clear();

    const depotGroup = new THREE.Group();
    depotGroup.position.set(depotX, 0, depotZ);
    const depotPadGeo = new THREE.BoxGeometry(2.8, 0.09, 1.15);
    const depotPadMat = new THREE.MeshStandardMaterial({
      color: theme.scene.depot,
      emissive: theme.scene.depot,
      emissiveIntensity: 0.42,
      roughness: 0.35,
    });
    const depotPadMesh = new THREE.Mesh(depotPadGeo, depotPadMat);
    depotPadMesh.position.set(0, 0.045, 0);
    depotGroup.add(depotPadMesh);

    const depotBeaconGeo = new THREE.CylinderGeometry(0.16, 0.22, 0.36, 16);
    const depotBeaconMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.55,
    });
    const depotBeaconMesh = new THREE.Mesh(depotBeaconGeo, depotBeaconMat);
    depotBeaconMesh.position.set(0, 0.24, -0.35);
    depotGroup.add(depotBeaconMesh);

    depotGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        depotHitMeshesRef.current.set(child, {
          xMeters: depotX,
          yMeters: depotZ,
          group: depotGroup,
        });
      }
    });
    group.add(depotGroup);

    const maxPickLoad = Math.max(1, ...allocations.map((a) => a.dailyPickLoad));
    const totalBoxCount = allocations.reduce(
      (sum, a) => sum + a.boxes.length,
      0
    );
    const compactLod = totalBoxCount > 160;
    const maxRackTop = allocations.reduce(
      (max, a) => Math.max(max, a.bin.zMeters + a.bin.binHeightCm / 100),
      3.5
    );
    const postHeight = maxRackTop + 0.25;

    const effRackColor = sceneBg.useThemeDefault
      ? theme.scene.rack
      : sceneBg.rackFrameColor;

    const rackFrameMat = new THREE.MeshStandardMaterial({
      color: effRackColor,
      metalness: 0.45,
      roughness: 0.36,
      transparent: sceneBg.xrayBins,
      opacity: sceneBg.xrayBins ? 0.35 : 1,
    });
    const goldenFrameMat = new THREE.MeshStandardMaterial({
      color: theme.scene.golden,
      emissive: theme.scene.golden,
      emissiveIntensity: 0.25,
      metalness: 0.4,
      roughness: 0.4,
    });

    const colMap = new Map<
      string,
      { x: number; z: number; maxTop: number; wM: number; lM: number }
    >();
    for (const alloc of allocations) {
      const { bin } = alloc;
      const colKey = `${bin.xMeters.toFixed(2)}_${bin.yMeters.toFixed(2)}`;
      const top = bin.zMeters + bin.binHeightCm / 100;
      const existing = colMap.get(colKey);
      if (!existing) {
        colMap.set(colKey, {
          x: bin.xMeters,
          z: bin.yMeters,
          maxTop: top,
          wM: bin.binWidthCm / 100,
          lM: bin.binLengthCm / 100,
        });
      } else {
        if (top > existing.maxTop) existing.maxTop = top;
        if (bin.binWidthCm / 100 > existing.wM) {
          existing.wM = bin.binWidthCm / 100;
        }
        if (bin.binLengthCm / 100 > existing.lM) {
          existing.lM = bin.binLengthCm / 100;
        }
      }
    }

    const dummy = new THREE.Object3D();
    const seenPostCoords = new Set<string>();
    const postTransforms: Array<{ x: number; y: number; z: number; h: number }> = [];
    for (const col of colMap.values()) {
      const colPostH = col.maxTop + 0.18;
      const halfW = col.wM / 2 + 0.03;
      const halfL = col.lM / 2 + 0.03;
      const corners: Array<[number, number]> = [
        [col.x - halfW, col.z - halfL],
        [col.x + halfW, col.z - halfL],
        [col.x - halfW, col.z + halfL],
        [col.x + halfW, col.z + halfL],
      ];
      for (const [px, pz] of corners) {
        const key = `${px.toFixed(2)},${pz.toFixed(2)}_${colPostH.toFixed(2)}`;
        if (seenPostCoords.has(key)) continue;
        seenPostCoords.add(key);
        postTransforms.push({ x: px, y: colPostH / 2, z: pz, h: colPostH });
      }
    }

    if (postTransforms.length > 0) {
      const unitPostGeo = new THREE.BoxGeometry(0.06, 1, 0.06);
      const instancedPosts = new THREE.InstancedMesh(
        unitPostGeo,
        rackFrameMat,
        postTransforms.length
      );
      postTransforms.forEach((pt, idx) => {
        dummy.position.set(pt.x, pt.y, pt.z);
        dummy.scale.set(1, pt.h, 1);
        dummy.updateMatrix();
        instancedPosts.setMatrixAt(idx, dummy.matrix);
      });
      instancedPosts.instanceMatrix.needsUpdate = true;
      group.add(instancedPosts);
    }

    let usedGoldenFrameMat = false;
    if (viewLayer === 'golden_zone' || viewLayer === 'slotting') {
      const bandHeight = Math.max(0.4, config.goldenZoneMaxM - config.goldenZoneMinM);
      const bandCenterY = config.goldenZoneMinM + bandHeight / 2;
      const bandCols = [...colMap.values()].filter(
        (col) => col.maxTop >= config.goldenZoneMinM
      );
      if (bandCols.length > 0) {
        const bandMat = new THREE.MeshBasicMaterial({
          color: theme.scene.golden,
          transparent: true,
          opacity: viewLayer === 'golden_zone' ? 0.14 : 0.05,
          depthWrite: false,
        });
        const unitBandGeo = new THREE.BoxGeometry(1, 1, 1);
        const instancedBands = new THREE.InstancedMesh(
          unitBandGeo,
          bandMat,
          bandCols.length
        );
        bandCols.forEach((col, idx) => {
          dummy.position.set(col.x, bandCenterY + 0.2, col.z);
          dummy.scale.set(col.wM + 0.14, bandHeight + 0.45, col.lM + 0.14);
          dummy.updateMatrix();
          instancedBands.setMatrixAt(idx, dummy.matrix);
        });
        instancedBands.instanceMatrix.needsUpdate = true;
        group.add(instancedBands);
      }
    }

    const regularShelfTransforms: Array<{
      x: number;
      y: number;
      z: number;
      w: number;
      l: number;
    }> = [];
    const goldenShelfTransforms: Array<{
      x: number;
      y: number;
      z: number;
      w: number;
      l: number;
    }> = [];

    for (const alloc of allocations) {
      const { bin } = alloc;
      const binW_m = bin.binWidthCm / 100;
      const binL_m = bin.binLengthCm / 100;
      const binH_m = bin.binHeightCm / 100;
      const levelVisible = levelFilter === 'all' || bin.level === levelFilter;
      const useGoldenShelf = bin.isGoldenZone && levelVisible;
      if (useGoldenShelf) {
        usedGoldenFrameMat = true;
        goldenShelfTransforms.push({
          x: bin.xMeters,
          y: bin.zMeters - 0.02,
          z: bin.yMeters,
          w: binW_m + 0.08,
          l: binL_m + 0.06,
        });
      } else {
        regularShelfTransforms.push({
          x: bin.xMeters,
          y: bin.zMeters - 0.02,
          z: bin.yMeters,
          w: binW_m + 0.08,
          l: binL_m + 0.06,
        });
      }

      const binBoxGeo = new THREE.BoxGeometry(binW_m, binH_m, binL_m);
      let binMat: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;

      if (!levelVisible) {
        binMat = new THREE.MeshBasicMaterial({
          color: theme.scene.floor,
          transparent: true,
          opacity: 0.02,
          depthWrite: false,
        });
      } else if (viewLayer === 'heatmap') {
        const ratio = alloc.dailyPickLoad / maxPickLoad;
        const col =
          alloc.boxes.length > 0
            ? heatColor(ratio)
            : new THREE.Color(theme.scene.rack);
        binMat = new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: alloc.boxes.length > 0 ? 0.35 + ratio * 0.45 : 0,
          transparent: true,
          opacity: alloc.boxes.length > 0 ? 0.28 + ratio * 0.55 : 0.05,
          depthWrite: false,
        });
      } else if (viewLayer === 'golden_zone') {
        const col = alloc.safetyViolation
          ? '#ef4444'
          : alloc.goldenZoneAligned
            ? theme.scene.golden
            : bin.isGoldenZone
              ? theme.scene.golden
              : theme.scene.rack;
        binMat = new THREE.MeshStandardMaterial({
          color: col,
          transparent: true,
          opacity: alloc.boxes.length > 0 ? 0.24 : 0.05,
          depthWrite: false,
        });
      } else {
        binMat = new THREE.MeshBasicMaterial({
          color: alloc.safetyViolation ? '#ef4444' : theme.scene.rack,
          transparent: true,
          opacity: alloc.safetyViolation ? 0.22 : 0.03,
          depthWrite: false,
        });
      }

      const binVolumeMesh = new THREE.Mesh(binBoxGeo, binMat);
      binVolumeMesh.position.set(
        bin.xMeters,
        bin.zMeters + binH_m / 2,
        bin.yMeters
      );
      group.add(binVolumeMesh);
      if (levelVisible) {
        hitMeshesRef.current.set(binVolumeMesh, alloc);
      }

      if (levelVisible && alloc.safetyViolation) {
        const edges = new THREE.EdgesGeometry(binBoxGeo);
        const lineMat = new THREE.LineBasicMaterial({ color: '#f43f5e' });
        const wire = new THREE.LineSegments(edges, lineMat);
        wire.position.copy(binVolumeMesh.position);
        group.add(wire);
      }

      if (levelVisible && viewLayer !== 'heatmap') {
        const originX = bin.xMeters - binW_m / 2;
        const originY = bin.zMeters;
        const originZ = bin.yMeters - binL_m / 2;

        for (let boxIdx = 0; boxIdx < alloc.boxes.length; boxIdx++) {
          const box = alloc.boxes[boxIdx];
          const wM = box.widthCm / 100;
          const hM = box.heightCm / 100;
          const lM = box.lengthCm / 100;

          const cargoGroup = createRichCargoGroup(
            box,
            wM,
            hM,
            lM,
            alloc.safetyViolation,
            sceneBg.showBoxOutlines,
            compactLod
          );
          cargoGroup.position.set(
            originX + box.yCm / 100 + wM / 2,
            originY + box.zCm / 100 + hM / 2,
            originZ + box.xCm / 100 + lM / 2
          );
          cargoGroup.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              cargoHitMeshesRef.current.set(child, {
                alloc,
                box,
                boxIndex: boxIdx,
                cargoGroup,
              });
            }
          });
          group.add(cargoGroup);
        }
      }
    }

    if (regularShelfTransforms.length > 0) {
      const unitShelfGeo = new THREE.BoxGeometry(1, 0.035, 1);
      const instancedRegularShelves = new THREE.InstancedMesh(
        unitShelfGeo,
        rackFrameMat,
        regularShelfTransforms.length
      );
      instancedRegularShelves.receiveShadow = true;
      regularShelfTransforms.forEach((st, idx) => {
        dummy.position.set(st.x, st.y, st.z);
        dummy.scale.set(st.w, 1, st.l);
        dummy.updateMatrix();
        instancedRegularShelves.setMatrixAt(idx, dummy.matrix);
      });
      instancedRegularShelves.instanceMatrix.needsUpdate = true;
      group.add(instancedRegularShelves);
    }

    if (goldenShelfTransforms.length > 0) {
      const unitGoldenShelfGeo = new THREE.BoxGeometry(1, 0.035, 1);
      const instancedGoldenShelves = new THREE.InstancedMesh(
        unitGoldenShelfGeo,
        goldenFrameMat,
        goldenShelfTransforms.length
      );
      instancedGoldenShelves.receiveShadow = true;
      goldenShelfTransforms.forEach((st, idx) => {
        dummy.position.set(st.x, st.y, st.z);
        dummy.scale.set(st.w, 1, st.l);
        dummy.updateMatrix();
        instancedGoldenShelves.setMatrixAt(idx, dummy.matrix);
      });
      instancedGoldenShelves.instanceMatrix.needsUpdate = true;
      group.add(instancedGoldenShelves);
    }

    if (!usedGoldenFrameMat) {
      goldenFrameMat.dispose();
    }
    if (postTransforms.length === 0 && regularShelfTransforms.length === 0) {
      rackFrameMat.dispose();
    }

    const templateProps = buildTemplateEnvironmentProps({
      scenarioName,
      config,
      bounds,
      depotX,
      depotZ,
      maxRackTop,
      accentColor: theme.accent,
      showHeaderSign: sceneBg.showHeaderSign,
      showRoomProps: sceneBg.showRoomProps,
    });
    group.add(templateProps);

    const effectiveProps = sceneBg.showRoomProps
      ? getEffectiveInteriorProps({
          scenarioName,
          config,
          bounds,
          depotX,
          depotZ,
        })
      : (config.interiorProps ?? []);

    for (const prop of effectiveProps) {
      const propMeshGroup = createInteriorPropMesh(prop, false);
      propMeshGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          propHitMeshesRef.current.set(child, prop);
        }
      });
      group.add(propMeshGroup);
    }

    for (const obs of config.obstacles ?? []) {
      const obsGroup = new THREE.Group();
      obsGroup.position.set(obs.xMeters, 0, obs.yMeters);

      const obsGeo = new THREE.BoxGeometry(0.72, postHeight, 0.72);
      const obsMat = new THREE.MeshStandardMaterial({
        color: '#eab308',
        emissive: '#854d0e',
        emissiveIntensity: 0.25,
        roughness: 0.5,
      });
      const pillarMesh = new THREE.Mesh(obsGeo, obsMat);
      pillarMesh.position.set(0, postHeight / 2, 0);
      pillarMesh.castShadow = true;
      obsGroup.add(pillarMesh);

      const baseBumperGeo = new THREE.BoxGeometry(0.84, 0.36, 0.84);
      const baseBumperMat = new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.6,
      });
      const baseBumper = new THREE.Mesh(baseBumperGeo, baseBumperMat);
      baseBumper.position.set(0, 0.18, 0);
      obsGroup.add(baseBumper);

      obsGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          obstacleHitMeshesRef.current.set(child, obs);
        }
      });
      group.add(obsGroup);
    }

    if (pickRoute.length > 0) {
      const corridorZ = Math.min(depotZ + 0.75, 0.85);
      const points: THREE.Vector3[] = [new THREE.Vector3(depotX, 0.35, depotZ)];
      let curX = depotX;
      let curZ = depotZ;

      const appendCorridorTransition = (nextX: number, nextZ: number) => {
        if (Math.abs(nextX - curX) >= 0.35) {
          if (curZ > corridorZ + 0.1) {
            points.push(new THREE.Vector3(curX, 0.35, corridorZ));
          }
          if (nextZ > corridorZ + 0.1 || curZ > corridorZ + 0.1) {
            points.push(new THREE.Vector3(nextX, 0.35, corridorZ));
          }
        }
      };

      const stopNodeGeo = new THREE.SphereGeometry(0.11, 14, 14);
      const stopRingGeo = new THREE.RingGeometry(0.16, 0.23, 24);
      stopRingGeo.rotateX(-Math.PI / 2);
      const stopMat = new THREE.MeshBasicMaterial({
        color: theme.scene.route,
        side: THREE.DoubleSide,
      });

      for (const wp of pickRoute) {
        appendCorridorTransition(wp.xMeters, wp.yMeters);
        const stopY = wp.zMeters + 0.35;
        if (config.equipmentMode === 'asrs_crane') {
          points.push(new THREE.Vector3(wp.xMeters, stopY, wp.yMeters));
        } else {
          points.push(new THREE.Vector3(wp.xMeters, 0.35, wp.yMeters));
          points.push(new THREE.Vector3(wp.xMeters, stopY, wp.yMeters));
          points.push(new THREE.Vector3(wp.xMeters, 0.35, wp.yMeters));
        }

        const stopNode = new THREE.Mesh(stopNodeGeo, stopMat);
        stopNode.position.set(wp.xMeters, stopY, wp.yMeters);
        const stopFloorRing = new THREE.Mesh(stopRingGeo, stopMat);
        stopFloorRing.position.set(wp.xMeters, 0.03, wp.yMeters);
        group.add(stopNode, stopFloorRing);

        curX = wp.xMeters;
        curZ = wp.yMeters;
      }
      if (config.routeReturnToDepot !== false) {
        appendCorridorTransition(depotX, depotZ);
        points.push(new THREE.Vector3(depotX, 0.35, depotZ));
      }

      const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.08);
      routeCurveRef.current = curve;

      const tubeGeo = new THREE.TubeGeometry(curve, 120, 0.045, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: theme.scene.route,
        transparent: true,
        opacity: 0.85,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      group.add(tube);
    } else {
      routeCurveRef.current = null;
    }

    hitTargetsCacheRef.current = {
      bins: Array.from(hitMeshesRef.current.keys()),
      props: Array.from(propHitMeshesRef.current.keys()),
      obstacles: Array.from(obstacleHitMeshesRef.current.keys()),
      depot: Array.from(depotHitMeshesRef.current.keys()),
      cargo: Array.from(cargoHitMeshesRef.current.keys()),
    };
  }, [
    allocations,
    pickRoute,
    config,
    scenarioName,
    bounds,
    viewLayer,
    levelFilter,
    aisleSpacingM,
    baySpacingM,
    centerX,
    centerZ,
    depotX,
    depotZ,
    theme,
    sceneBg,
  ]);

  useEffect(() => {
    const overlayGroup = selectionOverlayGroupRef.current;
    if (!overlayGroup) return;

    disposeObjectTree(overlayGroup);
    overlayGroup.clear();

    if (selectedDepot) {
      const depotRingGeo = new THREE.RingGeometry(1.48, 1.66, 36);
      depotRingGeo.rotateX(-Math.PI / 2);
      const depotRingMat = new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        side: THREE.DoubleSide,
      });
      const depotRing = new THREE.Mesh(depotRingGeo, depotRingMat);
      depotRing.position.set(depotX, 0.035, depotZ);
      overlayGroup.add(depotRing);
    }

    if (selectedObstacleId) {
      const obs = (config.obstacles ?? []).find((o) => o.id === selectedObstacleId);
      if (obs) {
        const ringGeo = new THREE.RingGeometry(0.62, 0.78, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: '#facc15',
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(obs.xMeters, 0.035, obs.yMeters);
        overlayGroup.add(ring);
      }
    }

    if (selectedPropId) {
      const props = getEffectiveInteriorProps({
        scenarioName,
        config,
        bounds,
        depotX,
        depotZ,
      });
      const foundProp = props.find((p) => p.id === selectedPropId);
      if (foundProp) {
        const ringGeo = new THREE.RingGeometry(0.85, 1.02, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: '#10b981',
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(foundProp.xMeters, 0.035, foundProp.yMeters);
        overlayGroup.add(ring);
      }
    }

    if (!selectedBinId) return;
    const selected = allocations.find((a) => a.bin.id === selectedBinId);
    if (!selected) return;

    const { bin } = selected;
    const binW_m = bin.binWidthCm / 100;
    const binH_m = bin.binHeightCm / 100;
    const binL_m = bin.binLengthCm / 100;
    const pos = new THREE.Vector3(
      bin.xMeters,
      bin.zMeters + binH_m / 2,
      bin.yMeters
    );

    const boxGeo = new THREE.BoxGeometry(
      binW_m + 0.02,
      binH_m + 0.02,
      binL_m + 0.02
    );
    const fillMat = new THREE.MeshBasicMaterial({
      color: theme.accent,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    const highlightMesh = new THREE.Mesh(boxGeo, fillMat);
    highlightMesh.position.copy(pos);
    overlayGroup.add(highlightMesh);

    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: theme.accent });
    const wire = new THREE.LineSegments(edges, lineMat);
    wire.position.copy(pos);
    overlayGroup.add(wire);

    if (selectedCargo && selectedCargo.binId === selected.bin.id) {
      const targetBox =
        selected.boxes[selectedCargo.boxIndex] ??
        selected.boxes.find((b) => b.skuId === selectedCargo.skuId) ??
        null;
      if (targetBox) {
        const wM = targetBox.widthCm / 100;
        const hM = targetBox.heightCm / 100;
        const lM = targetBox.lengthCm / 100;
        const originX = bin.xMeters - binW_m / 2;
        const originY = bin.zMeters;
        const originZ = bin.yMeters - binL_m / 2;
        const cargoPos = new THREE.Vector3(
          originX + targetBox.yCm / 100 + wM / 2,
          originY + targetBox.zCm / 100 + hM / 2,
          originZ + targetBox.xCm / 100 + lM / 2
        );
        const cargoHighlightGeo = new THREE.BoxGeometry(
          wM + 0.035,
          hM + 0.035,
          lM + 0.035
        );
        const cargoFillMat = new THREE.MeshBasicMaterial({
          color: '#fbbf24',
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        });
        const cargoHighlightMesh = new THREE.Mesh(
          cargoHighlightGeo,
          cargoFillMat
        );
        cargoHighlightMesh.position.copy(cargoPos);
        overlayGroup.add(cargoHighlightMesh);

        const cargoEdges = new THREE.EdgesGeometry(cargoHighlightGeo);
        const cargoLineMat = new THREE.LineBasicMaterial({ color: '#fde047' });
        const cargoWire = new THREE.LineSegments(cargoEdges, cargoLineMat);
        cargoWire.position.copy(cargoPos);
        overlayGroup.add(cargoWire);
      }
    }
  }, [
    selectedBinId,
    selectedCargo,
    selectedPropId,
    selectedObstacleId,
    selectedDepot,
    allocations,
    bounds,
    config,
    depotX,
    depotZ,
    scenarioName,
    theme.accent,
  ]);

  const handleFitAllCamera = React.useCallback(() => {
    applySmartOverviewCamera('iso');
    onChangeCameraPreset?.('iso');
  }, [applySmartOverviewCamera, onChangeCameraPreset]);

  const handleCycleGoldenZoneZoom = React.useCallback(() => {
    const candidates = allocations.filter(
      (a) => a.bin.isGoldenZone && a.boxes.length > 0
    );
    const pool =
      candidates.length > 0
        ? candidates
        : allocations.filter((a) => a.bin.isGoldenZone);
    if (pool.length === 0) {
      applySmartOverviewCamera('closeup');
      return;
    }
    const nextAlloc = pool[goldenCycleIdxRef.current % pool.length];
    goldenCycleIdxRef.current += 1;
    onSelectProp?.(null);
    onSelectObstacle?.(null);
    onSelectDepot?.(false);
    onSelectCargo?.(null);
    onSelectBin(nextAlloc);
    const target = new THREE.Vector3(
      nextAlloc.bin.xMeters,
      nextAlloc.bin.zMeters + nextAlloc.bin.binHeightCm / 200,
      nextAlloc.bin.yMeters
    );
    const diag = Math.hypot(
      nextAlloc.bin.binWidthCm / 100,
      nextAlloc.bin.binHeightCm / 100,
      nextAlloc.bin.binLengthCm / 100
    );
    cameraGoalRef.current = computeUnobstructedFocusGoal(target, diag, {
      x: nextAlloc.bin.xMeters,
      z: nextAlloc.bin.yMeters,
    });
  }, [
    allocations,
    applySmartOverviewCamera,
    computeUnobstructedFocusGoal,
    onSelectBin,
    onSelectCargo,
    onSelectDepot,
    onSelectObstacle,
    onSelectProp,
  ]);

  const priorityBins = React.useMemo(() => {
    const warnings = allocations.filter(
      (a) => a.safetyViolation || a.cubicUtilizationPct >= 82
    );
    if (warnings.length > 0) return warnings;
    return [...allocations]
      .filter((a) => a.boxes.length > 0)
      .sort((a, b) => b.dailyPickLoad - a.dailyPickLoad)
      .slice(0, 6);
  }, [allocations]);

  const handleCyclePriorityBinZoom = React.useCallback(() => {
    if (priorityBins.length === 0) {
      handleFitAllCamera();
      return;
    }
    const nextAlloc =
      priorityBins[priorityCycleIdxRef.current % priorityBins.length];
    priorityCycleIdxRef.current += 1;
    onSelectProp?.(null);
    onSelectObstacle?.(null);
    onSelectDepot?.(false);
    onSelectCargo?.(null);
    onSelectBin(nextAlloc);
    const target = new THREE.Vector3(
      nextAlloc.bin.xMeters,
      nextAlloc.bin.zMeters + nextAlloc.bin.binHeightCm / 200,
      nextAlloc.bin.yMeters
    );
    const diag = Math.hypot(
      nextAlloc.bin.binWidthCm / 100,
      nextAlloc.bin.binHeightCm / 100,
      nextAlloc.bin.binLengthCm / 100
    );
    cameraGoalRef.current = computeUnobstructedFocusGoal(target, diag, {
      x: nextAlloc.bin.xMeters,
      z: nextAlloc.bin.yMeters,
    });
  }, [
    computeUnobstructedFocusGoal,
    handleFitAllCamera,
    onSelectBin,
    onSelectCargo,
    onSelectDepot,
    onSelectObstacle,
    onSelectProp,
    priorityBins,
  ]);

  const handleToggleFollowPickerCam = React.useCallback(() => {
    setFollowPickerCam((prev) => {
      const next = !prev;
      followPickerCamRef.current = next;
      if (next) {
        cameraGoalRef.current = null;
        if (!animateRoute) {
          onEnableAnimateRoute?.();
        }
      }
      return next;
    });
  }, [animateRoute, onEnableAnimateRoute]);

  const handleCapture3DSnapshotPng = React.useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    renderer.render(scene, camera);
    const glCanvas = renderer.domElement;
    const outW = Math.max(1280, glCanvas.width);
    const outH = Math.max(800, glCanvas.height + 116);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, outW, outH);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, outW, 64);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, outW - 2, 62);

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 20px "Malgun Gothic", "Segoe UI", sans-serif';
    ctx.fillText(
      `CubiSlot 3D Digital Twin — ${scenarioName} (${config.aisles}×${config.baysPerAisle}×Z${config.levels} · ${allocations.length} Bins)`,
      20,
      28
    );

    const occupiedCount = allocations.filter((a) => a.boxes.length > 0).length;
    const totalBoxes = allocations.reduce((s, a) => s + a.boxes.length, 0);
    const avgCubic =
      occupiedCount > 0
        ? (
            allocations
              .filter((a) => a.boxes.length > 0)
              .reduce((s, a) => s + a.cubicUtilizationPct, 0) / occupiedCount
          ).toFixed(1)
        : '0.0';
    const hazards = allocations.filter((a) => a.safetyViolation).length;

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(
      `Bin Spec: ${config.binLengthCm ?? 120}×${config.binWidthCm ?? 90}×${config.binHeightCm ?? 70}cm  |  Golden Zone: ${config.goldenZoneMinM}m~${config.goldenZoneMaxM}m  |  Boxes: ${totalBoxes} (${occupiedCount}/${allocations.length} bins · Avg Fill ${avgCubic}%)  |  Hazards: ${hazards}  |  Zoom: ${zoomPercent}% (${autoZoomEnabled ? 'Auto-Zoom ON' : wheelZoomStyle})`,
      20,
      50
    );

    ctx.drawImage(glCanvas, 0, 64, outW, outH - 116);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, outH - 52, outW, 52);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillText(
      `Equipment: ${config.equipmentMode === 'asrs_crane' ? 'AS/RS Crane (Chebyshev)' : 'Electric Reach-Truck'}  ·  Preset: ${config.optimizationPreset ?? 'balanced'}  ·  6-Axis Co-Pack: ${config.allowRotationAndCoPack !== false ? 'ON' : 'OFF'}  ·  Floor: ${sceneBg.floorColor}  ·  Waypoints: ${pickRoute.length}`,
      20,
      outH - 22
    );

    const dataUrl = outCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    const safeSlug = scenarioName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    a.href = dataUrl;
    a.download = `${safeSlug || 'cubislot-3d'}-setting-snapshot.png`;
    a.click();
  }, [
    allocations,
    autoZoomEnabled,
    config,
    pickRoute.length,
    scenarioName,
    sceneBg.floorColor,
    theme.accent,
    wheelZoomStyle,
    zoomPercent,
  ]);

  const hasWarningBins = allocations.some((a) => a.safetyViolation);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className={`h-full w-full ${
          dragMoveMode || hoveredCargo || hoveredOtherLabel
            ? 'cursor-move'
            : 'cursor-grab active:cursor-grabbing'
        }`}
        title={
          dragMoveMode
            ? ('Drag Move Mode ON: Drag any 3D rack column across the floor · Right-click for menu')
            : ('Click: Smart Auto-Zoom · Click empty floor (Esc): Auto-Pullback · Double-click: Instant Zoom · Wheel: Cursor Zoom')
        }
      />

      {!hoveredBin && !hoveredOtherLabel && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/85 px-2.5 py-1.5 text-[10px] text-slate-200 backdrop-blur">
          {followPickerCam ? (
            <span className="font-bold text-amber-300">
              {'🚀 Following 3D Picker Live (Drag or scroll to resume manual control)'}
            </span>
          ) : autoZoomEnabled ? (
            <span>
              {'✨ Smart Auto-Zoom ON: Click object → Auto-Zoom In · Click empty floor (Esc) → Auto-Pullback · Wheel: Zoom'}
            </span>
          ) : (
            <span>
              {'🖱️ Manual Zoom: Double-click or [F] to focus · Press [A] to enable Smart Auto-Zoom'}
            </span>
          )}
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-20 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-700/90 bg-slate-950/92 px-2.5 py-1.5 text-[10px] text-slate-200 shadow-2xl backdrop-blur">
        <button
          type="button"
          onClick={() => onToggleAutoZoom?.()}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-bold transition ${
            autoZoomEnabled
              ? 'border-emerald-400 bg-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/30'
              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-400 hover:text-emerald-300'
          }`}
          title={
            'Toggle Smart Auto-Zoom (Shortcut A): Auto-zooms to clicked objects, auto-pulls back on empty click, and auto-fits layout changes'
          }
        >
          {autoZoomEnabled
            ? ('✨ Auto-Zoom ON')
            : ('Auto-Zoom OFF')}
        </button>

        <button
          type="button"
          onClick={handleCycleGoldenZoneZoom}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/45 bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300 hover:bg-emerald-500/25"
          title={
            'Click repeatedly to auto-zoom through active Golden Zone shelves'
          }
        >
          {'🎯 Golden Zoom'}
        </button>

        {priorityBins.length > 0 && (
          <button
            type="button"
            onClick={handleCyclePriorityBinZoom}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold transition ${
              hasWarningBins
                ? 'border-rose-500/50 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                : 'border-amber-500/45 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
            }`}
            title={
              'Cycle & auto-zoom through priority / warning shelves'
            }
          >
            {hasWarningBins
              ? (`⚠ Alerts (${priorityBins.length})`)
              : (`🔥 Top Bins`)}
          </button>
        )}

        {pickRoute.length > 0 && (
          <button
            type="button"
            onClick={handleToggleFollowPickerCam}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold transition ${
              followPickerCam
                ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold'
                : 'border-amber-500/45 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
            }`}
            title={
              'Automatically follow the live 3D picker along the warehouse route'
            }
          >
            {followPickerCam
              ? ('🚀 Following')
              : ('🚀 Follow Tour')}
          </button>
        )}

        <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/90 px-1.5 py-0.5">
          <button
            type="button"
            onClick={() =>
              setWheelZoomStyle((prev) =>
                prev === 'cursor' ? 'center' : 'cursor'
              )
            }
            className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-semibold text-cyan-300 hover:border-cyan-400"
            title={
              'Switch mouse wheel zoom anchor (Cursor vs Orbit Center)'
            }
          >
            {wheelZoomStyle === 'cursor'
              ? ('🎯Cursor')
              : ('🧭Center')}
          </button>
          <button
            type="button"
            onClick={() => applyZoomPercent(zoomPercent - 25)}
            className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.2 font-bold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
            title={'Zoom Out (-25%)'}
          >
            −
          </button>
          <input
            type="range"
            min={25}
            max={350}
            step={5}
            value={zoomPercent}
            onChange={(e) => applyZoomPercent(Number(e.target.value))}
            className="h-1.5 w-16 cursor-pointer accent-cyan-400"
            title={
              `Zoom: ${zoomPercent}% (Drag 25%–350%)`
            }
          />
          <button
            type="button"
            onClick={() => applyZoomPercent(zoomPercent + 25)}
            className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.2 font-bold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
            title={'Zoom In (+25%)'}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => applyZoomPercent(zoomPercent >= 160 ? 100 : 180)}
            className="min-w-[38px] rounded bg-slate-800 px-1 py-0.5 text-center font-mono text-[10px] font-bold text-cyan-300 hover:bg-slate-700"
            title={
              'Click to toggle 100% ↔ 180% quick zoom'
            }
          >
            {zoomPercent}%
          </button>
        </div>

        <button
          type="button"
          onClick={handleFocusSelectedObject}
          className="inline-flex items-center gap-1 rounded-md border border-cyan-500/45 bg-cyan-500/15 px-2 py-0.5 font-semibold text-cyan-200 hover:bg-cyan-500/25"
          title={
            'Focus & Zoom in on Selected Object (Shortcut: F or Double-click)'
          }
        >
          {'🔍 Focus (F)'}
        </button>
        <button
          type="button"
          onClick={handleFitAllCamera}
          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-200"
          title={
            'Auto-fit entire warehouse in view (Shortcut: R)'
          }
        >
          {'⛶ Fit All (R)'}
        </button>
        <button
          type="button"
          onClick={handleCapture3DSnapshotPng}
          className="inline-flex items-center gap-1 rounded-md border border-cyan-500/45 bg-cyan-500/15 px-2 py-0.5 font-semibold text-cyan-200 hover:bg-cyan-500/25"
          title={
            'Save current 3D view + Setting/KPI summary banner as a high-res PNG image'
          }
        >
          {'📸 PNG'}
        </button>

        {animateRoute && pickRoute.length > 0 && (
          <div className="flex items-center gap-1 border-l border-slate-700 pl-1.5">
            <span className="font-semibold text-amber-300">
              {`⚡Wave(${pickRoute
                    .reduce((acc, w) => acc + w.stepTimeSec, 0)
                    .toFixed(1)}s):`}
            </span>
            {pickRoute.slice(0, 5).map((wp, idx) => (
              <button
                key={`${wp.binId}-${idx}`}
                type="button"
                onClick={() => {
                  const found = allocations.find((a) => a.bin.id === wp.binId);
                  if (found) {
                    onSelectBin(found);
                    const focusTarget = new THREE.Vector3(
                      found.bin.xMeters,
                      found.bin.zMeters + found.bin.binHeightCm / 200,
                      found.bin.yMeters
                    );
                    const cam = cameraRef.current;
                    const ctrls = controlsRef.current;
                    if (cam && ctrls) {
                      const dir = cam.position.clone().sub(ctrls.target);
                      if (dir.lengthSq() < 0.001) dir.set(1, 0.55, 1);
                      dir.normalize();
                      cameraGoalRef.current = {
                        target: focusTarget,
                        position: focusTarget.clone().addScaledVector(dir, 2.85),
                      };
                    }
                  }
                }}
                className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold transition ${
                  selectedBinId === wp.binId
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-amber-200 hover:bg-amber-500/30'
                }`}
                title={
                  `Pick Stop #${idx + 1}: Bin ${wp.binId} (${wp.skuCode} · ${wp.stepTimeSec}s) — Click to zoom`
                }
              >
                #{idx + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setRouteSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 0.5 : 1))
              }
              className="rounded border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300 hover:bg-amber-500/25"
              title={
                'Cycle 3D Pick Wave Animation Speed (0.5x / 1x / 2x)'
              }
            >
              {routeSpeed}x
            </button>
          </div>
        )}
      </div>

      {hoveredOtherLabel && !hoveredBin && (
        <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-xs rounded-xl border border-emerald-400/50 bg-slate-950/90 p-2.5 text-[11px] text-slate-100 shadow-2xl backdrop-blur">
          <div className="font-bold text-emerald-300">{hoveredOtherLabel}</div>
          <div className="mt-0.5 text-[10px] text-slate-300">
            {'Click: Select & Open Edit Bar · Drag with Mouse: Move Position'}
          </div>
        </div>
      )}

      {hoveredBin && (
        <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-xs rounded-xl border border-cyan-500/40 bg-slate-950/90 p-2.5 text-[11px] text-slate-100 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-cyan-300">
              {`Bin ${hoveredBin.bin.id}`}
            </span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
              Z{hoveredBin.bin.level} ({hoveredBin.bin.zMeters}m)
            </span>
            {hoveredBin.bin.isGoldenZone && (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                {'Golden Zone'}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-300">
            <span>
              {'Cubic'}{' '}
              <strong className="text-white">
                {hoveredBin.cubicUtilizationPct.toFixed(1)}%
              </strong>
            </span>
            <span>
              {'Load'}{' '}
              <strong className="text-white">
                {hoveredBin.currentWeightKg.toFixed(1)}/{hoveredBin.bin.maxWeightKg}kg
              </strong>
            </span>
          </div>
          {dragFitStatus && (
            <div
              className={`mt-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold ${
                dragFitStatus === 'fit'
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : dragFitStatus === 'swap'
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
              }`}
            >
              {dragFitStatus === 'fit'
                ? ('✓ Safe & Fits in this Bin')
                : dragFitStatus === 'swap'
                  ? ('⇄ Near Full: Drop to Auto-Swap with existing item')
                  : ('⚠ Upper-Level Heavy Cargo Warning (>16kg)')}
            </div>
          )}
          {hoveredCargo && !dragFitStatus && (
            <div className="mt-1.5 rounded-md border border-amber-400/50 bg-amber-500/15 px-2 py-1 text-[10px] text-amber-200">
              <div className="font-bold text-amber-300">
                {`Hovered Item: ${hoveredCargo.name.split(' (')[0]} (${hoveredCargo.weightKg}kg)`}
              </div>
              <div className="text-[9px] text-amber-100/80">
                {'Click: Select · Drag: Move 1 · Shift+Drag: Move Batch'}
              </div>
            </div>
          )}
          {hoveredBin.boxes.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1 border-t border-slate-800 pt-1.5">
              {hoveredBin.boxes.slice(0, 4).map((b, i) => {
                const isHovBox =
                  hoveredCargo?.binId === hoveredBin.bin.id &&
                  hoveredCargo?.boxIndex === i;
                return (
                  <span
                    key={`${b.skuId}-${i}`}
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${
                      isHovBox
                        ? 'border border-amber-400 bg-amber-500/25 font-bold text-amber-200'
                        : 'bg-slate-900 text-slate-200'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    {b.name.split(' (')[0].slice(0, 14)}
                  </span>
                );
              })}
              {hoveredBin.boxes.length > 4 && (
                <span className="text-[10px] text-slate-400">
                  +{hoveredBin.boxes.length - 4}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-1 text-[10px] text-slate-400">
              {'Empty reserve shelf (Click / Right-click to pin cargo)'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
