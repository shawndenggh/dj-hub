"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MusicPlayer, type PlayerTrack } from "@/components/music-player";
import { formatDuration } from "@/lib/utils";
import Image from "next/image";
import { Music, Play, Plus, Loader2 } from "lucide-react";

export interface TrackData {
  id: number | string;
  title: string;
  artist: { name: string; picture_medium?: string };
  album?: { title?: string; cover_medium?: string };
  duration?: number;
  preview?: string;
  bpm?: number;
  explicit_lyrics?: boolean;
  genre?: string;
}

interface Channel {
  id: string;
  name: string;
}

interface TrackCardProps {
  track: TrackData;
  channels?: Channel[];
  /** If provided, show a remove button instead of add-to-channel */
  onRemove?: () => Promise<void> | void;
  /** Variant controls layout density */
  variant?: "default" | "compact";
}

export function TrackCard({ track, channels = [], onRemove, variant = "default" }: TrackCardProps) {
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const { toast } = useToast();

  async function addToChannel(channelId: string, channelName: string) {
    setAdding(channelId);
    try {
      const res = await fetch(`/api/channels/${channelId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deezerId: String(track.id),
          title: track.title,
          artist: track.artist.name,
          album: track.album?.title,
          duration: track.duration,
          previewUrl: track.preview,
          coverUrl: track.album?.cover_medium,
          bpm: track.bpm || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Added!", description: `"${track.title}" added to ${channelName}` });
    } catch {
      toast({ title: "Error", description: "Failed to add track.", variant: "destructive" });
    } finally {
      setAdding(null);
    }
  }

  async function handleRemove() {
    if (!onRemove) return;
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  }

  function handlePreview() {
    if (!track.preview) return;
    setCurrentTrack({
      title: track.title,
      artist: track.artist.name,
      previewUrl: track.preview,
      coverUrl: track.album?.cover_medium,
    });
  }

  const coverSize = variant === "compact" ? "h-10 w-10" : "h-12 w-12";

  return (
    <>
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="flex items-center gap-4 py-3 px-4">
          {/* Cover */}
          {track.album?.cover_medium ? (
            <Image
              src={track.album.cover_medium}
              alt={track.title}
              width={48}
              height={48}
              className={`${coverSize} rounded object-cover shrink-0`}
            />
          ) : (
            <div className={`${coverSize} rounded bg-muted flex items-center justify-center shrink-0`}>
              <Music className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{track.title}</p>
            <p className="text-xs text-muted-foreground truncate">{track.artist.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {track.bpm && track.bpm > 0 && (
                <span className="text-xs text-muted-foreground">{Math.round(track.bpm)} BPM</span>
              )}
              {track.duration && track.duration > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formatDuration(track.duration)}
                </span>
              )}
              {track.genre && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                  {track.genre}
                </Badge>
              )}
              {track.explicit_lyrics && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">E</Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Preview */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handlePreview}
              disabled={!track.preview}
              aria-label="Preview"
            >
              <Play className="h-4 w-4" />
            </Button>

            {/* Remove button */}
            {onRemove && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={handleRemove}
                disabled={removing}
                aria-label="Remove"
              >
                {removing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-lg leading-none">×</span>
                )}
              </Button>
            )}

            {/* Add to channel dropdown */}
            {!onRemove && channels.length > 0 && (
              <div className="relative group/add">
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Add to channel">
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
                <div className="absolute right-0 bottom-9 hidden group-hover/add:block z-10 bg-popover border rounded-md shadow-md min-w-36 py-1">
                  {channels.map((ch) => (
                    <button
                      key={ch.id}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors truncate"
                      onClick={() => addToChannel(ch.id, ch.name)}
                      disabled={adding === ch.id}
                    >
                      {ch.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <MusicPlayer track={currentTrack} onClose={() => setCurrentTrack(null)} />
    </>
  );
}
