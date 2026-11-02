import { describe, expect, it } from 'vitest';
import {
  buildCanonicalDramaId,
  parseCanonicalDramaId,
  buildCanonicalEpisodeId,
  parseCanonicalEpisodeId,
  isValidCanonicalDramaId,
  isValidCanonicalEpisodeId,
  validateProviderDramaId,
  type CanonicalDramaId,
  type CanonicalEpisodeId,
} from '../src/lib/providers/canonical-identity';

describe('canonical identity contract', () => {
  describe('buildCanonicalDramaId', () => {
    it('builds canonical drama ID from provider slug and provider drama ID', () => {
      const result = buildCanonicalDramaId('reelshort', 'abc123');

      expect(result).toBe('reelshort:abc123');
    });

    it('handles provider drama IDs with colons', () => {
      const result = buildCanonicalDramaId('netshort', 'movie:action:123');

      expect(result).toBe('netshort:movie:action:123');
    });

    it('throws on empty provider slug', () => {
      expect(() => buildCanonicalDramaId('', 'abc123')).toThrow();
    });

    it('throws on empty provider drama ID', () => {
      expect(() => buildCanonicalDramaId('reelshort', '')).toThrow();
    });

    it('normalizes provider slug to lowercase', () => {
      const result = buildCanonicalDramaId('REELSHORT', 'abc123');

      expect(result).toBe('reelshort:abc123');
    });
  });

  describe('parseCanonicalDramaId', () => {
    it('parses canonical drama ID into components', () => {
      const result = parseCanonicalDramaId('reelshort:abc123');

      expect(result.providerSlug).toBe('reelshort');
      expect(result.providerDramaId).toBe('abc123');
    });

    it('handles provider drama IDs with colons', () => {
      const result = parseCanonicalDramaId('netshort:movie:action:123');

      expect(result.providerSlug).toBe('netshort');
      expect(result.providerDramaId).toBe('movie:action:123');
    });

    it('throws on invalid format', () => {
      expect(() => parseCanonicalDramaId('invalid-no-colon')).toThrow();
    });

    it('throws on empty string', () => {
      expect(() => parseCanonicalDramaId('')).toThrow();
    });
  });

  describe('buildCanonicalEpisodeId', () => {
    it('builds canonical episode ID from components', () => {
      const result = buildCanonicalEpisodeId('reelshort', 'drama123', 'ep1');

      expect(result).toBe('reelshort:drama123:ep1');
    });

    it('handles episode IDs with special characters', () => {
      const result = buildCanonicalEpisodeId('reelshort', 'drama123', 'ep-001');

      expect(result).toBe('reelshort:drama123:ep-001');
    });

    it('throws on empty provider slug', () => {
      expect(() => buildCanonicalEpisodeId('', 'drama', 'ep1')).toThrow();
    });

    it('throws on empty provider drama ID', () => {
      expect(() => buildCanonicalEpisodeId('reelshort', '', 'ep1')).toThrow();
    });

    it('throws on empty episode ID', () => {
      expect(() => buildCanonicalEpisodeId('reelshort', 'drama', '')).toThrow();
    });
  });

  describe('parseCanonicalEpisodeId', () => {
    it('parses canonical episode ID into components', () => {
      const result = parseCanonicalEpisodeId('reelshort:drama123:ep1');

      expect(result.providerSlug).toBe('reelshort');
      expect(result.providerDramaId).toBe('drama123');
      expect(result.providerEpisodeId).toBe('ep1');
    });

    it('throws on invalid format', () => {
      expect(() => parseCanonicalEpisodeId('invalid')).toThrow();
    });

    it('throws on drama-only format (missing episode)', () => {
      expect(() => parseCanonicalEpisodeId('reelshort:drama')).toThrow();
    });
  });

  describe('isValidCanonicalDramaId', () => {
    it('returns true for valid drama ID', () => {
      expect(isValidCanonicalDramaId('reelshort:abc123')).toBe(true);
    });

    it('returns false for drama ID without colon', () => {
      expect(isValidCanonicalDramaId('reelshort')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidCanonicalDramaId('')).toBe(false);
    });

    it('returns false for whitespace-only components', () => {
      expect(isValidCanonicalDramaId('  :abc')).toBe(false);
      expect(isValidCanonicalDramaId('reelshort:  ')).toBe(false);
    });
  });

  describe('isValidCanonicalEpisodeId', () => {
    it('returns true for valid episode ID', () => {
      expect(isValidCanonicalEpisodeId('reelshort:drama:ep1')).toBe(true);
    });

    it('returns false for episode ID without enough colons', () => {
      expect(isValidCanonicalEpisodeId('reelshort:drama')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidCanonicalEpisodeId('')).toBe(false);
    });
  });

  describe('validateProviderDramaId', () => {
    it('returns valid result for non-empty ID', () => {
      const result = validateProviderDramaId('abc123');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('abc123');
    });

    it('returns invalid result for empty ID', () => {
      const result = validateProviderDramaId('');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns invalid result for whitespace-only ID', () => {
      const result = validateProviderDramaId('   ');

      expect(result.valid).toBe(false);
    });

    it('trims whitespace from ID', () => {
      const result = validateProviderDramaId('  abc123  ');

      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('abc123');
    });
  });

  describe('deterministic ID generation', () => {
    it('produces same ID for same inputs', () => {
      const id1 = buildCanonicalDramaId('reelshort', 'abc123');
      const id2 = buildCanonicalDramaId('reelshort', 'abc123');

      expect(id1).toBe(id2);
    });

    it('produces different ID for different provider slugs', () => {
      const id1 = buildCanonicalDramaId('reelshort', 'abc123');
      const id2 = buildCanonicalDramaId('goodshort', 'abc123');

      expect(id1).not.toBe(id2);
    });

    it('produces different ID for different drama IDs', () => {
      const id1 = buildCanonicalDramaId('reelshort', 'abc123');
      const id2 = buildCanonicalDramaId('reelshort', 'def456');

      expect(id1).not.toBe(id2);
    });
  });

  describe('round-trip identity', () => {
    it('round-trips drama ID correctly', () => {
      const original = buildCanonicalDramaId('reelshort', 'abc:123');
      const parsed = parseCanonicalDramaId(original);
      const rebuilt = buildCanonicalDramaId(parsed.providerSlug, parsed.providerDramaId);

      expect(rebuilt).toBe(original);
    });

    it('round-trips episode ID correctly', () => {
      const original = buildCanonicalEpisodeId('reelshort', 'drama123', 'ep-001');
      const parsed = parseCanonicalEpisodeId(original);
      const rebuilt = buildCanonicalEpisodeId(
        parsed.providerSlug,
        parsed.providerDramaId,
        parsed.providerEpisodeId
      );

      expect(rebuilt).toBe(original);
    });
  });

  describe('edge cases', () => {
    it('handles numeric provider drama IDs', () => {
      const result = buildCanonicalDramaId('reelshort', '12345');
      expect(result).toBe('reelshort:12345');
    });

    it('handles provider drama IDs with slashes', () => {
      const result = buildCanonicalDramaId('reelshort', 'movie/action/123');
      expect(result).toBe('reelshort:movie/action/123');
    });

    it('handles unicode characters in drama IDs', () => {
      const result = buildCanonicalDramaId('reelshort', '电影-123');
      expect(result).toBe('reelshort:电影-123');
    });
  });
});