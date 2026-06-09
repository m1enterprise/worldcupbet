import React, { useRef, useEffect } from "react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { pl } from "date-fns/locale";

export default function DaySelector({ dates, selectedDate, onSelect }) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left, behavior: "smooth" });
    }
  }, [selectedDate]);

  const getLabel = (dateStr) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Dziś";
    if (isTomorrow(d)) return "Jutro";
    return format(d, "EEE", { locale: pl });
  };

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 -mx-4"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
    >
      {dates.map((dateStr) => {
        const active = dateStr === selectedDate;
        const d = parseISO(dateStr);
        return (
          <button
            key={dateStr}
            ref={active ? activeRef : null}
            onClick={() => onSelect(dateStr)}
            className={`shrink-0 flex flex-col items-center px-3.5 py-2 rounded-xl transition-all ${
              active
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
              {getLabel(dateStr)}
            </span>
            <span className="text-base font-bold leading-tight">
              {format(d, "d")}
            </span>
            <span className="text-[10px] font-medium opacity-60">
              {format(d, "MMM", { locale: pl })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
