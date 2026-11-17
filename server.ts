import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
const RETRY_DELAYS_MS = [2000, 4000, 8000];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface IncomingScreen {
  label: string;
  imageBase64: string;
  mimeType: string;
}

function parseJsonSafely(rawText: string): Record<string, unknown> {
  let cleaned = rawText.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned) as Record<string, unknown>;
}

function sanitizeReport(
  raw: Record<string, unknown>,
  screens: IncomingScreen[],
  isFlow: boolean
) {
  const clamp = (val: unknown, min: number, max: number, fallback: number) => {
    const n = typeof val === 'number' && Number.isFinite(val) ? val : Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  };
  const clampSev = (val: unknown): 0 | 1 | 2 | 3 | 4 =>
    Math.round(clamp(val, 0, 4, 2)) as 0 | 1 | 2 | 3 | 4;

  const maxScreenIdx = Math.max(0, screens.length - 1);

  const issues = Array.isArray(raw.issues)
    ? raw.issues.map((item: Record<string, unknown>, idx: number) => {
        const box = (item.box as Record<string, unknown>) || {};
        const x = clamp(item.x ?? box.x, 1, 92, 10);
        const y = clamp(item.y ?? box.y, 1, 92, 10);
        const width = clamp(item.width ?? box.width, 4, 100 - x, 18);
        const height = clamp(item.height ?? box.height, 4, 100 - y, 10);
        const screenIndex = Math.round(clamp(item.screenIndex, 0, maxScreenIdx, 0));
        const matchedLabel =
          screens[screenIndex]?.label || String(item.screenLabel || `Screen ${screenIndex + 1}`);

        const rawPreview = (item.fixPreview as Record<string, unknown>) || {};
        const fixPreview = {
          originalLabel: String(
            rawPreview.originalLabel || item.elementLabel || item.title || 'Current element'
          ),
          originalBgHex: String(rawPreview.originalBgHex || '#F1F5F9'),
          originalTextHex: String(rawPreview.originalTextHex || '#94A3B8'),
          fixedLabel: String(
            rawPreview.fixedLabel || item.quickFix || 'Clear, accessible action'
          ),
          fixedBgHex: String(rawPreview.fixedBgHex || '#5B3DF5'),
          fixedTextHex: String(rawPreview.fixedTextHex || '#FFFFFF'),
          cssSpec: String(
            rawPreview.cssSpec ||
              `color: ${String(rawPreview.fixedTextHex || '#FFFFFF')}; background-color: ${String(rawPreview.fixedBgHex || '#5B3DF5')}; /* WCAG AA+ */`
          ),
        };

        return {
          id: idx + 1,
          screenIndex,
          screenLabel: matchedLabel,
          title: String(item.title || `Issue ${idx + 1}`),
          severity: clampSev(item.severity),
          heuristicId: String(item.heuristicId || 'H4'),
          heuristicName: String(item.heuristicName || 'Consistency and Standards'),
          wcagCriterion: String(item.wcagCriterion || 'None'),
          elementLabel: String(item.elementLabel || 'UI Element'),
          whatsHappening: String(
            item.whatsHappening || item.critique || 'This element creates unnecessary friction.'
          ),
          whyItMatters: String(
            item.whyItMatters ||
              'Users rely on clear visual cues and predictable patterns to act confidently.'
          ),
          quickFix: String(
            item.quickFix || item.remediation || 'Simplify the layout and clarify the label.'
          ),
          box: { x, y, width, height },
          fixPreview,
        };
      })
    : [];

  const flowFindings =
    isFlow && Array.isArray(raw.flowFindings)
      ? raw.flowFindings.map((f: Record<string, unknown>, idx: number) => ({
          id: String(f.id || `flow-${idx + 1}`),
          title: String(f.title || 'Cross-screen friction'),
          stepsAffected: String(f.stepsAffected || 'Across flow steps'),
          severity: clampSev(f.severity),
          whatsHappening: String(f.whatsHappening || ''),
          whyItMatters: String(f.whyItMatters || ''),
          quickFix: String(f.quickFix || ''),
        }))
      : undefined;

  const defaultHeuristics = [
    ['H1', 'Visibility of System Status'],
    ['H2', 'Match Between System and the Real World'],
    ['H3', 'User Control and Freedom'],
    ['H4', 'Consistency and Standards'],
    ['H5', 'Error Prevention'],
    ['H6', 'Recognition Rather Than Recall'],
    ['H7', 'Flexibility and Efficiency of Use'],
    ['H8', 'Aesthetic and Minimalist Design'],
    ['H9', 'Help Users Recognize, Diagnose, and Recover from Errors'],
    ['H10', 'Help and Documentation'],
  ];

  const rawHeuristics = Array.isArray(raw.heuristics) ? raw.heuristics : [];
  const heuristics = defaultHeuristics.map(([id, name], idx) => {
    const match =
      rawHeuristics.find(
        (h: Record<string, unknown>) => String(h.id || '').toUpperCase() === id
      ) || rawHeuristics[idx];
    const m = (match as Record<string, unknown>) || {};
    return {
      id,
      name,
      severity: clampSev(m.severity),
      finding: String(m.finding || 'No notable issues observed on these screens.'),
      recommendation: String(
        m.recommendation || 'Maintain current pattern and validate with quick user testing.'
      ),
    };
  });

  const contrastFlags = Array.isArray(raw.contrastFlags)
    ? raw.contrastFlags.map((c: Record<string, unknown>, idx: number) => {
        const statusRaw = String(c.wcagStatus || 'Fail AA');
        const wcagStatus =
          statusRaw === 'Pass AAA' || statusRaw === 'Pass AA / Fail AAA'
            ? statusRaw
            : 'Fail AA';
        return {
          id: String(c.id || `contrast-${idx + 1}`),
          element: String(c.element || 'UI Text'),
          foregroundHex: String(c.foregroundHex || '#94A3B8'),
          backgroundHex: String(c.backgroundHex || '#FFFFFF'),
          contrastRatio: String(c.contrastRatio || '3.10:1'),
          wcagStatus,
          textSize: String(c.textSize || 'Normal (<18pt)'),
          recommendation: String(c.recommendation || ''),
          suggestedForegroundHex: String(c.suggestedForegroundHex || '#16142C'),
        };
      })
    : [];

  const microcopyMakeovers = Array.isArray(raw.microcopyMakeovers)
    ? raw.microcopyMakeovers.map((m: Record<string, unknown>, idx: number) => ({
        id: String(m.id || `copy-${idx + 1}`),
        location: String(m.location || 'Interface Control'),
        originalText: String(m.originalText || ''),
        whyItFails: String(m.whyItFails || ''),
        rewrittenText: String(m.rewrittenText || ''),
        toneRationale: String(m.toneRationale || ''),
      }))
    : [];

  return {
    overallScore: Math.round(clamp(raw.overallScore, 0, 100, 60)),
    overallGrade: String(raw.overallGrade || 'C'),
    wcagVerdict: String(raw.wcagVerdict || 'Review Required'),
    verdictSummary: String(raw.verdictSummary || ''),
    flowSummary: isFlow && raw.flowSummary ? String(raw.flowSummary) : undefined,
    flowFindings,
    strengths: Array.isArray(raw.strengths) ? raw.strengths.map(String) : [],
    issues,
    heuristics,
    contrastFlags,
    microcopyMakeovers,
  };
}

