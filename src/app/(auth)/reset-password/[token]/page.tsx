import type { Metadata } from "next";
import Link from "next/link";
import { Music } from "lucide-react";
import { ResetPasswordForm } from "./reset-password-form";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set your new DJ Hub password",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  // Validate token exists and is not expired
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      token: params.token,
      identifier: { startsWith: "password-reset:" },
      expires: { gt: new Date() },
    },
  });

  if (!verificationToken) {
    redirect("/forgot-password?error=invalid");
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center space-x-2">
          <Music className="h-8 w-8 text-primary" />
          <span className="font-bold text-2xl">DJ Hub</span>
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Set new password</h1>
        <p className="text-muted-foreground mt-1">Choose a strong password for your account</p>
      </div>
      <ResetPasswordForm token={params.token} />
    </div>
  );
}
