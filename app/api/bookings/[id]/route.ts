import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";
import { nylas } from "@/app/lib/nylas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await isLoggedIn();
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const { status } = body;

    if (status !== "CANCELLED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get the booking to verify ownership and get event IDs
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: session.user.id,
      },
      include: {
        customer: true,
        product: {
          include: {
            shop: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Cannot cancel this booking" },
        { status: 400 }
      );
    }

    // Update booking status
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    // Delete calendar events if they exist (only for confirmed bookings)
    let ownerEventDeleted = false;
    let customerEventDeleted = false;

    if (booking.status === "CONFIRMED") {
      // Delete owner's calendar event
      if (booking.nylasEventId && booking.product.shop.owner.grantId) {
        try {
          await nylas.events.destroy({
            identifier: booking.product.shop.owner.grantId,
            eventId: booking.nylasEventId,
            queryParams: {
              calendarId: "primary",
            },
          });
          ownerEventDeleted = true;
        } catch (error) {
          console.error("Failed to delete owner calendar event:", error);
        }
      }

      // Delete customer's calendar event
      if (booking.customerNylasEventId && booking.customer.grantId) {
        try {
          await nylas.events.destroy({
            identifier: booking.customer.grantId,
            eventId: booking.customerNylasEventId,
            queryParams: {
              calendarId: "primary",
            },
          });
          customerEventDeleted = true;
        } catch (error) {
          console.error("Failed to delete customer calendar event:", error);
        }
      }
    }

    return NextResponse.json({
      ...updated,
      ownerEventDeleted,
      customerEventDeleted,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
