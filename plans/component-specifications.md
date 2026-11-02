# Component Specifications: Homepage Redesign

## 1. ProviderFilterBar Component

### Purpose
Navigasi cepat untuk filter konten berdasarkan provider. Sticky position saat scroll.

### Props
```typescript
interface ProviderFilterBarProps {
  providers: Array<{
    slug: string;
    name: string;
    logoUrl?: string;
    contentCount: number;
    isNew?: boolean;
  }>;
  activeProvider: string | 'all';
  onProviderChange: (provider: string | 'all') => void;
  maxVisible?: number; // default: 6
}
```

### Design
```
┌─────────────────────────────────────────────────────────────────────┐
│  sticky top-[64px] z-30                                             │
│  bg-neutral-950/95 backdrop-blur-xl border-b border-white/5        │
├─────────────────────────────────────────────────────────────────────┤
│  [Semua] [DramaBox] [ShortMax] [FlexTV] [▼ More 38]              │
│   ───────                                                             │
│   active: border-b-2 border-red-500 text-white                      │
│   inactive: text-neutral-400 hover:text-white                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Behavior
- Horizontal scroll dengan snap
- "Semua" selalu first item
- Provider diurutkan: popularitas > content count > alphabet
- "More" dropdown: searchable list semua provider
- Active state: underline merah + text white

---

## 2. HeroBanner Component (Enhanced)

### Purpose
Featured drama dengan auto-rotate dan informasi lengkap.

### Props
```typescript
interface HeroBannerProps {
  dramas: Array<{
    id: string;
    title: string;
    coverUrl: string;
    provider: string;
    providerSlug: string;
    rating: number;
    episodeCount: number;
    synopsis: string;
    tags: string[];
  }>;
  autoRotateInterval?: number; // default: 5000ms
  onWatchNow: (dramaId: string) => void;
}
```

### Design
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [Full-width aspect-3/4 or 16/9]                    │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ gradient-to-t from-neutral-950            │     │
│  │                                           │     │
│  │  [Baru] [#1 Hari Ini]                    │     │
│  │  "The Billionaire's Hidden Heir"          │     │
│  │  ⭐ 4.8 • 88 Eps • DramaBox               │     │
│  │                                           │     │
│  │  [▶ Tonton Sekarang]  [♡]  [+]           │     │
│  │                                           │     │
│  │  ● ○ ○ ○ ○  (pagination dots)            │     │
│  └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

### Behavior
- Auto-rotate setiap 5 detik
- Pause on hover/touch
- Swipeable on mobile
- Pagination dots clickable
- Parallax effect on scroll (optional)

---

## 3. ContinueWatchingSection Component

### Purpose
Menampilkan drama yang sedang ditonton user untuk retention.

### Props
```typescript
interface ContinueWatchingSectionProps {
  items: Array<{
    dramaId: string;
    dramaTitle: string;
    coverUrl: string;
    episodeNumber: number;
    episodeTitle?: string;
    progressPercent: number;
    lastWatchedAt: string;
    provider: string;
  }>;
  onContinue: (dramaId: string, episodeNumber: number) => void;
  onRemove: (dramaId: string) => void;
}
```

### Design
```
┌────────────────────────────────────────────────────────────┐
│ Lanjutkan Menonton                              [Lihat]   │
├────────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│ │ [Poster] │  │ [Poster] │  │ [Poster] │                  │
│ │ ▶  60%   │  │ ▶  35%   │  │ ▶  90%   │                  │
│ └──────────┘  └──────────┘  └──────────┘                  │
│  Title 1       Title 2       Title 3                       │
│  Ep 5 • 2h     Ep 12 • 1d    Ep 88 • 5d                    │
│                                                            │
│  progress bar: h-1 bg-red-600                              │
└────────────────────────────────────────────────────────────┘
```

### Behavior
- Progress bar di thumbnail
- Play icon overlay
- X button untuk remove dari list
- Sort: lastWatchedAt desc
- Max 6 items, scrollable

---

## 4. HorizontalDramaSection Component

### Purpose
Reusable section untuk menampilkan drama secara horizontal.

### Props
```typescript
interface HorizontalDramaSectionProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  dramas: DramaCard[];
  variant?: 'default' | 'ranked' | 'compact';
  showProviderBadge?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  emptyState?: React.ReactNode;
}

