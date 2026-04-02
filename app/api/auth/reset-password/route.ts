import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { CodeType } from "@prisma/client";
import { z } from "zod";

const resetPasswordSchema = z.object({
  code: z.string().min(3).max(50),
  newPassword: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatné vstupné údaje." },
        { status: 400 }
      );
    }

    const { code, newPassword } = parsed.data;

    const accessCode = await prisma.accessCode.findUnique({
      where: { code },
      include: {
        targetUser: true,
      },
    });

    if (!accessCode) {
      return NextResponse.json(
        { error: "Reset kód neexistuje." },
        { status: 404 }
      );
    }

    if (accessCode.type !== CodeType.PASSWORD_RESET) {
      return NextResponse.json(
        { error: "Tento kód nie je reset kód." },
        { status: 400 }
      );
    }

    if (accessCode.usedAt) {
      return NextResponse.json(
        { error: "Tento kód už bol použitý." },
        { status: 400 }
      );
    }

    if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Platnosť tohto kódu vypršala." },
        { status: 400 }
      );
    }

    if (!accessCode.targetUserId || !accessCode.targetUser) {
      return NextResponse.json(
        { error: "Tento reset kód nie je naviazaný na používateľa." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: accessCode.targetUserId!,
        },
        data: {
          passwordHash,
        },
      });

      await tx.accessCode.update({
        where: {
          id: accessCode.id,
        },
        data: {
          usedAt: new Date(),
          usedById: accessCode.targetUserId,
        },
      });
    });

    return NextResponse.json({
      message: "Heslo bolo úspešne zmenené.",
    });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR", error);

    return NextResponse.json(
      { error: "Nastala chyba servera." },
      { status: 500 }
    );
  }
}