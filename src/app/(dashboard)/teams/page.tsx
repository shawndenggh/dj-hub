import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Teams" };

export default async function TeamsPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  const isEnterprise = subscription?.plan === "ENTERPRISE";

  const teams = isEnterprise
    ? await prisma.team.findMany({
        where: { members: { some: { userId: session.user.id } } },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-1">Collaborate with your crew</p>
        </div>
        {isEnterprise && (
          <Button asChild>
            <Link href="/teams/new">
              <UserPlus className="h-4 w-4 mr-2" />
              New Team
            </Link>
          </Button>
        )}
      </div>

      {!isEnterprise ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="font-semibold flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Enterprise Feature
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Team collaboration is available on the Enterprise plan. Invite
                your crew, manage roles, and work together.
              </p>
            </div>
            <Link href="/pricing">
              <Button size="sm">Upgrade to Enterprise</Button>
            </Link>
          </CardContent>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium">No teams yet</p>
            <p className="text-sm text-muted-foreground">Create your first team to start collaborating</p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/teams/new">Create Team</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const myRole = team.members.find((m) => m.userId === session.user.id)?.role;
            return (
              <Card key={team.id} className="hover:border-primary/30 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{team.name}</CardTitle>
                    {myRole && (
                      <Badge variant={myRole === "OWNER" ? "default" : "secondary"} className="text-xs">
                        {myRole}
                      </Badge>
                    )}
                  </div>
                  {team.description && (
                    <CardDescription>{team.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                    </span>
                    <span>{new Date(team.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
