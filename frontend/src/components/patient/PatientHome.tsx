// src/components/patient/PatientHome.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

import {
  CalendarPlus,
  Camera,
  ChartPie,
  Headset,
  Plus,
  Ruler,
  Trophy,
  TrendingDown,
  TrendingUp,
  Utensils,
  MessageSquare,
  Zap,
  Droplets,
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/contexts/AuthContext";
import { useDiary } from "@/contexts/DiaryContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  getMyProgressPhotos,
  addProgressPhoto,
  getMyAppointments,
  getMyProgress,
  addProgress,
  getMyFoodLogs,
  getPatientProfile,
  addMeasurement,
} from "@/services/api";

import ProgressPhotos from './ProgressPhotos';

import { addDays, formatShortDate, toIsoDate } from "@/lib/date";
import { apiCache, cachedFetch } from "@/lib/apiCache";
import type {
  Appointment,
  Measurement,
  UIFoodLog,
  Progress,
  PatientProfile,
} from "@/types/api";
import { toast } from "sonner";

import {
  Progress as ProgressBar,
  Label,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import AnimateOnScroll, { StaggerContainer, AnimatedCounter } from "@/components/ui/AnimateOnScroll";
const DEFAULT_GOAL = 1800;
const TTL = {
  profile: 120_000,
  progress: 60_000,
  appointments: 30_000,
  week: 3_600_000,
};

const MEAL_COLORS: Record<string, string> = {
  breakfast: "hsl(var(--saffron))",
  lunch: "hsl(var(--orange))",
  dinner: "hsl(var(--green-dark))",
  snack: "hsl(var(--green))",
};

export default function PatientHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    totals,
    logs,
    loading: diaryLoading,
    weekData,
    weekLoading,
  } = useDiary();
  const {
    aiScansPerDay,
    aiScansUsedToday,
    packageInfo,
    consultationsPerMonth,
  } = useSubscription();

  const profile = useAsync<PatientProfile>(() => getPatientProfile(), [], {
    toastOnError: false,
    cacheKey: "patient:profile",
    cacheTtl: TTL.profile,
  });
  const progress = useAsync<Progress[]>(() => getMyProgress(), [], {
    toastOnError: false,
    cacheKey: "patient:progress",
    cacheTtl: TTL.progress,
  });
  const appts = useAsync<Appointment[]>(() => getMyAppointments(), [], {
    toastOnError: false,
    cacheKey: "patient:appointments",
    cacheTtl: TTL.appointments,
  });

  const goal = profile.data?.dailyCalorieGoal ?? DEFAULT_GOAL;
  const caloriesPct = Math.min(100, Math.round((totals.calories / goal) * 100));
  const scansPct = Math.min(
    100,
    Math.round((aiScansUsedToday / Math.max(1, aiScansPerDay)) * 100),
  );
  const sortedProgress = useMemo(() => {
    if (!progress.data?.length) return [];
    return [...progress.data].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
  }, [progress.data]);

  const currentWeight = sortedProgress[0]?.weight ?? profile.data?.weight;
  const startWeight = sortedProgress[sortedProgress.length - 1]?.weight;
  const goalWeight = profile.data?.goalWeight;
  const weightDelta =
    typeof currentWeight === "number" && typeof startWeight === "number"
      ? +(currentWeight - startWeight).toFixed(1)
      : null;

  const upcoming = useMemo<Appointment | null>(() => {
    if (!appts.data?.length) return null;
    const now = Date.now();
    return (
      appts.data
        .filter(
          (a) =>
            a.status !== "CANCELLED" && new Date(a.scheduledAt).getTime() > now,
        )
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        )[0] ?? null
    );
  }, [appts.data]);

  const daysToNext = upcoming
    ? Math.max(
      0,
      Math.ceil(
        (new Date(upcoming.scheduledAt).getTime() - Date.now()) / 86_400_000,
      ),
    )
    : null;

  const measurements: Measurement = profile.data?.measurements?.[0] ?? {
    id: 0,
    patientId: 0,
    recordedAt: new Date().toISOString(),
  };

  const [measureOpen, setMeasureOpen] = useState(false);

  const avgWeekly = useMemo(() => {
    const nonZero = weekData.map((d) => d.calories).filter(Boolean);
    return nonZero.length
      ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length)
      : 0;
  }, [weekData]);

  const todayIso = toIsoDate(new Date());
  const todaysMeals = (logs ?? []).slice(0, 4);
  const todayBar =
    weekData.find((d) => d.date === todayIso)?.calories ?? totals.calories;
  const firstName = (user?.fullName || "").split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5">
      {/* ── HERO: Welcome + calorie ring ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Welcome banner – spans 2 columns */}
        <AnimateOnScroll
          animation="fade-up"
          duration={0.5}
          className="md:col-span-2"
        >
          <Card className="overflow-hidden relative ambient-mesh h-full">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse at top right, hsl(var(--green-light)) 0%, transparent 70%)",
              }}
            />
            <CardContent className="relative p-5">
              <p className="text-sm text-muted-foreground">{greeting},</p>
              <h2 className="font-syne text-2xl font-extrabold mt-0.5">
                {firstName} 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
                {upcoming
                  ? `Next session in ${daysToNext} day${daysToNext === 1 ? "" : "s"} · ${formatShortDate(upcoming.scheduledAt)}`
                  : "No upcoming sessions — book one to stay on track."}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" onClick={() => navigate("/patient/ai")}>
                  <Camera className="mr-1.5 h-3.5 w-3.5" /> Scan meal
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate("/patient/consultations")}
                >
                  <CalendarPlus className="mr-1.5 h-3.5 w-3.5" /> Book session
                </Button>
                                {upcoming && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate("/patient/messages", {
                        state: {
                          openConversationWith: upcoming.nutritionist?.userId,
                        },
                      })
                    }
                  >
                    <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message
                  </Button>
                )}
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs text-blue-600">
                <Droplets className="h-3 w-3" /> Drink 2.5 L of water today
              </div>
            </CardContent>
          </Card>
        </AnimateOnScroll>

        {/* Calorie ring */}
        <AnimateOnScroll animation="scale-in" delay={0.15} duration={0.6} className="h-full">
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center p-5 h-full gap-2">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="hsl(var(--gray-line))"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="hsl(var(--orange))"
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - caloriesPct / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-syne text-xl font-extrabold text-[hsl(var(--orange))]">
                    {diaryLoading ? "—" : totals.calories}
                  </span>
                  <span className="text-[10px] text-muted-foreground">kcal</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">
                  of {goal.toLocaleString()} goal
                </div>
                <div className="font-semibold text-sm mt-0.5">
                  {diaryLoading ? "—" : Math.max(0, goal - totals.calories)}{" "}
                  remaining
                </div>
              </div>
              <Badge
                variant={caloriesPct > 100 ? "destructive" : "secondary"}
                className="text-xs"
              >
                {caloriesPct}% today
              </Badge>
            </CardContent>
          </Card>
        </AnimateOnScroll>
      </div>

      {/* ── STATS ROW ────────────────────────────────────────────────────── */}
      <StaggerContainer className="grid grid-cols-2 gap-3 sm:grid-cols-4 items-stretch" staggerDelay={0.08}>
        <StatTile
          label="Weight"
          value={currentWeight ? `${currentWeight}` : "—"}
          unit="kg"
          sub={goalWeight ? `Goal ${goalWeight} kg` : "Set goal"}
          icon={<TrendingDown className="h-4 w-4" />}
          tone="green"
          extra={
            weightDelta != null ? (
              <span
                className={`text-[10px] font-semibold mt-1 block ${weightDelta < 0 ? "text-green-600" : "text-destructive"}`}
              >
                {weightDelta > 0 ? "+" : ""}
                {weightDelta} kg
              </span>
            ) : null
          }
        />
        <StatTile
          label="AI Scans"
          value={`${aiScansPerDay - aiScansUsedToday}`}
          unit={`/ ${aiScansPerDay}`}
          sub="remaining today"
          icon={<Zap className="h-4 w-4" />}
          tone="orange"
          progress={scansPct}
        />
        <StatTile
          label="Next session"
          value={appts.loading ? "—" : upcoming ? `${daysToNext}d` : "—"}
          unit=""
          sub={upcoming ? formatShortDate(upcoming.scheduledAt) : "None booked"}
          icon={<CalendarPlus className="h-4 w-4" />}
          tone="saffron"
          onClick={() => navigate("/patient/consultations")}
        />
        <StatTile
          label="Plan"
          value={packageInfo?.name ?? "Free"}
          unit=""
          sub={`${consultationsPerMonth >= 999 ? "∞" : consultationsPerMonth} consults/mo`}
          icon={<Trophy className="h-4 w-4" />}
          tone="green"
          onClick={() => navigate("/patient/subscription")}
        />
      </StaggerContainer>


      {/* ── MEALS + CHART ────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <AnimateOnScroll animation="fade-up" delay={0.1} className="h-full">

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Utensils className="h-4 w-4 text-[hsl(var(--orange))]" /> Today's
                meals
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/patient/ai")}
              >
                <Camera className="mr-1 h-3.5 w-3.5" /> Log
              </Button>
            </CardHeader>
            <CardContent>
              {diaryLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : todaysMeals.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                  <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--orange-20))] flex items-center justify-center text-2xl">
                    🍽️
                  </div>
                  <p className="text-sm">No meals logged yet today.</p>
                  <Button size="sm" onClick={() => navigate("/patient/ai")}>
                    <Camera className="mr-1.5 h-3.5 w-3.5" /> Scan your first meal
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {todaysMeals.map((log) => {
                    const color =
                      MEAL_COLORS[log.category] ?? "hsl(var(--orange))";
                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-3 rounded-xl border border-[hsl(var(--gray-line))] p-2.5 hover:bg-[hsl(var(--cream-bg))] transition-colors"
                      >
                        {log.imageUrl ? (
                          <img
                            src={log.imageUrl}
                            alt={log.name}
                            className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: `${color}20` }}
                          >
                            🍽️
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {log.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full"
                              style={{ background: color }}
                            />
                            <span className="text-[11px] capitalize text-muted-foreground">
                              {log.category} {log.source === "recipe" && "· 📖"}
                            </span>
                          </div>
                        </div>
                        <div
                          className="text-sm font-bold whitespace-nowrap"
                          style={{ color }}
                        >
                          {log.calories} kcal
                        </div>
                      </div>
                    );
                  })}
                  {logs.length > 4 && (
                    <button
                      onClick={() => navigate("/patient/ai")}
                      className="w-full rounded-xl border border-dashed border-[hsl(var(--gray-line))] py-2 text-xs text-muted-foreground hover:text-foreground hover:border-[hsl(var(--orange))] transition-colors"
                    >
                      +{logs.length - 4} more → View all
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-left" delay={0.2} className="h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <ChartPie className="h-4 w-4 text-[hsl(var(--orange))]" /> This
                  week
                </span>
                <Badge variant="secondary" className="font-normal text-xs">
                  avg {avgWeekly} kcal
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              {weekLoading ? (
                <Skeleton className="h-44 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={176}>
                  <BarChart
                    data={weekData}
                    margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) =>
                        new Date(v).toLocaleDateString("en", { weekday: "short" })
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v} kcal`, ""]}
                      labelFormatter={(l) =>
                        new Date(l).toLocaleDateString("en", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })
                      }
                      contentStyle={{ borderRadius: 10, fontSize: 12 }}
                    />
                    <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                      {weekData.map((entry) => (
                        <Cell
                          key={entry.date}
                          fill={
                            entry.date === todayIso
                              ? "hsl(var(--saffron))"
                              : "hsl(var(--saffron-light))"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Today vs goal</span>
                  <span>
                    {todayBar} / {goal} kcal
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(100, (todayBar / goal) * 100)}
                  className="h-1.5"
                />
              </div>
            </CardContent>
          </Card>
        </AnimateOnScroll>
      </div>

      {/* ── MEASUREMENTS + PROGRESS ──────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AnimateOnScroll animation="fade-up" delay={0.1} className="h-full">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Ruler className="h-4 w-4" /> Measurements
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMeasureOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Update
              </Button>
            </CardHeader>
            <CardContent>
              {profile.loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["chest", "Chest", "cm"],
                      ["waist", "Waist", "cm"],
                      ["hips", "Hips", "cm"],
                      ["arm", "Arm", "cm"],
                      ["thigh", "Thigh", "cm"],
                      ["bodyFat", "Body fat", "%"],
                    ] as const
                  ).map(([k, l, u]) => (
                    <div
                      key={k}
                      className="rounded-lg bg-[hsl(var(--gray-bg))] p-2 text-center"
                    >
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {l}
                      </div>
                      <div className="font-syne font-bold text-sm mt-0.5">
                        {(measurements as any)[k] != null
                          ? `${(measurements as any)[k]}${u}`
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-up" delay={0.2} className="h-full">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-[hsl(var(--saffron))]" />{" "}
                Progress
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMeasureOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Log
              </Button>
            </CardHeader>
            <CardContent>
              {progress.loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (progress.data ?? []).length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <TrendingUp className="mx-auto h-6 w-6 mb-2 opacity-30" />
                  Log your weight to see progress.
                </div>
              ) : (
                <div className="space-y-3">
                  {weightDelta !== null && (
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${weightDelta < 0
                        ? "bg-green-50 text-green-700"
                        : weightDelta > 0
                          ? "bg-red-50 text-red-600"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {weightDelta < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {weightDelta > 0 ? "+" : ""}
                      {weightDelta} kg overall
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {(progress.data ?? []).slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-muted-foreground text-xs">
                          {new Date(p.recordedAt).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[hsl(var(--green))] transition-all"
                              style={{
                                width: goalWeight
                                  ? `${Math.min(100, Math.max(5, ((p.weight - goalWeight) / (Math.max(startWeight ?? p.weight, p.weight) - goalWeight || 1)) * 100))}%`
                                  : "50%",
                              }}
                            />
                          </div>
                          <span className="font-semibold tabular-nums">
                            {p.weight} kg
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimateOnScroll>
      </div>

      {/* ── UPGRADE BANNER (free plan only) ─────────────────────────────── */}
      {!packageInfo && (
        <AnimateOnScroll animation="scale-in" delay={0.1}>
          <Card className="border-2 border-[hsl(var(--orange))] overflow-hidden relative">
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--orange)) 0%, hsl(var(--saffron)) 100%)",
              }}
            />
            <CardContent className="relative flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2 font-syne font-bold text-base">
                  <Trophy className="h-4 w-4 text-[hsl(var(--orange))]" /> Unlock
                  your full potential
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Personalized nutrition plans, consultations & unlimited AI scans.
                </p>
              </div>
              <Button
                onClick={() => navigate("/patient/subscription")}
                className="shrink-0"
              >
                Upgrade now →
              </Button>
            </CardContent>
          </Card>
        </AnimateOnScroll>
      )}

      <MeasurementsModal
        open={measureOpen}
        onOpenChange={setMeasureOpen}
        initial={measurements}
        currentWeight={currentWeight}
        onSaved={async () => {
          apiCache.invalidate("patient:profile");
          apiCache.invalidate("patient:progress");
          await Promise.all([profile.refetch(), progress.refetch()]);
        }}
      />

      {/* ── PROGRESS PHOTOS ── */}
      <div className="mt-6">
        <ProgressPhotos />
      </div>
    </div>
  );
}

