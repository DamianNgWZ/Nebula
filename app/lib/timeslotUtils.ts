export type TimeSlot = { start: string; end: string };
export type TimeslotRule =
  | { type: "date"; year: number; month: number; date: string; slots: TimeSlot[] }
  | { type: "range"; year: number; month: number; start: string; end: string; slots: TimeSlot[] }
  | { type: "weekly"; year: number; month: number; weekday: string; slots: TimeSlot[] }
  | { type: "weekday"; year: number; month: number; weekday: string; slots: TimeSlot[] };

export function getSlotsForDate(
  rules: TimeslotRule[],
  selectedDate: string
): TimeSlot[] {
  const dateObj = new Date(selectedDate);
  const yyyy_mm_dd = selectedDate;
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();

  // 1. Specific date rule for this month/year
  const dateRule = rules.find(
    r =>
      r.type === "date" &&
      r.date === yyyy_mm_dd &&
      r.month === month &&
      r.year === year
  );
  if (dateRule) return dateRule.slots;

  // 2. Date range rule for this month/year
  const rangeRule = rules.find(
    r =>
      r.type === "range" &&
      yyyy_mm_dd >= r.start &&
      yyyy_mm_dd <= r.end &&
      r.month === month &&
      r.year === year
  );
  if (rangeRule) return rangeRule.slots;

  // 3. Weekly rule for this month/year
  const weeklyRule = rules.find(
    r =>
      r.type === "weekly" &&
      r.weekday === weekday &&
      r.month === month &&
      r.year === year
  );
  if (weeklyRule) return weeklyRule.slots;

  // 4. Weekday rule for this month/year
  const weekdayRule = rules.find(
    r =>
      r.type === "weekday" &&
      r.weekday === weekday &&
      r.month === month &&
      r.year === year
  );
  if (weekdayRule) return weekdayRule.slots;

  return [];
}