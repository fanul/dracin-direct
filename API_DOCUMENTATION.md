# Captain Drama API - Developer Reference

Dokumen ini siap dipakai sebagai acuan implementasi platform (gateway, backend integration, dan SDK internal).

## 1) Auth & Base

- Host utama: `https://captain.sapimu.au`
- Semua request wajib header: `Authorization: Bearer <TOKEN>`
- Format provider: `https://captain.sapimu.au/{provider-slug}`

```bash
curl -X GET "https://captain.sapimu.au/reelshort/api/v1/foryou" \
  -H "Authorization: Bearer <TOKEN>"
```

## 2) File Mesin (untuk integrasi cepat)

- Endpoint katalog JSON: `api-endpoints.json`
- Struktur berisi: `vip`, `provider`, `baseUrl`, `endpoints[]`, `pathParams[]`, `sampleUrl`

## 3) Cakupan

- Total provider: 42
- Provider aktif: 41
- Maintenance: 1
- Last verified by Playwright scrape: 2026-02-24

## VIP1

### HiShort
- Base URL: `https://captain.sapimu.au/hishort`
- Status: `active`
- Endpoint count: 4

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/home` | `-` | `https://captain.sapimu.au/hishort/api/v1/home` |
| GET | `/api/v1/search/:q` | `q` | `https://captain.sapimu.au/hishort/api/v1/search/{Q}` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/hishort/api/v1/drama/{ID}` |
| GET | `/api/v1/episode/:slug` | `slug` | `https://captain.sapimu.au/hishort/api/v1/episode/{SLUG}` |

```bash
curl -X GET "https://captain.sapimu.au/hishort/api/v1/home" \
  -H "Authorization: Bearer <TOKEN>"
```

### MicroDrama
- Base URL: `https://captain.sapimu.au/microdrama`
- Status: `active`
- Endpoint count: 4

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/microdrama/api/v1/languages` |
| GET | `/api/v1/dramas` | `-` | `https://captain.sapimu.au/microdrama/api/v1/dramas` |
| GET | `/api/v1/dramas/search` | `-` | `https://captain.sapimu.au/microdrama/api/v1/dramas/search` |
| GET | `/api/v1/dramas/:id` | `id` | `https://captain.sapimu.au/microdrama/api/v1/dramas/{ID}` |

```bash
curl -X GET "https://captain.sapimu.au/microdrama/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### MeloShort
- Base URL: `https://captain.sapimu.au/meloshort`
- Status: `active`
- Endpoint count: 6

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/dramas` | `-` | `https://captain.sapimu.au/meloshort/api/v1/dramas` |
| GET | `/api/v1/dramas/discover` | `-` | `https://captain.sapimu.au/meloshort/api/v1/dramas/discover` |
| GET | `/api/v1/dramas/top` | `-` | `https://captain.sapimu.au/meloshort/api/v1/dramas/top` |
| GET | `/api/v1/dramas/search` | `-` | `https://captain.sapimu.au/meloshort/api/v1/dramas/search` |
| GET | `/api/v1/dramas/:id/episodes` | `id` | `https://captain.sapimu.au/meloshort/api/v1/dramas/{ID}/episodes` |
| GET | `/api/v1/dramas/:id/episodes/:chapter` | `id, chapter` | `https://captain.sapimu.au/meloshort/api/v1/dramas/{ID}/episodes/{CHAPTER}` |

```bash
curl -X GET "https://captain.sapimu.au/meloshort/api/v1/dramas" \
  -H "Authorization: Bearer <TOKEN>"
```

### StardustTV
- Base URL: `https://captain.sapimu.au/stardusttv`
- Status: `active`
- Endpoint count: 5

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/stardusttv/api/v1/languages` |
| GET | `/api/v1/homepage` | `-` | `https://captain.sapimu.au/stardusttv/api/v1/homepage` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/stardusttv/api/v1/search` |
| GET | `/api/v1/video/:slug/:id` | `slug, id` | `https://captain.sapimu.au/stardusttv/api/v1/video/{SLUG}/{ID}` |
| GET | `/api/v1/video/:slug/:id/episode/:episode` | `slug, id, episode` | `https://captain.sapimu.au/stardusttv/api/v1/video/{SLUG}/{ID}/episode/{EPISODE}` |

```bash
curl -X GET "https://captain.sapimu.au/stardusttv/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### SnackShort
- Base URL: `https://captain.sapimu.au/snackshort`
- Status: `active`
- Endpoint count: 7

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/home` | `-` | `https://captain.sapimu.au/snackshort/api/v1/home` |
| GET | `/api/v1/tabs` | `-` | `https://captain.sapimu.au/snackshort/api/v1/tabs` |
| GET | `/api/v1/browsing` | `-` | `https://captain.sapimu.au/snackshort/api/v1/browsing` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/snackshort/api/v1/search` |
| GET | `/api/v1/book/:bookId` | `bookId` | `https://captain.sapimu.au/snackshort/api/v1/book/{BOOKID}` |
| GET | `/api/v1/book/:bookId/chapters` | `bookId` | `https://captain.sapimu.au/snackshort/api/v1/book/{BOOKID}/chapters` |
| GET | `/api/v1/book/:bookId/episode/:chapterId` | `bookId, chapterId` | `https://captain.sapimu.au/snackshort/api/v1/book/{BOOKID}/episode/{CHAPTERID}` |

```bash
curl -X GET "https://captain.sapimu.au/snackshort/api/v1/home" \
  -H "Authorization: Bearer <TOKEN>"
```

