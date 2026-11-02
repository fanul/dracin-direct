import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_HOST = 'volcengine-forward.shorttv.live';
const AES_IV = Buffer.from('shortmax00000000', 'ascii');

function decryptSegment(buffer: Buffer): Buffer {
  if (buffer[0] === 0x47 || buffer.length < 1040 || buffer.subarray(0, 8).toString('ascii') !== 'shortmax') return buffer;
  const keyPosition = Number.parseInt(buffer.subarray(16, 20).toString('ascii'), 10);
  const key = buffer.subarray(keyPosition, keyPosition + 16);
  const payload = buffer.subarray(1040);
  try {
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, AES_IV);
    const decrypted = Buffer.concat([decipher.update(Buffer.concat([buffer.subarray(1024, 1040), payload.subarray(0, 1024)])), decipher.final()]);
    return decrypted[0] === 0x47 ? Buffer.concat([decrypted, payload.subarray(1024)]) : payload;
  } catch {
    return payload;
  }
}

function validateUpstream(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.hostname !== ALLOWED_HOST) throw new Error('INVALID_SHORTMAX_UPSTREAM');
  return url;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const requestUrl = new URL(request.url);
    const upstreamUrl = validateUpstream(requestUrl.searchParams.get('url') || '');
    const upstream = await fetch(upstreamUrl, { cache: 'no-store', headers: { 'User-Agent': 'okhttp/4.12.0', Accept: '*/*' } });
    if (!upstream.ok) return new NextResponse('ShortMax upstream unavailable', { status: 502 });
    const buffer = Buffer.from(await upstream.arrayBuffer());
    const isPlaylist = upstreamUrl.pathname.endsWith('.m3u8') || buffer.subarray(0, 7).toString().includes('#EXTM3U');
    if (isPlaylist) {
      const proxyPath = (url: string) => `/api/v1/shortmax-hls?url=${encodeURIComponent(url)}`;
      const playlist = buffer.toString('utf8').split(/\r?\n/).map((line) => {
        const value = line.trim();
        if (!value) return line;
        if (value.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => `URI="${proxyPath(new URL(uri, upstreamUrl).href)}"`);
        return proxyPath(new URL(value, upstreamUrl).href);
      }).join('\n');
      return new NextResponse(playlist, { headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
    }
    const data = upstreamUrl.pathname.endsWith('.ts') ? decryptSegment(buffer) : buffer;
    return new NextResponse(new Uint8Array(data), { headers: { 'Content-Type': upstreamUrl.pathname.endsWith('.ts') ? 'video/mp2t' : 'application/octet-stream', 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' } });
  } catch {
    return new NextResponse('Invalid ShortMax stream URL', { status: 400 });
  }
}
