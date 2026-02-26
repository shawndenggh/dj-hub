import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getAuthSession();

  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { id: true, name: true, email: true, image: true, createdAt: true },
    }),
    prisma.subscription.findUnique({ where: { userId: session!.user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and subscription</p>
      </div>
      <SettingsForm user={user!} subscription={subscription} />
    </div>
  );
}
