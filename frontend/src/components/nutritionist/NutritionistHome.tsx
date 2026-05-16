import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { nutritionistAppointmentsApi } from "@/services/api";
import type { NutritionistAppointment } from "@/types/api";
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Skeleton
} from "@/components/ui";
import {
  CalendarDays, CalendarCheck, Inbox, TrendingUp,
  Users, Clock, ArrowRight,
} from "lucide-react";

export default function NutritionistHome() {
  const [appts, setAppts] = useState<NutritionistAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    nutritionistAppointmentsApi
      .my()
      .then((r) => setAppts(r.appointments ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todays   = appts.filter((a) => a.scheduledAt === today);
  const upcoming = appts.filter((a) => a.scheduledAt > today && a.status !== "CANCELLED");
  const pending  = appts.filter((a) => a.status === "PENDING");

  const stats = [
    { label: "Today",    value: todays.length,   icon: CalendarCheck, iconBg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Upcoming", value: upcoming.length,  icon: CalendarDays,  iconBg: "bg-orange-100 dark:bg-orange-950", iconColor: "text-orange-600 dark:text-orange-400" }, // fallback orange if not in palette? Use secondary or custom? But user said "palette only" – we should map to existing theme variables. Alternative: use bg-secondary/20 text-secondary-foreground? Let's use theme's orange if defined, else secondary.
    // Actually shadcn default palette has no orange. We can use bg-primary/30 or bg-accent? Keep using theme colors.
    { label: "Pending",  value: pending.length,   icon: Inbox,         iconBg: "bg-warning/10", iconColor: "text-warning" },
    { label: "Total",    value: appts.length,     icon: TrendingUp,    iconBg: "bg-primary/10", iconColor: "text-primary" },
  ];

  // Better to use only theme variables. For warmth, we can use accent, secondary, etc.
  // Let's redefine stats with only theme-safe classes:
  const themeStats = [
    { label: "Today",    value: todays.length,   icon: CalendarCheck, bg: "bg-primary/10", color: "text-primary" },
    { label: "Upcoming", value: upcoming.length,  icon: CalendarDays,  bg: "bg-secondary/20", color: "text-secondary-foreground" },
    { label: "Pending",  value: pending.length,   icon: Inbox,         bg: "bg-destructive/10", color: "text-destructive" },
    { label: "Total",    value: appts.length,     icon: TrendingUp,    bg: "bg-primary/10", color: "text-primary" },
  ];

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "CONFIRMED": return "default";
      case "PENDING": return "secondary";
      case "CANCELLED": return "destructive";
      case "COMPLETED": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats cards – responsive grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {themeStats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4 sm:p-6">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <div className="font-syne text-2xl font-bold">
                  {loading ? "—" : s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two‑column layout for today + quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" /> Today's Appointments
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/nutritionist/appointments" className="flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : error ? (
              <p className="py-4 text-center text-sm text-destructive">{error}</p>
            ) : todays.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CalendarCheck className="mx-auto mb-2 h-7 w-7 opacity-30" />
                <p className="text-sm">No appointments today.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todays.map((a) => <AppointmentRow key={a.id} a={a} />)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 text-xs sm:py-4" asChild>
              <Link to="/nutritionist/patients">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                View Clients
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 text-xs sm:py-4" asChild>
              <Link to="/nutritionist/appointments">
                <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
                Schedule
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 text-xs sm:py-4" asChild>
              <Link to="/nutritionist/availability">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                Availability
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 text-xs sm:py-4" asChild>
              <Link to="/nutritionist/nutrition-plans">
                <Inbox className="h-4 w-4 sm:h-5 sm:w-5" />
                Nutrition Plans
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending requests banner */}
      {pending.length > 0 && (
        <Card className="border-2 border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Inbox className="h-4 w-4" /> 
              {pending.length} Pending Request{pending.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.map((a) => <AppointmentRow key={a.id} a={a} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Shared appointment row component using Badge
function AppointmentRow({ a }: { a: NutritionistAppointment }) {
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "CONFIRMED": return "default";
      case "PENDING": return "secondary";
      case "CANCELLED": return "destructive";
      case "COMPLETED": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:flex-nowrap">
      <div className="min-w-[56px] text-center">
        <div className="text-sm font-bold">{a.time ?? "—"}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{a.patientName ?? "Unknown"}</div>
        {a.notes && <div className="truncate text-xs text-muted-foreground">{a.notes}</div>}
      </div>
      <Badge variant={getStatusVariant(a.status ?? "")}>
        {a.status}
      </Badge>
    </div>
  );
}