import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";

export async function POST(req: Request) {
  try {
    const session = await isLoggedIn();
    if (!session || !session.user?.id) {
      console.log("Unauthorized booking attempt");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("Received booking data:", body);

    const { productId, date, timeSlot } = body;

    if (!productId || !date || !timeSlot) {
      console.log("Missing required fields:", { productId, date, timeSlot });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert date and timeSlot to DateTime
    const startTime = new Date(`${date}T${timeSlot.start}:00`);
    const endTime = new Date(`${date}T${timeSlot.end}:00`);

    console.log("Creating booking with times:", { startTime, endTime });

    // Check for existing bookings that conflict with this time slot
    const conflict = await prisma.booking.findFirst({
      where: {
        productId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    });

    if (conflict) {
      console.log("Booking conflict found:", conflict);
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 409 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: session.user.id,
        productId,
        startTime,
        endTime,
        status: "PENDING",
      },
    });

    console.log("Booking created successfully:", booking);
    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error in booking API:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to create booking", details: message },
      { status: 500 }
    );
  }
}

// Keep your existing GET method for fetching customer bookings
export async function GET() {
  try {
    const session = await isLoggedIn();
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        customerId: session.user.id,
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        product: {
          include: {
            shop: {
              include: {
                owner: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching customer bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
