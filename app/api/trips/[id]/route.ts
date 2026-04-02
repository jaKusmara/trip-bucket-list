import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const updateTripSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional().or(z.literal("")),
  eventDate: z.string().optional().or(z.literal("")),
  visibleUserIds: z.array(z.string()).min(1),
});

async function getTripForManagement(
  tripId: string,
  userId: string,
  role: "ADMIN" | "MEMBER"
) {
  if (role === "ADMIN") {
    return prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        creatorId: true,
      },
    });
  }

  return prisma.trip.findFirst({
    where: {
      id: tripId,
      visibility: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      creatorId: true,
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id: tripId } = await context.params;

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        visibility: {
          some: {
            userId: session.userId,
          },
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
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Výlet neexistuje alebo k nemu nemáš prístup." },
        { status: 404 }
      );
    }

    return NextResponse.json({ trip });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Neprihlásený používateľ." },
        { status: 401 }
      );
    }

    console.error("GET_TRIP_ERROR", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Nastala chyba servera.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id: tripId } = await context.params;

    const body = await request.json();
    const parsed = updateTripSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatné vstupné údaje." },
        { status: 400 }
      );
    }

    const existingTrip = await getTripForManagement(
      tripId,
      session.userId,
      session.role
    );

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Výlet neexistuje alebo k nemu nemáš prístup." },
        { status: 404 }
      );
    }

    const canEdit =
      session.role === "ADMIN" || existingTrip.creatorId === session.userId;

    if (!canEdit) {
      return NextResponse.json(
        { error: "Tento výlet môže upraviť len tvorca alebo admin." },
        { status: 403 }
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

    const updatedTrip = await prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: tripId },
        data: {
          title,
          description: description || null,
          eventDate: eventDate ? new Date(eventDate) : null,
        },
      });

      await tx.tripVisibility.deleteMany({
        where: { tripId },
      });

      await tx.tripVisibility.createMany({
        data: uniqueUserIds.map((userId) => ({
          tripId,
          userId,
        })),
      });

      return tx.trip.findUnique({
        where: { id: tripId },
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
    });

    return NextResponse.json({
      message: "Výlet bol upravený.",
      trip: updatedTrip,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Neprihlásený používateľ." },
        { status: 401 }
      );
    }

    console.error("PATCH_TRIP_ERROR", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Nastala chyba servera.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id: tripId } = await context.params;

    const existingTrip = await getTripForManagement(
      tripId,
      session.userId,
      session.role
    );

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Výlet neexistuje alebo k nemu nemáš prístup." },
        { status: 404 }
      );
    }

    const canDelete =
      session.role === "ADMIN" || existingTrip.creatorId === session.userId;

    if (!canDelete) {
      return NextResponse.json(
        { error: "Tento výlet môže zmazať len tvorca alebo admin." },
        { status: 403 }
      );
    }

    await prisma.trip.delete({
      where: {
        id: tripId,
      },
    });

    return NextResponse.json({
      message: "Výlet bol vymazaný.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Neprihlásený používateľ." },
        { status: 401 }
      );
    }

    console.error("DELETE_TRIP_ERROR", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Nastala chyba servera.",
      },
      { status: 500 }
    );
  }
}