import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Radio, Music, Zap, TrendingUp } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getAuthSession();

  const [subscription, channelCount, recommendationCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: session!.user.id } }),
    prisma.channel.count({ where: { userId: session!.user.id } }),
    prisma.recommendation.count({ where: { userId: session!.user.id } }),
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Channels</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelCount}</div>
            <p className="text-xs text-muted-foreground">
              {planDetails.limits.channels === -1
                ? "Unlimited channels"
                : `${channelCount} / ${planDetails.limits.channels} channels`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendationCount}</div>
            <p className="text-xs text-muted-foreground">Total tracks discovered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planDetails.name}</div>
            <p className="text-xs text-muted-foreground">
              {planDetails.limits.recommendations === -1
                ? "Unlimited recommendations"
                : `${planDetails.limits.recommendations}/mo recommendations`}
            </p>
          </CardContent>
        </Card>
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
