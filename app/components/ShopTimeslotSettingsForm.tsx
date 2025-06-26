/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";

type TimeSlot = { start: string; end: string };
type TimeslotRule =
  | {
      type: "date";
      year: number;
      month: number;
      date: string;
      slots: TimeSlot[];
    }
  | {
      type: "range";
      year: number;
      month: number;
      start: string;
      end: string;
      slots: TimeSlot[];
    }
  | {
      type: "weekly";
      year: number;
      month: number;
      weekday: string;
      slots: TimeSlot[];
    }
  | {
      type: "weekday";
      year: number;
      month: number;
      weekday: string;
      slots: TimeSlot[];
    };

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function ShopTimeslotSettingsForm({
  shopId,
}: {
  shopId: string;
}) {
  const today = useRef(new Date()).current;
  const [calendarMonth, setCalendarMonth] = useState<number>(
    today.getMonth() + 1
  );
  const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());
  const [rules, setRules] = useState<TimeslotRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotType, setSlotType] = useState<"date" | "range" | "weekday">(
    "date"
  );
  const [slotWeekday, setSlotWeekday] = useState<string>("Monday");
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([
    { start: "09:00", end: "17:00" },
  ]);
  const [editRuleIndex, setEditRuleIndex] = useState<number | null>(null);

  const todayStr = format(today, "yyyy-MM-dd");

  useEffect(() => {
    if (!shopId || shopId === "undefined") return;
    setLoading(true);
    fetch(`/api/shop/${shopId}/timeslots`)
      .then((res) => res.json())
      .then((data) => {
        setRules(data.rules || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shopId]);

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date || date < new Date(todayStr)) return;
    setSelectedDate(date);

    const ruleIdx = rules.findIndex(
      (rule) =>
        rule.type === "date" &&
        rule.date === format(date, "yyyy-MM-dd") &&
        rule.year === calendarYear &&
        rule.month === calendarMonth
    );
    if (ruleIdx !== -1) {
      setSlots([...rules[ruleIdx].slots]);
      setEditRuleIndex(ruleIdx);
    } else {
      setSlots([{ start: "09:00", end: "17:00" }]);
      setEditRuleIndex(null);
    }
    setSlotType("date");
    setShowSlotModal(true);
  };

  const handleEditRule = (rule: TimeslotRule, idx: number) => {
    if (rule.type === "date") {
      setSelectedDate(new Date(rule.date));
      setSlots([...rule.slots]);
      setEditRuleIndex(idx);
      setSlotType("date");
      setShowSlotModal(true);
    } else if (rule.type === "range") {
      setRangeStart(new Date(rule.start));
      setRangeEnd(new Date(rule.end));
      setSlots([...rule.slots]);
      setEditRuleIndex(idx);
      setSlotType("range");
      setShowSlotModal(true);
    } else if (rule.type === "weekday") {
      setSlotWeekday(rule.weekday);
      setSlots([...rule.slots]);
      setEditRuleIndex(idx);
      setSlotType("weekday");
      setShowSlotModal(true);
    }
  };

  const handleSaveRule = () => {
    let newRule: TimeslotRule | null = null;
    if (slotType === "date" && selectedDate) {
      newRule = {
        type: "date",
        year: calendarYear,
        month: calendarMonth,
        date: format(selectedDate, "yyyy-MM-dd"),
        slots: [...slots],
      };
      if (editRuleIndex !== null) {
        setRules((prev) =>
          prev.map((r, i) => (i === editRuleIndex ? newRule! : r))
        );
      } else {
        setRules((prev) => [...prev, newRule!]);
      }
    } else if (slotType === "range" && rangeStart && rangeEnd) {
      newRule = {
        type: "range",
        year: calendarYear,
        month: calendarMonth,
        start: format(rangeStart, "yyyy-MM-dd"),
        end: format(rangeEnd, "yyyy-MM-dd"),
        slots: [...slots],
      };
      if (editRuleIndex !== null) {
        setRules((prev) =>
          prev.map((r, i) => (i === editRuleIndex ? newRule! : r))
        );
      } else {
        setRules((prev) => [...prev, newRule!]);
      }
    } else if (slotType === "weekday" && slotWeekday) {
      newRule = {
        type: "weekday",
        year: calendarYear,
        month: calendarMonth,
        weekday: slotWeekday,
        slots: [...slots],
      };
      if (editRuleIndex !== null) {
        setRules((prev) =>
          prev.map((r, i) => (i === editRuleIndex ? newRule! : r))
        );
      } else {
        setRules((prev) => [...prev, newRule!]);
      }
    }
    setShowSlotModal(false);
    setSlots([{ start: "09:00", end: "17:00" }]);
    setSelectedDate(null);
    setRangeStart(null);
    setRangeEnd(null);
    setEditRuleIndex(null);
  };

  const removeRule = (index: number) =>
    setRules((rules) => rules.filter((_, i) => i !== index));
  const updateSlot = (i: number, field: "start" | "end", value: string) => {
    setSlots((prev) =>
      prev.map((s, j) => (j === i ? { ...s, [field]: value } : s))
    );
  };

  const addSlot = () =>
    setSlots((prev) => [...prev, { start: "09:00", end: "10:00" }]);
  const removeSlot = (i: number) =>
    setSlots((prev) => prev.filter((_, j) => j !== i));

  const saveSettings = async () => {
    setLoading(true);
    try {
      const validRules = rules.filter(
        (rule) =>
          typeof rule.year === "number" && typeof rule.month === "number"
      );
      const response = await fetch(`/api/shop/${shopId}/timeslots`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: validRules }),
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules ?? validRules);
        toast.success("Timeslot settings saved successfully!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save timeslot settings.");
      }
    } catch (error) {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentMonthRules = rules.filter(
    (rule) => rule.year === calendarYear && rule.month === calendarMonth
  );

  if (loading) return <div>Loading timeslot settings...</div>;

  return (
    <div className="space-y-8">
      <div className="flex gap-6 items-start">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={handleCalendarSelect}
            required
            initialFocus
            disabled={{ before: new Date(todayStr) }}
            month={new Date(calendarYear, calendarMonth - 1)} // Force calendar to show this month
            onMonthChange={(date) => {
              setCalendarMonth(date.getMonth() + 1);
              setCalendarYear(date.getFullYear());
            }}
          />
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSlotType("weekday");
                setShowSlotModal(true);
                setEditRuleIndex(null);
                setSlots([{ start: "09:00", end: "17:00" }]);
              }}
            >
              + Add Weekly Slot
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSlotType("range");
                setShowSlotModal(true);
                setEditRuleIndex(null);
                setSlots([{ start: "09:00", end: "17:00" }]);
              }}
            >
              + Add Date Range Slot
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-2">Preview (for selected date)</h3>
          {selectedDate && (
            <div>
              <strong>{format(selectedDate, "dd MMMM yyyy (EEEE)")}</strong>
              <ul className="mt-2">
                {currentMonthRules
                  .filter(
                    (rule) =>
                      (rule.type === "date" &&
                        rule.date === format(selectedDate, "yyyy-MM-dd")) ||
                      (rule.type === "weekday" &&
                        rule.weekday === format(selectedDate, "EEEE")) ||
                      (rule.type === "range" &&
                        rule.start <= format(selectedDate, "yyyy-MM-dd") &&
                        rule.end >= format(selectedDate, "yyyy-MM-dd"))
                  )
                  .flatMap((rule) => rule.slots)
                  .map((slot, i) => (
                    <li key={i}>
                      {slot.start} - {slot.end}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {showSlotModal && (
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
          <div className="bg-white p-8 shadow-lg w-full max-w-md rounded-3xl">
            <h2 className="font-bold mb-4">
              {slotType === "date" && (
                <>
                  {editRuleIndex !== null ? "Edit" : "Add"} Slot for{" "}
                  {selectedDate && format(selectedDate, "dd MMMM yyyy (EEEE)")}
                </>
              )}
              {slotType === "range" && <>Add Slot for Date Range</>}
              {slotType === "weekday" && <>Add Slot for Weekday</>}
            </h2>
            {slotType === "range" && (
              <div className="flex gap-2 mb-2">
                <input
                  type="date"
                  min={todayStr}
                  max={format(
                    new Date(calendarYear, calendarMonth, 0),
                    "yyyy-MM-dd"
                  )}
                  value={rangeStart ? format(rangeStart, "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    setRangeStart(
                      e.target.value ? new Date(e.target.value) : null
                    )
                  }
                />
                <span>to</span>
                <input
                  type="date"
                  min={rangeStart ? format(rangeStart, "yyyy-MM-dd") : todayStr}
                  max={format(
                    new Date(calendarYear, calendarMonth, 0),
                    "yyyy-MM-dd"
                  )}
                  value={rangeEnd ? format(rangeEnd, "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    setRangeEnd(
                      e.target.value ? new Date(e.target.value) : null
                    )
                  }
                />
              </div>
            )}
            {slotType === "weekday" && (
              <select
                className="border p-2 rounded mb-2"
                value={slotWeekday}
                onChange={(e) => setSlotWeekday(e.target.value)}
              >
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            )}
            <div>
              {slots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateSlot(i, "start", e.target.value)}
                    className="border p-1 rounded"
                    step="900"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateSlot(i, "end", e.target.value)}
                    className="border p-1 rounded"
                    step="900"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeSlot(i)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="secondary" onClick={addSlot}>
                + Add Time Slot
              </Button>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSaveRule}>
                {editRuleIndex !== null ? "Update" : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSlotModal(false);
                  setEditRuleIndex(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      <div>
        <h3 className="font-bold mb-2">
          All Availability Rules for{" "}
          {format(new Date(calendarYear, calendarMonth - 1), "MMMM yyyy")}
        </h3>
        {currentMonthRules.length === 0 && (
          <p className="text-muted-foreground">
            No rules added yet for this month.
          </p>
        )}
        {currentMonthRules.map((rule, idx) => (
          <div
            key={idx}
            className="border p-4 rounded mb-2 flex justify-between items-center"
          >
            <div>
              <strong>
                {rule.type === "date" &&
                  `Date: ${format(new Date(rule.date), "dd MMMM yyyy")}`}
                {rule.type === "range" &&
                  `Range: ${format(
                    new Date(rule.start),
                    "dd MMMM yyyy"
                  )} to ${format(new Date(rule.end), "dd MMMM yyyy")}`}
                {rule.type === "weekday" && `Weekly: ${rule.weekday}s`}
              </strong>
              <ul>
                {rule.slots.map((slot, i) => (
                  <li key={i}>
                    {slot.start} - {slot.end}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              {rule.type === "date" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEditRule(rule, idx)}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeRule(idx)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button onClick={saveSettings} disabled={loading} className="mt-4">
        {loading ? "Saving..." : "Save Timeslot Settings"}
      </Button>
    </div>
  );
}
