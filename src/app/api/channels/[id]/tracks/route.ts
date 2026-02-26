import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addTrackSchema = z.object({
  deezerId: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  album: z.string().optional(),
  duration: z.number().optional(),
  previewUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  bpm: z.number().optional(),
  energy: z.number().optional(),
  danceability: z.number().optional(),
  genre: z.string().optional(),
});

const deleteTrackSchema = z.object({
  trackId: z.string().min(1),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channel = await prisma.channel.findUnique({ where: { id: params.id } });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    if (channel.userId !== session.user.id && !channel.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const [tracks, total] = await Promise.all([
      prisma.track.findMany({
        where: { channelId: params.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.track.count({ where: { channelId: params.id } }),
    ]);

    return NextResponse.json({
      data: tracks,
      total,
      page,
      limit,
      hasMore: skip + tracks.length < total,
    });
  } catch (error) {
    console.error("[GET_CHANNEL_TRACKS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channel = await prisma.channel.findUnique({ where: { id: params.id } });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    if (channel.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = addTrackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Upsert: if track already exists by deezerId, reassign it to this channel
    const track = await prisma.track.upsert({
      where: { deezerId: result.data.deezerId },
      update: { channelId: params.id },
      create: { ...result.data, channelId: params.id },
    });

    return NextResponse.json({ data: track, message: "Track added to channel" }, { status: 201 });
  } catch (error) {
    console.error("[ADD_TRACK_TO_CHANNEL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channel = await prisma.channel.findUnique({ where: { id: params.id } });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    if (channel.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = deleteTrackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const track = await prisma.track.findFirst({
      where: { id: result.data.trackId, channelId: params.id },
    });
    if (!track) {
      return NextResponse.json({ error: "Track not found in this channel" }, { status: 404 });
    }

    // Detach track from channel instead of deleting it
    await prisma.track.update({
      where: { id: result.data.trackId },
      data: { channelId: null },
    });

    return NextResponse.json({ message: "Track removed from channel" });
  } catch (error) {
    console.error("[DELETE_TRACK_FROM_CHANNEL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
