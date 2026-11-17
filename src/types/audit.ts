export type SeverityLevel = 0 | 1 | 2 | 3 | 4;

export type AuditInputMode = 'single' | 'url' | 'flow';

export type AppViewStage = 'upload' | 'scorecard' | 'spotlight';

export interface AuditedScreenAsset {
  id: string;
  label: string;
  dataUrl: string;
  mimeType: string;
  name: string;
  sourceUrl?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IssueFixPreview {
  originalLabel: string;
  originalBgHex: string;
  originalTextHex: string;
  fixedLabel: string;
  fixedBgHex: string;
  fixedTextHex: string;
  cssSpec: string;
}

export interface AuditIssue {
  id: number;
  screenIndex: number;
  screenLabel: string;
  title: string;
  severity: SeverityLevel;
  heuristicId: string;
  heuristicName: string;
  wcagCriterion: string;
  elementLabel: string;
  whatsHappening: string;
  whyItMatters: string;
  quickFix: string;
  box: BoundingBox;
  fixPreview: IssueFixPreview;
}

export interface FlowConsistencyNote {
  id: string;
  title: string;
  stepsAffected: string;
  severity: SeverityLevel;
  whatsHappening: string;
  whyItMatters: string;
  quickFix: string;
}

export interface HeuristicScore {
  id: string;
  name: string;
  severity: SeverityLevel;
  finding: string;
  recommendation: string;
}

export interface ContrastFlag {
  id: string;
  element: string;
  foregroundHex: string;
  backgroundHex: string;
  contrastRatio: string;
  wcagStatus: 'Fail AA' | 'Pass AA / Fail AAA' | 'Pass AAA';
  textSize: string;
  recommendation: string;
  suggestedForegroundHex: string;
}

export interface MicrocopyMakeover {
  id: string;
  location: string;
  originalText: string;
  whyItFails: string;
  rewrittenText: string;
  toneRationale: string;
}

export interface UxAuditReport {
  overallScore: number;
  overallGrade: string;
  wcagVerdict: string;
  verdictSummary: string;
  flowSummary?: string;
  flowFindings?: FlowConsistencyNote[];
  strengths: string[];
  issues: AuditIssue[];
  heuristics: HeuristicScore[];
  contrastFlags: ContrastFlag[];
  microcopyMakeovers: MicrocopyMakeover[];
}

export interface AuditTechnicalDetails {
  status?: number | string;
  model?: string;
  rawMessage: string;
}

export interface AuditErrorState {
  message: string;
  technicalDetails?: AuditTechnicalDetails;
}

export type AuditTone = 'principled' | 'brutal';

export interface SampleUiPreset {
  id: string;
  chipLabel: string;
  title: string;
  category: string;
  dimensions: string;
  flawCountLabel: string;
  summary: string;
  contextHint: string;
}

export const SEVERITY_META: Record<
  SeverityLevel,
  {
    label: string;
    shortLabel: string;
    description: string;
    badgeClasses: string;
    pinClasses: string;
    pulseColor: string;
    boxBorderColor: string;
    boxFillColor: string;
    barColor: string;
  }
> = {
  0: {
    label: '0 · Pass',
    shortLabel: '0 · Pass',
    description: 'Working smoothly',
    badgeClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pinClasses: 'bg-emerald-600 text-white border-white',
    pulseColor: 'rgba(5, 150, 105, 0.45)',
    boxBorderColor: 'rgba(16, 185, 129, 0.85)',
    boxFillColor: 'rgba(16, 185, 129, 0.10)',
    barColor: 'bg-emerald-500',
  },
  1: {
    label: '1 · Cosmetic',
    shortLabel: '1 · Cosmetic',
    description: 'Nice-to-have polish',
    badgeClasses: 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]',
    pinClasses: 'bg-[#5B3DF5] text-white border-white',
    pulseColor: 'rgba(91, 61, 245, 0.45)',
    boxBorderColor: 'rgba(91, 61, 245, 0.85)',
    boxFillColor: 'rgba(91, 61, 245, 0.09)',
    barColor: 'bg-[#6366F1]',
  },
  2: {
    label: '2 · Minor',
    shortLabel: '2 · Minor',
    description: 'Low-priority friction',
    badgeClasses: 'bg-amber-50 text-amber-800 border-amber-200',
    pinClasses: 'bg-amber-500 text-white border-white',
    pulseColor: 'rgba(245, 158, 11, 0.5)',
    boxBorderColor: 'rgba(245, 158, 11, 0.90)',
    boxFillColor: 'rgba(245, 158, 11, 0.12)',
    barColor: 'bg-amber-500',
  },
  3: {
    label: '3 · Major',
    shortLabel: '3 · Major',
    description: 'High-priority UX blocker',
    badgeClasses: 'bg-orange-50 text-orange-800 border-orange-200',
    pinClasses: 'bg-orange-600 text-white border-white',
    pulseColor: 'rgba(234, 88, 12, 0.5)',
    boxBorderColor: 'rgba(234, 88, 12, 0.92)',
    boxFillColor: 'rgba(234, 88, 12, 0.13)',
    barColor: 'bg-orange-500',
  },
  4: {
    label: '4 · Critical',
    shortLabel: '4 · Critical',
    description: 'Fix before shipping',
    badgeClasses: 'bg-rose-50 text-rose-800 border-rose-200',
    pinClasses: 'bg-rose-600 text-white border-white',
    pulseColor: 'rgba(225, 29, 72, 0.55)',
    boxBorderColor: 'rgba(225, 29, 72, 0.95)',
    boxFillColor: 'rgba(225, 29, 72, 0.14)',
    barColor: 'bg-rose-600',
  },
};
