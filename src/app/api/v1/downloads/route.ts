import { NextResponse } from 'next/server';
import { downloads } from '@/lib/downloads';
import type { DownloadRequest } from '@/lib/downloads/manager';

export const dynamic = 'force-dynamic';
export async function GET() { await downloads.ready(); return NextResponse.json(downloads.list()); }
export async function POST(request: Request) {
  try {
    const body = await request.json() as DownloadRequest | { episodes: DownloadRequest[] };
    const jobs = 'episodes' in body ? await downloads.enqueueAll(body.episodes) : [await downloads.enqueue(body)];
    return NextResponse.json({ jobs }, { status: 202 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 }); }
}
export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { maxConcurrency?: number; key?: string; action?: 'cancel' | 'retry' };
    if (body.maxConcurrency !== undefined) return NextResponse.json(await downloads.setMaxConcurrency(body.maxConcurrency));
    if (!body.key || !body.action) throw new Error('key and action are required');
    return NextResponse.json(body.action === 'cancel' ? await downloads.cancel(body.key) : await downloads.retry(body.key));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 }); }
}
