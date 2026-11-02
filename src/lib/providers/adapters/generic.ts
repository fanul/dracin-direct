import type { DramaCard, DramaDetail, EpisodeItem, PlaybackResponse } from '@/lib/types';
import { BaseProviderAdapter, type ProviderAdapter } from './base';

/**
 * Generic provider adapter with best-effort parsing and fallback mechanisms.
 * Handles multiple response patterns from different providers.
 */
export class GenericProviderAdapter extends BaseProviderAdapter implements ProviderAdapter {
  readonly name: string;
  readonly slug: string;
  readonly vipLevel: string;

  constructor(name: string, slug: string, vipLevel: string = 'VIP9') {
    super();
    this.name = name;
    this.slug = slug;
    this.vipLevel = vipLevel;
  }

  /**
   * Extract array from various response patterns
   */
  private extractArray(response: unknown, patterns: string[]): unknown[] {
    const unwrapped = this.unwrapResponse(response);

    // Direct array
    if (Array.isArray(unwrapped)) {
      return unwrapped;
    }

    if (typeof unwrapped !== 'object' || unwrapped === null) {
      return [];
    }

    const obj = unwrapped as Record<string, unknown>;

    // Try pattern paths
    for (const pattern of patterns) {
      const parts = pattern.split('.');
      let current: unknown = obj;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          current = undefined;
          break;
        }
      }

