import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBillingPortalSession } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    const portalSession = await createBillingPortalSession(
      subscription.stripeCustomerId,
      absoluteUrl("/settings")
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[STRIPE_PORTAL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
