import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  Copy,
  Cpu,
  Loader2,
  Lock,
  Send,
  ShieldCheck,
  Sliders,
  Trash2,
} from 'lucide-react';
import type { FirebaseServicesState } from '../services/firebaseClient';
import {
  type ChromeNanoDiagnostics,
  type HybridAIAction,
  type HybridAIResponse,
  type HybridModeChoice,
  buildWarehousePromptContext,
  runHybridWarehouseCopilot,
} from '../services/hybridAi';
import { type LangCode } from '../i18n/translations';
import type {
  BinAllocation,
  SlottingResult,
  WarehouseConfig,
} from '../types/warehouse';

interface HybridAICopilotPanelProps {
  firebaseState: FirebaseServicesState;
  nanoDiag: ChromeNanoDiagnostics;
  baseline: SlottingResult;
  optimized: SlottingResult;
  config: WarehouseConfig;
  selectedBin: BinAllocation | null;
  externalPromptRequest?: {
    id: number;
    prompt: string;
    mode: HybridModeChoice;
  } | null;
  onLastInferenceSource?: (source: string) => void;
  onFocusBinId?: (binId: string) => void;
  onExecuteAiAction?: (action: HybridAIAction) => void;
  lang?: LangCode;
}

const buildQuickPrompts = (config: WarehouseConfig, lang: LangCode) => [
  {
    label: lang === 'ko' ? 'Space Efficiency Tips' : 'Space Efficiency Tips',
    mode: 'prefer_on_device' as HybridModeChoice,
    lite: true,
    prompt:
      lang === 'ko'
        ? `Audit the Golden Zone (${config.goldenZoneMinM}m-${config.goldenZoneMaxM}m) hit rate and space usage. Give 3 simple, actionable tips to fit more items and speed up picking.`
        : `Audit the Golden Zone (${config.goldenZoneMinM}m-${config.goldenZoneMaxM}m) hit rate and space usage. Give 3 simple, actionable tips to fit more items and speed up picking.`,
  },
  {
    label: lang === 'ko' ? 'Safety & Load Audit' : 'Safety & Load Audit',
    mode: 'prefer_on_device' as HybridModeChoice,
    lite: false,
    prompt:
      lang === 'ko'
        ? 'Check for any heavy items placed too high, aisle pick congestion, or honeycombing waste, and list exact bin improvements.'
        : 'Check for any heavy items placed too high, aisle pick congestion, or honeycombing waste, and list exact bin improvements.',
  },
  {
    label: lang === 'ko' ? 'Offline On-Device Audit' : 'Offline On-Device Audit',
    mode: 'only_on_device' as HybridModeChoice,
    lite: true,
    prompt:
      lang === 'ko'
        ? 'Run a strict local-only check on the currently focused bin (or top bin): verify weight limits, 3D cubic fit, and whether any heavy SKU should move to Z1.'
        : 'Run a strict local-only check on the currently focused bin (or top bin): verify weight limits, 3D cubic fit, and whether any heavy SKU should move to Z1.',
  },
];

