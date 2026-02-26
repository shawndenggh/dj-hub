import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecommendationsFeed } from "@/components/dashboard/recommendations-feed";

export const metadata: Metadata = { title: "Recommendations" };

const PAGE_SIZE = 20;

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await getAuthSession();

  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  const [recommendations, total, channels] = await Promise.all([
    prisma.recommendation.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prisma.recommendation.count({ where: { userId: session!.user.id } }),
    prisma.channel.findMany({
      where: { userId: session!.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recommendations</h1>
        <p className="text-muted-foreground mt-1">
          Tracks discovered for you, newest first
        </p>
      </div>
      <RecommendationsFeed
        recommendations={recommendations as any}
        channels={channels}
        total={total}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
