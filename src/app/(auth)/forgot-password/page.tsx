import type { Metadata } from "next";
import Link from "next/link";
import { Music } from "lucide-react";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your DJ Hub password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center space-x-2">
          <Music className="h-8 w-8 text-primary" />
          <span className="font-bold text-2xl">DJ Hub</span>
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Forgot your password?</h1>
        <p className="text-muted-foreground mt-1">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground mt-4">
        Remember your password?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
