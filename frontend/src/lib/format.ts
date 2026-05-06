export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: "2-digit" });
}
export function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short" });
}
export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}
export function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); return x; }
export function endOfDay(d: Date): Date { const x = new Date(d); x.setHours(23,59,59,999); return x; }
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}
export const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"] as const;
