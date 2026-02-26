import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ExportForm } from "@/components/dashboard/export-form";

export const metadata: Metadata = { title: "Export Playlist" };

export default async function ExportPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  const isPro = subscription?.plan === "PRO" || subscription?.plan === "ENTERPRISE";

  const channels = await prisma.channel.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, _count: { select: { tracks: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Export Playlist</h1>
        <p className="text-muted-foreground mt-1">
          Download your channel tracks in your preferred format.
        </p>
      </div>

      {!isPro && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          <p className="font-medium">Pro feature</p>
          <p className="text-sm mt-1">
            Playlist export is available on the Pro and Enterprise plans.{" "}
            <a href="/pricing" className="underline font-medium">
              Upgrade now
            </a>
          </p>
        </div>
      )}

      <ExportForm channels={channels} isPro={isPro} />
    </div>
  );
}
