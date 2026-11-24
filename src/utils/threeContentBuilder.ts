import * as THREE from 'three';
import type {
  InteriorProp,
  PackedBox,
  WarehouseConfig,
} from '../types/warehouse';

export type CargoVisualKind =
  | 'bottle_crate'
  | 'food_container'
  | 'apparel_tote'
  | 'tool_camp_case'
  | 'fragile_tech'
  | 'heavy_pallet'
  | 'shipping_carton';

const textureCache = new Map<string, THREE.CanvasTexture>();
const bannerCache = new Map<string, THREE.CanvasTexture>();
const MAX_CARGO_TEXTURES = 128;
const MAX_BANNER_TEXTURES = 64;

function getLruTexture(
  cache: Map<string, THREE.CanvasTexture>,
  key: string
): THREE.CanvasTexture | undefined {
  const existing = cache.get(key);
  if (!existing) return undefined;
  // Refresh LRU order
  cache.delete(key);
  cache.set(key, existing);
  return existing;
}

function setLruTexture(
  cache: Map<string, THREE.CanvasTexture>,
  key: string,
  tex: THREE.CanvasTexture,
  maxSize: number
): void {
  if (cache.has(key)) {
    cache.delete(key);
  } else if (cache.size >= maxSize) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      const oldestTex = cache.get(oldestKey);
      oldestTex?.dispose();
      cache.delete(oldestKey);
    }
  }
  cache.set(key, tex);
}

export function classifyCargoVisual(box: PackedBox): CargoVisualKind {
  const token = `${box.skuCode} ${box.name}`.toUpperCase();
  if (
    /WTR|WATER|BEV|DRINK|OIL|MILK|DET|SYR|WINE|JUICE|LIQ|생수|음료|세제|우유|오일|시럽/.test(
      token
    )
  ) {
    return 'bottle_crate';
  }
  if (
    /COAT|CLTH|APP|SHRT|JEAN|KNIT|SHOE|BAG|DUV|WARD|TOTE|의류|코트|신발|가방|이불|수건/.test(
      token
    )
  ) {
    return 'apparel_tote';
  }
  if (
    /RICE|GRAIN|CAN|RAM|SNK|KIM|MEAT|FRZ|BEAN|CUP|FLR|BAK|FOOD|PANTRY|쌀|곡물|김치|냉동|원두|간식|통조림/.test(
      token
    )
  ) {
    return 'food_container';
  }
  if (
    /TENT|CAMP|CHR|LNT|DRL|TOOL|TIRE|BAT|JACK|BRK|ENG|GEAR|캠핑|텐트|공구|드릴|타이어/.test(
      token
    )
  ) {
    return 'tool_camp_case';
  }
  if (
    box.fragile ||
    /GPU|PCB|CPU|VAX|MED|LP|CAM|FIG|ESD|DISH|유리|정밀|식기/.test(token)
  ) {
    return 'fragile_tech';
  }
  if (box.weightKg >= 15) {
    return 'heavy_pallet';
  }
  return 'shipping_carton';
}

function drawSurfacePattern(
  ctx: CanvasRenderingContext2D,
  kind: CargoVisualKind
): void {
  ctx.save();
  if (kind === 'shipping_carton' || kind === 'heavy_pallet') {
    // Corrugated cardboard subtle horizontal ribs
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    for (let y = 16; y < 500; y += 10) {
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(498, y);
      ctx.stroke();
    }
  } else if (kind === 'apparel_tote') {
    // Woven fabric cross-hatch grain & dashed seam stitch
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    for (let i = 20; i < 492; i += 14) {
      ctx.beginPath();
      ctx.moveTo(i, 16);
      ctx.lineTo(i, 496);
      ctx.moveTo(16, i);
      ctx.lineTo(496, i);
      ctx.stroke();
    }
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, 460, 460);
  } else if (kind === 'tool_camp_case') {
    // Industrial diamond/ribbed molding bars
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = 36; x < 476; x += 44) {
      ctx.fillRect(x, 24, 18, 464);
    }
  } else if (kind === 'food_container' || kind === 'bottle_crate') {
    // Glossy translucent container reflection diagonal highlight
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, 'rgba(255,255,255,0.26)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.03)');
    grad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(14, 14, 484, 484);
  }
  ctx.restore();
}

