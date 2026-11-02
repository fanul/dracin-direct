import { CashDramaAdapter } from './cashdrama';
import { ShortMaxAdapter } from './shortmax';
import {
  HiShortAdapter,
  MicroDramaAdapter,
  MeloShortAdapter,
  StardustTVAdapter,
  SnackShortAdapter as SnackShortCustomAdapter,
  VeloloAdapter as VeloloCustomAdapter,
  FreeReelsAdapter,
  FlickReelsAdapter,
  DotDramaAdapter,
  ShotShortAdapter,
  StarShortAdapter,
  RapidTVAdapter,
  MinuteDramaAdapter,
  DramaNovaAdapter,
  DramaPopsAdapter,
  DramaNowAdapter,
  ShortenAdapter,
  ShortSkyAdapter,
  FlickShortAdapter,
  DramaDashAdapter,
  DramaWaveAdapter,
  DramaRushAdapter,
  ReelShortAdapter,
  ReelifeAdapter,
  ViglooAdapter,
  DreamShortAdapter,
  ShortBoxAdapter,
  MyDramaAdapter,
  GoodShortAdapter as GoodShortCustomAdapter,
  IDramaAdapter,
  FlexTVAdapter as FlexTVCustomAdapter,
  FundramaAdapter,
  KalosTVAdapter,
  NetShortAdapter,
  MeloloAdapter,
  BiliTVAdapter,
  DramaBiteAdapter,
  SodaReelsAdapter,
  RadReelsAdapter,
} from './all-providers';
import { GenericProviderAdapter } from './generic';
import type { ProviderAdapter } from './base';
import { providerCatalog } from '../catalog';

// Build adapter map dynamically from catalog
function buildAdapters(): Map<string, ProviderAdapter> {
  const map = new Map<string, ProviderAdapter>();

  // Register specific adapters for providers that need custom handling
  map.set('reelshort', new ReelShortAdapter());
  map.set('goodshort', new GoodShortCustomAdapter());
  map.set('flextv', new FlexTVCustomAdapter());
  map.set('cashdrama', new CashDramaAdapter());
  map.set('shortmax', new ShortMaxAdapter());

  // Register custom adapters for providers with unique response structures
  map.set('snackshort', new SnackShortCustomAdapter());
  map.set('velolo', new VeloloCustomAdapter());
  map.set('freereels', new FreeReelsAdapter());
  map.set('flickreels', new FlickReelsAdapter());
  map.set('dotdrama', new DotDramaAdapter());
  map.set('dramanova', new DramaNovaAdapter());
  map.set('dramapops', new DramaPopsAdapter());
  
  // Register additional custom adapters
  map.set('hishort', new HiShortAdapter());
  map.set('microdrama', new MicroDramaAdapter());
  map.set('meloshort', new MeloShortAdapter());
  map.set('stardusttv', new StardustTVAdapter());
  map.set('shotshort', new ShotShortAdapter());
  map.set('starshort', new StarShortAdapter());
  map.set('rapidtv', new RapidTVAdapter());
  map.set('minutedrama', new MinuteDramaAdapter());
  map.set('dramanow', new DramaNowAdapter());
  map.set('shorten', new ShortenAdapter());
  map.set('shortsky', new ShortSkyAdapter());
  map.set('flickshort', new FlickShortAdapter());
  map.set('dramadash', new DramaDashAdapter());
  map.set('dramawave', new DramaWaveAdapter());
  map.set('dramarush', new DramaRushAdapter());
  map.set('dreamshort', new DreamShortAdapter());
  map.set('mydrama', new MyDramaAdapter());
  map.set('idrama', new IDramaAdapter());
  map.set('fundrama', new FundramaAdapter());
  map.set('kalostv', new KalosTVAdapter());
  map.set('netshort', new NetShortAdapter());
  map.set('melolo', new MeloloAdapter());
  map.set('bilitv', new BiliTVAdapter());
  map.set('dramabite', new DramaBiteAdapter());
  map.set('reelife', new ReelifeAdapter());
  map.set('vigloo', new ViglooAdapter());
  map.set('shortbox', new ShortBoxAdapter());
  map.set('sodareels', new SodaReelsAdapter());
  map.set('radreels', new RadReelsAdapter());

  // Register generic adapters for all active providers
  const activeProviders = providerCatalog.getActiveProviders();
  for (const provider of activeProviders) {
    if (!map.has(provider.slug)) {
      map.set(
        provider.slug,
        new GenericProviderAdapter(provider.provider, provider.slug, provider.vip)
      );
    }
  }

  return map;
}

export const adapters = buildAdapters();

export function getAdapter(slug: string): ProviderAdapter | undefined {
  return adapters.get(slug);
}

export function getAllAdapterSlugs(): string[] {
  return Array.from(adapters.keys());
}

export function getActiveProviderCount(): number {
  return adapters.size;
}