interface DramaCard {
  id: string;
  title: string;
  coverUrl: string;
  provider: string;
  episodeCount: number;
  isNew?: boolean;
  rank?: number; // untuk trending
}
```

### Variants

#### Default
```
┌────────────────────────────────────────────────────────────┐
│ Section Title                             [Lihat Semua >] │
├────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │      │ │      │ │      │ │      │ │      │  ...         │
│ │poster│ │poster│ │poster│ │poster│ │poster│              │
│ │      │ │      │ │      │ │      │ │      │              │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │
│  Title   Title   Title   Title   Title                     │
│  88 Eps  102 Eps 60 Eps  150 Eps 88 Eps                    │
└────────────────────────────────────────────────────────────┘
```

#### Ranked (for trending)
```
┌────────────────────────────────────────────────────────────┐
│ 🔥 Trending                                               │
├────────────────────────────────────────────────────────────┤
│ ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐                    │
│ │ #1 │  │ #2 │  │ #3 │  │ 4  │  │ 5  │                    │
│ │ 🥇 │  │ 🥈 │  │ 🥉 │  │    │  │    │                    │
│ └────┘  └────┘  └────┘  └────┘  └────┘                    │
│  badge di top-left dengan medal untuk top 3               │
└────────────────────────────────────────────────────────────┘
```

#### Compact
- Smaller cards (w-28)
- Less metadata
- More items visible

---

## 5. ProviderSection Component

### Purpose
Menampilkan konten dari provider tertentu dengan branding.

### Props
```typescript
interface ProviderSectionProps {
  provider: {
    slug: string;
    name: string;
    logoUrl?: string;
    brandColor?: string;
  };
  dramas: DramaCard[];
  totalCount: number;
  onViewAll: (providerSlug: string) => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}
```

### Design
```
┌────────────────────────────────────────────────────────────┐
│ [Logo] DramaBox                    [Lihat Semua 48 >]    │
│ Content fresh from DramaBox                                 │
├────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │  A   │ │  B   │ │  C   │ │  D   │ │  E   │  ...         │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │
│  [DramaBox] badge di corner                                │
└────────────────────────────────────────────────────────────┘
```

### Behavior
- Provider logo/icon di header
- Semua cards punya provider badge
- Collapse/expand dengan chevron
- Lazy load saat expand

---

## 6. GenreGridSection Component

### Purpose
Discovery konten berdasarkan genre.

### Props
```typescript
interface GenreGridSectionProps {
  genres: Array<{
    id: string;
    name: string;
    posterUrls: string[]; // 3 poster untuk collage
    dramaCount: number;
    color: string; // gradient accent color
  }>;
  onGenreClick: (genreId: string) => void;
}
```

### Design
```
┌────────────────────────────────────────────────────────────┐
│ Jelajahi Genre                                            │
├────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌──────────────────┐                │
│ │    Romance       │  │     Action       │                │
│ │ ┌───┐ ┌───┐     │  │ ┌───┐ ┌───┐     │                │
│ │ │ A │ │ B │ ... │  │ │ X │ │ Y │ ... │                │
│ │ └───┘ └───┘     │  │ └───┘ └───┘     │                │
│ │    128 drama    │  │    86 drama     │                │
│ └──────────────────┘  └──────────────────┘                │
│                                                            │
│ ┌──────────────────┐  ┌──────────────────┐                │
│ │    Comedy        │  │    Thriller      │                │
│ └──────────────────┘  └──────────────────┘                │
└────────────────────────────────────────────────────────────┘
```

### Behavior
- Grid 2 columns mobile, 4 columns desktop
- Hover: scale up, show more posters
- Tap untuk masuk genre page

---

## 7. NewReleasesSection Component

### Purpose
Menampilkan konten terbaru, di-group by waktu.

### Props
```typescript
interface NewReleasesSectionProps {
  today: DramaCard[];
  yesterday: DramaCard[];
  thisWeek: DramaCard[];
  onViewAll: () => void;
}
```

### Design
```
┌────────────────────────────────────────────────────────────┐
│ Rilis Baru                                      [Lihat]   │
├────────────────────────────────────────────────────────────┤
│ Hari Ini                                                    │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │
│ │ [NEW]│ │ [NEW]│ │ [NEW]│ │ [NEW]│                        │
│ └──────┘ └──────┘ └──────┘ └──────┘                        │
│                                                            │
│ Kemarin                                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐                                 │
│ │      │ │      │ │      │                                 │
│ └──────┘ └──────┘ └──────┘                                 │
│                                                            │
│ Minggu Ini                                                  │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│ │      │ │      │ │      │ │      │ │      │               │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘               │
└────────────────────────────────────────────────────────────┘
```

### Behavior
- "NEW" badge untuk < 24 jam
- Group header: Hari Ini, Kemarin, Minggu Ini
- Max 4 per group, scrollable

---

## 8. DramaCard Component (Enhanced)

### Props
```typescript
interface DramaCardProps {
  id: string;
  title: string;
  coverUrl: string;
  provider: string;
  episodeCount: number;
  variant?: 'default' | 'compact' | 'wide';
  
