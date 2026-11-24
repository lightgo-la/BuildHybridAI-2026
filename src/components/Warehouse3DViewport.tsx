import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { DesignTheme } from '../data/designThemes';
import type { LangCode } from '../i18n/translations';
import type {
  BinAllocation,
  InteriorProp,
  PickWaypoint,
  ViewLayerMode,
  WarehouseConfig,
} from '../types/warehouse';
import {
  buildTemplateEnvironmentProps,
  createInteriorPropMesh,
  createRichCargoGroup,
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
  levelFilter: number | 'all';
  theme: DesignTheme;
  sceneBg?: Scene3DBackgroundSettings;
  onSelectBin: (alloc: BinAllocation | null) => void;
  onSelectProp?: (propId: string | null) => void;
  onContextAction?: (state: ViewportContextState) => void;
  dragMoveMode?: boolean;
  dragScope?: 'column' | 'whole_template';
  onMoveRackColumn?: (oldX: number, oldY: number, newX: number, newY: number) => void;
  onMoveWholeTemplate?: (dxMeters: number, dyMeters: number) => void;
  onMoveInteriorProp?: (propId: string, newX: number, newY: number) => void;
  cameraPreset: 'iso' | 'top' | 'elevation';
  cameraResetTick?: number;
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
  levelFilter,
  theme,
  sceneBg = DEFAULT_SCENE_3D_BACKGROUND,
  onSelectBin,
  onSelectProp,
  onContextAction,
  dragMoveMode = false,
  dragScope = 'column',
  onMoveRackColumn,
  onMoveWholeTemplate,
  onMoveInteriorProp,
  cameraPreset,
  cameraResetTick = 0,
  animateRoute,
  lang = 'ko',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredBin, setHoveredBin] = useState<BinAllocation | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const hitMeshesRef = useRef<Map<THREE.Object3D, BinAllocation>>(new Map());
  const propHitMeshesRef = useRef<Map<THREE.Object3D, InteriorProp>>(new Map());
  const onContextActionRef = useRef(onContextAction);
  onContextActionRef.current = onContextAction;
  const dragMoveModeRef = useRef(dragMoveMode);
  dragMoveModeRef.current = dragMoveMode;
  const dragScopeRef = useRef(dragScope);
  dragScopeRef.current = dragScope;
  const onMoveRackColumnRef = useRef(onMoveRackColumn);
  onMoveRackColumnRef.current = onMoveRackColumn;
  const onMoveWholeTemplateRef = useRef(onMoveWholeTemplate);
  onMoveWholeTemplateRef.current = onMoveWholeTemplate;
  const onMoveInteriorPropRef = useRef(onMoveInteriorProp);
  onMoveInteriorPropRef.current = onMoveInteriorProp;
  const onSelectPropRef = useRef(onSelectProp);
  onSelectPropRef.current = onSelectProp;

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

  // Compute real 3D space bounds from actual bins, obstacles, depot, and configured floorWidthM/DepthM
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
      0.1,
      140
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
    controls.dampingFactor = 0.07;
    controls.target.set(centerX, 1.8, centerZ);
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 4;
    controls.maxDistance = 42;
    controlsRef.current = controls;

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
      kind: 'rack' | 'prop' | 'whole_template';
      propId?: string;
      propObject?: THREE.Object3D;
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
          (dragScopeRef.current === 'whole_template' || e.shiftKey)
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

        const propTargets = Array.from(propHitMeshesRef.current.keys());
        const propHits = raycaster.intersectObjects(propTargets, false);
        if (propHits.length > 0 && hasFloorHit) {
          const hitMesh = propHits[0].object;
          const prop = propHitMeshesRef.current.get(hitMesh);
          if (prop) {
            onSelectPropRef.current?.(prop.id);
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

        if (dragMoveModeRef.current && hasFloorHit) {
          const targets = Array.from(hitMeshesRef.current.keys());
          const hits = raycaster.intersectObjects(targets, false);
          if (hits.length > 0) {
            const alloc = hitMeshesRef.current.get(hits[0].object);
            if (alloc) {
              controls.enabled = false;
              active3DDrag = {
                kind: 'rack',
                oldX: alloc.bin.xMeters,
                oldY: alloc.bin.yMeters,
                newX: alloc.bin.xMeters,
                newY: alloc.bin.yMeters,
                grabFloorX,
                grabFloorZ,
              };
              dragGhost.scale.set(
                alloc.bin.binWidthCm / 95,
                1,
                alloc.bin.binLengthCm / 125
              );
              dragGhost.position.set(alloc.bin.xMeters, 1.8, alloc.bin.yMeters);
              dragGhost.visible = true;
              onSelectBin(alloc);
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
        raycaster.setFromCamera(pointer, camera);
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
          } else {
            dragGhost.position.set(snapX, 1.8, snapZ);
          }
        }
        return;
      }

      // Skip hover raycasting while orbiting/panning camera with mouse buttons held down
      if (e.buttons !== 0) return;
      if (hoverRafId) return;

      hoverRafId = requestAnimationFrame(() => {
        hoverRafId = 0;
        raycaster.setFromCamera(pointer, camera);
        const targets = Array.from(hitMeshesRef.current.keys());
        const hits = raycaster.intersectObjects(targets, false);
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
      if (active3DDrag) {
        const finished = active3DDrag;
        active3DDrag = null;
        dragGhost.visible = false;
        dynamicGroup.position.set(0, 0, 0);
        controls.enabled = true;
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

      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (dist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const propTargets = Array.from(propHitMeshesRef.current.keys());
      const propHits = raycaster.intersectObjects(propTargets, false);
      if (propHits.length > 0) {
        const prop = propHitMeshesRef.current.get(propHits[0].object) ?? null;
        if (prop) {
          onSelectPropRef.current?.(prop.id);
          return;
        }
      }

      const targets = Array.from(hitMeshesRef.current.keys());
      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0) {
        const alloc = hitMeshesRef.current.get(hits[0].object) ?? null;
        onSelectBin(alloc);
        onSelectPropRef.current?.(null);
      } else {
        onSelectBin(null);
        onSelectPropRef.current?.(null);
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const handler = onContextActionRef.current;
      if (!handler) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const targets = Array.from(hitMeshesRef.current.keys());
      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0) {
        const alloc = hitMeshesRef.current.get(hits[0].object) ?? null;
        if (alloc) onSelectBin(alloc);
        handler({
          clientX: e.clientX,
          clientY: e.clientY,
          binAlloc: alloc,
          floorPoint: null,
        });
        return;
      }

      const hitFloor = raycaster.ray.intersectPlane(floorPlane, floorHitVec);
      handler({
        clientX: e.clientX,
        clientY: e.clientY,
        binAlloc: null,
        floorPoint: hitFloor ? { x: hitFloor.x, z: hitFloor.z } : null,
      });
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

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
        const t = (elapsed * 0.14) % 1;
        const pos = routeCurveRef.current.getPointAt(t);
        pickerMarkerRef.current.position.copy(pos);
        pickerMarkerRef.current.visible = true;
      } else if (pickerMarkerRef.current) {
        pickerMarkerRef.current.visible = false;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      if (hoverRafId) cancelAnimationFrame(hoverRafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
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
  }, [onSelectBin]);

  // Apply 3D Background Studio & Theme colors to scene sky/fog/lighting/marker
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

  // Dynamic floor, grid, space boundary & I/O depot matching 2D Canvas 1:1
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
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(4, 0, 4);
    floor.receiveShadow = true;
    envGroup.add(floor);

    if (sceneBg.showGrid) {
      const grid = new THREE.GridHelper(
        spanSize,
        Math.round(spanSize),
        effGridMajor,
        effGridMinor
      );
      grid.position.set(4, 0.005, 4);
      envGroup.add(grid);
    }

    // Draw explicit 2D-canvas floor boundary frame when floorWidthM / floorDepthM are active
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

    const depotGeo = new THREE.BoxGeometry(2.8, 0.08, 1.1);
    const depotMat = new THREE.MeshStandardMaterial({
      color: theme.scene.depot,
      emissive: theme.scene.depot,
      emissiveIntensity: 0.38,
    });
    const depot = new THREE.Mesh(depotGeo, depotMat);
    depot.position.set(depotX, 0.04, depotZ);
    envGroup.add(depot);
  }, [
    bounds.width,
    bounds.depth,
    config.floorWidthM,
    config.floorDepthM,
    centerX,
    centerZ,
    depotX,
    depotZ,
    theme,
    sceneBg,
    selectedPropId,
  ]);

  // Camera presets & automatic framing when switching maps or applying 2D Canvas edits
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const scaleOffset = Math.max(bounds.width * 0.58, bounds.depth * 0.58, 5.5);

    if (cameraPreset === 'iso') {
      camera.position.set(
        centerX + scaleOffset + 2.0,
        Math.max(6.8, config.levels * 1.45),
        centerZ + scaleOffset + 2.2
      );
      controls.target.set(centerX, Math.max(1.4, config.levels * 0.36), centerZ);
    } else if (cameraPreset === 'top') {
      camera.position.set(centerX, Math.max(15, scaleOffset * 2.2), centerZ + 0.1);
      controls.target.set(centerX, 0, centerZ);
    } else if (cameraPreset === 'elevation') {
      camera.position.set(
        centerX + scaleOffset + 4.5,
        Math.max(2.0, config.levels * 0.42),
        centerZ
      );
      controls.target.set(centerX, Math.max(1.6, config.levels * 0.4), centerZ);
    }
    controls.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraPreset, cameraResetTick]);

  // Rebuild racks, 3D packed boxes, heatmap & pick route
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    disposeObjectTree(group);
    group.clear();
    hitMeshesRef.current.clear();
    propHitMeshesRef.current.clear();

    const maxPickLoad = Math.max(1, ...allocations.map((a) => a.dailyPickLoad));
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

    // Draw per-column rack upright posts matching each column's exact height & dimensions
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
      } else if (top > existing.maxTop) {
        existing.maxTop = top;
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

    // Golden Zone highlight per actual rack column via InstancedMesh (1 draw call for all columns!)
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

        for (const box of alloc.boxes) {
          const wM = box.widthCm / 100;
          const hM = box.heightCm / 100;
          const lM = box.lengthCm / 100;

          const cargoGroup = createRichCargoGroup(
            box,
            wM,
            hM,
            lM,
            alloc.safetyViolation,
            sceneBg.showBoxOutlines
          );
          cargoGroup.position.set(
            originX + box.yCm / 100 + wM / 2,
            originY + box.zCm / 100 + hM / 2,
            originZ + box.xCm / 100 + lM / 2
          );
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

    // Template-Specific 3D Room Architecture, Environment Props & Space Signboard
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

    // User-Placed Interactive 3D Interior Furniture, Appliances, Doors & Windows
    for (const prop of config.interiorProps ?? []) {
      const propMeshGroup = createInteriorPropMesh(
        prop,
        prop.id === selectedPropId
      );
      propMeshGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          propHitMeshesRef.current.set(child, prop);
        }
      });
      group.add(propMeshGroup);
    }

    // Structural Obstacles / Pillars from Map Editor (InstancedMesh - 1 draw call)
    if (config.obstacles && config.obstacles.length > 0) {
      const obsGeo = new THREE.BoxGeometry(0.7, postHeight, 0.7);
      const obsMat = new THREE.MeshStandardMaterial({
        color: '#eab308',
        emissive: '#854d0e',
        emissiveIntensity: 0.25,
        roughness: 0.55,
      });
      const instancedPillars = new THREE.InstancedMesh(
        obsGeo,
        obsMat,
        config.obstacles.length
      );
      instancedPillars.castShadow = true;
      config.obstacles.forEach((obs, idx) => {
        dummy.position.set(obs.xMeters, postHeight / 2, obs.yMeters);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        instancedPillars.setMatrixAt(idx, dummy.matrix);
      });
      instancedPillars.instanceMatrix.needsUpdate = true;
      group.add(instancedPillars);
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

      for (const wp of pickRoute) {
        appendCorridorTransition(wp.xMeters, wp.yMeters);
        if (config.equipmentMode === 'asrs_crane') {
          points.push(new THREE.Vector3(wp.xMeters, wp.zMeters + 0.35, wp.yMeters));
        } else {
          points.push(new THREE.Vector3(wp.xMeters, 0.35, wp.yMeters));
          points.push(new THREE.Vector3(wp.xMeters, wp.zMeters + 0.35, wp.yMeters));
          points.push(new THREE.Vector3(wp.xMeters, 0.35, wp.yMeters));
        }
        curX = wp.xMeters;
        curZ = wp.yMeters;
      }
      appendCorridorTransition(depotX, depotZ);
      points.push(new THREE.Vector3(depotX, 0.35, depotZ));

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
    selectedPropId,
  ]);

  useEffect(() => {
    const overlayGroup = selectionOverlayGroupRef.current;
    if (!overlayGroup) return;

    disposeObjectTree(overlayGroup);
    overlayGroup.clear();

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

    // Smoothly shift OrbitControls focus toward the selected bin when not dragging in 3D
    if (controlsRef.current && !dragMoveModeRef.current) {
      controlsRef.current.target.lerp(pos, 0.45);
      controlsRef.current.update();
    }
  }, [selectedBinId, allocations, theme.accent]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className={`h-full w-full ${
          dragMoveMode
            ? 'cursor-move'
            : 'cursor-grab active:cursor-grabbing'
        }`}
        title={
          dragMoveMode
            ? lang === 'ko'
              ? '3D 드래그 이동 켜짐: 마우스로 선반 기둥을 끌어 위치를 옮기세요 · 우클릭 메뉴'
              : 'Drag Move Mode ON: Drag any 3D rack column across the floor · Right-click for menu'
            : lang === 'ko'
              ? '마우스 드래그: 3D 회전 · 휠: 확대/축소 · 클릭: 칸 상세 · 우클릭: 빠른 편집 메뉴'
              : 'Drag to orbit · Scroll to zoom · Click any bin to inspect · Right-click for menu'
        }
      />

      {/* Live 3D Hover HUD Overlay Card */}
      {hoveredBin && (
        <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-xs rounded-xl border border-cyan-500/40 bg-slate-950/90 p-2.5 text-[11px] text-slate-100 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-cyan-300">
              {lang === 'ko' ? `선반 ${hoveredBin.bin.id}` : `Bin ${hoveredBin.bin.id}`}
            </span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
              Z{hoveredBin.bin.level} ({hoveredBin.bin.zMeters}m)
            </span>
            {hoveredBin.bin.isGoldenZone && (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                {lang === 'ko' ? '골든존 ★' : 'Golden ★'}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-300">
            <span>
              {lang === 'ko' ? '적재율' : 'Cubic'}{' '}
              <strong className="text-white">
                {hoveredBin.cubicUtilizationPct.toFixed(1)}%
              </strong>
            </span>
            <span>
              {lang === 'ko' ? '하중' : 'Load'}{' '}
              <strong className="text-white">
                {hoveredBin.currentWeightKg.toFixed(1)}/{hoveredBin.bin.maxWeightKg}kg
              </strong>
            </span>
          </div>
          {hoveredBin.boxes.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1 border-t border-slate-800 pt-1.5">
              {hoveredBin.boxes.slice(0, 4).map((b, i) => (
                <span
                  key={`${b.skuId}-${i}`}
                  className="inline-flex items-center gap-1 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-200"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: b.color }}
                  />
                  {b.skuCode} ({b.name.slice(0, 10)})
                </span>
              ))}
              {hoveredBin.boxes.length > 4 && (
                <span className="text-[10px] text-slate-400">
                  +{hoveredBin.boxes.length - 4}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-1 text-[10px] text-slate-400">
              {lang === 'ko'
                ? '비어 있는 여유 칸 (클릭·우클릭하여 물품 배치)'
                : 'Empty reserve shelf (Click / Right-click to pin cargo)'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
