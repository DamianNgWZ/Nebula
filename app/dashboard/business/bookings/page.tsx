"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface BusinessBooking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  customer: {
    name: string;
  };
  product: {
    id: string;
    name: string;
    price: number;
  };
  rescheduleRequests?: {
    id: string;
    status: string;
    requestedDate: string;
    requestedStartTime: string;
    requestedEndTime: string;
    reason: string;
    createdAt: string;
  }[];
}

export default function BusinessBookings() {
  const [bookings, setBookings] = useState<BusinessBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/business/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Error fetching business bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (
    bookingId: string,
    action: "CONFIRMED" | "CANCELLED"
  ) => {
    try {
      const res = await fetch(`/api/business/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: action }),
      });

      if (res.ok) {
        fetchBookings();
        toast.success(`Booking ${action.toLowerCase()} successfully`);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    }
  };

  const handleRescheduleAction = async (
    rescheduleId: string,
    action: "APPROVED" | "DECLINED"
  ) => {
    try {
      const res = await fetch(`/api/reschedule-requests/${rescheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        fetchBookings();
        toast.success(
          `Reschedule request ${action.toLowerCase()} successfully`
        );
      } else {
        const errorData = await res.json();
        toast.error(
          errorData.error ||
            `Failed to ${action.toLowerCase()} reschedule request`
        );
      }
    } catch (error) {
      console.error("Error updating reschedule request:", error);
      toast.error("Failed to update reschedule request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRescheduleStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-blue-100 text-blue-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "DECLINED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Booking Requests</h1>
        <p className="text-muted-foreground">
          Manage your incoming service bookings and reschedule requests
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No bookings yet</h3>
              <p className="text-muted-foreground">
                Booking requests will appear here when customers book your
                services.
              </p>
            </div>
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
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.customer.name}</span>
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

                  {/* Show all reschedule requests for this booking */}
                  {booking.rescheduleRequests &&
                    booking.rescheduleRequests.length > 0 && (
                      <div className="space-y-2">
                        {booking.rescheduleRequests.map((reschedule, index) => (
                          <div
                            key={reschedule.id}
                            className="p-3 bg-blue-50 rounded-md border"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium flex items-center gap-1">
                                <Edit className="h-3 w-3" />
                                Reschedule #{index + 1}
                              </span>
                              <Badge
                                className={getRescheduleStatusColor(
                                  reschedule.status
                                )}
                              >
                                {reschedule.status}
                              </Badge>
                            </div>

                            <div className="text-xs space-y-1 mt-2">
                              <p>
                                <strong>New Date:</strong>{" "}
                                {format(
                                  new Date(reschedule.requestedDate),
                                  "dd MMM yyyy"
                                )}
                              </p>
                              <p>
                                <strong>New Time:</strong>{" "}
                                {format(
                                  new Date(reschedule.requestedStartTime),
                                  "HH:mm"
                                )}{" "}
                                -{" "}
                                {format(
                                  new Date(reschedule.requestedEndTime),
                                  "HH:mm"
                                )}
                              </p>
                              <p>
                                <strong>Reason:</strong> {reschedule.reason}
                              </p>
                              <p>
                                <strong>Requested:</strong>{" "}
                                {format(
                                  new Date(reschedule.createdAt),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                            </div>

                            {reschedule.status === "PENDING" && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRescheduleAction(
                                      reschedule.id,
                                      "APPROVED"
                                    )
                                  }
                                  className="text-green-600 hover:bg-green-50 flex-1"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRescheduleAction(
                                      reschedule.id,
                                      "DECLINED"
                                    )
                                  }
                                  className="text-red-600 hover:bg-red-50 flex-1"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-lg font-semibold text-green-600">
                      ${booking.product.price}
                    </span>

                    {booking.status === "PENDING" &&
                      !booking.rescheduleRequests?.some(
                        (r) => r.status === "PENDING"
                      ) && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleBookingAction(booking.id, "CONFIRMED")
                            }
                            className="text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleBookingAction(booking.id, "CANCELLED")
                            }
                            className="text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
