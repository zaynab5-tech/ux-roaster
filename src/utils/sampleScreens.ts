import type { SampleUiPreset } from '../types/audit';

export const SAMPLE_UI_PRESETS: SampleUiPreset[] = [
  {
    id: 'legacy-checkout',
    chipLabel: 'Try Sample: Cluttered Checkout',
    title: 'Cluttered Checkout',
    category: 'E-Commerce Flow',
    dimensions: '1280 × 800',
    flawCountLabel: 'Contrast, Errors & Dark Patterns',
    summary:
      'Placeholder-only inputs, cryptic ERR;402 banner, low-contrast helper text, and swapped primary/cancel button colors.',
    contextHint: 'E-commerce checkout modal with billing form and order summary',
  },
  {
    id: 'low-contrast-login',
    chipLabel: 'Try Sample: Low-Contrast Login',
    title: 'Low-Contrast Login',
    category: 'Authentication Screen',
    dimensions: '1280 × 800',
    flawCountLabel: 'Contrast, Labels & Copy',
    summary:
      'Washed-out pale gray labels, low-contrast "Proceed" button, invisible "Forgot?" link, and cryptic Auth;Err;19 banner.',
    contextHint: 'SaaS user login page with email and password fields',
  },
  {
    id: 'cramped-saas',
    chipLabel: 'Try Sample: Overloaded SaaS',
    title: 'Overloaded SaaS Console',
    category: 'B2B Analytics',
    dimensions: '1280 × 800',
    flawCountLabel: 'Hierarchy, Icons & Copy',
    summary:
      'Mystery-meat sidebar icons without labels, competing KPI density, vague "Do Action" CTAs, and unlabelled multi-slice chart.',
    contextHint: 'B2B SaaS revenue and operations analytics dashboard',
  },
];

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function renderLegacyCheckout(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#E5E7EB';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#F3F4F6';
  ctx.fillRect(0, 0, w, 64);
  ctx.fillStyle = '#D1D5DB';
  ctx.fillRect(0, 63, w, 1);

  ctx.fillStyle = '#6B7280';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('SHOPCORP', 40, 40);

  const iconX = [980, 1040, 1100, 1160];
  iconX.forEach((ix) => {
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 2;
    ctx.strokeRect(ix, 20, 26, 26);
    ctx.beginPath();
    ctx.arc(ix + 13, 33, 6, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, 180, 96, 920, 660, 8);
  ctx.fill();
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#FEE2E2';
  drawRoundedRect(ctx, 220, 124, 840, 48, 4);
  ctx.fill();
  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('ERR;402: Invalid field input. Fix error and re-submit.', 242, 153);

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Billing Information', 220, 212);

  ctx.fillStyle = '#B0B7C3';
  ctx.font = '13px sans-serif';
  ctx.fillText(
    'Please fill all fields accurately to prevent account suspension during processing.',
    220,
    236
  );

  const fields = [
    { x: 220, y: 265, w: 390, text: 'Name*' },
    { x: 630, y: 265, w: 430, text: 'Email Address*' },
    { x: 220, y: 330, w: 540, text: 'Card Number (no spaces)' },
    { x: 780, y: 330, w: 130, text: 'MM/YY' },
    { x: 930, y: 330, w: 130, text: 'CVV' },
    { x: 220, y: 395, w: 840, text: 'Billing Street Address Line 1' },
  ];

  fields.forEach((f) => {
    ctx.fillStyle = '#F9FAFB';
    drawRoundedRect(ctx, f.x, f.y, f.w, 44, 4);
    ctx.fill();
    ctx.strokeStyle = f.text.includes('Card') ? '#EF4444' : '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '14px sans-serif';
    ctx.fillText(f.text, f.x + 14, f.y + 27);
  });

  ctx.fillStyle = '#2563EB';
  ctx.fillRect(220, 470, 16, 16);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('✓', 223, 482);
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '12px sans-serif';
  ctx.fillText(
    'Yes, enroll me in Partner Rewards Club ($14.99/mo after 7 days) and daily promo emails.',
    246,
    483
  );

  ctx.fillStyle = '#F8FAFC';
  drawRoundedRect(ctx, 220, 514, 840, 110, 4);
  ctx.fill();
  ctx.fillStyle = '#475569';
  ctx.font = '14px sans-serif';
  ctx.fillText('Subtotal', 240, 544);
  ctx.fillText('$49.00', 980, 544);
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Platform & Handling Adjustment', 240, 572);
  ctx.fillText('$18.50', 980, 572);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Total Due', 240, 606);
  ctx.fillText('$67.50', 976, 606);

  ctx.fillStyle = '#DC2626';
  drawRoundedRect(ctx, 220, 654, 180, 44, 4);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Submit', 284, 681);

  ctx.fillStyle = '#16A34A';
  drawRoundedRect(ctx, 418, 654, 150, 44, 4);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Cancel', 466, 681);

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '12px sans-serif';
  ctx.fillText('Need help with payment?', 600, 680);
  ctx.fillStyle = '#93C5FD';
  ctx.fillText('Click Here', 748, 680);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '9px sans-serif';
  ctx.fillText(
    'By clicking Submit you waive refund rights for digital items. No back button supported during transaction.',
    220,
    732
  );
}

function renderLowContrastLogin(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Soft pale background
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(0, 0, w, h);

  // Subtle card
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, 360, 100, 560, 600, 12);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Brand mark in low contrast
  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('WORKSPACE PORTAL', 420, 154);

  // Title
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('User Authentication', 420, 198);

  // Very low contrast subtitle (#CBD5E1 on #FFFFFF ~ 1.49:1)
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '14px sans-serif';
  ctx.fillText('Enter credentials below to access system resources.', 420, 226);

  // Cryptic error banner
  ctx.fillStyle = '#FFF1F2';
  drawRoundedRect(ctx, 420, 250, 440, 42, 6);
  ctx.fill();
  ctx.fillStyle = '#FDA4AF';
  ctx.font = '12px monospace';
  ctx.fillText('Auth;Err;19: Token mismatch or invalid input.', 436, 276);

  // Field 1: Low-contrast label (#CBD5E1) + placeholder
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '12px sans-serif';
  ctx.fillText('Identifier', 420, 324);

  ctx.fillStyle = '#F8FAFC';
  drawRoundedRect(ctx, 420, 336, 440, 46, 8);
  ctx.fill();
  ctx.strokeStyle = '#F1F5F9';
  ctx.stroke();
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '14px sans-serif';
  ctx.fillText('user@domain.com', 436, 364);

  // Field 2: Low-contrast label + missing show/hide toggle
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '12px sans-serif';
  ctx.fillText('Secret Key', 420, 416);

  ctx.fillStyle = '#F8FAFC';
  drawRoundedRect(ctx, 420, 428, 440, 46, 8);
  ctx.fill();
  ctx.strokeStyle = '#F1F5F9';
  ctx.stroke();
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '14px sans-serif';
  ctx.fillText('••••••••••••', 436, 456);

  // Tiny ultra-low contrast forgot link
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '11px sans-serif';
  ctx.fillText('Forgot?', 818, 496);

  // Low-contrast primary button (#A5B4FC text on #E0E7FF background!)
  ctx.fillStyle = '#E0E7FF';
  drawRoundedRect(ctx, 420, 526, 440, 48, 8);
  ctx.fill();
  ctx.fillStyle = '#A5B4FC';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Proceed', 610, 555);

  // Confusing secondary button styled brighter than primary
  ctx.fillStyle = '#EF4444';
  drawRoundedRect(ctx, 420, 592, 440, 42, 8);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Reset Form', 602, 618);

  // Tiny low-contrast terms text
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '10px sans-serif';
  ctx.fillText('By proceeding you agree to all policies. Click here for details.', 492, 668);
}

function renderCrampedSaas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, 64, h);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = '#334155';
    drawRoundedRect(ctx, 16, 28 + i * 62, 32, 32, 6);
    ctx.fill();
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(23, 35 + i * 62, 18, 18);
  }

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(64, 0, w - 64, 60);
  ctx.fillStyle = '#334155';
  ctx.fillRect(64, 59, w - 64, 1);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('SYS;DASH;MAIN', 88, 36);

  const headerBtns = [
    { x: 640, label: 'Do Action', bg: '#3B82F6' },
    { x: 760, label: 'Process', bg: '#10B981' },
    { x: 870, label: 'Manage', bg: '#F59E0B' },
    { x: 980, label: 'Execute Now!', bg: '#EF4444' },
    { x: 1120, label: 'Go', bg: '#6366F1' },
  ];
  headerBtns.forEach((b) => {
    ctx.fillStyle = b.bg;
    drawRoundedRect(ctx, b.x, 15, 102, 30, 4);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(b.label, b.x + 14, 34);
  });

  const kpis = [
    ['METRIC;A', '42,109'],
    ['CONV;RT', '1.84%'],
    ['ERR;CNT', '912'],
    ['QUEUE;X', '77'],
    ['LAT;AVG', '840ms'],
    ['ACT;USR', '3,201'],
    ['CHURN;Q', '14.2%'],
    ['SYNC;ST', 'WARN'],
  ];

  kpis.forEach(([k, v], idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = 88 + col * 292;
    const y = 84 + row * 116;

    ctx.fillStyle = '#334155';
    drawRoundedRect(ctx, x, y, 274, 96, 6);
    ctx.fill();

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(k, x + 16, y + 28);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(v, x + 16, y + 68);
  });

  ctx.fillStyle = '#334155';
  drawRoundedRect(ctx, 88, 324, 566, 440, 6);
  ctx.fill();
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Segment Distribution (Unfiltered)', 110, 356);

  const sliceColors = [
    '#EF4444',
    '#F97316',
    '#F59E0B',
    '#EAB308',
    '#84CC16',
    '#10B981',
    '#06B6D4',
    '#3B82F6',
    '#8B5CF6',
  ];
  const cx = 365;
  const cy = 548;
  const radius = 145;
  let start = 0;
  const step = (Math.PI * 2) / sliceColors.length;
  sliceColors.forEach((c) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + step);
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();
    start += step;
  });

  ctx.fillStyle = '#334155';
  drawRoundedRect(ctx, 672, 324, 566, 440, 6);
  ctx.fill();
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Recent Records', 694, 356);

  for (let r = 0; r < 8; r++) {
    const ry = 382 + r * 44;
    ctx.fillStyle = r % 2 === 0 ? '#273549' : '#334155';
    ctx.fillRect(694, ry, 522, 36);
    ctx.fillStyle = '#64748B';
    ctx.font = '12px monospace';
    ctx.fillText(`#TX;${1040 + r}`, 708, ry + 22);
    ctx.fillText('Truncated;User;Nam...', 800, ry + 22);
    ctx.fillText('Pending;Val', 980, ry + 22);
    ctx.fillStyle = '#60A5FA';
    ctx.fillText('Click', 1150, ry + 22);
  }
}

export function generateSampleUiPng(presetId: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (presetId === 'legacy-checkout') {
    renderLegacyCheckout(ctx, 1280, 800);
  } else if (presetId === 'low-contrast-login') {
    renderLowContrastLogin(ctx, 1280, 800);
  } else {
    renderCrampedSaas(ctx, 1280, 800);
  }

  return canvas.toDataURL('image/png');
}
