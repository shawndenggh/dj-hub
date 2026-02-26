import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { BarChart3, Users, Music, TrendingUp } from "lucide-react";

export const metadata: Metadata = { title: "Platform Analytics" };

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    newUsersLast30,
    newUsersLast7,
    totalUsers,
    newRecsLast30,
    totalRecs,
    topGenres,
    subscriptionStats,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count(),
    prisma.recommendation.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.recommendation.count(),
    prisma.track.groupBy({
      by: ["genre"],
      _count: { genre: true },
      where: { genre: { not: null } },
      orderBy: { _count: { genre: "desc" } },
      take: 10,
    }),
    prisma.subscription.groupBy({
      by: ["plan", "status"],
      _count: { plan: true },
    }),
  ]);

  const activeByPlan = subscriptionStats.filter((s) => s.status === "active");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">Usage metrics and trends</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="New Users (30d)"
          value={newUsersLast30}
          description={`${newUsersLast7} in the last 7 days`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Users"
          value={totalUsers}
          description="All time"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Recommendations (30d)"
          value={newRecsLast30}
          description={`${totalRecs} all time`}
          icon={<Music className="h-4 w-4" />}
        />
        <StatsCard
          title="Avg. Recs/User"
          value={totalUsers > 0 ? Math.round(totalRecs / totalUsers) : 0}
          description="Lifetime average"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Active Subscriptions by Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeByPlan.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active subscriptions</p>
            ) : (
              activeByPlan.map((s) => (
                <div key={s.plan} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.plan}</span>
                  <span className="text-muted-foreground">{s._count.plan} active</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Genres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Top Genres in Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topGenres.length === 0 ? (
              <p className="text-sm text-muted-foreground">No genre data yet</p>
            ) : (
              topGenres.map((g) => (
                <div key={g.genre} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{g.genre}</span>
                  <span className="text-muted-foreground">{g._count.genre} tracks</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
