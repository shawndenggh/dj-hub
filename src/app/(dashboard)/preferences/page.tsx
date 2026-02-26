import type { Metadata } from "next";
import { PreferencesForm } from "@/components/dashboard/preferences-form";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonField } from "@/lib/utils";

export const metadata: Metadata = { title: "Music Preferences" };

export default async function PreferencesPage() {
  const session = await getAuthSession();

  const preferences = await prisma.preference.findUnique({
    where: { userId: session!.user.id },
  });

  const defaultValues = preferences
    ? {
        genres: parseJsonField<string[]>(preferences.genres, []),
        bpm: parseJsonField<{ min: number; max: number }>(preferences.bpm, { min: 120, max: 160 }),
        energy: parseJsonField<{ min: number; max: number }>(preferences.energy, { min: 0, max: 1 }),
        danceability: parseJsonField<{ min: number; max: number }>(preferences.danceability, {
          min: 0,
          max: 1,
        }),
        excludeExplicit: preferences.excludeExplicit,
        language: preferences.language,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Music Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Configure your DJ style preferences to get better recommendations
        </p>
      </div>
      <PreferencesForm defaultValues={defaultValues} />
    </div>
  );
}
