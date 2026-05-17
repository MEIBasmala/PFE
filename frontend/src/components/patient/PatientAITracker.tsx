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
  Loader2,
  Utensils,      // ← All meals
  Sunrise,       // ← Breakfast
  Sun,           // ← Lunch
  Apple,         // ← Snack
  Moon,
  Flame,
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

const CATEGORIES: { value: MealCategory | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Utensils },
  { value: "breakfast", label: "Breakfast", icon: Sunrise },
  { value: "lunch", label: "Lunch", icon: Sun },
  { value: "snack", label: "Snack", icon: Apple },
  { value: "dinner", label: "Dinner", icon: Moon },
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
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const resetModal = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const analyze = async () => {
    if (!selectedFile) return;
    if (remaining <= 0) {
      toast.error("Daily AI scan limit reached. Upgrade your plan to unlock more.");
      return;
    }
    setAnalyzing(true);
    try {
      const created = await uploadImage(selectedFile);
      if (created) {
        resetModal();
        setScanModalOpen(false);
        await refreshSubscription();
        toast.success("Meal analysed and added to your diary!");
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to analyse meal. Please try again.");
    } finally {
      setAnalyzing(false);
    }
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
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/30 p-3 text-center text-sm md:grid-cols-5">
           <StatItem icon={Flame} value={totals.calories} label="kcal" />
<StatItem icon={Sparkles} value={Math.max(0, goal - totals.calories)} label="Remaining" />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Badge
                key={c.value}
                variant={filter === c.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilter(c.value)}
              >
                <c.icon className="h-3.5 w-3.5 mr-1" />
                {c.label}
              </Badge>
            ))}
          </div>

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
            <div
              onClick={() => setScanModalOpen(true)}
              className="group relative cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <CloudUpload className="mx-auto h-10 w-10 text-muted-foreground transition-transform group-hover:scale-105" />
                <div className="mt-2 font-semibold">Click here to upload you meal image</div>
              </div>
            </div>
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
      <ManualEntryModal open={manualOpen} onOpenChange={setManualOpen} onSubmit={addLog} date={date} />

      {/* AI Scan Modal – mimics ProgressPhotos modal style */}
      <Dialog open={scanModalOpen} onOpenChange={(open) => {
        if (!open) resetModal();
        setScanModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" />
              AI Calorie Scanner
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
                <CloudUpload className="mx-auto h-10 w-10 text-muted-foreground transition-transform group-hover:scale-105" />
                <p className="mt-2 text-sm font-medium">Click or drag & drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-lg border border-border">
                <div className="relative overflow-hidden rounded-lg">
                  <div className={`transition-transform duration-700 ${analyzing ? 'scale-95' : 'scale-100'}`}>
                    <img src={previewUrl} alt="Meal preview" className="max-h-64 w-full object-cover" />
                  </div>

                  {analyzing && (
                    <>
                      {/* Warm radial gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent rounded-lg" />

                      {/* Slow breathing glow (orange) */}
                      <div className="absolute inset-0 rounded-lg border-2 border-[hsl(var(--orange))]/60 animate-slow-pulse" />

                      {/* Slow expanding rings (6s cycle) */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-40 h-40">
                          <div className="absolute inset-0 rounded-full border-2 border-[hsl(var(--orange))]/40 animate-slow-ping" />
                          <div className="absolute inset-0 rounded-full border-2 border-[hsl(var(--saffron))]/30 animate-slow-ping [animation-delay:2s]" />
                          <div className="absolute inset-0 rounded-full border border-[hsl(var(--green))]/20 animate-slow-ping [animation-delay:4s]" />
                        </div>
                      </div>

                      {/* Slow floating particles (7s cycle) */}
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1.5 h-1.5 rounded-full animate-slow-float-particle pointer-events-none"
                          style={{
                            left: `${15 + Math.random() * 70}%`,
                            top: `${20 + Math.random() * 60}%`,
                            backgroundColor: i % 3 === 0 ? "hsl(var(--orange))" : i % 3 === 1 ? "hsl(var(--saffron))" : "hsl(var(--green))",
                            animationDelay: `${Math.random() * 3}s`,
                          }}
                        />
                      ))}

                      {/* Warm corner brackets – slower pulse */}
                      <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[hsl(var(--orange))] animate-pulse [animation-duration:3s]" />
                      <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[hsl(var(--orange))] animate-pulse [animation-duration:3s]" />
                      <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[hsl(var(--orange))] animate-pulse [animation-duration:3s]" />
                      <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[hsl(var(--orange))] animate-pulse [animation-duration:3s]" />

                      {/* AI badge – slow pulse */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 text-[11px] font-mono text-[hsl(var(--orange))] flex items-center gap-2 shadow-lg">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--orange))] opacity-75 [animation-duration:3s]"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--orange))]"></span>
                        </span>
                        AI analysing...
                      </div>
                    </>
                  )}
                </div>

                {!analyzing && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setScanModalOpen(false)}
              disabled={analyzing}
            >
              Cancel
            </Button>
            <Button
              onClick={analyze}
              disabled={!selectedFile || analyzing || remaining <= 0}
              className="gap-1.5"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyze meal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper components 
function StatItem({ icon: Icon, value, label }: { icon: React.ElementType; value: number | string; label: string }) {
  return (
    <div>
      <div className="font-bold flex items-center gap-1">
        <Icon className="h-4 w-4 text-primary" /> <span>{value}</span>
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
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Utensils className="h-5 w-5 text-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{log.name}</div>
        <div className="text-xs capitalize text-muted-foreground">
          {log.category} · {log.source === "ai" ? "AI" : log.source === "recipe" ? "Recipe" : log.source}
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
  onSubmit: (payload: Omit<UIFoodLog, "id" | "loggedAt"> & { loggedAt?: string }) => Promise<void>;
  date: string;
}

function ManualEntryModal({ open, onOpenChange, onSubmit, date }: ManualEntryModalProps) {
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
        loggedAt: `${date}T12:00:00.000Z`,
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