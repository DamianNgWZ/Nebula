/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import BookingCalendar from "./BookingCalendar";
import { TimeSlot, TimeslotRule } from "@/app/lib/timeslotUtils";
import { toast } from "sonner";

interface RescheduleModalProps {
  isOpen: boolean;
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RescheduleModal({
  isOpen,
  booking,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [reason, setReason] = useState("");
  const [businessSettings, setBusinessSettings] = useState<{
    rules: TimeslotRule[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      // Fetch business settings for the product
      const fetchSettings = async () => {
        try {
          const res = await fetch(
            `/api/scheduler-config/${booking.product.id}`
          );
          if (res.ok) {
            const data = await res.json();
            setBusinessSettings(data.settings);
          }
        } catch (error) {
          console.error("Error fetching business settings:", error);
        }
      };
      fetchSettings();
    }
  }, [isOpen, booking]);

  const handleSlotSelect = (date: Date, slot: TimeSlot) => {
    setSelectedDate(date);
    setSelectedTimeSlot(slot);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTimeSlot || !reason.trim()) {
      toast.error("Please select a new time and provide a reason");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/bookings/${booking.id}/reschedule-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestedDate: format(selectedDate, "yyyy-MM-dd"),
            requestedStartTime: new Date(
              `${format(selectedDate, "yyyy-MM-dd")}T${selectedTimeSlot.start}:00`
            ),
            requestedEndTime: new Date(
              `${format(selectedDate, "yyyy-MM-dd")}T${selectedTimeSlot.end}:00`
            ),
            reason: reason.trim(),
          }),
        }
      );

      if (response.ok) {
        toast.success("Reschedule request sent successfully!");
        onSuccess();
        setSelectedDate(undefined);
        setSelectedTimeSlot(null);
        setReason("");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to send reschedule request");
      }
    } catch (error) {
      toast.error("Failed to send reschedule request");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.3)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="bg-white p-8 shadow-lg w-full max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="font-bold text-xl mb-4">Reschedule Appointment</h2>

        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <h3 className="font-semibold">Current Appointment</h3>
          <p className="text-sm text-muted-foreground">
            {booking.product.name} -{" "}
            {format(new Date(booking.startTime), "dd MMMM yyyy")} at{" "}
            {format(new Date(booking.startTime), "HH:mm")} -{" "}
            {format(new Date(booking.endTime), "HH:mm")}
          </p>
        </div>

        <div className="space-y-6">
          <BookingCalendar
            productId={booking.product.id}
            businessSettings={businessSettings}
            onSlotSelect={handleSlotSelect}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            excludeBookingId={booking.id}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Reschedule</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for rescheduling..."
              className="min-h-[80px]"
            />
          </div>

          {selectedTimeSlot && selectedDate && (
            <div className="p-4 bg-green-50 rounded-md border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">
                New Appointment
              </h4>
              <div className="text-sm text-green-700">
                <p>
                  <strong>Date:</strong> {format(selectedDate, "dd MMMM yyyy")}
                </p>
                <p>
                  <strong>Time:</strong> {selectedTimeSlot.start} -{" "}
                  {selectedTimeSlot.end}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedDate || !selectedTimeSlot || !reason.trim() || loading
              }
              className="flex-1"
            >
              {loading ? "Sending Request..." : "Send Reschedule Request"}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
