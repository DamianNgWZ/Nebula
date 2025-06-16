import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { productId, date, timeSlot } = body;

  try {
    // Get the shop ID for this product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { shopId: true },
    });

    if (!product) {
      return NextResponse.json({ available: false }, { status: 404 });
    }

    const startTime = new Date(`${date}T${timeSlot.start}:00`);
    const endTime = new Date(`${date}T${timeSlot.end}:00`);

    // Check for conflicts across ALL products in the same shop
    const conflict = await prisma.booking.findFirst({
      where: {
        product: {
          shopId: product.shopId, // Check shop-level availability
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