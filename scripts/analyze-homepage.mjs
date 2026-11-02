import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'homepage-analysis-latest.json');
const TIMEOUT_MS = 12000;
const HOME_URL = process.env.HOMEPAGE_ANALYSIS_URL || 'http://localhost:3000/api/v1/home';

function computeCardMetrics(cards) {
  const total = cards.length;
  const unique = new Set(cards.map((card) => card?.id).filter(Boolean)).size;
  const duplicateRatio = total === 0 ? 0 : 1 - unique / total;
  const missingCoverRatio = total === 0
    ? 0
    : cards.filter((card) => !card?.coverUrl || String(card.coverUrl).trim() === '').length / total;
  const missingTitleRatio = total === 0
    ? 0
    : cards.filter((card) => !card?.title || String(card.title).trim() === '').length / total;

  return {
    totalCards: total,
    uniqueCards: unique,
    duplicateRatio: Number(duplicateRatio.toFixed(4)),
    missingCoverRatio: Number(missingCoverRatio.toFixed(4)),
    missingTitleRatio: Number(missingTitleRatio.toFixed(4)),
  };
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { method: 'GET', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function run() {
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();

  let requestStatus = 0;
  let fetchError = null;
  let homeData = null;

  try {
    const response = await fetchWithTimeout(HOME_URL);
    requestStatus = response.status;
    const payload = await response.json();
    if (!response.ok || payload?.error) {
      fetchError = payload?.error?.message || `home_request_failed_${response.status}`;
    } else {
      homeData = payload?.data ?? null;
    }
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'unknown_error';
  }

  const providerSections = safeArray(homeData?.providerSections);
  const sectionCards = providerSections.flatMap((section) => safeArray(section?.dramas));
  const featured = safeArray(homeData?.featured);
  const trending = safeArray(homeData?.trending);
  const forYou = safeArray(homeData?.forYou);

  const report = {
    generatedAt: new Date().toISOString(),
    startedAt,
    finishedAt: new Date().toISOString(),
    latencyMs: Date.now() - startedMs,
    source: {
      homeUrl: HOME_URL,
      status: requestStatus,
      error: fetchError,
    },
    sections: {
      providerSectionCount: providerSections.length,
      nonEmptyProviderSectionCount: providerSections.filter((section) => safeArray(section?.dramas).length > 0).length,
      featuredCount: featured.length,
      trendingCount: trending.length,
      forYouCount: forYou.length,
    },
    providerSectionMetrics: computeCardMetrics(sectionCards),
    homepageWideMetrics: computeCardMetrics([
      ...featured,
      ...trending,
      ...forYou,
      ...sectionCards,
    ]),
  };

  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('Homepage analysis completed.');
  console.log(`Report: ${REPORT_PATH}`);
  if (fetchError) {
    console.log(`Home source warning: ${fetchError}`);
  }
}

run().catch((error) => {
  console.error('Homepage analysis failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
