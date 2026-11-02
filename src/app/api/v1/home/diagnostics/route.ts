import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { generateRequestId } from '@/lib/observability/logger';
import type { ApiResponse, HomeDiagnosticsData } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function GET(): Promise<NextResponse> {
  const requestId = generateRequestId();
  const baseDir = process.cwd();

  const [probe, homepage] = await Promise.all([
    readJsonFile<{
      generatedAt?: string;
      providerCount?: number;
      probeCount?: number;
      summary?: { ok?: number; skipped?: number; failed?: number };
    }>(path.join(baseDir, 'reports', 'provider-probe-latest.json')),
    readJsonFile<{
      generatedAt?: string;
      source?: { error?: string | null };
      sections?: { providerSectionCount?: number; nonEmptyProviderSectionCount?: number };
      homepageWideMetrics?: { duplicateRatio?: number; missingCoverRatio?: number };
    }>(path.join(baseDir, 'reports', 'homepage-analysis-latest.json')),
  ]);

  const data: HomeDiagnosticsData = {
    providerProbeSummary: probe ? {
      providerCount: probe.providerCount ?? 0,
      probeCount: probe.probeCount ?? 0,
      ok: probe.summary?.ok ?? 0,
      skipped: probe.summary?.skipped ?? 0,
      failed: probe.summary?.failed ?? 0,
      generatedAt: probe.generatedAt,
    } : null,
    homepageAnalysisSummary: homepage ? {
      providerSectionCount: homepage.sections?.providerSectionCount ?? 0,
      nonEmptyProviderSectionCount: homepage.sections?.nonEmptyProviderSectionCount ?? 0,
      duplicateRatio: homepage.homepageWideMetrics?.duplicateRatio ?? 0,
      missingCoverRatio: homepage.homepageWideMetrics?.missingCoverRatio ?? 0,
      generatedAt: homepage.generatedAt,
      sourceError: homepage.source?.error ?? null,
    } : null,
  };

  const response: ApiResponse<HomeDiagnosticsData> = {
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
    error: null,
  };

  return NextResponse.json(response);
}
