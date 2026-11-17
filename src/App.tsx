import { useCallback, useEffect, useState } from 'react';
import { TopBar, type InspectorTab } from './components/TopBar';
import { UploadWorkspace } from './components/UploadWorkspace';
import { ScreenshotInspector } from './components/ScreenshotInspector';
import { ScorecardPanel } from './components/ScorecardPanel';
import { VisualSpotlightModal } from './components/VisualSpotlightModal';
import type {
  AppViewStage,
  AuditedScreenAsset,
  AuditErrorState,
  AuditInputMode,
  AuditTechnicalDetails,
  AuditTone,
  SeverityLevel,
  UxAuditReport,
} from './types/audit';

interface ActiveSubmission {
  mode: AuditInputMode;
  screens: AuditedScreenAsset[];
  sourceUrl?: string;
  contextUsed: string;
}

type StreamChunk =
  | { type: 'status'; message: string }
  | { type: 'result'; report: UxAuditReport }
  | { type: 'error'; message: string; technicalDetails?: AuditTechnicalDetails };

class AuditRequestError extends Error {
  technicalDetails?: AuditTechnicalDetails;
  constructor(message: string, technicalDetails?: AuditTechnicalDetails) {
    super(message);
    this.technicalDetails = technicalDetails;
  }
}

export default function App() {
  // Preserved input state across Back navigation
  const [inputMode, setInputMode] = useState<AuditInputMode>('single');
  const [urlInput, setUrlInput] = useState('');
  const [flowScreens, setFlowScreens] = useState<AuditedScreenAsset[]>([]);
  const [tone, setTone] = useState<AuditTone>('brutal');
  const [contextInput, setContextInput] = useState('');

  // Navigation stage & preserved audit results
  const [viewStage, setViewStage] = useState<AppViewStage>('upload');
  const [submission, setSubmission] = useState<ActiveSubmission | null>(null);
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const [report, setReport] = useState<UxAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<AuditErrorState | null>(null);

  const [activeTab, setActiveTab] = useState<InspectorTab>('issues');
  const [activeSeverityFilter, setActiveSeverityFilter] = useState<
    SeverityLevel | 'all'
  >('all');
  const [hoveredIssueId, setHoveredIssueId] = useState<number | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  const runAudit = useCallback(
    async (sub: ActiveSubmission, auditTone: AuditTone) => {
      setIsLoading(true);
      setViewStage('scorecard');
      setStatusMessage(
        sub.mode === 'flow'
          ? `Auditing ${sub.screens.length} sequential screens & flow continuity…`
          : 'Inspecting layout hierarchy, contrast, and microcopy…'
      );
      setErrorState(null);
      setReport(null);
      setActiveScreenIndex(0);
      setHoveredIssueId(null);
      setSelectedIssueId(null);
      setActiveSeverityFilter('all');
      setActiveTab('issues');

      try {
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: sub.mode,
            sourceUrl: sub.sourceUrl,
            context: sub.contextUsed,
            tone: auditTone,
            screens: sub.screens.map((s) => ({
              label: s.label,
              imageBase64: s.dataUrl,
              mimeType: s.mimeType,
            })),
          }),
        });

        const contentType = res.headers.get('content-type') || '';

        if (!contentType.includes('application/x-ndjson')) {
          const data = (await res.json()) as UxAuditReport & {
            error?: string;
            technicalDetails?: AuditTechnicalDetails;
          };
          if (!res.ok) {
            throw new AuditRequestError(
              data.error ||
                'Our design auditor encountered an issue. Please try again in a moment.',
              data.technicalDetails ?? {
                status: res.status,
                rawMessage: data.error || `HTTP ${res.status}`,
              }
            );
          }
          setReport(data);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new AuditRequestError(
            'Unable to read response stream from the design auditor.',
            { status: 'STREAM;ERROR', rawMessage: 'res.body.getReader() returned null' }
          );
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let receivedReport = false;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const chunk = JSON.parse(trimmed) as StreamChunk;
            if (chunk.type === 'status') {
              setStatusMessage(chunk.message);
            } else if (chunk.type === 'result') {
              setReport(chunk.report);
              receivedReport = true;
            } else if (chunk.type === 'error') {
              throw new AuditRequestError(chunk.message, chunk.technicalDetails);
            }
          }
        }

        if (buffer.trim()) {
          const chunk = JSON.parse(buffer.trim()) as StreamChunk;
          if (chunk.type === 'result') {
            setReport(chunk.report);
            receivedReport = true;
          } else if (chunk.type === 'error') {
            throw new AuditRequestError(chunk.message, chunk.technicalDetails);
          }
        }

        if (!receivedReport) {
          throw new AuditRequestError(
            'Our design auditor did not finish the analysis. Please try running the audit again.',
            {
              status: 'INCOMPLETE;STREAM',
              rawMessage: 'NDJSON stream ended without a result payload.',
            }
          );
        }
      } catch (err: unknown) {
        if (err instanceof AuditRequestError) {
          setErrorState({
            message: err.message,
            technicalDetails: err.technicalDetails,
          });
        } else {
          const raw = err instanceof Error ? err.message : String(err);
          setErrorState({
            message:
              'Our design auditor encountered an unexpected error. Open technical details below for diagnostics.',
            technicalDetails: { status: 'CLIENT;ERROR', rawMessage: raw },
          });
        }
      } finally {
        setIsLoading(false);
        setStatusMessage(null);
      }
    },
    []
  );

  const handleStartAudit = useCallback(
    (params: {
      mode: AuditInputMode;
      screens: AuditedScreenAsset[];
      sourceUrl?: string;
      contextOverride?: string;
    }) => {
      const nextSub: ActiveSubmission = {
        mode: params.mode,
        screens: params.screens,
        sourceUrl: params.sourceUrl,
        contextUsed: params.contextOverride ?? contextInput,
      };
      setSubmission(nextSub);
      void runAudit(nextSub, tone);
    },
    [contextInput, tone, runAudit]
  );

  // Explicit reset only when user clicks "Start New Audit"
  const handleStartNewAudit = useCallback(() => {
    setViewStage('upload');
    setSubmission(null);
    setReport(null);
    setActiveScreenIndex(0);
    setStatusMessage(null);
    setErrorState(null);
    setHoveredIssueId(null);
    setSelectedIssueId(null);
    setActiveSeverityFilter('all');
    setActiveTab('issues');
  }, []);

  // Consistent backward navigation preserving uploaded screens and audit results
  const handleGoBack = useCallback(() => {
    setViewStage((prev) => {
      if (prev === 'spotlight') return 'scorecard';
      if (prev === 'scorecard') return 'upload';
      return 'upload';
    });
  }, []);

  const handleNavigateStage = useCallback(
    (target: AppViewStage) => {
      if (target === 'scorecard' && !submission) return;
      if (target === 'spotlight' && !report) return;
      setViewStage(target);
    },
    [submission, report]
  );

  const syncScreenToIssue = useCallback(
    (id: number | null) => {
      if (id === null || !report) return;
      const matched = report.issues.find((i) => i.id === id);
      if (matched && matched.screenIndex !== activeScreenIndex) {
        setActiveScreenIndex(matched.screenIndex);
      }
    },
    [report, activeScreenIndex]
  );

  const handleHoverIssue = useCallback(
    (id: number | null) => {
      setHoveredIssueId(id);
      syncScreenToIssue(id);
    },
    [syncScreenToIssue]
  );

  const handleSelectIssueFromCard = useCallback(
    (id: number) => {
      syncScreenToIssue(id);
      setSelectedIssueId((prev) => (prev === id ? null : id));
    },
    [syncScreenToIssue]
  );

  const handleSelectIssueFromPin = useCallback((id: number) => {
    setSelectedIssueId(id);
    setActiveTab('issues');
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewStage !== 'spotlight') {
        setSelectedIssueId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewStage]);

  const assetName =
    submission?.mode === 'flow'
      ? `App Flow (${submission.screens.length} screens)`
      : submission?.sourceUrl || submission?.screens[0]?.name || 'interface';

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lavender-ambient-bg text-[#16142C] lg:overflow-hidden">
      <TopBar
        viewStage={viewStage}
        hasSubmission={Boolean(submission)}
        hasReport={Boolean(report)}
        onNavigateStage={handleNavigateStage}
        onGoBack={handleGoBack}
        onStartNewAudit={handleStartNewAudit}
      />

      {viewStage === 'upload' || !submission ? (
        <UploadWorkspace
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          urlInput={urlInput}
          onUrlInputChange={setUrlInput}
          flowScreens={flowScreens}
          onFlowScreensChange={setFlowScreens}
          tone={tone}
          onToneChange={setTone}
          contextInput={contextInput}
          onContextInputChange={setContextInput}
          onStartAudit={handleStartAudit}
          errorState={errorState}
        />
      ) : (
        <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <ScreenshotInspector
            screens={submission.screens}
            activeScreenIndex={activeScreenIndex}
            onSelectScreenIndex={setActiveScreenIndex}
            issues={report?.issues ?? []}
            activeSeverityFilter={activeSeverityFilter}
            hoveredIssueId={hoveredIssueId}
            selectedIssueId={selectedIssueId}
            onHoverIssue={handleHoverIssue}
            onSelectIssue={handleSelectIssueFromPin}
            onReplaceImage={handleGoBack}
            onOpenSpotlight={() => handleNavigateStage('spotlight')}
            hasReport={Boolean(report)}
            isLoading={isLoading}
            statusMessage={statusMessage}
          />

          <ScorecardPanel
            report={report}
            assetName={assetName}
            isMultiScreen={submission.screens.length > 1}
            isLoading={isLoading}
            statusMessage={statusMessage}
            errorState={errorState}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            activeSeverityFilter={activeSeverityFilter}
            onSeverityFilterChange={setActiveSeverityFilter}
            hoveredIssueId={hoveredIssueId}
            selectedIssueId={selectedIssueId}
            onHoverIssue={handleHoverIssue}
            onSelectIssue={handleSelectIssueFromCard}
            tone={tone}
            onToneChange={setTone}
            onRerunAudit={() => {
              if (submission) {
                void runAudit(submission, tone);
              }
            }}
            onOpenSpotlight={() => handleNavigateStage('spotlight')}
          />
        </main>
      )}

      {submission && report && (
        <VisualSpotlightModal
          isOpen={viewStage === 'spotlight'}
          onClose={() => handleNavigateStage('scorecard')}
          onNavigateStage={handleNavigateStage}
          onStartNewAudit={handleStartNewAudit}
          screens={submission.screens}
          issues={report.issues}
          initialIssueId={selectedIssueId}
        />
      )}
    </div>
  );
}
