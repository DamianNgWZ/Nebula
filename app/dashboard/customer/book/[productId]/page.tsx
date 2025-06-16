"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useForm } from "@conform-to/react";
import { useActionState } from "react";
import { parseWithZod } from "@conform-to/zod";
import { CreateBookingAction } from "@/app/actions";
import { createBookingSchema } from "@/app/lib/zodSchemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { SubmitButton } from "@/app/components/SubmitButtons";
import { ProductWithShop } from "@/types/product";
import Link from "next/link";
import { z } from "zod";

type BookingFormData = z.infer<typeof createBookingSchema>;

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
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [lastResult, action] = useActionState(CreateBookingAction, undefined);

  // placeholder timeslot (to do: make customisable later)
  const timeSlots = [
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "13:00", end: "14:00" },
    { start: "14:00", end: "15:00" },
    { start: "15:00", end: "16:00" },
    { start: "16:00", end: "17:00" },
  ];

  const [form, fields] = useForm<BookingFormData>({
    id: "booking-form",
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: createBookingSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      productId: productId,
      startTime: "",
      endTime: "",
    },
  });

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const checkAvailability = useCallback(
    async (date: string) => {
      if (!date || !product) return;

      try {
        const res = await fetch(
          `/api/availability?productId=${productId}&date=${date}`
        );
        if (res.ok) {
          const data = await res.json();
          setBookedSlots(data.bookedSlots || []);
        }
      } catch (error) {
        console.error("Error checking availability:", error);
      }
    },
    [productId, product]
  );

  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate);
    }
  }, [selectedDate, checkAvailability]);

  const handleTimeSlotSelect = (slot: { start: string; end: string }) => {
    if (!selectedDate) return;

    setSelectedTimeSlot(slot);

    const startDateTime = `${selectedDate}T${slot.start}:00`;
    const endDateTime = `${selectedDate}T${slot.end}:00`;

    const form = document.getElementById("booking-form") as HTMLFormElement;
    const startInput = form?.querySelector(
      'input[name="startTime"]'
    ) as HTMLInputElement;
    const endInput = form?.querySelector(
      'input[name="endTime"]'
    ) as HTMLInputElement;

    if (startInput) startInput.value = startDateTime;
    if (endInput) endInput.value = endDateTime;
  };

  useEffect(() => {
    setSelectedTimeSlot(null);
  }, [selectedDate]);

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
      {/* back button */}
      <Link href={`/dashboard/customer/shop/${product.shop.id}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {product.shop.name}
        </Button>
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* product detail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Details
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

            <div>
              <span className="text-muted-foreground">Business Owner:</span>
              <p className="mt-1">{product.shop.owner.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* form to book */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Select Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* select dates here */}
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="date-picker">Date</Label>
              <Input
                id="date-picker"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* select slots here */}
            {selectedDate && (
              <div className="space-y-3">
                <Label>Available Time Slots</Label>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot, index) => {
                    const slotKey = `${slot.start}-${slot.end}`;
                    const isBooked = bookedSlots.includes(slotKey);

                    return (
                      <Button
                        key={index}
                        variant={
                          isBooked
                            ? "secondary"
                            : selectedTimeSlot?.start === slot.start
                              ? "default"
                              : "outline"
                        }
                        className={`text-sm ${isBooked ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => !isBooked && handleTimeSlotSelect(slot)}
                        disabled={isBooked}
                      >
                        {slot.start} - {slot.end}
                        {isBooked && " (Booked)"}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* timeslot select feedback */}
            {selectedTimeSlot && (
              <div className="p-3 bg-green-50 rounded-md border border-green-200">
                <p className="text-sm text-green-800">
                  Selected: {selectedTimeSlot.start} - {selectedTimeSlot.end} on{" "}
                  {selectedDate}
                </p>
              </div>
            )}

            {/* form booking */}
            <form
              id={form.id}
              onSubmit={(e) => {
                console.log("Form submitting with:", {
                  productId,
                  selectedDate,
                  selectedTimeSlot,
                });
                form.onSubmit(e);
              }}
              action={action}
              noValidate
              className="space-y-4"
            >
              {/* Hidden fields */}
              <input type="hidden" name="productId" value={productId} />
              <input
                type="hidden"
                name="startTime"
                defaultValue={fields.startTime.initialValue}
              />
              <input
                type="hidden"
                name="endTime"
                defaultValue={fields.endTime.initialValue}
              />

              {lastResult?.status === "error" && lastResult.error && (
                <div className="text-sm text-red-500">
                  {lastResult.error._form && (
                    <p>{lastResult.error._form.join(", ")}</p>
                  )}
                  {lastResult.error.startTime && (
                    <p>{lastResult.error.startTime.join(", ")}</p>
                  )}
                  {lastResult.error.endTime && (
                    <p>{lastResult.error.endTime.join(", ")}</p>
                  )}
                </div>
              )}

              <SubmitButton
                text="Book Service"
                className="w-full"
                disabled={!selectedDate || !selectedTimeSlot}
              />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
