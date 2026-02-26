"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getInitials, formatPrice } from "@/lib/utils";
import { PLANS } from "@/lib/stripe";
import { Loader2, ExternalLink } from "lucide-react";
import type { User, Subscription } from "@prisma/client";

interface SettingsFormProps {
  user: Pick<User, "id" | "name" | "email" | "image" | "createdAt">;
  subscription: Subscription | null;
}

export function SettingsForm({ user, subscription }: SettingsFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { toast } = useToast();

  const plan = (subscription?.plan ?? "FREE") as keyof typeof PLANS;
  const planDetails = PLANS[plan];

  async function handleSaveProfile() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast({ title: "Profile updated!" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBillingPortal() {
    setIsPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error ?? "No portal URL");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not open billing portal. Please try again.",
        variant: "destructive",
      });
      setIsPortalLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you absolutely sure? This will permanently delete your account and all data. This cannot be undone.")) return;
    setIsDeletingAccount(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      window.location.href = "/";
    } catch {
      toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
      setIsDeletingAccount(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email ?? ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription & Billing</CardTitle>
          <CardDescription>Manage your plan and payment details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{planDetails.name} Plan</p>
                <Badge variant={plan === "FREE" ? "secondary" : "default"}>
                  {subscription?.status ?? "active"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {plan === "FREE" ? "Free forever" : `${formatPrice(planDetails.price)}/month`}
              </p>
            </div>
            {plan !== "FREE" && subscription?.stripeCustomerId ? (
              <Button variant="outline" size="sm" onClick={handleBillingPortal} disabled={isPortalLoading}>
                {isPortalLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            ) : (
              <a href="/pricing">
                <Button size="sm">Upgrade</Button>
              </a>
            )}
          </div>

          {subscription?.stripeCurrentPeriodEnd && (
            <p className="text-xs text-muted-foreground">
              Current period ends:{" "}
              {new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
