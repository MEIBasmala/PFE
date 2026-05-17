// src/components/patient/PatientProfile.tsx
import { useEffect, useState, useMemo } from "react";
import { KeyRound, ShieldCheck, User as UserIcon, X } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getPatientProfile, updatePatientProfile, changePassword, getMyProgress } from "@/services/api";
import { toast } from "sonner";
import type { PatientProfile as TProfile, Progress } from "@/types/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Label,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Skeleton,
  Progress as ProgressBar,
  Textarea,
} from "@/components/ui";
import { ProfileCard } from "@/components/ui/ProfileCard";

// ─── Password strength helper  ──────────────────
function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
  if (password.match(/\d/)) score++;
  if (password.match(/[^a-zA-Z\d]/)) score++;
  const labels = ["Too short", "Weak", "Okay", "Strong", "Excellent"];
  return { score, label: labels[Math.min(score, 4)] };
}

// ─── Calorie goal calculation  ──────────────────
function calculateDailyCalorieGoal(profile: Partial<TProfile>): number | null {
  const age = profile.age;
  const weight = profile.weight;
  const height = profile.height;
  const activityLevel = profile.activityLevel;
  const goals = profile.goals ?? [];

  // Cannot compute without all required fields
  if (age == null || weight == null || height == null || !activityLevel) {
    return null;
  }

  let bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = bmr * (activityFactors[activityLevel] || 1.55);
  let adjusted = tdee;
  if (goals.includes("weight-loss")) adjusted -= 500;
  if (goals.includes("weight-gain")) adjusted += 500;
  return Math.round(Math.max(1200, adjusted));
}

// ─── Predefined options for select fields ──────────────────
const GOAL_OPTIONS = [
  { value: "weight-loss", label: "Weight loss" },
  { value: "weight-gain", label: "Weight gain" },
  { value: "muscle-gain", label: "Muscle gain" },
  { value: "wellness", label: "General wellness" },
  { value: "better-sleep", label: "Better sleep" },
  { value: "stress-management", label: "Stress management" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary (office job, little exercise)" },
  { value: "light", label: "Lightly active (light exercise 1-3 days/week)" },
  { value: "moderate", label: "Moderately active (moderate exercise 3-5 days/week)" },
  { value: "active", label: "Active (daily exercise or intense activity)" },
  { value: "very_active", label: "Very active (hard exercise or physical job)" },
];

const DIETARY_PREFS = [
  { value: "none", label: "No preference" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "low-carb", label: "Low carb" },
  { value: "low-fat", label: "Low fat" },
];

const CAFFEINE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "low", label: "Low (1 cup/day)" },
  { value: "moderate", label: "Moderate (2-3 cups/day)" },
  { value: "high", label: "High (4+ cups/day)" },
];

const MEALS_PER_DAY_OPTIONS = [
  { value: "1-2", label: "1-2 meals" },
  { value: "3", label: "3 meals" },
  { value: "4", label: "4 meals" },
  { value: "5-6", label: "5-6 small meals" },
];