### Velolo
- Base URL: `https://captain.sapimu.au/velolo`
- Status: `active`
- Endpoint count: 7

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/languages` | `-` | `https://captain.sapimu.au/velolo/languages` |
| GET | `/hot` | `-` | `https://captain.sapimu.au/velolo/hot` |
| GET | `/new` | `-` | `https://captain.sapimu.au/velolo/new` |
| GET | `/labels` | `-` | `https://captain.sapimu.au/velolo/labels` |
| GET | `/dramas` | `-` | `https://captain.sapimu.au/velolo/dramas` |
| GET | `/detail/:id` | `id` | `https://captain.sapimu.au/velolo/detail/{ID}` |
| GET | `/stream` | `-` | `https://captain.sapimu.au/velolo/stream` |

```bash
curl -X GET "https://captain.sapimu.au/velolo/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

## VIP2

### FreeReels
- Base URL: `https://captain.sapimu.au/freereels`
- Status: `active`
- Endpoint count: 13

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/foryou` | `-` | `https://captain.sapimu.au/freereels/api/v1/foryou` |
| GET | `/api/v1/popular` | `-` | `https://captain.sapimu.au/freereels/api/v1/popular` |
| GET | `/api/v1/new` | `-` | `https://captain.sapimu.au/freereels/api/v1/new` |
| GET | `/api/v1/female` | `-` | `https://captain.sapimu.au/freereels/api/v1/female` |
| GET | `/api/v1/male` | `-` | `https://captain.sapimu.au/freereels/api/v1/male` |
| GET | `/api/v1/anime` | `-` | `https://captain.sapimu.au/freereels/api/v1/anime` |
| GET | `/api/v1/dubbing` | `-` | `https://captain.sapimu.au/freereels/api/v1/dubbing` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/freereels/api/v1/search` |
| GET | `/api/v1/search/suggest` | `-` | `https://captain.sapimu.au/freereels/api/v1/search/suggest` |
| GET | `/api/v1/dramas/:id` | `id` | `https://captain.sapimu.au/freereels/api/v1/dramas/{ID}` |
| GET | `/api/v1/dramas/:id/episodes` | `id` | `https://captain.sapimu.au/freereels/api/v1/dramas/{ID}/episodes` |
| GET | `/api/v1/dramas/:id/play/:ep` | `id, ep` | `https://captain.sapimu.au/freereels/api/v1/dramas/{ID}/play/{EP}` |
| GET | `/api/v1/coming-soon` | `-` | `https://captain.sapimu.au/freereels/api/v1/coming-soon` |

```bash
curl -X GET "https://captain.sapimu.au/freereels/api/v1/foryou" \
  -H "Authorization: Bearer <TOKEN>"
```

### FlickReels
- Base URL: `https://captain.sapimu.au/flickreels`
- Status: `active`
- Endpoint count: 8

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/flickreels/api/v1/search` |
| GET | `/api/v1/hot-rank` | `-` | `https://captain.sapimu.au/flickreels/api/v1/hot-rank` |
| GET | `/api/v1/for-you` | `-` | `https://captain.sapimu.au/flickreels/api/v1/for-you` |
| GET | `/api/v1/navigation` | `-` | `https://captain.sapimu.au/flickreels/api/v1/navigation` |
| GET | `/api/v1/category/:navId` | `navId` | `https://captain.sapimu.au/flickreels/api/v1/category/{NAVID}` |
| GET | `/api/v1/play/:playletId` | `playletId` | `https://captain.sapimu.au/flickreels/api/v1/play/{PLAYLETID}` |
| GET | `/api/v1/chapters/:playletId` | `playletId` | `https://captain.sapimu.au/flickreels/api/v1/chapters/{PLAYLETID}` |
| GET | `/api/v1/stream/:playletId/:chapterNum` | `playletId, chapterNum` | `https://captain.sapimu.au/flickreels/api/v1/stream/{PLAYLETID}/{CHAPTERNUM}` |

```bash
curl -X GET "https://captain.sapimu.au/flickreels/api/v1/search" \
  -H "Authorization: Bearer <TOKEN>"
```

### DotDrama
- Base URL: `https://captain.sapimu.au/dotdrama`
- Status: `active`
- Endpoint count: 4

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/dramas` | `-` | `https://captain.sapimu.au/dotdrama/api/v1/dramas` |
| GET | `/api/v1/collections` | `-` | `https://captain.sapimu.au/dotdrama/api/v1/collections` |
| GET | `/api/v1/categories` | `-` | `https://captain.sapimu.au/dotdrama/api/v1/categories` |
| GET | `/api/v1/dramas/:id` | `id` | `https://captain.sapimu.au/dotdrama/api/v1/dramas/{ID}` |

```bash
curl -X GET "https://captain.sapimu.au/dotdrama/api/v1/dramas" \
  -H "Authorization: Bearer <TOKEN>"
```

## VIP3

### StarShort
- Base URL: `https://captain.sapimu.au/starshort`
- Status: `active`
- Endpoint count: 7

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/starshort/api/v1/languages` |
| GET | `/api/v1/dramas` | `-` | `https://captain.sapimu.au/starshort/api/v1/dramas` |
| GET | `/api/v1/dramas/new` | `-` | `https://captain.sapimu.au/starshort/api/v1/dramas/new` |
| GET | `/api/v1/dramas/search` | `-` | `https://captain.sapimu.au/starshort/api/v1/dramas/search` |
| GET | `/api/v1/dramas/:dramaId` | `dramaId` | `https://captain.sapimu.au/starshort/api/v1/dramas/{DRAMAID}` |
| GET | `/api/v1/dramas/:dramaId/episodes` | `dramaId` | `https://captain.sapimu.au/starshort/api/v1/dramas/{DRAMAID}/episodes` |
| GET | `/api/v1/dramas/:dramaId/episodes/:epNum` | `dramaId, epNum` | `https://captain.sapimu.au/starshort/api/v1/dramas/{DRAMAID}/episodes/{EPNUM}` |

