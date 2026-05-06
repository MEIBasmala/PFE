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
} from "@/components/ui";
import { ProfileCard } from "@/components/ui/ProfileCard";

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
  if (password.match(/\d/)) score++;
  if (password.match(/[^a-zA-Z\d]/)) score++;
  const labels = ["Too short", "Weak", "Okay", "Strong", "Excellent"];
  return { score, label: labels[Math.min(score, 4)] };
}

// Re‑use the exact calorie calculation logic from onboarding
function calculateDailyCalorieGoal(profile: Partial<TProfile>): number {
  const age = profile.age ?? 30;
  const weight = profile.weight ?? 70;
  const height = profile.height ?? 165;
  const activityLevel = profile.activityLevel ?? "moderate";
  const goals = profile.goals ?? [];

  // BMR (Mifflin‑St Jeor for women – adjust if gender is ever added)
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

export default function PatientProfile() {
  const profile = useAsync<TProfile>(() => getPatientProfile(), [], { toastOnError: false });
  const progress = useAsync<Progress[]>(() => getMyProgress(), [], { toastOnError: false });
  const [tab, setTab] = useState<"personal" | "health" | "security">("personal");
  const [draft, setDraft] = useState<Partial<TProfile>>({});
  const [allergyInput, setAllergyInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setDraft({ ...profile.data });
    }
  }, [profile.data]);

  // Live recomputed goal based on current draft
  const recomputedGoal = useMemo(
    () => calculateDailyCalorieGoal(draft),
    [draft.age, draft.weight, draft.height, draft.activityLevel, draft.goals]
  );

  const save = async () => {
    setSaving(true);
    try {
      const { fullName, email, phone, ...patientData } = draft;
      // Send the freshly computed calorie goal
      const payload = {
        ...patientData,
        dailyCalorieGoal: recomputedGoal,
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
    { label: "Weight", value: profile.data?.weight ? `${profile.data.weight} kg` : "—" },
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
              <ShieldCheck className="h-4 w-4" /> Health
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <KeyRound className="h-4 w-4" /> Security
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
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
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          {/* Health & Goals Tab – now with dynamic calorie goal display */}
          <TabsContent value="health">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Health & Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        value={draft.weight ?? ""}
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
                          <SelectItem value="sedentary">Sedentary</SelectItem>
                          <SelectItem value="light">Lightly active</SelectItem>
                          <SelectItem value="moderate">Moderately active</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="very_active">Very active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Display the recalculated calorie goal – live preview */}
                  <div className="space-y-2">
                    <Label>Recommended daily calorie goal</Label>
                    <div className="rounded-lg border border-border bg-primary/10 px-4 py-2 text-sm font-medium">
                      {recomputedGoal} kcal
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically updated based on your age, weight, height, activity level, and goals.
                      Changes will be saved when you click "Save changes".
                    </p>
                  </div>

                  {/* Allergies – unchanged */}
                  <div className="space-y-2">
                    <Label>Allergies</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(draft.allergies ?? []).map((a) => (
                        <Badge key={a} variant="secondary" className="gap-1">
                          {a}
                          <X
                            size={12}
                            className="cursor-pointer"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                allergies: (draft.allergies ?? []).filter((x) => x !== a),
                              })
                            }
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={allergyInput}
                        onChange={(e) => setAllergyInput(e.target.value)}
                        placeholder="e.g., peanuts, dairy"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (allergyInput.trim()) {
                            setDraft({
                              ...draft,
                              allergies: [...(draft.allergies ?? []), allergyInput.trim()],
                            });
                            setAllergyInput("");
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="security">
            <SecurityPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Security panel unchanged (same as before)
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
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
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
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {confirm && next !== confirm && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={submit} disabled={saving}>
          {saving ? "Updating…" : "Change Password"}
        </Button>
      </CardFooter>
    </Card>
  );
}