function getErrorStatusCode(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;
  const e = err as Record<string, unknown>;
  if (typeof e.status === 'number') return e.status;
  if (typeof e.code === 'number') return e.code;
  const msg = e.message ? String(e.message) : '';
  if (msg.includes('503') || msg.toLowerCase().includes('unavailable')) return 503;
  if (msg.includes('429') || msg.toLowerCase().includes('resource_exhausted')) return 429;
  if (msg.includes('404') || msg.toLowerCase().includes('not_found')) return 404;
  if (msg.includes('403') || msg.toLowerCase().includes('permission_denied')) return 403;
  if (msg.includes('400') || msg.toLowerCase().includes('invalid')) return 400;
  return null;
}

function isRetryableOrFallbackError(err: unknown): boolean {
  const code = getErrorStatusCode(err);
  if (code === 503 || code === 429 || code === 404) return true;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('404') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('not found')
  );
}

function extractTechnicalDetails(err: unknown, model: string) {
  const status = getErrorStatusCode(err) ?? 'UNKNOWN';
  const rawMessage = err instanceof Error ? err.message : String(err);
  return { status, model, rawMessage };
}

function formatFriendlyError(err: unknown, model: string) {
  const technicalDetails = extractTechnicalDetails(err, model);
  const code = getErrorStatusCode(err);
  const rawLower = technicalDetails.rawMessage.toLowerCase();

  if (code === 503 || rawLower.includes('high demand')) {
    return {
      status: 503,
      message:
        'Our design auditor is experiencing unusually high demand right now. Please wait a moment and try running the audit again.',
      technicalDetails,
    };
  }
  if (code === 429) {
    return {
      status: 429,
      message:
        'Audit request quota was temporarily reached. Please pause for a few seconds and retry.',
      technicalDetails,
    };
  }
  if (code === 403 || rawLower.includes('api key') || rawLower.includes('permission_denied')) {
    return {
      status: 403,
      message:
        'Unable to authenticate with the Gemini API. Please verify that a valid GEMINI_API_KEY is configured in Settings > Secrets.',
      technicalDetails,
    };
  }
  if (code === 400) {
    return {
      status: 400,
      message:
        'The design auditor rejected this request payload. Please try uploading a standard PNG or JPEG screenshot.',
      technicalDetails,
    };
  }
  return {
    status: 500,
    message:
      'We could not complete the design audit for this submission. Open technical details below to inspect the underlying response.',
    technicalDetails,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBlockedPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  if (/^10\./.test(lower) || /^192\.168\./.test(lower) || /^172\.(1[6-9]|2\d|3[01])\./.test(lower)) {
    return true;
  }
  return false;
}

async function fetchImageBytesWithTimeout(url: string, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/png,image/jpeg,*/*',
      },
    });
    if (!resp.ok) {
      throw new Error(`Screenshot service returned HTTP ${resp.status}`);
    }
    const ct = resp.headers.get('content-type') || 'image/png';
    if (!ct.startsWith('image/')) {
      throw new Error(`Unexpected response type (${ct})`);
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.byteLength < 3500) {
      throw new Error('Captured screenshot was blank or too small.');
    }
    const mimeType = ct.split(';')[0].trim();
    return {
      dataUrl: `data:${mimeType};base64,${buf.toString('base64')}`,
      mimeType,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Live website screenshot capture endpoint (avoids browser CORS issues)
  app.post('/api/capture-url', async (req, res) => {
    try {
      const { url } = req.body as { url?: string };
      if (!url || !url.trim()) {
        res.status(400).json({ error: 'Please enter a website URL to inspect.' });
        return;
      }

      let normalized = url.trim();
      if (!/^https?:\/\//i.test(normalized)) {
        normalized = `https://${normalized}`;
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(normalized);
      } catch {
        res.status(400).json({ error: 'Please enter a valid website URL (e.g., https://example.com).' });
        return;
      }

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        res.status(400).json({ error: 'Only http:// and https:// URLs are supported.' });
        return;
      }

      if (isBlockedPrivateHost(parsedUrl.hostname)) {
        res.status(400).json({
          error:
            'Local or private network URLs cannot be captured remotely. Take a screenshot and upload it in Single Screen mode instead.',
        });
        return;
      }

      const targetUrl = parsedUrl.toString();
      const errors: string[] = [];

      // Provider 1: Microlink API
      try {
        const mlController = new AbortController();
        const mlTimer = setTimeout(() => mlController.abort(), 14000);
        try {
          const mlRes = await fetch(
            `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false&viewport.width=1280&viewport.height=800`,
            { signal: mlController.signal }
          );
          if (mlRes.ok) {
            const mlJson = (await mlRes.json()) as {
              status?: string;
              data?: { screenshot?: { url?: string } };
            };
            const shotUrl = mlJson?.data?.screenshot?.url;
            if (shotUrl) {
              const img = await fetchImageBytesWithTimeout(shotUrl, 12000);
              res.json({
                dataUrl: img.dataUrl,
                mimeType: img.mimeType,
                resolvedUrl: targetUrl,
              });
              return;
            }
          }
          errors.push(`Microlink status ${mlRes.status}`);
        } finally {
          clearTimeout(mlTimer);
        }
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }

      // Provider 2: thum.io fallback
      try {
        const thumUrl = `https://image.thum.io/get/width/1280/crop/800/noanimate/${targetUrl}`;
        const img = await fetchImageBytesWithTimeout(thumUrl, 14000);
        res.json({
          dataUrl: img.dataUrl,
          mimeType: img.mimeType,
          resolvedUrl: targetUrl,
        });
        return;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }

      res.status(422).json({
        error:
          'This website blocked automated previews (or took too long to render). Take a quick screenshot of the page and drop it into the Single Screen tab instead.',
        technicalDetails: {
          status: 422,
          model: 'url-capture',
          rawMessage: errors.join(' | '),
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        error:
          'Could not capture a live preview of this website. Try taking a screenshot and uploading it in the Single Screen tab.',
        technicalDetails: { status: 500, model: 'url-capture', rawMessage: msg },
      });
    }
  });

  app.post('/api/audit', async (req, res) => {
    const sendNdjson = (payload: Record<string, unknown>) => {
      res.write(JSON.stringify(payload) + '\n');
    };

    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error:
            'Design auditor credentials are missing. Please configure GEMINI_API_KEY in Settings > Secrets.',
          technicalDetails: {
            status: 500,
            model: PRIMARY_MODEL,
            rawMessage: 'process.env.GEMINI_API_KEY is undefined or empty on the server.',
          },
        });
        return;
      }

      const body = req.body as {
        mode?: 'single' | 'url' | 'flow';
        screens?: IncomingScreen[];
        imageBase64?: string;
        mimeType?: string;
        sourceUrl?: string;
        context?: string;
        tone?: 'principled' | 'brutal';
      };

      const screens: IncomingScreen[] =
        Array.isArray(body.screens) && body.screens.length > 0
          ? body.screens
          : body.imageBase64 && body.mimeType
          ? [{ label: 'Uploaded Screen', imageBase64: body.imageBase64, mimeType: body.mimeType }]
          : [];

      if (screens.length === 0) {
        res.status(400).json({
          error: 'Please upload at least one screenshot before starting an audit.',
          technicalDetails: {
            status: 400,
            model: PRIMARY_MODEL,
            rawMessage: 'No screens or imageBase64 provided in request body.',
          },
        });
        return;
      }

      if (screens.length > 5) {
        res.status(400).json({
          error: 'Multi-screen flows support up to 5 sequential screenshots at once.',
          technicalDetails: {
            status: 400,
            model: PRIMARY_MODEL,
            rawMessage: `Received ${screens.length} screens (max 5).`,
          },
        });
        return;
      }

      const allowedMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
      for (const s of screens) {
        if (!allowedMimes.includes(s.mimeType)) {
          res.status(400).json({
            error: `Unsupported image format (${s.mimeType}). Please upload PNG, JPEG, or WebP screenshots.`,
            technicalDetails: {
              status: 400,
              model: PRIMARY_MODEL,
              rawMessage: `Unsupported MIME type: ${s.mimeType}`,
            },
          });
          return;
        }
      }

      const isFlow = body.mode === 'flow' || screens.length > 1;
      const isUrlMode = body.mode === 'url' && Boolean(body.sourceUrl);

      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const roastToneInstruction =
        body.tone === 'brutal'
          ? 'Write like a sharp, candid Principal Product Designer giving a founder an unfiltered teardown—zero empty flattery, crystal-clear plain English, witty where appropriate, and relentlessly practical.'
          : 'Write like a warm, direct Principal Product Designer mentoring a product team—clear plain English with zero academic jargon, engaging, and deeply actionable.';

      const flowInstruction = isFlow
        ? `MULTI-SCREEN APP FLOW MODE (${screens.length} sequential screens):
- Audit BOTH individual screens AND cross-screen flow consistency (navigation continuity, shifting button placement/colors, missing back paths, confusing step transitions, and drop-off friction across the journey).
- Include "flowSummary" (2-3 crisp sentences on the overall journey) and "flowFindings" (2-4 cross-screen consistency observations).
- For every item in "issues", set "screenIndex" (0 to ${screens.length - 1}) and "screenLabel" accurately to whichever screen contains that defect!`
        : '';

      const urlInstruction = isUrlMode
        ? `LIVE WEBSITE URL MODE (${body.sourceUrl}):
- Evaluate both the captured webpage layout/visual hierarchy AND the user journey implied by this live website URL.`
        : '';

      const systemInstruction = `You are a Principal Product Designer, UX Researcher, and WCAG 2.1 Accessibility Specialist.

${roastToneInstruction}
${flowInstruction}
${urlInstruction}

PLAIN-ENGLISH ISSUE WRITING RULES (CRITICAL):
For every issue you spot, avoid dry academic jargon. Explain it in three punchy, human-friendly fields:
- "whatsHappening": Plain-English observation anyone (founder, client, PM) immediately understands (e.g., "The 'Cancel' button is bright green, which tricks people into clicking it by mistake.").
- "whyItMatters": The UX or WCAG rule behind it in approachable language (e.g., "Breaks visual expectations — users instinctively assume green means 'Continue' or 'Save'.").
- "quickFix": One concrete, actionable change (e.g., "Style 'Cancel' as a quiet white or text button, and keep your primary brand fill strictly on 'Save Changes'.").

Respond ONLY with a single valid JSON object (no markdown fences, no commentary) matching this flat schema:
{
  "overallScore": integer (0-100),
  "overallGrade": string (e.g. "D+", "C", "B-", "A"),
  "wcagVerdict": string (e.g. "Needs Contrast Fixes — 3 AA issues"),
  "verdictSummary": string (2-3 engaging, plain-English sentences summarizing the biggest wins and blockers),
  "flowSummary": string (required for multi-screen flows, omit otherwise),
  "flowFindings": [
    {
      "id": string,
      "title": string,
      "stepsAffected": string (e.g. "Step 1 → Step 2"),
      "severity": integer (0..4),
      "whatsHappening": string,
      "whyItMatters": string,
      "quickFix": string
    }
  ],
  "strengths": string[] (1-2 honest strengths observed),
  "issues": [
    {
      "id": integer (1..N),
      "screenIndex": integer (0-based index of the screen where this issue appears),
      "screenLabel": string (name of that screen),
      "title": string (3-7 words, punchy),
      "severity": integer (0=Pass, 1=Cosmetic, 2=Minor, 3=Major, 4=Critical),
      "heuristicId": string ("H1".."H10"),
      "heuristicName": string,
      "wcagCriterion": string (e.g. "1.4.3 Contrast (Minimum)" or "None"),
      "elementLabel": string,
      "whatsHappening": string,
      "whyItMatters": string,
      "quickFix": string,
      "x": number (left edge % 0..95 on that specific screen),
      "y": number (top edge % 0..95 on that specific screen),
      "width": number (width % 4..100),
      "height": number (height % 4..100),
      "fixPreview": {
        "originalLabel": string (short label/copy currently shown in the flawed UI element),
        "originalBgHex": string (6-digit hex of current background, e.g. "#E0E7FF"),
        "originalTextHex": string (6-digit hex of current text, e.g. "#A5B4FC"),
        "fixedLabel": string (recommended clear action copy),
        "fixedBgHex": string (6-digit accessible background hex, e.g. "#5B3DF5"),
        "fixedTextHex": string (6-digit accessible text hex achieving >= 4.5:1 contrast, e.g. "#FFFFFF"),
        "cssSpec": string (concise CSS snippet with background, color, and contrast note)
      }
    }
  ],
  "heuristics": [
    {
      "id": string ("H1" through "H10" in exact order, all 10 required),
      "name": string,
      "severity": integer (0..4),
      "finding": string (plain-English observation),
      "recommendation": string (practical next step)
    }
  ],
  "contrastFlags": [
    {
      "id": string,
      "element": string,
      "foregroundHex": string ("#RRGGBB"),
      "backgroundHex": string ("#RRGGBB"),
      "contrastRatio": string (e.g. "2.40:1"),
      "wcagStatus": "Fail AA" | "Pass AA / Fail AAA" | "Pass AAA",
      "textSize": "Normal (<18pt)" | "Large (>=18pt)" | "UI Component",
      "recommendation": string,
      "suggestedForegroundHex": string ("#RRGGBB" achieving >=4.5:1)
    }
  ],
  "microcopyMakeovers": [
    {
      "id": string,
      "location": string,
      "originalText": string (exact visible text),
      "whyItFails": string (plain-English explanation),
      "rewrittenText": string (clear, human, action-oriented replacement),
      "toneRationale": string
    }
  ]
}

CRITICAL BOUNDING-BOX RULES:
- Include 6 to 10 prioritized issues across the submitted screen(s). Make x, y, width, height percentages tightly hug the exact offending element (x + width <= 100, y + height <= 100).
- Include ALL 10 Nielsen Heuristics (H1 through H10) in "heuristics".
- Include 3 to 5 visible color pairs in "contrastFlags" and 4 to 6 visible copy rewrites in "microcopyMakeovers".`;

      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      screens.forEach((s, idx) => {
        parts.push({
          text: `Screen ${idx} — "${s.label}":`,
        });
        parts.push({
          inlineData: {
            mimeType: s.mimeType,
            data: s.imageBase64.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      });

      const contextDetails = [
        isUrlMode ? `Website URL: ${body.sourceUrl}` : '',
        body.context?.trim() ? `Product context: ${body.context.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      parts.push({
        text: contextDetails
          ? `Audit the interface above (${contextDetails}). Return strictly the JSON object matching the schema.`
          : `Audit the interface above thoroughly. Return strictly the JSON object matching the schema.`,
      });

      const callModel = async (modelName: string) => {
        return ai.models.generateContent({
          model: modelName,
          contents: { parts },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
      };

      sendNdjson({
        type: 'status',
        message: isFlow
          ? `Auditing ${screens.length} sequential screens & cross-screen flow…`
          : isUrlMode
          ? 'Inspecting captured webpage layout, contrast, and copy…'
          : 'Inspecting layout hierarchy, heuristics, and contrast ratios…',
      });

      const modelSequence = [PRIMARY_MODEL, ...FALLBACK_MODELS];
      let response = null;
      let lastError: unknown = null;
      let lastModelUsed = PRIMARY_MODEL;

      const totalAttempts = 1 + RETRY_DELAYS_MS.length;
      for (let attempt = 0; attempt < totalAttempts; attempt++) {
        const modelIndex = Math.min(attempt, modelSequence.length - 1);
        const currentModel = modelSequence[modelIndex];
        lastModelUsed = currentModel;

        try {
          response = await callModel(currentModel);
          lastError = null;
          break;
        } catch (err: unknown) {
          lastError = err;
          console.error(`Audit attempt ${attempt + 1} (${currentModel}) failed:`, err);

          if (isRetryableOrFallbackError(err) && attempt < RETRY_DELAYS_MS.length) {
            const delayMs = RETRY_DELAYS_MS[attempt];
            const delaySec = Math.round(delayMs / 1000);
            sendNdjson({
              type: 'status',
              message: `Our design auditor is momentarily busy—retrying automatically in ${delaySec}s…`,
            });
            await sleep(delayMs);
            sendNdjson({
              type: 'status',
              message: 'Reconnecting to our design auditor…',
            });
            continue;
          }
          break;
        }
      }

      if (!response) {
        const friendly = formatFriendlyError(lastError, lastModelUsed);
        sendNdjson({
          type: 'error',
          message: friendly.message,
          technicalDetails: friendly.technicalDetails,
        });
        res.end();
        return;
      }

      const rawText = response.text;
      if (!rawText) {
        sendNdjson({
          type: 'error',
          message:
            'Our design auditor returned an empty response. Please try running the audit again.',
          technicalDetails: {
            status: 502,
            model: lastModelUsed,
            rawMessage: 'response.text was empty or undefined.',
          },
        });
        res.end();
        return;
      }

      try {
        const parsed = parseJsonSafely(rawText);
        const sanitized = sanitizeReport(parsed, screens, isFlow);
        sendNdjson({
          type: 'result',
          report: sanitized,
        });
      } catch (parseErr: unknown) {
        const parseMsg =
          parseErr instanceof Error ? parseErr.message : String(parseErr);
        sendNdjson({
          type: 'error',
          message:
            'The design auditor returned an unexpected format. Please try running the audit again.',
          technicalDetails: {
            status: 502,
            model: lastModelUsed,
            rawMessage: `JSON parse failure: ${parseMsg}`,
          },
        });
      }
      res.end();
    } catch (err: unknown) {
      console.error('UX Audit error:', err);
      const friendly = formatFriendlyError(err, PRIMARY_MODEL);
      if (!res.headersSent) {
        res.status(friendly.status).json({
          error: friendly.message,
          technicalDetails: friendly.technicalDetails,
        });
      } else {
        res.write(
          JSON.stringify({
            type: 'error',
            message: friendly.message,
            technicalDetails: friendly.technicalDetails,
          }) + '\n'
        );
        res.end();
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UX Roaster server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
