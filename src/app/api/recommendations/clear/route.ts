import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/recommendations/clear
 *
 * Query params:
 *   - channelId (optional) – reserved for future use when Recommendation gains a channelId field.
 *     Currently clears all recommendations for the authenticated user regardless.
 *
 * Returns: { deleted: number }
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    // Build where clause for the user's recommendations.
    const where = {
      userId: session.user.id,
    };

    // If channelId is supplied, attempt to scope the deletion to tracks belonging
    // to that channel (matched via stored trackData JSON).  Because Recommendation
    // does not have a direct channelId FK today, we find Track.deezerId values for
    // the channel and filter via a subquery using raw prisma.
    if (channelId) {
      // Verify the channel belongs to the user
      const channel = await prisma.channel.findFirst({
        where: { id: channelId, userId: session.user.id },
        select: { id: true },
      });
      if (!channel) {
        return NextResponse.json({ error: "Channel not found" }, { status: 404 });
      }
      // Get deezerIds for tracks in this channel
      const tracks = await prisma.track.findMany({
        where: { channelId },
        select: { deezerId: true },
      });
      const deezerIds = tracks.map((t) => t.deezerId);

      if (deezerIds.length === 0) {
        return NextResponse.json({ deleted: 0 });
      }

      // Load all user recommendations and filter in-app by stored trackData.id
      const allRecs = await prisma.recommendation.findMany({
        where: { userId: session.user.id },
        select: { id: true, trackData: true },
      });

      const toDelete = allRecs
        .filter((r) => {
          try {
            const td = JSON.parse(r.trackData) as { id?: number | string };
            return td.id != null && deezerIds.includes(String(td.id));
          } catch {
            return false;
          }
        })
        .map((r) => r.id);

      if (toDelete.length === 0) {
        return NextResponse.json({ deleted: 0 });
      }

      const { count } = await prisma.recommendation.deleteMany({
        where: { id: { in: toDelete } },
      });
      return NextResponse.json({ deleted: count });
    }

    // No channelId – delete all recommendations for the user
    const { count } = await prisma.recommendation.deleteMany({ where });
    return NextResponse.json({ deleted: count });
  } catch (error) {
    console.error("[CLEAR_RECOMMENDATIONS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
