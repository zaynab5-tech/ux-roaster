import { ArrowLeft, ChevronRight, Plus, RotateCcw, Sparkles } from 'lucide-react';
import type { AppViewStage } from '../types/audit';

export type InspectorTab = 'issues' | 'heuristics' | 'contrast' | 'microcopy';

interface TopBarProps {
  viewStage: AppViewStage;
  hasSubmission: boolean;
  hasReport: boolean;
  onNavigateStage: (stage: AppViewStage) => void;
  onGoBack: () => void;
  onStartNewAudit: () => void;
}

export function TopBar({
  viewStage,
  hasSubmission,
  hasReport,
  onNavigateStage,
  onGoBack,
  onStartNewAudit,
}: TopBarProps) {
  const showBack = viewStage !== 'upload';

  const steps: {
    stage: AppViewStage;
    label: string;
    enabled: boolean;
  }[] = [
    { stage: 'upload', label: '1. Upload Input', enabled: true },
    { stage: 'scorecard', label: '2. Audit Scorecard', enabled: hasSubmission },
    { stage: 'spotlight', label: '3. Visual Error Spotlight', enabled: hasReport },
  ];

  return (
    <header className="h-16 border-b border-[#D8D4F2] bg-white px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shrink-0">
      {/* Zone 1: Back button (when past Upload) + Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        {showBack && (
          <button
            type="button"
            onClick={onGoBack}
            aria-label="Go back to previous view"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E1B4B] bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onNavigateStage('upload')}
          className="font-display text-lg font-bold tracking-tight text-[#16142C] hover:text-[#5B3DF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5B3DF5] rounded-sm"
        >
          UX Roaster
        </button>
      </div>

      {/* Zone 2: Clickable 3-Step Breadcrumb Trail */}
      <nav
        aria-label="Audit workflow steps"
        className="hidden md:flex items-center gap-1.5 overflow-x-auto"
      >
        {steps.map((step, idx) => {
          const isCurrent = viewStage === step.stage;
          return (
            <div key={step.stage} className="flex items-center gap-1.5 shrink-0">
              {idx > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-[#B4AEDB] shrink-0"
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                disabled={!step.enabled}
                onClick={() => {
                  if (step.enabled) onNavigateStage(step.stage);
                }}
                aria-current={isCurrent ? 'step' : undefined}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-default ${
                  isCurrent
                    ? 'bg-[#ECE9FE] text-[#492CE0]'
                    : step.enabled
                    ? 'text-[#5A5875] hover:text-[#16142C] hover:bg-[#F5F3FF]'
                    : 'text-[#B5B2CC]'
                }`}
              >
                {step.label}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Zone 3: Primary & Reset Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {hasSubmission && (
          <button
            type="button"
            onClick={onStartNewAudit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1E1B4B] bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Start New Audit</span>
          </button>
        )}

        {viewStage === 'scorecard' && hasReport ? (
          <button
            type="button"
            onClick={() => onNavigateStage('spotlight')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#5B3DF5] hover:bg-[#492CE0] rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Visual Spotlight</span>
            <span className="sm:hidden">Spotlight</span>
          </button>
        ) : viewStage === 'upload' && hasSubmission ? (
          <button
            type="button"
            onClick={() => onNavigateStage('scorecard')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#5B3DF5] hover:bg-[#492CE0] rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Return to Scorecard</span>
          </button>
        ) : !hasSubmission ? (
          <button
            type="button"
            onClick={() => onNavigateStage('upload')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#5B3DF5] hover:bg-[#492CE0] rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Start Audit</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
