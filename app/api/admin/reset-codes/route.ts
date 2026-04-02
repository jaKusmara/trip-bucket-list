import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CodeType } from "@prisma/client";
import { z } from "zod";

const createResetCodeSchema = z.object({
  targetUserId: z.string().min(1),
  expiresInHours: z.number().int().positive().max(168).optional(),
});

function generateCode(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

export async function GET() {
  try {
    await requireAdmin();

    const codes = await prisma.accessCode.findMany({
      where: {
        type: CodeType.PASSWORD_RESET,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            username: true,
          },
        },
        usedBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ codes });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { error: "Neprihlásený používateľ." },
          { status: 401 }
        );
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "Nemáš oprávnenie." },
          { status: 403 }
        );
      }
    }

    console.error("GET_RESET_CODES_ERROR", error);

    return NextResponse.json(
      { error: "Nastala chyba servera." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();

    const body = await request.json();
    const parsed = createResetCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatné vstupné údaje." },
        { status: 400 }
      );
    }

    const { targetUserId, expiresInHours = 24 } = parsed.data;

    const targetUser = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        username: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Používateľ neexistuje." },
        { status: 404 }
      );
    }

    let code = generateCode();

    let existingCode = await prisma.accessCode.findUnique({
      where: { code },
    });

    while (existingCode) {
      code = generateCode();
      existingCode = await prisma.accessCode.findUnique({
        where: { code },
      });
    }

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const resetCode = await prisma.accessCode.create({
      data: {
        code,
        type: CodeType.PASSWORD_RESET,
        createdById: session.userId,
        targetUserId: targetUser.id,
        expiresAt,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Reset kód bol vytvorený.",
      code: resetCode,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { error: "Neprihlásený používateľ." },
          { status: 401 }
        );
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "Nemáš oprávnenie." },
          { status: 403 }
        );
      }
    }

    console.error("CREATE_RESET_CODE_ERROR", error);

    return NextResponse.json(
      { error: "Nastala chyba servera." },
      { status: 500 }
    );
  }
}