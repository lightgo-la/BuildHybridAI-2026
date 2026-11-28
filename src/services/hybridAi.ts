import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  InferenceSource,
} from 'firebase/ai';
import type {
  BinAllocation,
  SlottingResult,
  WarehouseConfig,
} from '../types/warehouse';
import type { FirebaseServicesState } from './firebaseClient';

export type HybridModeChoice =
  | 'prefer_on_device'
  | 'only_on_device'
  | 'prefer_in_cloud'
  | 'only_in_cloud';

export interface ChromeNanoDiagnostics {
  supportedApi: boolean;
  availability: 'readily' | 'after-download' | 'unavailable' | 'unknown';
  detail: string;
}

export interface HybridAIAction {
  id: string;
  labelKo: string;
  labelEn: string;
  kind:
    | 'apply_preset_speed'
    | 'apply_preset_safety'
    | 'apply_preset_density'
    | 'enable_smart_fit'
    | 'switch_3d_optimized'
    | 'switch_view_heatmap'
    | 'switch_view_golden_zone'
    | 'switch_equipment_asrs';
}

export interface HybridAIResponse {
  text: string;
  inferenceSource: InferenceSource | 'local_engine' | 'not_executed';
  requestedMode: HybridModeChoice;
  modelName: string;
  latencyMs: number;
  recommendedBinIds?: string[];
  recommendedActions?: HybridAIAction[];
  error?: string;
}

export function extractBinIdsFromText(text: string): string[] {
  const matches = text.match(/\b(?:C\d+-)?A\d+-B\d+-Z\d+\b/g) ?? [];
  return [...new Set(matches)];
}

export function deriveRecommendedActions(
  prompt: string,
  _context: string,
  text: string,
  config?: WarehouseConfig
): HybridAIAction[] {
  const promptLower = prompt.toLowerCase();
  const combined = `${prompt}\n${text}`.toLowerCase();
  const actions: HybridAIAction[] = [];

  const candidates: Array<{
    regex: RegExp;
    items: HybridAIAction[];
  }> = [
    {
      regex: /heatmap|congest|bottleneck|frequency/,
      items: [
        {
          id: 'act-view-heatmap',
          labelKo: 'Show 3D Pick Heatmap',
          labelEn: 'Show 3D Pick Heatmap',
          kind: 'switch_view_heatmap',
        },
      ],
    },
    {
      regex: /asrs|as\/rs|crane|chebyshev|shuttle/,
      items: [
        {
          id: 'act-equip-asrs',
          labelKo: 'Switch to AS/RS Crane Mode',
          labelEn: 'Switch to AS/RS Crane Mode',
          kind: 'switch_equipment_asrs',
        },
      ],
    },
    {
      regex: /safety|heavy|weight|hazard|z1/,
      items: [
        {
          id: 'act-safety',
          labelKo: 'Apply Max-Safety Preset',
          labelEn: 'Apply Max-Safety Preset',
          kind: 'apply_preset_safety',
        },
      ],
    },
    {
      regex: /speed|cycle|fast|golden|pick/,
      items: [
        {
          id: 'act-speed',
          labelKo: 'Apply Fast-Pick Preset',
          labelEn: 'Apply Fast-Pick Preset',
          kind: 'apply_preset_speed',
        },
        {
          id: 'act-view-golden',
          labelKo: 'Highlight 3D Golden Zone',
          labelEn: 'Highlight 3D Golden Zone',
          kind: 'switch_view_golden_zone',
        },
      ],
    },
    {
      regex: /density|cubic|waste|honeycomb|space/,
      items: [
        {
          id: 'act-density',
          labelKo: 'Apply Max-Density Preset',
          labelEn: 'Apply Max-Density Preset',
          kind: 'apply_preset_density',
        },
        {
          id: 'act-smartfit',
          labelKo: 'Enable 6-Axis Co-Packing',
          labelEn: 'Enable 6-Axis Co-Packing',
          kind: 'enable_smart_fit',
        },
      ],
    },
  ];

  const isAlreadyActive = (act: HybridAIAction): boolean => {
    if (!config) return false;
    if (act.kind === 'enable_smart_fit' && config.allowRotationAndCoPack) {
      return true;
    }
    if (act.kind === 'switch_equipment_asrs' && config.equipmentMode === 'asrs_crane') {
      return true;
    }
    if (act.kind === 'apply_preset_safety' && config.optimizationPreset === 'safety') {
      return true;
    }
    if (act.kind === 'apply_preset_speed' && config.optimizationPreset === 'speed') {
      return true;
    }
    if (act.kind === 'apply_preset_density' && config.optimizationPreset === 'density') {
      return true;
    }
    return false;
  };

  for (const cand of candidates) {
    if (cand.regex.test(promptLower)) {
      actions.push(...cand.items.filter((i) => !isAlreadyActive(i)));
    }
  }
  for (const cand of candidates) {
    if (!cand.regex.test(promptLower) && cand.regex.test(combined)) {
      actions.push(...cand.items.filter((i) => !isAlreadyActive(i)));
    }
  }

  if (actions.length === 0) {
    actions.push({
      id: 'act-opt3d',
      labelKo: 'Switch to 3D Optimized',
      labelEn: 'Switch to 3D Optimized',
      kind: 'switch_3d_optimized',
    });
  }

  const deduped: HybridAIAction[] = [];
  const seen = new Set<string>();
  for (const act of actions) {
    if (!seen.has(act.id)) {
      seen.add(act.id);
      deduped.push(act);
    }
  }
  return deduped.slice(0, 4);
}

