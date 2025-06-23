/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductWithShop } from "@/types/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import CommentsSection from "@/app/components/CommentsSection";

export default function BookService() {
  const params = useParams();
  const productId = params.productId as string;
  const [product, setProduct] = useState<ProductWithShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotAvailability, setSlotAvailability] = useState<{
    [key: string]: boolean;
  }>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);

          const configRes = await fetch(`/api/scheduler-config/${productId}`);
          if (configRes.ok) {
            const configData = await configRes.json();
            setBusinessSettings(configData.settings);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!businessSettings || !selectedDate) return;

    const generateTimeSlots = () => {
      const slots = [];
      const startTime = businessSettings.working_hours_start || "09:00";
      const endTime = businessSettings.working_hours_end || "17:00";
      const interval = businessSettings.interval_minutes || 60;
      const duration = businessSettings.duration_minutes || 60;

      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);

      let currentTime = startHour * 60 + startMin;
      const endTimeMinutes = endHour * 60 + endMin;

      while (currentTime + duration <= endTimeMinutes) {
        const startHours = Math.floor(currentTime / 60);
        const startMinutes = currentTime % 60;
        const endTimeSlot = currentTime + duration;
        const endHours = Math.floor(endTimeSlot / 60);
        const endMinutesSlot = endTimeSlot % 60;

        slots.push({
          start: `${startHours.toString().padStart(2, "0")}:${startMinutes.toString().padStart(2, "0")}`,
          end: `${endHours.toString().padStart(2, "0")}:${endMinutesSlot.toString().padStart(2, "0")}`,
        });

        currentTime += interval;
      }

      setAvailableSlots(slots);
    };

    generateTimeSlots();
  }, [businessSettings, selectedDate]);

  useEffect(() => {
    if (availableSlots.length === 0 || !selectedDate) return;

    const checkSlotAvailability = async () => {
      setCheckingAvailability(true);
      const availability: { [key: string]: boolean } = {};

      for (const slot of availableSlots) {
        try {
          const response = await fetch("/api/bookings/check-availability", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: productId,
              date: selectedDate,
              timeSlot: slot,
            }),
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
  }, [availableSlots, selectedDate, productId]);

  const getSlotButtonVariant = (slot: { start: string; end: string }) => {
    const slotKey = `${slot.start}-${slot.end}`;
    const isSelected = selectedTimeSlot?.start === slot.start;
    const isAvailable = slotAvailability[slotKey];

    if (isSelected) return "default";
    if (isAvailable === false) return "secondary";
    return "outline";
  };

  const isSlotDisabled = (slot: { start: string; end: string }) => {
    const slotKey = `${slot.start}-${slot.end}`;
    return slotAvailability[slotKey] === false;
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot || !product) return;

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: productId,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
        }),
      });

      if (response.ok) {
        alert(
          `Booking request sent!\n\nService: ${product.name}\nDate: ${selectedDate}\nTime: ${selectedTimeSlot.start} - ${selectedTimeSlot.end}\n\nThe business owner will confirm your booking.`
        );

        setSelectedDate("");
        setSelectedTimeSlot(null);
        setSlotAvailability({});
      } else if (response.status === 409) {
        const errorData = await response.json();
        alert(
          `Sorry! ${errorData.error}\n\nPlease select a different time slot.`
        );
        setSelectedTimeSlot(null);
      } else {
        throw new Error("Failed to create booking");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Failed to create booking. Error: ${message}\n\nPlease try again.`);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <p>Service not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Link href={`/dashboard/customer/shop/${product.shop.id}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {product.shop.name}
        </Button>
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-muted-foreground">{product.shop.name}</p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price:</span>
              <Badge variant="secondary" className="text-lg">
                ${product.price}
              </Badge>
            </div>

            {product.description && (
              <div>
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1">{product.description}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Business Owner:</span>
              <span>{product.shop.owner.name}</span>
            </div>

            {businessSettings && (
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Duration:</strong> {businessSettings.duration_minutes}{" "}
                  minutes
                  <br />
                  <strong>Business Hours:</strong>{" "}
                  {businessSettings.working_hours_start} -{" "}
                  {businessSettings.working_hours_end}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Book Your Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="date-picker" className="text-sm font-medium">
                Select Date
              </label>
              <input
                id="date-picker"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>

            {selectedDate && availableSlots.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Available Time Slots
                  </label>
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
                        onClick={() => !isDisabled && setSelectedTimeSlot(slot)}
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

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span>Booked</span>
                  </div>
                </div>
              </div>
            )}

            {selectedTimeSlot && selectedDate && (
              <div className="p-4 bg-green-50 rounded-md border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">
                  Booking Summary
                </h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    <strong>Service:</strong> {product.name}
                  </p>
                  <p>
                    <strong>Date:</strong> {selectedDate}
                  </p>
                  <p>
                    <strong>Time:</strong> {selectedTimeSlot.start} -{" "}
                    {selectedTimeSlot.end}
                  </p>
                  <p>
                    <strong>Price:</strong> ${product.price}
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleBooking}
              disabled={
                !selectedDate || !selectedTimeSlot || checkingAvailability
              }
              className="w-full"
              size="lg"
            >
              {checkingAvailability
                ? "Checking availability..."
                : "Request Booking"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your booking request will be sent to {product.shop.owner.name} for
              confirmation.
            </p>
          </CardContent>
        </Card>
      </div>
      <CommentsSection />
    </div>
  );
}
