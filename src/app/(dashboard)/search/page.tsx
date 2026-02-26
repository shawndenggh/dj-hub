import type { Metadata } from "next";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchTracks } from "@/lib/deezer";
import { TrackCard } from "@/components/track-card";
import { SearchForm } from "./search-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";

export const metadata: Metadata = { title: "Search" };

const PAGE_SIZE = 25;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await getAuthSession();

  const query = searchParams.q?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const offset = (page - 1) * PAGE_SIZE;

  const [channels, searchResult] = await Promise.all([
    prisma.channel.findMany({
      where: { userId: session!.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    query
      ? searchTracks(query, { limit: PAGE_SIZE, index: offset }).catch(() => null)
      : null,
  ]);

  const tracks = searchResult?.data ?? [];
  const total = searchResult?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground mt-1">
          Find tracks by title, artist, or genre
        </p>
      </div>

      {/* Search Form */}
      <SearchForm defaultValue={query} />

      {/* Results */}
      {query && (
        <div className="space-y-4">
          {tracks.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                {total.toLocaleString()} result{total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </p>

              <div className="space-y-2">
                {tracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={{
                      id: track.id,
                      title: track.title,
                      artist: track.artist,
                      album: track.album,
                      duration: track.duration,
                      preview: track.preview,
                      bpm: track.bpm,
                      explicit_lyrics: track.explicit_lyrics,
                    }}
                    channels={channels}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
                      aria-disabled={page === 1}
                    >
                      <Button variant="outline" size="sm" disabled={page === 1}>
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                    </Link>
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
                      aria-disabled={page >= totalPages}
                    >
                      <Button variant="outline" size="sm" disabled={page >= totalPages}>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SearchX className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium">No results found</p>
              <p className="text-sm text-muted-foreground">
                Try a different search term or check your spelling
              </p>
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <p className="text-sm">Enter a search term to find tracks</p>
        </div>
      )}
    </div>
  );
}
