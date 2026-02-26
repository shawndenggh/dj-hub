import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { Users, Radio, Music, CreditCard } from "lucide-react";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    totalChannels,
    totalTracks,
    totalRecommendations,
    planBreakdown,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.channel.count(),
    prisma.track.count(),
    prisma.recommendation.count(),
    prisma.subscription.groupBy({
      by: ["plan"],
      _count: { plan: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true, role: true },
    }),
  ]);

  const planMap = Object.fromEntries(
    planBreakdown.map((p) => [p.plan, p._count.plan])
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and metrics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={totalUsers}
          description="Registered accounts"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Channels"
          value={totalChannels}
          description="Across all users"
          icon={<Radio className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Tracks"
          value={totalTracks}
          description="Saved in channels"
          icon={<Music className="h-4 w-4" />}
        />
        <StatsCard
          title="Recommendations"
          value={totalRecommendations}
          description="AI-generated suggestions"
          icon={<CreditCard className="h-4 w-4" />}
        />
      </div>

      {/* Plan Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["FREE", "PRO", "ENTERPRISE"].map((plan) => {
              const count = planMap[plan] ?? 0;
              const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
              return (
                <div key={plan} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{plan}</span>
                  <span className="text-muted-foreground">
                    {count} users ({pct}%)
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{user.name ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
