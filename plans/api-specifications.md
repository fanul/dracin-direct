# API Specifications: Homepage Redesign

## Overview

API endpoints yang dibutuhkan untuk mendukung homepage baru dengan 42 provider.

---

## 1. GET /api/v1/home (Enhanced)

### Description
Mengambil data homepage lengkap dengan sections.

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `provider` | string | - | Filter by provider slug |
| `genre` | string | - | Filter by genre |
| `sections` | string | 'all' | Comma-separated section list |

### Response
```typescript
interface HomeResponse {
  data: {
    featured: FeaturedDrama[];
    continueWatching: ContinueWatchingItem[] | null;
    forYou: DramaCard[];
    trending: DramaCard[];
    newReleases: NewReleaseGroup[];
    providerSections: ProviderSection[];
    genres: Genre[];
  };
  meta: {
    requestId: string;
    timestamp: string;
    cacheStatus: 'hit' | 'miss';
    sectionsFetched: string[];
  };
}

interface FeaturedDrama {
  id: string;
  title: string;
  coverUrl: string;
  provider: string;
  providerSlug: string;
  rating: number;
  episodeCount: number;
  synopsis: string;
  tags: string[];
  isNew: boolean;
}

interface ContinueWatchingItem {
  dramaId: string;
  dramaTitle: string;
  coverUrl: string;
  provider: string;
  episodeNumber: number;
  episodeTitle?: string;
  progressPercent: number;
  lastWatchedAt: string;
  remainingSeconds: number;
}

interface DramaCard {
  id: string;
  title: string;
  coverUrl: string;
  provider: string;
  providerSlug: string;
  episodeCount: number;
  rating?: number;
  isNew?: boolean;
  rank?: number;
}

interface NewReleaseGroup {
  period: 'today' | 'yesterday' | 'this_week';
  label: string;
  dramas: DramaCard[];
}

interface ProviderSection {
  provider: {
    slug: string;
    name: string;
    logoUrl?: string;
    contentCount: number;
  };
  dramas: DramaCard[];
  totalCount: number;
}

interface Genre {
  id: string;
  name: string;
  posterUrls: string[];
  dramaCount: number;
  color: string;
}
```

### Example Response
```json
{
  "data": {
    "featured": [
      {
        "id": "drama-001",
        "title": "The Billionaire's Hidden Heir",
        "coverUrl": "https://...",
        "provider": "DramaBox",
        "providerSlug": "dramabox",
        "rating": 4.8,
        "episodeCount": 88,
        "synopsis": "Setelah 10 tahun...",
        "tags": ["Romance", "Billionaire"],
        "isNew": true
      }
    ],
    "continueWatching": [
      {
        "dramaId": "drama-123",
        "dramaTitle": "CEO's Reborn Wife",
        "coverUrl": "https://...",
        "provider": "ShortMax",
        "episodeNumber": 5,
        "episodeTitle": "The Confrontation",
        "progressPercent": 65,
        "lastWatchedAt": "2026-02-24T10:30:00Z",
        "remainingSeconds": 420
      }
    ],
    "forYou": [...],
    "trending": [
      { "id": "drama-001", "rank": 1, ... },
      { "id": "drama-002", "rank": 2, ... },
      { "id": "drama-003", "rank": 3, ... }
    ],
    "newReleases": [
      {
        "period": "today",
        "label": "Hari Ini",
        "dramas": [...]
      },
      {
        "period": "yesterday", 
        "label": "Kemarin",
        "dramas": [...]
      }
    ],
    "providerSections": [
      {
        "provider": {
          "slug": "dramabox",
          "name": "DramaBox",
          "contentCount": 1250
        },
        "dramas": [...],
        "totalCount": 1250
      }
    ],
    "genres": [
      {
        "id": "romance",
        "name": "Romance",
        "posterUrls": ["...", "...", "..."],
        "dramaCount": 3420,
        "color": "#f472b6"
      }
    ]
  },
  "meta": {
    "requestId": "req-abc123",
    "timestamp": "2026-02-24T16:30:00Z",
    "cacheStatus": "hit",
    "sectionsFetched": ["featured", "trending", "newReleases"]
  }
}
```

---

## 2. GET /api/v1/providers

### Description
Mengambil list semua provider dengan metadata.

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | 'active' | Filter: active, maintenance, all |
| `sort` | string | 'popularity' | Sort: popularity, name, content_count |
| `limit` | number | 50 | Max providers to return |

### Response
```typescript
interface ProvidersResponse {
  data: {
    providers: Provider[];
    total: number;
    active: number;
    maintenance: number;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

interface Provider {
  slug: string;
  name: string;
  status: 'active' | 'maintenance' | 'inactive';
  vip: 'VIP1' | 'VIP2' | 'VIP3';
  logoUrl?: string;
  contentCount: number;
  lastSyncAt: string;
  popularityScore: number;
  topGenres: string[];
}
```

---

## 3. GET /api/v1/home/continue

### Description
Mengambil continue watching untuk user yang login.

### Auth
Required: Bearer token

