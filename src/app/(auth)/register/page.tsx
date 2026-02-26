import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import { Music } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your DJ Hub account",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center space-x-2">
          <Music className="h-8 w-8 text-primary" />
          <span className="font-bold text-2xl">DJ Hub</span>
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground mt-1">Start discovering music today. Free forever.</p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
