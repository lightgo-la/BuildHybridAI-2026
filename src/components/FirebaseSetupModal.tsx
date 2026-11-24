import React, { useState } from 'react';
import { KeyRound, ShieldCheck, X } from 'lucide-react';
import { type LangCode } from '../i18n/translations';
import {
  type FirebaseRuntimeConfig,
  loadEnvOrStoredConfig,
  saveRuntimeConfig,
} from '../services/firebaseClient';

interface FirebaseSetupModalProps {
  open: boolean;
  onClose: () => void;
  onApplyConfig: (cfg: FirebaseRuntimeConfig) => Promise<void>;
  lang?: LangCode;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({
  open,
  onClose,
  onApplyConfig,
  lang = 'ko',
}) => {
  const [form, setForm] = useState<FirebaseRuntimeConfig>(() =>
    loadEnvOrStoredConfig()
  );
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    saveRuntimeConfig(form);
    await onApplyConfig(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              {lang === 'ko'
                ? 'Firebase AI Logic & App Check 연결 설정'
                : 'Firebase AI Logic & App Check Configuration'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          {lang === 'ko'
            ? 'Firebase 프로젝트를 연결하면 하이브리드 AI(클라우드 폴백), App Check 보안, Remote Config, Firestore 스냅샷 저장을 사용할 수 있습니다. 설정값은 브라우저에 안전하게 저장됩니다.'
            : 'Connect your Firebase project to activate Firebase AI Logic (Cloud Fallback), App Check, Remote Config, and Firestore persistence. Values are stored locally in your browser or loaded from .env.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-2.5 text-xs">
          {(
            [
              ['apiKey', 'API Key'],
              ['authDomain', 'Auth Domain'],
              ['projectId', 'Project ID'],
              ['appId', 'App ID'],
              ['recaptchaSiteKey', 'App Check reCAPTCHA v3 Site Key (optional if Debug Token)'],
            ] as const
          ).map(([field, label]) => (
            <div key={field}>
              <label className="mb-1 block text-[11px] font-medium text-slate-300">
                {label}
              </label>
              <input
                type="text"
                value={form[field] ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field]: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          ))}

          <label className="flex items-center gap-2 pt-1 text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(form.debugToken)}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, debugToken: e.target.checked }))
              }
              className="rounded border-slate-700 bg-slate-950 text-cyan-500"
            />
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Enable App Check Debug Token (accepted for #BuildHybridAI judging)
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
            >
              {lang === 'ko' ? '취소' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cyan-500 px-4 py-1.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              {saving
                ? lang === 'ko'
                  ? '연결 중...'
                  : 'Initializing...'
                : lang === 'ko'
                  ? '저장 및 Firebase 연결'
                  : 'Save & Connect Firebase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