export const HybridAICopilotPanel: React.FC<HybridAICopilotPanelProps> = ({
  firebaseState,
  nanoDiag,
  baseline,
  optimized,
  config,
  selectedBin,
  externalPromptRequest,
  onLastInferenceSource,
  onFocusBinId,
  onExecuteAiAction,
  lang = 'en',
}) => {
  const [modeChoice, setModeChoice] =
    useState<HybridModeChoice>('prefer_on_device');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<
    Array<{ question: string; answer: HybridAIResponse }>
  >([]);
  const lastExtIdRef = useRef<number>(0);

  const handleCopyReport = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      window.setTimeout(() => setCopiedIdx(null), 1800);
    } catch {
    }
  };

  const executeQuery = async (
    question: string,
    overrideMode?: HybridModeChoice,
    useLite = false
  ) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const chosenMode = overrideMode ?? modeChoice;
    setLoading(true);
    const context = buildWarehousePromptContext(
      baseline,
      optimized,
      config,
      selectedBin
    );

    const res = await runHybridWarehouseCopilot({
      firebaseState,
      prompt: trimmed,
      context,
      modeChoice: chosenMode,
      useLiteModel: useLite,
    });

    setHistory((prev) => [{ question: trimmed, answer: res }, ...prev]);
    if (res.inferenceSource !== 'not_executed' && onLastInferenceSource) {
      onLastInferenceSource(res.inferenceSource);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (
      externalPromptRequest &&
      externalPromptRequest.id !== lastExtIdRef.current
    ) {
      lastExtIdRef.current = externalPromptRequest.id;
      setModeChoice(externalPromptRequest.mode);
      void executeQuery(externalPromptRequest.prompt, externalPromptRequest.mode);
    }
  }, [externalPromptRequest]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/90">
      <div className="border-b border-slate-800 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-cyan-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                {lang === 'ko' ? 'AI Space Assistant' : 'AI Space Assistant'}
              </h2>
              <p className="text-[10px] text-slate-400">
                {lang === 'ko'
                  ? 'Hybrid On-Device (Nano) + Cloud Fallback'
                  : 'Hybrid On-Device (Nano) + Cloud Fallback'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
                title={lang === 'ko' ? 'Clear History' : 'Clear History'}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-slate-300 hover:border-cyan-500/40"
            >
              <Sliders className="h-3 w-3 text-cyan-400" />
              {lang === 'ko' ? 'AI Settings' : 'AI Settings'}
              {showAdvanced ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="mt-2.5 space-y-2 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5">
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
                  nanoDiag.availability === 'readily'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                }`}
                title={nanoDiag.detail}
              >
                <Cpu className="h-3 w-3" />
                Nano: {nanoDiag.availability}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
                  firebaseState.appCheckActive
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                <ShieldCheck className="h-3 w-3" />
                App Check: {firebaseState.appCheckMode}
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-slate-300">
                Model: {firebaseState.remoteParams.cloudModelName}
              </span>
            </div>

            <select
              value={modeChoice}
              onChange={(e) => setModeChoice(e.target.value as HybridModeChoice)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] text-slate-200 focus:outline-none"
            >
              <option value="prefer_on_device">
                {lang === 'ko'
                  ? 'Auto Hybrid (On-Device First → Cloud Fallback)'
                  : 'Auto Hybrid (On-Device First → Cloud Fallback)'}
              </option>
              <option value="only_on_device">
                {lang === 'ko'
                  ? 'Private Only (On-Device Offline)'
                  : 'Private Only (On-Device Offline)'}
              </option>
              <option value="prefer_in_cloud">
                {lang === 'ko'
                  ? 'Cloud First (Deep Reasoning → Local Fallback)'
                  : 'Cloud First (Deep Reasoning → Local Fallback)'}
              </option>
              <option value="only_in_cloud">
                {lang === 'ko' ? 'Force Cloud Gemini' : 'Force Cloud Gemini'}
              </option>
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-slate-800/80 bg-slate-950/40 px-3 py-2.5">
        {buildQuickPrompts(config, lang).map((qp) => (
          <button
            key={qp.label}
            type="button"
            disabled={loading}
            onClick={() => executeQuery(qp.prompt, qp.mode, qp.lite)}
            className="rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-cyan-500/50 disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs">
        {history.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-3.5 text-slate-400">
            <p className="font-semibold text-slate-200">
              {lang === 'ko' ? 'Ask Your 3D Slotting Co-Pilot' : 'Ask Your 3D Slotting Co-Pilot'}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed">
              {lang === 'ko' ? (
                <>
                  Click a quick audit above or type any question below (e.g.,{' '}
                  <span className="text-cyan-400">
                    "Which bin should move to the Golden Zone first?"
                  </span>
                  )
                </>
              ) : (
                <>
                  Click a quick audit above or type any question below (e.g.,{' '}
                  <span className="text-cyan-400">
                    "Which bin should move to the Golden Zone first?"
                  </span>
                  )
                </>
              )}
            </p>
          </div>
        )}

        {history.map((item, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/80 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-cyan-300">Q: {item.question}</div>
              <button
                type="button"
                onClick={() => handleCopyReport(item.answer.text, idx)}
                className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-300 hover:border-cyan-500/50"
                title={lang === 'ko' ? 'Copy Audit Report' : 'Copy Audit Report'}
              >
                {copiedIdx === idx ? (
                  <>
                    <Check className="h-2.5 w-2.5 text-emerald-400" />
                    {lang === 'ko' ? 'Copied' : 'Copied'}
                  </>
                ) : (
                  <>
                    <Copy className="h-2.5 w-2.5" />
                    {lang === 'ko' ? 'Copy' : 'Copy'}
                  </>
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {item.answer.inferenceSource === 'on_device' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300">
                  <Lock className="h-2.5 w-2.5" />
                  {lang === 'ko'
                    ? 'ON_DEVICE (Gemini Nano)'
                    : 'ON_DEVICE (Gemini Nano)'}
                </span>
              ) : item.answer.inferenceSource === 'in_cloud' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/15 px-2 py-0.5 font-semibold text-sky-300">
                  <Cloud className="h-2.5 w-2.5" />
                  {lang === 'ko'
                    ? `IN_CLOUD (${item.answer.modelName})`
                    : `IN_CLOUD (${item.answer.modelName})`}
                </span>
              ) : item.answer.inferenceSource === 'local_engine' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 font-semibold text-cyan-300">
                  <Cpu className="h-2.5 w-2.5" />
                  {lang === 'ko'
                    ? 'LOCAL_ENGINE (On-Device Heuristic)'
                    : 'LOCAL_ENGINE (On-Device Heuristic)'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-300">
                  {lang === 'ko' ? 'NOT EXECUTED' : 'NOT EXECUTED'}
                </span>
              )}
              <span className="text-slate-500">{item.answer.latencyMs} ms</span>
            </div>

            {item.answer.error ? (
              <div className="rounded border border-rose-500/30 bg-rose-950/40 p-2 text-[11px] text-rose-200">
                {item.answer.error}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
                  {item.answer.text}
                </div>
                {onFocusBinId &&
                  item.answer.recommendedBinIds &&
                  item.answer.recommendedBinIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800/80 pt-2">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {lang === 'ko'
                          ? 'Focus Bin in 3D:'
                          : 'Focus Bin in 3D:'}
                      </span>
                      {item.answer.recommendedBinIds.slice(0, 6).map((binId) => (
                        <button
                          key={binId}
                          type="button"
                          onClick={() => onFocusBinId(binId)}
                          className="rounded-md border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-300 transition hover:bg-cyan-500/30"
                        >
                          {binId}
                        </button>
                      ))}
                    </div>
                  )}

                {onExecuteAiAction &&
                  item.answer.recommendedActions &&
                  item.answer.recommendedActions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800/80 pt-2">
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {lang === 'ko'
                          ? 'Apply Action:'
                          : 'Apply Action:'}
                      </span>
                      {item.answer.recommendedActions.map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => onExecuteAiAction(act)}
                          className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                        >
                          {lang === 'ko' ? act.labelKo : act.labelEn}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = promptInput;
          setPromptInput('');
          void executeQuery(q);
        }}
        className="flex gap-2 border-t border-slate-800 p-3"
      >
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder={
            selectedBin
              ? lang === 'ko'
                ? `Ask about bin ${selectedBin.bin.id}...`
                : `Ask about bin ${selectedBin.bin.id}...`
              : lang === 'ko'
                ? 'Ask about 3D slotting, Golden Zone, or space usage...'
                : 'Ask about 3D slotting, Golden Zone, or space usage...'
          }
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !promptInput.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {lang === 'ko' ? 'Ask' : 'Ask'}
        </button>
      </form>
    </div>
  );
};
