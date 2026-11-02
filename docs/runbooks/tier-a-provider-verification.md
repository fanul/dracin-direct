# Tier A Provider Verification Runbook

## Overview

This runbook describes the process for verifying Tier A provider launch eligibility for dracinhub.

## What is Tier A?

Tier A providers are **Full Streamable** providers that support:
- `home` - Browse home/featured content
- `search` - Search for dramas
- `detail` - Get drama details
- `episodes` - Get episode listings
- `playback` - Stream video content

A provider is **launch-eligible** only if:
1. All five intents pass verification
2. Display quality is acceptable
3. Playback is web-compatible

## Verification Process

### Automated Verification

Run the verification script:

```bash
node scripts/verify-tier-a-providers.mjs
```

This will:
1. Load provider catalog from `api-endpoints.json`
2. Probe each Tier A candidate's endpoints
3. Generate verification matrix at `reports/tier-a-matrix-latest.json`

### Manual Verification Checklist

For each provider candidate:

1. **Home Intent**
   - [ ] Endpoint resolves
   - [ ] Response contains valid drama entries
   - [ ] Titles and covers are present

2. **Search Intent**
   - [ ] Endpoint resolves
   - [ ] Search returns relevant results
   - [ ] Results match query intent

3. **Detail Intent**
   - [ ] Endpoint resolves
   - [ ] Synopsis is present
   - [ ] Metadata is complete (genres, tags, episode count)

4. **Episodes Intent**
   - [ ] Endpoint resolves
   - [ ] Episode list is ordered correctly
   - [ ] Episode numbers are sequential

5. **Playback Intent**
   - [ ] Endpoint resolves
   - [ ] Stream URL is valid
   - [ ] Stream plays in web browser (HLS/MP4)
   - [ ] No DRM or encryption blocking web playback

## Launch Decision Matrix

| Status | Meaning | Action |
|--------|---------|--------|
| `verified` | All checks passed | Include in launch |
| `blocked` | Critical failures | Exclude from launch |
| `experimental` | Partial pass | Evaluate case-by-case |

## Tier A Candidates (Initial Set)

- reelshort
- goodshort
- flextv
- shortmax
- netshort
- dramanova
- dramapops
- cashdrama

## Exclusion Reasons

When a provider is blocked, document the reason:
- `playback_failed` - Stream URL doesn't play in browser
- `missing_intent` - Required endpoint not available
- `display_quality` - Metadata quality below threshold
- `api_error` - Persistent API failures
- `not_in_catalog` - Provider not found in api-endpoints.json

## Updating the Matrix

1. Re-run verification script
2. Review any status changes
3. Update `CAPABILITY_MATRIX.md` with verified status
4. Communicate changes to team

## Troubleshooting

### "All intents failed"

Check:
- API token is valid
- Provider status in catalog is `active`
- Network connectivity to `captain.sapimu.au`

### "Playback failed but endpoint resolved"

- Check stream URL format
- Verify HLS manifest is accessible
- Test in multiple browsers
- Check for CORS or referrer restrictions

## Related Files

- `src/lib/providers/launch-contracts.ts` - Verification status model
- `src/lib/providers/tier-a-matrix.ts` - Matrix logic
- `scripts/verify-tier-a-providers.mjs` - Verification script
- `reports/tier-a-matrix-latest.json` - Generated matrix artifact