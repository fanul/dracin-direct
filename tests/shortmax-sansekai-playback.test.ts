import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('ShortMax Sansekai playback', () => {
  it('uses the verified episode API and a restricted decrypting HLS proxy', () => {
    const provider = readFileSync('src/lib/providers/dramabox.ts', 'utf8');
    const proxy = readFileSync('src/app/api/v1/shortmax-hls/route.ts', 'utf8');
    expect(provider).toContain('api.sansekai.my.id/api/shortmax/get-episode');
    expect(provider).not.toContain('drive.google.com');
    expect(provider).toContain("'kembalinya-pengantin-yang-ditolak-7906' ? '8714'");
    expect(proxy).toContain("const ALLOWED_HOST = 'volcengine-forward.shorttv.live'");
    expect(proxy).toContain("crypto.createDecipheriv('aes-128-cbc'");
    expect(proxy).toContain('const proxyPath = (url: string) => `/api/v1/shortmax-hls?url=');
    expect(proxy).not.toContain('requestUrl.origin');
  });
});
