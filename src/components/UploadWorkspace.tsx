import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Globe,
  ImagePlus,
  Layers,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  AuditedScreenAsset,
  AuditErrorState,
  AuditInputMode,
  AuditTone,
  SampleUiPreset,
} from '../types/audit';
import { generateSampleUiPng, SAMPLE_UI_PRESETS } from '../utils/sampleScreens';
import { compressImageToJpeg } from '../utils/imageCompress';

interface UploadWorkspaceProps {
  inputMode: AuditInputMode;
  onInputModeChange: (mode: AuditInputMode) => void;
  urlInput: string;
  onUrlInputChange: (val: string) => void;
  flowScreens: AuditedScreenAsset[];
  onFlowScreensChange: React.Dispatch<React.SetStateAction<AuditedScreenAsset[]>>;
  tone: AuditTone;
  onToneChange: (tone: AuditTone) => void;
  contextInput: string;
  onContextInputChange: (val: string) => void;
  onStartAudit: (params: {
    mode: AuditInputMode;
    screens: AuditedScreenAsset[];
    sourceUrl?: string;
    contextOverride?: string;
  }) => void;
  errorState: AuditErrorState | null;
}

const DEFAULT_FLOW_LABELS = [
  'Home / Landing',
  'Product / Detail',
  'Cart / Review',
  'Checkout / Payment',
  'Confirmation',
];

