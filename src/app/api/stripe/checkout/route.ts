import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, createStripeCustomer, createCheckoutSession, PLANS } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    if (!plan || !["PRO", "ENTERPRISE"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planConfig = PLANS[plan as "PRO" | "ENTERPRISE"];
    if (!planConfig.priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await createStripeCustomer(user.email!, user.name ?? undefined);
      customerId = customer.id;

      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          stripeCustomerId: customerId,
          plan: "FREE",
          status: "active",
        },
        update: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await createCheckoutSession({
      customerId,
      priceId: planConfig.priceId,
      userId: session.user.id,
      successUrl: absoluteUrl("/dashboard?upgraded=true"),
      cancelUrl: absoluteUrl("/pricing"),
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
