function normalizeHex(hex: string): string | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return (
      '#' +
      cleaned
        .split('')
        .map((c) => c + c)
        .join('')
        .toUpperCase()
    );
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return '#' + cleaned.toUpperCase();
  }
  return null;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const norm = normalizeHex(hex);
  if (!norm) return null;
  const r = parseInt(norm.slice(1, 3), 16);
  const g = parseInt(norm.slice(3, 5), 16);
  const b = parseInt(norm.slice(5, 7), 16);
  return [r, g, b];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function computeWcagContrast(fgHex: string, bgHex: string): {
  ratio: number | null;
  formattedRatio: string;
  fgValid: string;
  bgValid: string;
} {
  const fgValid = normalizeHex(fgHex) ?? '#94A3B8';
  const bgValid = normalizeHex(bgHex) ?? '#1E293B';
  const fgRgb = hexToRgb(fgValid);
  const bgRgb = hexToRgb(bgValid);
  if (!fgRgb || !bgRgb) {
    return { ratio: null, formattedRatio: 'N/A', fgValid, bgValid };
  }
  const l1 = relativeLuminance(fgRgb);
  const l2 = relativeLuminance(bgRgb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return {
    ratio,
    formattedRatio: `${ratio.toFixed(2)}:1`,
    fgValid,
    bgValid,
  };
}

export function evaluateWcagStatus(
  ratio: number | null,
  textSize: string,
  fallbackStatus: 'Fail AA' | 'Pass AA / Fail AAA' | 'Pass AAA'
): 'Fail AA' | 'Pass AA / Fail AAA' | 'Pass AAA' {
  if (ratio === null) return fallbackStatus;
  const isLarge =
    textSize.toLowerCase().includes('large') || textSize.toLowerCase().includes('ui');
  const aaThreshold = isLarge ? 3.0 : 4.5;
  const aaaThreshold = isLarge ? 4.5 : 7.0;
  if (ratio < aaThreshold) return 'Fail AA';
  if (ratio < aaaThreshold) return 'Pass AA / Fail AAA';
  return 'Pass AAA';
}
