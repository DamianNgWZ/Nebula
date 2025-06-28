"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, Edit } from "lucide-react";
import RescheduleModal from "@/app/components/RescheduleModal";
import { format } from "date-fns";

interface BookingWithDetails {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  rescheduleRequests?: {
    id: string;
    status: string;
    requestedDate: string;
    requestedStartTime: string;
    requestedEndTime: string;
    reason: string;
    createdAt: string;
  }[];
  product: {
    id: string;
    name: string;
    price: number;
    shop: {
      id: string;
      name: string;
      owner: {
        name: string;
      };
    };
  };
}

export default function CustomerBookings() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    booking: BookingWithDetails | null;
  }>({ isOpen: false, booking: null });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings?bookingId=${bookingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchBookings();
      } else {
        console.error("Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  const handleRescheduleClick = (booking: BookingWithDetails) => {
    setRescheduleModal({ isOpen: true, booking });
  };

  const handleRescheduleSuccess = () => {
    setRescheduleModal({ isOpen: false, booking: null });
    fetchBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "CONFIRMED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getRescheduleStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "DECLINED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground">
          View and manage your service bookings
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No bookings yet</h3>
              <p className="text-muted-foreground">
                Start browsing services to make your first booking!
              </p>
            </div>
            <Button asChild>
              <a href="/dashboard/customer/browse">Browse Services</a>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => {
            const startDateTime = formatDateTime(booking.startTime);
            const endDateTime = formatDateTime(booking.endTime);

            return (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {booking.product.name}
                    </CardTitle>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.product.shop.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.product.shop.owner.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{startDateTime.date}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {startDateTime.time} - {endDateTime.time}
                      </span>
                    </div>
                  </div>

                  {/* Reschedule Request Status - Show latest pending or most recent */}
                  {booking.rescheduleRequests &&
                    booking.rescheduleRequests.length > 0 && (
                      <div className="p-3 bg-muted rounded-md border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Reschedule History (
                            {booking.rescheduleRequests.length})
                          </span>
                        </div>
                        {(() => {
                          const latestReschedule =
                            booking.rescheduleRequests.sort(
                              (a, b) =>
                                new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime()
                            )[0];
                          const pendingReschedule =
                            booking.rescheduleRequests.find(
                              (r) => r.status === "PENDING"
                            );
                          const displayReschedule =
                            pendingReschedule || latestReschedule;

                          return (
                            <div className="mt-2">
                              <Badge
                                className={getRescheduleStatusColor(
                                  displayReschedule.status
                                )}
                              >
                                {displayReschedule.status}
                              </Badge>
                              {displayReschedule.status === "PENDING" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Waiting for business owner approval
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Latest:{" "}
                                {format(
                                  new Date(displayReschedule.createdAt),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-lg font-semibold text-green-600">
                      ${booking.product.price}
                    </span>

                    <div className="flex gap-2">
                      {booking.status === "CONFIRMED" &&
                        !booking.rescheduleRequests?.some(
                          (r) => r.status === "PENDING"
                        ) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRescheduleClick(booking)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Reschedule
                          </Button>
                        )}

                      {booking.status === "PENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RescheduleModal
        isOpen={rescheduleModal.isOpen}
        booking={rescheduleModal.booking}
        onClose={() => setRescheduleModal({ isOpen: false, booking: null })}
        onSuccess={handleRescheduleSuccess}
      />
    </div>
  );
}
