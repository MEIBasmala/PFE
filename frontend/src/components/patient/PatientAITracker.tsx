// src/components/patient/PatientAITracker.tsx
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Pencil,
  ScanLine,
  Sparkles,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import { useDiary } from "@/contexts/DiaryContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAsync } from "@/hooks/useAsync";
import { getPatientProfile } from "@/services/api";
import { addDays, formatLongDate, toIsoDate } from "@/lib/date";
import type { UIFoodLog, MealCategory, PatientProfile } from "@/types/api";
import { toast } from "sonner";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Skeleton,
  Progress,
  Alert,
  AlertDescription,
} from "@/components/ui";

const DEFAULT_GOAL = 1800;

const CATEGORIES: { value: MealCategory | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "🍽️" },
  { value: "breakfast", label: "Breakfast", emoji: "🌅" },
  { value: "lunch", label: "Lunch", emoji: "☀️" },
  { value: "snack", label: "Snack", emoji: "🍎" },
  { value: "dinner", label: "Dinner", emoji: "🌙" },
];

// Calculate calorie goal using Mifflin‑St Jeor
function calculateCalorieGoal(profile: PatientProfile | null): { goal: number; missing: string[] } {
  const missing: string[] = [];
  if (!profile) return { goal: DEFAULT_GOAL, missing: ["profile"] };

  if (!profile.age) missing.push("age");
  if (!profile.weight) missing.push("weight");
  if (!profile.height) missing.push("height");
  if (!profile.activityLevel) missing.push("activity level");
  if (!profile.goals || profile.goals.length === 0) missing.push("goals");

  if (missing.length > 0) {
    return { goal: DEFAULT_GOAL, missing };
  }

  // Mifflin‑St Jeor for women (assume female – adjust if gender is added)
  const weightKg = profile.weight!;
  const heightCm = profile.height!;
  const age = profile.age!;
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    "very-active": 1.9,
  };
  const tdee = bmr * (multipliers[profile.activityLevel!] || 1.2);

  let goal = tdee;
  const weightGoal = profile.goalWeight;
  if (profile.goals?.includes("weight-loss") && weightGoal && weightGoal < profile.weight!) {
    goal = tdee - 500;
  } else if (profile.goals?.includes("weight-gain") && weightGoal && weightGoal > profile.weight!) {
    goal = tdee + 500;
  }

  return { goal: Math.round(Math.max(1200, goal)), missing: [] };
}

