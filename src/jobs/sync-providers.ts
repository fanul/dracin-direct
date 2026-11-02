import { getSupabaseClient } from '../lib/db/client';
import { providerCatalog } from '../lib/providers/catalog';
import { logger } from '../lib/observability/logger';
import { preflightEnvCheck } from '../lib/config/env';
import type { Provider } from '../lib/types';

export async function syncProviders(): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    const providers = providerCatalog.getAllProviders();

    for (const provider of providers) {
      const { error } = await supabase
        .from('providers')
        .upsert({
          slug: provider.slug,
          name: provider.provider,
          vip_group: provider.vip,
          status: provider.status || 'active',
          endpoints: provider.endpoints,
          capabilities: provider.capabilities,
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'slug',
        });

      if (error) {
        logger.error('sync_provider_failed', {
          provider: provider.slug,
          error: error.message,
        });
      }
    }

    logger.info('sync_providers_completed', {
      count: providers.length,
    });
  } catch (error) {
    logger.error('sync_providers_failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}

if (require.main === module) {
  // Preflight env validation - fail fast with clear errors
  const preflight = preflightEnvCheck();
  if (!preflight.success) {
    console.error('Environment validation failed:');
    preflight.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  syncProviders().catch(console.error);
}