const TEXT_IO_LANGUAGE_OPTIONS = {
  expectedInputs: [{ type: 'text' as const, languages: ['en'] }],
  expectedOutputs: [{ type: 'text' as const, languages: ['en'] }],
};

async function tryDirectChromePromptApi(
  systemText: string,
  fullPrompt: string,
  signal?: AbortSignal
): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (signal?.aborted) return null;
  const win = window as unknown as {
    LanguageModel?: {
      create?: (opts?: unknown) => Promise<{
        prompt: (input: string, opts?: unknown) => Promise<string>;
        destroy?: () => void;
      }>;
    };
  };

  if (!win.LanguageModel?.create) return null;

  let session: {
    prompt: (input: string, opts?: unknown) => Promise<string>;
    destroy?: () => void;
  } | null = null;
  try {
    session = await win.LanguageModel.create({
      ...TEXT_IO_LANGUAGE_OPTIONS,
      initialPrompts: [{ role: 'system', content: systemText }],
      ...(signal ? { signal } : {}),
    });
    const out = await session.prompt(
      fullPrompt,
      signal ? { signal } : undefined
    );
    return out;
  } catch {
    return null;
  } finally {
    try {
      session?.destroy?.();
    } catch {
      // ignore session cleanup error
    }
  }
}

export function generateLocalDeterministicAudit(
  prompt: string,
  context: string
): string {
  const binMatches = extractBinIdsFromText(`${context}\n${prompt}`);
  const primaryBins = binMatches.slice(0, 4);
  const binListStr =
    primaryBins.length > 0 ? primaryBins.join(', ') : 'A1-B1-Z2, A1-B2-Z2';

  const lines = context.split('\n');
  const baseLine = lines.find((l) => l.startsWith('Baseline 2D KPIs:')) ?? '';
  const optLine = lines.find((l) => l.startsWith('Optimized 3D KPIs:')) ?? '';
  const deltaLine = lines.find((l) => l.startsWith('3D Improvement Deltas:')) ?? '';
  const topLine = lines.find((l) => l.startsWith('Top Active Bins:')) ?? '';
  const routeLine = lines.find((l) => l.startsWith('Active Pick Route')) ?? '';
  const focusLine = lines.find((l) => l.startsWith('Focused Bin')) ?? '';

  return [
    `[Local On-Device Slotting Engine Quantitative Audit]`,
    `1. **3D Cubic & Golden Zone Telemetry**:`,
    `   - ${optLine || '3D Optimized slotting is active.'}`,
    baseLine ? `   - ${baseLine}` : '',
    deltaLine ? `   - ${deltaLine}` : '',
    `2. **Priority Action Bins & Active Pick Route (Click chip below to focus in 3D)**: **${binListStr}**`,
    topLine ? `   - ${topLine}` : '',
    routeLine ? `   - ${routeLine}` : '',
    focusLine ? `   - ${focusLine}` : '',
    `3. **Recommended Engineering Actions**:`,
    `   - Keep high-velocity Class-A SKUs aligned to Golden Zone shelves (**${primaryBins[0] ?? 'A1-B1-Z2'}**) to minimize mast vertical travel.`,
    `   - Anchor heavy cargo (>16 kg) strictly to Z1–Z2 lower levels to maintain 0 NIOSH rack safety violations.`,
    `   - Enable 6-axis rotation and multi-SKU co-packing to compress honeycombing void waste.`,
  ]
    .filter(Boolean)
    .join('\n');
}

