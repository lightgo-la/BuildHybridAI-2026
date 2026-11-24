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

export interface HybridAIResponse {
  text: string;
  inferenceSource: InferenceSource | 'local_engine' | 'not_executed';
  requestedMode: HybridModeChoice;
  modelName: string;
  latencyMs: number;
  recommendedBinIds?: string[];
  error?: string;
}

function extractBinIdsFromText(text: string): string[] {
  const matches = text.match(/\b(?:C\d+-)?A\d+-B\d+-Z\d+\b/g) ?? [];
  return [...new Set(matches)];
}

async function tryDirectChromePromptApi(
  systemText: string,
  fullPrompt: string
): Promise<string | null> {
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
    // Fall through to next fallback
  }
  return null;
}

function generateLocalDeterministicAudit(
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
  const topLine = lines.find((l) => l.startsWith('Top Active Bins:')) ?? '';
  const focusLine = lines.find((l) => l.startsWith('Focused Bin')) ?? '';

  if (isKo) {
    return [
      `[로컬 온디바이스 슬로팅 엔진 정량 분석 리포트]`,
      `1. **3D 공간·골든존 진단**:`,
      `   - ${optLine || '3D 최적화 배치가 활성화되어 있습니다.'}`,
      `   - ${baseLine ? `기존 2D 대비 비교: ${baseLine}` : ''}`,
      `2. **핵심 점검 대상 선반 (클릭하여 3D 포커스)**: **${binListStr}**`,
      `   - ${topLine.replace('Top Active Bins:', '최상위 피킹 집중 칸:')}`,
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
    `   - ${baseLine}`,
    `2. **Priority Action Bins (Click chip below to focus in 3D)**: **${binListStr}**`,
    `   - ${topLine}`,
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

  return [
    `Warehouse Config: ${config.aisles} aisles x ${config.baysPerAisle} bays x ${config.levels} levels, equipment=${config.equipmentMode}, Golden Zone=${config.goldenZoneMinM}m-${config.goldenZoneMaxM}m.`,
    `Baseline 2D KPIs: CubicUtil=${b.cubicUtilizationPct}%, HoneycombingWaste=${b.honeycombingWastePct}%, AvgCycle=${b.avgCycleTimeSec}s, GoldenZoneHit=${b.goldenZoneHitRatePct}%, ErgonomicsScore=${b.ergonomicsScore}/100, SafetyViolations=${b.safetyViolations}.`,
    `Optimized 3D KPIs: CubicUtil=${o.cubicUtilizationPct}%, HoneycombingWaste=${o.honeycombingWastePct}%, AvgCycle=${o.avgCycleTimeSec}s, GoldenZoneHit=${o.goldenZoneHitRatePct}%, ErgonomicsScore=${o.ergonomicsScore}/100, SafetyViolations=${o.safetyViolations}.`,
    `Top Active Bins: ${topCongested}`,
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

  // 1. If On-Device mode is preferred/forced and Firebase is not configured, try direct Chrome Gemini Nano API first, then local deterministic engine
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
    };
  } catch (err) {
    // Graceful fallback to direct Chrome Prompt API or Local Deterministic Audit so user is never left with an empty screen
    const nanoOut = await tryDirectChromePromptApi(systemText, fullPrompt);
    if (nanoOut) {
      return {
        text: nanoOut,
        inferenceSource: InferenceSource.ON_DEVICE,
        requestedMode: modeChoice,
        modelName: 'chrome-gemini-nano',
        latencyMs: Math.round(performance.now() - start),
        recommendedBinIds: extractBinIdsFromText(`${nanoOut}\n${context}`),
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
    };
  }
}
