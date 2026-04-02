import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();

    const users = await prisma.user.findMany({
      orderBy: {
        username: "asc",
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Neprihlásený používateľ." },
        { status: 401 }
      );
    }

    console.error("GET_USERS_ERROR", error);

    return NextResponse.json(
      { error: "Nastala chyba servera." },
      { status: 500 }
    );
  }
}