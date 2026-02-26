import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    // Always return 200 to prevent user enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "If an account exists, a reset link was sent." });
    }

    // Delete any existing password-reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: `password-reset:${email}` },
    });

    // Generate a secure token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: `password-reset:${email}`,
        token,
        expires,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password/${token}`;

    // In production, send an email here. For now, log the URL.
    if (process.env.NODE_ENV === "development") {
      console.log(`[Password Reset] URL for ${email}: ${resetUrl}`);
    }

    // TODO: integrate with an email provider (e.g. Resend, SendGrid):
    // await sendEmail({ to: email, subject: "Reset your password", resetUrl });

    return NextResponse.json({ message: "If an account exists, a reset link was sent." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    console.error("[forgot-password]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
