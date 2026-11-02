import { describe, expect, it } from 'vitest';
import {
  checkPlaybackCompatibility,
  isPlaybackWebCompatible,
  getPlaybackGateResult,
  type PlaybackStreamInfo,
  type PlaybackGateResult,
} from '../src/lib/services/playback-gate';

describe('provider playback launch gate', () => {
  describe('isPlaybackWebCompatible', () => {
    it('returns true for HLS streams with m3u8 extension', () => {
      const result = isPlaybackWebCompatible({
        streamUrl: 'https://example.com/video.m3u8',
        contentType: 'application/x-mpegURL',
      });

      expect(result).toBe(true);
    });

    it('returns true for MP4 streams', () => {
      const result = isPlaybackWebCompatible({
        streamUrl: 'https://example.com/video.mp4',
        contentType: 'video/mp4',
      });

      expect(result).toBe(true);
    });

    it('returns false for encrypted DRM streams without supported key system', () => {
      const result = isPlaybackWebCompatible({
        streamUrl: 'https://example.com/video.m3u8',
        contentType: 'application/x-mpegURL',
        drm: {
          type: 'widevine',
          licenseUrl: 'https://example.com/license',
        },
      });

      // Widevine requires EME which may not be available in all browsers
      // For launch, we require explicit compatibility check
      expect(result).toBe(false);
    });

    it('returns false for unsupported formats like RTMP', () => {
      const result = isPlaybackWebCompatible({
        streamUrl: 'rtmp://example.com/live/stream',
        contentType: 'rtmp',
      });

      expect(result).toBe(false);
    });

    it('returns false for blob URLs that cannot be validated', () => {
      const result = isPlaybackWebCompatible({
        streamUrl: 'blob:https://example.com/uuid',
        contentType: 'unknown',
      });

      expect(result).toBe(false);
    });
  });

  describe('checkPlaybackCompatibility', () => {
    it('returns compatible for valid HLS stream', () => {
      const result = checkPlaybackCompatibility({
        provider: 'reelshort',
        streamUrl: 'https://example.com/video.m3u8',
        contentType: 'application/x-mpegURL',
      });

      expect(result.compatible).toBe(true);
      expect(result.reason).toBe('stream_supported');
    });

    it('returns blocked for encrypted streams on Tier A provider', () => {
      const result = checkPlaybackCompatibility({
        provider: 'reelshort',
        streamUrl: 'https://example.com/encrypted.m3u8',
        contentType: 'application/x-mpegURL',
        drm: {
          type: 'widevine',
          licenseUrl: 'https://example.com/license',
        },
        isTierA: true,
      });

      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('drm');
      expect(result.blocked).toBe(true);
    });

    it('returns warning for unknown content type', () => {
      const result = checkPlaybackCompatibility({
        provider: 'someprovider',
        streamUrl: 'https://example.com/video',
        contentType: 'unknown',
      });

      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('unknown');
    });

    it('distinguishes endpoint resolves from playback compatible', () => {
      // Endpoint resolves (200) but stream is not web-compatible
      const result = checkPlaybackCompatibility({
        provider: 'testprovider',
        streamUrl: 'https://example.com/video.rtmp',
        contentType: 'rtmp',
        endpointResolved: true,
      });

      expect(result.compatible).toBe(false);
      expect(result.endpointResolved).toBe(true);
      expect(result.playbackReady).toBe(false);
    });

    it('returns blocked for null stream URL', () => {
      const result = checkPlaybackCompatibility({
        provider: 'testprovider',
        streamUrl: null,
        contentType: null,
      });

      expect(result.compatible).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('no_stream');
    });
  });

  describe('getPlaybackGateResult', () => {
    it('returns gate result with all metadata for launch eligibility', () => {
      const result = getPlaybackGateResult({
        provider: 'reelshort',
        streamInfo: {
          streamUrl: 'https://example.com/video.m3u8',
          contentType: 'application/x-mpegURL',
        },
        launchModeEnabled: true,
      });

      expect(result.provider).toBe('reelshort');
      expect(result.playbackReady).toBe(true);
      expect(result.launchEligible).toBe(true);
    });

    it('marks launch ineligible for non-compatible streams', () => {
      const result = getPlaybackGateResult({
        provider: 'someprovider',
        streamInfo: {
          streamUrl: 'https://example.com/video.rtmp',
          contentType: 'rtmp',
        },
        launchModeEnabled: true,
        isTierA: true,
      });

      expect(result.playbackReady).toBe(false);
      expect(result.launchEligible).toBe(false);
      expect(result.blockReason).toBeDefined();
    });

    it('allows non-Tier A providers to pass with warning in non-launch mode', () => {
      const result = getPlaybackGateResult({
        provider: 'experimental',
        streamInfo: {
          streamUrl: 'https://example.com/video.rtmp',
          contentType: 'rtmp',
        },
        launchModeEnabled: false,
        isTierA: false,
      });

      expect(result.playbackReady).toBe(false);
      expect(result.launchEligible).toBe(false);
      expect(result.warning).toBeDefined();
    });

    it('provides fallback message for blocked playback', () => {
      const result = getPlaybackGateResult({
        provider: 'reelshort',
        streamInfo: {
          streamUrl: null,
          contentType: null,
        },
        launchModeEnabled: true,
        isTierA: true,
      });

      expect(result.fallbackMessage).toBeDefined();
      expect(result.fallbackMessage).toContain('unavailable');
    });
  });

  describe('playback gate edge cases', () => {
    it('handles missing content type with URL extension check', () => {
      const result = checkPlaybackCompatibility({
        provider: 'testprovider',
        streamUrl: 'https://example.com/video.m3u8',
        contentType: null,
      });

      // Should infer from extension
      expect(result.compatible).toBe(true);
    });

    it('handles relative URLs', () => {
      const result = checkPlaybackCompatibility({
        provider: 'testprovider',
        streamUrl: '/videos/stream.m3u8',
        contentType: 'application/x-mpegURL',
      });

      expect(result.compatible).toBe(true);
    });

    it('handles 403 forbidden endpoint response', () => {
      const result = checkPlaybackCompatibility({
        provider: 'testprovider',
        streamUrl: 'https://example.com/video.m3u8',
        contentType: 'application/x-mpegURL',
        endpointResolved: false,
        endpointError: '403',
      });

      expect(result.compatible).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('forbidden');
    });
  });
});