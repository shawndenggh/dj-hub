import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { channelSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channel = await prisma.channel.findUnique({
      where: { id: params.id },
      include: { tracks: true, _count: { select: { tracks: true } } },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.userId !== session.user.id && !channel.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: channel });
  } catch (error) {
    console.error("[GET_CHANNEL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    const result = channelSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.channel.update({
      where: { id: params.id },
      data: result.data,
    });

    return NextResponse.json({ data: updated, message: "Channel updated" });
  } catch (error) {
    console.error("[UPDATE_CHANNEL]", error);
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

    await prisma.channel.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Channel deleted" });
  } catch (error) {
    console.error("[DELETE_CHANNEL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
