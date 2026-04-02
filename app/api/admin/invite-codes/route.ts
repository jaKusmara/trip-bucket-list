import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CodeType } from "@prisma/client";

function generateCode(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

export async function POST() {
  try {
    const session = await requireAdmin();

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

    const inviteCode = await prisma.accessCode.create({
      data: {
        code,
        type: CodeType.REGISTER,
        createdById: session.userId,
      },
    });

    return NextResponse.json({
      message: "Pozývací kód bol vytvorený.",
      code: inviteCode,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Neprihlásený používateľ." }, { status: 401 });
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Nemáš oprávnenie." }, { status: 403 });
      }
    }

    console.error("CREATE_INVITE_CODE_ERROR", error);

    return NextResponse.json(
      { error: "Nastala chyba servera." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await requireAdmin();

    const codes = await prisma.accessCode.findMany({
      where: {
        type: CodeType.REGISTER,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
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
        return NextResponse.json({ error: "Neprihlásený používateľ." }, { status: 401 });
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Nemáš oprávnenie." }, { status: 403 });
      }
    }

    console.error("GET_INVITE_CODES_ERROR", error);

    return NextResponse.json(
      { error: "Nastala chyba servera." },
      { status: 500 }
    );
  }
}