'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, List } from 'lucide-react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import { getPlaybackUrl, getDramaEpisodes, getDramaDetail } from '@/lib/api-client';
import type { EpisodeItem, DramaDetail, PlaybackResponse, SubtitleTrack } from '@/lib/types';
import { EpisodeDrawer } from '@/app/components/player';
import 'video.js/dist/video-js.css';

function getPreferredSubtitleTracks(subtitles: SubtitleTrack[]): SubtitleTrack[] {
  return subtitles.map((track, index) => {
    const langCode = (track.srclang || '').toLowerCase();
    const label = (track.label || '').toLowerCase();
    const isIndonesian = ['id', 'id_id', 'in', 'indonesia'].includes(langCode) || label.includes('indonesia') || label.includes('subtitle');

    return {
      ...track,
      default: isIndonesian || index === 0,
    };
  });
}

function prefersNativeTextTracks(): boolean {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const touchPoints = navigator.maxTouchPoints || 0;
  const isAppleMobile = /iPhone|iPod/i.test(userAgent)
    || (/iPad/i.test(userAgent))
    || (platform === 'MacIntel' && touchPoints > 1);

  return isAppleMobile;
}

export default function SimplePlayer() {
  const params = useParams();
  const router = useRouter();
  const provider = params.provider as string;
  const dramaId = params.drama as string;
  const episodeNo = parseInt(params.episode as string, 10);

  const playerElementRef = useRef<HTMLVideoElement | null>(null);
  const playerInstanceRef = useRef<Player | null>(null);
  const shouldAutoplayRef = useRef(true);
  const [playbackData, setPlaybackData] = useState<PlaybackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drama, setDrama] = useState<DramaDetail | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);

  const subtitleTracks = useMemo(() => getPreferredSubtitleTracks(playbackData?.subtitles || []), [playbackData?.subtitles]);
  const useNativeTextTracks = useMemo(() => prefersNativeTextTracks(), []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getDramaDetail(`${provider}:${dramaId}`),
      getDramaEpisodes(`${provider}:${dramaId}`),
    ]).then(([dramaData, episodesData]) => {
      if (cancelled) return;
      if (dramaData) setDrama(dramaData.drama);
      setEpisodes(episodesData);
    }).catch((err) => {
      if (!cancelled) {
        console.error(err);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [provider, dramaId]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setPlaybackData(null);

    const existingPlayer = playerInstanceRef.current;
    if (existingPlayer) {
      existingPlayer.pause();
      existingPlayer.reset();
    }

    getPlaybackUrl(provider, dramaId, String(episodeNo), 'guest')
      .then((data) => {
        if (cancelled) return;
        if (data?.streamUrl) {
          setPlaybackData(data);
        } else {
          setError('Video tidak tersedia');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Gagal memuat video');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [provider, dramaId, episodeNo]);

  useEffect(() => {
    const videoElement = playerElementRef.current;
    if (!videoElement) return;

    if (!playerInstanceRef.current) {
      playerInstanceRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        preload: 'auto',
        playsinline: true,
        controlBar: {
          pictureInPictureToggle: false,
        },
        html5: {
          nativeTextTracks: useNativeTextTracks,
        },
      });
    }

    const player = playerInstanceRef.current;
    if (!player) return;

    const handleEnded = () => {
      const currentIndex = episodes.findIndex((ep) => ep.episodeNo === episodeNo);
      const nextEpisode = episodes[currentIndex + 1];
      if (nextEpisode && !nextEpisode.isLocked) {
        shouldAutoplayRef.current = true;
        router.push(`/play/${provider}/${dramaId}/${nextEpisode.episodeNo}`);
      }
    };

    player.off('ended');
    player.on('ended', handleEnded);

    return () => {
      player.off('ended', handleEnded);
    };
  }, [episodes, episodeNo, provider, dramaId, router, useNativeTextTracks]);

  useEffect(() => {
    const player = playerInstanceRef.current;
    if (!player || !playbackData?.streamUrl) return;

    const sourceType = playbackData.mimeType || (playbackData.streamUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4');
    player.pause();
    player.src({ src: playbackData.streamUrl, type: sourceType });

    const remoteTracks = player.remoteTextTracks();
    if (remoteTracks && remoteTracks.length > 0) {
      const remoteTracksList = remoteTracks as unknown as ArrayLike<unknown>;
      const tracksToRemove = Array.from({ length: remoteTracks.length }, (_, index) => remoteTracksList[index]).filter(Boolean);
      for (const track of tracksToRemove) {
        player.removeRemoteTextTrack(track as HTMLTrackElement);
      }
    }

    subtitleTracks.forEach((track) => {
      player.addRemoteTextTrack({
        kind: 'subtitles',
        src: track.src,
        srclang: track.srclang,
        label: track.label,
        default: track.default,
      }, false);
    });

    const applySubtitleSelection = () => {
      const textTracks = player.textTracks() as unknown as ArrayLike<TextTrack | undefined>;
      let hasShownDefault = false;

      for (let i = 0; i < textTracks.length; i += 1) {
        const textTrack = textTracks[i];
        if (!textTrack) continue;
        const isDefault = subtitleTracks.some((track) => track.default && track.label === textTrack.label);

        if (isDefault && !hasShownDefault) {
          textTrack.mode = 'showing';
          hasShownDefault = true;
        } else {
          textTrack.mode = 'disabled';
        }
      }
    };

    player.ready(() => {
      player.one('loadedmetadata', () => {
        applySubtitleSelection();
      });

      if (shouldAutoplayRef.current) {
        void player.play()?.catch(() => {
          // Browser autoplay restrictions are acceptable; native controls remain available.
        });
      }
      shouldAutoplayRef.current = false;
    });
  }, [playbackData, subtitleTracks, useNativeTextTracks]);

  useEffect(() => {
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.dispose();
        playerInstanceRef.current = null;
      }
    };
  }, []);

  const handleEpisodeSelect = (selectedEpisodeNo: number) => {
    if (selectedEpisodeNo !== episodeNo) {
      shouldAutoplayRef.current = true;
      router.push(`/play/${provider}/${dramaId}/${selectedEpisodeNo}`);
    }
    setShowDrawer(false);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between">
        <button
          onClick={() => router.push(`/dramas/${provider}:${dramaId}`)}
          className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-white text-sm font-medium max-w-[60vw] truncate text-center">
          {drama?.title || 'Loading...'} - Ep {episodeNo}
        </div>
        <button
          onClick={() => setShowDrawer(true)}
          className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
        >
          <List size={20} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {loading && (
          <div className="text-white text-center">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Memuat video...</p>
          </div>
        )}

        {error && (
          <div className="text-white text-center p-6">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 rounded-full hover:bg-red-700"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <div className={`w-full h-full ${loading || error ? 'hidden' : 'block'}`}>
          <div data-vjs-player className="w-full h-full">
            <video
              ref={playerElementRef}
              className="video-js vjs-big-play-centered w-full h-full max-h-screen"
              playsInline
              controls
              crossOrigin="anonymous"
            />
          </div>
        </div>
      </div>

      <EpisodeDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        episodes={episodes}
        currentEpisodeNo={episodeNo}
        dramaTitle={drama?.title || ''}
        onEpisodeSelect={handleEpisodeSelect}
      />
    </div>
  );
}
