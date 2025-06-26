/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductWithShop } from "@/types/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import CommentsSection from "@/app/components/CommentsSection";
import {
  getSlotsForDate,
  TimeSlot,
  TimeslotRule,
} from "@/app/lib/timeslotUtils";
import { format } from "date-fns";

export default function BookService() {
  const params = useParams();
  const productId = params.productId as string;
  const [product, setProduct] = useState<ProductWithShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [businessSettings, setBusinessSettings] = useState<{
    rules: TimeslotRule[];
  } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotAvailability, setSlotAvailability] = useState<{
    [key: string]: boolean;
  }>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);

          const configRes = await fetch(
            `/api/scheduler-config/${productId}?refresh=${refreshTrigger}`
          );
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
  }, [productId, refreshTrigger]);

  useEffect(() => {
    if (!businessSettings || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    const dateString = format(selectedDate, "yyyy-MM-dd");
    const slots = getSlotsForDate(businessSettings.rules || [], dateString);
    setAvailableSlots(slots);
  }, [businessSettings, selectedDate]);

  useEffect(() => {
    if (availableSlots.length === 0 || !selectedDate) return;

    const checkSlotAvailability = async () => {
      setCheckingAvailability(true);
      const availability: { [key: string]: boolean } = {};
      const dateString = format(selectedDate, "yyyy-MM-dd");

      for (const slot of availableSlots) {
        try {
          const response = await fetch("/api/bookings/check-availability", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: productId,
              date: dateString,
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

  const getSlotButtonVariant = (slot: TimeSlot) => {
    const slotKey = `${slot.start}-${slot.end}`;
    const isSelected = selectedTimeSlot?.start === slot.start;
    const isAvailable = slotAvailability[slotKey];

    if (isSelected) return "default";
    if (isAvailable === false) return "secondary";
    return "outline";
  };

  const isSlotDisabled = (slot: TimeSlot) => {
    const slotKey = `${slot.start}-${slot.end}`;
    return slotAvailability[slotKey] === false;
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot || !product) return;

    const dateString = format(selectedDate, "yyyy-MM-dd");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: productId,
          date: dateString,
          timeSlot: selectedTimeSlot,
        }),
      });

      if (response.ok) {
        alert(
          `Booking request sent!\n\nService: ${product.name}\nDate: ${format(selectedDate, "dd MMMM yyyy")}\nTime: ${selectedTimeSlot.start} - ${selectedTimeSlot.end}\n\nThe business owner will confirm your booking.`
        );

        setSelectedDate(undefined);
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

  let businessHoursDisplay = "";
  if (!selectedDate) {
    businessHoursDisplay = "";
  } else if (availableSlots.length === 0) {
    businessHoursDisplay = "Closed today";
  } else {
    const firstSlot = availableSlots[0];
    const lastSlot = availableSlots[availableSlots.length - 1];
    businessHoursDisplay = `${firstSlot.start} - ${lastSlot.end}`;
  }

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
              <CalendarIcon className="h-5 w-5" />
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
            {selectedDate && (
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Business Hours:</strong> {businessHoursDisplay}
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
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Date</label>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={{ before: new Date() }}
                  className="rounded-md border"
                />
              </div>
              {selectedDate && (
                <p className="text-center text-sm text-muted-foreground">
                  Selected: {format(selectedDate, "dd MMMM yyyy (EEEE)")}
                </p>
              )}
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
            {selectedDate && availableSlots.length === 0 && (
              <div className="text-center text-muted-foreground">
                No slots available for this day.
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
                    <strong>Date:</strong>{" "}
                    {format(selectedDate, "dd MMMM yyyy")}
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