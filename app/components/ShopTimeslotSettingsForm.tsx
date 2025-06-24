"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type TimeSlot = { start: string; end: string };
type DaysConfig = Record<string, TimeSlot[]>;

export default function ShopTimeslotSettingsForm({
  shopId,
}: {
  shopId: string;
}) {
  const [config, setConfig] = useState<DaysConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shop/${shopId}/timeslots`)
      .then((res) => res.json())
      .then((data) => {
        setConfig(data.days || {});
        setLoading(false);
      });
  }, [shopId]);

  const updateDaySlots = (day: string, slots: TimeSlot[]) => {
    setConfig((prev) => ({ ...prev, [day]: slots }));
  };

  const addSlot = (day: string) => {
    updateDaySlots(day, [
      ...(config[day] || []),
      { start: "09:00", end: "10:00" },
    ]);
  };

  const removeSlot = (day: string, index: number) => {
    updateDaySlots(
      day,
      (config[day] || []).filter((_, i) => i !== index)
    );
  };

  const updateSlotTime = (
    day: string,
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const updatedSlots = (config[day] || []).map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    updateDaySlots(day, updatedSlots);
  };

  const saveSettings = async () => {
    setLoading(true);
    await fetch(`/api/shop/${shopId}/timeslots`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: config }),
    });
    setLoading(false);
  };

  if (loading) return <div>Loading timeslot settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {DAYS.map((day) => (
          <div
            key={day}
            className="border p-4 rounded min-w-[220px] flex-shrink-0 bg-gray-50"
          >
            <h3 className="font-bold mb-2">{day}</h3>
            {(config[day] || []).map((slot, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="time"
                  value={slot.start}
                  onChange={(e) =>
                    updateSlotTime(day, index, "start", e.target.value)
                  }
                  className="border p-1 rounded"
                />
                <span>to</span>
                <input
                  type="time"
                  value={slot.end}
                  onChange={(e) =>
                    updateSlotTime(day, index, "end", e.target.value)
                  }
                  className="border p-1 rounded"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeSlot(day, index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => addSlot(day)}>
              + Add Time Slot
            </Button>
          </div>
        ))}
      </div>
      <Button onClick={saveSettings} disabled={loading} className="mt-4">
        {loading ? "Saving..." : "Save Timeslot Settings"}
      </Button>
    </div>
  );
}
