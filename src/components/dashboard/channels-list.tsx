"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Radio, Trash2, Globe, Lock } from "lucide-react";
import type { PlanType } from "@/types";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  isPublic: boolean;
  createdAt: Date;
  _count: { tracks: number };
}

interface ChannelsListProps {
  channels: Channel[];
  canCreate: boolean;
  plan: PlanType;
}

export function ChannelsList({ channels: initialChannels, canCreate, plan }: ChannelsListProps) {
  const [channels, setChannels] = useState(initialChannels);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: "", description: "", genre: "", isPublic: false });
  const { toast } = useToast();
  const router = useRouter();

  async function handleCreate() {
    if (!newChannel.name.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChannel),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      setChannels((prev) => [{ ...data.data, _count: { tracks: 0 } }, ...prev]);
      setNewChannel({ name: "", description: "", genre: "", isPublic: false });
      setShowForm(false);
      toast({ title: "Channel created!", description: `"${data.data.name}" is ready.` });
    } catch {
      toast({ title: "Error", description: "Failed to create channel.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/channels/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setChannels((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Channel deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete channel.", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <div className="flex justify-between items-center">
        {canCreate ? (
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Channel
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Channel limit reached.{" "}
            <a href="/pricing" className="text-primary hover:underline">Upgrade</a> for unlimited.
          </p>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">New Channel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Late Night Techno"
                value={newChannel.name}
                onChange={(e) => setNewChannel((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                placeholder="Optional description..."
                value={newChannel.description}
                onChange={(e) => setNewChannel((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Genre</Label>
              <Input
                placeholder="e.g. house, techno, trance"
                value={newChannel.genre}
                onChange={(e) => setNewChannel((p) => ({ ...p, genre: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={isCreating || !newChannel.name.trim()} size="sm">
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channels Grid */}
      {channels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Radio className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium">No channels yet</p>
            <p className="text-sm text-muted-foreground">Create your first channel to start organizing tracks</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <Card key={channel.id} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{channel.name}</CardTitle>
                    {channel.genre && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {channel.genre}
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(channel.id, channel.name)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {channel.description && (
                  <CardDescription className="text-xs mb-3">{channel.description}</CardDescription>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{channel._count.tracks} tracks</span>
                  <span className="flex items-center gap-1">
                    {channel.isPublic ? (
                      <><Globe className="h-3 w-3" /> Public</>
                    ) : (
                      <><Lock className="h-3 w-3" /> Private</>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
