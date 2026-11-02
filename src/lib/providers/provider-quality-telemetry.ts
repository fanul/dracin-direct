export type QualityIssueType =
  | 'empty_payload'
  | 'mapping_failure'
  | 'timeout'
  | 'rate_limited'
  | 'authentication_error'
  | 'server_error'
  | 'invalid_response';

export type QualitySeverity = 'info' | 'warning' | 'degradation' | 'error';

export interface ProviderQualitySignal {
  signalId: string;
  providerSlug: string;
  issueType: QualityIssueType;
  endpoint: string;
  timestamp: number;
  severity: QualitySeverity;
  actionable: boolean;
  context?: Record<string, unknown>;
}

export interface ClassifyInput {
  providerSlug: string;
  issueType: QualityIssueType;
  endpoint: string;
  isActive: boolean;
}

export interface ClassifyResult {
  severity: QualitySeverity;
  actionable: boolean;
}

export interface EmitSignalInput {
  providerSlug: string;
  issueType: QualityIssueType;
  endpoint: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

export interface ProviderSummary {
  totalSignals: number;
  uniqueSignals: number;
  issueCounts: Record<string, number>;
  lastSignal?: ProviderQualitySignal;
}

export interface ProviderQualitySummary {
  totalSignals: number;
  providerSummaries: Record<string, ProviderSummary>;
  degradedProviders: string[];
}

const DEGRADATION_THRESHOLD = 3;
const DEDUPLICATION_WINDOW_MS = 60000;

const SEVERITY_MAP: Record<QualityIssueType, QualitySeverity> = {
  empty_payload: 'degradation',
  mapping_failure: 'error',
  timeout: 'warning',
  rate_limited: 'warning',
  authentication_error: 'error',
  server_error: 'warning',
  invalid_response: 'degradation',
};

const ACTIONABLE_ISSUES = new Set<QualityIssueType>([
  'empty_payload',
  'mapping_failure',
  'authentication_error',
  'server_error',
]);

export function classifyProviderQualityIssue(input: ClassifyInput): ClassifyResult {
  const { issueType, isActive } = input;

  if (!isActive) {
    return {
      severity: 'info',
      actionable: false,
    };
  }

  const baseSeverity = SEVERITY_MAP[issueType] || 'warning';
  const actionable = ACTIONABLE_ISSUES.has(issueType);

  return {
    severity: baseSeverity,
    actionable,
  };
}

let signalCounter = 0;

export function emitProviderQualitySignal(input: EmitSignalInput): ProviderQualitySignal {
  const { providerSlug, issueType, endpoint, timestamp, context } = input;

  const classification = classifyProviderQualityIssue({
    providerSlug,
    issueType,
    endpoint,
    isActive: true,
  });

  signalCounter++;

  return {
    signalId: `sig_${timestamp}_${signalCounter}`,
    providerSlug,
    issueType,
    endpoint,
    timestamp,
    severity: classification.severity,
    actionable: classification.actionable,
    context,
  };
}

export function getProviderQualitySummary(signals: ProviderQualitySignal[]): ProviderQualitySummary {
  const providerSummaries: Record<string, ProviderSummary> = {};
  const seenKeys = new Map<string, number>();

  for (const signal of signals) {
    const { providerSlug, issueType, endpoint, timestamp } = signal;

    if (!providerSummaries[providerSlug]) {
      providerSummaries[providerSlug] = {
        totalSignals: 0,
        uniqueSignals: 0,
        issueCounts: {},
      };
    }

    providerSummaries[providerSlug].totalSignals++;
    providerSummaries[providerSlug].issueCounts[issueType] =
      (providerSummaries[providerSlug].issueCounts[issueType] || 0) + 1;
    providerSummaries[providerSlug].lastSignal = signal;

    const dedupeKey = `${providerSlug}:${issueType}:${endpoint}`;
    const lastSeen = seenKeys.get(dedupeKey);

    if (!lastSeen || timestamp - lastSeen > DEDUPLICATION_WINDOW_MS) {
      providerSummaries[providerSlug].uniqueSignals++;
      seenKeys.set(dedupeKey, timestamp);
    }
  }

  const degradedProviders: string[] = [];

  for (const [providerSlug, summary] of Object.entries(providerSummaries)) {
    if (summary.totalSignals >= DEGRADATION_THRESHOLD) {
      degradedProviders.push(providerSlug);
    }
  }

  return {
    totalSignals: signals.length,
    providerSummaries,
    degradedProviders,
  };
}

export function resetSignalCounter(): void {
  signalCounter = 0;
}