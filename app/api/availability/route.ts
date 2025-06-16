import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createTimeSlotTemplateSchema } from "@/app/lib/zodSchemas";
import { isLoggedIn } from "@/app/lib/hooks";

export async function POST(req: Request) {
  const session = await isLoggedIn();
  if (!session || !session.user?.id || session.user.role !== "BUSINESS_OWNER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const parsed = createTimeSlotTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
  }

  const template = await prisma.timeSlotTemplate.create({
    data: {
      ...parsed.data,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(template);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const productId = searchParams.get("productId");

    if (!date || !productId) {
      return NextResponse.json(
        { error: "Date and productId parameters are required" },
        { status: 400 }
      );
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.booking.findMany({
      where: {
        productId: productId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const bookedSlots = existingBookings.map((booking) => {
      const start = booking.startTime.toTimeString().slice(0, 5);
      const end = booking.endTime.toTimeString().slice(0, 5);
      return `${start}-${end}`;
    });

    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}