```bash
curl -X GET "https://captain.sapimu.au/starshort/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### RapidTV
- Base URL: `https://captain.sapimu.au/rapidtv`
- Status: `active`
- Endpoint count: 4

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/dramas` | `-` | `https://captain.sapimu.au/rapidtv/api/v1/dramas` |
| GET | `/api/v1/dramas/:id` | `id` | `https://captain.sapimu.au/rapidtv/api/v1/dramas/{ID}` |
| GET | `/api/v1/dramas/:id/episodes` | `id` | `https://captain.sapimu.au/rapidtv/api/v1/dramas/{ID}/episodes` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/rapidtv/api/v1/search` |

```bash
curl -X GET "https://captain.sapimu.au/rapidtv/api/v1/dramas" \
  -H "Authorization: Bearer <TOKEN>"
```

### MinuteDrama
- Base URL: `https://captain.sapimu.au/minutedrama`
- Status: `active`
- Endpoint count: 3

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/popular` | `-` | `https://captain.sapimu.au/minutedrama/api/v1/popular` |
| GET | `/api/v1/videos/:id` | `id` | `https://captain.sapimu.au/minutedrama/api/v1/videos/{ID}` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/minutedrama/api/v1/search` |

```bash
curl -X GET "https://captain.sapimu.au/minutedrama/api/v1/popular" \
  -H "Authorization: Bearer <TOKEN>"
```

## VIP4

### DramaBox
- Base URL: `https://captain.sapimu.au/dramabox`
- Status: `maintenance`
- Endpoint count: 0

_Provider maintenance, endpoint tidak tersedia di halaman docs._

## VIP5

### CashDrama
- Base URL: `https://captain.sapimu.au/cashdrama`
- Status: `active`
- Endpoint count: 9

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/cashdrama/api/v1/languages` |
| GET | `/api/v1/home` | `-` | `https://captain.sapimu.au/cashdrama/api/v1/home` |
| GET | `/api/v1/blocks` | `-` | `https://captain.sapimu.au/cashdrama/api/v1/blocks` |
| GET | `/api/v1/tags` | `-` | `https://captain.sapimu.au/cashdrama/api/v1/tags` |
| GET | `/api/v1/drama/:vid` | `vid` | `https://captain.sapimu.au/cashdrama/api/v1/drama/{VID}` |
| GET | `/api/v1/drama/:vid/episodes` | `vid` | `https://captain.sapimu.au/cashdrama/api/v1/drama/{VID}/episodes` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/cashdrama/api/v1/search` |
| GET | `/api/v1/tags/search` | `-` | `https://captain.sapimu.au/cashdrama/api/v1/tags/search` |
| GET | `/api/v1/play/:vid/:ep` | `vid, ep` | `https://captain.sapimu.au/cashdrama/api/v1/play/{VID}/{EP}` |

```bash
curl -X GET "https://captain.sapimu.au/cashdrama/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### ShotShort
- Base URL: `https://captain.sapimu.au/shotshort`
- Status: `active`
- Endpoint count: 8

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/languages` | `-` | `https://captain.sapimu.au/shotshort/api/languages` |
| GET | `/api/popular` | `-` | `https://captain.sapimu.au/shotshort/api/popular` |
| GET | `/api/search` | `-` | `https://captain.sapimu.au/shotshort/api/search` |
| GET | `/api/book/:id` | `id` | `https://captain.sapimu.au/shotshort/api/book/{ID}` |
| GET | `/api/book/:id/episodes` | `id` | `https://captain.sapimu.au/shotshort/api/book/{ID}/episodes` |
| GET | `/api/book/:bookId/chapter/:chapterId` | `bookId, chapterId` | `https://captain.sapimu.au/shotshort/api/book/{BOOKID}/chapter/{CHAPTERID}` |
| GET | `/api/category/list` | `-` | `https://captain.sapimu.au/shotshort/api/category/list` |
| GET | `/api/category` | `-` | `https://captain.sapimu.au/shotshort/api/category` |

```bash
curl -X GET "https://captain.sapimu.au/shotshort/api/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### SodaReels
- Base URL: `https://captain.sapimu.au/sodareels`
- Status: `active`
- Endpoint count: 6

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/home` | `-` | `https://captain.sapimu.au/sodareels/api/v1/home` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/sodareels/api/v1/search` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/sodareels/api/v1/drama/{ID}` |
| GET | `/api/v1/info/:id` | `id` | `https://captain.sapimu.au/sodareels/api/v1/info/{ID}` |
| GET | `/api/v1/category` | `-` | `https://captain.sapimu.au/sodareels/api/v1/category` |
| GET | `/api/v1/episodes` | `-` | `https://captain.sapimu.au/sodareels/api/v1/episodes` |

```bash
curl -X GET "https://captain.sapimu.au/sodareels/api/v1/home" \
  -H "Authorization: Bearer <TOKEN>"
```

### RadReels
- Base URL: `https://captain.sapimu.au/radreels`
- Status: `active`
- Endpoint count: 8

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/home` | `-` | `https://captain.sapimu.au/radreels/api/v1/home` |
| GET | `/api/v1/tab/:id` | `id` | `https://captain.sapimu.au/radreels/api/v1/tab/{ID}` |
| GET | `/api/v1/search/:query` | `query` | `https://captain.sapimu.au/radreels/api/v1/search/{QUERY}` |
| GET | `/api/v1/drama/:keyword` | `keyword` | `https://captain.sapimu.au/radreels/api/v1/drama/{KEYWORD}` |
| GET | `/api/v1/episodes/:fakeId` | `fakeId` | `https://captain.sapimu.au/radreels/api/v1/episodes/{FAKEID}` |
| GET | `/api/v1/video/:videoFakeId/:episodicDramaId` | `videoFakeId, episodicDramaId` | `https://captain.sapimu.au/radreels/api/v1/video/{VIDEOFAKEID}/{EPISODICDRAMAID}` |
| GET | `/api/v1/ranking` | `-` | `https://captain.sapimu.au/radreels/api/v1/ranking` |
| GET | `/api/v1/foryou` | `-` | `https://captain.sapimu.au/radreels/api/v1/foryou` |

