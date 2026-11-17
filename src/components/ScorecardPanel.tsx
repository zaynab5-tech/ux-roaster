import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Layers,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { InspectorTab } from './TopBar';
import {
  SEVERITY_META,
  type AuditErrorState,
  type AuditTone,
  type SeverityLevel,
  type UxAuditReport,
} from '../types/audit';
import { computeWcagContrast, evaluateWcagStatus } from '../utils/contrast';
import { buildMarkdownReport } from '../utils/markdownReport';
import { FixPreviewToggle } from './FixPreviewToggle';

interface ScorecardPanelProps {
  report: UxAuditReport | null;
  assetName: string;
  isMultiScreen: boolean;
  isLoading: boolean;
  statusMessage: string | null;
  errorState: AuditErrorState | null;
  activeTab: InspectorTab;
  onSelectTab: (tab: InspectorTab) => void;
  activeSeverityFilter: SeverityLevel | 'all';
  onSeverityFilterChange: (sev: SeverityLevel | 'all') => void;
  hoveredIssueId: number | null;
  selectedIssueId: number | null;
  onHoverIssue: (id: number | null) => void;
  onSelectIssue: (id: number) => void;
  tone: AuditTone;
  onToneChange: (tone: AuditTone) => void;
  onRerunAudit: () => void;
  onOpenSpotlight: () => void;
}

const SEVERITY_LEVELS: SeverityLevel[] = [4, 3, 2, 1, 0];

function gradeColorClass(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 65) return 'text-amber-600';
  return 'text-rose-600';
}

