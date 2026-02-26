import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChannelsList } from "@/components/dashboard/channels-list";
import { PLANS } from "@/lib/stripe";

export const metadata: Metadata = { title: "My Channels" };

export default async function ChannelsPage() {
  const session = await getAuthSession();

  const [channels, subscription] = await Promise.all([
    prisma.channel.findMany({
      where: { userId: session!.user.id },
      include: { _count: { select: { tracks: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findUnique({ where: { userId: session!.user.id } }),
  ]);

  const plan = (subscription?.plan ?? "FREE") as keyof typeof PLANS;
  const channelLimit = PLANS[plan].limits.channels;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Channels</h1>
        <p className="text-muted-foreground mt-1">
          Organize your curated tracks into themed channels
          {channelLimit !== -1 && ` (${channels.length}/${channelLimit})`}
        </p>
      </div>
      <ChannelsList
        channels={channels as any}
        canCreate={channelLimit === -1 || channels.length < channelLimit}
        plan={plan}
      />
    </div>
  );
}
