import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  SEVERITY_META,
  type AppViewStage,
  type AuditedScreenAsset,
  type AuditIssue,
} from '../types/audit';
import { FixPreviewToggle } from './FixPreviewToggle';

interface VisualSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateStage: (stage: AppViewStage) => void;
  onStartNewAudit: () => void;
  screens: AuditedScreenAsset[];
  issues: AuditIssue[];
  initialIssueId?: number | null;
}

export function VisualSpotlightModal({
  isOpen,
  onClose,
  onNavigateStage,
  onStartNewAudit,
  screens,
  issues,
  initialIssueId,
}: VisualSpotlightModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const sidebarRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!isOpen || issues.length === 0) return;
    if (initialIssueId != null) {
      const foundIdx = issues.findIndex((i) => i.id === initialIssueId);
      setActiveIndex(foundIdx >= 0 ? foundIdx : 0);
    } else {
      setActiveIndex(0);
    }
  }, [isOpen, initialIssueId, issues]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % Math.max(1, issues.length));
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex(
          (prev) => (prev - 1 + Math.max(1, issues.length)) % Math.max(1, issues.length)
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, issues.length, onClose]);

  const activeIssue = issues[activeIndex] || null;
  const highlightedIssue =
    (hoveredId !== null ? issues.find((i) => i.id === hoveredId) : null) ??
    activeIssue;

  useEffect(() => {
    if (!isOpen || !activeIssue) return;
    const el = sidebarRefs.current[activeIssue.id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isOpen, activeIssue]);

  const currentScreenIndex = highlightedIssue?.screenIndex ?? 0;
  const currentScreen = screens[currentScreenIndex] || screens[0];
  const currentScreenIssues = issues.filter(
    (issue) => issue.screenIndex === currentScreenIndex
  );

  const focusOriginX = highlightedIssue
    ? Math.min(90, Math.max(10, highlightedIssue.box.x + highlightedIssue.box.width / 2))
    : 50;
  const focusOriginY = highlightedIssue
    ? Math.min(90, Math.max(10, highlightedIssue.box.y + highlightedIssue.box.height / 2))
    : 50;

  return (
    <AnimatePresence>
      {isOpen && issues.length > 0 && (
        <motion.div
          key="spotlight-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex flex-col lavender-ambient-bg"
          role="dialog"
          aria-modal="true"
          aria-label="Visual Error Spotlight"
        >
          {/* Consistent Top Header with Back Button + Clickable Breadcrumbs */}
          <header className="h-16 px-4 sm:px-6 bg-white border-b border-[#D8D4F2] flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onClose}
                aria-label="Back to Audit Scorecard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E1B4B] bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#ECE9FE] text-[#5B3DF5] hidden sm:flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-sm font-bold text-[#16142C] truncate">
                    Visual Error Spotlight
                  </h2>
                  <p className="text-[11px] text-[#5A5875] truncate">
                    {screens.length > 1 && currentScreen
                      ? `Step ${currentScreenIndex + 1} of ${screens.length}: ${currentScreen.label}`
                      : currentScreen?.label || 'Guided Walkthrough'}
                  </p>
                </div>
              </div>
            </div>

            {/* Clickable 3-Step Breadcrumbs */}
            <nav
              aria-label="Spotlight workflow breadcrumbs"
              className="hidden lg:flex items-center gap-1.5 shrink-0"
            >
              <button
                type="button"
                onClick={() => onNavigateStage('upload')}
                className="px-3 py-1.5 text-xs font-semibold text-[#5A5875] hover:text-[#16142C] hover:bg-[#F5F3FF] rounded-full transition-colors cursor-pointer"
              >
                1. Upload Input
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#B4AEDB]" aria-hidden="true" />
              <button
                type="button"
                onClick={() => onNavigateStage('scorecard')}
                className="px-3 py-1.5 text-xs font-semibold text-[#5A5875] hover:text-[#16142C] hover:bg-[#F5F3FF] rounded-full transition-colors cursor-pointer"
              >
                2. Audit Scorecard
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#B4AEDB]" aria-hidden="true" />
              <span className="px-3 py-1.5 text-xs font-semibold bg-[#ECE9FE] text-[#492CE0] rounded-full">
                3. Visual Error Spotlight
              </span>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex font-mono text-xs font-semibold text-[#5B3DF5] bg-[#F5F3FF] border border-[#D8D4F2] px-3 py-1.5 rounded-full tabular-nums">
                Issue {activeIndex + 1} of {issues.length}
              </span>
              <button
                type="button"
                onClick={onStartNewAudit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1E1B4B] bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Start New Audit</span>
              </button>
            </div>
          </header>

          {/* Main Stage + Issue Sidebar */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px]">
            {/* Left / Center Stage */}
            <div className="relative overflow-auto inspector-stage-bg p-6 sm:p-10 flex items-center justify-center">
              {currentScreen && (
                <motion.div
                  key={currentScreen.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{
                    opacity: 1,
                    scale: 1.02,
                  }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    transformOrigin: `${focusOriginX}% ${focusOriginY}%`,
                  }}
                  className="relative inline-block max-w-4xl w-full rounded-2xl bg-white shadow-[0_24px_60px_-15px_rgba(91,61,245,0.22),0_0_0_1px_#D8D4F2]"
                >
                  <img
                    src={currentScreen.dataUrl}
                    alt={currentScreen.label}
                    className="block w-full h-auto rounded-2xl select-none"
                  />

                  {/* Staggered Pulsing Pins & Bounding Boxes */}
                  <div className="absolute inset-0 pointer-events-none">
                    {currentScreenIssues.map((issue, localIdx) => {
                      const sev = SEVERITY_META[issue.severity];
                      const isActive = highlightedIssue?.id === issue.id;
                      const isDimmed = highlightedIssue !== null && !isActive;

                      const pinInsideTop = issue.box.y < 4.5;
                      const pinInsideLeft = issue.box.x < 3;

                      return (
                        <motion.div
                          key={issue.id}
                          initial={{ opacity: 0, scale: 0.88 }}
                          animate={{ opacity: isDimmed ? 0.32 : 1, scale: 1 }}
                          transition={{
                            duration: 0.28,
                            delay: localIdx * 0.08,
                          }}
                          style={{
                            left: `${issue.box.x}%`,
                            top: `${issue.box.y}%`,
                            width: `${issue.box.width}%`,
                            height: `${issue.box.height}%`,
                            borderColor: isActive ? '#5B3DF5' : sev.boxBorderColor,
                            backgroundColor: isActive
                              ? 'rgba(91, 61, 245, 0.16)'
                              : sev.boxFillColor,
                          }}
                          onMouseEnter={() => setHoveredId(issue.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          onClick={() => {
                            const idx = issues.findIndex((i) => i.id === issue.id);
                            if (idx >= 0) setActiveIndex(idx);
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Spotlight pin ${issue.id}: ${issue.title}`}
                          className={`absolute pointer-events-auto border-2 rounded-xl cursor-pointer transition-shadow duration-200 ${
                            isActive
                              ? 'z-30 ring-4 ring-[#5B3DF5]/35 shadow-[0_0_32px_rgba(91,61,245,0.45)]'
                              : 'z-10'
                          }`}
                        >
                          {/* Pin with Staggered Drop-In & Gentle Radar Pulse Ring */}
                          <motion.div
                            initial={{ y: -16, scale: 0.3, opacity: 0 }}
                            animate={{ y: 0, scale: isActive ? 1.18 : 1, opacity: 1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 420,
                              damping: 22,
                              delay: localIdx * 0.1,
                            }}
                            className={`absolute ${pinInsideTop ? 'top-1.5' : '-top-3.5'} ${
                              pinInsideLeft ? 'left-1.5' : '-left-3.5'
                            }`}
                          >
                            <motion.span
                              aria-hidden="true"
                              animate={{
                                scale: [1, 1.9],
                                opacity: [0.55, 0],
                              }}
                              transition={{
                                duration: 2.2,
                                repeat: Infinity,
                                ease: 'easeOut',
                                delay: localIdx * 0.15,
                              }}
                              style={{ backgroundColor: isActive ? '#5B3DF5' : sev.pulseColor }}
                              className="absolute inset-0 rounded-full pointer-events-none"
                            />
                            <span
                              className={`relative inline-flex items-center justify-center min-w-[26px] h-[26px] px-1.5 rounded-full border-2 font-mono text-[11px] font-bold tabular-nums shadow-md ${
                                isActive
                                  ? 'bg-[#5B3DF5] text-white border-white ring-2 ring-[#5B3DF5]/40'
                                  : sev.pinClasses
                              }`}
                            >
                              {issue.id}
                            </span>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Sidebar Issue List + Active Fix Preview Drawer */}
            <aside className="bg-white border-t lg:border-t-0 lg:border-l border-[#D8D4F2] overflow-y-auto p-4 space-y-2.5">
              <div className="px-2 py-1 flex items-center justify-between">
                <span className="micro-label text-[#5A5875]">All Flagged Issues</span>
                <span className="text-xs font-mono text-[#5B3DF5] font-semibold">
                  {issues.length}
                </span>
              </div>

              {issues.map((issue, idx) => {
                const sev = SEVERITY_META[issue.severity];
                const isActive = activeIndex === idx;
                return (
                  <div
                    key={issue.id}
                    ref={(el) => {
                      sidebarRefs.current[issue.id] = el as unknown as HTMLButtonElement | null;
                    }}
                    onMouseEnter={() => setHoveredId(issue.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setActiveIndex(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveIndex(idx);
                      }
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#F5F3FF] border-[#5B3DF5] shadow-xs'
                        : 'bg-white border-[#ECE9FE] hover:border-[#C7BFF2] hover:bg-[#FAF9FF]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full border font-mono text-[11px] font-bold shrink-0 ${
                          isActive ? 'bg-[#5B3DF5] text-white border-white' : sev.pinClasses
                        }`}
                      >
                        {issue.id}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#16142C] truncate">
                            {issue.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${sev.badgeClasses}`}
                          >
                            {sev.shortLabel}
                          </span>
                        </div>
                        {screens.length > 1 && (
                          <div className="text-[11px] text-[#5B3DF5] font-medium mt-0.5">
                            Step {issue.screenIndex + 1}: {issue.screenLabel}
                          </div>
                        )}
                        <p className="mt-1 text-xs text-[#5A5875] line-clamp-2">
                          {issue.whatsHappening}
                        </p>

                        {isActive && (
                          <FixPreviewToggle
                            preview={issue.fixPreview}
                            issueTitle={issue.title}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </aside>
          </div>

          {/* Bottom Guided Walkthrough Bar with Sliding Plain-English Card */}
          <footer className="bg-white border-t border-[#D8D4F2] px-6 py-4 shrink-0">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="flex-1 min-w-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeIssue && (
                    <motion.div
                      key={activeIssue.id}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col sm:flex-row sm:items-start gap-3"
                    >
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#5B3DF5] text-white font-mono text-xs font-bold shrink-0 mt-0.5">
                        {activeIssue.id}
                      </span>
                      <div className="min-w-0 space-y-1 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-sm font-bold text-[#16142C]">
                            {activeIssue.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                              SEVERITY_META[activeIssue.severity].badgeClasses
                            }`}
                          >
                            {SEVERITY_META[activeIssue.severity].shortLabel}
                          </span>
                        </div>
                        <p className="text-[#16142C]">
                          <strong>What&apos;s happening:</strong> {activeIssue.whatsHappening}
                        </p>
                        <p className="text-[#5A5875]">
                          <strong>Why it matters:</strong> {activeIssue.whyItMatters} ·{' '}
                          <strong className="text-[#5B3DF5]">Quick Fix:</strong>{' '}
                          {activeIssue.quickFix}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => (prev - 1 + issues.length) % issues.length)
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#1E1B4B] bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Previous Error</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => (prev + 1) % issues.length)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#5B3DF5] hover:bg-[#492CE0] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Next Issue</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
