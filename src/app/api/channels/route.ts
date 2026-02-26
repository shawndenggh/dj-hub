import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { channelSchema } from "@/lib/validations";
import { PLANS } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const skip = (page - 1) * limit;

    const [channels, total] = await Promise.all([
      prisma.channel.findMany({
        where: { userId: session.user.id },
        include: { _count: { select: { tracks: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.channel.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      data: channels,
      total,
      page,
      limit,
      hasMore: skip + channels.length < total,
    });
  } catch (error) {
    console.error("[GET_CHANNELS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    const plan = (subscription?.plan ?? "FREE") as keyof typeof PLANS;
    const channelLimit = PLANS[plan].limits.channels;

    if (channelLimit !== -1) {
      const channelCount = await prisma.channel.count({
        where: { userId: session.user.id },
      });
      if (channelCount >= channelLimit) {
        return NextResponse.json(
          {
            error: `Channel limit reached. Upgrade to Pro for unlimited channels.`,
            code: "LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const result = channelSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.create({
      data: {
        ...result.data,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ data: channel, message: "Channel created" }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_CHANNEL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
