import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
});

async function getTeamAndCheckAccess(teamId: string, userId: string) {
  return prisma.team.findFirst({
    where: {
      id: teamId,
      members: { some: { userId, role: { in: ["OWNER", "ADMIN"] } } },
    },
    include: { members: true },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await prisma.team.findFirst({
    where: {
      id: params.id,
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  return NextResponse.json({ data: team.members });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await getTeamAndCheckAccess(params.id, session.user.id);
  if (!team) {
    return NextResponse.json({ error: "Team not found or insufficient permissions." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, role } = addMemberSchema.parse(body);

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const existing = team.members.find((m) => m.userId === userToAdd.id);
    if (existing) {
      return NextResponse.json({ error: "User is already a member." }, { status: 409 });
    }

    const member = await prisma.teamMember.create({
      data: { teamId: params.id, userId: userToAdd.id, role },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json({ data: member }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error("[teams members POST]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await getTeamAndCheckAccess(params.id, session.user.id);
  if (!team) {
    return NextResponse.json({ error: "Team not found or insufficient permissions." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("userId");
  if (!memberId) {
    return NextResponse.json({ error: "userId query param required." }, { status: 400 });
  }

  // Owners cannot be removed
  const memberToRemove = team.members.find((m) => m.userId === memberId);
  if (!memberToRemove) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }
  if (memberToRemove.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove the team owner." }, { status: 400 });
  }

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId: params.id, userId: memberId } },
  });

  return NextResponse.json({ message: "Member removed." });
}