```bash
curl -X GET "https://captain.sapimu.au/radreels/api/v1/home" \
  -H "Authorization: Bearer <TOKEN>"
```

### DramaNow
- Base URL: `https://captain.sapimu.au/dramanow`
- Status: `active`
- Endpoint count: 4

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/dramanow/api/v1/languages` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/dramanow/api/v1/search` |
| GET | `/api/v1/series` | `-` | `https://captain.sapimu.au/dramanow/api/v1/series` |
| GET | `/api/v1/video` | `-` | `https://captain.sapimu.au/dramanow/api/v1/video` |

```bash
curl -X GET "https://captain.sapimu.au/dramanow/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### Shorten
- Base URL: `https://captain.sapimu.au/shorten`
- Status: `active`
- Endpoint count: 7

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/editors` | `-` | `https://captain.sapimu.au/shorten/api/v1/editors` |
| GET | `/api/v1/exclusive` | `-` | `https://captain.sapimu.au/shorten/api/v1/exclusive` |
| GET | `/api/v1/dubbed` | `-` | `https://captain.sapimu.au/shorten/api/v1/dubbed` |
| GET | `/api/v1/releases` | `-` | `https://captain.sapimu.au/shorten/api/v1/releases` |
| GET | `/api/v1/categories` | `-` | `https://captain.sapimu.au/shorten/api/v1/categories` |
| GET | `/api/v1/explore` | `-` | `https://captain.sapimu.au/shorten/api/v1/explore` |
| GET | `/api/v1/series/:slug` | `slug` | `https://captain.sapimu.au/shorten/api/v1/series/{SLUG}` |

```bash
curl -X GET "https://captain.sapimu.au/shorten/api/v1/editors" \
  -H "Authorization: Bearer <TOKEN>"
```

### ShortSky
- Base URL: `https://captain.sapimu.au/shortsky`
- Status: `active`
- Endpoint count: 6

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/languages` | `-` | `https://captain.sapimu.au/shortsky/api/languages` |
| GET | `/api/home` | `-` | `https://captain.sapimu.au/shortsky/api/home` |
| GET | `/api/recommend` | `-` | `https://captain.sapimu.au/shortsky/api/recommend` |
| GET | `/api/search` | `-` | `https://captain.sapimu.au/shortsky/api/search` |
| GET | `/api/drama/:id` | `id` | `https://captain.sapimu.au/shortsky/api/drama/{ID}` |
| GET | `/api/drama/:id/episode/:ep` | `id, ep` | `https://captain.sapimu.au/shortsky/api/drama/{ID}/episode/{EP}` |

```bash
curl -X GET "https://captain.sapimu.au/shortsky/api/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

## VIP6

### FlickShort
- Base URL: `https://captain.sapimu.au/flickshort`
- Status: `active`
- Endpoint count: 6

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/flickshort/api/v1/languages` |
| GET | `/api/v1/home` | `-` | `https://captain.sapimu.au/flickshort/api/v1/home` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/flickshort/api/v1/search` |
| GET | `/api/v1/recommend` | `-` | `https://captain.sapimu.au/flickshort/api/v1/recommend` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/flickshort/api/v1/drama/{ID}` |
| GET | `/api/v1/drama/:id/episode/:ep` | `id, ep` | `https://captain.sapimu.au/flickshort/api/v1/drama/{ID}/episode/{EP}` |

```bash
curl -X GET "https://captain.sapimu.au/flickshort/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### DramaDash
- Base URL: `https://captain.sapimu.au/dramadash`
- Status: `active`
- Endpoint count: 4

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/tabs/:id` | `id` | `https://captain.sapimu.au/dramadash/api/v1/tabs/{ID}` |
| GET | `/api/v1/search/:query` | `query` | `https://captain.sapimu.au/dramadash/api/v1/search/{QUERY}` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/dramadash/api/v1/drama/{ID}` |
| GET | `/api/v1/episode/:dramaId/:eps` | `dramaId, eps` | `https://captain.sapimu.au/dramadash/api/v1/episode/{DRAMAID}/{EPS}` |

```bash
curl -X GET "https://captain.sapimu.au/dramadash/api/v1/tabs/{ID}" \
  -H "Authorization: Bearer <TOKEN>"
```

### DramaWave
- Base URL: `https://captain.sapimu.au/dramawave`
- Status: `active`
- Endpoint count: 7

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/feed/:tab` | `tab` | `https://captain.sapimu.au/dramawave/api/v1/feed/{TAB}` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/dramawave/api/v1/search` |
| GET | `/api/v1/search/hot` | `-` | `https://captain.sapimu.au/dramawave/api/v1/search/hot` |
| GET | `/api/v1/search/keywords` | `-` | `https://captain.sapimu.au/dramawave/api/v1/search/keywords` |
| GET | `/api/v1/dramas/:id` | `id` | `https://captain.sapimu.au/dramawave/api/v1/dramas/{ID}` |
| GET | `/api/v1/dramas/:id/play/:ep` | `id, ep` | `https://captain.sapimu.au/dramawave/api/v1/dramas/{ID}/play/{EP}` |
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/dramawave/api/v1/languages` |

```bash
curl -X GET "https://captain.sapimu.au/dramawave/api/v1/feed/{TAB}" \
  -H "Authorization: Bearer <TOKEN>"
```

### DramaRush
- Base URL: `https://captain.sapimu.au/dramarush`
- Status: `active`
- Endpoint count: 7

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/config` | `-` | `https://captain.sapimu.au/dramarush/api/v1/config` |
| GET | `/api/v1/ranking` | `-` | `https://captain.sapimu.au/dramarush/api/v1/ranking` |
| GET | `/api/v1/tabs/:id` | `id` | `https://captain.sapimu.au/dramarush/api/v1/tabs/{ID}` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/dramarush/api/v1/drama/{ID}` |
| GET | `/api/v1/search/:q` | `q` | `https://captain.sapimu.au/dramarush/api/v1/search/{Q}` |
| GET | `/api/v1/play/:id` | `id` | `https://captain.sapimu.au/dramarush/api/v1/play/{ID}` |
| GET | `/api/v1/play/:id/:ep` | `id, ep` | `https://captain.sapimu.au/dramarush/api/v1/play/{ID}/{EP}` |

