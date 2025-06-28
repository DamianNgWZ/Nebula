import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const session = await isLoggedIn();

  console.log("📝 Reschedule request initiated for booking:", bookingId);

  if (!session || !session.user?.id) {
    console.log("❌ Unauthorized reschedule request attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { requestedDate, requestedStartTime, requestedEndTime, reason } =
      body;

    console.log("📋 Reschedule request details:", {
      bookingId,
      customerId: session.user.id,
      requestedDate,
      requestedStartTime,
      requestedEndTime,
      reason: reason.substring(0, 50) + "...",
    });

    // Verify booking belongs to user and is confirmed
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: session.user.id,
        status: "CONFIRMED",
      },
      include: {
        rescheduleRequests: true, // Changed from rescheduleRequest to rescheduleRequests
      },
    });

    if (!booking) {
      console.log("❌ Booking not found or not eligible:", {
        bookingId,
        customerId: session.user.id,
      });
      return NextResponse.json(
        { error: "Booking not found or not eligible for reschedule" },
        { status: 404 }
      );
    }

    // Check if there's already a PENDING reschedule request
    const pendingReschedule = booking.rescheduleRequests.find(
      (req) => req.status === "PENDING"
    );

    if (pendingReschedule) {
      console.log(
        "❌ Pending reschedule request already exists:",
        pendingReschedule.id
      );
      return NextResponse.json(
        {
          error:
            "You already have a pending reschedule request. Please wait for it to be processed.",
        },
        { status: 400 }
      );
    }

    console.log("✅ Creating reschedule request in database...");

    // Create reschedule request (multiple allowed, but only one pending at a time)
    const rescheduleRequest = await prisma.rescheduleRequest.create({
      data: {
        bookingId,
        customerId: session.user.id,
        requestedDate,
        requestedStartTime: new Date(requestedStartTime),
        requestedEndTime: new Date(requestedEndTime),
        reason,
      },
    });

    console.log("✅ Reschedule request created successfully:", {
      rescheduleRequestId: rescheduleRequest.id,
      status: rescheduleRequest.status,
      totalReschedules: booking.rescheduleRequests.length + 1,
    });

    return NextResponse.json(rescheduleRequest);
  } catch (error) {
    console.error("❌ Error creating reschedule request:", {
      bookingId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to create reschedule request" },
      { status: 500 }
    );
  }
}
