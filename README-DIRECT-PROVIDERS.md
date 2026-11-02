# Direct provider integration

This fork adds direct provider support discovered from the publicly released
S-DRACIN v1.3.1 APK. It does not redistribute the APK or embedded credentials.

## Configuration

```env
DRAMA_API_BASE_URL=https://api-all-drama-new.vercel.app
```

Supabase and Upstash remain runtime configuration. Never commit their keys.

## Verification boundary

The catalog, search, detail and episode-list endpoints are live. Playback URLs
must be verified independently because upstream CDNs can expire or disappear:

- DramaBox currently returns `hwztakavideo.dramaboxdb.com` URLs; that hostname
  was NXDOMAIN during verification.
- ShortMax currently returns Google Drive URLs; anonymous requests redirected
  to Google sign-in during verification.

The app returns the upstream URL as supplied. It does not bypass authentication,
forge signatures or proxy copyrighted media.

## Provenance

Based on `edodoyokz/dracin`, with direct-provider adaptations. The upstream
repository did not include a license file at the time this fork was created;
retain attribution and review licensing before redistribution.
