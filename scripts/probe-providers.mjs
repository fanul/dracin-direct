import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, 'api-endpoints.json');
const REPORT_DIR = path.join(ROOT, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'provider-probe-latest.json');
const TIMEOUT_MS = 12000;

const token = process.env.CAPTAIN_API_TOKEN || '';

const intentMatchers = {
  home: /(\/(foryou|for-you|home|feed|popular|ranking|rank|discover|browse|recommend|tabs))/i,
  search: /search/i,
  playback: /(\/(play|stream|video))/i,
};

const fallbackParamValues = {
  id: '1',
  code: '1',
  bookId: '1',
  dramaId: '1',
  seriesId: '1',
  series_id: '1',
  playletId: '1',
  vid: '1',
  chapterId: '1',
  chapter: '1',
  ep: '1',
  episode: '1',
  episodeNo: '1',
  section_id: '1',
  name: 'Fokus',
  tab: '1',
  q: 'love',
  query: 'love',
  keyword: 'love',
};

function classifyHealth(score) {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'degraded';
  return 'unavailable';
}

function computeProviderScore(rows) {
  if (!rows || rows.length === 0) return 0;

  const total = rows.length;
  const okCount = rows.filter((row) => row.ok).length;
  const skippedCount = rows.filter((row) => row.skipped).length;
  const successRatio = okCount / total;
  const skipPenalty = skippedCount * 0.05;
  const score = Math.round((successRatio - skipPenalty) * 100);
  return Math.max(0, score);
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const raw = payload;
  const hasData = raw.data !== undefined;
  const isWrapper = hasData && (
    raw.success !== undefined
    || raw.code !== undefined
    || raw.cached !== undefined
    || raw.status !== undefined
    || raw.message !== undefined
  );
  return isWrapper ? raw.data : payload;
}

function fillPathParams(endpointPath, pathParams = []) {
  let resolvedPath = endpointPath;
  const missing = [];

  for (const param of pathParams) {
    const value = fallbackParamValues[param];
    if (!value) {
      missing.push(param);
      continue;
    }
    resolvedPath = resolvedPath.replace(`:${param}`, encodeURIComponent(value));
  }

  return { resolvedPath, missing };
}

function buildProbeUrl(provider, intent) {
  const match = provider.endpoints.find((endpoint) => intentMatchers[intent].test(endpoint.path));
  if (!match) return null;

  const { resolvedPath, missing } = fillPathParams(match.path, match.pathParams || []);
  if (missing.length > 0) return { skipped: true, reason: `missing_fallback_params:${missing.join(',')}` };

  let url = `${provider.baseUrl}${resolvedPath}`;
  if (intent === 'search' && !url.includes('?')) {
    url += '?q=love';
  }
  return { endpoint: match, url };
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function countItems(payload) {
  const normalized = normalizePayload(payload);
  if (Array.isArray(normalized)) return normalized.length;
  if (!normalized || typeof normalized !== 'object') return 0;

  for (const key of ['list', 'items', 'results', 'episodes', 'chapters', 'records', 'data']) {
    const value = normalized[key];
    if (Array.isArray(value)) return value.length;
  }
  return 1;
}

async function run() {
  const catalogRaw = await fs.readFile(CATALOG_PATH, 'utf8');
  const catalog = JSON.parse(catalogRaw);
  const activeProviders = (catalog.providers || []).filter((provider) => provider.status === 'active');

  const startedAt = new Date().toISOString();
  const probes = [];

  for (const provider of activeProviders) {
    for (const intent of ['home', 'search', 'playback']) {
      const prepared = buildProbeUrl(provider, intent);
      if (!prepared) {
        probes.push({
          provider: provider.slug,
          intent,
          ok: false,
          skipped: true,
          reason: 'endpoint_not_found',
        });
        continue;
      }

      if (prepared.skipped) {
        probes.push({
          provider: provider.slug,
          intent,
          ok: false,
          skipped: true,
          reason: prepared.reason,
        });
        continue;
      }

      if (!token) {
        probes.push({
          provider: provider.slug,
          intent,
          ok: false,
          skipped: true,
          reason: 'missing_CAPTAIN_API_TOKEN',
          url: prepared.url,
        });
        continue;
      }

      const started = Date.now();
      try {
        const response = await fetchWithTimeout(prepared.url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        probes.push({
          provider: provider.slug,
          providerName: provider.provider,
          intent,
          ok: response.ok,
          status: response.status,
          latencyMs: Date.now() - started,
          url: prepared.url,
          endpointPath: prepared.endpoint.path,
          itemCount: payload ? countItems(payload) : 0,
          error: response.ok ? null : (payload?.message || payload?.error || 'non_2xx_response'),
        });
      } catch (error) {
        probes.push({
          provider: provider.slug,
          providerName: provider.provider,
          intent,
          ok: false,
          status: 0,
          latencyMs: Date.now() - started,
          url: prepared.url,
          endpointPath: prepared.endpoint.path,
          itemCount: 0,
          error: error instanceof Error ? error.message : 'unknown_error',
        });
      }
    }
  }

  const finishedAt = new Date().toISOString();
  const total = probes.length;
  const ok = probes.filter((probe) => probe.ok).length;
  const skipped = probes.filter((probe) => probe.skipped).length;
  const failed = total - ok - skipped;

  const byIntent = {};
  for (const intent of ['home', 'search', 'playback']) {
    const rows = probes.filter((probe) => probe.intent === intent);
    byIntent[intent] = {
      total: rows.length,
      ok: rows.filter((probe) => probe.ok).length,
      skipped: rows.filter((probe) => probe.skipped).length,
      failed: rows.filter((probe) => !probe.ok && !probe.skipped).length,
    };
  }

  const providerSummary = activeProviders.map((provider) => {
    const rows = probes.filter((probe) => probe.provider === provider.slug);
    const healthScore = computeProviderScore(rows);
    return {
      provider: provider.slug,
      providerName: provider.provider,
      healthScore,
      healthStatus: classifyHealth(healthScore),
      total: rows.length,
      ok: rows.filter((probe) => probe.ok).length,
      skipped: rows.filter((probe) => probe.skipped).length,
      failed: rows.filter((probe) => !probe.ok && !probe.skipped).length,
    };
  });

  const unavailableProviders = providerSummary
    .filter((entry) => entry.healthStatus === 'unavailable')
    .map((entry) => entry.provider);

  const report = {
    generatedAt: finishedAt,
    startedAt,
    finishedAt,
    timeoutMs: TIMEOUT_MS,
    providerCount: activeProviders.length,
    probeCount: total,
    summary: { ok, skipped, failed },
    byIntent,
    providerSummary,
    unavailableProviders,
    probes,
  };

  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`Provider probe completed for ${activeProviders.length} active providers.`);
  console.log(`Summary: ok=${ok}, skipped=${skipped}, failed=${failed}`);
  console.log(`Report: ${REPORT_PATH}`);
}

run().catch((error) => {
  console.error('Provider probe failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
