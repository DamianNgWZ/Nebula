import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";

export async function POST(req: Request) {
  const session = await isLoggedIn();
  if (!session || !session.user?.id || session.user.role !== "BUSINESS_OWNER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const {
    duration_minutes,
    interval_minutes,
    working_hours_start,
    working_hours_end,
    available_days_in_future,
    min_booking_notice,
  } = body;

  try {
    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const settings = {
      duration_minutes,
      interval_minutes,
      working_hours_start,
      working_hours_end,
      available_days_in_future,
      min_booking_notice,
    };

    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        nylasConfigId: JSON.stringify(settings),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving scheduler settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
