import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { TripResponseStatus } from "@prisma/client";
import { z } from "zod";

const responseSchema = z.object({
  status: z.nativeEnum(TripResponseStatus),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id: tripId } = await context.params;

    const body = await request.json();
    const parsed = responseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná reakcia." },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        visibility: {
          some: {
            userId: session.userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Výlet neexistuje alebo k nemu nemáš prístup." },
        { status: 404 }
      );
    }

    const response = await prisma.tripResponse.upsert({
      where: {
        tripId_userId: {
          tripId,
          userId: session.userId,
        },
      },
      update: {
        status: parsed.data.status,
      },
      create: {
        tripId,
        userId: session.userId,
        status: parsed.data.status,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Reakcia bola uložená.",
      response,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Neprihlásený používateľ." },
        { status: 401 }
      );
    }

    console.error("TRIP_RESPONSE_ERROR", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Nastala chyba servera.",
      },
      { status: 500 }
    );
  }
}