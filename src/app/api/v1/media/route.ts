import { downloads } from '@/lib/downloads';
import { mediaResponse } from '@/lib/downloads/media';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const episode = Number(params.get('episode'));
    if (!Number.isInteger(episode) || episode < 1) throw new Error('Invalid episode');
    await downloads.ready();
    const file = downloads.local(params.get('provider') || '', params.get('drama') || '', episode);
    if (!file) return new Response('Not found', { status: 404 });
    return mediaResponse(file, request.headers.get('range'));
  } catch (error) { return new Response(error instanceof Error ? error.message : 'Invalid request', { status: 400 }); }
}
