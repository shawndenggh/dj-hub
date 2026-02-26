import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BrandingForm } from "./branding-form";

export const metadata: Metadata = { title: "Custom Branding" };

export default async function BrandingPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  const isEnterprise = subscription?.plan === "ENTERPRISE";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Custom Branding</h1>
        <p className="text-muted-foreground mt-1">
          Personalize your DJ Hub with your own brand identity
        </p>
      </div>

      <BrandingForm isEnterprise={isEnterprise} />
    </div>
  );
}
