import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";
import { parseJsonField } from "@/lib/utils";

function buildM3U(
  tracks: Array<{ title: string; artist: string; duration: number; previewUrl: string | null }>
): string {
  const lines = ["#EXTM3U"];
  for (const t of tracks) {
    lines.push(`#EXTINF:${t.duration ?? -1},${t.artist} - ${t.title}`);
    lines.push(t.previewUrl ?? "");
  }
  return lines.join("\n");
}

function buildSpotifyLinks(
  tracks: Array<{ title: string; artist: string }>
): string {
  return tracks
    .map(
      (t) =>
        `https://open.spotify.com/search/${encodeURIComponent(`${t.artist} ${t.title}`)}`
    )
    .join("\n");
}

function buildAppleMusicLinks(
  tracks: Array<{ title: string; artist: string }>
): string {
  return tracks
    .map(
      (t) =>
        `https://music.apple.com/search?term=${encodeURIComponent(`${t.artist} ${t.title}`)}`
    )
    .join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Require Pro or Enterprise plan for export
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    const plan = (subscription?.plan ?? "FREE") as keyof typeof PLANS;
    if (plan === "FREE") {
      return NextResponse.json(
        {
          error: "Playlist export requires a Pro or Enterprise plan.",
          code: "UPGRADE_REQUIRED",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { channelId, format = "m3u" } = body as {
      channelId: string;
      format?: "m3u" | "spotify" | "apple";
    };

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    const channel = await prisma.channel.findFirst({
      where: { id: channelId, userId: session.user.id },
      include: { tracks: true },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Collect tracks from the Channel's Track relation
    const tracksData: Array<{
      title: string;
      artist: string;
      duration: number;
      previewUrl: string | null;
    }> = channel.tracks.map((t) => ({
      title: t.title,
      artist: t.artist,
      duration: t.duration ?? 0,
      previewUrl: t.previewUrl,
    }));

    if (tracksData.length === 0) {
      const ids = parseJsonField<(string | number)[]>(channel.trackIds, []);
      if (ids.length > 0) {
        return NextResponse.json(
          { error: "No track details found. Add tracks to the channel first." },
          { status: 422 }
        );
      }
      return NextResponse.json({ error: "Channel has no tracks" }, { status: 422 });
    }

    const filename = `${channel.name.replace(/[^a-z0-9]/gi, "_")}_playlist`;

    if (format === "spotify") {
      const content = buildSpotifyLinks(tracksData);
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}_spotify.txt"`,
        },
      });
    }

    if (format === "apple") {
      const content = buildAppleMusicLinks(tracksData);
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}_apple.txt"`,
        },
      });
    }

    // Default: m3u
    const content = buildM3U(tracksData);
    return new NextResponse(content, {
      headers: {
        "Content-Type": "audio/x-mpegurl; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.m3u"`,
      },
    });
  } catch (error) {
    console.error("[EXPORT_PLAYLIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
