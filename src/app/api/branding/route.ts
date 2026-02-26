import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const brandingSchema = z.object({
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .nullable(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional()
    .nullable(),
  customDomain: z.string().max(253).optional().nullable(),
  brandName: z.string().max(100).optional().nullable(),
  tagline: z.string().max(200).optional().nullable(),
});

async function requireEnterprise(userId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  return subscription?.plan === "ENTERPRISE";
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const branding = await prisma.brandCustomization.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ data: branding ?? null });
}

export async function PUT(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await requireEnterprise(session.user.id))) {
    return NextResponse.json(
      { error: "Custom branding requires an Enterprise plan." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = brandingSchema.parse(body);

    const branding = await prisma.brandCustomization.upsert({
      where: { userId: session.user.id },
      update: data,
      create: { userId: session.user.id, ...data },
    });

    return NextResponse.json({ data: branding });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error("[branding PUT]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
