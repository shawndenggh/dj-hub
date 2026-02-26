import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecommendations } from "@/lib/deezer";
import { parseJsonField } from "@/lib/utils";
import { PLANS } from "@/lib/stripe";
import { scoreAndRankTracks } from "@/lib/recommendation-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

    // Check plan limits for recommendations
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    const plan = (subscription?.plan ?? "FREE") as keyof typeof PLANS;
    const recLimit = PLANS[plan].limits.recommendations;

    if (recLimit !== -1) {
      // Count recommendations this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyCount = await prisma.recommendation.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: startOfMonth },
        },
      });

      if (monthlyCount >= recLimit) {
        return NextResponse.json(
          {
            error: `Monthly recommendation limit reached (${recLimit}). Upgrade for more.`,
            code: "LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }

    // Get user preferences
    const preferences = await prisma.preference.findUnique({
      where: { userId: session.user.id },
    });

    const genres = parseJsonField<string[]>(preferences?.genres ?? "[]", []);
    const bpm = parseJsonField<{ min: number; max: number }>(
      preferences?.bpm ?? "{}",
      { min: 0, max: 0 }
    );

    // Fetch recommendations from Deezer
    const tracks = await getRecommendations({
      genres,
      bpmRange: bpm.min > 0 ? bpm : undefined,
      excludeExplicit: preferences?.excludeExplicit ?? false,
      limit,
    });

    // Collect artist IDs from recently liked recommendations for scoring
    const likedRecs = await prisma.recommendation.findMany({
      where: { userId: session.user.id, liked: true },
      select: { trackData: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    const preferredArtistIds = likedRecs.flatMap((r) => {
      try {
        const td = JSON.parse(r.trackData) as { artist?: { id?: number } };
        return td.artist?.id != null ? [td.artist.id] : [];
      } catch {
        return [];
      }
    });

    // Score and rank the fetched tracks
    const scored = scoreAndRankTracks(tracks, {
      genres,
      bpmRange: bpm.min > 0 ? bpm : undefined,
      preferredArtistIds,
    });

    // Save recommendations to database
    if (scored.length > 0) {
      for (const { track, score } of scored) {
        await prisma.recommendation.create({
          data: {
            userId: session.user.id,
            trackData: JSON.stringify(track),
            score,
          },
        });
      }
    }

    const rankedTracks = scored.map(({ track }) => track);
    return NextResponse.json({ data: rankedTracks, total: rankedTracks.length });
  } catch (error) {
    console.error("[GET_RECOMMENDATIONS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { recommendationId, liked } = body;

    if (!recommendationId || typeof liked !== "boolean") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const recommendation = await prisma.recommendation.findFirst({
      where: { id: recommendationId, userId: session.user.id },
    });

    if (!recommendation) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    const updated = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { liked },
    });

    return NextResponse.json({ data: updated, message: "Feedback saved" });
  } catch (error) {
    console.error("[FEEDBACK_RECOMMENDATION]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
