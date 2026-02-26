"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Crown, Palette } from "lucide-react";

interface BrandingData {
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  customDomain?: string | null;
  brandName?: string | null;
  tagline?: string | null;
}

export function BrandingForm({ isEnterprise }: { isEnterprise: boolean }) {
  const [form, setForm] = useState<BrandingData>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => r.json())
      .then((d) => { if (d.data) setForm(d.data); })
      .finally(() => setFetching(false));
  }, []);

  function update(key: keyof BrandingData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Branding saved!", description: "Your brand settings have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save branding.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (!isEnterprise) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              Enterprise Feature
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Custom branding is available on the Enterprise plan.
            </p>
          </div>
          <Button asChild size="sm">
            <a href="/pricing">Upgrade to Enterprise</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Identity
          </CardTitle>
          <CardDescription>
            Customize how your DJ Hub looks to your audience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="My DJ Studio"
                value={form.brandName ?? ""}
                onChange={(e) => update("brandName", e.target.value)}
                disabled={fetching}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="The world's best DJ sets"
                value={form.tagline ?? ""}
                onChange={(e) => update("tagline", e.target.value)}
                disabled={fetching}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              placeholder="https://example.com/logo.png"
              value={form.logoUrl ?? ""}
              onChange={(e) => update("logoUrl", e.target.value)}
              disabled={fetching}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor ?? "#7c3aed"}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="h-9 w-12 rounded border border-input cursor-pointer"
                  disabled={fetching}
                />
                <Input
                  id="primaryColor"
                  placeholder="#7c3aed"
                  value={form.primaryColor ?? ""}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  disabled={fetching}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor ?? "#06b6d4"}
                  onChange={(e) => update("accentColor", e.target.value)}
                  className="h-9 w-12 rounded border border-input cursor-pointer"
                  disabled={fetching}
                />
                <Input
                  id="accentColor"
                  placeholder="#06b6d4"
                  value={form.accentColor ?? ""}
                  onChange={(e) => update("accentColor", e.target.value)}
                  disabled={fetching}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="customDomain">Custom Domain</Label>
            <Input
              id="customDomain"
              placeholder="djstudio.example.com"
              value={form.customDomain ?? ""}
              onChange={(e) => update("customDomain", e.target.value)}
              disabled={fetching}
            />
            <p className="text-xs text-muted-foreground">
              Point your domain&apos;s CNAME to our servers after saving.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading || fetching}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Branding
      </Button>
    </form>
  );
}
