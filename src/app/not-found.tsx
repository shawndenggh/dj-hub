import Link from "next/link";
import { Music2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Music2 className="h-10 w-10 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <h1 className="text-6xl font-bold tracking-tight">404</h1>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="max-w-md text-muted-foreground">
          Looks like this track got lost in the mix. The page you&apos;re
          looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Back to Home
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-md border px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
