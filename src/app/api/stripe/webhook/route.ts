import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const userId = session.metadata?.userId;

          if (userId) {
            const priceId = subscription.items.data[0]?.price.id;
            const plan = getPlanFromPriceId(priceId);

            await prisma.subscription.upsert({
              where: { userId },
              create: {
                userId,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: new Date(
                  subscription.current_period_end * 1000
                ),
                plan,
                status: subscription.status,
              },
              update: {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: new Date(
                  subscription.current_period_end * 1000
                ),
                plan,
                status: subscription.status,
              },
            });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const plan = getPlanFromPriceId(priceId);

          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              plan,
              status: "active",
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscriptionId },
            data: { status: "past_due" },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            plan,
            status: subscription.status,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: "FREE",
            status: "canceled",
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          },
        });
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("[WEBHOOK] Error processing event:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function getPlanFromPriceId(priceId: string | undefined): string {
  if (!priceId) return "FREE";
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return "ENTERPRISE";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "PRO";
  return "FREE";
}
