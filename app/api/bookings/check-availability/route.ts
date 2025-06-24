import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

type DaysType = Record<string, { start: string; end: string }[]>;

export async function POST(req: Request) {
  const body = await req.json();
  const { productId, date, timeSlot } = body;

  try {
    // Get product and its shop with timeslot settings
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

    // 1. Check shop availability settings if they exist
    const timeslotSetting = product.shop.timeslotSetting;

    if (timeslotSetting && timeslotSetting.days) {
      // Type assertion for days
      const days = timeslotSetting.days as DaysType;
      const dayOfWeek = startTime.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const daySlots = days[dayOfWeek] || [];

      // Check if time slot is within any configured slot or else alot of errors
      const isValidSlot = daySlots.some((slot) => {
        const slotStart = new Date(`${date}T${slot.start}:00`);
        const slotEnd = new Date(`${date}T${slot.end}:00`);
        return startTime >= slotStart && endTime <= slotEnd;
      });

      if (!isValidSlot) {
        return NextResponse.json({
          available: false,
          reason: "Selected time is not available",
        });
      }
    }

    // Check for booking conflicts
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
        ],
      },
    });

    return NextResponse.json({ available: !conflict });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