```bash
curl -X GET "https://captain.sapimu.au/dramarush/api/v1/config" \
  -H "Authorization: Bearer <TOKEN>"
```

## VIP7

### Reelife
- Base URL: `https://captain.sapimu.au/reelife`
- Status: `active`
- Endpoint count: 6

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/dramas` | `-` | `https://captain.sapimu.au/reelife/api/v1/dramas` |
| GET | `/api/v1/dramas/:id` | `id` | `https://captain.sapimu.au/reelife/api/v1/dramas/{ID}` |
| GET | `/api/v1/dramas/:id/chapters` | `id` | `https://captain.sapimu.au/reelife/api/v1/dramas/{ID}/chapters` |
| GET | `/api/v1/dramas/:bookId/episodes/:chapterId` | `bookId, chapterId` | `https://captain.sapimu.au/reelife/api/v1/dramas/{BOOKID}/episodes/{CHAPTERID}` |
| GET | `/api/v1/foryou` | `-` | `https://captain.sapimu.au/reelife/api/v1/foryou` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/reelife/api/v1/search` |

```bash
curl -X GET "https://captain.sapimu.au/reelife/api/v1/dramas" \
  -H "Authorization: Bearer <TOKEN>"
```

### Vigloo
- Base URL: `https://captain.sapimu.au/vigloo`
- Status: `active`
- Endpoint count: 11

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/vigloo/api/v1/languages` |
| GET | `/api/v1/tabs` | `-` | `https://captain.sapimu.au/vigloo/api/v1/tabs` |
| GET | `/api/v1/tabs/:id` | `id` | `https://captain.sapimu.au/vigloo/api/v1/tabs/{ID}` |
| GET | `/api/v1/browse` | `-` | `https://captain.sapimu.au/vigloo/api/v1/browse` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/vigloo/api/v1/search` |
| GET | `/api/v1/rank` | `-` | `https://captain.sapimu.au/vigloo/api/v1/rank` |
| GET | `/api/v1/genres` | `-` | `https://captain.sapimu.au/vigloo/api/v1/genres` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/vigloo/api/v1/drama/{ID}` |
| GET | `/api/v1/drama/:programId/season/:seasonId/episodes` | `programId, seasonId` | `https://captain.sapimu.au/vigloo/api/v1/drama/{PROGRAMID}/season/{SEASONID}/episodes` |
| GET | `/api/v1/play` | `-` | `https://captain.sapimu.au/vigloo/api/v1/play` |
| GET | `/api/v1/stream` | `-` | `https://captain.sapimu.au/vigloo/api/v1/stream` |

```bash
curl -X GET "https://captain.sapimu.au/vigloo/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### DreamShort
- Base URL: `https://captain.sapimu.au/dreamshort`
- Status: `active`
- Endpoint count: 5

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/discover/sections` | `-` | `https://captain.sapimu.au/dreamshort/discover/sections` |
| GET | `/search/books` | `-` | `https://captain.sapimu.au/dreamshort/search/books` |
| GET | `/book/getBookDetail` | `-` | `https://captain.sapimu.au/dreamshort/book/getBookDetail` |
| GET | `/bookShelf/chapterList` | `-` | `https://captain.sapimu.au/dreamshort/bookShelf/chapterList` |
| GET | `/book/getChapterDetail` | `-` | `https://captain.sapimu.au/dreamshort/book/getChapterDetail` |

```bash
curl -X GET "https://captain.sapimu.au/dreamshort/discover/sections" \
  -H "Authorization: Bearer <TOKEN>"
```

### ShortBox
- Base URL: `https://captain.sapimu.au/shortbox`
- Status: `active`
- Endpoint count: 9

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/languages` | `-` | `https://captain.sapimu.au/shortbox/api/languages` |
| GET | `/api/categories` | `-` | `https://captain.sapimu.au/shortbox/api/categories` |
| GET | `/api/list` | `-` | `https://captain.sapimu.au/shortbox/api/list` |
| GET | `/api/new-list` | `-` | `https://captain.sapimu.au/shortbox/api/new-list` |
| GET | `/api/hot-search` | `-` | `https://captain.sapimu.au/shortbox/api/hot-search` |
| GET | `/api/search` | `-` | `https://captain.sapimu.au/shortbox/api/search` |
| GET | `/api/detail/:id` | `id` | `https://captain.sapimu.au/shortbox/api/detail/{ID}` |
| GET | `/api/episodes/:id` | `id` | `https://captain.sapimu.au/shortbox/api/episodes/{ID}` |
| GET | `/api/stream/:id/:ep` | `id, ep` | `https://captain.sapimu.au/shortbox/api/stream/{ID}/{EP}` |

```bash
curl -X GET "https://captain.sapimu.au/shortbox/api/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

## VIP8

### MyDrama
- Base URL: `https://captain.sapimu.au/mydrama`
- Status: `active`
- Endpoint count: 7

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/mydrama/api/v1/languages` |
| GET | `/api/v1/tags` | `-` | `https://captain.sapimu.au/mydrama/api/v1/tags` |
| GET | `/api/v1/series` | `-` | `https://captain.sapimu.au/mydrama/api/v1/series` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/mydrama/api/v1/search` |
| GET | `/api/v1/series/:id` | `id` | `https://captain.sapimu.au/mydrama/api/v1/series/{ID}` |
| GET | `/api/v1/series/:id/episodes` | `id` | `https://captain.sapimu.au/mydrama/api/v1/series/{ID}/episodes` |
| GET | `/api/v1/video/:seriesId/:position` | `seriesId, position` | `https://captain.sapimu.au/mydrama/api/v1/video/{SERIESID}/{POSITION}` |

