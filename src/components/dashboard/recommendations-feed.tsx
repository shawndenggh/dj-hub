"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MusicPlayer, type PlayerTrack } from "@/components/music-player";
import { formatDuration, parseJsonField } from "@/lib/utils";
import type { DeezerTrack } from "@/lib/deezer";
import {
  Music,
  Play,
  Plus,
  Radio,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Recommendation {
  id: string;
  trackData: string;
  score: number;
  liked: boolean | null;
  createdAt: string;
}

interface Channel {
  id: string;
  name: string;
}

interface RecommendationsFeedProps {
  recommendations: Recommendation[];
  channels: Channel[];
  total: number;
  page: number;
  totalPages: number;
}

// Group recommendations by date (YYYY-MM-DD)
function groupByDate(recs: Recommendation[]) {
  const groups: Record<string, Recommendation[]> = {};
  for (const rec of recs) {
    const date = new Date(rec.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(rec);
  }
  return groups;
}

function TrackCard({
  recommendation,
  channels,
  onPreview,
}: {
  recommendation: Recommendation;
  channels: Channel[];
  onPreview: (track: DeezerTrack) => void;
}) {
  const [adding, setAdding] = useState<string | null>(null);
  const { toast } = useToast();

  const track = parseJsonField<DeezerTrack>(recommendation.trackData, {} as DeezerTrack);

  if (!track.id) return null;

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

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="flex items-center gap-4 py-3 px-4">
        {/* Cover */}
        {track.album?.cover_medium ? (
          <Image
            src={track.album.cover_medium}
            alt={track.title}
            width={48}
            height={48}
            className="h-12 w-12 rounded object-cover shrink-0"
          />
        ) : (
          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center shrink-0">
            <Music className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">{track.artist?.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {track.bpm > 0 && (
              <span className="text-xs text-muted-foreground">{Math.round(track.bpm)} BPM</span>
            )}
            {track.duration > 0 && (
              <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
            )}
            {track.explicit_lyrics && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">E</Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onPreview(track)}
            disabled={!track.preview}
            aria-label="Preview"
          >
            <Play className="h-4 w-4" />
          </Button>

          {channels.length > 0 && (
            <div className="relative group/add">
              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Add to channel">
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
              {/* Channel dropdown on hover */}
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
  );
}

export function RecommendationsFeed({
  recommendations,
  channels,
  total,
  page,
  totalPages,
}: RecommendationsFeedProps) {
  const router = useRouter();
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);

  const grouped = useMemo(() => groupByDate(recommendations), [recommendations]);

  function handlePreview(track: DeezerTrack) {
    if (!track.preview) return;
    setCurrentTrack({
      title: track.title,
      artist: track.artist.name,
      previewUrl: track.preview,
      coverUrl: track.album?.cover_medium,
    });
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Radio className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="font-medium">No recommendations yet</p>
          <p className="text-sm text-muted-foreground">
            Set your music preferences to get personalized track suggestions
          </p>
          <Link href="/preferences" className="mt-4">
            <Button size="sm">Set Preferences</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        {total} recommendation{total !== 1 ? "s" : ""} total
      </p>

      {/* Grouped by date */}
      {Object.entries(grouped).map(([date, recs]) => (
        <div key={date} className="space-y-2">
          <CardHeader className="px-0 py-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{date}</CardTitle>
          </CardHeader>
          {recs.map((rec) => (
            <TrackCard
              key={rec.id}
              recommendation={rec}
              channels={channels}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => router.push(`/recommendations?page=${page - 1}`)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => router.push(`/recommendations?page=${page + 1}`)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <MusicPlayer
        track={currentTrack}
        onClose={() => setCurrentTrack(null)}
      />
    </div>
  );
}
