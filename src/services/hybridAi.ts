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
  text: string
): HybridAIAction[] {
  const promptLower = prompt.toLowerCase();
  const combined = `${prompt}\n${text}`.toLowerCase();
  const actions: HybridAIAction[] = [];

  const candidates: Array<{
    regex: RegExp;
    items: HybridAIAction[];
  }> = [
    {
      regex: /heatmap|congest|bottleneck|frequency|히트맵|병목|혼잡|집중/,
      items: [
        {
          id: 'act-view-heatmap',
          labelKo: '3D 피킹 히트맵 보기',
          labelEn: 'Show 3D Pick Heatmap',
          kind: 'switch_view_heatmap',
        },
      ],
    },
    {
      regex: /asrs|as\/rs|crane|chebyshev|shuttle|크레인|자동화|스태커/,
      items: [
        {
          id: 'act-equip-asrs',
          labelKo: 'AS/RS 크레인 모드 전환',
          labelEn: 'Switch to AS/RS Crane Mode',
          kind: 'switch_equipment_asrs',
        },
      ],
    },
    {
      regex: /safety|heavy|weight|hazard|z1|안전|무거운|중량|하중|위험/,
      items: [
        {
          id: 'act-safety',
          labelKo: '안전 최우선(Max Safety) 적용',
          labelEn: 'Apply Max-Safety Preset',
          kind: 'apply_preset_safety',
        },
      ],
    },
    {
      regex: /speed|cycle|fast|golden|pick|동선|빠른|속도|골든존|피킹/,
      items: [
        {
          id: 'act-speed',
          labelKo: '빠른 동선(Fast Pick) 적용',
          labelEn: 'Apply Fast-Pick Preset',
          kind: 'apply_preset_speed',
        },
        {
          id: 'act-view-golden',
          labelKo: '3D 골든존 레이어 보기',
          labelEn: 'Highlight 3D Golden Zone',
          kind: 'switch_view_golden_zone',
        },
      ],
    },
    {
      regex: /density|cubic|waste|honeycomb|space|공간|빈틈|압축|적재율|합포장/,
      items: [
        {
          id: 'act-density',
          labelKo: '공간 압축(Max Density) 적용',
          labelEn: 'Apply Max-Density Preset',
          kind: 'apply_preset_density',
        },
        {
          id: 'act-smartfit',
          labelKo: '6축 회전·합포장 활성화',
          labelEn: 'Enable 6-Axis Co-Packing',
          kind: 'enable_smart_fit',
        },
      ],
    },
  ];

  for (const cand of candidates) {
    if (cand.regex.test(promptLower)) {
      actions.push(...cand.items);
    }
  }
  for (const cand of candidates) {
    if (!cand.regex.test(promptLower) && cand.regex.test(combined)) {
      actions.push(...cand.items);
    }
  }

  if (actions.length === 0) {
    actions.push({
      id: 'act-opt3d',
      labelKo: '3D 최적화 배치 적용',
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

async function tryDirectChromePromptApi(
  systemText: string,
  fullPrompt: string
): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    LanguageModel?: {
      create?: (opts?: unknown) => Promise<{
        prompt: (input: string) => Promise<string>;
        destroy?: () => void;
      }>;
    };
    ai?: {
      languageModel?: {
        create?: (opts?: unknown) => Promise<{
          prompt: (input: string) => Promise<string>;
          destroy?: () => void;
        }>;
      };
    };
  };

  try {
    if (win.LanguageModel?.create) {
      const session = await win.LanguageModel.create({
        initialPrompts: [{ role: 'system', content: systemText }],
      });
      const out = await session.prompt(fullPrompt);
      session.destroy?.();
      return out;
    }
    if (win.ai?.languageModel?.create) {
      const session = await win.ai.languageModel.create({
        systemPrompt: systemText,
      });
      const out = await session.prompt(fullPrompt);
      session.destroy?.();
      return out;
    }
  } catch {
  }
  return null;
}

export function generateLocalDeterministicAudit(
  prompt: string,
  context: string
): string {
  const isKo = /[가-힣]/.test(prompt);
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

  if (isKo) {
    return [
      `[로컬 온디바이스 슬로팅 엔진 정량 분석 리포트]`,
      `1. **3D 공간·골든존 진단**:`,
      `   - ${optLine || '3D 최적화 배치가 활성화되어 있습니다.'}`,
      baseLine ? `   - 기존 2D 대비 비교: ${baseLine}` : '',
      deltaLine ? `   - 개선 효과 요약: ${deltaLine.replace('3D Improvement Deltas:', '').trim()}` : '',
      `2. **핵심 점검 대상 선반 & 피킹 동선 (클릭하여 3D 포커스)**: **${binListStr}**`,
      topLine ? `   - ${topLine.replace('Top Active Bins:', '최상위 피킹 집중 칸:')}` : '',
      routeLine ? `   - 활성 피킹 동선: ${routeLine}` : '',
      focusLine ? `   - 현재 선택 칸 상세: ${focusLine}` : '',
      `3. **권장 액션 3가지**:`,
      `   - 고빈도 Class A 품목은 허리~가슴 높이 골든존(**${primaryBins[0] ?? 'A1-B1-Z2'}**)에 집중 배치해 수직 리프트 피로도를 줄이세요.`,
      `   - 16kg 초과 중량 화물은 반드시 하부 **Z1~Z2** 단에 고정하여 전도 위험(Safety Violation 0건)을 유지하세요.`,
      `   - 동일 세그먼트 소형 박스는 6축 회전 + 합포장(Co-Packing) 옵션을 켜서 빈틈 낭비(Honeycombing)를 최소화하세요.`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    `[Local On-Device Slotting Engine Quantitative Audit]`,
    `1. **3D Cubic & Golden Zone Telemetry**:`,
    `   - ${optLine}`,
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
      availability?: () => Promise<string>;
      capabilities?: () => Promise<{ available?: string }>;
    };
    ai?: {
      languageModel?: {
        capabilities?: () => Promise<{ available?: string }>;
      };
    };
  };

  try {
    if (win.LanguageModel?.availability) {
      const status = await win.LanguageModel.availability();
      const normalized =
        status === 'available' || status === 'readily'
          ? 'readily'
          : status === 'downloadable' || status === 'after-download'
            ? 'after-download'
            : 'unavailable';
      return {
        supportedApi: true,
        availability: normalized,
        detail: `Chrome Prompt API detected (status: ${status})`,
      };
    }

    if (win.ai?.languageModel?.capabilities) {
      const caps = await win.ai.languageModel.capabilities();
      const status = caps.available ?? 'no';
      const normalized =
        status === 'readily'
          ? 'readily'
          : status === 'after-download'
            ? 'after-download'
            : 'unavailable';
      return {
        supportedApi: true,
        availability: normalized,
        detail: `window.ai.languageModel detected (available: ${status})`,
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

export async function runHybridWarehouseCopilot(params: {
  firebaseState: FirebaseServicesState;
  prompt: string;
  context: string;
  modeChoice: HybridModeChoice;
  useLiteModel?: boolean;
}): Promise<HybridAIResponse> {
  const { firebaseState, prompt, context, modeChoice, useLiteModel } = params;
  const start = performance.now();

  const modelName = useLiteModel
    ? firebaseState.remoteParams.liteModelName
    : firebaseState.remoteParams.cloudModelName;

  const systemText =
    'You are CubiSlot 3D AI, a warehouse industrial engineering co-pilot specializing in 3D slotting optimization, Golden Zone ergonomics (0.8m-1.65m), 3D bin packing, and AS/RS Chebyshev kinematics. Give concise, quantitative, actionable recommendations referencing exact bin IDs (e.g., A1-B2-Z2) and KPIs.';

  const fullPrompt = `${context}\n\nEngineer Question:\n${prompt}`;

  if (!firebaseState.app) {
    if (modeChoice === 'prefer_on_device' || modeChoice === 'only_on_device') {
      const nanoOut = await tryDirectChromePromptApi(systemText, fullPrompt);
      if (nanoOut) {
        return {
          text: nanoOut,
          inferenceSource: InferenceSource.ON_DEVICE,
          requestedMode: modeChoice,
          modelName: 'chrome-gemini-nano',
          latencyMs: Math.round(performance.now() - start),
          recommendedBinIds: extractBinIdsFromText(`${nanoOut}\n${context}`),
          recommendedActions: deriveRecommendedActions(prompt, context, nanoOut),
        };
      }
    }

    const localText = generateLocalDeterministicAudit(prompt, context);
    return {
      text: localText,
      inferenceSource: 'local_engine',
      requestedMode: modeChoice,
      modelName: 'cubislot-local-heuristic-v1',
      latencyMs: Math.round(performance.now() - start),
      recommendedBinIds: extractBinIdsFromText(`${localText}\n${context}`),
      recommendedActions: deriveRecommendedActions(prompt, context, localText),
    };
  }

  try {
    const ai = getAI(firebaseState.app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, {
      mode: MODE_MAP[modeChoice],
      inCloudParams: {
        model: modelName,
        systemInstruction: systemText,
      },
      onDeviceParams: {
        createOptions: {
          initialPrompts: [
            {
              role: 'system',
              content: [{ type: 'text', value: systemText }],
            },
          ],
        },
      },
    });

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();
    const inferenceSource =
      response.inferenceSource ?? InferenceSource.IN_CLOUD;

    return {
      text,
      inferenceSource,
      requestedMode: modeChoice,
      modelName,
      latencyMs: Math.round(performance.now() - start),
      recommendedBinIds: extractBinIdsFromText(`${text}\n${context}`),
      recommendedActions: deriveRecommendedActions(prompt, context, text),
    };
  } catch (err) {
    const nanoOut = await tryDirectChromePromptApi(systemText, fullPrompt);
    if (nanoOut) {
      return {
        text: nanoOut,
        inferenceSource: InferenceSource.ON_DEVICE,
        requestedMode: modeChoice,
        modelName: 'chrome-gemini-nano',
        latencyMs: Math.round(performance.now() - start),
        recommendedBinIds: extractBinIdsFromText(`${nanoOut}\n${context}`),
        recommendedActions: deriveRecommendedActions(prompt, context, nanoOut),
      };
    }

    const localText = generateLocalDeterministicAudit(prompt, context);
    const message = err instanceof Error ? err.message : String(err);
    return {
      text: localText,
      inferenceSource: 'local_engine',
      requestedMode: modeChoice,
      modelName: `local-fallback (${message.slice(0, 48)})`,
      latencyMs: Math.round(performance.now() - start),
      recommendedBinIds: extractBinIdsFromText(`${localText}\n${context}`),
      recommendedActions: deriveRecommendedActions(prompt, context, localText),
    };
  }
}
