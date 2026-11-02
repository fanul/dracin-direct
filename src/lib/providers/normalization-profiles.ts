/**
 * Provider normalization profile registry.
 * 
 * Defines explicit normalization rules for launch-tier providers,
 * ensuring consistent display and playback behavior across heterogeneous APIs.
 */

export type TitleStrategy = 'direct' | 'strip_html' | 'normalize_case' | 'custom';
export type CoverStrategy = 'direct' | 'https_only' | 'validate_url' | 'custom';
export type EpisodeNumberSource = 'sequence' | 'episodeNo' | 'chapter' | 'number' | 'custom';

export interface NormalizationProfile {
  /** Provider slug this profile applies to */
  providerSlug: string;
  
  /** How to extract/clean drama titles */
  titleStrategy: TitleStrategy;
  
  /** How to extract/validate cover URLs */
  coverStrategy: CoverStrategy;
  
  /** Where to get episode numbers from */
  episodeNumberSource: EpisodeNumberSource;
  
  /** Fields to use for title extraction (in priority order) */
  titleFields: string[];
  
  /** Fields to use for cover URL extraction (in priority order) */
  coverFields: string[];
  
  /** Fields to use for episode count extraction */
  episodeCountFields: string[];
  
  /** Fields to use for synopsis extraction */
  synopsisFields: string[];
  
  /** Whether this provider requires special playback handling */
  hasCustomPlayback: boolean;
  
  /** Notes about provider-specific quirks */
  notes?: string;
}

/**
 * Default normalization profile for providers without explicit profiles.
 * Uses best-effort generic extraction.
 */
const DEFAULT_PROFILE: NormalizationProfile = {
  providerSlug: '_default',
  titleStrategy: 'direct',
  coverStrategy: 'direct',
  episodeNumberSource: 'sequence',
  titleFields: ['title', 'name', 'dramaName', 'bookName'],
  coverFields: ['coverUrl', 'cover', 'poster', 'thumbnail', 'imageUrl'],
  episodeCountFields: ['episodeCount', 'totalEpisodes', 'episodes', 'chapterCount'],
  synopsisFields: ['synopsis', 'description', 'intro', 'summary'],
  hasCustomPlayback: false,
  notes: 'Generic fallback profile',
};

/**
 * Explicit normalization profiles for Tier A launch candidates.
 * 
 * These providers have been verified for launch and require
 * specific handling rules to ensure consistent UX.
 */
const PROFILES: Record<string, NormalizationProfile> = {
  reelshort: {
    providerSlug: 'reelshort',
    titleStrategy: 'direct',
    coverStrategy: 'https_only',
    episodeNumberSource: 'sequence',
    titleFields: ['title', 'name'],
    coverFields: ['coverUrl', 'cover', 'poster'],
    episodeCountFields: ['episodeCount', 'totalEpisodes'],
    synopsisFields: ['synopsis', 'description', 'intro'],
    hasCustomPlayback: false,
    notes: 'Stable Tier A provider with consistent API structure',
  },
  
  goodshort: {
    providerSlug: 'goodshort',
    titleStrategy: 'direct',
    coverStrategy: 'https_only',
    episodeNumberSource: 'chapter',
    titleFields: ['title', 'name', 'bookName'],
    coverFields: ['coverUrl', 'cover', 'poster'],
    episodeCountFields: ['episodeCount', 'chapterCount'],
    synopsisFields: ['synopsis', 'description'],
    hasCustomPlayback: true,
    notes: 'Requires custom playback handling for chapter-based episodes',
  },
  
  flextv: {
    providerSlug: 'flextv',
    titleStrategy: 'direct',
    coverStrategy: 'https_only',
    episodeNumberSource: 'sequence',
    titleFields: ['title', 'name'],
    coverFields: ['coverUrl', 'cover', 'poster'],
    episodeCountFields: ['episodeCount', 'totalEpisodes'],
    synopsisFields: ['synopsis', 'description'],
    hasCustomPlayback: true,
    notes: 'Home structure is nested under tabs; requires special home mapping',
  },
  
  shortmax: {
    providerSlug: 'shortmax',
    titleStrategy: 'direct',
    coverStrategy: 'https_only',
    episodeNumberSource: 'episodeNo',
    titleFields: ['title', 'name'],
    coverFields: ['coverUrl', 'cover', 'poster'],
    episodeCountFields: ['episodeCount', 'totalEpisodes'],
    synopsisFields: ['synopsis', 'description'],
    hasCustomPlayback: true,
    notes: 'Uses code-based IDs; episodes embedded in detail response',
  },
  
  netshort: {
    providerSlug: 'netshort',
    titleStrategy: 'direct',
    coverStrategy: 'https_only',
    episodeNumberSource: 'episodeNo',
    titleFields: ['title', 'name', 'nseri'],
    coverFields: ['coverUrl', 'cover', 'pday'],
    episodeCountFields: ['episodeCount', 'eshe', 'upload_num'],
    synopsisFields: ['synopsis', 'description'],
    hasCustomPlayback: true,
    notes: 'Requires subtitle preference handling; nested in data responses',
  },
  
  dramanova: {
    providerSlug: 'dramanova',
    titleStrategy: 'direct',
    coverStrategy: 'https_only',
    episodeNumberSource: 'sequence',
    titleFields: ['title', 'name'],
    coverFields: ['coverUrl', 'cover', 'poster'],
    episodeCountFields: ['episodeCount', 'totalEpisodes'],
    synopsisFields: ['synopsis', 'description'],
    hasCustomPlayback: false,
    notes: 'Requires lang=in query param for Indonesian content',
  },
  
  dramapops: {
    providerSlug: 'dramapops',
    titleStrategy: 'direct',
    coverStrategy: 'https_only',
    episodeNumberSource: 'number',
    titleFields: ['title', 'name'],
    coverFields: ['coverUrl', 'cover', 'poster'],
    episodeCountFields: ['episodeCount', 'totalEpisodes'],
    synopsisFields: ['synopsis', 'description'],
    hasCustomPlayback: true,
    notes: 'Movies array in sections; custom episode mapping',
  },
  
  cashdrama: {
    providerSlug: 'cashdrama',
    titleStrategy: 'direct',
    coverStrategy: 'https_only',
    episodeNumberSource: 'sequence',
    titleFields: ['title', 'name'],
    coverFields: ['coverUrl', 'cover', 'poster'],
    episodeCountFields: ['episodeCount', 'totalEpisodes'],
    synopsisFields: ['synopsis', 'description'],
    hasCustomPlayback: true,
    notes: 'Blocks-based home structure; vid-based IDs',
  },
};

/**
 * Returns the normalization profile for a provider.
 * Falls back to default profile if no explicit profile exists.
 */
export function getNormalizationProfile(providerSlug: string): NormalizationProfile {
  return PROFILES[providerSlug] ?? DEFAULT_PROFILE;
}

/**
 * Returns all provider slugs with explicit normalization profiles.
 */
export function getProfiledProviderSlugs(): string[] {
  return Object.keys(PROFILES);
}

/**
 * Checks if a provider has an explicit normalization profile.
 */
export function hasNormalizationProfile(providerSlug: string): boolean {
  return providerSlug in PROFILES;
}