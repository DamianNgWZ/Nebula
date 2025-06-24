"use client";
import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  value,
  onChange,
  disabled = false,
  size = 24,
}: {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  size?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  // using google review example
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`transition-colors`}
            style={{ width: size, height: size }}
            strokeWidth={1.5}
            fill={
              (hovered ?? value) >= star
                ? "#facc15" // yellow-400
                : "#e5e7eb" // gray-200
            }
            stroke={
              (hovered ?? value) >= star
                ? "#facc15"
                : "#a3a3a3"
            }
          />
        </button>
      ))}
    </div>
  );
}