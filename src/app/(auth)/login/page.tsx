import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Music } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your DJ Hub account",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center space-x-2">
          <Music className="h-8 w-8 text-primary" />
          <span className="font-bold text-2xl">DJ Hub</span>
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-1">Sign in to your account to continue</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