// ── StatTile ──────────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string;
  unit: string;
  sub: string;
  icon: React.ReactNode;
  tone: "green" | "orange" | "saffron";
  progress?: number;
  extra?: React.ReactNode;
  onClick?: () => void;
}
function StatTile({
  label,
  value,
  unit,
  sub,
  icon,
  tone,
  progress,
  extra,
  onClick,
}: StatTileProps) {
  const bg: Record<string, string> = {
    green: "bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))]",
    orange: "bg-[hsl(var(--orange-20))] text-[hsl(var(--orange))]",
    saffron: "bg-[hsl(var(--saffron-light))] text-[hsl(var(--saffron))]",
  };
  const numericValue = parseInt(value);
  const isNumeric = !isNaN(numericValue) && value !== "—";
  return (
    <Card
      className={cn(
        "h-full min-h-[130px]",
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      )}
      onClick={onClick}
    >
      <CardContent className="p-3.5 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg[tone]}`}
          >
            {icon}
          </div>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-bold">
            {label}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="font-syne text-2xl font-extrabold leading-none">
            {isNumeric ? <AnimatedCounter end={numericValue} duration={800} /> : value}
          </span>
          {unit && (
            <span className="text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
        {typeof progress === "number" && (
          <ProgressBar value={progress} className="mt-2 h-1" />
        )}
        <div className="flex-1" />
        {extra}
      </CardContent>
    </Card>
  );
}

// ── MeasurementsModal ─────────────────────────────────────────────────────────

function MeasurementsModal({
  open,
  onOpenChange,
  initial,
  currentWeight,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Measurement;
  currentWeight?: number;
  onSaved: () => Promise<void> | void;
}) {
  const [m, setM] = useState<Measurement>(initial);
  const [weight, setWeight] = useState(currentWeight?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setM(initial);
    setWeight(currentWeight?.toString() ?? "");
  }, [initial, currentWeight]);

  const update = (key: keyof Measurement, val: string) => {
    const num = val === "" ? undefined : Number(val);
    setM((prev) => ({
      ...prev,
      [key]: Number.isFinite(num as number) ? num : undefined,
    }));
  };

  const save = async () => {
    if (!weight) {
      toast.error("Please enter your current weight.");
      return;
    }
    setSaving(true);
    try {
      await addProgress({ weight: Number(weight) });
      await addMeasurement({
        chest: m.chest,
        waist: m.waist,
        hips: m.hips,
        arm: m.arm,
        thigh: m.thigh,
        bodyFat: m.bodyFat,
      });
      toast.success("Saved successfully");
      await onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
          <DialogTitle>Update Measurements</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Current weight (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(
              ["chest", "waist", "hips", "arm", "thigh", "bodyFat"] as const
            ).map((k) => (
              <div key={k} className="space-y-1.5">
                <Label className="capitalize">
                  {k === "bodyFat" ? "Body fat (%)" : `${k} (cm)`}
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={(m as any)[k] ?? ""}
                  onChange={(e) => update(k, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}