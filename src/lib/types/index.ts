export interface ApiResponse<T> {
  data: T | null;
  meta?: {
    requestId: string;
    timestamp: string;
    cache?: 'hit' | 'miss';
    ttl?: number;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  error: ApiError | null;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN_SUBSCRIPTION'
  | 'PROVIDER_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface DramaCard {
  id: string;
  providerSlug: string;
  providerDramaId: string;
  title: string;
  coverUrl: string;
  episodeCount: number;
  rating?: number;
  tags: string[];
  isPremium: boolean;
  providerName: string;
  vipLevel: string;
}

export interface DramaDetail extends DramaCard {
  synopsis: string;
  genres: string[];
  language: string;
  lastUpdated: string;
  popularityScore?: number;
}

export interface EpisodeItem {
  episodeId: string;
  providerEpisodeId?: string;
  episodeNo: number;
  chapterId?: string;
  slug?: string;
  title: string;
  durationMs: number;
  isLocked: boolean;
  thumbnailUrl?: string;
}

export interface SubtitleTrack {
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
}

export interface PlaybackResponse {
  streamUrl: string;
  mimeType?: string;
  headers?: Record<string, string>;
  expiresAt: string;
  nextEpisode?: {
    episodeId: string;
    episodeNo: number;
  };
  subtitles?: SubtitleTrack[];
}

export interface WatchProgress {
  userId: string;
  dramaId: string;
  episodeId: string;
  progressSeconds: number;
  isCompleted: boolean;
  lastWatchedAt: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContinueWatchingItem {
  dramaId: string;
  dramaTitle: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle?: string;
  progressPercent: number;
  progressSeconds: number;
  remainingSeconds: number;
  durationMs: number;
  coverUrl: string;
  provider: string;
  providerSlug: string;
  lastWatchedAt: string;
}

// Phase 2: Drama Detail Enhancement Types
export interface WatchProgressForDrama {
  episodeId: string;
  episodeNo: number;
  episodeTitle?: string;
  progressSeconds: number;
  durationMs: number;
  coverUrl: string;
  lastWatchedAt: string;
}

// Homepage Redesign Types (Phase 1)
export interface FeaturedDrama extends DramaCard {
  synopsis: string;
  isNew: boolean;
}

export interface DramaWithRank extends DramaCard {
  rank?: number;
}

export interface NewReleaseGroup {
  period: 'today' | 'yesterday' | 'this_week';
  label: string;
  dramas: DramaCard[];
}

export interface ProviderSectionData {
  provider: {
    slug: string;
    name: string;
    logoUrl?: string;
    contentCount: number;
  };
  dramas: DramaCard[];
  totalCount: number;
}

export interface GenreData {
  id: string;
  name: string;
  posterUrls: string[];
  dramaCount: number;
  color: string;
}

export interface HomeResponseData {
  featured: FeaturedDrama[];
  continueWatching: ContinueWatchingItem[] | null;
  forYou: DramaCard[];
  trending: DramaWithRank[];
  newReleases: NewReleaseGroup[];
  providerSections: ProviderSectionData[];
  genres: GenreData[];
  providers: ProviderInfo[];
}

export interface HomeSectionQuery {
  section: 'for-you' | 'trending' | 'new-releases';
  page: number;
  limit: number;
}

export interface HomeSectionResponse {
  section: 'for-you' | 'trending' | 'new-releases';
  dramas: (DramaCard | DramaWithRank)[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ProviderInfo {
  slug: string;
  name: string;
  logoUrl?: string;
  contentCount: number;
  isNew?: boolean;
}

export interface ProviderEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  pathParams: string[];
  sampleUrl: string;
}

export interface Provider {
  vip: string;
  provider: string;
  slug: string;
  baseUrl: string;
  endpointCount: number;
  endpoints: ProviderEndpoint[];
  status: 'active' | 'maintenance' | 'disabled';
  capabilities?: ProviderCapabilities;
}

export interface ProviderCapabilities {
  supportsHome: boolean;
  supportsSearch: boolean;
  supportsEpisodeList: boolean;
  supportsPlayback: boolean;
  supportsSubtitle: boolean;
  supportsUnlock: boolean;
  playbackType: 'play' | 'stream' | 'video' | 'unknown';
}

export type ProviderHealthStatus = 'healthy' | 'degraded' | 'unavailable';

export interface ProviderHealthSummary {
  provider: string;
  healthScore: number;
  healthStatus: ProviderHealthStatus;
}

export interface HomeDiagnosticsData {
  providerProbeSummary: {
    providerCount: number;
    probeCount: number;
    ok: number;
    skipped: number;
    failed: number;
    generatedAt?: string;
  } | null;
  homepageAnalysisSummary: {
    providerSectionCount: number;
    nonEmptyProviderSectionCount: number;
    duplicateRatio: number;
    missingCoverRatio: number;
    generatedAt?: string;
    sourceError?: string | null;
  } | null;
}

export type Intent =
  | 'home'
  | 'search'
  | 'detail'
  | 'episodes'
  | 'playback'
  | 'subtitle'
  | 'unlock';

export interface ResolvedEndpoint {
  provider: string;
  intent: Intent;
  endpoint: ProviderEndpoint;
  url: string;
  missingParams: string[];
}