export function ScorecardPanel({
  report,
  assetName,
  isMultiScreen,
  isLoading,
  statusMessage,
  errorState,
  activeTab,
  onSelectTab,
  activeSeverityFilter,
  onSeverityFilterChange,
  hoveredIssueId,
  selectedIssueId,
  onHoverIssue,
  onSelectIssue,
  tone,
  onToneChange,
  onRerunAudit,
  onOpenSpotlight,
}: ScorecardPanelProps) {
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedIssueId !== null && activeTab === 'issues') {
      const el = cardRefs.current[selectedIssueId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIssueId, activeTab]);

  const handleCopyMarkdown = async () => {
    if (!report) return;
    const md = buildMarkdownReport(report, assetName);
    await navigator.clipboard.writeText(md);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 1800);
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const md = buildMarkdownReport(report, assetName);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = assetName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-');
    a.href = url;
    a.download = `ux-roaster-${safeName || 'audit'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (isLoading) {
    return (
      <aside
        aria-label="Audit scorecard loading"
        className="flex flex-col lavender-ambient-bg lg:h-full overflow-y-auto p-6 gap-5"
      >
        {statusMessage && (
          <div className="px-4 py-3 rounded-2xl bg-white border border-[#D8D4F2] text-xs font-semibold text-[#1E1B4B] flex items-center gap-2.5 shadow-xs">
            <span className="w-3.5 h-3.5 border-2 border-[#5B3DF5] border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="saas-card p-6 animate-pulse">
          <div className="h-3.5 w-32 bg-[#ECE9FE] rounded-full mb-3" />
          <div className="h-8 w-52 bg-[#ECE9FE] rounded-xl mb-4" />
          <div className="h-3 w-full bg-[#F5F3FF] rounded-full mb-2" />
          <div className="h-3 w-4/5 bg-[#F5F3FF] rounded-full" />
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-9 bg-white rounded-full border border-[#D8D4F2] animate-pulse" />
          ))}
        </div>

        {[1, 2, 3].map((n) => (
          <div key={n} className="saas-card p-5 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-28 bg-[#ECE9FE] rounded-full" />
              <div className="h-6 w-24 bg-[#ECE9FE] rounded-full" />
            </div>
            <div className="h-4 w-3/4 bg-[#F5F3FF] rounded-full mb-2.5" />
            <div className="h-3 w-full bg-[#F5F3FF] rounded-full" />
          </div>
        ))}
      </aside>
    );
  }

  if (errorState) {
    return (
      <aside className="flex flex-col lavender-ambient-bg lg:h-full overflow-y-auto p-6">
        <div role="alert" className="saas-card p-6 border-rose-200">
          <div className="flex items-center gap-2.5 font-display font-bold text-rose-800 mb-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
            <span>Audit Could Not Complete</span>
          </div>
          <p className="text-sm text-[#5A5875] leading-relaxed">{errorState.message}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRerunAudit}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#5B3DF5] hover:bg-[#492CE0] text-white rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Try Audit Again</span>
            </button>

            {errorState.technicalDetails && (
              <button
                type="button"
                onClick={() => setShowTechDetails((prev) => !prev)}
                aria-expanded={showTechDetails}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#1E1B4B] bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] rounded-xl transition-colors cursor-pointer"
              >
                <span>{showTechDetails ? 'Hide Technical Details' : 'Show Technical Details'}</span>
                {showTechDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            )}
          </div>

          {showTechDetails && errorState.technicalDetails && (
            <div className="mt-4 p-3.5 rounded-xl bg-[#FAF9FF] border border-[#D8D4F2] font-mono text-[11px] text-[#16142C] space-y-1.5 overflow-x-auto">
              <div>
                <span className="font-semibold text-[#5B3DF5]">HTTP Status:</span>{' '}
                {String(errorState.technicalDetails.status ?? 'N/A')}
              </div>
              {errorState.technicalDetails.model && (
                <div>
                  <span className="font-semibold text-[#5B3DF5]">Model:</span>{' '}
                  {errorState.technicalDetails.model}
                </div>
              )}
              <div className="break-all whitespace-pre-wrap">
                <span className="font-semibold text-[#5B3DF5]">Error Message:</span>{' '}
                {errorState.technicalDetails.rawMessage}
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  }

  if (!report) return null;

  const filteredIssues =
    activeSeverityFilter === 'all'
      ? report.issues
      : report.issues.filter((i) => i.severity === activeSeverityFilter);

  const severityCounts = SEVERITY_LEVELS.reduce<Record<SeverityLevel, number>>(
    (acc, lvl) => {
      acc[lvl] = report.issues.filter((i) => i.severity === lvl).length;
      return acc;
    },
    { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
  );

  const isWcagPass = report.wcagVerdict.toUpperCase().startsWith('PASS');

  return (
    <aside
      aria-label="Structured UX and WCAG scorecard"
      className="flex flex-col lavender-ambient-bg lg:h-full overflow-hidden"
    >
      {/* Executive Scorecard Header */}
      <div className="p-6 border-b border-[#D8D4F2] bg-white shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <div className="micro-label text-[#5A5875]">Usability Grade</div>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span
                  className={`font-display text-3xl font-extrabold tracking-tight ${gradeColorClass(
                    report.overallScore
                  )}`}
                >
                  {report.overallGrade}
                </span>
                <span className="font-mono text-sm font-semibold text-[#5A5875] tabular-nums">
                  {report.overallScore} / 100
                </span>
              </div>
            </div>

            <div className="h-10 w-px bg-[#ECE9FE]" aria-hidden="true" />

            <div>
              <div className="micro-label text-[#5A5875]">Accessibility</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
                {isWcagPass ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                )}
                <span className={isWcagPass ? 'text-emerald-700' : 'text-rose-700'}>
                  {report.wcagVerdict}
                </span>
              </div>
            </div>
          </div>

          {/* Spotlight + Export Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSpotlight}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#5B3DF5] hover:bg-[#492CE0] rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Open Visual Error Spotlight</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1E1B4B] bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedReport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy MD</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1E1B4B] bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export .md</span>
            </button>
          </div>
        </div>

        <p className="mt-3.5 text-sm text-[#16142C] leading-relaxed">{report.verdictSummary}</p>

        {report.strengths.length > 0 && (
          <div className="mt-2.5 text-xs text-[#5A5875] flex flex-wrap gap-x-2.5 gap-y-1">
            <span className="font-bold text-emerald-700">Working well:</span>
            {report.strengths.map((s, idx) => (
              <span key={idx}>
                {s}
                {idx < report.strengths.length - 1 ? ' ·' : ''}
              </span>
            ))}
          </div>
        )}

        {/* Scorecard Tabs & Tone Re-run */}
        <div className="mt-4 pt-4 border-t border-[#ECE9FE] flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Scorecard views"
            className="flex items-center gap-1 p-1 bg-[#F5F3FF] border border-[#E5E1FA] rounded-xl overflow-x-auto"
          >
            {(
              [
                ['issues', `Issues (${report.issues.length})`],
                ['heuristics', '10 Rules'],
                ['contrast', `Contrast (${report.contrastFlags.length})`],
                ['microcopy', `Copy Rewrite (${report.microcopyMakeovers.length})`],
              ] as [InspectorTab, string][]
            ).map(([tabId, label]) => (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={activeTab === tabId}
                onClick={() => onSelectTab(tabId)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tabId
                    ? 'bg-white text-[#16142C] shadow-xs'
                    : 'text-[#5A5875] hover:text-[#16142C]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToneChange(tone === 'brutal' ? 'principled' : 'brutal')}
              className="text-xs font-semibold text-[#1E1B4B] hover:border-[#5B3DF5] px-3 py-1.5 rounded-xl bg-white border border-[#D8D4F2] whitespace-nowrap shrink-0 cursor-pointer"
              title="Switch critique tone"
            >
              Tone: {tone === 'brutal' ? 'Brutal' : 'Mentor'}
            </button>
            <button
              type="button"
              onClick={onRerunAudit}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E1B4B] px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" />
              <span>Re-run</span>
            </button>
          </div>
        </div>
      </div>

      {/* Severity Filter Pills (shown on Issues view) */}
      {activeTab === 'issues' && (
        <div className="px-6 py-3 border-b border-[#D8D4F2] bg-white/80 backdrop-blur-xs flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => onSeverityFilterChange('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSeverityFilter === 'all'
                ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]'
                : 'bg-white text-[#5A5875] border-[#D8D4F2] hover:text-[#16142C]'
            }`}
          >
            All ({report.issues.length})
          </button>

          {SEVERITY_LEVELS.map((lvl) => {
            const meta = SEVERITY_META[lvl];
            const count = severityCounts[lvl];
            const isSelected = activeSeverityFilter === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onSeverityFilterChange(lvl)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? meta.badgeClasses
                    : 'bg-white text-[#5A5875] border-[#D8D4F2] hover:text-[#16142C]'
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable Tab Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* TAB 1: ANNOTATED ISSUES (+ FLOW CONSISTENCY) */}
        {activeTab === 'issues' && (
          <>
            {isMultiScreen && report.flowSummary && (
              <div className="saas-card p-5 border-[#C7BFF2]">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-[#5B3DF5]" aria-hidden="true" />
                  <span className="micro-label text-[#5B3DF5]">App Flow &amp; Journey Consistency</span>
                </div>
                <p className="text-sm text-[#16142C] leading-relaxed">{report.flowSummary}</p>

                {report.flowFindings && report.flowFindings.length > 0 && (
                  <div className="mt-4 space-y-3 pt-3 border-t border-[#ECE9FE]">
                    {report.flowFindings.map((flow) => {
                      const sev = SEVERITY_META[flow.severity];
                      return (
                        <div
                          key={flow.id}
                          className="p-3.5 rounded-xl bg-[#FAF9FF] border border-[#E5E1FA]"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-[#16142C]">
                              {flow.title} ·{' '}
                              <span className="font-medium text-[#5A5875]">{flow.stepsAffected}</span>
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${sev.badgeClasses}`}
                            >
                              {sev.shortLabel}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-[#5A5875]">
                            <p>
                              <strong className="text-[#16142C]">What&apos;s happening:</strong>{' '}
                              {flow.whatsHappening}
                            </p>
                            <p>
                              <strong className="text-[#16142C]">Why it matters:</strong>{' '}
                              {flow.whyItMatters}
                            </p>
                            <p>
                              <strong className="text-[#5B3DF5]">Quick Fix:</strong> {flow.quickFix}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {filteredIssues.length === 0 ? (
              <div className="saas-card p-8 text-center">
                <p className="text-sm font-medium text-[#5A5875]">
                  No issues match severity level {activeSeverityFilter}.
                </p>
                <button
                  type="button"
                  onClick={() => onSeverityFilterChange('all')}
                  className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-[#5B3DF5] hover:bg-[#492CE0] rounded-xl cursor-pointer"
                >
                  Show All Issues
                </button>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const sev = SEVERITY_META[issue.severity];
                const isActive =
                  hoveredIssueId === issue.id || selectedIssueId === issue.id;

                return (
                  <div
                    key={issue.id}
                    ref={(el) => {
                      cardRefs.current[issue.id] = el;
                    }}
                    onMouseEnter={() => onHoverIssue(issue.id)}
                    onMouseLeave={() => onHoverIssue(null)}
                    onClick={() => onSelectIssue(issue.id)}
                    className={`saas-card p-5 transition-all cursor-pointer ${
                      isActive
                        ? 'ring-2 ring-[#5B3DF5] border-[#5B3DF5]'
                        : 'hover:border-[#B8A9FA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border font-mono text-[11px] font-bold tabular-nums shrink-0 ${sev.pinClasses}`}
                        >
                          {issue.id}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-display text-[15px] font-bold text-[#16142C] leading-snug">
                            {issue.title}
                          </h3>
                          {isMultiScreen && (
                            <div className="text-[11px] font-semibold text-[#5B3DF5] mt-0.5">
                              Step {issue.screenIndex + 1}: {issue.screenLabel}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-semibold px-3 py-1 rounded-full border whitespace-nowrap shrink-0 ${sev.badgeClasses}`}
                      >
                        {sev.shortLabel}
                      </span>
                    </div>

                    {/* Three punchy plain-English lines */}
                    <div className="mt-3.5 space-y-2 text-[13px] leading-relaxed">
                      <p className="text-[#16142C]">
                        <span className="font-bold text-[#16142C]">What&apos;s happening: </span>
                        {issue.whatsHappening}
                      </p>
                      <p className="text-[#5A5875]">
                        <span className="font-bold text-[#1E1B4B]">Why it matters: </span>
                        {issue.whyItMatters}
                      </p>
                      <div className="pt-2.5 mt-2 border-t border-[#ECE9FE] text-[#16142C]">
                        <span className="font-bold text-[#5B3DF5]">Quick Fix: </span>
                        {issue.quickFix}
                      </div>
                    </div>

                    <FixPreviewToggle
                      preview={issue.fixPreview}
                      issueTitle={issue.title}
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5A5875]">
                      <span>
                        {issue.heuristicId} · {issue.heuristicName}
                        {issue.wcagCriterion &&
                          issue.wcagCriterion.toLowerCase() !== 'none' &&
                          ` · WCAG ${issue.wcagCriterion}`}
                      </span>
                      <span className="font-mono tabular-nums">
                        x:{issue.box.x.toFixed(0)}% y:{issue.box.y.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* TAB 2: NIELSEN'S 10 RULES */}
        {activeTab === 'heuristics' && (
          <div className="space-y-3.5">
            {report.heuristics.map((h) => {
              const sev = SEVERITY_META[h.severity];
              return (
                <div key={h.id} className="saas-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#5B3DF5] mr-2">
                        {h.id}
                      </span>
                      <span className="font-display text-[15px] font-bold text-[#16142C]">
                        {h.name}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-3 py-1 rounded-full border whitespace-nowrap shrink-0 ${sev.badgeClasses}`}
                    >
                      {sev.shortLabel}
                    </span>
                  </div>

                  <div
                    className="mt-3 grid grid-cols-5 gap-1.5"
                    aria-label={`Severity ${h.severity} of 4`}
                  >
                    {[0, 1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full ${
                          step <= h.severity ? sev.barColor : 'bg-[#ECE9FE]'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-[13.5px] text-[#16142C] leading-relaxed">
                    {h.finding}
                  </p>
                  <p className="mt-2 text-xs text-[#5A5875] leading-relaxed">
                    <span className="font-bold text-[#5B3DF5] mr-1.5">Quick Fix:</span>
                    {h.recommendation}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: WCAG 2.1 COLOR-CONTRAST FLAGS */}
        {activeTab === 'contrast' && (
          <div className="space-y-4">
            {report.contrastFlags.length === 0 ? (
              <div className="saas-card p-8 text-center text-sm text-[#5A5875]">
                No color-contrast problems flagged on this interface.
              </div>
            ) : (
              report.contrastFlags.map((flag) => {
                const calc = computeWcagContrast(
                  flag.foregroundHex,
                  flag.backgroundHex
                );
                const status = evaluateWcagStatus(
                  calc.ratio,
                  flag.textSize,
                  flag.wcagStatus
                );
                const ratioDisplay = calc.ratio
                  ? calc.formattedRatio
                  : flag.contrastRatio;
                const isFail = status === 'Fail AA';

                const fixCalc = computeWcagContrast(
                  flag.suggestedForegroundHex,
                  flag.backgroundHex
                );

                return (
                  <div key={flag.id} className="saas-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-[15px] font-bold text-[#16142C]">
                          {flag.element}
                        </h3>
                        <div className="mt-0.5 text-xs text-[#5A5875]">{flag.textSize}</div>
                      </div>
                      <span
                        className={`font-mono text-[11px] font-semibold px-3 py-1 rounded-full border whitespace-nowrap shrink-0 ${
                          isFail
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : status === 'Pass AAA'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {ratioDisplay} · {status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl p-3 bg-[#FAF9FF] border border-[#D8D4F2] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-lg border border-[#D8D4F2] flex items-center justify-center font-sans text-xs font-bold shrink-0"
                            style={{
                              backgroundColor: calc.bgValid,
                              color: calc.fgValid,
                            }}
                          >
                            Aa
                          </div>
                          <div className="font-mono text-[11px] text-[#16142C] truncate">
                            <div>FG {calc.fgValid}</div>
                            <div className="text-[#5A5875]">BG {calc.bgValid}</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-[#5A5875]">
                          Current
                        </span>
                      </div>

                      <div className="rounded-xl p-3 bg-[#FAF9FF] border border-[#D8D4F2] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-lg border border-[#D8D4F2] flex items-center justify-center font-sans text-xs font-bold shrink-0"
                            style={{
                              backgroundColor: calc.bgValid,
                              color: fixCalc.fgValid,
                            }}
                          >
                            Aa
                          </div>
                          <div className="font-mono text-[11px] text-[#16142C] truncate">
                            <div>FG {fixCalc.fgValid}</div>
                            <div className="text-emerald-700 font-semibold">
                              {fixCalc.formattedRatio}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(`hex-${flag.id}`, fixCalc.fgValid)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#1E1B4B] bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] rounded-lg cursor-pointer shrink-0"
                        >
                          {copiedId === `hex-${flag.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Copy className="w-3 h-3" aria-hidden="true" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-[#5A5875] leading-relaxed">
                      {flag.recommendation}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 4: MICROCOPY MAKEOVER TABLE */}
        {activeTab === 'microcopy' && (
          <div className="saas-card overflow-hidden">
            {report.microcopyMakeovers.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#5A5875]">
                No unclear button or label copy flagged.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#D8D4F2] bg-[#FAF9FF] micro-label text-[#5A5875]">
                      <th className="py-3 px-4">Current UI Text</th>
                      <th className="py-3 px-4">Why It Confuses Users</th>
                      <th className="py-3 px-4">Clear Rewrite</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE9FE] text-xs">
                    {report.microcopyMakeovers.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#FAF9FF] transition-colors align-top"
                      >
                        <td className="py-3.5 px-4 max-w-[180px]">
                          <div className="text-[11px] text-[#5A5875] mb-1">
                            {item.location}
                          </div>
                          <div className="font-semibold text-rose-700 line-through decoration-rose-400">
                            &ldquo;{item.originalText}&rdquo;
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#5A5875] leading-relaxed max-w-[210px]">
                          {item.whyItFails}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-[#16142C] leading-snug">
                              &ldquo;{item.rewrittenText}&rdquo;
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(`copy-${item.id}`, item.rewrittenText)
                              }
                              aria-label={`Copy rewritten copy: ${item.rewrittenText}`}
                              className="p-1.5 text-[#1E1B4B] bg-[#F5F3FF] hover:bg-[#ECE9FE] border border-[#D8D4F2] rounded-lg shrink-0 cursor-pointer"
                            >
                              {copiedId === `copy-${item.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                              ) : (
                                <Copy className="w-3 h-3" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                          <p className="mt-1 text-[11px] text-[#5A5875] leading-snug">
                            {item.toneRationale}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
