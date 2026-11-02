#!/usr/bin/env node
/**
 * Tier A Provider Verification Script
 * 
 * Verifies launch eligibility for Tier A provider candidates
 * and generates the verified Tier A provider matrix artifact.
 * 
 * Usage: node scripts/verify-tier-a-providers.mjs
 */

import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'tier-a-matrix-latest.json');

const token = process.env.CAPTAIN_API_TOKEN || '';

// Import logic from TypeScript module (compiled)
// For now, inline the essential logic for ESM compatibility

const TIER_A_CANDIDATES = [
  'reelshort',
  'goodshort',
  'flextv',
  'shortmax',
  'netshort',
  'dramanova',
  'dramapops',
  'cashdrama',
];

const REQUIRED_INTENTS = ['home', 'search', 'detail', 'episodes', 'playback'];

function summarizeTierAResult(result) {
  const failedIntents = REQUIRED_INTENTS.filter(intent => !result[intent]);
  
  let status;
  let reason;
  
  if (failedIntents.length === 0 && result.displayReady) {
    status = 'verified';
    reason = 'All intents verified';
  } else if (failedIntents.length === REQUIRED_INTENTS.length) {
    status = 'blocked';
    reason = `All intents failed: ${failedIntents.join(', ')}`;
  } else if (failedIntents.length > 0) {
    status = 'blocked';
    reason = `Failed intents: ${failedIntents.join(', ')}`;
  } else if (!result.displayReady) {
    status = 'blocked';
    reason = 'Display quality not ready';
  } else {
    status = 'experimental';
    reason = 'Partial verification';
  }
  
  const launchEligible = status === 'verified' && result.playback && result.displayReady;
  
  return {
    launchEligible,
    status,
    reason,
    verifiedIntents: REQUIRED_INTENTS.filter(i => result[i]),
    failedIntents,
  };
}

async function loadCatalog() {
  const catalogPath = path.join(ROOT, 'api-endpoints.json');
  const content = await fs.readFile(catalogPath, 'utf-8');
  return JSON.parse(content);
}

async function probeEndpoint(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      return { ok: false, status: response.status, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    return { ok: true, status: response.status, data };
  } catch (error) {
    clearTimeout(timeout);
    return { ok: false, status: 0, error: error.message };
  }
}

function resolveEndpoint(provider, intent) {
  const intentMatchers = {
    home: /(\/(foryou|for-you|home|feed|popular|ranking|rank|discover|browse|recommend|tabs))/i,
    search: /search/i,
    detail: /(\/(drama|dramas|series|book)\/:)/i,
    episodes: /(\/(episodes|chapters))/i,
    playback: /(\/(play|stream|video))/i,
  };
  
  const match = provider.endpoints.find(ep => intentMatchers[intent]?.test(ep.path));
  if (!match) return null;
  
  const fallbackParams = { id: '1', code: '1', bookId: '1', dramaId: '1', vid: '1', episode: '1', ep: '1' };
  let resolvedPath = match.path;
  
  for (const param of (match.pathParams || [])) {
    const value = fallbackParams[param] || '1';
    resolvedPath = resolvedPath.replace(`:${param}`, encodeURIComponent(value));
  }
  
  return `${provider.baseUrl}${resolvedPath}`;
}

async function verifyProvider(provider) {
  console.log(`\nVerifying ${provider.provider} (${provider.slug})...`);
  
  const result = {
    home: false,
    search: false,
    detail: false,
    episodes: false,
    playback: false,
    displayReady: true, // Assume true unless we have quality metrics
  };
  
  for (const intent of REQUIRED_INTENTS) {
    const url = resolveEndpoint(provider, intent);
    if (!url) {
      console.log(`  ${intent}: SKIP (no endpoint)`);
      continue;
    }
    
    const probe = await probeEndpoint(url);
    result[intent] = probe.ok;
    
    console.log(`  ${intent}: ${probe.ok ? 'PASS' : 'FAIL'} ${probe.error || ''}`);
  }
  
  return summarizeTierAResult(result);
}

async function main() {
  console.log('Tier A Provider Verification');
  console.log('='.repeat(40));
  
  if (!token) {
    console.error('ERROR: CAPTAIN_API_TOKEN not set');
    process.exit(1);
  }
  
  const catalog = await loadCatalog();
  const providerMap = new Map(catalog.providers.map(p => [p.slug, p]));
  
  const matrix = {};
  
  for (const slug of TIER_A_CANDIDATES) {
    const provider = providerMap.get(slug);
    if (!provider) {
      console.log(`\n${slug}: NOT FOUND in catalog`);
      matrix[slug] = { launchEligible: false, status: 'blocked', reason: 'Not in catalog' };
      continue;
    }
    
    matrix[slug] = await verifyProvider(provider);
  }
  
  // Summary
  console.log('\n' + '='.repeat(40));
  console.log('Summary:');
  console.log('-'.repeat(40));
  
  const verified = Object.entries(matrix).filter(([, m]) => m.launchEligible);
  const blocked = Object.entries(matrix).filter(([, m]) => m.status === 'blocked');
  
  console.log(`Verified: ${verified.length}/${TIER_A_CANDIDATES.length}`);
  console.log(`Blocked: ${blocked.length}`);
  
  if (verified.length > 0) {
    console.log('\nLaunch-eligible providers:');
    verified.forEach(([slug]) => console.log(`  - ${slug}`));
  }
  
  if (blocked.length > 0) {
    console.log('\nBlocked providers:');
    blocked.forEach(([slug, m]) => console.log(`  - ${slug}: ${m.reason}`));
  }
  
  // Write report
  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(REPORT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    candidates: TIER_A_CANDIDATES,
    matrix,
    summary: {
      total: TIER_A_CANDIDATES.length,
      verified: verified.length,
      blocked: blocked.length,
    },
  }, null, 2));
  
  console.log(`\nReport saved to: ${REPORT_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});