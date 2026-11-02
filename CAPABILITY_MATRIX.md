# Provider Capability Matrix (Auto-inferred)

- Catalog generatedAt: 2026-02-24
- Host: https://captain.sapimu.au
- Notes: Capabilities are **heuristics** inferred from endpoint path patterns in `api-endpoints.json`.
  - This is good enough to bootstrap `provider_capabilities`, but each provider should be verified with contract tests.

## Preview (first 30 providers)

| provider_slug   | vip   | status   |   endpoint_count | supports_home   | supports_search   | supports_episode_list   | supports_playback   | supports_subtitle   | supports_unlock   | playback_type   |
|:----------------|:------|:---------|-----------------:|:----------------|:------------------|:------------------------|:--------------------|:--------------------|:------------------|:----------------|
| hishort         | VIP1  | active   |                4 | True            | True              | False                   | False               | False               | False             | unknown         |
| meloshort       | VIP1  | active   |                6 | False           | True              | True                    | False               | False               | False             | unknown         |
| microdrama      | VIP1  | active   |                4 | False           | True              | False                   | False               | False               | False             | unknown         |
| snackshort      | VIP1  | active   |                7 | True            | True              | True                    | False               | False               | False             | unknown         |
| stardusttv      | VIP1  | active   |                5 | True            | True              | False                   | True                | False               | False             | video           |
| velolo          | VIP1  | active   |                7 | False           | False             | False                   | True                | False               | False             | stream          |
| dotdrama        | VIP2  | active   |                4 | False           | False             | False                   | False               | False               | False             | unknown         |
| flickreels      | VIP2  | active   |                8 | True            | True              | True                    | True                | False               | False             | play            |
| freereels       | VIP2  | active   |               13 | True            | True              | True                    | True                | False               | False             | play            |
| minutedrama     | VIP3  | active   |                3 | False           | True              | False                   | True                | False               | False             | video           |
| rapidtv         | VIP3  | active   |                4 | False           | True              | True                    | False               | False               | False             | unknown         |
| starshort       | VIP3  | active   |                7 | False           | True              | True                    | False               | False               | False             | unknown         |
| cashdrama       | VIP5  | active   |                9 | True            | True              | True                    | True                | False               | False             | play            |
| dramanow        | VIP5  | active   |                4 | False           | True              | False                   | True                | False               | False             | video           |
| radreels        | VIP5  | active   |                8 | True            | True              | True                    | True                | False               | False             | video           |
| shorten         | VIP5  | active   |                7 | False           | False             | False                   | False               | False               | False             | unknown         |
| shortsky        | VIP5  | active   |                6 | True            | True              | False                   | False               | False               | False             | unknown         |
| shotshort       | VIP5  | active   |                8 | False           | True              | True                    | False               | False               | False             | unknown         |
| sodareels       | VIP5  | active   |                6 | True            | True              | True                    | False               | False               | False             | unknown         |
| dramadash       | VIP6  | active   |                4 | False           | True              | False                   | False               | False               | False             | unknown         |
| dramarush       | VIP6  | active   |                7 | False           | True              | False                   | True                | False               | False             | play            |
| dramawave       | VIP6  | active   |                7 | True            | True              | False                   | True                | False               | False             | play            |
| flickshort      | VIP6  | active   |                6 | True            | True              | False                   | False               | False               | False             | unknown         |
| dreamshort      | VIP7  | active   |                5 | False           | True              | False                   | False               | False               | False             | unknown         |
| reelife         | VIP7  | active   |                6 | True            | True              | True                    | False               | False               | False             | unknown         |
| shortbox        | VIP7  | active   |                9 | False           | True              | True                    | True                | False               | False             | stream          |
| vigloo          | VIP7  | active   |               11 | False           | True              | True                    | True                | False               | False             | play            |
| flextv          | VIP8  | active   |                7 | False           | True              | True                    | True                | False               | False             | play            |
| goodshort       | VIP8  | active   |                6 | True            | True              | True                    | True                | False               | False             | play            |
| idrama          | VIP8  | active   |                9 | False           | True              | False                   | False               | False               | True              | unknown         |

## Output files
- Full matrix CSV: `provider_capability_matrix.csv`

## Tier A Launch Set (2026-03-11)

### Verified Launch Providers
| provider_slug | status | home | search | detail | episodes | playback |
|:--------------|:-------|:-----|:-------|:-------|:---------|:---------|
| reelshort     | ✅      | ✅    | ✅      | ✅      | ✅        | ✅        |
| goodshort     | ✅      | ✅    | ✅      | ✅      | ✅        | ✅        |
| flextv        | ✅      | ✅    | ✅      | ✅      | ✅        | ✅        |
| cashdrama     | ✅      | ✅    | ✅      | ✅      | ✅        | ✅        |

### Blocked Providers (require investigation)
| provider_slug | status | issues                                   |
|:--------------|:-------|:-----------------------------------------|
| shortmax      | ⚠️      | Missing detail/episodes endpoints         |
| netshort      | ⚠️      | Missing detail endpoint, playback issues  |
| dramanova     | ⚠️      | HTTP 400/500 errors on search/detail      |
| dramapops     | ⚠️      | HTTP 400/404/500 errors across endpoints  |

### Launch Mode Configuration
Set `LAUNCH_MODE_ENABLED=true` to restrict to verified Tier A providers only.
