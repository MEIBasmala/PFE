import { useEffect, useState } from "react";
import { toast } from "sonner";
import { nutritionistSlotsApi } from "@/services/api";
import type { AvailableSlot } from "@/types/api";
import {
  CalendarIcon, Clock, Trash2, CheckCircle2, Info,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  format, addDays, startOfWeek, addWeeks, subWeeks,
  isBefore, startOfToday, parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_DURATION = 45;

const TIME_BLOCKS: string[] = (() => {
  const blocks: string[] = [];
  let minutes = 8 * 60;
  while (minutes + SLOT_DURATION <= 20 * 60) {
    const h = Math.floor(minutes / 60).toString().padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    blocks.push(`${h}:${m}`);
    minutes += SLOT_DURATION;
  }
  return blocks;
})();

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const calcEndTime = (start: string): string => {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + SLOT_DURATION;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60)
    .toString()
    .padStart(2, "0")}`;
};

type TemplateCell = { dayIndex: number; startTime: string };

// ─── Cell style helpers using KhabirLens CSS vars ─────────────────────────────

const cellBase = "h-8 w-full rounded border transition-all text-[10px] font-semibold select-none";

const cellStyle = (
  published: AvailableSlot | undefined,
  isSelected: boolean,
  isPast: boolean
) => {
  if (published?.isBooked)
    // orange from palette
    return "cursor-not-allowed bg-[hsl(var(--orange-20))] border-[hsl(var(--orange))] text-[hsl(var(--orange))]";
  if (published)
    // KhabirLens green-light bg, green-dark border — hover turns red for delete hint
    return "bg-[hsl(var(--green-light))] border-[hsl(var(--green))] text-[hsl(var(--green-dark))] hover:bg-[hsl(var(--error-light))] hover:border-[hsl(var(--error))] hover:text-[hsl(var(--error))] cursor-pointer";
  if (isSelected)
    // orange (primary) selected state
    return "bg-[hsl(var(--orange-20))] border-[hsl(var(--orange))] text-[hsl(var(--orange))]";
  if (isPast)
    return "bg-transparent border-transparent opacity-20 cursor-not-allowed";
  // empty
  return "bg-[hsl(var(--gray-bg))] border-dashed border-[hsl(var(--gray-20))] hover:bg-[hsl(var(--green-light))] hover:border-[hsl(var(--green))] cursor-pointer";
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NutritionistAvailability() {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [selected, setSelected] = useState<TemplateCell[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  // Mobile: which day column is active (0 = Mon … 6 = Sun)
  const [mobileDayIndex, setMobileDayIndex] = useState<number>(() => {
    const todayDow = new Date().getDay(); // 0=Sun
    return todayDow === 0 ? 6 : todayDow - 1; // convert to Mon-based
  });

  const loadSlots = () => {
    setLoading(true);
    nutritionistSlotsApi
      .my()
      .then((r) => setSlots(r.slots ?? []))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load slots"))
      .finally(() => setLoading(false));
  };

  useEffect(loadSlots, []);

  const toggleCell = (dayIndex: number, startTime: string) => {
    setSelected((prev) => {
      const exists = prev.some((c) => c.dayIndex === dayIndex && c.startTime === startTime);
      return exists
        ? prev.filter((c) => !(c.dayIndex === dayIndex && c.startTime === startTime))
        : [...prev, { dayIndex, startTime }];
    });
  };

  const isCellSelected = (dayIndex: number, startTime: string) =>
    selected.some((c) => c.dayIndex === dayIndex && c.startTime === startTime);

  const getPublishedSlot = (dayIndex: number, startT: string): AvailableSlot | undefined => {
    const dateStr = format(addDays(weekStart, dayIndex), "yyyy-MM-dd");
    return slots.find((s) => s.date.slice(0, 10) === dateStr && s.startTime === startT);
  };

  const publishWeek = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one time slot first.");
      return;
    }
    setPublishing(true);
    let created = 0;
    let skipped = 0;
    for (const cell of selected) {
      const date = addDays(weekStart, cell.dayIndex);
      if (isBefore(date, startOfToday())) { skipped++; continue; }
      if (getPublishedSlot(cell.dayIndex, cell.startTime)) { skipped++; continue; }
      try {
        await nutritionistSlotsApi.create({
          date: format(date, "yyyy-MM-dd"),
          startTime: cell.startTime,
          endTime: calcEndTime(cell.startTime),
        });
        created++;
      } catch { skipped++; }
    }
    if (created > 0) toast.success(`${created} slot${created > 1 ? "s" : ""} published!`);
    if (skipped > 0) toast.info(`${skipped} skipped (past or already exist).`);
    loadSlots();
    setSelected([]);
    setPublishing(false);
  };

  const removeSlot = async (id: number) => {
    try {
      await nutritionistSlotsApi.remove(id);
      toast.success("Slot removed");
      loadSlots();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove slot");
    }
  };

  const weekDates = DAYS_SHORT.map((_, i) => addDays(weekStart, i));
  const today = startOfToday();
  const isPastDay = (dayIndex: number) => isBefore(addDays(weekStart, dayIndex), today);

  const groupedSlots = slots.reduce<Record<string, AvailableSlot[]>>((acc, slot) => {
    const key = slot.date.slice(0, 10);
    (acc[key] ??= []).push(slot);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedSlots).sort();

  // Shared cell click handler
  const handleCellClick = (dayIndex: number, time: string) => {
    const published = getPublishedSlot(dayIndex, time);
    if (published && !published.isBooked) {
      removeSlot(published.id);
    } else if (!published) {
      toggleCell(dayIndex, time);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6">

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--green))] bg-[hsl(var(--green-light)/0.3)] px-4 py-3 text-sm text-[hsl(var(--green-dark))]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Each slot is <strong>45 minutes</strong> — suitable for both initial assessments (45–60 min)
            and follow-up appointments (30–45 min). Clients will see this duration when booking.
          </span>
        </div>

        {/* ── Grid card ── */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            {/* Title row + week navigator */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarIcon className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setWeekStart(w => subWeeks(w, 1))}
                  disabled={isBefore(subWeeks(weekStart, 1), startOfToday())}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs sm:text-sm font-medium min-w-[130px] sm:min-w-[160px] text-center tabular-nums">
                  {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
                </span>
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setWeekStart(w => addWeeks(w, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              Click cells to select, then <strong>Publish</strong> to save.
              Click a <span className="font-medium text-[hsl(var(--green-dark))]">green</span> slot to remove it.
            </p>
            <p className="text-xs text-muted-foreground mt-1 sm:hidden">
              Tap a day, tap time slots to select, then <strong>Publish</strong>.
            </p>
          </CardHeader>

          <CardContent className="px-3 sm:px-6">

            {/* ── MOBILE VIEW: day tabs + single-column time list ── */}
            <div className="sm:hidden">
              {/* Day pill tabs */}
              <div className="flex gap-1 overflow-x-auto pb-2 mb-3 scrollbar-none">
                {DAYS_SHORT.map((day, i) => {
                  const isPast = isPastDay(i);
                  const isToday = format(weekDates[i], "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                  const hasSelected = selected.some(c => c.dayIndex === i);
                  const hasPublished = slots.some(s => s.date.slice(0, 10) === format(weekDates[i], "yyyy-MM-dd"));
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setMobileDayIndex(i)}
                      className={cn(
                        "flex flex-col items-center min-w-[44px] px-2 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border",
                        mobileDayIndex === i
                          ? "bg-[hsl(var(--orange))] border-[hsl(var(--orange))] text-white"
                          : isPast
                          ? "opacity-35 border-transparent bg-transparent text-muted-foreground"
                          : "border-[hsl(var(--gray-line))] bg-card text-foreground hover:border-[hsl(var(--orange))]"
                      )}
                    >
                      <span>{day}</span>
                      <span className={cn(
                        "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                        isToday && mobileDayIndex !== i ? "bg-[hsl(var(--orange-20))] text-[hsl(var(--orange))]" : ""
                      )}>
                        {format(weekDates[i], "d")}
                      </span>
                      {/* dot indicators */}
                      <div className="flex gap-0.5 mt-0.5 h-1">
                        {hasPublished && <span className="h-1 w-1 rounded-full bg-[hsl(var(--green-dark))]" />}
                        {hasSelected && <span className="h-1 w-1 rounded-full bg-[hsl(var(--orange))]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Single day time blocks */}
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                {format(weekDates[mobileDayIndex], "EEEE, MMMM d")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TIME_BLOCKS.map((time) => {
                  const published = getPublishedSlot(mobileDayIndex, time);
                  const isSelected = isCellSelected(mobileDayIndex, time);
                  const isPast = isPastDay(mobileDayIndex);
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isPast || !!published?.isBooked}
                      onClick={() => handleCellClick(mobileDayIndex, time)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                        published?.isBooked
                          ? "cursor-not-allowed bg-[hsl(var(--orange-20))] border-[hsl(var(--orange))] text-[hsl(var(--orange))]"
                          : published
                          ? "bg-[hsl(var(--green-light))] border-[hsl(var(--green))] text-[hsl(var(--green-dark))] active:bg-[hsl(var(--error-light))]"
                          : isSelected
                          ? "bg-[hsl(var(--orange-20))] border-[hsl(var(--orange))] text-[hsl(var(--orange))]"
                          : isPast
                          ? "opacity-25 cursor-not-allowed border-dashed border-muted"
                          : "bg-card border-[hsl(var(--gray-line))] hover:border-[hsl(var(--green))] hover:bg-[hsl(var(--green-light)/0.4)] active:bg-[hsl(var(--green-light))]"
                      )}
                    >
                      <span className="tabular-nums">{time}</span>
                      <span className="opacity-60 tabular-nums text-[10px]">→{calcEndTime(time)}</span>
                      {published?.isBooked && <span className="text-[9px] font-bold ml-1">BOOKED</span>}
                      {published && !published.isBooked && <span>✓</span>}
                      {isSelected && !published && <span>+</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── DESKTOP VIEW: full 7-column grid ── */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[560px]">
                {/* Day headers */}
                <div className="grid mb-1" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
                  <div />
                  {DAYS_SHORT.map((day, i) => (
                    <div key={day} className={cn("pb-2 text-center", isPastDay(i) && "opacity-35")}>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{day}</div>
                      <div className={cn(
                        "mx-auto mt-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        format(weekDates[i], "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
                          ? "bg-[hsl(var(--orange))] text-white"
                          : "text-foreground"
                      )}>
                        {format(weekDates[i], "d")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time rows */}
                <div className="space-y-[3px]">
                  {TIME_BLOCKS.map((time) => (
                    <div key={time} className="grid items-center" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
                      <div className="pr-2 text-right text-[10px] tabular-nums text-muted-foreground leading-none">{time}</div>
                      {DAYS_SHORT.map((_, dayIndex) => {
                        const published = getPublishedSlot(dayIndex, time);
                        const isSelected = isCellSelected(dayIndex, time);
                        const isPast = isPastDay(dayIndex);
                        return (
                          <Tooltip key={dayIndex}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                disabled={isPast || !!published?.isBooked}
                                onClick={() => handleCellClick(dayIndex, time)}
                                className={cn(cellBase, "mx-[2px] w-[calc(100%-4px)]", cellStyle(published, isSelected, isPast))}
                              >
                                {published?.isBooked ? "●" : published ? "✓" : isSelected ? "+" : ""}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {published?.isBooked
                                ? `Booked · ${time}–${calcEndTime(time)}`
                                : published
                                ? `Available · click to remove`
                                : isPast ? "Past"
                                : isSelected
                                ? `${time}–${calcEndTime(time)} · will be published`
                                : `${format(weekDates[dayIndex], "EEE d MMM")} · ${time}–${calcEndTime(time)}`}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend + publish — shared for both views */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {[
                  { bg: "bg-[hsl(var(--gray-bg))]", border: "border-dashed border-[hsl(var(--gray-20))]", label: "Empty" },
                  { bg: "bg-[hsl(var(--orange-20))]", border: "border-[hsl(var(--orange))]", label: "Selected" },
                  { bg: "bg-[hsl(var(--green-light))]", border: "border-[hsl(var(--green))]", label: "Published" },
                  { bg: "bg-[hsl(var(--orange-20))]", border: "border-[hsl(var(--orange))] opacity-70", label: "Booked" },
                ].map(({ bg, border, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className={cn("inline-block h-3 w-4 rounded border", bg, border)} />
                    {label}
                  </span>
                ))}
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {selected.length > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelected([])}>Clear</Button>
                  </>
                )}
                <Button
                  onClick={publishWeek}
                  disabled={publishing || selected.length === 0}
                  size="sm"
                  className="gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {publishing ? "Publishing…" : `Publish${selected.length > 0 ? ` (${selected.length})` : ""}`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Upcoming slots list ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              All Upcoming Slots
              {slots.length > 0 && (
                <Badge variant="secondary" className="ml-1">{slots.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
            {!loading && slots.length === 0 && (
              <div className="py-10 text-center text-muted-foreground">
                <CalendarIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">No slots yet. Use the grid above to set your availability.</p>
              </div>
            )}
            {!loading && sortedDates.length > 0 && (
              <div className="space-y-4">
                {sortedDates.map((dateKey) => (
                  <div key={dateKey}>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {format(parseISO(dateKey), "EEEE, MMMM d, yyyy")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {groupedSlots[dateKey]
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((slot) => (
                          <div
                            key={slot.id}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                              slot.isBooked
                                ? "border-[hsl(var(--orange))] bg-[hsl(var(--orange-20))] text-[hsl(var(--orange))]"
                                : "border-[hsl(var(--green))] bg-[hsl(var(--green-light)/0.4)] text-[hsl(var(--green-dark))] hover:bg-[hsl(var(--green-light))]"
                            )}
                          >
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium tabular-nums">{slot.startTime}</span>
                            <span className="text-xs opacity-60">→ {slot.endTime}</span>
                            {slot.isBooked ? (
                              <Badge className="bg-[hsl(var(--orange))] text-white text-[10px] px-1.5 py-0">
                                Booked
                              </Badge>
                            ) : (
                              <button
                                type="button"
                                onClick={() => removeSlot(slot.id)}
                                className="ml-0.5 text-[hsl(var(--green-dark))/50] hover:text-[hsl(var(--error))] transition-colors"
                                aria-label="Remove slot"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </TooltipProvider>
  );
}