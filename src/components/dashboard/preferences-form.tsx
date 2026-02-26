"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { preferenceSchema, type PreferenceInput } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Plus, Music } from "lucide-react";

const GENRE_SUGGESTIONS = [
  "house", "techno", "trance", "drum-and-bass", "dubstep", "electro",
  "deep-house", "progressive", "ambient", "minimal", "hardstyle",
  "pop", "hip-hop", "r&b", "funk", "soul", "disco",
];

interface PreferencesFormProps {
  defaultValues?: Partial<PreferenceInput>;
}

export function PreferencesForm({ defaultValues }: PreferencesFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [genres, setGenres] = useState<string[]>(defaultValues?.genres ?? []);
  const [newGenre, setNewGenre] = useState("");
  const { toast } = useToast();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PreferenceInput>({
    resolver: zodResolver(preferenceSchema),
    defaultValues: {
      genres: defaultValues?.genres ?? [],
      bpm: defaultValues?.bpm ?? { min: 120, max: 160 },
      energy: defaultValues?.energy ?? { min: 0.5, max: 1.0 },
      danceability: defaultValues?.danceability ?? { min: 0.5, max: 1.0 },
      excludeExplicit: defaultValues?.excludeExplicit ?? false,
      language: defaultValues?.language ?? "any",
    },
  });

  const excludeExplicit = watch("excludeExplicit");

  function addGenre(genre: string) {
    const normalized = genre.toLowerCase().trim();
    if (normalized && !genres.includes(normalized)) {
      const updated = [...genres, normalized];
      setGenres(updated);
      setValue("genres", updated);
    }
    setNewGenre("");
  }

  function removeGenre(genre: string) {
    const updated = genres.filter((g) => g !== genre);
    setGenres(updated);
    setValue("genres", updated);
  }

  async function onSubmit(data: PreferenceInput) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, genres }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save");
      }

      toast({ title: "Preferences saved!", description: "Your music preferences have been updated." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save preferences.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function fetchRecommendations() {
    setIsFetching(true);
    try {
      const res = await fetch("/api/recommendations?limit=20");
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "LIMIT_REACHED") {
          toast({
            title: "Limit reached",
            description: data.error,
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error);
      }

      toast({
        title: `Found ${data.data?.length ?? 0} tracks!`,
        description: "Check the recommendations from Deezer.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch recommendations.",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Genres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Music Genres</CardTitle>
          <CardDescription>Select the genres you mix or want to discover</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {genres.map((genre) => (
              <Badge key={genre} variant="default" className="gap-1">
                {genre}
                <button type="button" onClick={() => removeGenre(genre)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add genre..."
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addGenre(newGenre);
                }
              }}
            />
            <Button type="button" variant="outline" onClick={() => addGenre(newGenre)} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-1">
              {GENRE_SUGGESTIONS.filter((g) => !genres.includes(g)).map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => addGenre(genre)}
                  className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BPM Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">BPM Range</CardTitle>
          <CardDescription>Filter tracks by beats per minute</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min BPM</Label>
              <Input
                type="number"
                min={60}
                max={200}
                {...register("bpm.min", { valueAsNumber: true })}
              />
              {errors.bpm?.min && (
                <p className="text-xs text-destructive">{errors.bpm.min.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Max BPM</Label>
              <Input
                type="number"
                min={60}
                max={200}
                {...register("bpm.max", { valueAsNumber: true })}
              />
              {errors.bpm?.max && (
                <p className="text-xs text-destructive">{errors.bpm.max.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Filters</CardTitle>
          <CardDescription>Control what type of content you see</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Exclude Explicit Content</Label>
              <p className="text-xs text-muted-foreground">Hide tracks with explicit lyrics</p>
            </div>
            <Switch
              checked={excludeExplicit}
              onCheckedChange={(checked) => setValue("excludeExplicit", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isFetching}
          onClick={fetchRecommendations}
        >
          {isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Music className="mr-2 h-4 w-4" />
          )}
          Get Recommendations
        </Button>
      </div>
    </form>
  );
}
