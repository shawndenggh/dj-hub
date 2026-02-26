"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MusicPlayer, type PlayerTrack } from "@/components/music-player";
import { formatDuration } from "@/lib/utils";
import {
  ArrowLeft,
  Radio,
  Music,
  Play,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface Track {
  id: string;
  deezerId: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number | null;
  previewUrl: string | null;
  coverUrl: string | null;
  bpm: number | null;
  genre: string | null;
  createdAt: string;
}

interface Channel {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  isPublic: boolean;
  createdAt: string;
  _count: { tracks: number };
}

const LIMIT = 20;

export default function ChannelDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);

  // Load channel info
  useEffect(() => {
    async function fetchChannel() {
      try {
        const res = await fetch(`/api/channels/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) router.push("/channels");
          return;
        }
        const data = await res.json();
        setChannel(data.data);
      } catch {
        toast({ title: "Error", description: "Failed to load channel.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchChannel();
  }, [params.id, router, toast]);

  // Load tracks with pagination
  const fetchTracks = useCallback(
    async (p: number) => {
      setTracksLoading(true);
      try {
        const res = await fetch(`/api/channels/${params.id}/tracks?page=${p}&limit=${LIMIT}`);
        if (!res.ok) return;
        const data = await res.json();
        setTracks(data.data);
        setTotal(data.total);
        setHasMore(data.hasMore);
      } catch {
        toast({ title: "Error", description: "Failed to load tracks.", variant: "destructive" });
      } finally {
        setTracksLoading(false);
      }
    },
    [params.id, toast]
  );

  useEffect(() => {
    fetchTracks(page);
  }, [fetchTracks, page]);

  async function handleRemoveTrack(trackId: string, title: string) {
    if (!confirm(`Remove "${title}" from this channel?`)) return;
    try {
      const res = await fetch(`/api/channels/${params.id}/tracks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      if (!res.ok) throw new Error();
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      setTotal((prev) => prev - 1);
      setChannel((prev) => prev ? { ...prev, _count: { tracks: prev._count.tracks - 1 } } : prev);
      toast({ title: "Track removed" });
    } catch {
      toast({ title: "Error", description: "Failed to remove track.", variant: "destructive" });
    }
  }

  async function handleClearHistory() {
    if (!confirm("Remove all tracks from this channel? This cannot be undone.")) return;
    setClearing(true);
    try {
      // Remove all tracks one by one via batch approach
      for (const track of tracks) {
        await fetch(`/api/channels/${params.id}/tracks`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackId: track.id }),
        });
      }
      setTracks([]);
      setTotal(0);
      setChannel((prev) => prev ? { ...prev, _count: { tracks: 0 } } : prev);
      toast({ title: "All tracks cleared" });
    } catch {
      toast({ title: "Error", description: "Failed to clear tracks.", variant: "destructive" });
    } finally {
      setClearing(false);
    }
  }

  function handlePreview(track: Track) {
    if (!track.previewUrl) {
      toast({ title: "No preview available", description: "This track has no preview audio." });
      return;
    }
    setCurrentTrack({
      title: track.title,
      artist: track.artist,
      previewUrl: track.previewUrl,
      coverUrl: track.coverUrl ?? undefined,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!channel) return null;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6 pb-24">
      {/* Back */}
      <Link
        href="/channels"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Channels
      </Link>

      {/* Channel Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">{channel.name}</h1>
          </div>
          {channel.description && (
            <p className="text-muted-foreground">{channel.description}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            {channel.genre && (
              <Badge variant="secondary">{channel.genre}</Badge>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {channel.isPublic ? (
                <><Globe className="h-3 w-3" /> Public</>
              ) : (
                <><Lock className="h-3 w-3" /> Private</>
              )}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Music className="h-3 w-3" />
              {total} track{total !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(channel.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {total > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            disabled={clearing}
            className="shrink-0 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
          >
            {clearing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            Clear All Tracks
          </Button>
        )}
      </div>

      {/* Tracks */}
      {tracksLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tracks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Music className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium">No tracks yet</p>
            <p className="text-sm text-muted-foreground">
              Add tracks from recommendations to populate this channel
            </p>
            <Link href="/recommendations" className="mt-4">
              <Button size="sm" variant="outline">Browse Recommendations</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <Card
                key={track.id}
                className="hover:border-primary/30 transition-colors group"
              >
                <CardContent className="flex items-center gap-4 py-3 px-4">
                  {/* Index */}
                  <span className="text-sm text-muted-foreground w-6 text-center shrink-0">
                    {(page - 1) * LIMIT + index + 1}
                  </span>

                  {/* Cover */}
                  {track.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="h-10 w-10 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <Music className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>

                  {/* Meta */}
                  <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    {track.bpm && (
                      <span>{Math.round(track.bpm)} BPM</span>
                    )}
                    {track.duration && (
                      <span>{formatDuration(track.duration)}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handlePreview(track)}
                      disabled={!track.previewUrl}
                      aria-label="Preview"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveTrack(track.id, track.title)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} &mdash; {total} tracks total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Music Player */}
      <MusicPlayer
        track={currentTrack}
        onClose={() => setCurrentTrack(null)}
      />
    </div>
  );
}
