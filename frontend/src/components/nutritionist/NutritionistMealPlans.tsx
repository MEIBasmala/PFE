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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  FileText,
  Upload,
  File,
} from "lucide-react";

// Types for PDF plan (as returned by backend)
interface PdfMealPlan {
  id: number;
  patientId: number;
  patientName: string;
  title: string;
  notes: string | null;
  pdfUrl: string;
  uploadedAt: string;
  assignedAt: string;
}

type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

interface AssignedRecipe {
  slotId: string;
  dayIndex: number;
  slot: MealSlot;
  recipe: Recipe;
}

const MEAL_SLOTS: { value: MealSlot; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Breakfast", emoji: "🌅" },
  { value: "lunch", label: "Lunch", emoji: "☀️" },
  { value: "snack", label: "Snack", emoji: "🍎" },
  { value: "dinner", label: "Dinner", emoji: "🌙" },
];

const getDaysBetween = (start: string, end: string): string[] => {
  if (!start || !end || end < start) return [];
  const days: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last && days.length < 14) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });

export default function NutritionistMealPlans() {
  const navigate = useNavigate();

  // Data
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeBasedPlans, setRecipeBasedPlans] = useState<NutritionPlanDraft[]>([]);
  const [pdfPlans, setPdfPlans] = useState<PdfMealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // UI mode
  const [planMode, setPlanMode] = useState<"recipe" | "pdf">("recipe");

  // Recipe form
  const [patientId, setPatientId] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [assigned, setAssigned] = useState<AssignedRecipe[]>([]);
  const [saving, setSaving] = useState(false);

  // PDF form
  const [pdfPatientId, setPdfPatientId] = useState<number>(0);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfNotes, setPdfNotes] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Recipe picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDay, setPickerDay] = useState<number>(0);
  const [pickerSlot, setPickerSlot] = useState<MealSlot>("breakfast");
  const [recipeSearch, setRecipeSearch] = useState("");

  // ── Load all data ──────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const [patientsRes, recipesRes, plansRes, pdfRes] = await Promise.all([
        nutritionistPatientsApi.my(),
        nutritionistRecipesApi.list(),
        nutritionistMealPlansApi.list(),
        fetch("/api/nutrition-plans/pdf-plans", { headers: { Authorization: `Bearer ${localStorage.getItem("kl_token")}` } }).then(res => res.json())
      ]);
      setPatients(patientsRes.patients ?? []);
      setRecipes(recipesRes.recipes ?? []);
      setRecipeBasedPlans(plansRes.mealPlans ?? []);
      if (pdfRes.success) setPdfPlans(pdfRes.plans ?? []);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const days = useMemo(() => getDaysBetween(startDate, endDate), [startDate, endDate]);

  const filteredRecipes = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(r => r.name.toLowerCase().includes(q) || (r.category ?? "").toLowerCase().includes(q));
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
    setAssigned(prev => [
      ...prev.filter(a => a.slotId !== slotId),
      { slotId, dayIndex: pickerDay, slot: pickerSlot, recipe },
    ]);
    setPickerOpen(false);
  };

  const removeAssignment = (slotId: string) =>
    setAssigned(prev => prev.filter(a => a.slotId !== slotId));

  const getAssigned = (dayIndex: number, slot: MealSlot) =>
    assigned.find(a => a.slotId === `${dayIndex}-${slot}`);

  // ── Submit recipe plan ────────────────────────────────────────────────────
  const submitRecipePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { toast.error("Select a client"); return; }
    if (!startDate || !endDate) { toast.error("Start and end dates required"); return; }
    if (endDate < startDate) { toast.error("End date must be after start date"); return; }
    if (assigned.length === 0) { toast.error("Assign at least one recipe to a meal slot"); return; }

    setSaving(true);
    try {
      const meals = assigned.map(a => ({
        type: a.slot,
        name: a.recipe.name,
        calories: a.recipe.kcal ?? 0,
        recipeId: a.recipe.id,
        dayIndex: a.dayIndex,
      }));

      await nutritionistMealPlansApi.create({
        patientId,
        title: title.trim() || `Nutrition Plan — ${startDate}`,
        startDate,
        endDate,
        notes: notes.trim() || undefined,
        meals,
      });
      toast.success("Recipe plan created");
      // Reset form
      setPatientId(0); setTitle(""); setEndDate(""); setNotes(""); setAssigned([]);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setSaving(false);
    }
  };

  // ── Submit PDF plan ───────────────────────────────────────────────────────
  const submitPdfPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfPatientId) { toast.error("Select a client"); return; }
    if (!pdfFile) { toast.error("Select a PDF file"); return; }
    if (pdfFile.type !== "application/pdf") { toast.error("File must be a PDF"); return; }
    if (pdfFile.size > 10 * 1024 * 1024) { toast.error("Max size 10MB"); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append("patientId", String(pdfPatientId));
    formData.append("title", pdfTitle.trim() || "Meal Plan PDF");
    if (pdfNotes.trim()) formData.append("notes", pdfNotes.trim());
    formData.append("pdfFile", pdfFile);

    try {
      const token = localStorage.getItem("kl_token");
      const res = await fetch("/api/nutrition-plans/upload-pdf", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      toast.success("PDF nutrition plan uploaded");
      setPdfPatientId(0);
      setPdfTitle("");
      setPdfNotes("");
      setPdfFile(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  };

  // ── Delete any plan (recipe or PDF) ───────────────────────────────────────
  const removePlan = async (id: number) => {
    try {
      await nutritionistMealPlansApi.remove(id);
      toast.success("Plan deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const allPlans = [
    ...recipeBasedPlans.map(p => ({ ...p, type: "recipe" as const })),
    ...pdfPlans.map(p => ({ ...p, type: "pdf" as const })),
  ];

  const showEmptyRecipes = !loading && recipes.length === 0 && planMode === "recipe";

  return (
    <div className="space-y-6">
      <Tabs value={planMode} onValueChange={(v) => setPlanMode(v as "recipe" | "pdf")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="recipe">📋 Recipe Builder</TabsTrigger>
          <TabsTrigger value="pdf">📄 PDF Upload</TabsTrigger>
        </TabsList>
      </Tabs>

      {planMode === "recipe" && !showEmptyRecipes && recipes.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl text-sm text-green-800">
          <BookOpen size={16} />
          <span>
            Build from your <strong>{recipes.length} saved recipe{recipes.length !== 1 ? "s" : ""}</strong>.
            Select client, set dates, click any meal slot to assign a recipe.
            <button className="underline font-semibold ml-2" onClick={() => navigate("/nutritionist/recipes")}>
              Manage recipes →
            </button>
          </span>
        </div>
      )}

      {showEmptyRecipes && (
        <Card className="text-center py-16">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
              <ChefHat size={32} className="text-green-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">No recipes in your library</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Add recipes first, then create meal plans.</p>
            </div>
            <Button onClick={() => navigate("/nutritionist/recipes")}>
              <Plus size={14} className="mr-2" /> Go to Recipe Library
            </Button>
          </CardContent>
        </Card>
      )}

      {!showEmptyRecipes && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left side: form */}
          {planMode === "recipe" && (
            <form onSubmit={submitRecipePlan} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users size={18} /> Plan Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Client *</Label>
                    <Select value={patientId ? String(patientId) : ""} onValueChange={(v) => setPatientId(Number(v))}>
                      <SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger>
                      <SelectContent>
                        {patients.map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.user?.fullName ?? `Client #${p.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Plan title</Label>
                    <Input value={title} placeholder="e.g. Weight loss week 1" onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Start date *</Label>
                      <Input type="date" value={startDate} min={new Date().toISOString().slice(0,10)} onChange={e => { setStartDate(e.target.value); setAssigned([]); }} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>End date *</Label>
                      <Input type="date" value={endDate} min={startDate} onChange={e => { setEndDate(e.target.value); setAssigned([]); }} />
                    </div>
                  </div>
                  {days.length > 0 && <p className="text-xs text-muted-foreground">{days.length} day{days.length !== 1 ? "s" : ""} (max 14)</p>}
                  <div className="space-y-1.5">
                    <Label>Notes for patient</Label>
                    <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" rows={2} value={notes} placeholder="Dietary notes, instructions…" onChange={e => setNotes(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {days.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarDays size={18} /> Assign Recipes to Meal Slots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[420px] pr-2">
                      <div className="space-y-4">
                        {days.map((day, dayIndex) => (
                          <div key={day}>
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{formatDay(day)}</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {MEAL_SLOTS.map(({ value: slot, label, emoji }) => {
                                const a = getAssigned(dayIndex, slot);
                                return (
                                  <div key={slot} className={`relative rounded-xl border-2 p-2 text-xs transition-all cursor-pointer group ${a ? "border-green-600 bg-green-50" : "border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50"}`} onClick={() => openPicker(dayIndex, slot)}>
                                    <div className="font-semibold mb-1">{emoji} {label}</div>
                                    {a ? (
                                      <>
                                        <div className="font-bold text-green-700 truncate">{a.recipe.name}</div>
                                        <div className="text-gray-500">{a.recipe.kcal} kcal</div>
                                        <button type="button" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeAssignment(a.slotId); }}><X size={12} className="text-red-500" /></button>
                                      </>
                                    ) : (
                                      <div className="text-muted-foreground flex items-center gap-1"><Plus size={10} /> Add recipe</div>
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
                  <CardFooter className="justify-between">
                    <span className="text-xs text-muted-foreground">{assigned.length} recipe{assigned.length !== 1 ? "s" : ""} assigned</span>
                    <Button type="submit" disabled={saving || assigned.length === 0}>
                      {saving ? "Saving…" : "Save & Send to Patient"} <ArrowRight size={14} className="ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </form>
          )}

          {planMode === "pdf" && (
            <form onSubmit={submitPdfPlan} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText size={18} /> Upload PDF Meal Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Client *</Label>
                    <Select value={pdfPatientId ? String(pdfPatientId) : ""} onValueChange={(v) => setPdfPatientId(Number(v))}>
                      <SelectTrigger><SelectValue placeholder="Select a client…" /></SelectTrigger>
                      <SelectContent>
                        {patients.map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.user?.fullName ?? `Client #${p.id}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Plan title</Label>
                    <Input value={pdfTitle} placeholder="e.g. Ketogenic Diet Plan" onChange={e => setPdfTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes (optional)</Label>
                    <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" rows={2} value={pdfNotes} placeholder="Additional instructions…" onChange={e => setPdfNotes(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>PDF File *</Label>
                    <div className="flex items-center gap-2">
                      <Input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="flex-1" />
                      {pdfFile && <Badge variant="secondary">{pdfFile.name}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">Max 10MB, PDF only.</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={uploading || !pdfFile || !pdfPatientId}>
                    {uploading ? "Uploading…" : "Upload & Assign"} <Upload size={14} className="ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </form>
          )}

          {/* Right side: active plans list (both types) */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Utensils size={16} /> Active Plans <Badge variant="secondary">{allPlans.length}</Badge></CardTitle>
              </CardHeader>
              <CardContent>
                {loading && <p className="text-center py-4 text-sm">Loading…</p>}
                {!loading && allPlans.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No plans yet. Create one above.</p>
                  </div>
                )}
                <ScrollArea className="h-[520px] pr-2">
                  <div className="space-y-3">
                    {/* Recipe plans */}
                    {recipeBasedPlans.map(p => {
                      const patient = patients.find(x => x.id === p.patientId);
                      return (
                        <div key={`recipe-${p.id}`} className="rounded-xl border p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-sm flex items-center gap-1"><ChefHat size={12} /> {p.title || "Untitled"}</div>
                              <div className="text-xs text-muted-foreground">👤 {patient?.user?.fullName ?? `Client #${p.patientId}`}</div>
                              <div className="text-xs text-muted-foreground">📅 {p.startDate}{p.endDate ? ` → ${p.endDate}` : ""}</div>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => removePlan(p.id!)}><Trash2 size={13} /></Button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Badge variant="secondary">{p.meals?.length ?? 0} meals</Badge>
                            {p.notes && <Badge variant="outline">{p.notes}</Badge>}
                          </div>
                        </div>
                      );
                    })}
                    {/* PDF plans */}
                    {pdfPlans.map(p => (
                      <div key={`pdf-${p.id}`} className="rounded-xl border p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm flex items-center gap-1"><File size={12} /> {p.title}</div>
                            <div className="text-xs text-muted-foreground">👤 {p.patientName}</div>
                            <div className="text-xs text-muted-foreground">📅 Uploaded {new Date(p.uploadedAt).toLocaleDateString()}</div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" asChild><a href={p.pdfUrl} target="_blank" rel="noopener noreferrer"><FileText size={13} /></a></Button>
                            <Button variant="destructive" size="sm" onClick={() => removePlan(p.id)}><Trash2 size={13} /></Button>
                          </div>
                        </div>
                        {p.notes && <div className="mt-2 text-xs text-muted-foreground">{p.notes}</div>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recipe picker dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pick a recipe for {MEAL_SLOTS.find(s => s.value === pickerSlot)?.emoji} {MEAL_SLOTS.find(s => s.value === pickerSlot)?.label}</DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search your recipes…" value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} autoFocus />
          </div>
          <ScrollArea className="h-[340px] pr-2">
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No recipes match.</div>
            ) : (
              <div className="grid gap-2">
                {filteredRecipes.map(r => (
                  <button key={r.id} type="button" onClick={() => assignRecipe(r)} className="w-full text-left rounded-xl border p-3 hover:border-green-600 hover:bg-green-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{r.emoji ?? "🍽️"}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.kcal} kcal · {r.prepTime}{r.category && ` · ${r.category}`}</div>
                      </div>
                      <Plus size={16} className="text-muted-foreground group-hover:text-green-700" />
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