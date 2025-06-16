import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";

export async function GET() {
  try {
    const session = await isLoggedIn();
    if (!session || !session.user?.id || session.user.role !== "BUSINESS_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!shop) {
      return NextResponse.json([]);
    }

    const bookings = await prisma.booking.findMany({
      where: {
        product: {
          shopId: shop.id,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
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
      },
      orderBy: {
        startTime: 'desc',
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