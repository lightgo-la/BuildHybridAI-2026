import type {
  BinAllocation,
  SlottingResult,
  WarehouseConfig,
} from '../types/warehouse';

export interface CadExportOptions {
  includeCartons: boolean;
  includePickRoute: boolean;
  includeLabels: boolean;
  includeElevation: boolean;
  planLevelFilter: number | 'all';
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildOrthogonalPlanRoute2D(
  pickRoute: Array<{ xMeters: number; yMeters: number }>,
  depotX: number,
  depotY: number
): Array<{ x: number; y: number }> {
  const corridorY = Math.min(depotY + 0.75, 0.85);
  const pts: Array<{ x: number; y: number }> = [{ x: depotX, y: depotY }];
  let curX = depotX;
  let curY = depotY;

  const pushTransition = (nextX: number, nextY: number) => {
    if (Math.abs(nextX - curX) >= 0.35) {
      if (curY > corridorY + 0.1) {
        pts.push({ x: curX, y: corridorY });
      }
      pts.push({ x: nextX, y: corridorY });
    }
    pts.push({ x: nextX, y: nextY });
    curX = nextX;
    curY = nextY;
  };

  for (const wp of pickRoute) {
    pushTransition(wp.xMeters, wp.yMeters);
  }
  pushTransition(depotX, depotY);
  return pts;
}

function getBounds(allocations: BinAllocation[], config: WarehouseConfig) {
  const aisleSpacingM = config.aisleSpacingM ?? 3.4;
  const depotX =
    config.depotXMeters ?? ((Math.max(1, config.aisles) - 1) * aisleSpacingM) / 2;
  const depotY = config.depotYMeters ?? 0;

  const xs = [
    ...allocations.map((a) => a.bin.xMeters),
    ...(config.obstacles ?? []).map((o) => o.xMeters),
    depotX,
  ];
  const ys = [
    ...allocations.map((a) => a.bin.yMeters),
    ...(config.obstacles ?? []).map((o) => o.yMeters),
    depotY,
  ];
  const zs = allocations.map((a) => a.bin.zMeters + a.bin.binHeightCm / 100);
  const rawMinX = Math.min(0, ...xs) - 1.2;
  const rawMaxX = Math.max(4, ...xs) + 1.2;
  const rawMinY = Math.min(-1.2, ...ys.map((y) => y - 1.0));
  const rawMaxY = Math.max(6, ...ys) + 1.4;

  const minX = rawMinX;
  const maxX = Math.max(rawMaxX, rawMinX + (config.floorWidthM ?? 0));
  const minY = rawMinY;
  const maxY = Math.max(rawMaxY, rawMinY + (config.floorDepthM ?? 0));
  const maxZ = Math.max(3.5, ...(zs.length ? zs : [3.5])) + 0.5;
  return { minX, maxX, minY, maxY, maxZ, depotX, depotY };
}

function dxfRect(
  layer: string,
  color: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  return [
    '0',
    'POLYLINE',
    '8',
    layer,
    '62',
    String(color),
    '66',
    '1',
    '70',
    '1',
    '0',
    'VERTEX',
    '8',
    layer,
    '10',
    x1.toFixed(4),
    '20',
    y1.toFixed(4),
    '0',
    'VERTEX',
    '8',
    layer,
    '10',
    x2.toFixed(4),
    '20',
    y1.toFixed(4),
    '0',
    'VERTEX',
    '8',
    layer,
    '10',
    x2.toFixed(4),
    '20',
    y2.toFixed(4),
    '0',
    'VERTEX',
    '8',
    layer,
    '10',
    x1.toFixed(4),
    '20',
    y2.toFixed(4),
    '0',
    'SEQEND',
  ].join('\n');
}

function dxfLine(
  layer: string,
  color: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  return [
    '0',
    'LINE',
    '8',
    layer,
    '62',
    String(color),
    '10',
    x1.toFixed(4),
    '20',
    y1.toFixed(4),
    '11',
    x2.toFixed(4),
    '21',
    y2.toFixed(4),
  ].join('\n');
}

function dxfText(
  layer: string,
  color: number,
  x: number,
  y: number,
  height: number,
  text: string
): string {
  const safe = text.replace(/[\r\n]/g, ' ');
  return [
    '0',
    'TEXT',
    '8',
    layer,
    '62',
    String(color),
    '10',
    x.toFixed(4),
    '20',
    y.toFixed(4),
    '40',
    height.toFixed(3),
    '1',
    safe,
  ].join('\n');
}

export function generateWarehouseDXF(
  result: SlottingResult,
  config: WarehouseConfig,
  scenarioName: string,
  options: CadExportOptions
): string {
  const { allocations, pickRoute, kpis } = result;
  const { minX, maxX, minY, maxY, maxZ, depotX, depotY } = getBounds(
    allocations,
    config
  );

  const layers = [
    ['FLOOR_BOUNDARY', 7],
    ['AISLE_RACKS', 8],
    ['GOLDEN_ZONE', 3],
    ['OCCUPIED_BINS', 4],
    ['PACKED_CARTONS', 6],
    ['SAFETY_HAZARD', 1],
    ['DEPOT_IO', 5],
    ['PICK_ROUTE', 2],
    ['ANNOTATIONS', 7],
  ];

  const layerTable = [
    '0',
    'TABLE',
    '2',
    'LAYER',
    '70',
    String(layers.length),
    ...layers.flatMap(([name, col]) => [
      '0',
      'LAYER',
      '2',
      String(name),
      '70',
      '0',
      '62',
      String(col),
      '6',
      'CONTINUOUS',
    ]),
    '0',
    'ENDTAB',
  ].join('\n');

  const entities: string[] = [];

  entities.push(dxfRect('FLOOR_BOUNDARY', 7, minX, minY, maxX, maxY));
  entities.push(
    dxfText(
      'ANNOTATIONS',
      7,
      minX,
      maxY + 0.4,
      0.24,
      `CUBISLOT 2D CAD PLAN (METERS) - ${scenarioName} | Cubic:${kpis.cubicUtilizationPct}% Cycle:${kpis.avgCycleTimeSec}s`
    )
  );

  entities.push(
    dxfRect(
      'DEPOT_IO',
      5,
      depotX - 1.4,
      depotY - 0.55,
      depotX + 1.4,
      depotY + 0.55
    )
  );
  if (options.includeLabels) {
    entities.push(
      dxfText('ANNOTATIONS', 5, depotX - 0.85, depotY - 0.1, 0.16, 'I/O DEPOT')
    );
  }

  for (const obs of config.obstacles ?? []) {
    entities.push(
      dxfRect(
        'SAFETY_HAZARD',
        1,
        obs.xMeters - 0.4,
        obs.yMeters - 0.4,
        obs.xMeters + 0.4,
        obs.yMeters + 0.4
      )
    );
    if (options.includeLabels) {
      entities.push(
        dxfText(
          'ANNOTATIONS',
          1,
          obs.xMeters - 0.35,
          obs.yMeters,
          0.11,
          obs.label || 'PILLAR'
        )
      );
    }
  }

  const colTotalBoxes = new Map<string, number>();
  for (const a of allocations) {
    const colKey = `${a.bin.xMeters.toFixed(2)},${a.bin.yMeters.toFixed(2)}`;
    colTotalBoxes.set(colKey, (colTotalBoxes.get(colKey) ?? 0) + a.boxes.length);
  }

  const planBins =
    options.planLevelFilter === 'all'
      ? (() => {
          const bestByCol = new Map<string, BinAllocation>();
          for (const a of allocations) {
            const colKey = `${a.bin.xMeters.toFixed(2)},${a.bin.yMeters.toFixed(2)}`;
            const cur = bestByCol.get(colKey);
            if (!cur) {
              bestByCol.set(colKey, a);
              continue;
            }
            const scoreAlloc = (x: BinAllocation) =>
              (x.boxes.length > 0 ? 1000 : 0) +
              (x.bin.isGoldenZone ? 300 : 0) +
              x.dailyPickLoad;
            if (scoreAlloc(a) > scoreAlloc(cur)) {
              bestByCol.set(colKey, a);
            }
          }
          return [...bestByCol.values()];
        })()
      : allocations.filter((a) => a.bin.level === options.planLevelFilter);

  const seenColumns = new Set<string>();
  for (const alloc of planBins) {
    const { bin } = alloc;
    const wM = bin.binWidthCm / 100;
    const lM = bin.binLengthCm / 100;
    const x1 = bin.xMeters - wM / 2;
    const y1 = bin.yMeters - lM / 2;
    const x2 = bin.xMeters + wM / 2;
    const y2 = bin.yMeters + lM / 2;

    const colKey = `${bin.xMeters.toFixed(2)},${bin.yMeters.toFixed(2)}`;
    if (!seenColumns.has(colKey)) {
      seenColumns.add(colKey);
      entities.push(dxfRect('AISLE_RACKS', 8, x1, y1, x2, y2));
      if (options.includeLabels) {
        entities.push(
          dxfText(
            'ANNOTATIONS',
            7,
            x1 + 0.05,
            y2 + 0.06,
            0.11,
            `A${bin.aisle}-B${bin.bay}`
          )
        );
      }
    }

    if (alloc.safetyViolation) {
      entities.push(dxfRect('SAFETY_HAZARD', 1, x1 + 0.02, y1 + 0.02, x2 - 0.02, y2 - 0.02));
    } else if (alloc.goldenZoneAligned) {
      entities.push(dxfRect('GOLDEN_ZONE', 3, x1 + 0.02, y1 + 0.02, x2 - 0.02, y2 - 0.02));
    }

    if (options.includeCartons) {
      for (const box of alloc.boxes) {
        const bx1 = x1 + box.yCm / 100;
        const by1 = y1 + box.xCm / 100;
        const bx2 = bx1 + box.widthCm / 100;
        const by2 = by1 + box.lengthCm / 100;
        entities.push(dxfRect('PACKED_CARTONS', 6, bx1, by1, bx2, by2));
      }
    }
  }

  if (options.includePickRoute && pickRoute.length > 0) {
    const pts = buildOrthogonalPlanRoute2D(pickRoute, depotX, depotY);
    for (let i = 0; i < pts.length - 1; i++) {
      entities.push(
        dxfLine('PICK_ROUTE', 2, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y)
      );
    }
  }

  if (options.includeElevation) {
    const elevOffsetX = maxX + 3.0;
    const elevWidth = maxX - minX;
    entities.push(
      dxfRect('FLOOR_BOUNDARY', 7, elevOffsetX + minX, 0, elevOffsetX + maxX, maxZ)
    );
    entities.push(
      dxfText(
        'ANNOTATIONS',
        7,
        elevOffsetX + minX,
        maxZ + 0.35,
        0.2,
        `Z-AXIS ELEVATION VIEW (Golden Zone: ${config.goldenZoneMinM}m - ${config.goldenZoneMaxM}m)`
      )
    );

    entities.push(
      dxfLine(
        'GOLDEN_ZONE',
        3,
        elevOffsetX + minX,
        config.goldenZoneMinM,
        elevOffsetX + minX + elevWidth,
        config.goldenZoneMinM
      )
    );
    entities.push(
      dxfLine(
        'GOLDEN_ZONE',
        3,
        elevOffsetX + minX,
        config.goldenZoneMaxM,
        elevOffsetX + minX + elevWidth,
        config.goldenZoneMaxM
      )
    );

    const frontRowY = allocations.reduce(
      (min, a) => Math.min(min, a.bin.yMeters),
      Infinity
    );
    const frontRowBins = allocations.filter(
      (a) => Math.abs(a.bin.yMeters - frontRowY) <= 0.75
    );
    for (const alloc of frontRowBins) {
      const { bin } = alloc;
      const wM = bin.binWidthCm / 100;
      const hM = bin.binHeightCm / 100;
      const rx1 = elevOffsetX + bin.xMeters - wM / 2;
      const rx2 = elevOffsetX + bin.xMeters + wM / 2;
      const ry1 = bin.zMeters;
      const ry2 = bin.zMeters + hM;
      const layer = alloc.safetyViolation
        ? 'SAFETY_HAZARD'
        : bin.isGoldenZone
          ? 'GOLDEN_ZONE'
          : 'AISLE_RACKS';
      const col = alloc.safetyViolation ? 1 : bin.isGoldenZone ? 3 : 8;
      entities.push(dxfRect(layer, col, rx1, ry1, rx2, ry2));
      if (options.includeLabels) {
        entities.push(
          dxfText('ANNOTATIONS', 7, rx1 + 0.04, ry1 + hM / 2, 0.1, `Z${bin.level}`)
        );
      }
    }
  }

  return [
    '0',
    'SECTION',
    '2',
    'HEADER',
    '9',
    '$ACADVER',
    '1',
    'AC1009',
    '9',
    '$INSUNITS',
    '70',
    '6', // meters
    '0',
    'ENDSEC',
    '0',
    'SECTION',
    '2',
    'TABLES',
    layerTable,
    '0',
    'ENDSEC',
    '0',
    'SECTION',
    '2',
    'ENTITIES',
    ...entities,
    '0',
    'ENDSEC',
    '0',
    'EOF',
  ].join('\n');
}

export function generateWarehouseSVG(
  result: SlottingResult,
  config: WarehouseConfig,
  scenarioName: string,
  options: CadExportOptions
): string {
  const { allocations, pickRoute, kpis } = result;
  const { minX, maxX, minY, maxY, maxZ, depotX, depotY } = getBounds(
    allocations,
    config
  );

  const scale = 46; // px per meter
  const pad = 48;
  const planW = (maxX - minX) * scale;
  const planH = (maxY - minY) * scale;
  const elevW = options.includeElevation ? planW : 0;
  const gap = options.includeElevation ? 48 : 0;
  const totalW = Math.round(pad * 2 + planW + gap + elevW);
  const totalH = Math.round(pad * 2 + Math.max(planH, 320) + 74);

  const px = (xM: number) => pad + (xM - minX) * scale;
  const py = (yM: number) => pad + 42 + (maxY - yM) * scale;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}" style="background:#071326;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">`
  );

  parts.push(`<defs><pattern id="cadgrid" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse"><path d="M ${scale} 0 L 0 0 0 ${scale}" fill="none" stroke="#12294d" stroke-width="0.7"/></pattern></defs>`);
  parts.push(`<rect width="${totalW}" height="${totalH}" fill="url(#cadgrid)" />`);

  parts.push(
    `<rect x="16" y="12" width="${totalW - 32}" height="34" fill="#0b1f3d" stroke="#38bdf8" stroke-width="1"/>`
  );
  const safeScenarioName = escapeXml(scenarioName);
  parts.push(
    `<text x="26" y="33" fill="#e0f2fe" font-size="13" font-weight="bold">CUBISLOT 2D CAD BLUEPRINT · ${safeScenarioName} · [${result.mode === 'optimized_3d' ? '3D OPTIMIZED' : '2D BASELINE'}]</text>`
  );
  parts.push(
    `<text x="${totalW - 26}" y="33" text-anchor="end" fill="#7dd3fc" font-size="11">Cubic: ${kpis.cubicUtilizationPct}% | Cycle: ${kpis.avgCycleTimeSec}s | Golden: ${kpis.goldenZoneHitRatePct}% | Scale 1m=${scale}px</text>`
  );

  parts.push(
    `<rect x="${px(minX)}" y="${py(maxY)}" width="${planW}" height="${planH}" fill="rgba(15,23,42,0.35)" stroke="#60a5fa" stroke-width="1.5"/>`
  );
  parts.push(
    `<text x="${px(minX)}" y="${py(maxY) - 8}" fill="#93c5fd" font-size="11" font-weight="bold">PLAN VIEW (X-Y FLOOR · ${options.planLevelFilter === 'all' ? 'ALL LEVELS' : `Z${options.planLevelFilter}`})</text>`
  );

  const dx1 = px(depotX - 1.4);
  const dy1 = py(depotY + 0.55);
  parts.push(
    `<rect x="${dx1}" y="${dy1}" width="${2.8 * scale}" height="${1.1 * scale}" fill="rgba(2,132,199,0.28)" stroke="#38bdf8" stroke-width="1.5"/>`
  );
  parts.push(
    `<text x="${px(depotX)}" y="${py(depotY) + 4}" text-anchor="middle" fill="#e0f2fe" font-size="10">I/O DEPOT</text>`
  );

  for (const obs of config.obstacles ?? []) {
    const ox = px(obs.xMeters - 0.4);
    const oy = py(obs.yMeters + 0.4);
    const os = 0.8 * scale;
    parts.push(
      `<rect x="${ox}" y="${oy}" width="${os}" height="${os}" fill="rgba(234,179,8,0.25)" stroke="#facc15" stroke-width="1.5"/>`
    );
    parts.push(
      `<line x1="${ox}" y1="${oy}" x2="${ox + os}" y2="${oy + os}" stroke="#facc15" stroke-width="1"/>`
    );
    if (options.includeLabels) {
      parts.push(
        `<text x="${px(obs.xMeters)}" y="${py(obs.yMeters) + 3}" text-anchor="middle" fill="#fef08a" font-size="8">${escapeXml(obs.label || 'PILLAR')}</text>`
      );
    }
  }

  const svgColTotalBoxes = new Map<string, number>();
  for (const a of allocations) {
    const colKey = `${a.bin.xMeters.toFixed(2)},${a.bin.yMeters.toFixed(2)}`;
    svgColTotalBoxes.set(
      colKey,
      (svgColTotalBoxes.get(colKey) ?? 0) + a.boxes.length
    );
  }

  const planBins =
    options.planLevelFilter === 'all'
      ? (() => {
          const bestByCol = new Map<string, BinAllocation>();
          for (const a of allocations) {
            const colKey = `${a.bin.xMeters.toFixed(2)},${a.bin.yMeters.toFixed(2)}`;
            const cur = bestByCol.get(colKey);
            if (!cur) {
              bestByCol.set(colKey, a);
              continue;
            }
            const scoreAlloc = (x: BinAllocation) =>
              (x.boxes.length > 0 ? 1000 : 0) +
              (x.bin.isGoldenZone ? 300 : 0) +
              x.dailyPickLoad;
            if (scoreAlloc(a) > scoreAlloc(cur)) {
              bestByCol.set(colKey, a);
            }
          }
          return [...bestByCol.values()];
        })()
      : allocations.filter((a) => a.bin.level === options.planLevelFilter);

  const drawnCols = new Set<string>();
  for (const alloc of planBins) {
    const { bin } = alloc;
    const wM = bin.binWidthCm / 100;
    const lM = bin.binLengthCm / 100;
    const bx = px(bin.xMeters - wM / 2);
    const by = py(bin.yMeters + lM / 2);
    const bw = wM * scale;
    const bh = lM * scale;
    const colKey = `${bin.xMeters.toFixed(2)},${bin.yMeters.toFixed(2)}`;
    const colBoxes = svgColTotalBoxes.get(colKey) ?? alloc.boxes.length;

    if (!drawnCols.has(colKey)) {
      drawnCols.add(colKey);
      parts.push(
        `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="rgba(30,58,138,0.25)" stroke="#64748b" stroke-width="1"/>`
      );
      if (options.includeLabels) {
        parts.push(
          `<text x="${bx + 3}" y="${by + 11}" fill="#cbd5e1" font-size="8.5" font-weight="bold">A${bin.aisle}-B${bin.bay}${colBoxes > 0 ? ` (${colBoxes})` : ''}</text>`
        );
      }
    }

    if (alloc.safetyViolation) {
      parts.push(
        `<rect x="${bx + 1}" y="${by + 1}" width="${bw - 2}" height="${bh - 2}" fill="none" stroke="#f43f5e" stroke-width="1.5"/>`
      );
    }

    if (options.includeCartons) {
      for (const box of alloc.boxes) {
        const cx = px(bin.xMeters - wM / 2 + box.yCm / 100);
        const cy = py(bin.yMeters - lM / 2 + (box.xCm + box.lengthCm) / 100);
        const cw = (box.widthCm / 100) * scale;
        const ch = (box.lengthCm / 100) * scale;
        parts.push(
          `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="${escapeXml(box.color)}" fill-opacity="0.55" stroke="#e2e8f0" stroke-width="0.6"/>`
        );
      }
    }
  }

  if (options.includePickRoute && pickRoute.length > 0) {
    const orthoPts = buildOrthogonalPlanRoute2D(pickRoute, depotX, depotY);
    const polyPts = orthoPts.map((pt) => `${px(pt.x)},${py(pt.y)}`).join(' ');
    parts.push(
      `<polyline points="${polyPts}" fill="none" stroke="#facc15" stroke-width="2" stroke-dasharray="5,3"/>`
    );
  }

  if (options.includeElevation) {
    const ex0 = pad + planW + gap;
    const eyBottom = pad + 42 + planH;
    const ez = (zM: number) => eyBottom - zM * scale;
    const ex = (xM: number) => ex0 + (xM - minX) * scale;

    parts.push(
      `<text x="${ex0}" y="${py(maxY) - 8}" fill="#93c5fd" font-size="11" font-weight="bold">FRONT ELEVATION (X-Z VERTICAL ZONING)</text>`
    );
    parts.push(
      `<rect x="${ex0}" y="${ez(maxZ)}" width="${planW}" height="${maxZ * scale}" fill="rgba(15,23,42,0.35)" stroke="#60a5fa" stroke-width="1.5"/>`
    );

    const gzTop = ez(config.goldenZoneMaxM + 0.5);
    const gzBottom = ez(config.goldenZoneMinM);
    parts.push(
      `<rect x="${ex0}" y="${gzTop}" width="${planW}" height="${Math.max(10, gzBottom - gzTop)}" fill="rgba(16,185,129,0.16)" stroke="#10b981" stroke-dasharray="4,3" stroke-width="1"/>`
    );

    const frontRowY = allocations.reduce(
      (min, a) => Math.min(min, a.bin.yMeters),
      Infinity
    );
    const frontRowBins = allocations.filter(
      (a) => Math.abs(a.bin.yMeters - frontRowY) <= 0.75
    );
    for (const alloc of frontRowBins) {
      const { bin } = alloc;
      const wM = bin.binWidthCm / 100;
      const hM = bin.binHeightCm / 100;
      const rx = ex(bin.xMeters - wM / 2);
      const ry = ez(bin.zMeters + hM);
      const stroke = alloc.safetyViolation
        ? '#f43f5e'
        : bin.isGoldenZone
          ? '#34d399'
          : '#64748b';
      parts.push(
        `<rect x="${rx}" y="${ry}" width="${wM * scale}" height="${hM * scale}" fill="rgba(30,41,59,0.5)" stroke="${stroke}" stroke-width="1.3"/>`
      );
      if (options.includeLabels) {
        parts.push(
          `<text x="${rx + 4}" y="${ry + hM * scale * 0.55}" fill="#e2e8f0" font-size="9">A${bin.aisle}-Z${bin.level} (${alloc.cubicUtilizationPct.toFixed(0)}%)</text>`
        );
      }
    }
  }

  const footY = totalH - 18;
  parts.push(
    `<text x="16" y="${footY}" fill="#93c5fd" font-size="10">WIDTH: ${(maxX - minX).toFixed(1)}m × DEPTH: ${(maxY - minY).toFixed(1)}m × MAX RACK HEIGHT: ${maxZ.toFixed(1)}m · Generated by CubiSlot 3D</text>`
  );
  parts.push('</svg>');

  return parts.join('\n');
}
