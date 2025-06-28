/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";
import { nylas } from "@/app/lib/nylas";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rescheduleId } = await params;
  const session = await isLoggedIn();

  if (!session || session.user?.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body; // "APPROVED" or "DECLINED"

    const rescheduleRequest = await prisma.rescheduleRequest.findUnique({
      where: { id: rescheduleId },
      include: {
        booking: {
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
        },
      },
    });

    if (!rescheduleRequest) {
      return NextResponse.json(
        { error: "Reschedule request not found" },
        { status: 404 }
      );
    }

    if (rescheduleRequest.booking.product.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (rescheduleRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Reschedule request already processed" },
        { status: 400 }
      );
    }

    if (action === "APPROVED") {
      // Check if new slot is still available
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          product: {
            shopId: rescheduleRequest.booking.product.shopId,
          },
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          id: {
            not: rescheduleRequest.bookingId,
          },
          OR: [
            {
              startTime: { lt: rescheduleRequest.requestedEndTime },
              endTime: { gt: rescheduleRequest.requestedStartTime },
            },
          ],
        },
      });

      if (conflictingBooking) {
        return NextResponse.json(
          { error: "Requested time slot is no longer available" },
          { status: 409 }
        );
      }

      // Update booking and reschedule request in transaction
      const result = await prisma.$transaction(async (tx) => {
        const updatedBooking = await tx.booking.update({
          where: { id: rescheduleRequest.bookingId },
          data: {
            startTime: rescheduleRequest.requestedStartTime,
            endTime: rescheduleRequest.requestedEndTime,
          },
        });

        const updatedReschedule = await tx.rescheduleRequest.update({
          where: { id: rescheduleId },
          data: {
            status: "APPROVED",
            respondedAt: new Date(),
            respondedBy: session.user.id,
          },
        });

        return { updatedBooking, updatedReschedule };
      });

      // Calendar sync using owner's grantId
      const nylasGrantId = rescheduleRequest.booking.product.shop.owner.grantId;
      const nylasEventId = rescheduleRequest.booking.nylasEventId;

      if (nylasEventId && nylasGrantId) {
        try {
          // Step 1: Delete the old event
          await nylas.events.destroy({
            identifier: nylasGrantId,
            eventId: nylasEventId,
            queryParams: { calendarId: "primary" },
          });

          // Step 2: Create new event with updated time
          const newEvent = await nylas.events.create({
            identifier: nylasGrantId,
            requestBody: {
              title: `${rescheduleRequest.booking.product.name} - Rescheduled`,
              description: `Booking rescheduled from original time. Customer: ${rescheduleRequest.booking.customer.name ?? "Unknown"}`,
              when: {
                startTime: Math.floor(
                  rescheduleRequest.requestedStartTime.getTime() / 1000
                ),
                endTime: Math.floor(
                  rescheduleRequest.requestedEndTime.getTime() / 1000
                ),
              },
              participants: [
                {
                  email: rescheduleRequest.booking.customer.email,
                  name: rescheduleRequest.booking.customer.name ?? undefined,
                  status: "yes",
                },
              ],
            },
            queryParams: { calendarId: "primary" },
          });

          // Step 3: Update booking with new event ID
          await prisma.booking.update({
            where: { id: rescheduleRequest.bookingId },
            data: { nylasEventId: newEvent.data.id },
          });
        } catch {
          // Don't fail the whole operation - booking is still updated
        }
      }

      return NextResponse.json(result.updatedReschedule);
    } else if (action === "DECLINED") {
      const updatedReschedule = await prisma.rescheduleRequest.update({
        where: { id: rescheduleId },
        data: {
          status: "DECLINED",
          respondedAt: new Date(),
          respondedBy: session.user.id,
        },
      });

      return NextResponse.json(updatedReschedule);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process reschedule request" },
      { status: 500 }
    );
  }
}
