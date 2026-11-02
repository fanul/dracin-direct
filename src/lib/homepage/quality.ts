import fs from 'node:fs/promises';
import path from 'node:path';
import type { DramaCard, ProviderHealthSummary } from '@/lib/types';

export interface ProviderHealthReport {
  generatedAt?: string;
  providerSummary: ProviderHealthSummary[];
  unavailableProviders: string[];
}

export interface HomeQualityMetrics {
  totalCards: number;
  uniqueCards: number;
  duplicateRatio: number;
  missingCoverRatio: number;
  missingTitleRatio: number;
}

export interface HomeProviderHealthGate {
  enabled: boolean;
  unavailableSlugs: Set<string>;
}

const DEFAULT_HEALTH_REPORT: ProviderHealthReport = {
  providerSummary: [],
  unavailableProviders: [],
};

export function computeHomepageQuality(cards: DramaCard[]): HomeQualityMetrics {
  const totalCards = cards.length;
  const uniqueCards = new Set(cards.map((card) => card.id)).size;
  const duplicateRatio = totalCards === 0 ? 0 : 1 - uniqueCards / totalCards;
  const missingCoverRatio = totalCards === 0
    ? 0
    : cards.filter((card) => !card.coverUrl || card.coverUrl.trim() === '').length / totalCards;
  const missingTitleRatio = totalCards === 0
    ? 0
    : cards.filter((card) => !card.title || card.title.trim() === '').length / totalCards;

  return {
    totalCards,
    uniqueCards,
    duplicateRatio: Number(duplicateRatio.toFixed(4)),
    missingCoverRatio: Number(missingCoverRatio.toFixed(4)),
    missingTitleRatio: Number(missingTitleRatio.toFixed(4)),
  };
}

export function createProviderHealthGate(report: ProviderHealthReport): HomeProviderHealthGate {
  const unavailableSlugs = new Set(report.unavailableProviders || []);
  return {
    enabled: unavailableSlugs.size > 0,
    unavailableSlugs,
  };
}

export async function getLatestProviderHealthReport(): Promise<ProviderHealthReport> {
  const reportPath = path.join(process.cwd(), 'reports', 'provider-probe-latest.json');

  try {
    const raw = await fs.readFile(reportPath, 'utf8');
    const parsed = JSON.parse(raw) as {
      generatedAt?: string;
      providerSummary?: ProviderHealthSummary[];
      unavailableProviders?: string[];
    };

    return {
      generatedAt: parsed.generatedAt,
      providerSummary: Array.isArray(parsed.providerSummary) ? parsed.providerSummary : [],
      unavailableProviders: Array.isArray(parsed.unavailableProviders) ? parsed.unavailableProviders : [],
    };
  } catch {
    return DEFAULT_HEALTH_REPORT;
  }
}