      if (Array.isArray(current)) {
        return current;
      }
    }

    // Try common array fields
    const arrayFields = ['list', 'items', 'data', 'results', 'content', 'dramas', 'books', 'series', 'videos', 'rows', 'payloads', 'sections'];
    for (const field of arrayFields) {
      if (field in obj && Array.isArray(obj[field])) {
        return obj[field] as unknown[];
      }
    }

    // Return object values if it's a single item wrapped
    if (Object.keys(obj).length === 1) {
      const firstValue = Object.values(obj)[0];
      if (Array.isArray(firstValue)) {
        return firstValue;
      }
    }

    return [];
  }

  /**
   * Extract string value from object with fallback
   */
  protected extractString(obj: unknown, fields: string[], fallback: string = ''): string {
    if (typeof obj !== 'object' || obj === null) return fallback;

    for (const field of fields) {
      const value = (obj as Record<string, unknown>)[field];
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
    }

    return fallback;
  }

  /**
   * Extract number value from object with fallback
   */
  private extractNumber(obj: unknown, fields: string[], fallback: number = 0): number {
    if (typeof obj !== 'object' || obj === null) return fallback;

    for (const field of fields) {
      const value = (obj as Record<string, unknown>)[field];
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) return parsed;
      }
    }

    return fallback;
  }

  /**
   * Extract boolean value from object with fallback
   */
  private extractBoolean(obj: unknown, fields: string[], fallback: boolean = false): boolean {
    if (typeof obj !== 'object' || obj === null) return fallback;

    for (const field of fields) {
      const value = (obj as Record<string, unknown>)[field];
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value === 1;
      if (typeof value === 'string') {
        return value === 'true' || value === '1' || value === 'yes';
      }
    }

    return fallback;
  }

  /**
   * Map a single item to DramaCard
   */
  protected mapToDramaCard(item: unknown): DramaCard | null {
    if (!item || typeof item !== 'object') return null;

    const obj = item as Record<string, unknown>;

    // Unwrap nested content object if present
    const rawObj = obj;
    const candidateNested = rawObj.data && typeof rawObj.data === 'object'
      ? rawObj.data as Record<string, unknown>
      : rawObj.item && typeof rawObj.item === 'object'
        ? rawObj.item as Record<string, unknown>
        : rawObj.book && typeof rawObj.book === 'object'
          ? rawObj.book as Record<string, unknown>
          : rawObj.series && typeof rawObj.series === 'object'
            ? rawObj.series as Record<string, unknown>
            : rawObj.video && typeof rawObj.video === 'object'
              ? rawObj.video as Record<string, unknown>
              : rawObj.cell && typeof rawObj.cell === 'object'
                ? rawObj.cell as Record<string, unknown>
                : rawObj;

    const source = candidateNested;

    if (Array.isArray(source.book_data) && source.book_data.length > 0 && typeof source.book_data[0] === 'object') {
      return this.mapToDramaCard(source.book_data[0]);
    }

    if (Array.isArray(source.books) && source.books.length > 0 && typeof source.books[0] === 'object') {
      return this.mapToDramaCard(source.books[0]);
    }

    if (Array.isArray(source.movies) && source.movies.length > 0 && typeof source.movies[0] === 'object') {
      return this.mapToDramaCard(source.movies[0]);
    }

    if (Array.isArray(source.data) && source.data.length > 0 && typeof source.data[0] === 'object') {
      return this.mapToDramaCard(source.data[0]);
    }

    // Extract ID from various field names
    const id = this.extractString(source, [
      'id', 'dramaId', 'bookId', 'seriesId', 'vid', 'code', 'slug', '_id',
      'drama_id', 'book_id', 'programId', 'videoId', 'playlet_id', 'bannerId',
      'book_id', 'shortplay_id', 'shortPlayCode', 'dshame', 'dcup', 'dlit'
    ]);
    if (!id) return null;

    // Extract title
    const title = this.extractString(source, [
      'title', 'name', 'dramaName', 'bookName', 'seriesName', 'drama_name', 'titleName',
      'shortPlayName', 'short_play_name', 'nseri', 'nsin', 'nmeasu'
    ]);

    // Extract cover URL
    const coverUrl = this.extractString(source, [
      'coverUrl', 'cover', 'poster', 'thumbnail', 'imageUrl', 'image',
      'cover_url', 'posterUrl', 'thumb', 'imgUrl', 'img', 'cover_image',
      'drama_cover', // For MeloShort
      'pday', 'ptear', 'pbat', 'coverWap', 'picUrl', 'cover_square', 'horizontalCoverId'
    ]);

    // Extract episode count
    const episodeCount = this.extractNumber(source, [
      'episodeCount', 'totalEpisodes', 'episodes', 'chapterCount', 'totalChapters',
      'episode_count', 'total_episodes', 'chapters', 'episodeNum',
      'upload_num', 'total', 'eshe', 'ewood', 'ewin', 'current_count'
    ]);

    // Extract rating
    const rating = this.extractNumber(source, ['rating', 'score', 'rate', 'avgRating', 'avg_rating']) || undefined;

    // Extract tags/genres
    let tags: string[] = [];
    const tagsValue = source.tags
      || source.genres
      || source.categories
      || source.labels
      || source.tag_name
      || source.bookTags
      || source.category_tag
      || source.mstr
      || source.sstra
      || source.scat
      || source.sgui;

    if (Array.isArray(tagsValue)) {
      tags = tagsValue
        .map((t) => {
          if (typeof t === 'string') return t;
          if (typeof t === 'object' && t !== null) {
            const tagObj = t as Record<string, unknown>;
            return this.extractString(tagObj, ['name', 'tagName', 'title']);
          }
          return String(t);
        })
        .filter(Boolean);
    } else if (typeof tagsValue === 'string') {
      tags = tagsValue.split(',').map(t => t.trim()).filter(Boolean);
    }

    // Check if premium
    const isPremium = this.extractBoolean(source, ['isPremium', 'isVip', 'isPaid', 'premium', 'vip', 'paid']);

    return {
      id: `${this.slug}:${id}`,
      providerSlug: this.slug,
      providerDramaId: id,
      title: title || 'Untitled',
      coverUrl: coverUrl || '',
      episodeCount,
      rating,
      tags,
      isPremium,
      providerName: this.name,
      vipLevel: this.vipLevel,
    };
  }

  mapHome(response: unknown): DramaCard[] {
    const patterns = [
      'data.list', 'data.items', 'data.dramas', 'data.books', 'data.series',
      'data.data', 'data.rows', 'data.payloads',
      'dataResult.data', 'dataResult.popularTvs',
      'dgiv.lint', 'rows', 'payloads', 'sections',
      'list', 'items', 'dramas', 'books', 'series', 'results'
    ];

    const items = this.extractArray(response, patterns);
    return items.map(item => this.mapToDramaCard(item)).filter(Boolean) as DramaCard[];
  }

  mapSearch(response: unknown): DramaCard[] {
    // Search often has similar structure to home
    return this.mapHome(response);
  }

  mapDramaDetail(response: unknown): DramaDetail {
    const unwrapped = this.unwrapResponse(response);

    if (!unwrapped || typeof unwrapped !== 'object') {
      throw new Error('Invalid drama detail response');
    }

    const obj = unwrapped as Record<string, unknown>;

    // Try to get base drama card first
    const baseCard = this.mapToDramaCard(unwrapped);

    if (!baseCard) {
      // Try nested data structure
      const data = obj.data || obj.drama || obj.book || obj.series || obj.detail;
      if (data && typeof data === 'object') {
        const nestedCard = this.mapToDramaCard(data);
        if (nestedCard) {
          return this.enrichToDetail(nestedCard, data as Record<string, unknown>);
        }
      }
      throw new Error('Could not parse drama detail');
    }

    return this.enrichToDetail(baseCard, obj);
  }

  private enrichToDetail(card: DramaCard, obj: Record<string, unknown>): DramaDetail {
    // Extract synopsis/description
    const synopsis = this.extractString(obj, [
      'synopsis', 'description', 'summary', 'plot', 'overview', 'intro', 'introduction'
    ]);

    // Extract genres
    let genres: string[] = [];
    const genresValue = obj.genres || obj.genre || obj.categories || obj.tags;
    if (Array.isArray(genresValue)) {
      genres = genresValue.map(g => typeof g === 'string' ? g : (g as Record<string, string>)?.name || String(g));
    } else if (typeof genresValue === 'string') {
      genres = genresValue.split(',').map(g => g.trim()).filter(Boolean);
    }

    // Extract language
    const language = this.extractString(obj, ['language', 'lang', 'locale', 'region']);

    // Extract last updated
    const lastUpdated = this.extractString(obj, ['lastUpdated', 'updatedAt', 'updateTime', 'last_updated', 'updated_at']);

    // Extract popularity score
    const popularityScore = this.extractNumber(obj, [
      'popularityScore', 'popularity', 'views', 'viewCount', 'playCount', 'plays'
    ]) || undefined;

    return {
      ...card,
      synopsis,
      genres,
      language,
      lastUpdated: lastUpdated || new Date().toISOString(),
      popularityScore,
    };
  }

  mapEpisodes(response: unknown): EpisodeItem[] {
    const patterns = [
      'data.episodes', 'data.chapters', 'data.list', 'data.items',
      'episodes', 'chapters', 'list', 'items', 'data', 'episode_list'
    ];

    const items = this.extractArray(response, patterns);

    return items.map((item, index): EpisodeItem | null => {
      if (!item || typeof item !== 'object') return null;

      const obj = item as Record<string, unknown>;

      // Extract episode ID
      const episodeId = this.extractString(obj, [
        'episodeId', 'id', 'chapterId', 'epId', '_id', 'episode_id', 'chapter_id'
      ]);

      // Extract episode number (use index as fallback)
      let episodeNo = this.extractNumber(obj, [
        'episodeNo', 'episodeNumber', 'number', 'epNo', 'ep', 'chapterNo', 'chapterNumber',
        'episode_no', 'episode_number', 'seq', 'sequence',
        'chapter_num', // FlickReels
        'serial_number' // ReelShort
      ]);
      if (!episodeNo) episodeNo = index + 1;

      // Extract title
      const title = this.extractString(obj, [
        'title', 'name', 'episodeTitle', 'chapterTitle', 'episode_title', 'chapter_title',
        'chapterName', // GoodShort
        'chapter_title' // FlickReels
      ]);

      // Extract duration (some providers return seconds, some return ms)
      let duration = this.extractNumber(obj, [
        'durationMs', 'duration', 'length', 'playTime', 'play_time', 'time'
      ]);
      
      // Convert to ms if duration is too small (assuming seconds)
      const durationMs = duration > 0 && duration < 1000 ? duration * 1000 : duration;

      // Check if locked
      const isLocked = this.extractBoolean(obj, [
        'isLocked', 'locked', 'isPremium', 'needUnlock', 'isPaid', 'locked'
      ]);

      // Extract thumbnail
      const thumbnailUrl = this.extractString(obj, [
        'thumbnailUrl', 'thumbnail', 'cover', 'image', 'thumb', 'thumbnail_url'
      ]);

      // Extract chapter ID if present
      const chapterId = this.extractString(obj, ['chapterId', 'chapter_id', 'chapter']);

      // Extract slug if present
      const slug = this.extractString(obj, ['slug', 'urlSlug', 'url_slug']);

      const normalizedEpisodeId = episodeId || `${episodeNo}`;

      return {
        episodeId: `${this.slug}:${normalizedEpisodeId}`,
        providerEpisodeId: normalizedEpisodeId || undefined,
        episodeNo,
        chapterId: chapterId || undefined,
        slug: slug || undefined,
        title: title || `Episode ${episodeNo}`,
        durationMs,
        isLocked,
        thumbnailUrl: thumbnailUrl || undefined,
      };
    }).filter(Boolean) as EpisodeItem[];
  }

  mapPlayback(response: unknown): PlaybackResponse {
    const unwrapped = this.unwrapResponse(response);

    if (!unwrapped || typeof unwrapped !== 'object') {
      throw new Error('Invalid playback response');
    }

    const obj = unwrapped as Record<string, unknown>;

    // Extract stream URL from various patterns
    let streamUrl = this.extractString(obj, [
      'streamUrl', 'url', 'playUrl', 'videoUrl', 'video', 'src', 'm3u8', 'mp4',
      'stream_url', 'play_url', 'video_url', 'videoSrc', 'video_src'
    ]);

    // Try nested video object
    if (!streamUrl) {
      const video = obj.video || obj.stream || obj.playback;
      if (video && typeof video === 'object') {
        streamUrl = this.extractString(video, [
          'url', 'src', 'streamUrl', 'playUrl', 'm3u8', 'mp4'
        ]);
      }
    }

    if (!streamUrl) {
      throw new Error('No stream URL found in playback response');
    }

    // Extract MIME type
    const mimeType = this.extractString(obj, [
      'mimeType', 'mime', 'contentType', 'type', 'format'
    ]) || undefined;

    // Extract headers
    let headers: Record<string, string> | undefined;
    const headersValue = obj.headers || obj.requestHeaders;
    if (headersValue && typeof headersValue === 'object') {
      headers = headersValue as Record<string, string>;
    }

    // Extract expiration
    let expiresAt = this.extractString(obj, [
      'expiresAt', 'expireAt', 'expireTime', 'expiration', 'expired_at', 'expire_at'
    ]);
    if (!expiresAt) {
      // Default to 1 hour from now
      expiresAt = new Date(Date.now() + 3600000).toISOString();
    }

    // Extract next episode info
    let nextEpisode: { episodeId: string; episodeNo: number } | undefined;
    const nextValue = obj.nextEpisode || obj.next;
    if (nextValue && typeof nextValue === 'object') {
      const nextId = this.extractString(nextValue as Record<string, unknown>, ['id', 'episodeId', '_id']);
      const nextNo = this.extractNumber(nextValue as Record<string, unknown>, ['episodeNo', 'number', 'epNo']);
      if (nextId && nextNo) {
        nextEpisode = { episodeId: nextId, episodeNo: nextNo };
      }
    }

    // Extract subtitles
    const subtitles = this.extractSubtitles(obj);

    return {
      streamUrl,
      mimeType,
      headers,
      expiresAt,
      nextEpisode,
      subtitles,
    };
  }

  /**
   * Extract subtitle tracks from response
   */
  protected extractSubtitles(obj: Record<string, unknown>): Array<{ src: string; srclang: string; label: string; default?: boolean }> | undefined {
    // Check for subtitle/caption fields in various formats
    const subtitleValue = obj.subtitles || obj.subtitle || obj.captions || obj.caption || obj.tracks;
    
    if (Array.isArray(subtitleValue)) {
      return subtitleValue.map((sub: unknown) => {
        if (typeof sub !== 'object' || sub === null) return null;
        const subObj = sub as Record<string, unknown>;
        return {
          src: this.extractString(subObj, ['src', 'url', 'file', 'vtt', 'srt']),
          srclang: this.extractString(subObj, ['srclang', 'lang', 'language', 'locale', 'code']) || 'id',
          label: this.extractString(subObj, ['label', 'name', 'title', 'lang', 'language']) || 'Indonesia',
          default: subObj.default === true || subObj.default === 'true',
        };
      }).filter((sub): sub is NonNullable<typeof sub> => sub !== null && sub.src !== '');
    }

    // Single subtitle URL as string
    if (typeof subtitleValue === 'string' && subtitleValue.length > 0) {
      return [{
        src: subtitleValue,
        srclang: 'id',
        label: 'Indonesia',
        default: true,
      }];
    }

    // Check for subtitleUrl or subtitle_url field
    const subtitleUrl = this.extractString(obj, ['subtitleUrl', 'subtitle_url', 'captionUrl', 'caption_url', 'vttUrl', 'srtUrl']);
    if (subtitleUrl) {
      return [{
        src: subtitleUrl,
        srclang: 'id',
        label: 'Indonesia',
        default: true,
      }];
    }

    return undefined;
  }
}
