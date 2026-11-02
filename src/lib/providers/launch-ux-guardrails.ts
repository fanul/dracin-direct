import { TIER_A_PROVIDERS } from './tier-a-matrix';

export type DisplayQualityLevel = 'high' | 'medium' | 'low';

export interface PlayCTAInput {
  providerSlug: string;
  isTierA: boolean;
  isVerified: boolean;
  playbackReady: boolean;
  isBlocked?: boolean;
  transientIssue?: boolean;
}

export interface PlayCTADecision {
  show: boolean;
  disabled: boolean;
  reason?: string;
  alternativeMessage?: string;
  disabledMessage?: string;
  retrySuggestion?: string;
}

export interface DisplayQualityInput {
  providerSlug: string;
  isTierA: boolean;
  hasValidCover: boolean;
  hasValidTitle: boolean;
  hasValidEpisodes: boolean;
}

export interface ProviderDisplayQuality {
  quality: DisplayQualityLevel;
  score: number;
  issues: string[];
  belowLaunchThreshold: boolean;
}

export interface LaunchUXGuardrailsConfig {
  launchModeEnabled: boolean;
  strictMode?: boolean;
  customThresholds?: {
    minDisplayQuality?: DisplayQualityLevel;
  };
}

export interface LaunchUXGuardrails {
  minDisplayQuality: DisplayQualityLevel;
  hideUnverifiedProviders: boolean;
  disablePlayCTAForUnverified: boolean;
  hideLowQualityContent: boolean;
}

const QUALITY_WEIGHTS = {
  cover: 0.4,
  title: 0.2,
  episodes: 0.25,
  tierA: 0.15,
};

const LAUNCH_THRESHOLD_SCORE = 0.7;

export function shouldShowPlayCTA(input: PlayCTAInput): PlayCTADecision {
  const { providerSlug, isTierA, isVerified, playbackReady, isBlocked, transientIssue } = input;

  if (isBlocked) {
    return {
      show: true,
      disabled: true,
      reason: 'provider_blocked',
      alternativeMessage: 'browse only - playback temporarily unavailable',
      disabledMessage: 'This content is available for browsing only.',
    };
  }

  if (!isVerified) {
    return {
      show: true,
      disabled: true,
      reason: 'provider_unverified',
      alternativeMessage: 'browse only - provider not verified for playback',
      disabledMessage: 'This provider has not been verified for playback.',
    };
  }

  if (!playbackReady) {
    const message = transientIssue
      ? 'Playback temporarily unavailable. Please try again shortly.'
      : 'Playback is not available for this content.';

    return {
      show: true,
      disabled: true,
      reason: 'playback_not_ready',
      disabledMessage: message,
      retrySuggestion: transientIssue ? 'Try again in a few moments.' : undefined,
    };
  }

  return {
    show: true,
    disabled: false,
  };
}

export function getProviderDisplayQuality(input: DisplayQualityInput): ProviderDisplayQuality {
  const { providerSlug, isTierA, hasValidCover, hasValidTitle, hasValidEpisodes } = input;

  const issues: string[] = [];
  let score = 0;

  if (hasValidCover) {
    score += QUALITY_WEIGHTS.cover;
  } else {
    issues.push('missing_cover');
  }

  if (hasValidTitle) {
    score += QUALITY_WEIGHTS.title;
  } else {
    issues.push('missing_title');
  }

  if (hasValidEpisodes) {
    score += QUALITY_WEIGHTS.episodes;
  } else {
    issues.push('invalid_episodes');
  }

  if (isTierA) {
    score += QUALITY_WEIGHTS.tierA;
  }

  let quality: DisplayQualityLevel;
  if (score >= 0.9) {
    quality = 'high';
  } else if (score >= 0.6) {
    quality = 'medium';
  } else {
    quality = 'low';
  }

  return {
    quality,
    score,
    issues,
    belowLaunchThreshold: score < LAUNCH_THRESHOLD_SCORE,
  };
}

export function getLaunchUXGuardrails(config: LaunchUXGuardrailsConfig): LaunchUXGuardrails {
  const { launchModeEnabled, strictMode, customThresholds } = config;

  if (launchModeEnabled && strictMode) {
    return {
      minDisplayQuality: customThresholds?.minDisplayQuality ?? 'high',
      hideUnverifiedProviders: true,
      disablePlayCTAForUnverified: true,
      hideLowQualityContent: true,
    };
  }

  if (launchModeEnabled) {
    return {
      minDisplayQuality: customThresholds?.minDisplayQuality ?? 'high',
      hideUnverifiedProviders: false,
      disablePlayCTAForUnverified: true,
      hideLowQualityContent: true,
    };
  }

  return {
    minDisplayQuality: customThresholds?.minDisplayQuality ?? 'medium',
    hideUnverifiedProviders: false,
    disablePlayCTAForUnverified: false,
    hideLowQualityContent: false,
  };
}