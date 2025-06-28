"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductWithShop } from "@/types/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar as CalendarIcon, Clock, User } from "lucide-react";
import Link from "next/link";
import CommentsSection from "@/app/components/CommentsSection";
import BookingCalendar from "@/app/components/BookingCalendar";
import { TimeSlot, TimeslotRule } from "@/app/lib/timeslotUtils";
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

  const handleSlotSelect = (date: Date, slot: TimeSlot) => {
    setSelectedDate(date);
    setSelectedTimeSlot(slot);
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
            <BookingCalendar
              productId={productId}
              businessSettings={businessSettings}
              onSlotSelect={handleSlotSelect}
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
            />

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
              disabled={!selectedDate || !selectedTimeSlot}
              className="w-full"
              size="lg"
            >
              Request Booking
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