function drawDetailedKindIllustration(
  ctx: CanvasRenderingContext2D,
  kind: CargoVisualKind,
  cx: number,
  cy: number
): void {
  ctx.save();
  ctx.strokeStyle = '#f8fafc';
  ctx.fillStyle = 'rgba(248,250,252,0.92)';
  ctx.lineWidth = 4.5;

  if (kind === 'bottle_crate') {
    for (const dx of [-38, 0, 38]) {
      ctx.fillStyle = 'rgba(224,242,254,0.35)';
      ctx.fillRect(cx + dx - 12, cy - 10, 24, 46);
      ctx.strokeRect(cx + dx - 12, cy - 10, 24, 46);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx + dx - 6, cy - 26, 12, 14);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx + dx - 8, cy - 32, 16, 6);
    }
  } else if (kind === 'apparel_tote') {
    ctx.beginPath();
    ctx.arc(cx, cy - 22, 12, Math.PI, 0, false);
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx - 48, cy + 24);
    ctx.lineTo(cx + 48, cy + 24);
    ctx.closePath();
    ctx.stroke();
    ctx.fillRect(cx - 28, cy + 24, 56, 10);
  } else if (kind === 'food_container') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - 38, cy - 30, 76, 12);
    ctx.strokeRect(cx - 32, cy - 16, 64, 50);
    ctx.fillStyle = 'rgba(251,191,36,0.65)';
    ctx.fillRect(cx - 28, cy + 2, 56, 28);
  } else if (kind === 'tool_camp_case') {
    ctx.strokeRect(cx - 44, cy - 12, 88, 46);
    ctx.strokeRect(cx - 18, cy - 26, 36, 14);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 28, cy + 2, 14, 14);
    ctx.fillRect(cx + 14, cy + 2, 14, 14);
  } else if (kind === 'fragile_tech') {
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy - 26);
    ctx.lineTo(cx + 26, cy - 26);
    ctx.lineTo(cx + 16, cy + 4);
    ctx.lineTo(cx - 16, cy + 4);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx, cy + 32);
    ctx.moveTo(cx - 20, cy + 32);
    ctx.lineTo(cx + 20, cy + 32);
    ctx.stroke();
  } else {
    ctx.strokeRect(cx - 36, cy - 22, 72, 50);
    ctx.beginPath();
    ctx.moveTo(cx, cy - 22);
    ctx.lineTo(cx, cy + 28);
    ctx.moveTo(cx - 36, cy + 2);
    ctx.lineTo(cx + 36, cy + 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function getCargoLabelTexture(
  box: PackedBox,
  safetyViolation: boolean
): THREE.CanvasTexture {
  const kind = classifyCargoVisual(box);
  const key = `v2_${box.skuCode}_${box.name}_${box.color}_${box.abcClass}_${box.fragile}_${safetyViolation}_${kind}`;
  const cached = getLruTexture(textureCache, key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseColor = safetyViolation ? '#dc2626' : box.color;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  drawSurfacePattern(ctx, kind);

  // Outer bevel & corner brackets
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.fillRect(16, 16, 480, 480);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, 476, 476);

  if (kind === 'shipping_carton' || kind === 'heavy_pallet') {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.fillRect(228, 18, 56, 476);
  }
  if (box.fragile || kind === 'fragile_tech') {
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(28, 28, 152, 46);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('FRAGILE !', 42, 60);
  }

  drawDetailedKindIllustration(ctx, kind, 256, 136);

  // High-contrast Shipping / Content Label Plaque
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fillRect(34, 224, 444, 252);
  ctx.strokeStyle =
    box.abcClass === 'A' ? '#34d399' : box.abcClass === 'B' ? '#38bdf8' : '#fbbf24';
  ctx.lineWidth = 5;
  ctx.strokeRect(34, 224, 444, 252);

  // Header row: SKU Code + ABC Class Pill
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 42px "Segoe UI", sans-serif';
  ctx.fillText(box.skuCode.slice(0, 11), 54, 282);

  ctx.fillStyle =
    box.abcClass === 'A' ? '#10b981' : box.abcClass === 'B' ? '#0284c7' : '#d97706';
  ctx.fillRect(368, 242, 88, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`CLS ${box.abcClass}`, 376, 277);

  // Full Readable Item Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "Malgun Gothic", "Segoe UI", sans-serif';
  const line1 = box.name.slice(0, 15);
  const line2 = box.name.length > 15 ? box.name.slice(15, 30) : '';
  ctx.fillText(line1, 54, 344);
  if (line2) {
    ctx.font = 'bold 28px "Malgun Gothic", "Segoe UI", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(line2, 54, 382);
  }

  // Weight + Dimensions + Barcode
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(
    `${box.weightKg}kg · ${box.lengthCm}×${box.widthCm}×${box.heightCm}cm`,
    54,
    442
  );

  ctx.fillStyle = '#f8fafc';
  for (let bx = 372; bx < 456; bx += 7) {
    ctx.fillRect(bx, 404, bx % 2 === 0 ? 4 : 2, 48);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  setLruTexture(textureCache, key, tex, MAX_CARGO_TEXTURES);
  return tex;
}

export function createRichCargoGroup(
  box: PackedBox,
  wM: number,
  hM: number,
  lM: number,
  safetyViolation: boolean,
  showBoxOutlines = true
): THREE.Group {
  const itemGroup = new THREE.Group();
  const kind = classifyCargoVisual(box);
  const labelTex = getCargoLabelTexture(box, safetyViolation);

  const safeW = Math.max(0.05, wM - 0.018);
  const safeH = Math.max(0.05, hM - 0.015);
  const safeL = Math.max(0.05, lM - 0.018);

  const mainGeo = new THREE.BoxGeometry(safeW, safeH, safeL);
  const mainMat = new THREE.MeshStandardMaterial({
    map: labelTex,
    roughness: kind === 'food_container' || kind === 'bottle_crate' ? 0.22 : 0.36,
    metalness: kind === 'tool_camp_case' ? 0.25 : 0.08,
  });
  const mainMesh = new THREE.Mesh(mainGeo, mainMat);
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  itemGroup.add(mainMesh);

  if (showBoxOutlines) {
    const edgeGeo = new THREE.EdgesGeometry(mainGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: safetyViolation ? '#fecaca' : '#0f172a',
    });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    itemGroup.add(edgeLines);
  }

  if (kind === 'bottle_crate') {
    // 6 detailed 3D bottles (translucent body + colored cap) protruding from top
    const bodyR = Math.min(safeW, safeL) * 0.11;
    const bodyH = Math.min(0.055, safeH * 0.26);
    const bodyGeo = new THREE.CylinderGeometry(bodyR * 0.85, bodyR, bodyH, 12);
    const capGeo = new THREE.CylinderGeometry(bodyR * 0.55, bodyR * 0.55, bodyH * 0.35, 10);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#bae6fd',
      transparent: true,
      opacity: 0.82,
      roughness: 0.15,
    });
    const capMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.3 });

    const xOffsets = [-safeW * 0.26, 0, safeW * 0.26];
    const zOffsets = [-safeL * 0.22, safeL * 0.22];
    for (const dx of xOffsets) {
      for (const dz of zOffsets) {
        const bMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bMesh.position.set(dx, safeH / 2 + bodyH * 0.4, dz);
        const cMesh = new THREE.Mesh(capGeo, capMat);
        cMesh.position.set(dx, safeH / 2 + bodyH * 0.88, dz);
        itemGroup.add(bMesh, cMesh);
      }
    }
  } else if (kind === 'heavy_pallet' || box.weightKg >= 15) {
    // 3-runner wooden pallet base + twin tension straps
    const runnerGeo = new THREE.BoxGeometry(safeW * 0.14, 0.028, safeL * 1.02);
    const deckGeo = new THREE.BoxGeometry(safeW * 1.03, 0.014, safeL * 1.03);
    const woodMat = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.75 });
    for (const rx of [-safeW * 0.38, 0, safeW * 0.38]) {
      const rMesh = new THREE.Mesh(runnerGeo, woodMat);
      rMesh.position.set(rx, -safeH / 2 + 0.014, 0);
      itemGroup.add(rMesh);
    }
    const dMesh = new THREE.Mesh(deckGeo, woodMat);
    dMesh.position.set(0, -safeH / 2 + 0.028, 0);
    itemGroup.add(dMesh);

    const strapGeo = new THREE.BoxGeometry(0.018, safeH * 1.02, safeL * 1.025);
    const strapMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.4 });
    for (const sx of [-safeW * 0.24, safeW * 0.24]) {
      const strap = new THREE.Mesh(strapGeo, strapMat);
      strap.position.set(sx, 0, 0);
      itemGroup.add(strap);
    }
  } else if (kind === 'apparel_tote' || kind === 'food_container') {
    // Molded lid + 2 side snap-lock clip handles
    const lidGeo = new THREE.BoxGeometry(
      safeW * 1.04,
      Math.min(0.028, safeH * 0.13),
      safeL * 1.04
    );
    const lidMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.25,
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.set(0, safeH / 2, 0);
    itemGroup.add(lid);

    const clipGeo = new THREE.BoxGeometry(0.018, Math.min(0.05, safeH * 0.24), safeL * 0.28);
    const clipMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.3 });
    for (const cx of [-safeW * 0.52, safeW * 0.52]) {
      const clip = new THREE.Mesh(clipGeo, clipMat);
      clip.position.set(cx, safeH * 0.42, 0);
      itemGroup.add(clip);
    }
  } else if (kind === 'tool_camp_case') {
    // Rugged top handle arch + twin metallic latches
    const handleGeo = new THREE.BoxGeometry(safeW * 0.36, 0.025, 0.035);
    const metalMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.8,
      roughness: 0.2,
    });
    const handle = new THREE.Mesh(handleGeo, metalMat);
    handle.position.set(0, safeH / 2 + 0.015, 0);
    itemGroup.add(handle);
  } else if (kind === 'fragile_tech') {
    const rimGeo = new THREE.BoxGeometry(
      safeW * 1.03,
      Math.min(0.024, safeH * 0.11),
      safeL * 1.03
    );
    const rimMat = new THREE.MeshStandardMaterial({
      color: '#f43f5e',
      emissive: '#881337',
      emissiveIntensity: 0.4,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(0, safeH / 2, 0);
    itemGroup.add(rim);
  }

  return itemGroup;
}

function getHeaderBannerTexture(
  title: string,
  subtitle: string,
  accentColor: string
): THREE.CanvasTexture {
  const key = `v2_${title}_${subtitle}_${accentColor}`;
  const cached = getLruTexture(bannerCache, key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.fillRect(0, 0, 1024, 192);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 1012, 180);

  ctx.fillStyle = accentColor;
  ctx.fillRect(24, 28, 16, 136);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 46px "Malgun Gothic", "Segoe UI", sans-serif';
  ctx.fillText(title.slice(0, 36), 58, 86);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 29px "Malgun Gothic", "Segoe UI", sans-serif';
  ctx.fillText(subtitle.slice(0, 58), 58, 144);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  setLruTexture(bannerCache, key, tex, MAX_BANNER_TEXTURES);
  return tex;
}

export function buildTemplateEnvironmentProps(params: {
  scenarioName: string;
  config: WarehouseConfig;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    width: number;
    depth: number;
    centerX: number;
    centerZ: number;
  };
  depotX: number;
  depotZ: number;
  maxRackTop: number;
  accentColor: string;
  showHeaderSign?: boolean;
  showRoomProps?: boolean;
}): THREE.Group {
  const {
    scenarioName,
    config,
    bounds,
    depotX,
    depotZ,
    maxRackTop,
    accentColor,
    showHeaderSign = true,
    showRoomProps = true,
  } = params;
  const propGroup = new THREE.Group();
  const tag = `${scenarioName} ${config.mapTag ?? ''}`.toLowerCase();

  const isEveryday =
    /pantry|closet|fridge|garage|camping|one-room|oneroom|smartstore|hobby|laundry|cafe|office|moving|everyday|팬트리|드레스룸|냉장고|차고|캠핑|원룸|스마트스토어|서재|다용도실|카페|사무실|이삿짐/.test(
      tag
    );

  // 1. 3D Space Title Signboard
  if (showHeaderSign) {
    const signW = Math.min(8.5, Math.max(4.2, bounds.width * 0.55));
    const signH = signW * 0.19;
    const bannerTex = getHeaderBannerTexture(
      scenarioName,
      `${config.mapTag ?? `${config.aisles}×${config.baysPerAisle}×${config.levels}`} · Bin ${config.binLengthCm ?? 120}×${config.binWidthCm ?? 90}×${config.binHeightCm ?? 70}cm · Golden ${config.goldenZoneMinM}m-${config.goldenZoneMaxM}m`,
      accentColor
    );
    const signGeo = new THREE.BoxGeometry(signW, signH, 0.08);
    const signMat = new THREE.MeshBasicMaterial({ map: bannerTex });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(bounds.centerX, maxRackTop + 1.05, bounds.maxZ - 0.3);
    signMesh.rotation.y = Math.PI;
    propGroup.add(signMesh);
  }

  if (!showRoomProps) {
    return propGroup;
  }

  // 2. Cutaway Architectural Back & Side Room Walls (supports cutaway_corner, three_walls, glass_room, open_floor)
  const wallH = maxRackTop + 0.55;
  const backWallW = Math.max(4, bounds.maxX - bounds.minX - 0.6);
  const sideWallD = Math.max(4, bounds.maxZ - bounds.minZ - 0.6);
  const enclosure = config.roomEnclosure ?? 'cutaway_corner';

  if (enclosure !== 'open_floor') {
    const defaultWallCol = /fridge|cold|냉장고/.test(tag)
      ? '#0ea5e9'
      : isEveryday
        ? '#b45309'
        : '#334155';
    const effWallColor = config.wallColor || defaultWallCol;
    const isGlass = enclosure === 'glass_room' || /fridge|cold|냉장고/.test(tag);
    const wallMat = new THREE.MeshStandardMaterial({
      color: effWallColor,
      transparent: true,
      opacity: isGlass ? 0.22 : 0.28,
      roughness: isGlass ? 0.15 : 0.45,
      metalness: isGlass ? 0.3 : 0.08,
    });

    const backWallGeo = new THREE.BoxGeometry(backWallW, wallH, 0.09);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(bounds.centerX, wallH / 2, bounds.maxZ - 0.25);
    propGroup.add(backWall);

    const leftWallGeo = new THREE.BoxGeometry(0.09, wallH, sideWallD);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(bounds.minX + 0.25, wallH / 2, bounds.centerZ);
    propGroup.add(leftWall);

    if (enclosure === 'three_walls' || enclosure === 'glass_room') {
      const rightWall = new THREE.Mesh(leftWallGeo, wallMat);
      rightWall.position.set(bounds.maxX - 0.25, wallH / 2, bounds.centerZ);
      propGroup.add(rightWall);
    }
  }

  // Safe side offset so furniture/vehicles never overlap the center of I/O Depot
  const sidePropX = depotX + 2.35;

  // 2b. 3D Aisle Floor Marker Plates (A1..An) & Z-Level Height Ruler Tower (anchored to actual bounds so they move with Whole-Template 3D drag!)
  const aisleSp = config.aisleSpacingM ?? 3.4;
  const frontMarkerZ = bounds.minZ + 1.05;
  const baseAisleX = bounds.minX + 1.2;
  for (let a = 1; a <= Math.min(8, config.aisles); a++) {
    const ax = baseAisleX + (a - 1) * aisleSp;
    const plateTex = getHeaderBannerTexture(
      `AISLE A${a}`,
      `X = ${ax.toFixed(1)}m`,
      accentColor
    );
    const plateGeo = new THREE.PlaneGeometry(0.95, 0.32);
    const plateMat = new THREE.MeshBasicMaterial({
      map: plateTex,
      side: THREE.DoubleSide,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.rotation.x = -Math.PI / 2;
    plate.position.set(ax, 0.018, frontMarkerZ);
    propGroup.add(plate);
  }

  const levelHeights = [0.05, 0.85, 1.55, 2.35, 3.15, 3.95];
  const rulerX = bounds.minX + 0.35;
  const rulerZ = bounds.minZ + 1.8;
  for (let lvl = 1; lvl <= Math.min(6, config.levels); lvl++) {
    const zm = levelHeights[lvl - 1] ?? (lvl - 1) * 0.82 + 0.05;
    const isGz = zm >= config.goldenZoneMinM && zm <= config.goldenZoneMaxM;
    const lvlTex = getHeaderBannerTexture(
      `Z${lvl} · ${zm.toFixed(2)}m`,
      isGz ? 'GOLDEN ZONE ★' : `LEVEL ${lvl}`,
      isGz ? '#10b981' : accentColor
    );
    const badgeGeo = new THREE.BoxGeometry(0.75, 0.22, 0.04);
    const badgeMat = new THREE.MeshBasicMaterial({ map: lvlTex });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(rulerX, zm + 0.22, rulerZ);
    propGroup.add(badge);
  }

  // 3. Detailed Template-Specific 3D Props
  if (/fridge|cold|냉장고/.test(tag)) {
    const doorGeo = new THREE.BoxGeometry(backWallW * 0.48, wallH * 0.92, 0.05);
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.16,
      roughness: 0.12,
      metalness: 0.35,
    });
    const leftDoor = new THREE.Mesh(doorGeo, glassMat);
    leftDoor.position.set(bounds.centerX - backWallW * 0.25, wallH * 0.46, bounds.minZ + 0.4);
    const rightDoor = new THREE.Mesh(doorGeo, glassMat);
    rightDoor.position.set(bounds.centerX + backWallW * 0.25, wallH * 0.46, bounds.minZ + 0.4);
    propGroup.add(leftDoor, rightDoor);

    const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, wallH * 0.45, 10);
    const handleMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.85,
      roughness: 0.18,
    });
    const h1 = new THREE.Mesh(handleGeo, handleMat);
    h1.position.set(bounds.centerX - 0.14, wallH * 0.46, bounds.minZ + 0.35);
    const h2 = new THREE.Mesh(handleGeo, handleMat);
    h2.position.set(bounds.centerX + 0.14, wallH * 0.46, bounds.minZ + 0.35);
    propGroup.add(h1, h2);
  } else if (/closet|apparel|드레스룸/.test(tag)) {
    const mirrorFrameGeo = new THREE.BoxGeometry(0.88, 1.98, 0.08);
    const mirrorFrameMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      metalness: 0.65,
      roughness: 0.25,
    });
    const mirrorFrame = new THREE.Mesh(mirrorFrameGeo, mirrorFrameMat);
    mirrorFrame.position.set(bounds.minX + 0.55, 0.99, bounds.centerZ);
    mirrorFrame.rotation.y = Math.PI / 2;
    propGroup.add(mirrorFrame);

    const glassGeo = new THREE.BoxGeometry(0.74, 1.84, 0.09);
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#bae6fd',
      metalness: 0.92,
      roughness: 0.06,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.copy(mirrorFrame.position);
    glass.rotation.y = Math.PI / 2;
    propGroup.add(glass);

    const rugGeo = new THREE.BoxGeometry(1.35, 0.02, Math.max(2.4, bounds.depth * 0.52));
    const rugMat = new THREE.MeshStandardMaterial({ color: '#be185d', roughness: 0.9 });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(bounds.centerX, 0.015, bounds.centerZ);
    propGroup.add(rug);
  } else if (/laundry|다용도실/.test(tag)) {
    const washerGeo = new THREE.BoxGeometry(0.85, 1.08, 0.82);
    const washerMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.25,
      metalness: 0.2,
    });
    const washer = new THREE.Mesh(washerGeo, washerMat);
    washer.position.set(depotX - 2.1, 0.54, depotZ + 0.25);
    propGroup.add(washer);

    const drumGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.86, 20);
    drumGeo.rotateX(Math.PI / 2);
    const drumMat = new THREE.MeshStandardMaterial({
      color: '#0284c7',
      metalness: 0.75,
      roughness: 0.12,
    });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.copy(washer.position);
    propGroup.add(drum);
  } else if (/pantry|cafe|kitchen|팬트리|카페/.test(tag)) {
    // Positioned cleanly to the right of Depot with Espresso/Prep Counter Appliances on top
    const tableTopGeo = new THREE.BoxGeometry(1.65, 0.08, 0.82);
    const woodMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.5 });
    const tableTop = new THREE.Mesh(tableTopGeo, woodMat);
    tableTop.position.set(sidePropX, 0.86, depotZ + 0.25);
    const baseGeo = new THREE.BoxGeometry(1.52, 0.82, 0.74);
    const baseMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(sidePropX, 0.41, depotZ + 0.25);

    const machineGeo = new THREE.BoxGeometry(0.52, 0.44, 0.42);
    const machineMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.75,
      roughness: 0.2,
    });
    const machine = new THREE.Mesh(machineGeo, machineMat);
    machine.position.set(sidePropX - 0.35, 1.12, depotZ + 0.25);
    propGroup.add(tableTop, base, machine);
  } else if (/garage|camping|auto|차고|캠핑/.test(tag)) {
    // 5-Drawer Rolling Mechanic Tool Cabinet with Silver Drawer Pulls
    const chestGeo = new THREE.BoxGeometry(1.15, 1.05, 0.64);
    const chestMat = new THREE.MeshStandardMaterial({
      color: '#dc2626',
      metalness: 0.45,
      roughness: 0.32,
    });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(depotX - 2.15, 0.53, depotZ + 0.25);
    propGroup.add(chest);

    const pullGeo = new THREE.BoxGeometry(0.86, 0.04, 0.68);
    const pullMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.8 });
    for (const py of [0.22, 0.42, 0.62, 0.82]) {
      const pull = new THREE.Mesh(pullGeo, pullMat);
      pull.position.set(depotX - 2.15, py, depotZ + 0.25);
      propGroup.add(pull);
    }
  } else if (
    /oneroom|one-room|hobby|office|smartstore|moving|원룸|서재|사무실|스마트스토어|이삿짐/.test(
      tag
    )
  ) {
    const winGeo = new THREE.BoxGeometry(1.85, 1.35, 0.1);
    const winMat = new THREE.MeshStandardMaterial({
      color: '#fef08a',
      emissive: '#facc15',
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.65,
    });
    const winMesh = new THREE.Mesh(winGeo, winMat);
    winMesh.position.set(bounds.centerX, wallH * 0.62, bounds.maxZ - 0.22);
    propGroup.add(winMesh);

    const deskGeo = new THREE.BoxGeometry(1.45, 0.76, 0.72);
    const deskMat = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.55 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(sidePropX, 0.38, depotZ + 0.25);
    propGroup.add(desk);
  } else {
    if (config.equipmentMode === 'asrs_crane' || /as\/rs|shuttle/.test(tag)) {
      const craneX = depotX + (config.aisleSpacingM ?? 3.4) * 0.45;
      const mastGeo = new THREE.BoxGeometry(0.16, maxRackTop + 0.55, 0.16);
      const mastMat = new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        metalness: 0.65,
        roughness: 0.3,
      });
      const mast1 = new THREE.Mesh(mastGeo, mastMat);
      mast1.position.set(craneX, (maxRackTop + 0.55) / 2, bounds.centerZ - 0.45);
      const mast2 = new THREE.Mesh(mastGeo, mastMat);
      mast2.position.set(craneX, (maxRackTop + 0.55) / 2, bounds.centerZ + 0.45);

      const shuttleGeo = new THREE.BoxGeometry(0.88, 0.22, 1.1);
      const shuttleMat = new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#0284c7',
        emissiveIntensity: 0.4,
      });
      const shuttle = new THREE.Mesh(shuttleGeo, shuttleMat);
      shuttle.position.set(craneX, Math.min(maxRackTop * 0.45, 1.35), bounds.centerZ);
      propGroup.add(mast1, mast2, shuttle);
    } else {
      // Detailed 3D Reach-Truck Forklift with Chassis, Overhead Cage, Mast, Forks & 4 Wheels
      const fx = depotX - 2.25;
      const fz = depotZ + 0.2;
      const bodyGeo = new THREE.BoxGeometry(1.05, 0.68, 1.32);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.32,
        metalness: 0.3,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(fx, 0.42, fz);

      const cageGeo = new THREE.BoxGeometry(0.95, 0.9, 1.05);
      const cageEdges = new THREE.EdgesGeometry(cageGeo);
      const cageWire = new THREE.LineSegments(
        cageEdges,
        new THREE.LineBasicMaterial({ color: '#1e293b' })
      );
      cageWire.position.set(fx, 1.2, fz - 0.08);
      cageGeo.dispose();

      const mastGeo = new THREE.BoxGeometry(0.11, 2.05, 0.11);
      const mastMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.75 });
      const m1 = new THREE.Mesh(mastGeo, mastMat);
      m1.position.set(fx + 0.3, 1.05, fz + 0.72);
      const m2 = new THREE.Mesh(mastGeo, mastMat);
      m2.position.set(fx - 0.3, 1.05, fz + 0.72);

      const forkGeo = new THREE.BoxGeometry(0.12, 0.05, 0.92);
      const f1 = new THREE.Mesh(forkGeo, mastMat);
      f1.position.set(fx + 0.24, 0.12, fz + 1.18);
      const f2 = new THREE.Mesh(forkGeo, mastMat);
      f2.position.set(fx - 0.24, 0.12, fz + 1.18);

      const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 14);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.85 });
      for (const [wx, wz] of [
        [fx - 0.54, fz - 0.42],
        [fx + 0.54, fz - 0.42],
        [fx - 0.54, fz + 0.42],
        [fx + 0.54, fz + 0.42],
      ]) {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.position.set(wx, 0.18, wz);
        propGroup.add(w);
      }

      propGroup.add(body, cageWire, m1, m2, f1, f2);
    }
  }

  return propGroup;
}