```bash
curl -X GET "https://captain.sapimu.au/mydrama/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### GoodShort
- Base URL: `https://captain.sapimu.au/goodshort`
- Status: `active`
- Endpoint count: 6

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/home` | `-` | `https://captain.sapimu.au/goodshort/api/v1/home` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/goodshort/api/v1/search` |
| GET | `/api/v1/book/:id` | `id` | `https://captain.sapimu.au/goodshort/api/v1/book/{ID}` |
| GET | `/api/v1/chapters/:bookId` | `bookId` | `https://captain.sapimu.au/goodshort/api/v1/chapters/{BOOKID}` |
| GET | `/api/v1/play/:bookId/:chapterId` | `bookId, chapterId` | `https://captain.sapimu.au/goodshort/api/v1/play/{BOOKID}/{CHAPTERID}` |
| GET | `/api/v1/unlock/:bookId` | `bookId` | `https://captain.sapimu.au/goodshort/api/v1/unlock/{BOOKID}` |

```bash
curl -X GET "https://captain.sapimu.au/goodshort/api/v1/home" \
  -H "Authorization: Bearer <TOKEN>"
```

### iDrama
- Base URL: `https://captain.sapimu.au/idrama`
- Status: `active`
- Endpoint count: 9

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/idrama/api/v1/search` |
| GET | `/api/v1/popular` | `-` | `https://captain.sapimu.au/idrama/api/v1/popular` |
| GET | `/api/v1/ranking/trending` | `-` | `https://captain.sapimu.au/idrama/api/v1/ranking/trending` |
| GET | `/api/v1/ranking/hits` | `-` | `https://captain.sapimu.au/idrama/api/v1/ranking/hits` |
| GET | `/api/v1/latest` | `-` | `https://captain.sapimu.au/idrama/api/v1/latest` |
| GET | `/api/v1/genres` | `-` | `https://captain.sapimu.au/idrama/api/v1/genres` |
| GET | `/api/v1/genre/:id` | `id` | `https://captain.sapimu.au/idrama/api/v1/genre/{ID}` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/idrama/api/v1/drama/{ID}` |
| POST | `/api/v1/unlock/:dramaId/:start/:end` | `dramaId, start, end` | `https://captain.sapimu.au/idrama/api/v1/unlock/{DRAMAID}/{START}/{END}` |

```bash
curl -X GET "https://captain.sapimu.au/idrama/api/v1/search" \
  -H "Authorization: Bearer <TOKEN>"
```

### FlexTV
- Base URL: `https://captain.sapimu.au/flextv`
- Status: `active`
- Endpoint count: 7

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/flextv/api/v1/languages` |
| GET | `/api/v1/tabs` | `-` | `https://captain.sapimu.au/flextv/api/v1/tabs` |
| GET | `/api/v1/tabs/:name` | `name` | `https://captain.sapimu.au/flextv/api/v1/tabs/{NAME}` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/flextv/api/v1/search` |
| GET | `/api/v1/series/:id` | `id` | `https://captain.sapimu.au/flextv/api/v1/series/{ID}` |
| GET | `/api/v1/series/:id/episodes` | `id` | `https://captain.sapimu.au/flextv/api/v1/series/{ID}/episodes` |
| GET | `/api/v1/play/:series_id/:section_id` | `series_id, section_id` | `https://captain.sapimu.au/flextv/api/v1/play/{SERIES_ID}/{SECTION_ID}` |

```bash
curl -X GET "https://captain.sapimu.au/flextv/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

## VIP9

### BiliTV
- Base URL: `https://captain.sapimu.au/bilitv`
- Status: `active`
- Endpoint count: 8

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/bilitv/api/v1/languages` |
| GET | `/api/v1/home` | `-` | `https://captain.sapimu.au/bilitv/api/v1/home` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/bilitv/api/v1/search` |
| GET | `/api/v1/recommend` | `-` | `https://captain.sapimu.au/bilitv/api/v1/recommend` |
| GET | `/api/v1/dramas` | `-` | `https://captain.sapimu.au/bilitv/api/v1/dramas` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/bilitv/api/v1/drama/{ID}` |
| GET | `/api/v1/drama/:id/episode/:ep` | `id, ep` | `https://captain.sapimu.au/bilitv/api/v1/drama/{ID}/episode/{EP}` |
| GET | `/api/v1/subtitle/:shortId/:episode` | `shortId, episode` | `https://captain.sapimu.au/bilitv/api/v1/subtitle/{SHORTID}/{EPISODE}` |

```bash
curl -X GET "https://captain.sapimu.au/bilitv/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### DramaBite
- Base URL: `https://captain.sapimu.au/dramabite`
- Status: `active`
- Endpoint count: 9

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/dramabite/api/v1/languages` |
| GET | `/api/v1/dramas` | `-` | `https://captain.sapimu.au/dramabite/api/v1/dramas` |
| GET | `/api/v1/foryou` | `-` | `https://captain.sapimu.au/dramabite/api/v1/foryou` |
| GET | `/api/v1/hot` | `-` | `https://captain.sapimu.au/dramabite/api/v1/hot` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/dramabite/api/v1/drama/{ID}` |
| GET | `/api/v1/drama/:id/likes` | `id` | `https://captain.sapimu.au/dramabite/api/v1/drama/{ID}/likes` |
| GET | `/api/v1/drama/:id/episode/:ep` | `id, ep` | `https://captain.sapimu.au/dramabite/api/v1/drama/{ID}/episode/{EP}` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/dramabite/api/v1/search` |
| GET | `/api/v1/recommend` | `-` | `https://captain.sapimu.au/dramabite/api/v1/recommend` |

