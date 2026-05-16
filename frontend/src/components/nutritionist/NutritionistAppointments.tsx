import { useEffect, useState } from "react";
import { toast } from "sonner";
import { nutritionistAppointmentsApi } from "@/services/api";
import type { NutritionistAppointment } from "@/types/api";
import { Calendar, Check, CheckCheck, X, Clock,Video } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
} from "@/components/ui";

export default function AppointmentsList() {
  const [appts, setAppts] = useState<NutritionistAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "pending">("all");

  const load = () => {
    setLoading(true);
    nutritionistAppointmentsApi
      .my()
      .then((r) => setAppts(r.appointments ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const today = new Date().toISOString().slice(0, 10);
  const visible = appts.filter((a) => {
    const d = a.scheduledAt;
    if (filter === "today") return d === today;
    if (filter === "upcoming") return d > today && a.status !== "CANCELLED";
    if (filter === "pending") return a.status === "PENDING";
    return true;
  });

  const cancel = async (id: number) => {
    try {
      await nutritionistAppointmentsApi.cancel(id);
      toast.success("Appointment cancelled");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const complete = async (id: number) => {
    try {
      await nutritionistAppointmentsApi.complete(id);
      toast.success("Marked as completed");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const confirm = async (id: number) => {
    try {
      await nutritionistAppointmentsApi.confirm(id);
      toast.success("Appointment confirmed");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  // Status badge variant mapping
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "CONFIRMED": return "default";
      case "PENDING": return "secondary";
      case "CANCELLED": return "destructive";
      case "COMPLETED": return "outline";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {(["all", "today", "upcoming", "pending"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Appointments card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-2 h-8 w-8 opacity-30" />
              No appointments to show.
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((a) => {
                const name = a.patientName ?? `Client #${a.id}`;
                const dt = new Date(a.scheduledAt);
                const dateStr = isNaN(dt.getTime()) ? a.scheduledAt : dt.toLocaleDateString();
                const timeStr = a.time ?? (isNaN(dt.getTime()) ? "" : dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
                const isEditable = a.status !== "COMPLETED" && a.status !== "CANCELLED";

                return (
                  <div
                    key={a.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center"
                  >
                    {/* Date & Time */}
                    <div className="min-w-[100px]">
                      <div className="font-bold">{timeStr || "--:--"}</div>
                      <div className="text-xs text-muted-foreground">{dateStr}</div>
                    </div>

                    {/* Client Info */}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{name}</div>
                      {a.notes && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {a.notes}
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <Badge variant={getStatusVariant(a.status)} className="w-fit">
                      {a.status}
                    </Badge>

                    {/* Join button for confirmed appointments */}
{a.status === "CONFIRMED" && a.jitsiLink && (
  <Button asChild size="sm" variant="default" className="gap-1">
    <a href={a.jitsiLink} target="_blank" rel="noopener noreferrer">
      <Video className="h-3.5 w-3.5" />
      Join
    </a>
  </Button>
)}

                    {/* Action Buttons */}
                    {isEditable && (
                      <div className="flex flex-wrap gap-2">
                        {a.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => confirm(a.id)}
                            className="gap-1"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Confirm
                          </Button>
                        )}
                        {a.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => complete(a.id)}
                            className="gap-1"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Complete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancel(a.id)}
                          className="gap-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}