/**
 * Builds an interactive 3D interior furniture / appliance / door / window mesh
 * that users can click, drag, rotate, scale, recolor, and delete directly in 3D.
 */
export function createInteriorPropMesh(
  prop: InteriorProp,
  isSelected: boolean
): THREE.Group {
  const g = new THREE.Group();
  const mainMat = new THREE.MeshStandardMaterial({
    color: prop.color,
    roughness: 0.38,
    metalness: 0.2,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.25,
    metalness: 0.65,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.5,
  });

  if (prop.type === 'desk_work') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.78), mainMat);
    top.position.set(0, 0.75, 0);
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.72), darkMat);
    leg1.position.set(-0.68, 0.37, 0);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.72), darkMat);
    leg2.position.set(0.68, 0.37, 0);
    const mon = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.38, 0.05),
      new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#0284c7',
        emissiveIntensity: 0.35,
      })
    );
    mon.position.set(0, 1.02, -0.18);
    g.add(top, leg1, leg2, mon);
  } else if (prop.type === 'island_counter') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.85, 0.85), darkMat);
    base.position.set(0, 0.425, 0);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.08, 0.94), mainMat);
    top.position.set(0, 0.89, 0);
    const machine = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.38), accentMat);
    machine.position.set(-0.4, 1.14, 0);
    g.add(base, top, machine);
  } else if (prop.type === 'fridge_unit') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.95, 0.85), mainMat);
    body.position.set(0, 0.975, 0);
    const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 10), accentMat);
    h1.position.set(-0.08, 1.05, 0.45);
    const h2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 10), accentMat);
    h2.position.set(0.08, 1.05, 0.45);
    g.add(body, h1, h2);
  } else if (prop.type === 'washer_dryer') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.1, 0.84), mainMat);
    body.position.set(0, 0.55, 0);
    const drumGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.88, 18);
    drumGeo.rotateX(Math.PI / 2);
    const drum = new THREE.Mesh(
      drumGeo,
      new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.75, roughness: 0.12 })
    );
    drum.position.set(0, 0.55, 0.02);
    g.add(body, drum);
  } else if (prop.type === 'wardrobe_mirror') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.95, 0.08), mainMat);
    frame.position.set(0, 0.98, 0);
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 1.82, 0.1),
      new THREE.MeshStandardMaterial({ color: '#bae6fd', metalness: 0.92, roughness: 0.05 })
    );
    glass.position.set(0, 0.98, 0);
    g.add(frame, glass);
  } else if (prop.type === 'sofa_lounge') {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.42, 0.88), mainMat);
    seat.position.set(0, 0.21, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.52, 0.24), mainMat);
    back.position.set(0, 0.64, -0.32);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.58, 0.88), mainMat);
    armL.position.set(-0.84, 0.34, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.58, 0.88), mainMat);
    armR.position.set(0.84, 0.34, 0);
    g.add(seat, back, armL, armR);
  } else if (prop.type === 'window_frame') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.4, 0.12), darkMat);
    frame.position.set(0, 1.55, 0);
    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(1.68, 1.24, 0.14),
      new THREE.MeshStandardMaterial({
        color: prop.color,
        emissive: prop.color,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.78,
      })
    );
    pane.position.set(0, 1.55, 0);
    g.add(frame, pane);
  } else if (prop.type === 'door_entry') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.15, 0.12), darkMat);
    frame.position.set(0, 1.075, 0);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.98, 2.04, 0.14), mainMat);
    panel.position.set(0, 1.04, 0);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), accentMat);
    handle.position.set(0.36, 1.0, 0.1);
    g.add(frame, panel, handle);
  } else if (prop.type === 'plant_pot') {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.2, 0.45, 14),
      new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.65 })
    );
    pot.position.set(0, 0.225, 0);
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 14), mainMat);
    foliage.position.set(0, 0.82, 0);
    g.add(pot, foliage);
  } else if (prop.type === 'rug_carpet') {
    const rug = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.025, 1.5), mainMat);
    rug.position.set(0, 0.015, 0);
    g.add(rug);
  } else if (prop.type === 'tool_cabinet') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.05, 0.65), mainMat);
    body.position.set(0, 0.525, 0);
    for (const py of [0.24, 0.46, 0.68, 0.88]) {
      const pull = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.045, 0.69), accentMat);
      pull.position.set(0, py, 0);
      g.add(pull);
    }
    g.add(body);
  } else {
    // forklift_unit
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.72, 1.32), mainMat);
    body.position.set(0, 0.42, 0);
    const mast1 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.0, 0.11), darkMat);
    mast1.position.set(0.28, 1.02, 0.7);
    const mast2 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.0, 0.11), darkMat);
    mast2.position.set(-0.28, 1.02, 0.7);
    const fork1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.9), accentMat);
    fork1.position.set(0.24, 0.12, 1.15);
    const fork2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.9), accentMat);
    fork2.position.set(-0.24, 0.12, 1.15);
    g.add(body, mast1, mast2, fork1, fork2);
  }

  if (isSelected) {
    const ringGeo = new THREE.RingGeometry(0.85, 1.02, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#10b981',
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 0.03, 0);
    g.add(ring);
  }

  g.position.set(prop.xMeters, 0, prop.yMeters);
  g.rotation.y = (prop.rotationDeg * Math.PI) / 180;
  g.scale.setScalar(prop.scale || 1);
  return g;
}
