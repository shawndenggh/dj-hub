import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json({ data: null });
    }

    const plan = (subscription.plan ?? "FREE") as keyof typeof PLANS;
    const planDetails = PLANS[plan];

    return NextResponse.json({
      data: {
        ...subscription,
        planDetails,
      },
    });
  } catch (error) {
    console.error("[GET_SUBSCRIPTION]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
