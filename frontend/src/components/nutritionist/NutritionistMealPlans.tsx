// src/components/nutritionist/NutritionistMealPlans.tsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { nutritionistMealPlansApi, nutritionistPatientsApi, nutritionistRecipesApi } from "@/services/api";
import type { NutritionPlanDraft, PatientProfile, Recipe } from "@/types/api";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  CalendarDays,
  ChefHat,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Users,
  ArrowRight,
  X,
  Utensils,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

interface AssignedRecipe {
  slotId: string; // `${dayIndex}-${mealSlot}`
  dayIndex: number;
  slot: MealSlot;
  recipe: Recipe;
}

const MEAL_SLOTS: { value: MealSlot; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Breakfast", emoji: "🌅" },
  { value: "lunch",     label: "Lunch",     emoji: "☀️" },
  { value: "snack",     label: "Snack",     emoji: "🍎" },
  { value: "dinner",    label: "Dinner",    emoji: "🌙" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const getDaysBetween = (start: string, end: string): string[] => {
  if (!start || !end || end < start) return [];
  const days: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last && days.length < 14) { // cap at 14 days for sanity
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });

// ── Main component ────────────────────────────────────────────────────────────

export default function NutritionistMealPlans() {
  const navigate = useNavigate();

  // Data
  const [patients, setPatients]   = useState<PatientProfile[]>([]);
  const [recipes, setRecipes]     = useState<Recipe[]>([]);
  const [plans, setPlans]         = useState<NutritionPlanDraft[]>([]);
  const [loading, setLoading]     = useState(true);

  // Form state
  const [patientId, setPatientId] = useState<number>(0);
  const [title, setTitle]         = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate]     = useState("");
  const [notes, setNotes]         = useState("");
  const [assigned, setAssigned]   = useState<AssignedRecipe[]>([]);
  const [saving, setSaving]       = useState(false);

  // Recipe picker dialog
  const [pickerOpen, setPickerOpen]       = useState(false);
  const [pickerDay, setPickerDay]         = useState<number>(0);
  const [pickerSlot, setPickerSlot]       = useState<MealSlot>("breakfast");
  const [recipeSearch, setRecipeSearch]   = useState("");

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = () => {
    setLoading(true);
    Promise.all([
      nutritionistPatientsApi.my(),
      nutritionistRecipesApi.list(),
      nutritionistMealPlansApi.list(),
    ])
      .then(([p, r, m]) => {
        setPatients(p.patients ?? []);
        setRecipes(r.recipes ?? []);
        setPlans(m.mealPlans ?? []);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const days = useMemo(() => getDaysBetween(startDate, endDate), [startDate, endDate]);

  const filteredRecipes = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.category ?? "").toLowerCase().includes(q)
    );
  }, [recipes, recipeSearch]);

  // ── Recipe assignment ─────────────────────────────────────────────────────

  const openPicker = (dayIndex: number, slot: MealSlot) => {
    setPickerDay(dayIndex);
    setPickerSlot(slot);
    setRecipeSearch("");
    setPickerOpen(true);
  };

  const assignRecipe = (recipe: Recipe) => {
    const slotId = `${pickerDay}-${pickerSlot}`;
    setAssigned((prev) => [
      ...prev.filter((a) => a.slotId !== slotId), // replace if already assigned
      { slotId, dayIndex: pickerDay, slot: pickerSlot, recipe },
    ]);
    setPickerOpen(false);
  };

  const removeAssignment = (slotId: string) =>
    setAssigned((prev) => prev.filter((a) => a.slotId !== slotId));

  const getAssigned = (dayIndex: number, slot: MealSlot) =>
    assigned.find((a) => a.slotId === `${dayIndex}-${slot}`);

  // ── Submit ────────────────────────────────────────────────────────────────

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { toast.error("Please select a patient"); return; }
    if (!startDate || !endDate) { toast.error("Start and end dates are required"); return; }
    if (endDate < startDate) { toast.error("End date must be after start date"); return; }
    if (assigned.length === 0) { toast.error("Assign at least one recipe to a meal slot"); return; }

    setSaving(true);
    try {
      // Build meals array from assigned recipes — maps to your existing backend shape
      const meals = assigned.map((a) => ({
        type: a.slot,
        name: a.recipe.name,
        calories: a.recipe.kcal ?? 0,
        recipeId: a.recipe.id,
        dayIndex: a.dayIndex,
      }));

      await nutritionistMealPlansApi.create({
        patientId,
        title: title.trim() || `Meal Plan — ${startDate}`,
        startDate,
        endDate,
        notes: notes.trim() || undefined,
        meals,
      });

      toast.success("Meal plan created and assigned to patient");
      // Reset form
      setPatientId(0); setTitle(""); setEndDate(""); setNotes(""); setAssigned([]);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete existing plan ─────────────────────────────────────────────────

  const remove = async (id: number) => {
    try {
      await nutritionistMealPlansApi.remove(id);
      toast.success("Plan deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  // ── Empty recipe library state ────────────────────────────────────────────

  if (!loading && recipes.length === 0) {
    return (
      <Card className="text-center py-16">
        <CardContent className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--green-light))] flex items-center justify-center">
            <ChefHat size={32} className="text-[hsl(var(--green-dark))]" />
          </div>
          <div>
            <h3 className="font-syne font-bold text-lg mb-1">No recipes in your library yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Add recipes first, then you can assign them to patient meal plans.
            </p>
          </div>
          <Button onClick={() => navigate("/nutritionist/recipes")} className="mt-2">
            <Plus size={14} className="mr-2" /> Go to Recipe Library
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header hint */}
      <div className="flex items-center gap-3 p-4 bg-[hsl(var(--green-light))] rounded-xl text-sm text-[hsl(var(--green-dark))]">
        <BookOpen size={16} className="shrink-0" />
        <span>
          Build from your <strong>{recipes.length} saved recipe{recipes.length !== 1 ? "s" : ""}</strong>.
          Select a patient, set dates, then click any meal slot to assign a recipe.
          {" "}
          <button
            className="underline font-semibold"
            onClick={() => navigate("/nutritionist/recipes")}
          >
            Manage recipes →
          </button>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* ── Create form ──────────────────────────────────────────────────── */}
        <form onSubmit={submit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-syne">
                <Users size={18} /> Plan Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Patient */}
              <div className="space-y-1.5">
                <Label>Patient *</Label>
                <Select
                  value={patientId ? String(patientId) : ""}
                  onValueChange={(v) => setPatientId(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient…" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.user?.fullName ?? `Patient #${p.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label>Plan title</Label>
                <Input
                  value={title}
                  placeholder="e.g. Weight loss week 1"
                  maxLength={120}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start date *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => { setStartDate(e.target.value); setAssigned([]); }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End date *</Label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => { setEndDate(e.target.value); setAssigned([]); }}
                  />
                </div>
              </div>
              {days.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {days.length} day{days.length !== 1 ? "s" : ""} — up to 14 days per plan
                </p>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes for patient</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                  maxLength={500}
                  value={notes}
                  placeholder="Dietary notes, instructions…"
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Meal grid ──────────────────────────────────────────────────── */}
          {days.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-syne">
                  <CalendarDays size={18} /> Assign Recipes to Meal Slots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[420px] pr-2">
                  <div className="space-y-4">
                    {days.map((day, dayIndex) => (
                      <div key={day}>
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          {formatDay(day)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {MEAL_SLOTS.map(({ value: slot, label, emoji }) => {
                            const a = getAssigned(dayIndex, slot);
                            return (
                              <div
                                key={slot}
                                className={`relative rounded-xl border-2 p-2 text-xs transition-all cursor-pointer group ${
                                  a
                                    ? "border-[hsl(var(--green-dark))] bg-[hsl(var(--green-light))]"
                                    : "border-dashed border-[hsl(var(--gray-line))] hover:border-[hsl(var(--orange))] hover:bg-[hsl(var(--orange-20))]"
                                }`}
                                onClick={() => openPicker(dayIndex, slot)}
                              >
                                <div className="font-semibold mb-1">
                                  {emoji} {label}
                                </div>
                                {a ? (
                                  <>
                                    <div className="font-bold text-[hsl(var(--green-dark))] truncate">
                                      {a.recipe.name}
                                    </div>
                                    <div className="text-[hsl(var(--text-m))]">
                                      {a.recipe.kcal} kcal
                                    </div>
                                    <button
                                      type="button"
                                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => { e.stopPropagation(); removeAssignment(a.slotId); }}
                                    >
                                      <X size={12} className="text-[hsl(var(--error))]" />
                                    </button>
                                  </>
                                ) : (
                                  <div className="text-muted-foreground flex items-center gap-1">
                                    <Plus size={10} /> Add recipe
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {dayIndex < days.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {assigned.length} recipe{assigned.length !== 1 ? "s" : ""} assigned
                </span>
                <Button type="submit" disabled={saving || assigned.length === 0}>
                  {saving ? "Saving…" : "Save & Send to Patient"}
                  {!saving && <ArrowRight size={14} className="ml-2" />}
                </Button>
              </CardFooter>
            </Card>
          )}

          {days.length === 0 && endDate && (
            <p className="text-sm text-center text-[hsl(var(--error))]">
              End date must be on or after start date.
            </p>
          )}
        </form>

        {/* ── Existing plans ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-syne flex items-center gap-2">
                <Utensils size={16} /> Active Plans
                <Badge variant="secondary">{plans.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <p className="text-center text-muted-foreground text-sm py-4">Loading…</p>
              )}
              {!loading && plans.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No plans yet.</p>
                </div>
              )}
              <ScrollArea className="h-[520px] pr-2">
                <div className="space-y-3">
                  {plans.map((p) => {
                    const patient = patients.find((x) => x.id === p.patientId);
                    const patientName =
                      patient?.user?.fullName ?? patient?.fullName ?? `Patient #${p.patientId}`;
                    const mealCount = p.meals?.length ?? 0;
                    return (
                      <div
                        key={p.id}
                        className="rounded-xl border border-[hsl(var(--gray-line))] p-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="font-syne font-bold text-sm truncate">
                              {p.title || "Untitled Plan"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              👤 {patientName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              📅 {p.startDate}{p.endDate ? ` → ${p.endDate}` : ""}
                            </div>
                          </div>
                          {p.id != null && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => remove(p.id!)}
                              className="shrink-0"
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {mealCount} meal{mealCount !== 1 ? "s" : ""}
                          </Badge>
                          {p.notes && (
                            <Badge variant="outline" className="text-xs truncate max-w-[160px]">
                              {p.notes}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Recipe picker dialog ────────────────────────────────────────────── */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-syne flex items-center gap-2">
              <ChefHat size={18} />
              Pick a recipe for{" "}
              {MEAL_SLOTS.find((s) => s.value === pickerSlot)?.emoji}{" "}
              {MEAL_SLOTS.find((s) => s.value === pickerSlot)?.label}
            </DialogTitle>
          </DialogHeader>

          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search your recipes…"
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              autoFocus
            />
          </div>

          <ScrollArea className="h-[340px] pr-2">
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No recipes match your search.
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredRecipes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => assignRecipe(r)}
                    className="w-full text-left rounded-xl border border-[hsl(var(--gray-line))] p-3 hover:border-[hsl(var(--green-dark))] hover:bg-[hsl(var(--green-light))] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{r.emoji ?? "🍽️"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.kcal} kcal · {r.prepTime}
                          {r.category && ` · ${r.category}`}
                        </div>
                      </div>
                      <Plus
                        size={16}
                        className="text-muted-foreground group-hover:text-[hsl(var(--green-dark))] shrink-0"
                      />
                    </div>
                    {r.protein != null && (
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">P {r.protein}g</Badge>
                        <Badge variant="secondary" className="text-[10px]">C {r.carbs}g</Badge>
                        <Badge variant="secondary" className="text-[10px]">F {r.fat}g</Badge>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}