```bash
curl -X GET "https://captain.sapimu.au/dramabite/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### DramaNova
- Base URL: `https://captain.sapimu.au/dramanova`
- Status: `active`
- Endpoint count: 7

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/dramanova/api/v1/languages` |
| GET | `/api/v1/dramas` | `-` | `https://captain.sapimu.au/dramanova/api/v1/dramas` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/dramanova/api/v1/drama/{ID}` |
| GET | `/api/v1/drama/:id/episode/:ep` | `id, ep` | `https://captain.sapimu.au/dramanova/api/v1/drama/{ID}/episode/{EP}` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/dramanova/api/v1/search` |
| GET | `/api/v1/modules` | `-` | `https://captain.sapimu.au/dramanova/api/v1/modules` |
| GET | `/api/v1/recommend` | `-` | `https://captain.sapimu.au/dramanova/api/v1/recommend` |

```bash
curl -X GET "https://captain.sapimu.au/dramanova/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### DramaPops
- Base URL: `https://captain.sapimu.au/dramapops`
- Status: `active`
- Endpoint count: 9

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/dramapops/api/v1/languages` |
| GET | `/api/v1/config` | `-` | `https://captain.sapimu.au/dramapops/api/v1/config` |
| GET | `/api/v1/homepage` | `-` | `https://captain.sapimu.au/dramapops/api/v1/homepage` |
| GET | `/api/v1/dramas` | `-` | `https://captain.sapimu.au/dramapops/api/v1/dramas` |
| GET | `/api/v1/dramas/trending` | `-` | `https://captain.sapimu.au/dramapops/api/v1/dramas/trending` |
| GET | `/api/v1/dramas/popular` | `-` | `https://captain.sapimu.au/dramapops/api/v1/dramas/popular` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/dramapops/api/v1/drama/{ID}` |
| GET | `/api/v1/drama/:id/episode/:ep/video` | `id, ep` | `https://captain.sapimu.au/dramapops/api/v1/drama/{ID}/episode/{EP}/video` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/dramapops/api/v1/search` |

```bash
curl -X GET "https://captain.sapimu.au/dramapops/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### Fundrama
- Base URL: `https://captain.sapimu.au/fundrama`
- Status: `active`
- Endpoint count: 6

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/fundrama/api/v1/languages` |
| GET | `/api/v1/dramas` | `-` | `https://captain.sapimu.au/fundrama/api/v1/dramas` |
| GET | `/api/v1/drama/:id` | `id` | `https://captain.sapimu.au/fundrama/api/v1/drama/{ID}` |
| GET | `/api/v1/drama/:id/episodes` | `id` | `https://captain.sapimu.au/fundrama/api/v1/drama/{ID}/episodes` |
| GET | `/api/v1/drama/:id/episode/:ep` | `id, ep` | `https://captain.sapimu.au/fundrama/api/v1/drama/{ID}/episode/{EP}` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/fundrama/api/v1/search` |

```bash
curl -X GET "https://captain.sapimu.au/fundrama/api/v1/languages" \
  -H "Authorization: Bearer <TOKEN>"
```

### KalosTV
- Base URL: `https://captain.sapimu.au/kalostv`
- Status: `active`
- Endpoint count: 9

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/tabs` | `-` | `https://captain.sapimu.au/kalostv/api/v1/tabs` |
| GET | `/api/v1/home` | `-` | `https://captain.sapimu.au/kalostv/api/v1/home` |
| GET | `/api/v1/foryou` | `-` | `https://captain.sapimu.au/kalostv/api/v1/foryou` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/kalostv/api/v1/search` |
| GET | `/api/v1/video/:id` | `id` | `https://captain.sapimu.au/kalostv/api/v1/video/{ID}` |
| GET | `/api/v1/video/:id/episodes` | `id` | `https://captain.sapimu.au/kalostv/api/v1/video/{ID}/episodes` |
| GET | `/api/v1/video/:id/episode/:ep` | `id, ep` | `https://captain.sapimu.au/kalostv/api/v1/video/{ID}/episode/{EP}` |
| GET | `/api/v1/categories` | `-` | `https://captain.sapimu.au/kalostv/api/v1/categories` |
| GET | `/api/v1/tag/:id` | `id` | `https://captain.sapimu.au/kalostv/api/v1/tag/{ID}` |

```bash
curl -X GET "https://captain.sapimu.au/kalostv/api/v1/tabs" \
  -H "Authorization: Bearer <TOKEN>"
```

### NetShort
- Base URL: `https://captain.sapimu.au/netshort`
- Status: `active`
- Endpoint count: 14

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/feed/:page` | `page` | `https://captain.sapimu.au/netshort/api/v1/feed/{PAGE}` |
| GET | `/api/v1/explore/:page` | `page` | `https://captain.sapimu.au/netshort/api/v1/explore/{PAGE}` |
| GET | `/api/v1/new/:page` | `page` | `https://captain.sapimu.au/netshort/api/v1/new/{PAGE}` |
| GET | `/api/v1/dubbing/:page` | `page` | `https://captain.sapimu.au/netshort/api/v1/dubbing/{PAGE}` |
| GET | `/api/v1/vip/:page` | `page` | `https://captain.sapimu.au/netshort/api/v1/vip/{PAGE}` |
| GET | `/api/v1/search/:keyword/:page` | `keyword, page` | `https://captain.sapimu.au/netshort/api/v1/search/{KEYWORD}/{PAGE}` |
| GET | `/api/v1/search-hint` | `-` | `https://captain.sapimu.au/netshort/api/v1/search-hint` |
| GET | `/api/v1/categories` | `-` | `https://captain.sapimu.au/netshort/api/v1/categories` |
| GET | `/api/v1/category/:page` | `page` | `https://captain.sapimu.au/netshort/api/v1/category/{PAGE}` |
| GET | `/api/v1/detail/:id` | `id` | `https://captain.sapimu.au/netshort/api/v1/detail/{ID}` |
| GET | `/api/v1/similar/:id` | `id` | `https://captain.sapimu.au/netshort/api/v1/similar/{ID}` |
| GET | `/api/v1/episodes/:id` | `id` | `https://captain.sapimu.au/netshort/api/v1/episodes/{ID}` |
| GET | `/api/v1/episode/:id/:episodeNo` | `id, episodeNo` | `https://captain.sapimu.au/netshort/api/v1/episode/{ID}/{EPISODENO}` |
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/netshort/api/v1/languages` |

```bash
curl -X GET "https://captain.sapimu.au/netshort/api/v1/feed/{PAGE}" \
  -H "Authorization: Bearer <TOKEN>"
