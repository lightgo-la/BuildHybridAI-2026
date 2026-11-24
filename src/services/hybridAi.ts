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
  inferenceSource: InferenceSource | 'not_executed';
  requestedMode: HybridModeChoice;
  modelName: string;
  latencyMs: number;
  error?: string;
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

  if (!firebaseState.app) {
    return {
      text: '',
      inferenceSource: 'not_executed',
      requestedMode: modeChoice,
      modelName: firebaseState.remoteParams.cloudModelName,
      latencyMs: Math.round(performance.now() - start),
      error:
        'Firebase project is not configured yet. Open "Firebase Setup" in the top bar (or copy .env.example to .env) to enable Firebase AI Logic hybrid inference.',
    };
  }

  const modelName = useLiteModel
    ? firebaseState.remoteParams.liteModelName
    : firebaseState.remoteParams.cloudModelName;

  const systemText =
    'You are CubiSlot 3D AI, a warehouse industrial engineering co-pilot specializing in 3D slotting optimization, Golden Zone ergonomics (0.8m-1.65m), 3D bin packing, and AS/RS Chebyshev kinematics. Give concise, quantitative, actionable recommendations referencing exact bin IDs (e.g., A1-B2-Z2) and KPIs.';

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

    const fullPrompt = `${context}\n\nEngineer Question:\n${prompt}`;
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
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      text: '',
      inferenceSource: 'not_executed',
      requestedMode: modeChoice,
      modelName,
      latencyMs: Math.round(performance.now() - start),
      error: message,
    };
  }
}
