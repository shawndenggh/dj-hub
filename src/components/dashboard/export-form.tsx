"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

type Channel = { id: string; name: string; _count: { tracks: number } };
type Format = "m3u" | "spotify" | "apple";

const FORMAT_LABELS: Record<Format, string> = {
  m3u: "M3U Playlist",
  spotify: "Spotify Search Links",
  apple: "Apple Music Search Links",
};

export function ExportForm({
  channels,
  isPro,
}: {
  channels: Channel[];
  isPro: boolean;
}) {
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [format, setFormat] = useState<Format>("m3u");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (!channelId || !isPro) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/playlists/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, format }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Export failed");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `playlist.${format === "m3u" ? "m3u" : "txt"}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-6 space-y-5 max-w-lg">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="channel-select">
          Channel
        </label>
        {channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No channels found.{" "}
            <a href="/channels" className="underline">
              Create one first.
            </a>
          </p>
        ) : (
          <select
            id="channel-select"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            disabled={!isPro}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c._count.tracks} tracks)
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Format</label>
        <div className="flex flex-col gap-2">
          {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="format"
                value={f}
                checked={format === f}
                onChange={() => setFormat(f)}
                disabled={!isPro}
              />
              {FORMAT_LABELS[f]}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        onClick={handleExport}
        disabled={!isPro || !channelId || loading}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {loading ? "Exporting…" : "Export Playlist"}
      </Button>
    </div>
  );
}