export function UploadWorkspace({
  inputMode,
  onInputModeChange,
  urlInput,
  onUrlInputChange,
  flowScreens,
  onFlowScreensChange,
  tone,
  onToneChange,
  contextInput,
  onContextInputChange,
  onStartAudit,
  errorState,
}: UploadWorkspaceProps) {
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingSingle, setIsDraggingSingle] = useState(false);
  const [isCapturingUrl, setIsCapturingUrl] = useState(false);

  const flowFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFlow, setIsDraggingFlow] = useState(false);
  const [focusedFlowStep, setFocusedFlowStep] = useState(0);

  const [isCompressing, setIsCompressing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const sampleThumbnails = useMemo(() => {
    const map: Record<string, string> = {};
    for (const preset of SAMPLE_UI_PRESETS) {
      map[preset.id] = generateSampleUiPng(preset.id);
    }
    return map;
  }, []);

  const quickDemoChips = useMemo(
    () =>
      SAMPLE_UI_PRESETS.filter(
        (p) => p.id === 'legacy-checkout' || p.id === 'low-contrast-login'
      ),
    []
  );

  const compressAndValidateFile = async (
    file: File
  ): Promise<{ dataUrl: string; mimeType: string; name: string } | null> => {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setLocalError('Please use PNG, JPEG, or WebP screenshots.');
      return null;
    }
    if (file.size > 25 * 1024 * 1024) {
      setLocalError('That image is over 25 MB. Please try a smaller screenshot.');
      return null;
    }
    const compressed = await compressImageToJpeg(file);
    return {
      dataUrl: compressed.dataUrl,
      mimeType: compressed.mimeType,
      name: file.name,
    };
  };

  const handleSingleFile = async (file: File) => {
    setLocalError(null);
    try {
      setIsCompressing(true);
      const result = await compressAndValidateFile(file);
      if (!result) return;
      onStartAudit({
        mode: 'single',
        screens: [
          {
            id: 'screen-0',
            label: 'Uploaded Screen',
            dataUrl: result.dataUrl,
            mimeType: result.mimeType,
            name: result.name,
          },
        ],
      });
    } catch {
      setLocalError('We could not read that image. Try another PNG, JPEG, or WebP file.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFlowFiles = async (files: FileList | File[]) => {
    setLocalError(null);
    const fileList = Array.from(files);
    const remainingSlots = 5 - flowScreens.length;
    if (remainingSlots <= 0) {
      setLocalError('You can include up to 5 sequential screens in a flow audit.');
      return;
    }

    const toProcess = fileList.slice(0, remainingSlots);
    try {
      setIsCompressing(true);
      const added: AuditedScreenAsset[] = [];
      for (let i = 0; i < toProcess.length; i++) {
        const res = await compressAndValidateFile(toProcess[i]);
        if (res) {
          const stepIndex = flowScreens.length + added.length;
          added.push({
            id: `flow-${Date.now()}-${stepIndex}`,
            label: DEFAULT_FLOW_LABELS[stepIndex] || `Step ${stepIndex + 1}`,
            dataUrl: res.dataUrl,
            mimeType: res.mimeType,
            name: res.name,
          });
        }
      }
      if (added.length > 0) {
        const newLength = flowScreens.length + added.length;
        onFlowScreensChange((prev) => [...prev, ...added]);
        setFocusedFlowStep(newLength - 1);
      }
    } catch {
      setLocalError('One of the screenshots could not be processed. Please try again.');
    } finally {
      setIsCompressing(false);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pastedFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) pastedFiles.push(f);
        }
      }
      if (pastedFiles.length === 0) return;
      if (inputMode === 'flow') {
        void handleFlowFiles(pastedFiles);
      } else {
        void handleSingleFile(pastedFiles[0]);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  });

  const handleCaptureUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setLocalError('Paste a live website link (for example, https://example.com) to inspect.');
      return;
    }

    try {
      setIsCapturingUrl(true);
      const resp = await fetch('/api/capture-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = (await resp.json()) as {
        dataUrl?: string;
        mimeType?: string;
        resolvedUrl?: string;
        error?: string;
      };

      if (!resp.ok || !data.dataUrl) {
        setLocalError(
          data.error ||
            'This site blocked automated previews. Take a quick screenshot and upload it under Single Screen instead.'
        );
        return;
      }

      const compressed = await compressImageToJpeg(data.dataUrl);
      const resolved = data.resolvedUrl || trimmed;
      const hostLabel = (() => {
        try {
          return new URL(resolved).hostname;
        } catch {
          return resolved;
        }
      })();

      onStartAudit({
        mode: 'url',
        sourceUrl: resolved,
        screens: [
          {
            id: 'url-screen-0',
            label: hostLabel,
            dataUrl: compressed.dataUrl,
            mimeType: compressed.mimeType,
            name: `${hostLabel}.jpg`,
            sourceUrl: resolved,
          },
        ],
      });
    } catch {
      setLocalError(
        'Could not reach the screenshot preview service. Try taking a screenshot and uploading it in the Single Screen tab.'
      );
    } finally {
      setIsCapturingUrl(false);
    }
  };

  const handleSampleClick = async (preset: SampleUiPreset) => {
    const dataUrl = sampleThumbnails[preset.id];
    if (!dataUrl) return;
    try {
      setIsCompressing(true);
      const compressed = await compressImageToJpeg(dataUrl);
      onStartAudit({
        mode: 'single',
        screens: [
          {
            id: `sample-${preset.id}`,
            label: preset.title,
            dataUrl: compressed.dataUrl,
            mimeType: compressed.mimeType,
            name: `${preset.id}.jpg`,
          },
        ],
        contextOverride: contextInput.trim() || preset.contextHint,
      });
    } catch {
      onStartAudit({
        mode: 'single',
        screens: [
          {
            id: `sample-${preset.id}`,
            label: preset.title,
            dataUrl,
            mimeType: 'image/png',
            name: `${preset.id}.png`,
          },
        ],
        contextOverride: contextInput.trim() || preset.contextHint,
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const moveFlowScreen = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= flowScreens.length) return;
    onFlowScreensChange((prev) => {
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setFocusedFlowStep(target);
  };

  const handleBackToPreviousStep = () => {
    if (flowScreens.length === 0) {
      onInputModeChange('single');
      return;
    }
    if (focusedFlowStep > 0) {
      setFocusedFlowStep((prev) => Math.max(0, prev - 1));
    } else {
      onInputModeChange('single');
    }
  };

  const displayError = localError || errorState?.message;

  return (
    <main className="flex-1 overflow-y-auto lavender-ambient-bg">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
        {/* Hero Header */}
        <div className="max-w-3xl mb-10">
          <p className="micro-label text-[#5B3DF5] mb-3">
            Visual UX, Accessibility &amp; Flow Auditor
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#16142C] leading-[1.14] [text-wrap:balance]">
            Spot every friction point before your users do.
          </h1>
          <p className="mt-3.5 text-base text-[#5A5875] leading-relaxed max-w-2xl">
            Evaluate individual interfaces, live web pages, or end-to-end user journeys: delivering
            actionable usability insights, WCAG contrast verification, and an interactive Visual
            Error Spotlight.
          </p>
        </div>

        {displayError && (
          <div
            role="alert"
            className="mb-7 flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-white border border-rose-200 rounded-2xl text-sm text-rose-800 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{displayError}</span>
            </div>
            {inputMode === 'url' && (
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  onInputModeChange('single');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#1E1B4B] bg-white border border-[#D8D4F2] hover:bg-[#F5F3FF] rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Switch to Single Screen Upload
              </button>
            )}
          </div>
        )}

        {/* Primary 2-Column Studio Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
          {/* Left: 3-Tab Multi-Input Switcher */}
          <section className="lg:col-span-7 saas-card p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Header + Tone Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <span className="micro-label text-[#5A5875]">Choose Input Mode</span>

                <div
                  role="group"
                  aria-label="Critique tone"
                  className="inline-flex items-center p-1 bg-[#F3F1FC] border border-[#E5E1FA] rounded-xl"
                >
                  <button
                    type="button"
                    onClick={() => onToneChange('principled')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      tone === 'principled'
                        ? 'bg-white text-[#16142C] shadow-xs'
                        : 'text-[#5A5875] hover:text-[#16142C]'
                    }`}
                  >
                    Helpful Mentor
                  </button>
                  <button
                    type="button"
                    onClick={() => onToneChange('brutal')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      tone === 'brutal'
                        ? 'bg-white text-[#16142C] shadow-xs'
                        : 'text-[#5A5875] hover:text-[#16142C]'
                    }`}
                  >
                    Brutally Honest
                  </button>
                </div>
              </div>

              {/* 3-Tab Input Switcher */}
              <div
                role="tablist"
                aria-label="Audit input modes"
                className="grid grid-cols-3 gap-2 p-1.5 bg-[#F5F3FF] border border-[#E3DFFA] rounded-2xl mb-6"
              >
                {(
                  [
                    { id: 'single', label: 'Single Screen', icon: Upload },
                    { id: 'url', label: 'Website URL', icon: Globe },
                    { id: 'flow', label: 'App Flow (2–5)', icon: Layers },
                  ] as const
                ).map(({ id, label, icon: Icon }) => {
                  const active = inputMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setLocalError(null);
                        onInputModeChange(id);
                      }}
                      className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-white text-[#16142C] shadow-xs border border-[#D8D4F2]'
                          : 'text-[#5A5875] hover:text-[#16142C]'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          active ? 'text-[#5B3DF5]' : 'text-[#7C7998]'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* MODE 1: SINGLE SCREEN */}
              {inputMode === 'single' && (
                <div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingSingle(true);
                    }}
                    onDragLeave={() => setIsDraggingSingle(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingSingle(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) void handleSingleFile(file);
                    }}
                    onClick={() => singleFileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        singleFileInputRef.current?.click();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload single UI screenshot"
                    className={`border-2 border-dashed rounded-2xl px-6 py-11 text-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5] ${
                      isDraggingSingle
                        ? 'border-[#5B3DF5] bg-[#F5F3FF]'
                        : 'border-[#D8D4F2] bg-[#FAF9FF] hover:border-[#5B3DF5]/65 hover:bg-[#F5F3FF]/70'
                    }`}
                  >
                    <input
                      ref={singleFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleSingleFile(file);
                        e.target.value = '';
                      }}
                    />
                    <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#ECE9FE] text-[#5B3DF5] flex items-center justify-center">
                      <ImagePlus className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-semibold text-[#16142C]">
                      Drop a screenshot here, paste from clipboard, or browse
                    </p>
                    <p className="mt-1.5 text-xs text-[#5A5875]">
                      PNG, JPEG, or WebP · Auto-compressed to 1280px · Cmd/Ctrl+V supported
                    </p>
                    <div className="mt-5">
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#5B3DF5] hover:bg-[#492CE0] rounded-xl shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isCompressing ? 'Preparing Screenshot…' : 'Choose Screenshot'}</span>
                      </span>
                    </div>
                  </div>

                  {/* One-Click Portfolio Demo Chips ("Try Without Uploading") */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[#5A5875] mr-1">
                      Try without uploading:
                    </span>
                    {quickDemoChips.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => void handleSampleClick(preset)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E1B4B] bg-[#FAF9FF] hover:bg-[#ECE9FE] border border-[#D8D4F2] hover:border-[#5B3DF5]/50 rounded-full transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-[#5B3DF5]" aria-hidden="true" />
                        <span>{preset.chipLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MODE 2: LIVE WEBSITE URL */}
              {inputMode === 'url' && (
                <form
                  onSubmit={handleCaptureUrl}
                  className="rounded-2xl border border-[#D8D4F2] bg-[#FAF9FF] p-6 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="website-url-input"
                      className="block text-sm font-semibold text-[#16142C] mb-1.5"
                    >
                      Paste a live webpage URL
                    </label>
                    <p className="text-xs text-[#5A5875] mb-4 leading-relaxed">
                      We&apos;ll capture a desktop preview of the live site and audit its visual
                      hierarchy, navigation clarity, contrast, and call-to-action copy.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        id="website-url-input"
                        type="text"
                        value={urlInput}
                        onChange={(e) => onUrlInputChange(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 px-4 py-2.5 text-sm bg-white border border-[#D8D4F2] rounded-xl text-[#16142C] placeholder:text-[#8E8BA8] focus:outline-none focus:border-[#5B3DF5]"
                      />
                      <button
                        type="submit"
                        disabled={isCapturingUrl}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#5B3DF5] hover:bg-[#492CE0] disabled:opacity-60 rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isCapturingUrl ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Capturing Site…</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Start Audit</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6E6B8A]">
                    Note: Some login-walled or bot-protected sites block automated captures. If
                    that happens, you can drop a screenshot into Single Screen in one click.
                  </p>
                </form>
              )}

              {/* MODE 3: MULTI-SCREEN APP FLOW */}
              {inputMode === 'flow' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleBackToPreviousStep}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E1B4B] bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] rounded-xl transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {flowScreens.length > 0 && focusedFlowStep > 0
                          ? `Back to Previous Step (Step ${focusedFlowStep})`
                          : 'Back to Single Screen'}
                      </span>
                    </button>

                    <span className="text-xs font-mono font-semibold text-[#5B3DF5]">
                      {flowScreens.length} / 5 Screens
                    </span>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFlow(true);
                    }}
                    onDragLeave={() => setIsDraggingFlow(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFlow(false);
                      if (e.dataTransfer.files?.length) {
                        void handleFlowFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => flowFileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        flowFileInputRef.current?.click();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`border-2 border-dashed rounded-2xl px-5 py-5 text-center transition-colors cursor-pointer ${
                      isDraggingFlow
                        ? 'border-[#5B3DF5] bg-[#F5F3FF]'
                        : 'border-[#D8D4F2] bg-[#FAF9FF] hover:border-[#5B3DF5]/65'
                    }`}
                  >
                    <input
                      ref={flowFileInputRef}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          void handleFlowFiles(e.target.files);
                        }
                        e.target.value = '';
                      }}
                    />
                    <p className="text-xs font-semibold text-[#16142C]">
                      {flowScreens.length < 5
                        ? `Add 2–5 sequential screenshots (${flowScreens.length}/5 added)`
                        : 'Maximum 5 screens added'}
                    </p>
                    <p className="mt-1 text-[11px] text-[#5A5875]">
                      Select multiple files or add steps one by one (Home → Product → Checkout)
                    </p>
                  </div>

                  {flowScreens.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                      {flowScreens.map((screen, idx) => {
                        const isFocused = focusedFlowStep === idx;
                        return (
                          <div
                            key={screen.id}
                            onClick={() => setFocusedFlowStep(idx)}
                            className={`p-3 rounded-2xl border transition-all ${
                              isFocused
                                ? 'bg-[#F5F3FF] border-[#5B3DF5]'
                                : 'bg-[#FAF9FF] border-[#D8D4F2]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#5B3DF5]">
                                <span className="w-5 h-5 rounded-full bg-[#5B3DF5] text-white font-mono text-[10px] flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span>Step {idx + 1}</span>
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveFlowScreen(idx, -1);
                                  }}
                                  disabled={idx === 0}
                                  title="Move Left"
                                  aria-label={`Move step ${idx + 1} left`}
                                  className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold text-[#1E1B4B] bg-white hover:bg-[#ECE9FE] border border-[#D8D4F2] rounded-lg disabled:opacity-35 cursor-pointer"
                                >
                                  <ChevronLeft className="w-3 h-3" aria-hidden="true" />
                                  <span>Left</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveFlowScreen(idx, 1);
                                  }}
                                  disabled={idx === flowScreens.length - 1}
                                  title="Move Right"
                                  aria-label={`Move step ${idx + 1} right`}
                                  className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold text-[#1E1B4B] bg-white hover:bg-[#ECE9FE] border border-[#D8D4F2] rounded-lg disabled:opacity-35 cursor-pointer"
                                >
                                  <span>Right</span>
                                  <ChevronRight className="w-3 h-3" aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onFlowScreensChange((prev) =>
                                      prev.filter((s) => s.id !== screen.id)
                                    );
                                    setFocusedFlowStep((prev) => Math.max(0, prev - 1));
                                  }}
                                  aria-label={`Remove step ${idx + 1}`}
                                  className="p-1 text-[#5A5875] hover:text-rose-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <img
                                src={screen.dataUrl}
                                alt={screen.label}
                                className="w-14 h-10 object-cover rounded-lg border border-[#D8D4F2] shrink-0 bg-white"
                              />
                              <input
                                type="text"
                                value={screen.label}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  onFlowScreensChange((prev) =>
                                    prev.map((s) =>
                                      s.id === screen.id ? { ...s, label: val } : s
                                    )
                                  );
                                }}
                                aria-label={`Label for step ${idx + 1}`}
                                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-medium bg-white border border-[#D8D4F2] rounded-lg text-[#16142C] focus:outline-none focus:border-[#5B3DF5]"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#5A5875]">
                      {flowScreens.length < 2
                        ? 'Upload at least 2 screens to audit cross-step continuity.'
                        : `${flowScreens.length} screens ready for end-to-end flow audit`}
                    </span>
                    <button
                      type="button"
                      disabled={flowScreens.length < 2 || isCompressing}
                      onClick={() =>
                        onStartAudit({
                          mode: 'flow',
                          screens: flowScreens,
                        })
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#5B3DF5] hover:bg-[#492CE0] disabled:opacity-45 rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Start Flow Audit</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Context Field */}
            <div className="mt-6 pt-5 border-t border-[#ECE9FE]">
              <label
                htmlFor="audit-context"
                className="block text-xs font-semibold text-[#1E1B4B] mb-2"
              >
                What are users trying to do here? (optional)
              </label>
              <input
                id="audit-context"
                type="text"
                value={contextInput}
                onChange={(e) => onContextInputChange(e.target.value)}
                placeholder="e.g., New founders signing up for their first paid plan"
                className="w-full px-4 py-2.5 text-sm bg-[#FAF9FF] border border-[#D8D4F2] rounded-xl text-[#16142C] placeholder:text-[#8E8BA8] focus:outline-none focus:border-[#5B3DF5] focus:bg-white transition-colors"
              />
            </div>
          </section>

          {/* Right: Sample Broken UIs */}
          <section className="lg:col-span-5 saas-card p-6 sm:p-8 flex flex-col">
            <div className="mb-5">
              <p className="micro-label text-[#5B3DF5] mb-1.5">Instant Demo</p>
              <h2 className="font-display text-base font-bold text-[#16142C]">
                Or Inspect a Sample Interface
              </h2>
              <p className="mt-1 text-xs text-[#5A5875]">
                Run a full audit in one click without needing your own screenshots.
              </p>
            </div>

            <div className="flex flex-col gap-3.5 flex-1 justify-between">
              {SAMPLE_UI_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => void handleSampleClick(preset)}
                  className="group text-left bg-[#FAF9FF] hover:bg-[#F2EFFD] border border-[#D8D4F2] hover:border-[#5B3DF5]/50 rounded-2xl p-3.5 transition-all flex items-center gap-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
                >
                  <div className="w-28 h-[72px] rounded-xl bg-white border border-[#D8D4F2] overflow-hidden shrink-0 shadow-xs">
                    <img
                      src={sampleThumbnails[preset.id]}
                      alt={`${preset.title} preview`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#16142C] group-hover:text-[#5B3DF5] transition-colors truncate">
                        {preset.title}
                      </span>
                      <ArrowRight
                        className="w-4 h-4 text-[#8E8BA8] group-hover:text-[#5B3DF5] group-hover:translate-x-0.5 transition-all shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#5A5875]">
                      <span>{preset.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{preset.dimensions}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#5A5875] line-clamp-2 leading-snug">
                      {preset.summary}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Bottom 4-Column Feature Strip */}
        <section
          aria-label="Audit capabilities"
          className="mt-8 saas-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE9FE]"
        >
          <div className="p-6">
            <div className="micro-label text-[#5B3DF5] mb-2">01 · Plain-English Fixes</div>
            <h3 className="font-display text-sm font-bold text-[#16142C]">
              Zero Academic Jargon
            </h3>
            <p className="mt-1.5 text-xs text-[#5A5875] leading-relaxed">
              Every issue breaks down What&apos;s happening, Why it matters, and a Quick Fix.
            </p>
          </div>
          <div className="p-6">
            <div className="micro-label text-[#5B3DF5] mb-2">02 · Visual Spotlight</div>
            <h3 className="font-display text-sm font-bold text-[#16142C]">
              Guided Error Walkthrough
            </h3>
            <p className="mt-1.5 text-xs text-[#5A5875] leading-relaxed">
              Step through animated pulsing pins directly over your UI in a dedicated spotlight view.
            </p>
          </div>
          <div className="p-6">
            <div className="micro-label text-[#5B3DF5] mb-2">03 · Multi-Screen Flows</div>
            <h3 className="font-display text-sm font-bold text-[#16142C]">
              End-to-End Journey Audit
            </h3>
            <p className="mt-1.5 text-xs text-[#5A5875] leading-relaxed">
              Spot inconsistent navigation, dead ends, and drop-off friction across up to 5 steps.
            </p>
          </div>
          <div className="p-6">
            <div className="micro-label text-[#5B3DF5] mb-2">04 · Before vs. After</div>
            <h3 className="font-display text-sm font-bold text-[#16142C]">
              Live Fix Previews &amp; Specs
            </h3>
            <p className="mt-1.5 text-xs text-[#5A5875] leading-relaxed">
              Toggle visual previews on any issue to compare flawed vs. accessible components.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
