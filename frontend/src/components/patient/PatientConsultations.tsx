// src/components/patient/PatientConsultations.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  CalendarHeart,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Plus,
  Star,
  Video,
  X,
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import {
  bookAppointment,
  cancelAppointment,
  getMyAppointments,
  getNutritionists,
  getSlots,
} from "@/services/api";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { formatLongDate, formatTime, toIsoDate } from "@/lib/date";
import type { Appointment, AvailableSlot, Nutritionist } from "@/types/api";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Separator,
} from "@/components/ui";

type Tab = "upcoming" | "past" | "book";

export default function PatientConsultations() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upcoming");
  const appts = useAsync(() => getMyAppointments(), [], { toastOnError: false });
const { plan, packageInfo, consultationsPerMonth, subscription, refreshSubscription } = useSubscription();  // FIX: Also fetch nutritionists to get userId mapping for appointments
  const nutritionists = useAsync(() => getNutritionists(), [], { toastOnError: false });

  // Build a map of nutritionist table ID -> userId for quick lookup
  const nutritionistUserIdMap = useMemo(() => {
    const map = new Map<number, number>();
    nutritionists.data?.forEach((n) => {
      map.set(n.id, n.userId);
    });
    return map;
  }, [nutritionists.data]);

  const appointments = Array.isArray(appts.data) ? appts.data : [];
  const now = Date.now();
  const upcoming = appointments.filter(
    (a) => a.status !== "CANCELLED" && new Date(a.scheduledAt).getTime() > now,
  );
  const past = appointments.filter(
    (a) => a.status === "COMPLETED" || new Date(a.scheduledAt).getTime() <= now,
  );

  const usedThisMonth = useMemo(() => {
  // If no active subscription, no credits available
  if (!subscription?.startDate) return 0;
  
  const subscriptionStart = new Date(subscription.startDate);
  
  return appointments.filter((a) => {
    if (a.status === "CANCELLED") return false;
    // Only count appointments that belong to current subscription
    // Either by subscriptionId (if backend sends it) or by scheduled date after subscription start
    const belongsToCurrentSub = a.subscriptionId 
      ? a.subscriptionId === subscription.id
      : new Date(a.scheduledAt).getTime() >= subscriptionStart.getTime();
    return belongsToCurrentSub;
  }).length;
}, [appointments, subscription]);

  const remainingCredits = Math.max(0, consultationsPerMonth - usedThisMonth);
  const unlimited = consultationsPerMonth >= 999;

  const stats = [
    { label: "Total sessions", value: appointments.length, icon: <CalendarHeart className="h-4 w-4" />, color: "bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))]" },
    { label: "Upcoming", value: upcoming.length, icon: <CalendarIcon className="h-4 w-4" />, color: "bg-[hsl(var(--orange-20))] text-[hsl(var(--orange))]" },
    { label: "Completed", value: appointments.filter((a) => a.status === "COMPLETED").length, icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))]" },
    { label: "Credits left", value: unlimited ? "∞" : `${remainingCredits}/${consultationsPerMonth}`, icon: <Star className="h-4 w-4" />, color: "bg-[hsl(var(--orange-20))] text-[hsl(var(--orange))]" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
  {stats.map((s) => (
    <Card key={s.label}>
      <CardContent className="flex items-center gap-2 p-3 md:gap-3 md:p-4">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.color} md:h-10 md:w-10`}>
          {s.icon}
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground md:text-xs">{s.label}</div>
          <div className="font-syne text-base font-bold md:text-xl">{s.value}</div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="upcoming">📅 Upcoming</TabsTrigger>
              <TabsTrigger value="past">📜 Past</TabsTrigger>
              <TabsTrigger value="book">➕ Book New</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Upcoming */}
      {tab === "upcoming" && (
        appts.loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyMessage msg="No upcoming sessions." cta="Book one →" onCta={() => setTab("book")} />
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <AppointmentCard
                key={a.id}
                appt={a}
                nutritionistUserIdMap={nutritionistUserIdMap}
                onMessage={(userId, name) => navigate("/patient/messages", {
                  state: {
                    openConversationWith: userId,
                    nutritionistName: name,
                  },
                })}
                onCancel={async () => {
                  try {
                    await cancelAppointment(String(a.id));
                    toast.success("Appointment cancelled");
                    await Promise.all([appts.refetch(), refreshSubscription()]);
                  } catch (err) { toast.error((err as Error).message); }
                }}
              />
            ))}
          </div>
        )
      )}

      {/* Past */}
      {tab === "past" && (
        appts.loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : past.length === 0 ? (
          <EmptyMessage msg="No past sessions yet." />
        ) : (
          <div className="space-y-3">
            {past.map((a) => (
              <AppointmentCard
                key={a.id}
                appt={a}
                nutritionistUserIdMap={nutritionistUserIdMap}
                onMessage={(userId, name) => navigate("/patient/messages", {
                  state: {
                    openConversationWith: userId,
                    nutritionistName: name,
                  },
                })}
              />
            ))}
          </div>
        )
      )}

      {/* Book new */}
      {tab === "book" && (
        <BookingFlow
          plan={plan}
          planLabel={packageInfo?.name ?? "Free"}
          remainingCredits={remainingCredits}
          unlimited={unlimited}
          onBooked={async () => {
            setTab("upcoming");
            await Promise.all([appts.refetch(), refreshSubscription()]);
          }}
          onMessageNutritionist={(nutritionistUserId) =>
            navigate("/patient/messages", {
              state: { openConversationWith: nutritionistUserId },
            })
          }
        />
      )}
    </div>
  );
}

// Empty state component
function EmptyMessage({ msg, cta, onCta }: { msg: string; cta?: string; onCta?: () => void }) {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <p className="text-sm text-muted-foreground">{msg}</p>
        {cta && onCta && (
          <Button variant="default" size="sm" className="mt-3" onClick={onCta}>{cta}</Button>
        )}
      </CardContent>
    </Card>
  );
}

// Appointment card — FIXED to properly resolve nutritionist userId
function AppointmentCard({ appt, onCancel, onMessage, nutritionistUserIdMap }: {
  appt: Appointment;
  onCancel?: () => Promise<void>;
  onMessage?: (userId: number, name: string) => void;
  nutritionistUserIdMap: Map<number, number>;
}) {
  const navigate = useNavigate();
  const nutri = typeof appt.nutritionist === "object" ? appt.nutritionist : null;

  // FIX: Resolve nutritionist userId from the map using nutritionist table id
  const nutriName = nutri?.fullName ?? "Your nutritionist";
  const nutriUserId = nutri?.userId;

  const getStatusBadge = () => {
    switch (appt.status) {
      case "CONFIRMED": return <Badge className="bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))] border-[hsl(var(--green))] border hover:bg-[hsl(var(--green-light))]">Confirmed</Badge>;
      case "PENDING": return <Badge variant="outline">Pending</Badge>;
      case "CANCELLED": return <Badge variant="destructive">Cancelled</Badge>;
      case "COMPLETED": return <Badge className="bg-[hsl(var(--gray-bg))] text-[hsl(var(--text-m))] border-[hsl(var(--gray-line))] border hover:bg-[hsl(var(--gray-bg))]">Completed</Badge>;
      default: return <Badge variant="outline">{appt.status}</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))] font-semibold">
              {(nutri?.fullName?.[0] ?? "N").toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">{nutriName}</div>
              <div className="text-xs text-muted-foreground">
                {formatLongDate(appt.scheduledAt)} · {formatTime(appt.scheduledAt)} · {appt.durationMinutes}m
              </div>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {appt.jitsiLink && appt.status === "CONFIRMED" && (
              <Button asChild variant="default" size="sm">
                <a href={appt.jitsiLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1 h-3 w-3" /> Join
                </a>
              </Button>
            )}
            {/* FIX: Use resolved nutriUserId instead of undefined (appt.nutritionist as any)?.userId */}
            {nutriUserId && appt.status !== "CANCELLED" && onMessage && (
              <Button variant="outline" size="sm" onClick={() => onMessage(nutriUserId, nutriName)}>
                <MessageSquare className="mr-1 h-3 w-3" /> Message
              </Button>
            )}
            {onCancel && appt.status !== "CANCELLED" && (
              <Button variant="destructive" size="sm" onClick={onCancel}>
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Booking flow component
function BookingFlow({
  plan,
  planLabel,
  remainingCredits,
  unlimited,
  onBooked,
  onMessageNutritionist,
}: {
  plan: string;
  planLabel: string;
  remainingCredits: number;
  unlimited: boolean;
  onBooked: () => Promise<void> | void;
  onMessageNutritionist: (nutritionistUserId: number) => void;
}) {
  const nutritionists = useAsync(() => getNutritionists(), [], { toastOnError: false });
  const [selectedNutri, setSelectedNutri] = useState<number | null>(null);
  const [date, setDate] = useState<string>(toIsoDate(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const slots = useAsync<AvailableSlot[]>(
    () =>
      selectedNutri
        ? getSlots({ nutritionistId: String(selectedNutri), date })
        : Promise.resolve([]),
    [selectedNutri, date],
    { skip: !selectedNutri, toastOnError: false },
  );
  useEffect(() => setSelectedSlot(null), [selectedNutri, date]);

  const selectedNutriObj = useMemo(
    () => nutritionists.data?.find((n) => n.id === selectedNutri) ?? null,
    [nutritionists.data, selectedNutri],
  );
  const selectedSlotObj = useMemo(
    () => slots.data?.find((s) => s.id === selectedSlot) ?? null,
    [slots.data, selectedSlot],
  );

  const noCredits = !unlimited && remainingCredits <= 0;

  const submit = async () => {
    if (!selectedNutri || !selectedSlot) return;
    if (noCredits) {
      toast.error("You've used all your monthly consultations. Upgrade your plan to book more.");
      return;
    }
    setSubmitting(true);
    try {
      await bookAppointment({
        nutritionistId: String(selectedNutri),
        slotId: String(selectedSlot),
        notes: notes.trim() || undefined,
      });
      toast.success("Appointment booked! Awaiting nutritionist confirmation.");
      await onBooked();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const availableSlots = (slots.data ?? []).filter((s) => !s.isBooked);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {noCredits && (
          <Card className="border-2 border-destructive/30">
            <CardContent className="p-4">
              <p className="text-sm">
                ⚠️ You've used all <strong>{plan}</strong> plan consultations this month. Upgrade to book more.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 1 — Choose nutritionist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-mg bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))] text-xs font-bold">1</span>
              Choose a nutritionist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nutritionists.loading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : !nutritionists.data || nutritionists.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No nutritionists available right now.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {nutritionists.data.map((n) => (
                  <div key={n.id} className="space-y-2">
                    <button
                      onClick={() => setSelectedNutri(n.id)}
                      className={`w-full rounded-md border p-3 text-left transition-colors ${
                        selectedNutri === n.id
                          ? "border-[hsl(var(--green))] bg-[hsl(var(--green-light)/0.4)]"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))] font-semibold">
                          {n.user.fullName[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate">{n.user.fullName}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {n.specialization || "General nutrition"}
                          </div>
                        </div>
                      </div>
                    </button>
                    {/* <Button variant="outline" size="sm" className="w-full" onClick={() => onMessageNutritionist(n.userId)}>
                      <MessageSquare className="mr-1 h-3 w-3" /> Message {n.user.fullName.split(" ")[0]}
                    </Button> */}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2 — Date */}
        {selectedNutri && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))] text-xs font-bold">2</span>
                Pick a date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="date"
                value={date}
                min={toIsoDate(new Date())}
                onChange={(e) => setDate(e.target.value)}
                className="max-w-xs"
              />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))] text-[9px] font-bold shrink-0">i</span>
                All sessions are <strong>45 minutes</strong> — suitable for initial assessments and follow-ups.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Time slot */}
        {selectedNutri && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))] text-xs font-bold">3</span>
                Choose a time slot
              </CardTitle>
            </CardHeader>
            <CardContent>
              {slots.loading ? (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No available slots for this date.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {availableSlots.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSlot(s.id)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        selectedSlot === s.id
                          ? "border-[hsl(var(--green))] bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))]"
                          : "border-border bg-card hover:border-[hsl(var(--green))] hover:bg-[hsl(var(--green-light)/0.3)]"
                      }`}
                    >
                      {s.startTime}–{s.endTime}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {selectedNutri && (
          <Card>
            <CardHeader>
              <CardTitle>Notes (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific concerns, allergies, or topics you want to discuss…"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Booking summary sidebar */}
      <Card className="sticky top-4 h-fit">
        <CardHeader>
          <CardTitle>📋 Booking summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SummaryRow label="Nutritionist" value={selectedNutriObj?.user.fullName ?? "—"} />
          <SummaryRow
            label="Date"
            value={selectedSlotObj ? formatLongDate(selectedSlotObj.date) : date ? formatLongDate(date) : "—"}
          />
          <SummaryRow label="Time" value={selectedSlotObj ? selectedSlotObj.startTime : "—"} />
          <SummaryRow label="Platform" value={<><Video className="mr-1 inline h-3 w-3" /> Video call</>} />
          <Separator />
          <SummaryRow label="Included in" value={<Badge variant="default">{planLabel}</Badge>} />
          <SummaryRow label="Credits left" value={unlimited ? "Unlimited" : `${remainingCredits} remaining`} />
          <Button
            className="w-full"
            onClick={submit}
            disabled={!selectedNutri || !selectedSlot || submitting || noCredits}
          >
            <Plus className="mr-2 h-4 w-4" /> {submitting ? "Booking…" : "Confirm booking"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            A Jitsi meeting link will be generated once the nutritionist confirms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}