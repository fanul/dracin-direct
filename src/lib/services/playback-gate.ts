/**
 * Playback Compatibility Gate
 *
 * Validates playback streams for web compatibility and launch eligibility.
 * Distinguishes between "endpoint resolves" and "playback web-compatible".
 */

/**
 * DRM information for encrypted streams
 */
export interface DrmInfo {
  /** DRM type (widevine, fairplay, playready) */
  type: string;
  /** License server URL */
  licenseUrl: string;
}

/**
 * Stream information for compatibility check
 */
export interface PlaybackStreamInfo {
  /** Stream URL */
  streamUrl: string | null;
  /** Content type (MIME type) */
  contentType: string | null;
  /** DRM information if encrypted */
  drm?: DrmInfo;
}

/**
 * Input for playback compatibility check
 */
export interface CheckPlaybackInput extends PlaybackStreamInfo {
  /** Provider slug */
  provider: string;
  /** Whether the provider is Tier A */
  isTierA?: boolean;
  /** Whether endpoint resolved successfully */
  endpointResolved?: boolean;
  /** Endpoint error if failed */
  endpointError?: string;
}

/**
 * Result of playback compatibility check
 */
export interface PlaybackCompatibilityResult {
  /** Whether stream is compatible with web playback */
  compatible: boolean;
  /** Reason for compatibility result */
  reason: string;
  /** Whether playback is blocked (incompatible and not recoverable) */
  blocked?: boolean;
  /** Whether endpoint resolved */
  endpointResolved?: boolean;
  /** Whether playback is ready */
  playbackReady: boolean;
}

/**
 * Full playback gate result with launch eligibility
 */
export interface PlaybackGateResult {
  /** Provider slug */
  provider: string;
  /** Whether playback is ready */
  playbackReady: boolean;
  /** Whether provider is launch eligible */
  launchEligible: boolean;
  /** Block reason if ineligible */
  blockReason?: string;
  /** Warning message if compatible but not optimal */
  warning?: string;
  /** Fallback message for users */
  fallbackMessage?: string;
}

/**
 * Input for full playback gate result
 */
export interface GetPlaybackGateInput {
  /** Provider slug */
  provider: string;
  /** Stream information */
  streamInfo: PlaybackStreamInfo;
  /** Whether launch mode is enabled */
  launchModeEnabled: boolean;
  /** Whether provider is Tier A */
  isTierA?: boolean;
}

/** Supported content types for web playback */
const SUPPORTED_CONTENT_TYPES = new Set([
  'application/x-mpegURL',
  'application/vnd.apple.mpegurl',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
]);

/** Supported file extensions for web playback */
const SUPPORTED_EXTENSIONS = new Set([
  '.m3u8',
  '.mp4',
  '.webm',
  '.mp3',
  '.m4a',
]);

/** Content types that indicate HLS */
const HLS_CONTENT_TYPES = new Set([
  'application/x-mpegURL',
  'application/vnd.apple.mpegurl',
]);

/**
 * Checks if a stream is compatible with web playback.
 */
export function isPlaybackWebCompatible(stream: PlaybackStreamInfo): boolean {
  const { streamUrl, contentType, drm } = stream;

  // No stream URL
  if (!streamUrl) {
    return false;
  }

  // Check for blob URLs (cannot validate)
  if (streamUrl.startsWith('blob:')) {
    return false;
  }

  // Check for unsupported protocols
  const protocol = streamUrl.split(':')[0]?.toLowerCase();
  if (protocol === 'rtmp' || protocol === 'rtmps') {
    return false;
  }

  // DRM streams require explicit compatibility check
  if (drm) {
    // For launch, we block DRM streams by default
    // This can be expanded to support specific DRM configurations
    return false;
  }

  // Check content type
  if (contentType && SUPPORTED_CONTENT_TYPES.has(contentType.toLowerCase())) {
    return true;
  }

  // Infer from URL extension
  const url = streamUrl.toLowerCase();
  for (const ext of SUPPORTED_EXTENSIONS) {
    if (url.includes(ext)) {
      return true;
    }
  }

  // Unknown content type
  return false;
}

/**
 * Checks playback compatibility for a stream.
 */
export function checkPlaybackCompatibility(input: CheckPlaybackInput): PlaybackCompatibilityResult {
  const {
    provider,
    streamUrl,
    contentType,
    drm,
    isTierA,
    endpointResolved,
    endpointError,
  } = input;

  // Check for endpoint errors first
  if (endpointError === '403') {
    return {
      compatible: false,
      reason: 'endpoint_forbidden',
      blocked: true,
      endpointResolved: false,
      playbackReady: false,
    };
  }

  // Null stream URL
  if (!streamUrl) {
    return {
      compatible: false,
      reason: 'no_stream_url',
      blocked: true,
      endpointResolved,
      playbackReady: false,
    };
  }

  // Check for DRM
  if (drm) {
    return {
      compatible: false,
      reason: `drm_encrypted_${drm.type}_not_supported`,
      blocked: isTierA,
      endpointResolved,
      playbackReady: false,
    };
  }

  // Check for unsupported protocols
  const protocol = streamUrl.split(':')[0]?.toLowerCase();
  if (protocol === 'rtmp' || protocol === 'rtmps') {
    return {
      compatible: false,
      reason: 'unsupported_protocol_rtmp',
      blocked: isTierA,
      endpointResolved,
      playbackReady: false,
    };
  }

  // Check blob URLs
  if (streamUrl.startsWith('blob:')) {
    return {
      compatible: false,
      reason: 'blob_url_not_validatable',
      blocked: isTierA,
      endpointResolved,
      playbackReady: false,
    };
  }

  // Check content type or infer from extension
  const isCompatible = isPlaybackWebCompatible({ streamUrl, contentType });

  if (!isCompatible) {
    const url = streamUrl.toLowerCase();
    let hasKnownExtension = false;
    for (const ext of SUPPORTED_EXTENSIONS) {
      if (url.includes(ext)) {
        hasKnownExtension = true;
        break;
      }
    }

    if (!hasKnownExtension && (!contentType || contentType === 'unknown')) {
      return {
        compatible: false,
        reason: 'unknown_content_type',
        blocked: false,
        endpointResolved,
        playbackReady: false,
      };
    }

    return {
      compatible: false,
      reason: 'unsupported_format',
      blocked: isTierA,
      endpointResolved,
      playbackReady: false,
    };
  }

  // Stream is compatible
  return {
    compatible: true,
    reason: 'stream_supported',
    endpointResolved,
    playbackReady: true,
  };
}

/**
 * Gets the full playback gate result with launch eligibility.
 */
export function getPlaybackGateResult(input: GetPlaybackGateInput): PlaybackGateResult {
  const { provider, streamInfo, launchModeEnabled, isTierA } = input;

  const compatibility = checkPlaybackCompatibility({
    provider,
    ...streamInfo,
    isTierA,
  });

  const result: PlaybackGateResult = {
    provider,
    playbackReady: compatibility.playbackReady,
    launchEligible: compatibility.playbackReady && (!launchModeEnabled || isTierA !== false),
  };

  if (!compatibility.playbackReady) {
    result.blockReason = compatibility.reason;
    result.fallbackMessage = 'This video is currently unavailable. Please try again later.';
  }

  // Add warning for non-Tier A providers in non-launch mode
  if (!isTierA && !launchModeEnabled && !compatibility.playbackReady) {
    result.warning = `Provider ${provider} may not support web playback`;
  }

  return result;
}