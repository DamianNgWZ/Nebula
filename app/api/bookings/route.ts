import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createBookingSchema } from "@/app/lib/zodSchemas";
import { isLoggedIn } from "@/app/lib/hooks";

export async function POST(req: Request) {
  const session = await isLoggedIn();
  if (!session || !session.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);

  if (!parsed.success) {
    return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
  }

  const { productId, startTime, endTime } = parsed.data;

  const conflict = await prisma.booking.findFirst({
    where: {
      productId,
      OR: [
        {
          startTime: { lt: new Date(endTime) },
          endTime: { gt: new Date(startTime) },
        },
      ],
    },
  });

  if (conflict) {
    return new NextResponse("Time slot already booked", { status: 409 });
  }

  const booking = await prisma.booking.create({
    data: {
      customerId: session.user.id,
      productId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    },
  });

  return NextResponse.json(booking);
}
