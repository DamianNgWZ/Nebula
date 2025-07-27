import { z } from "zod";
// Booking schema tests
const bookingSchema = z.object({
  productId: z.string().min(1),
  date: z.string(),
  timeSlot: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

describe("Booking validation", () => {
  test("validates correct booking data", () => {
    const validData = {
      productId: "prod123",
      date: "2024-01-15",
      timeSlot: { start: "09:00", end: "10:00" },
    };

    expect(() => bookingSchema.parse(validData)).not.toThrow();
  });

  test("rejects invalid booking data", () => {
    const invalidData = {
      productId: "",
      date: "invalid-date",
      timeSlot: { start: "", end: "" },
    };

    expect(() => bookingSchema.parse(invalidData)).toThrow();
  });

  test("rejects missing fields", () => {
    const incompleteData = {
      productId: "prod123",
      // missing date and timeSlot
    };

    expect(() => bookingSchema.parse(incompleteData)).toThrow();
  });

  test("validates time slot format", () => {
    const validTimeSlot = {
      productId: "prod123",
      date: "2024-01-15",
      timeSlot: { start: "09:00", end: "10:00" },
    };

    expect(() => bookingSchema.parse(validTimeSlot)).not.toThrow();
  });
});
