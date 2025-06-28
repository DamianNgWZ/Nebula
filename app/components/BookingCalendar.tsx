/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import {
  getSlotsForDate,
  TimeSlot,
  TimeslotRule,
} from "@/app/lib/timeslotUtils";

interface BookingCalendarProps {
  productId: string;
  businessSettings: { rules: TimeslotRule[] } | null;
  onSlotSelect: (date: Date, slot: TimeSlot) => void;
  selectedDate?: Date;
  selectedTimeSlot?: TimeSlot | null;
  excludeBookingId?: string; // For reschedule - exclude current booking from conflicts
}

export default function BookingCalendar({
  productId,
  businessSettings,
  onSlotSelect,
  selectedDate,
  selectedTimeSlot,
  excludeBookingId,
}: BookingCalendarProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState<
    Date | undefined
  >(selectedDate);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotAvailability, setSlotAvailability] = useState<{
    [key: string]: boolean;
  }>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (!businessSettings || !internalSelectedDate) {
      setAvailableSlots([]);
      return;
    }
    const dateString = format(internalSelectedDate, "yyyy-MM-dd");
    const slots = getSlotsForDate(businessSettings.rules || [], dateString);
    setAvailableSlots(slots);
  }, [businessSettings, internalSelectedDate]);

  useEffect(() => {
    if (availableSlots.length === 0 || !internalSelectedDate) return;

    const checkSlotAvailability = async () => {
      setCheckingAvailability(true);
      const availability: { [key: string]: boolean } = {};
      const dateString = format(internalSelectedDate, "yyyy-MM-dd");

      for (const slot of availableSlots) {
        try {
          const body: any = {
            productId: productId,
            date: dateString,
            timeSlot: slot,
          };

          // For reschedule, exclude current booking
          if (excludeBookingId) {
            body.excludeBookingId = excludeBookingId;
          }

          const response = await fetch("/api/bookings/check-availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (response.ok) {
            const data = await response.json();
            availability[`${slot.start}-${slot.end}`] = data.available;
          } else {
            availability[`${slot.start}-${slot.end}`] = false;
          }
        } catch (error) {
          availability[`${slot.start}-${slot.end}`] = false;
        }
      }
      setSlotAvailability(availability);
      setCheckingAvailability(false);
    };

    checkSlotAvailability();
  }, [availableSlots, internalSelectedDate, productId, excludeBookingId]);

  const getSlotButtonVariant = (slot: TimeSlot) => {
    const slotKey = `${slot.start}-${slot.end}`;
    const isSelected =
      selectedTimeSlot?.start === slot.start &&
      selectedTimeSlot?.end === slot.end;
    const isAvailable = slotAvailability[slotKey];

    if (isSelected) return "default";
    if (isAvailable === false) return "secondary";
    return "outline";
  };

  const isSlotDisabled = (slot: TimeSlot) => {
    const slotKey = `${slot.start}-${slot.end}`;
    return slotAvailability[slotKey] === false;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium">Select Date</label>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={internalSelectedDate}
            onSelect={setInternalSelectedDate}
            disabled={{ before: new Date() }}
            className="rounded-md border"
          />
        </div>
        {internalSelectedDate && (
          <p className="text-center text-sm text-muted-foreground">
            Selected: {format(internalSelectedDate, "dd MMMM yyyy (EEEE)")}
          </p>
        )}
      </div>

      {internalSelectedDate && availableSlots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Available Time Slots</label>
            {checkingAvailability && (
              <span className="text-xs text-muted-foreground">
                Checking availability...
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {availableSlots.map((slot, index) => {
              const slotKey = `${slot.start}-${slot.end}`;
              const isAvailable = slotAvailability[slotKey];
              const isDisabled = isSlotDisabled(slot);
              return (
                <Button
                  key={index}
                  variant={getSlotButtonVariant(slot)}
                  className={`text-sm relative ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={isDisabled || checkingAvailability}
                  onClick={() =>
                    !isDisabled && onSlotSelect(internalSelectedDate, slot)
                  }
                >
                  <span>
                    {slot.start} - {slot.end}
                  </span>
                  {!checkingAvailability && (
                    <span className="ml-2">
                      {isAvailable === false ? (
                        <XCircle className="h-3 w-3 text-red-500" />
                      ) : isAvailable === true ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : null}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {internalSelectedDate && availableSlots.length === 0 && (
        <div className="text-center text-muted-foreground">
          No slots available for this day.
        </div>
      )}
    </div>
  );
}