export default function PatientAITracker() {
  const navigate = useNavigate();
  const {
    date,
    setDate,
    logs,
    loading,
    totals,
    uploadImage,
    deleteLog,
    addLog,
  } = useDiary();
  const { aiScansPerDay, aiScansUsedToday, refreshSubscription } = useSubscription();
  const profile = useAsync<PatientProfile>(() => getPatientProfile(), [], { toastOnError: false });
  const [filter, setFilter] = useState<MealCategory | "all">("all");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, aiScansPerDay - aiScansUsedToday);
  const { goal, missing } = calculateCalorieGoal(profile.data ?? null);
  const caloriePercentage = Math.min(100, (totals.calories / goal) * 100);
  const needsProfile = missing.length > 0 && missing[0] !== "profile";

  const filtered = useMemo(
    () => (filter === "all" ? logs : logs.filter((l) => l.category === filter)),
    [logs, filter],
  );

  const onFile = (f: File | null) => {
    if (!f) return;
    setPendingFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const clearUpload = () => {
    setPendingFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyze = async () => {
    if (!pendingFile) return;
    if (remaining <= 0) {
      toast.error("Daily AI scan limit reached. Upgrade your plan to unlock more.");
      return;
    }
    setAnalyzing(true);
    const created = await uploadImage(pendingFile);
    setAnalyzing(false);
    if (created) {
      clearUpload();
      await refreshSubscription();
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    onFile(file);
  };

  const dateObj = new Date(date);
  const shiftDate = (delta: number) => {
    setDate(toIsoDate(addDays(dateObj, delta)));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Diary Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => shiftDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-syne font-bold">{formatLongDate(date)}</span>
            <Button variant="ghost" size="icon" onClick={() => shiftDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={() => setManualOpen(true)}>
            <Pencil className="mr-1 h-3 w-3" /> Manual Entry
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick stats row */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/30 p-3 text-center text-sm md:grid-cols-5">
            <StatItem icon="🔥" value={totals.calories} label="kcal" />
            <StatItem icon="✨" value={Math.max(0, goal - totals.calories)} label="Remaining" />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Badge
                key={c.value}
                variant={filter === c.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilter(c.value)}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </Badge>
            ))}
          </div>

          {/* Food log list */}
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No entries yet. Scan a meal or add one manually.
              </div>
            ) : (
              filtered.map((log) => <DiaryEntry key={log.id} log={log} onDelete={() => deleteLog(log.id)} />)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right sidebar */}
      <div className="space-y-6">
        {/* Profile reminder (if missing fields) */}
        {needsProfile && (
          <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>Complete your profile to get accurate calorie goals and nutrition advice.</span>
              <Button size="sm" variant="outline" onClick={() => navigate("/patient/profile")}>
                Complete Profile
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* AI Scanner Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-4 w-4" /> AI Calorie Scanner
            </CardTitle>
            <Badge variant="secondary">{remaining}/{aiScansPerDay} today</Badge>
          </CardHeader>
          <CardContent>
            {!previewUrl ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:bg-muted/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
                <CloudUpload className="mx-auto h-9 w-9 text-muted-foreground" />
                <div className="mt-2 font-semibold">Drop your meal photo here</div>
                <div className="text-xs text-muted-foreground">or click to browse</div>
              </div>
            ) : (
              <div className="space-y-3">
                <img src={previewUrl} alt="Meal preview" className="max-h-64 w-full rounded-lg object-cover" />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={clearUpload}>
                    <X className="mr-1 h-3 w-3" /> Remove
                  </Button>
                  <Button size="sm" onClick={analyze} disabled={analyzing || remaining <= 0}>
                    <Sparkles className="mr-1 h-3 w-3" /> {analyzing ? "Analyzing…" : "Analyze"}
                  </Button>
                </div>
              </div>
            )}
            {remaining <= 0 && (
              <p className="mt-3 text-xs text-destructive">
                You've used all AI scans for today. Upgrade your plan to scan more meals.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Today's Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="font-syne text-3xl font-extrabold text-primary">
                {totals.calories.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">of {goal} kcal goal</div>
              <Progress value={caloriePercentage} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Entry Dialog */}
      <ManualEntryModal open={manualOpen} onOpenChange={setManualOpen} onSubmit={addLog} />
    </div>
  );
}

// Helper components (StatItem, DiaryEntry, ManualEntryModal) – same as before but kept concise
function StatItem({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div>
      <div className="font-bold">
        {icon} <span>{value}</span>
      </div>
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

function DiaryEntry({ log, onDelete }: { log: UIFoodLog; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-2">
      {log.imageUrl ? (
        <img src={log.imageUrl} alt={log.name} className="h-12 w-12 rounded-lg object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-lg">🍽️</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{log.name}</div>
        <div className="text-xs capitalize text-muted-foreground">
          {log.category} · {log.source === "ai" ? "AI" : log.source}
        </div>
      </div>
      <div className="whitespace-nowrap text-sm font-bold text-primary">{log.calories} kcal</div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface ManualEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Omit<UIFoodLog, "id" | "loggedAt">) => Promise<void>;
}

function ManualEntryModal({ open, onOpenChange, onSubmit }: ManualEntryModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MealCategory>("breakfast");
  const [calories, setCalories] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !calories) {
      toast.error("Name and calories are required.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        calories: Number(calories),
        source: "manual",
      });
      onOpenChange(false);
      setName("");
      setCategory("breakfast");
      setCalories("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Meal name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Greek salad" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as MealCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Calories (kcal)</Label>
            <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            <Camera className="mr-1 h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}