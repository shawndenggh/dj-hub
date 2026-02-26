import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/stats-card";
import Link from "next/link";
import { Radio, Music, TrendingUp, BarChart3, Star } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getAuthSession();

  const [subscription, channelCount, recommendationCount, monthlyRecommendationCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: session!.user.id } }),
    prisma.channel.count({ where: { userId: session!.user.id } }),
    prisma.recommendation.count({ where: { userId: session!.user.id } }),
    prisma.recommendation.count({
      where: {
        userId: session!.user.id,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ]);

  const plan = (subscription?.plan ?? "FREE") as keyof typeof PLANS;
  const planDetails = PLANS[plan];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session?.user.name?.split(" ")[0] ?? "DJ"}!
          </p>
        </div>
        <Badge variant={plan === "FREE" ? "secondary" : "default"} className="text-sm px-3 py-1">
          {planDetails.name} Plan
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="My Channels"
          value={channelCount}
          description={
            planDetails.limits.channels === -1
              ? "Unlimited channels"
              : `${channelCount} / ${planDetails.limits.channels} used`
          }
          progress={
            planDetails.limits.channels === -1
              ? undefined
              : Math.min(100, Math.round((channelCount / planDetails.limits.channels) * 100))
          }
          progressLabel={
            planDetails.limits.channels !== -1
              ? `${planDetails.limits.channels - channelCount} remaining`
              : undefined
          }
          icon={<Radio className="h-4 w-4" />}
        />
        <StatsCard
          title="This Month"
          value={monthlyRecommendationCount}
          description={
            planDetails.limits.recommendations === -1
              ? "Unlimited recommendations"
              : `of ${planDetails.limits.recommendations}/mo`
          }
          progress={
            planDetails.limits.recommendations === -1
              ? undefined
              : Math.min(
                  100,
                  Math.round(
                    (monthlyRecommendationCount / planDetails.limits.recommendations) * 100
                  )
                )
          }
          progressLabel={
            planDetails.limits.recommendations !== -1
              ? `${Math.max(0, planDetails.limits.recommendations - monthlyRecommendationCount)} quota remaining`
              : undefined
          }
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Discoveries"
          value={recommendationCount}
          description="All-time tracks discovered"
          icon={<Music className="h-4 w-4" />}
        />
        <StatsCard
          title="Current Plan"
          value={planDetails.name}
          description={
            plan === "FREE"
              ? "Upgrade for more features"
              : plan === "PRO"
                ? "Pro features unlocked"
                : "Full enterprise access"
          }
          icon={<Star className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Get Recommendations
            </CardTitle>
            <CardDescription>
              Discover new tracks based on your music preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/preferences">
              <Button className="w-full">Set Preferences & Get Tracks</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Manage Channels
            </CardTitle>
            <CardDescription>
              Organize your curated music into themed channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/channels">
              <Button variant="outline" className="w-full">View My Channels</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Banner (only for free users) */}
      {plan === "FREE" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="font-semibold">Upgrade to Pro</p>
              <p className="text-sm text-muted-foreground">
                Unlock unlimited channels, 500 recommendations/month, and Deezer integration.
              </p>
            </div>
            <Link href="/pricing">
              <Button size="sm">Upgrade Now</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