// ─── Main Component ─────────────────────────────────────────
export default function PatientProfile() {
  const profile = useAsync<TProfile>(() => getPatientProfile(), [], { toastOnError: false });
  const progress = useAsync<Progress[]>(() => getMyProgress(), [], { toastOnError: false });
  const [tab, setTab] = useState<"personal" | "health" | "security">("personal");
  const [draft, setDraft] = useState<Partial<TProfile>>({});
  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setDraft({ ...profile.data });
    }
  }, [profile.data]);

  // Get latest weight from progress history, fallback to profile weight
  const latestWeight = useMemo(() => {
    if (!progress.data?.length) return profile.data?.weight ?? null;
    const sorted = [...progress.data].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    return sorted[0].weight;
  }, [progress.data, profile.data?.weight]);

  const recomputedGoal = useMemo(() => {
    // Use latest weight for calorie calculation, not stale profile weight
    const calcDraft = { ...draft, weight: latestWeight ?? draft.weight };
    return calculateDailyCalorieGoal(calcDraft);
  }, [draft.age, draft.weight, draft.height, draft.activityLevel, draft.goals, latestWeight]);

  const save = async () => {
  setSaving(true);
  try {
    const payload = {
      ...draft,
      dailyCalorieGoal: recomputedGoal ?? draft.dailyCalorieGoal,
    };
    await updatePatientProfile(payload);
    toast.success("Profile updated & calorie goal recalculated");
    await profile.refetch();
  } catch (err) {
    toast.error((err as Error).message);
  } finally {
    setSaving(false);
  }
};

  const stats = [
    { label: "Weight", value: latestWeight != null ? `${latestWeight} kg` : "—" },
    { label: "Height", value: profile.data?.height ? `${profile.data.height} cm` : "—" },
    { label: "Goal", value: profile.data?.goalWeight ? `${profile.data.goalWeight} kg` : "—" },
    { label: "Logs", value: progress.data?.length ?? 0 },
  ];

  if (profile.loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (profile.error) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="py-12">
          <p className="text-destructive">Error loading profile</p>
          <Button variant="outline" className="mt-4" onClick={() => profile.refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Helper to add/remove items in arrays
  const addCondition = () => {
    if (conditionInput.trim() && !(draft.conditions ?? []).includes(conditionInput.trim())) {
      setDraft({ ...draft, conditions: [...(draft.conditions ?? []), conditionInput.trim()] });
      setConditionInput("");
    }
  };
  const removeCondition = (cond: string) => {
    setDraft({ ...draft, conditions: (draft.conditions ?? []).filter(c => c !== cond) });
  };

  const toggleGoal = (goalValue: string) => {
    const current = draft.goals ?? [];
    const updated = current.includes(goalValue)
      ? current.filter(g => g !== goalValue)
      : [...current, goalValue];
    setDraft({ ...draft, goals: updated });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <ProfileCard
        name={profile.data?.fullName || ""}
        email={profile.data?.email || ""}
        role="PATIENT"
        stats={stats}
      />

      <div className="space-y-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="gap-2">
              <UserIcon className="h-4 w-4" /> Personal
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <ShieldCheck className="h-4 w-4" /> Health & Lifestyle
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <KeyRound className="h-4 w-4" /> Security
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <form onSubmit={(e) => { e.preventDefault(); save(); }}>
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={draft.fullName ?? ""}
                        onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={draft.email ?? ""}
                        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={draft.phone ?? ""}
                        onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input
                        type="number"
                        value={draft.age ?? ""}
                        onChange={(e) => setDraft({ ...draft, age: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          {/* Health & Lifestyle Tab (expanded) */}
          <TabsContent value="health">
            <form onSubmit={(e) => { e.preventDefault(); save(); }}>
              <Card>
                <CardHeader>
                  <CardTitle>Health & Lifestyle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ── Body metrics ── */}
                  <div className="space-y-3">
                    <h3 className="text-md font-medium">Body measurements</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Height (cm)</Label>
                        <Input
                          type="number"
                          value={draft.height ?? ""}
                          onChange={(e) => setDraft({ ...draft, height: e.target.value ? Number(e.target.value) : undefined })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          value={draft.weight ?? latestWeight ?? ""}
                          onChange={(e) => setDraft({ ...draft, weight: e.target.value ? Number(e.target.value) : undefined })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Goal weight (kg)</Label>
                        <Input
                          type="number"
                          value={draft.goalWeight ?? ""}
                          onChange={(e) => setDraft({ ...draft, goalWeight: e.target.value ? Number(e.target.value) : undefined })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Activity level</Label>
                        <Select
                          value={draft.activityLevel ?? ""}
                          onValueChange={(val) => setDraft({ ...draft, activityLevel: val as TProfile["activityLevel"] })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity level" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_LEVELS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* ── Calorie goal preview ── */}
                  <div className="space-y-2">
                    <Label>Recommended daily calorie goal</Label>
                    <div className="rounded-lg border border-border bg-primary/10 px-4 py-2 text-sm font-medium">
                      {recomputedGoal != null ? `${recomputedGoal} kcal` : "—"}
                    </div>
                    {recomputedGoal == null && (
                      <p className="text-xs text-muted-foreground">
                        Fill in age, weight, height, and activity level to see your recommended calorie goal.
                      </p>
                    )}
                    {recomputedGoal != null && (
                      <p className="text-xs text-muted-foreground">
                        Automatically updated based on your age, weight, height, activity level, and goals.
                      </p>
                    )}
                  </div>

                  {/* ── Medical info ── */}
                  <div className="space-y-3">
                    <h3 className="text-md font-medium">Medical & health profile</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Medical history</Label>
                        <Textarea
                          value={draft.medicalHistory ?? ""}
                          onChange={(e) => setDraft({ ...draft, medicalHistory: e.target.value })}
                          placeholder="e.g., hypertension, diabetes, previous surgeries…"
                          rows={2}
                        />
                      </div>

                      {/* Conditions as tags */}
                      <div className="space-y-2">
                        <Label>Health conditions</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(draft.conditions ?? []).map(cond => (
                            <Badge key={cond} variant="secondary" className="gap-1">
                              {cond}
                              <X size={12} className="cursor-pointer" onClick={() => removeCondition(cond)} />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={conditionInput}
                            onChange={(e) => setConditionInput(e.target.value)}
                            placeholder="e.g., PCOS, High cholesterol"
                          />
                          <Button type="button" variant="outline" onClick={addCondition}>Add</Button>
                        </div>
                      </div>

                      {/* Goals (multi-select with checkboxes / pills) */}
                      <div className="space-y-2">
                        <Label>Wellness goals</Label>
                        <div className="flex flex-wrap gap-2">
                          {GOAL_OPTIONS.map(opt => (
                            <Badge
                              key={opt.value}
                              variant={(draft.goals ?? []).includes(opt.value) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => toggleGoal(opt.value)}
                            >
                              {opt.label}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Allergies (existing) */}
                      <div className="space-y-2">
                        <Label>Allergies</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(draft.allergies ?? []).map(a => (
                            <Badge key={a} variant="secondary" className="gap-1">
                              {a}
                              <X size={12} className="cursor-pointer" onClick={() => setDraft({ ...draft, allergies: (draft.allergies ?? []).filter(x => x !== a) })} />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={allergyInput}
                            onChange={(e) => setAllergyInput(e.target.value)}
                            placeholder="e.g., peanuts, gluten"
                          />
                          <Button type="button" variant="outline" onClick={() => {
                            if (allergyInput.trim()) {
                              setDraft({ ...draft, allergies: [...(draft.allergies ?? []), allergyInput.trim()] });
                              setAllergyInput("");
                            }
                          }}>Add</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Lifestyle ── */}
                  <div className="space-y-3">
                    <h3 className="text-md font-medium">Lifestyle & habits</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Dietary preference</Label>
                        <Select
                          value={draft.dietaryPref ?? "none"}
                          onValueChange={(val) => setDraft({ ...draft, dietaryPref: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DIETARY_PREFS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Water intake (glasses/day)</Label>
                        <Input
                          type="number"
                          value={draft.waterIntake ?? ""}
                          onChange={(e) => setDraft({ ...draft, waterIntake: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="e.g., 6"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sleep (hours/night)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={draft.sleepHours ?? ""}
                          onChange={(e) => setDraft({ ...draft, sleepHours: e.target.value ? Number(e.target.value) : undefined })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Meals per day</Label>
                        <Select
                          value={draft.mealsPerDay ?? ""}
                          onValueChange={(val) => setDraft({ ...draft, mealsPerDay: val })}
                        >
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {MEALS_PER_DAY_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Caffeine consumption</Label>
                        <Select
                          value={draft.caffeine ?? "none"}
                          onValueChange={(val) => setDraft({ ...draft, caffeine: val })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CAFFEINE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Biggest challenges</Label>
                      <Textarea
                        value={draft.challenges ?? ""}
                        onChange={(e) => setDraft({ ...draft, challenges: e.target.value })}
                        placeholder="What makes it hard to eat healthy?"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>What motivates you?</Label>
                      <Textarea
                        value={draft.motivation ?? ""}
                        onChange={(e) => setDraft({ ...draft, motivation: e.target.value })}
                        placeholder="e.g., more energy, better health, fitting into clothes..."
                        rows={2}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          {/* Security Tab  */}
          <TabsContent value="security">
            <SecurityPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Security panel 
function SecurityPanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const strength = getPasswordStrength(next);
  const strengthPercent = (strength.score / 4) * 100;

  const submit = async () => {
    if (!current || !next) {
      toast.error("Please fill in all fields");
      return;
    }
    if (next !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (strength.score < 2) {
      toast.error("Password is too weak. Use at least 8 characters with mixed case, numbers, and symbols.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(current, next);
      toast.success("Password updated successfully");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Password</Label>
          <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          {next && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Strength: {strength.label}</span>
                <span>{strength.score}/4</span>
              </div>
              <ProgressBar value={strengthPercent} className="h-1.5" />
              {strength.score < 2 && (
                <p className="text-xs text-destructive">
                  Use at least 8 characters with uppercase, lowercase, number, and symbol.
                </p>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Confirm New Password</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {confirm && next !== confirm && <p className="text-xs text-destructive">Passwords do not match</p>}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={submit} disabled={saving}>{saving ? "Updating…" : "Change Password"}</Button>
      </CardFooter>
    </Card>
  );
}