const MODE_MAP: Record<HybridModeChoice, InferenceMode> = {
  prefer_on_device: InferenceMode.PREFER_ON_DEVICE,
  only_on_device: InferenceMode.ONLY_ON_DEVICE,
  prefer_in_cloud: InferenceMode.PREFER_IN_CLOUD,
  only_in_cloud: InferenceMode.ONLY_IN_CLOUD,
};

export async function checkChromeGeminiNanoStatus(): Promise<ChromeNanoDiagnostics> {
  if (typeof window === 'undefined') {
    return {
      supportedApi: false,
      availability: 'unavailable',
      detail: 'Non-browser environment.',
    };
  }
  const win = window as unknown as {
    LanguageModel?: {
      availability?: (opts?: unknown) => Promise<string>;
    };
  };

  try {
    if (win.LanguageModel?.availability) {
      let status: string;
      try {
        status = await win.LanguageModel.availability(TEXT_IO_LANGUAGE_OPTIONS);
      } catch {
        status = await win.LanguageModel.availability();
      }
      const normalized =
        status === 'available' || status === 'readily'
          ? 'readily'
          : status === 'downloadable' ||
              status === 'downloading' ||
              status === 'after-download'
            ? 'after-download'
            : 'unavailable';
      return {
        supportedApi: true,
        availability: normalized,
        detail: `Chrome Prompt API detected (status: ${status})`,
      };
    }

    return {
      supportedApi: false,
      availability: 'unavailable',
      detail:
        'Chrome built-in Gemini Nano Prompt API not detected in this browser. Firebase AI Logic will route to Cloud Fallback when configured.',
    };
  } catch (err) {
    return {
      supportedApi: false,
      availability: 'unknown',
      detail:
        err instanceof Error ? err.message : 'Unable to probe Chrome Prompt API.',
    };
  }
}

