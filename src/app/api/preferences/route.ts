import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { preferenceSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.preference.findUnique({
      where: { userId: session.user.id },
    });

    if (!preferences) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({
      data: {
        ...preferences,
        genres: JSON.parse(preferences.genres),
        bpm: JSON.parse(preferences.bpm),
        energy: JSON.parse(preferences.energy),
        danceability: JSON.parse(preferences.danceability),
      },
    });
  } catch (error) {
    console.error("[GET_PREFERENCES]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = preferenceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { genres, bpm, energy, danceability, excludeExplicit, language } = result.data;

    const preferences = await prisma.preference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        genres: JSON.stringify(genres),
        bpm: JSON.stringify(bpm),
        energy: JSON.stringify(energy),
        danceability: JSON.stringify(danceability),
        excludeExplicit,
        language,
      },
      update: {
        genres: JSON.stringify(genres),
        bpm: JSON.stringify(bpm),
        energy: JSON.stringify(energy),
        danceability: JSON.stringify(danceability),
        excludeExplicit,
        language,
      },
    });

    return NextResponse.json({
      data: {
        ...preferences,
        genres: JSON.parse(preferences.genres),
        bpm: JSON.parse(preferences.bpm),
        energy: JSON.parse(preferences.energy),
        danceability: JSON.parse(preferences.danceability),
      },
      message: "Preferences saved",
    });
  } catch (error) {
    console.error("[UPDATE_PREFERENCES]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
