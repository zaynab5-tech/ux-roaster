import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, Copy, Eye } from 'lucide-react';
import type { IssueFixPreview } from '../types/audit';
import { computeWcagContrast } from '../utils/contrast';

interface FixPreviewToggleProps {
  preview: IssueFixPreview;
  issueTitle: string;
}

export function FixPreviewToggle({ preview, issueTitle }: FixPreviewToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const beforeCalc = computeWcagContrast(
    preview.originalTextHex,
    preview.originalBgHex
  );
  const afterCalc = computeWcagContrast(
    preview.fixedTextHex,
    preview.fixedBgHex
  );

  const handleCopySpecs = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const specText = [
      `/* Fix Specs: ${issueTitle} */`,
      `/* Copy: "${preview.originalLabel}" -> "${preview.fixedLabel}" */`,
      `/* Accessible Contrast: ${afterCalc.formattedRatio} (${afterCalc.fgValid} on ${afterCalc.bgValid}) */`,
      preview.cssSpec,
    ].join('\n');
    await navigator.clipboard.writeText(specText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-full border transition-colors cursor-pointer ${
          isOpen
            ? 'bg-[#5B3DF5] text-white border-[#5B3DF5]'
            : 'bg-[#F5F3FF] text-[#492CE0] border-[#D8D4F2] hover:bg-[#ECE9FE]'
        }`}
      >
        <Eye className="w-3 h-3" aria-hidden="true" />
        <span>{isOpen ? 'Hide Fix Preview' : 'Preview Fix'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="mt-2.5 p-3.5 rounded-xl bg-[#FAF9FF] border border-[#D8D4F2] space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2.5 items-center">
              {/* Before (Flawed) */}
              <div className="p-2.5 rounded-xl bg-white border border-rose-200/80">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="micro-label text-rose-700">Before</span>
                  <span className="font-mono text-[10px] text-rose-700 tabular-nums">
                    {beforeCalc.formattedRatio}
                  </span>
                </div>
                <div
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-center truncate border border-black/5"
                  style={{
                    backgroundColor: beforeCalc.bgValid,
                    color: beforeCalc.fgValid,
                  }}
                >
                  {preview.originalLabel}
                </div>
              </div>

              <div className="hidden sm:flex items-center justify-center text-[#5B3DF5]">
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </div>

              {/* After (Accessible Fix) */}
              <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="micro-label text-emerald-700">After Fix</span>
                  <span className="font-mono text-[10px] font-semibold text-emerald-700 tabular-nums">
                    {afterCalc.formattedRatio}
                  </span>
                </div>
                <div
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-center truncate shadow-xs"
                  style={{
                    backgroundColor: afterCalc.bgValid,
                    color: afterCalc.fgValid,
                  }}
                >
                  {preview.fixedLabel}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#ECE9FE]">
              <code className="text-[11px] font-mono text-[#5A5875] truncate max-w-full sm:max-w-[260px]">
                {afterCalc.fgValid} on {afterCalc.bgValid} · {afterCalc.formattedRatio}
              </code>
              <button
                type="button"
                onClick={handleCopySpecs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#1E1B4B] bg-white hover:bg-[#ECE9FE] border border-[#D8D4F2] rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                    <span>Copied Specs!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    <span>Copy Fix Specs</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