### Response
```typescript
interface ContinueResponse {
  data: {
    items: ContinueWatchingItem[];
    total: number;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

---

## 4. GET /api/v1/home/for-you

### Description
Mengambil rekomendasi personalized.

### Auth
Required: Bearer token (optional, untuk hasil lebih baik)

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Jumlah rekomendasi |
| `refresh` | boolean | false | Force refresh recommendations |

### Response
```typescript
interface ForYouResponse {
  data: {
    dramas: DramaCard[];
    basedOn: {
      recentlyWatched: string[];
      preferredGenres: string[];
      preferredProviders: string[];
    };
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

---

## 5. GET /api/v1/home/trending

### Description
Mengambil trending dramas.

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeframe` | string | '24h' | 24h, 7d, 30d, all_time |
| `provider` | string | - | Filter by provider |
| `limit` | number | 20 | Jumlah results |

### Response
```typescript
interface TrendingResponse {
  data: {
    dramas: Array<DramaCard & { rank: number; viewCount: number }>;
    timeframe: string;
    updatedAt: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

---

## 6. GET /api/v1/home/new-releases

### Description
Mengambil konten terbaru.

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 7 | Lookback period |
| `provider` | string | - | Filter by provider |
| `groupBy` | string | 'day' | Group: hour, day, week |

### Response
```typescript
interface NewReleasesResponse {
  data: {
    groups: NewReleaseGroup[];
    total: number;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

---

## 7. GET /api/v1/home/by-provider/:slug

### Description
Mengambil konten dari provider tertentu.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | Provider slug |

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `sort` | string | 'popularity' | Sort: popularity, newest, rating |

### Response
```typescript
interface ProviderContentResponse {
  data: {
    provider: Provider;
    dramas: DramaCard[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

---

## 8. GET /api/v1/genres

### Description
Mengambil list genre dengan stats.

### Response
```typescript
interface GenresResponse {
  data: {
    genres: Genre[];
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

---

## Database Queries

### Featured Dramas
```sql
SELECT d.*, p.name as provider_name, p.slug as provider_slug
FROM dramas d
JOIN providers p ON d.provider_slug = p.slug
WHERE p.status = 'active'
AND d.popularity_score > 80
ORDER BY d.popularity_score DESC, d.created_at DESC
LIMIT 5;
```

### Continue Watching
```sql
SELECT 
  wh.drama_id,
  d.title as drama_title,
  d.cover_url,
  p.name as provider,
  wh.episode_number,
  wh.progress_percent,
  wh.updated_at as last_watched_at,
  e.duration_ms * (100 - wh.progress_percent) / 100 as remaining_seconds
FROM watch_history wh
JOIN dramas d ON wh.drama_id = d.id
JOIN providers p ON d.provider_slug = p.slug
LEFT JOIN episodes e ON e.drama_id = d.id AND e.episode_no = wh.episode_number
WHERE wh.user_id = $1
AND wh.progress_percent < 95
ORDER BY wh.updated_at DESC
LIMIT 10;
```

### Trending
```sql
SELECT d.*, p.name as provider_name, p.slug as provider_slug,
       ROW_NUMBER() OVER (ORDER BY d.popularity_score DESC) as rank
FROM dramas d
JOIN providers p ON d.provider_slug = p.slug
WHERE p.status = 'active'
ORDER BY d.popularity_score DESC
LIMIT 20;
```

### New Releases (grouped)
```sql
WITH new_dramas AS (
  SELECT d.*, p.name as provider_name, p.slug as provider_slug,
         CASE 
           WHEN d.created_at > NOW() - INTERVAL '1 day' THEN 'today'
           WHEN d.created_at > NOW() - INTERVAL '2 days' THEN 'yesterday'
           ELSE 'this_week'
         END as period
  FROM dramas d
  JOIN providers p ON d.provider_slug = p.slug
  WHERE d.created_at > NOW() - INTERVAL '7 days'
  AND p.status = 'active'
)
SELECT * FROM new_dramas
ORDER BY 
  CASE period
    WHEN 'today' THEN 1
    WHEN 'yesterday' THEN 2
    ELSE 3
  END,
  created_at DESC;
```

### Provider Sections
```sql
-- Get top providers by content count
SELECT p.slug, p.name, COUNT(d.id) as content_count
FROM providers p
LEFT JOIN dramas d ON d.provider_slug = p.slug
WHERE p.status = 'active'
GROUP BY p.slug, p.name
ORDER BY content_count DESC
LIMIT 6;

-- Get dramas for each provider
SELECT d.*, p.name as provider_name
FROM dramas d
JOIN providers p ON d.provider_slug = p.slug
WHERE d.provider_slug = $1
ORDER BY d.popularity_score DESC
LIMIT 10;
```

---

## Caching Strategy

### Redis Keys
```
home:featured           -> TTL: 5 minutes
home:trending           -> TTL: 10 minutes
home:new-releases       -> TTL: 15 minutes
home:for-you:{userId}   -> TTL: 30 minutes
home:continue:{userId}  -> TTL: 5 minutes
providers:list          -> TTL: 1 hour
providers:{slug}:content -> TTL: 10 minutes
genres:list             -> TTL: 1 hour
```

### Cache Invalidation
- On drama sync: invalidate featured, trending, new-releases
- On provider status change: invalidate providers:list
- On user watch: invalidate continue:{userId}, for-you:{userId}

---

## Error Handling

### Common Error Codes
| Code | Status | Description |
|------|--------|-------------|
| `PROVIDER_OFFLINE` | 503 | Provider dalam maintenance |
| `RATE_LIMITED` | 429 | Too many requests |
| `CACHE_MISS` | 200 | Data fetched from DB (slower) |
| `PARTIAL_DATA` | 200 | Some sections unavailable |

### Partial Response Example
```json
{
  "data": {
    "featured": [...],
    "continueWatching": null,
    "forYou": [...],
    "trending": [...]
  },
  "meta": {
    "requestId": "req-abc123",
    "timestamp": "2026-02-24T16:30:00Z",
    "errors": [
      {
        "section": "continueWatching",
        "code": "AUTH_REQUIRED",
        "message": "Login required for continue watching"
      }
    ]
  }
}
```
