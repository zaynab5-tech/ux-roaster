import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Maximize2,
  RefreshCw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  SEVERITY_META,
  type AuditedScreenAsset,
  type AuditIssue,
  type SeverityLevel,
} from '../types/audit';

interface ScreenshotInspectorProps {
  screens: AuditedScreenAsset[];
  activeScreenIndex: number;
  onSelectScreenIndex: (idx: number) => void;
  issues: AuditIssue[];
  activeSeverityFilter: SeverityLevel | 'all';
  hoveredIssueId: number | null;
  selectedIssueId: number | null;
  onHoverIssue: (id: number | null) => void;
  onSelectIssue: (id: number) => void;
  onReplaceImage: () => void;
  onOpenSpotlight: () => void;
  hasReport: boolean;
  isLoading: boolean;
  statusMessage: string | null;
}

export function ScreenshotInspector({
  screens,
  activeScreenIndex,
  onSelectScreenIndex,
  issues,
  activeSeverityFilter,
  hoveredIssueId,
  selectedIssueId,
  onHoverIssue,
  onSelectIssue,
  onReplaceImage,
  onOpenSpotlight,
  hasReport,
  isLoading,
  statusMessage,
}: ScreenshotInspectorProps) {
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showPins, setShowPins] = useState<boolean>(true);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const activeScreen = screens[activeScreenIndex] || screens[0];

  const screenIssues = issues.filter(
    (issue) =>
      issue.screenIndex === activeScreenIndex &&
      (activeSeverityFilter === 'all' || issue.severity === activeSeverityFilter)
  );

  const activeHighlightId = hoveredIssueId ?? selectedIssueId;

  return (
    <section
      aria-label="Visual screenshot inspector"
      className="flex flex-col bg-[#F5F3FF] border-b lg:border-b-0 lg:border-r border-[#D8D4F2] min-h-[460px] lg:h-full overflow-hidden"
    >
      {/* Inspector Toolbar */}
      <div className="h-12 px-4 sm:px-5 border-b border-[#D8D4F2] bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-[#16142C] truncate max-w-[160px] sm:max-w-[220px]">
            {activeScreen?.label || activeScreen?.name}
          </span>
          {naturalSize && (
            <span className="hidden md:inline font-mono text-[11px] text-[#5A5875] whitespace-nowrap shrink-0">
              · {naturalSize.w}×{naturalSize.h}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasReport && (
            <button
              type="button"
              onClick={onOpenSpotlight}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#5B3DF5] hover:bg-[#492CE0] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              <span>Spotlight</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowBoxes((v) => !v)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showBoxes
                ? 'bg-[#ECE9FE] text-[#492CE0] border-[#D8D4F2]'
                : 'bg-white text-[#5A5875] border-[#D8D4F2] hover:text-[#16142C]'
            }`}
            title="Toggle bounding boxes"
          >
            {showBoxes ? (
              <Eye className="w-3 h-3" aria-hidden="true" />
            ) : (
              <EyeOff className="w-3 h-3" aria-hidden="true" />
            )}
            <span>Boxes</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPins((v) => !v)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showPins
                ? 'bg-[#ECE9FE] text-[#492CE0] border-[#D8D4F2]'
                : 'bg-white text-[#5A5875] border-[#D8D4F2] hover:text-[#16142C]'
            }`}
            title="Toggle numbered pins"
          >
            <span>Pins</span>
          </button>

          <div className="h-4 w-px bg-[#D8D4F2] mx-0.5 hidden sm:block" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setZoomPercent((z) => Math.max(50, z - 25))}
            aria-label="Zoom out"
            className="p-1.5 text-[#5A5875] hover:text-[#16142C] rounded-lg hover:bg-[#F5F3FF] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <span className="font-mono text-[11px] text-[#16142C] w-10 text-center tabular-nums">
            {zoomPercent}%
          </span>
          <button
            type="button"
            onClick={() => setZoomPercent((z) => Math.min(200, z + 25))}
            aria-label="Zoom in"
            className="p-1.5 text-[#5A5875] hover:text-[#16142C] rounded-lg hover:bg-[#F5F3FF] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoomPercent(100)}
            aria-label="Reset zoom to 100%"
            className="p-1.5 text-[#5A5875] hover:text-[#16142C] rounded-lg hover:bg-[#F5F3FF] transition-colors cursor-pointer"
            title="Fit width"
          >
            <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onReplaceImage}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-[#1E1B4B] bg-white hover:bg-[#F5F3FF] border border-[#D8D4F2] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ml-1"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Multi-Screen Flow Step Bar */}
      {screens.length > 1 && (
        <div className="px-4 py-2.5 border-b border-[#D8D4F2] bg-[#FAF9FF] flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="micro-label text-[#5A5875] mr-1 shrink-0">Flow Steps</span>
          {screens.map((scr, idx) => {
            const count = issues.filter((i) => i.screenIndex === idx).length;
            const active = idx === activeScreenIndex;
            return (
              <button
                key={scr.id}
                type="button"
                onClick={() => onSelectScreenIndex(idx)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]'
                    : 'bg-white text-[#1E1B4B] border-[#D8D4F2] hover:border-[#5B3DF5]/60'
                }`}
              >
                <span>
                  {idx + 1}. {scr.label}
                </span>
                {hasReport && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                      active ? 'bg-white/20 text-white' : 'bg-[#ECE9FE] text-[#5B3DF5]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable Inspector Stage */}
      <div className="flex-1 overflow-auto inspector-stage-bg p-6 sm:p-8 flex items-start justify-center">
        <div
          className="relative inline-block rounded-2xl bg-white shadow-[0_14px_38px_-10px_rgba(91,61,245,0.18),0_0_0_1px_#D8D4F2] transition-transform duration-150 ease-out"
          style={{
            width: `${zoomPercent}%`,
            maxWidth: zoomPercent === 100 ? '100%' : 'none',
          }}
        >
          {activeScreen && (
            <img
              src={activeScreen.dataUrl}
              alt={`Audited UI screen: ${activeScreen.label}`}
              referrerPolicy="no-referrer"
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
              }}
              className="block w-full h-auto select-none rounded-2xl"
            />
          )}

          {/* Friendly Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 rounded-2xl bg-white/82 backdrop-blur-[3px] flex flex-col items-center justify-center p-8 text-center z-40">
              <div className="w-10 h-10 border-2 border-[#5B3DF5] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-display text-base font-bold text-[#16142C] max-w-md">
                {statusMessage || 'Auditing layout hierarchy, accessibility, and copy…'}
              </p>
              <p className="mt-1.5 text-xs text-[#5A5875]">
                Mapping visual spotlight pins and writing plain-English fixes
              </p>
            </div>
          )}

          {/* Spatial Bounding Boxes & Pins Overlay */}
          {!isLoading && screenIssues.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {screenIssues.map((issue) => {
                const sev = SEVERITY_META[issue.severity];
                const isActive = activeHighlightId === issue.id;
                const isDimmed = activeHighlightId !== null && !isActive;

                const pinInsideTop = issue.box.y < 4.5;
                const pinInsideLeft = issue.box.x < 3;

                return (
                  <div
                    key={issue.id}
                    style={{
                      left: `${issue.box.x}%`,
                      top: `${issue.box.y}%`,
                      width: `${issue.box.width}%`,
                      height: `${issue.box.height}%`,
                      borderColor: showBoxes
                        ? isActive
                          ? '#5B3DF5'
                          : sev.boxBorderColor
                        : 'transparent',
                      backgroundColor: showBoxes
                        ? isActive
                          ? 'rgba(91, 61, 245, 0.16)'
                          : sev.boxFillColor
                        : 'transparent',
                    }}
                    onMouseEnter={() => onHoverIssue(issue.id)}
                    onMouseLeave={() => onHoverIssue(null)}
                    onClick={() => onSelectIssue(issue.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Issue #${issue.id}: ${issue.title}, ${sev.shortLabel}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectIssue(issue.id);
                      }
                    }}
                    className={`absolute pointer-events-auto border-2 rounded-lg transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#5B3DF5] ${
                      isActive ? 'z-30 shadow-[0_0_0_4px_rgba(91,61,245,0.28)]' : 'z-10'
                    } ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
                  >
                    {showPins && (
                      <span
                        className={`absolute ${pinInsideTop ? 'top-1' : '-top-3'} ${
                          pinInsideLeft ? 'left-1' : '-left-3'
                        } inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-full border-2 font-mono text-[10px] font-bold tabular-nums shadow-sm transition-transform duration-150 ${
                          sev.pinClasses
                        } ${isActive ? 'scale-115 ring-2 ring-[#5B3DF5]' : ''}`}
                      >
                        {issue.id}
                      </span>
                    )}

                    {isActive && (
                      <div
                        className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-[11px] text-[#16142C] shadow-lg border border-[#D8D4F2] whitespace-nowrap pointer-events-none z-40 absolute ${
                          issue.box.y > 78 ? 'bottom-full mb-2' : 'top-full mt-2'
                        } left-0 max-w-[280px]`}
                      >
                        <span className="font-mono font-bold text-[#5B3DF5]">
                          #{issue.id}
                        </span>
                        <span className="truncate font-semibold">{issue.title}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