```

### Melolo
- Base URL: `https://captain.sapimu.au/melolo`
- Status: `active`
- Endpoint count: 7

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/melolo/api/v1/search` |
| GET | `/api/v1/series` | `-` | `https://captain.sapimu.au/melolo/api/v1/series` |
| GET | `/api/v1/video` | `-` | `https://captain.sapimu.au/melolo/api/v1/video` |
| GET | `/api/v1/batch/videos` | `-` | `https://captain.sapimu.au/melolo/api/v1/batch/videos` |
| GET | `/api/v1/bookmall` | `-` | `https://captain.sapimu.au/melolo/api/v1/bookmall` |
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/melolo/api/v1/languages` |
| GET | `/api/v1/img` | `-` | `https://captain.sapimu.au/melolo/api/v1/img` |

```bash
curl -X GET "https://captain.sapimu.au/melolo/api/v1/search" \
  -H "Authorization: Bearer <TOKEN>"
```

### ShortMax
- Base URL: `https://captain.sapimu.au/shortmax`
- Status: `active`
- Endpoint count: 13

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/shortmax/api/v1/search` |
| GET | `/api/v1/home` | `-` | `https://captain.sapimu.au/shortmax/api/v1/home` |
| GET | `/api/v1/feed/recommend` | `-` | `https://captain.sapimu.au/shortmax/api/v1/feed/recommend` |
| GET | `/api/v1/feed/vip` | `-` | `https://captain.sapimu.au/shortmax/api/v1/feed/vip` |
| GET | `/api/v1/feed/new` | `-` | `https://captain.sapimu.au/shortmax/api/v1/feed/new` |
| GET | `/api/v1/feed/ranked` | `-` | `https://captain.sapimu.au/shortmax/api/v1/feed/ranked` |
| GET | `/api/v1/feed/war` | `-` | `https://captain.sapimu.au/shortmax/api/v1/feed/war` |
| GET | `/api/v1/feed/epic` | `-` | `https://captain.sapimu.au/shortmax/api/v1/feed/epic` |
| GET | `/api/v1/feed/romance` | `-` | `https://captain.sapimu.au/shortmax/api/v1/feed/romance` |
| GET | `/api/v1/foryou` | `-` | `https://captain.sapimu.au/shortmax/api/v1/foryou` |
| GET | `/api/v1/detail/:code` | `code` | `https://captain.sapimu.au/shortmax/api/v1/detail/{CODE}` |
| GET | `/api/v1/play/:code` | `code` | `https://captain.sapimu.au/shortmax/api/v1/play/{CODE}` |
| GET | `/api/v1/languages` | `-` | `https://captain.sapimu.au/shortmax/api/v1/languages` |

```bash
curl -X GET "https://captain.sapimu.au/shortmax/api/v1/search" \
  -H "Authorization: Bearer <TOKEN>"
```

### ReelShort
- Base URL: `https://captain.sapimu.au/reelshort`
- Status: `active`
- Endpoint count: 12

| Method | Path | Path Params | Sample URL |
|---|---|---|---|
| GET | `/api/v1/foryou` | `-` | `https://captain.sapimu.au/reelshort/api/v1/foryou` |
| GET | `/api/v1/new` | `-` | `https://captain.sapimu.au/reelshort/api/v1/new` |
| GET | `/api/v1/completed` | `-` | `https://captain.sapimu.au/reelshort/api/v1/completed` |
| GET | `/api/v1/romance` | `-` | `https://captain.sapimu.au/reelshort/api/v1/romance` |
| GET | `/api/v1/drama` | `-` | `https://captain.sapimu.au/reelshort/api/v1/drama` |
| GET | `/api/v1/feed/:tabId` | `tabId` | `https://captain.sapimu.au/reelshort/api/v1/feed/{TABID}` |
| GET | `/api/v1/leaderboard` | `-` | `https://captain.sapimu.au/reelshort/api/v1/leaderboard` |
| GET | `/api/v1/search` | `-` | `https://captain.sapimu.au/reelshort/api/v1/search` |
| GET | `/api/v1/search/suggestions` | `-` | `https://captain.sapimu.au/reelshort/api/v1/search/suggestions` |
| GET | `/api/v1/book/:id` | `id` | `https://captain.sapimu.au/reelshort/api/v1/book/{ID}` |
| GET | `/api/v1/book/:id/chapters` | `id` | `https://captain.sapimu.au/reelshort/api/v1/book/{ID}/chapters` |
| GET | `/api/v1/book/:id/chapter/:chapterId/video` | `id, chapterId` | `https://captain.sapimu.au/reelshort/api/v1/book/{ID}/chapter/{CHAPTERID}/video` |

```bash
curl -X GET "https://captain.sapimu.au/reelshort/api/v1/foryou" \
  -H "Authorization: Bearer <TOKEN>"
```

## 4) Rekomendasi Implementasi Platform

1. Simpan metadata provider dari `api-endpoints.json` sebagai single source of truth.
2. Buat wrapper request terpusat (timeout, retry, error normalization).
3. Validasi path param sebelum call (jangan kirim placeholder).
4. Logging per provider + endpoint untuk observability dan throttling.
5. Jadwalkan re-scrape docs berkala untuk sync perubahan endpoint.

