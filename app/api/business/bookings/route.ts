import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";

export async function GET() {
  try {
    const session = await isLoggedIn();
    if (!session || session.user?.role !== "BUSINESS_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        product: {
          shop: {
            ownerId: session.user.id,
          },
        },
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        rescheduleRequests: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching business bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
