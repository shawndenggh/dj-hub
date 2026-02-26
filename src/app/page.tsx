import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Zap, Globe, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">DJ Hub</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium mb-6 bg-primary/10 text-primary border-primary/20">
            <Zap className="h-3 w-3 mr-1" />
            Powered by Deezer API
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Discover Your Next{" "}
            <span className="text-primary">DJ Set</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered music recommendations tailored to your DJ style. Build channels,
            discover tracks, and elevate your sets with personalized suggestions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Start Free Today
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="px-8">
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to DJ smarter</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Recommendations</h3>
              <p className="text-muted-foreground">
                Get personalized track recommendations based on your genre preferences, BPM range, and energy level.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Channel Management</h3>
              <p className="text-muted-foreground">
                Organize your music into themed channels. Share public channels with the community or keep them private.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Deezer Integration</h3>
              <p className="text-muted-foreground">
                Powered by Deezer&apos;s massive music catalog. Access millions of tracks with metadata, previews, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Music className="h-5 w-5 text-primary" />
            <span className="font-semibold">DJ Hub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DJ Hub. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/login" className="hover:text-foreground">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
