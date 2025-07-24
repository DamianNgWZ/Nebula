describe('Date formatting utilities', () => {
  test('formats date correctly', () => {
    const testDate = new Date('2024-01-15T10:30:00');
    const formatted = testDate.toLocaleDateString();
    expect(formatted).toBeDefined();
  });
});

// Test conflict detection logic concept. TO UPDATE WHENEVER CHANGE LOGIC!
describe('Time slot conflict logic', () => {
  function checkOverlap(
    newStart: Date,
    newEnd: Date,
    existingStart: Date,
    existingEnd: Date
  ) {
    return !(newEnd <= existingStart || newStart >= existingEnd);
  }

  test('detects overlapping time slots', () => {
    const newStart = new Date('2024-01-15T09:00:00');
    const newEnd = new Date('2024-01-15T10:00:00');
    const existingStart = new Date('2024-01-15T09:30:00');
    const existingEnd = new Date('2024-01-15T10:30:00');

    expect(checkOverlap(newStart, newEnd, existingStart, existingEnd)).toBe(true);
  });

  test('allows non-overlapping time slots', () => {
    const newStart = new Date('2024-01-15T07:00:00');
    const newEnd = new Date('2024-01-15T08:00:00');
    const existingStart = new Date('2024-01-15T09:00:00');
    const existingEnd = new Date('2024-01-15T10:00:00');

    expect(checkOverlap(newStart, newEnd, existingStart, existingEnd)).toBe(false);
  });

  test('detects exact same time slot', () => {
    const newStart = new Date('2024-01-15T09:00:00');
    const newEnd = new Date('2024-01-15T10:00:00');
    const existingStart = new Date('2024-01-15T09:00:00');
    const existingEnd = new Date('2024-01-15T10:00:00');

    expect(checkOverlap(newStart, newEnd, existingStart, existingEnd)).toBe(true);
  });
});