import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";
import { nylas } from "@/app/lib/nylas";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await isLoggedIn();
    if (
      !session ||
      !session.user?.id ||
      session.user.role !== "BUSINESS_OWNER"
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["CONFIRMED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get the booking with customer and product details
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        product: {
          shop: {
            ownerId: session.user.id,
          },
        },
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

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    let ownerEventCreated = false;
    let customerEventCreated = false;

    // Only create calendar events if booking is CONFIRMED AND no events exist yet
    if (
      status === "CONFIRMED" &&
      !booking.nylasEventId &&
      !booking.customerNylasEventId
    ) {
      // Create calendar event for business owner
      if (booking.product.shop.owner.grantId) {
        try {
          // Get owner's calendars dynamically
          const ownerCalendars = await nylas.calendars.list({
            identifier: booking.product.shop.owner.grantId,
          });

          // Find the primary writable calendar
          const ownerPrimaryCalendar = ownerCalendars.data.find(
            (cal) => cal.isPrimary && !cal.readOnly && cal.isOwnedByUser
          );

          const ownerWritableCalendar = ownerCalendars.data.find(
            (cal) => !cal.readOnly && cal.isOwnedByUser
          );

          const ownerCalendarId =
            ownerPrimaryCalendar?.id || ownerWritableCalendar?.id || "primary";

          const ownerEvent = await nylas.events.create({
            identifier: booking.product.shop.owner.grantId,
            queryParams: {
              calendarId: ownerCalendarId, // Dynamic calendar ID
            },
            requestBody: {
              title: `${booking.product.name} - ${booking.customer.name || "Customer"}`,
              description: `Confirmed booking for ${booking.product.name}\n\nCustomer: ${booking.customer.name}\nEmail: ${booking.customer.email}\n\nBooking ID: ${bookingId}`,
              when: {
                startTime: Math.floor(booking.startTime.getTime() / 1000),
                endTime: Math.floor(booking.endTime.getTime() / 1000),
              },
              location: booking.product.shop.name,
              metadata: {
                bookingId: bookingId,
                eventType: "confirmed_booking",
              },
            },
          });

          // Update booking with owner's event ID
          await prisma.booking.update({
            where: { id: bookingId },
            data: { nylasEventId: ownerEvent.data.id },
          });

          ownerEventCreated = true;
        } catch (error) {
          console.error("Failed to create owner calendar event:", error);
        }
      }

      // Create calendar event for customer (if they have connected calendar)
      if (booking.customer.grantId) {
        try {
          // Get customer's calendars dynamically
          const customerCalendars = await nylas.calendars.list({
            identifier: booking.customer.grantId,
          });

          // Find the primary writable calendar
          const customerPrimaryCalendar = customerCalendars.data.find(
            (cal) => cal.isPrimary && !cal.readOnly && cal.isOwnedByUser
          );

          const customerWritableCalendar = customerCalendars.data.find(
            (cal) => !cal.readOnly && cal.isOwnedByUser
          );

          const customerCalendarId =
            customerPrimaryCalendar?.id ||
            customerWritableCalendar?.id ||
            "primary";

          const customerEvent = await nylas.events.create({
            identifier: booking.customer.grantId,
            queryParams: {
              calendarId: customerCalendarId, // Dynamic calendar ID
            },
            requestBody: {
              title: `${booking.product.name} - ${booking.product.shop.name}`,
              description: `Confirmed booking for ${booking.product.name} at ${booking.product.shop.name}\n\nBooking ID: ${bookingId}`,
              when: {
                startTime: Math.floor(booking.startTime.getTime() / 1000),
                endTime: Math.floor(booking.endTime.getTime() / 1000),
              },
              location: booking.product.shop.name,
              metadata: {
                bookingId: bookingId,
                eventType: "confirmed_booking",
              },
            },
          });

          // Update booking with customer's event ID
          await prisma.booking.update({
            where: { id: bookingId },
            data: { customerNylasEventId: customerEvent.data.id },
          });

          customerEventCreated = true;
        } catch (error) {
          console.error("Failed to create customer calendar event:", error);
        }
      }
    }

    return NextResponse.json({
      ...updatedBooking,
      ownerEventCreated,
      customerEventCreated,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
