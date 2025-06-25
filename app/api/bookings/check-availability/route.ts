/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getSlotsForDate } from "@/app/lib/timeslotUtils";

export async function POST(req: Request) {
  const body = await req.json();
  const { productId, date, timeSlot } = body;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        shop: {
          include: {
            timeslotSetting: true,
          },
        },
      },
    });

    if (!product || !product.shop) {
      return NextResponse.json({ available: false }, { status: 404 });
    }

    const startTime = new Date(`${date}T${timeSlot.start}:00`);
    const endTime = new Date(`${date}T${timeSlot.end}:00`);

    // 1. Validate against timeslot rules
    if (product.shop.timeslotSetting?.rules) {
      const slotsForDay = getSlotsForDate(
        product.shop.timeslotSetting.rules as any,
        date
      );

      const isValidSlot = slotsForDay.some((slot) => {
        const slotStart = new Date(`${date}T${slot.start}:00`);
        const slotEnd = new Date(`${date}T${slot.end}:00`);
        return startTime >= slotStart && endTime <= slotEnd;
      });

      if (!isValidSlot) {
        return NextResponse.json({
          available: false,
          reason: "Selected time is not within business hours",
        });
      }
    }

    // 2. Check for booking conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        product: {
          shopId: product.shop.id,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { gte: startTime, lte: endTime },
          },
          {
            endTime: { gte: startTime, lte: endTime },
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
