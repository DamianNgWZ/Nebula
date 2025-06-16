import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { productId, date, timeSlot } = body;

  try {
    const startTime = new Date(`${date}T${timeSlot.start}:00`);
    const endTime = new Date(`${date}T${timeSlot.end}:00`);

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

    return NextResponse.json({ available: !conflict });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}