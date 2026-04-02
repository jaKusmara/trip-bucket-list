import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CodeType } from "@prisma/client";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";

const registerSchema = z.object({
  inviteCode: z.string().min(3).max(50),
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatné vstupné údaje." },
        { status: 400 }
      );
    }

    const { inviteCode, username, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Používateľské meno už existuje." },
        { status: 409 }
      );
    }

    const code = await prisma.accessCode.findUnique({
      where: { code: inviteCode },
    });

    if (!code) {
      return NextResponse.json(
        { error: "Pozývací kód neexistuje." },
        { status: 404 }
      );
    }

    if (code.type !== CodeType.REGISTER) {
      return NextResponse.json(
        { error: "Tento kód nie je registračný." },
        { status: 400 }
      );
    }

    if (code.usedAt) {
      return NextResponse.json(
        { error: "Tento kód už bol použitý." },
        { status: 400 }
      );
    }

    if (code.expiresAt && code.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Platnosť tohto kódu vypršala." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          username,
          passwordHash,
        },
      });

      await tx.accessCode.update({
        where: { id: code.id },
        data: {
          usedAt: new Date(),
          usedById: createdUser.id,
        },
      });

      return createdUser;
    });

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      message: "Registrácia úspešná.",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return NextResponse.json(
      { error: "Nastala chyba servera." },
      { status: 500 }
    );
  }
}