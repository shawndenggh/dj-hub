"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX, X } from "lucide-react";

export interface PlayerTrack {
  title: string;
  artist: string;
  previewUrl: string;
  coverUrl?: string;
}

interface MusicPlayerProps {
  track: PlayerTrack | null;
  onClose?: () => void;
  className?: string;
}

export function MusicPlayer({ track, onClose, className }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // When track changes, reset state and start playing
  useEffect(() => {
    if (!track) {
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.src = track.previewUrl;
    audio.volume = volume;
    audio.load();
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function onTimeUpdate() {
      setProgress(audio!.currentTime);
    }
    function onLoadedMetadata() {
      setDuration(audio!.duration);
    }
    function onEnded() {
      setIsPlaying(false);
      setProgress(0);
    }

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying, track]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
        audioRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  }, [isMuted]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  }, []);

  const formatTime = (secs: number) => {
    if (!isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!track) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t shadow-lg",
        className
      )}
    >
      <audio ref={audioRef} preload="metadata" />

      <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Cover + Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {track.coverUrl ? (
            <Image
              src={track.coverUrl}
              alt={track.title}
              width={40}
              height={40}
              className="h-10 w-10 rounded object-cover shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{track.title}</p>
            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-1 flex-1 max-w-sm">
          <Button
            size="icon"
            variant="ghost"
            onClick={togglePlay}
            className="h-8 w-8"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
              {formatTime(progress)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 30}
              step={0.1}
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-1 accent-primary cursor-pointer"
              aria-label="Seek"
            />
            <span className="text-xs text-muted-foreground w-8 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume + Close */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className="h-8 w-8"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 accent-primary cursor-pointer"
            aria-label="Volume"
          />
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 ml-2"
              aria-label="Close player"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
