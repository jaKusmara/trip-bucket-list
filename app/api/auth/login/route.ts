import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  comparePassword,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatné vstupné údaje." },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Nesprávne meno alebo heslo." },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Nesprávne meno alebo heslo." },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      message: "Prihlásenie úspešné.",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    return NextResponse.json(
      { error: "Nastala chyba servera." },
      { status: 500 }
    );
  }
}