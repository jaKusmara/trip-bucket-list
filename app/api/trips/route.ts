import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const createTripSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional().or(z.literal("")),
  eventDate: z.string().optional().or(z.literal("")),
  visibleUserIds: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const parsed = createTripSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatné vstupné údaje." },
        { status: 400 }
      );
    }

    const { title, description, eventDate, visibleUserIds } = parsed.data;

    const uniqueUserIds = Array.from(new Set(visibleUserIds));

    if (!uniqueUserIds.includes(session.userId)) {
      uniqueUserIds.push(session.userId);
    }

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: uniqueUserIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (users.length !== uniqueUserIds.length) {
      return NextResponse.json(
        { error: "Niektorí používatelia neexistujú." },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        title,
        description: description || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        creatorId: session.userId,
        visibility: {
          create: uniqueUserIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        visibility: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Výlet bol vytvorený.",
      trip,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Neprihlásený používateľ." },
        { status: 401 }
      );
    }

    console.error("CREATE_TRIP_ERROR", error);

    return NextResponse.json(
      { error: "Nastala chyba servera." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await requireAuth();

    const trips = await prisma.trip.findMany({
      where: {
        visibility: {
          some: {
            userId: session.userId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        visibility: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });

    return NextResponse.json({ trips });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Neprihlásený používateľ." },
        { status: 401 }
      );
    }

    console.error("GET_TRIPS_ERROR", error);

    return NextResponse.json(
      { error: "Nastala chyba servera." },
      { status: 500 }
    );
  }
}