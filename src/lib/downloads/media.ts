import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';

export async function mediaResponse(file: string, range: string | null): Promise<Response> {
  const size = (await stat(file)).size;
  const headers: Record<string, string> = { 'Accept-Ranges': 'bytes', 'Content-Type': 'video/mp4' };
  if (!range) {
    headers['Content-Length'] = String(size);
    return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, { headers });
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[2] && match[1] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  headers['Content-Length'] = String(end - start + 1); headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  return new Response(Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream, { status: 206, headers });
}
