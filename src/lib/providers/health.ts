import type { ProviderHealthStatus } from '@/lib/types';

export function classifyProviderHealth(score: number): ProviderHealthStatus {
  if (score >= 80) {
    return 'healthy';
  }
  if (score >= 50) {
    return 'degraded';
  }
  return 'unavailable';
}