export function buildWarehousePromptContext(
  baseline: SlottingResult,
  optimized: SlottingResult,
  config: WarehouseConfig,
  selectedBin: BinAllocation | null
): string {
  const b = baseline.kpis;
  const o = optimized.kpis;

  const cubicDelta = Number((o.cubicUtilizationPct - b.cubicUtilizationPct).toFixed(1));
  const cycleSaved = Number((b.avgCycleTimeSec - o.avgCycleTimeSec).toFixed(1));
  const goldenDelta = Number((o.goldenZoneHitRatePct - b.goldenZoneHitRatePct).toFixed(1));

  const topCongested = [...optimized.allocations]
    .filter((a) => a.boxes.length > 0)
    .sort((a, b) => b.dailyPickLoad - a.dailyPickLoad)
    .slice(0, 4)
    .map(
      (a) =>
        `${a.bin.id} (z=${a.bin.zMeters}m, golden=${a.bin.isGoldenZone}, cubic=${a.cubicUtilizationPct.toFixed(0)}%, picks/day=${a.dailyPickLoad.toFixed(0)}, weight=${a.currentWeightKg.toFixed(1)}/${a.bin.maxWeightKg}kg)`
    )
    .join('; ');

  const binDetail = selectedBin
    ? `Focused Bin ${selectedBin.bin.id}: elevation=${selectedBin.bin.zMeters}m, goldenZone=${selectedBin.bin.isGoldenZone}, cubicUtil=${selectedBin.cubicUtilizationPct.toFixed(1)}%, weight=${selectedBin.currentWeightKg.toFixed(1)}/${selectedBin.bin.maxWeightKg}kg, safetyViolation=${selectedBin.safetyViolation}, SKUs=[${selectedBin.boxes.map((x) => `${x.skuCode}(${x.lengthCm}x${x.widthCm}x${x.heightCm}cm,${x.weightKg}kg)`).join(', ')}]`
    : 'No single bin focused.';

  const isCustomRoute = Boolean(
    config.customRouteBinIds && config.customRouteBinIds.length > 0
  );
  const routeModeLabel = isCustomRoute
    ? `User Custom Pick Route (${config.customRouteBinIds!.length} stops${config.routeReturnToDepot ? ', Return-to-Depot ON' : ''})`
    : 'Auto 3D TSP Pick Route';
  const routeSummary =
    optimized.pickRoute
      .map(
        (wp, idx) =>
          `#${idx + 1} ${wp.binId}(${wp.skuCode}, z=${wp.zMeters}m, +${wp.stepTimeSec}s)`
      )
      .join(' -> ') || 'None';

  return [
    `Warehouse Config: ${config.aisles} aisles x ${config.baysPerAisle} bays x ${config.levels} levels, equipment=${config.equipmentMode}, preset=${config.optimizationPreset ?? 'balanced'}, Golden Zone=${config.goldenZoneMinM}m-${config.goldenZoneMaxM}m.`,
    `Baseline 2D KPIs: CubicUtil=${b.cubicUtilizationPct}%, HoneycombingWaste=${b.honeycombingWastePct}%, AvgCycle=${b.avgCycleTimeSec}s, GoldenZoneHit=${b.goldenZoneHitRatePct}%, ErgonomicsScore=${b.ergonomicsScore}/100, SafetyViolations=${b.safetyViolations}.`,
    `Optimized 3D KPIs: CubicUtil=${o.cubicUtilizationPct}%, HoneycombingWaste=${o.honeycombingWastePct}%, AvgCycle=${o.avgCycleTimeSec}s, GoldenZoneHit=${o.goldenZoneHitRatePct}%, ErgonomicsScore=${o.ergonomicsScore}/100, SafetyViolations=${o.safetyViolations}, UnplacedUnits=${optimized.unplacedUnits}.`,
    `3D Improvement Deltas: CubicUtilDelta=${cubicDelta >= 0 ? '+' : ''}${cubicDelta}%p, CycleTimeSaved=${cycleSaved >= 0 ? '+' : ''}${cycleSaved}s, GoldenZoneHitDelta=${goldenDelta >= 0 ? '+' : ''}${goldenDelta}%p.`,
    `Top Active Bins: ${topCongested}`,
    `Active Pick Route [${routeModeLabel}]: ${routeSummary}`,
    binDetail,
  ].join('\n');
}

const cachedModels = new Map<string, ReturnType<typeof getGenerativeModel>>();

function resolveValidRecommendedBinIds(
  responseText: string,
  context: string
): string[] {
  const contextIds = extractBinIdsFromText(context);
  const validSet = new Set(contextIds);
  const fromResponse = extractBinIdsFromText(responseText).filter(
    (id) => validSet.size === 0 || validSet.has(id)
  );
  if (fromResponse.length > 0) {
    return fromResponse.slice(0, 6);
  }
  return contextIds.slice(0, 4);
}