  // Optional badges
  showProviderBadge?: boolean;
  isNew?: boolean;
  rank?: number; // 1-3 for medals
  
  // For continue watching
  progressPercent?: number;
  
  // Events
  onClick?: (id: string) => void;
  onBookmark?: (id: string) => void;
}
```

### Design Specs

#### Default
- Width: 128px (w-32)
- Aspect ratio: 2/3
- Border radius: xl (12px)
- Shadow: lg
- Ring: white/10

#### Hover State
- Scale: 105%
- Shadow: increase
- Optional: show play button overlay

#### Provider Badge
```
Position: absolute top-1.5 right-1.5
Style: bg-black/60 backdrop-blur px-1.5 py-0.5 rounded
text: [9px] text-red-500 font-bold
border: border-red-500/30
```

#### Progress Bar (Continue Watching)
```
Position: absolute bottom-0 left-0 right-0
Height: h-1
Background: bg-white/20
Fill: bg-red-600
```

---

## 9. EmptyState Component

### Purpose
Tampilan saat section tidak ada data.

### Props
```typescript
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

### Design
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                    [Icon]                                  │
│                                                            │
│              Title text                                    │
│           Description text                                 │
│                                                            │
│              [Action Button]                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 10. LoadingSkeleton Component

### Purpose
Placeholder saat data loading.

### Props
```typescript
interface LoadingSkeletonProps {
  variant?: 'card' | 'hero' | 'section';
  count?: number;
}
```

### Design
- Use Tailwind `animate-pulse`
- Background: neutral-800
- Rounded sesuai konten yang digantikan

---

## Animation Specifications

### Transitions
```css
/* Card hover */
transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1), 
            box-shadow 300ms ease;

/* Section appear */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
animation: fadeInUp 500ms ease-out forwards;

/* Stagger delay untuk list */
animation-delay: calc(var(--index) * 100ms);
```

### Interactions
- Card hover: scale-105, shadow-xl
- Button hover: brightness-110, translateY(-1px)
- Tab switch: underline slide animation
- Hero auto-rotate: fade transition 500ms

---

## Responsive Breakpoints

### Mobile (< 640px)
- Hero: aspect-[3/4], full width
- DramaCard: w-32
- Visible cards: ~2.5 (peek next)
- Genre grid: 2 columns
- Provider tabs: scrollable snap

### Tablet (640px - 1024px)
- Hero: aspect-video atau 16/9
- DramaCard: w-36
- Visible cards: ~4
- Genre grid: 3 columns

### Desktop (> 1024px)
- Hero: 16/9 dengan text overlay samping
- DramaCard: w-40
- Visible cards: ~6
- Genre grid: 4 columns
- Sidebar navigation (optional)

---

## Accessibility

### Keyboard Navigation
- Tab: navigate through interactive elements
- Enter/Space: activate buttons/links
- Arrow keys: scroll through horizontal sections

### Screen Reader
- Semua images: descriptive alt text
- Buttons: aria-label untuk icon-only buttons
- Sections: aria-labelledby dengan heading
- Loading: aria-busy="true"

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
