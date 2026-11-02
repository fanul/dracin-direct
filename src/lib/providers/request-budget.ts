/**
 * Captain Request Budget and Cooldown Policy
 *
 * Manages request budgets and cooldown policies for upstream provider calls.
 * Protects the captain.sapimu.au endpoint from excessive requests and
 * implements negative caching for failing providers.
 */

/**
 * Provider failure record for tracking cooldown state
 */
export interface ProviderFailureRecord {
  /** Provider slug */
  provider: string;
  /** Number of consecutive failures */
  failureCount: number;
  /** Timestamp of last failure (epoch ms) */
  lastFailureTime: number;
  /** Last error type */
  lastError: string | null;
  /** Cooldown expiration timestamp (epoch ms) */
  cooldownUntil: number;
}

/**
 * Request budget policy configuration
 */
export interface RequestBudgetPolicy {
  /** Maximum concurrent requests to upstream */
  maxConcurrentRequests: number;
  /** Cooldown duration in minutes after failures */
  cooldownMinutes: number;
  /** Number of failures before entering cooldown */
  failureThreshold: number;
  /** Request timeout in milliseconds */
  timeoutMs: number;
}

/**
 * Input for shouldCooldownProvider decision
 */
export interface ShouldCooldownInput {
  /** Error type or code */
  error: string;
  /** Number of consecutive failures */
  failureCount: number;
  /** Timestamp of last failure */
  lastFailureTime: number;
}

/**
 * Result of cooldown state check
 */
export interface CooldownState {
  /** Whether provider is in cooldown */
  inCooldown: boolean;
  /** Remaining cooldown time in milliseconds */
  remainingMs: number;
  /** Whether provider can be retried */
  canRetry: boolean;
}

/**
 * Configuration for request budget policy
 */
export interface RequestBudgetConfig {
  /** Whether launch mode is enabled */
  launchModeEnabled: boolean;
  /** Custom policy overrides */
  overrides?: Partial<RequestBudgetPolicy>;
}

/** Default policy for non-launch mode */
const DEFAULT_POLICY: RequestBudgetPolicy = {
  maxConcurrentRequests: 10,
  cooldownMinutes: 5,
  failureThreshold: 3,
  timeoutMs: 15000,
};

/** Conservative policy for launch mode */
const LAUNCH_MODE_POLICY: RequestBudgetPolicy = {
  maxConcurrentRequests: 5,
  cooldownMinutes: 10,
  failureThreshold: 2,
  timeoutMs: 10000,
};

/** Default cooldown duration in milliseconds */
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/** Network errors that trigger immediate cooldown */
const IMMEDIATE_COOLDOWN_ERRORS = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
]);

/** Errors that should NOT trigger cooldown */
const NO_COOLDOWN_ERRORS = new Set([
  '400',
  '401',
  '403',
  '404',
  '422',
]);

/**
 * Determines if a provider should be in cooldown based on failure history.
 * Takes into account error type, failure count, and time since last failure.
 */
export function shouldCooldownProvider(input: ShouldCooldownInput): boolean {
  const { error, failureCount, lastFailureTime } = input;
  const now = Date.now();

  // Check if cooldown period has expired based on time
  // Default cooldown is 5 minutes
  if (lastFailureTime > 0 && now - lastFailureTime > DEFAULT_COOLDOWN_MS) {
    return false;
  }

  // Immediate cooldown for network-level errors
  if (IMMEDIATE_COOLDOWN_ERRORS.has(error)) {
    return true;
  }

  // No cooldown for 4xx client errors (except 429 which is handled separately)
  if (NO_COOLDOWN_ERRORS.has(error)) {
    return false;
  }

  // Check if error is a 4xx pattern
  if (/^4\d{2}$/.test(error)) {
    return false;
  }

  // Check for timeout - requires threshold
  if (error === 'timeout') {
    return failureCount >= 2;
  }

  // Check for 5xx errors - requires threshold
  if (/^5\d{2}$/.test(error)) {
    return failureCount >= 2;
  }

  // Unknown error - use failure threshold
  return failureCount >= 3;
}

/**
 * Gets the request budget policy based on configuration.
 */
export function getRequestBudgetPolicy(config: RequestBudgetConfig): RequestBudgetPolicy {
  const { launchModeEnabled, overrides } = config;

  const basePolicy = launchModeEnabled ? LAUNCH_MODE_POLICY : DEFAULT_POLICY;

  return {
    ...basePolicy,
    ...overrides,
  };
}

/**
 * Records a provider failure and updates cooldown state.
 * Always sets a cooldown period after recording a failure.
 */
export function recordProviderFailure(
  record: ProviderFailureRecord,
  error: string,
  cooldownMs: number
): ProviderFailureRecord {
  const now = Date.now();

  return {
    ...record,
    failureCount: record.failureCount + 1,
    lastFailureTime: now,
    lastError: error,
    cooldownUntil: now + cooldownMs,
  };
}

/**
 * Records a provider success and resets failure state.
 */
export function recordProviderSuccess(record: ProviderFailureRecord): ProviderFailureRecord {
  return {
    ...record,
    failureCount: 0,
    lastError: null,
    cooldownUntil: 0,
  };
}

/**
 * Gets the current cooldown state for a provider.
 */
export function getProviderCooldownState(record: ProviderFailureRecord): CooldownState {
  const now = Date.now();

  if (record.cooldownUntil <= 0 || record.cooldownUntil <= now) {
    return {
      inCooldown: false,
      remainingMs: 0,
      canRetry: true,
    };
  }

  return {
    inCooldown: true,
    remainingMs: record.cooldownUntil - now,
    canRetry: false,
  };
}

/**
 * Creates an initial failure record for a provider.
 */
export function createProviderFailureRecord(provider: string): ProviderFailureRecord {
  return {
    provider,
    failureCount: 0,
    lastFailureTime: 0,
    lastError: null,
    cooldownUntil: 0,
  };
}