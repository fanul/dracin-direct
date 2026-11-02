export interface CanonicalDramaId {
  providerSlug: string;
  providerDramaId: string;
}

export interface CanonicalEpisodeId {
  providerSlug: string;
  providerDramaId: string;
  providerEpisodeId: string;
}

export interface ProviderDramaIdValidation {
  valid: boolean;
  normalized?: string;
  error?: string;
}

const COLON_SEPARATOR = ':';

export function buildCanonicalDramaId(
  providerSlug: string,
  providerDramaId: string
): string {
  const normalizedSlug = validateAndNormalizeSlug(providerSlug);
  const normalizedDramaId = validateAndNormalizeDramaId(providerDramaId);

  return `${normalizedSlug}${COLON_SEPARATOR}${normalizedDramaId}`;
}

export function parseCanonicalDramaId(canonicalId: string): CanonicalDramaId {
  if (!canonicalId || typeof canonicalId !== 'string') {
    throw new Error('Invalid canonical drama ID: empty or not a string');
  }

  const colonIndex = canonicalId.indexOf(COLON_SEPARATOR);

  if (colonIndex === -1) {
    throw new Error(`Invalid canonical drama ID format: missing provider separator in "${canonicalId}"`);
  }

  const providerSlug = canonicalId.slice(0, colonIndex);
  const providerDramaId = canonicalId.slice(colonIndex + 1);

  if (!providerSlug || providerSlug.trim() === '') {
    throw new Error('Invalid canonical drama ID: empty provider slug');
  }

  if (!providerDramaId || providerDramaId.trim() === '') {
    throw new Error('Invalid canonical drama ID: empty provider drama ID');
  }

  return {
    providerSlug: providerSlug.toLowerCase(),
    providerDramaId,
  };
}

export function buildCanonicalEpisodeId(
  providerSlug: string,
  providerDramaId: string,
  providerEpisodeId: string
): string {
  const normalizedSlug = validateAndNormalizeSlug(providerSlug);
  const normalizedDramaId = validateAndNormalizeDramaId(providerDramaId);
  const normalizedEpisodeId = validateAndNormalizeEpisodeId(providerEpisodeId);

  return `${normalizedSlug}${COLON_SEPARATOR}${normalizedDramaId}${COLON_SEPARATOR}${normalizedEpisodeId}`;
}

export function parseCanonicalEpisodeId(canonicalId: string): CanonicalEpisodeId {
  if (!canonicalId || typeof canonicalId !== 'string') {
    throw new Error('Invalid canonical episode ID: empty or not a string');
  }

  const parts = canonicalId.split(COLON_SEPARATOR);

  if (parts.length < 3) {
    throw new Error(`Invalid canonical episode ID format: expected "provider:drama:episode" but got "${canonicalId}"`);
  }

  const providerSlug = parts[0];
  const providerEpisodeId = parts[parts.length - 1];
  const providerDramaId = parts.slice(1, -1).join(COLON_SEPARATOR);

  if (!providerSlug || providerSlug.trim() === '') {
    throw new Error('Invalid canonical episode ID: empty provider slug');
  }

  if (!providerDramaId || providerDramaId.trim() === '') {
    throw new Error('Invalid canonical episode ID: empty provider drama ID');
  }

  if (!providerEpisodeId || providerEpisodeId.trim() === '') {
    throw new Error('Invalid canonical episode ID: empty provider episode ID');
  }

  return {
    providerSlug: providerSlug.toLowerCase(),
    providerDramaId,
    providerEpisodeId,
  };
}

export function isValidCanonicalDramaId(canonicalId: string): boolean {
  try {
    if (!canonicalId || typeof canonicalId !== 'string') {
      return false;
    }

    const colonIndex = canonicalId.indexOf(COLON_SEPARATOR);

    if (colonIndex === -1) {
      return false;
    }

    const providerSlug = canonicalId.slice(0, colonIndex);
    const providerDramaId = canonicalId.slice(colonIndex + 1);

    if (!providerSlug || providerSlug.trim() === '') {
      return false;
    }

    if (!providerDramaId || providerDramaId.trim() === '') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function isValidCanonicalEpisodeId(canonicalId: string): boolean {
  try {
    if (!canonicalId || typeof canonicalId !== 'string') {
      return false;
    }

    const parts = canonicalId.split(COLON_SEPARATOR);

    if (parts.length < 3) {
      return false;
    }

    const providerSlug = parts[0];
    const providerEpisodeId = parts[parts.length - 1];
    const providerDramaId = parts.slice(1, -1).join(COLON_SEPARATOR);

    if (!providerSlug || providerSlug.trim() === '') {
      return false;
    }

    if (!providerDramaId || providerDramaId.trim() === '') {
      return false;
    }

    if (!providerEpisodeId || providerEpisodeId.trim() === '') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function validateProviderDramaId(providerDramaId: string): ProviderDramaIdValidation {
  if (!providerDramaId || typeof providerDramaId !== 'string') {
    return {
      valid: false,
      error: 'Provider drama ID is empty or not a string',
    };
  }

  const normalized = providerDramaId.trim();

  if (normalized === '') {
    return {
      valid: false,
      error: 'Provider drama ID is empty after trimming whitespace',
    };
  }

  return {
    valid: true,
    normalized,
  };
}

function validateAndNormalizeSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    throw new Error('Provider slug is required and must be a string');
  }

  const normalized = slug.trim().toLowerCase();

  if (normalized === '') {
    throw new Error('Provider slug cannot be empty');
  }

  return normalized;
}

function validateAndNormalizeDramaId(dramaId: string): string {
  if (!dramaId || typeof dramaId !== 'string') {
    throw new Error('Provider drama ID is required and must be a string');
  }

  const normalized = dramaId.trim();

  if (normalized === '') {
    throw new Error('Provider drama ID cannot be empty');
  }

  return normalized;
}

function validateAndNormalizeEpisodeId(episodeId: string): string {
  if (!episodeId || typeof episodeId !== 'string') {
    throw new Error('Provider episode ID is required and must be a string');
  }

  const normalized = episodeId.trim();

  if (normalized === '') {
    throw new Error('Provider episode ID cannot be empty');
  }

  return normalized;
}