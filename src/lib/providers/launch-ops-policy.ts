import { TIER_A_PROVIDERS } from './tier-a-matrix';

export interface SyncBudgetPolicy {
  maxProvidersPerSync: number;
  maxConcurrentSyncs: number;
  syncIntervalMinutes: number;
  timeoutMs: number;
  cronExpression?: string;
  staggerDelayMs: number;
}

export interface SyncBudgetConfig {
  launchModeEnabled: boolean;
  freeTierMode: boolean;
  overrides?: Partial<SyncBudgetPolicy>;
}

export interface SyncIncludeInput {
  providerSlug: string;
  isTierA: boolean;
  isVerified: boolean;
  isBlocked?: boolean;
  launchModeEnabled: boolean;
  tierAOnly: boolean;
}

export interface SyncIncludeResult {
  include: boolean;
  reason?: string;
}

export interface SyncJobConfig {
  providerCount: number;
  estimatedItemsPerProvider: number;
  estimatedTimePerProviderMs: number;
}

export interface SyncJobEstimate {
  totalTimeMs: number;
  estimatedMemoryMB: number;
  withinFreeTierLimits: boolean;
  limitWarnings: string[];
}

const FREE_TIER_LIMITS = {
  maxExecutionTimeMs: 25000,
  maxMemoryMB: 1024,
  bytesPerItem: 2048,
};

const LAUNCH_MODE_FREE_TIER_POLICY: SyncBudgetPolicy = {
  maxProvidersPerSync: 8,
  maxConcurrentSyncs: 2,
  syncIntervalMinutes: 60,
  timeoutMs: 25000,
  cronExpression: '0 * * * *',
  staggerDelayMs: 1000,
};

const LAUNCH_MODE_PAID_POLICY: SyncBudgetPolicy = {
  maxProvidersPerSync: 20,
  maxConcurrentSyncs: 5,
  syncIntervalMinutes: 30,
  timeoutMs: 30000,
  cronExpression: '*/30 * * * *',
  staggerDelayMs: 500,
};

const DEFAULT_POLICY: SyncBudgetPolicy = {
  maxProvidersPerSync: 41,
  maxConcurrentSyncs: 5,
  syncIntervalMinutes: 30,
  timeoutMs: 30000,
  cronExpression: '*/30 * * * *',
  staggerDelayMs: 200,
};

export function getSyncBudgetPolicy(config: SyncBudgetConfig): SyncBudgetPolicy {
  const { launchModeEnabled, freeTierMode, overrides } = config;

  let basePolicy: SyncBudgetPolicy;

  if (launchModeEnabled && freeTierMode) {
    basePolicy = LAUNCH_MODE_FREE_TIER_POLICY;
  } else if (launchModeEnabled) {
    basePolicy = LAUNCH_MODE_PAID_POLICY;
  } else {
    basePolicy = DEFAULT_POLICY;
  }

  return {
    ...basePolicy,
    ...overrides,
  };
}

export function shouldIncludeProviderInSync(input: SyncIncludeInput): SyncIncludeResult {
  const { providerSlug, isTierA, isVerified, isBlocked, launchModeEnabled, tierAOnly } = input;

  if (isBlocked) {
    return { include: false, reason: 'provider_blocked' };
  }

  if (tierAOnly && !isTierA) {
    return { include: false, reason: 'not_tier_a' };
  }

  if (launchModeEnabled && !isTierA) {
    return { include: false, reason: 'not_tier_a_in_launch_mode' };
  }

  return { include: true };
}

export function estimateSyncJobCost(config: SyncJobConfig): SyncJobEstimate {
  const { providerCount, estimatedItemsPerProvider, estimatedTimePerProviderMs } = config;

  const totalTimeMs = providerCount * estimatedTimePerProviderMs;
  const totalItems = providerCount * estimatedItemsPerProvider;
  const estimatedMemoryMB = Math.ceil((totalItems * FREE_TIER_LIMITS.bytesPerItem) / (1024 * 1024));

  const limitWarnings: string[] = [];

  if (totalTimeMs > FREE_TIER_LIMITS.maxExecutionTimeMs) {
    limitWarnings.push('execution_time_exceeded');
  }

  if (estimatedMemoryMB > FREE_TIER_LIMITS.maxMemoryMB) {
    limitWarnings.push('memory_exceeded');
  }

  return {
    totalTimeMs,
    estimatedMemoryMB,
    withinFreeTierLimits: limitWarnings.length === 0,
    limitWarnings,
  };
}