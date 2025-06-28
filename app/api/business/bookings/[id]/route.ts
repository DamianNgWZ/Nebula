import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";
import { nylas } from "@/app/lib/nylas";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const session = await isLoggedIn();

  if (!session || session.user?.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        product: {
          include: {
            shop: {
              include: {
                owner: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.product.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        product: {
          include: {
            shop: {
              include: {
                owner: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    // Create calendar event when booking is confirmed
    if (
      status === "CONFIRMED" &&
      !booking.nylasEventId &&
      booking.product.shop.owner.grantId
    ) {
      try {
        const calendarEvent = await nylas.events.create({
          identifier: booking.product.shop.owner.grantId,
          requestBody: {
            title: `${booking.product.name} - ${booking.customer.name || "Customer"}`,
            description: `Booking confirmed\nService: ${booking.product.name}\nCustomer: ${booking.customer.name || "Unknown"}\nEmail: ${booking.customer.email}\nPrice: $${booking.product.price}\nShop: ${booking.product.shop.name}`,
            when: {
              startTime: Math.floor(booking.startTime.getTime() / 1000),
              endTime: Math.floor(booking.endTime.getTime() / 1000),
            },
            participants: [
              {
                email: booking.customer.email,
                name: booking.customer.name ?? undefined,
                status: "yes",
              },
            ],
            location: booking.product.shop.name,
          },
          queryParams: { calendarId: "primary" },
        });

        await prisma.booking.update({
          where: { id: bookingId },
          data: { nylasEventId: calendarEvent.data.id },
        });
      } catch (calendarError) {
        console.error("Calendar event creation failed:", calendarError);
      }
    }

    // Delete calendar event when booking is cancelled
    if (
      status === "CANCELLED" &&
      booking.nylasEventId &&
      booking.product.shop.owner.grantId
    ) {
      try {
        await nylas.events.destroy({
          identifier: booking.product.shop.owner.grantId,
          eventId: booking.nylasEventId,
          queryParams: { calendarId: "primary" },
        });

        await prisma.booking.update({
          where: { id: bookingId },
          data: { nylasEventId: null },
        });
      } catch (calendarError) {
        console.error("Calendar event deletion failed:", calendarError);
      }
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error updating business booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