export async function runHybridWarehouseCopilot(params: {
  firebaseState: FirebaseServicesState;
  prompt: string;
  context: string;
  modeChoice: HybridModeChoice;
  useLiteModel?: boolean;
  config?: WarehouseConfig;
  signal?: AbortSignal;
}): Promise<HybridAIResponse> {
  const {
    firebaseState,
    prompt,
    context,
    modeChoice,
    useLiteModel,
    config,
    signal,
  } = params;
  const start = performance.now();

  const modelName = useLiteModel
    ? firebaseState.remoteParams.liteModelName
    : firebaseState.remoteParams.cloudModelName;

  const systemText =
    'You are CubiSlot 3D AI, a warehouse industrial engineering co-pilot specializing in 3D slotting optimization, Golden Zone ergonomics (0.8m-1.65m), 3D bin packing, and AS/RS Chebyshev kinematics. Give concise, quantitative, actionable recommendations referencing exact bin IDs from the provided telemetry context and KPIs.';

  const fullPrompt = `${context}\n\nEngineer Question:\n${prompt}`;

  if (!firebaseState.app) {
    if (modeChoice === 'prefer_on_device' || modeChoice === 'only_on_device') {
      const nanoOut = await tryDirectChromePromptApi(
        systemText,
        fullPrompt,
        signal
      );
      if (nanoOut) {
        return {
          text: nanoOut,
          inferenceSource: InferenceSource.ON_DEVICE,
          requestedMode: modeChoice,
          modelName: 'chrome-gemini-nano',
          latencyMs: Math.round(performance.now() - start),
          recommendedBinIds: resolveValidRecommendedBinIds(nanoOut, context),
          recommendedActions: deriveRecommendedActions(
            prompt,
            context,
            nanoOut,
            config
          ),
        };
      }
    }

    const localText = generateLocalDeterministicAudit(prompt, context);
    const cloudOnlyError =
      modeChoice === 'only_in_cloud'
        ? 'Force Cloud Gemini requires an active Firebase configuration. Showing local deterministic audit fallback.'
        : undefined;
    return {
      text: localText,
      inferenceSource: 'local_engine',
      requestedMode: modeChoice,
      modelName: 'cubislot-local-heuristic-v1',
      latencyMs: Math.round(performance.now() - start),
      recommendedBinIds: resolveValidRecommendedBinIds(localText, context),
      recommendedActions: deriveRecommendedActions(
        prompt,
        context,
        localText,
        config
      ),
      ...(cloudOnlyError ? { error: cloudOnlyError } : {}),
    };
  }

  try {
    const cacheKey = `${firebaseState.app.options.appId ?? 'default'}_${modeChoice}_${modelName}`;
    let model = cachedModels.get(cacheKey);
    if (!model) {
      const ai = getAI(firebaseState.app, { backend: new GoogleAIBackend() });
      model = getGenerativeModel(ai, {
        mode: MODE_MAP[modeChoice],
        inCloudParams: {
          model: modelName,
          systemInstruction: systemText,
        },
        onDeviceParams: {
          createOptions: {
            ...TEXT_IO_LANGUAGE_OPTIONS,
            initialPrompts: [
              {
                role: 'system',
                content: [{ type: 'text', value: systemText }],
              },
            ],
          },
        },
      });
      cachedModels.set(cacheKey, model);
    }

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();
    const inferenceSource =
      response.inferenceSource ?? InferenceSource.IN_CLOUD;
    const resolvedModelName =
      inferenceSource === InferenceSource.ON_DEVICE
        ? 'chrome-gemini-nano'
        : modelName;

    return {
      text,
      inferenceSource,
      requestedMode: modeChoice,
      modelName: resolvedModelName,
      latencyMs: Math.round(performance.now() - start),
      recommendedBinIds: resolveValidRecommendedBinIds(text, context),
      recommendedActions: deriveRecommendedActions(
        prompt,
        context,
        text,
        config
      ),
    };
  } catch (err) {
    if (modeChoice !== 'only_in_cloud') {
      const nanoOut = await tryDirectChromePromptApi(
        systemText,
        fullPrompt,
        signal
      );
      if (nanoOut) {
        return {
          text: nanoOut,
          inferenceSource: InferenceSource.ON_DEVICE,
          requestedMode: modeChoice,
          modelName: 'chrome-gemini-nano',
          latencyMs: Math.round(performance.now() - start),
          recommendedBinIds: resolveValidRecommendedBinIds(nanoOut, context),
          recommendedActions: deriveRecommendedActions(
            prompt,
            context,
            nanoOut,
            config
          ),
        };
      }
    }

    const localText = generateLocalDeterministicAudit(prompt, context);
    const message = err instanceof Error ? err.message : String(err);
    return {
      text: localText,
      inferenceSource: 'local_engine',
      requestedMode: modeChoice,
      modelName: `local-fallback (${message.slice(0, 48)})`,
      latencyMs: Math.round(performance.now() - start),
      recommendedBinIds: resolveValidRecommendedBinIds(localText, context),
      recommendedActions: deriveRecommendedActions(
        prompt,
        context,
        localText,
        config
      ),
      ...(modeChoice === 'only_in_cloud'
        ? {
            error: `Cloud Gemini inference failed (${message.slice(0, 120)}). Showing local deterministic audit fallback.`,
          }
        : {}),
    };
  }
}
