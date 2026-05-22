// src/components/patient/PatientMealPlan.tsx
import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  Sparkles,
  Lock,
  FolderOpen,
  ExternalLink,
  CalendarDays,
  User,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Zap,
  LayoutGrid,
  ListChecks,
  ChefHat,
  Clock,
  Flame,
  Utensils,
  Sun,
  Moon,
  Apple,
  Coffee,
  Leaf,
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getMyPlans, getPrebuiltPlans } from "@/services/api";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useDiary } from "@/contexts/DiaryContext";
import type { NutritionPlan, MealCategory, UIPlan } from "@/types/api";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
  Separator,
  Input,
} from "@/components/ui";

const DAY_LABEL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_ICONS = [Sun, Sun, Sun, Sun, Moon, Moon, Sun];

const MEAL_TYPE_ICONS: Record<string, React.ElementType> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Apple,
};

const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: "#f59e0b",
  lunch: "#10b981",
  dinner: "#6366f1",
  snack: "#f97316",
};

export default function PatientMealPlan() {
  const { subscription } = useSubscription();
  const { addLog } = useDiary();
  const [mode, setMode] = useState<"prebuilt" | "personalized">(
    subscription?.package?.name?.toLowerCase() !== 'free' ? "personalized" : "prebuilt"
  );
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [activeDay, setActiveDay] = useState<number>(1);

  // Prebuilt: UIPlan[] from API
  const prebuilt = useAsync(() => getPrebuiltPlans(), [], { skip: false, toastOnError: false });
  const prebuiltPlans: UIPlan[] = prebuilt.data ?? [];

  // Personalized: raw NutritionPlan[] for PDFs
  const personalized = useAsync(() => getMyPlans(), [], { skip: mode !== "personalized", toastOnError: false });

  const hasMealPlans = subscription?.package?.name?.toLowerCase() !== 'free';

  // Prebuilt selection
  const [selectedPrebuiltId, setSelectedPrebuiltId] = useState<number | null>(null);
  useEffect(() => {
    if (prebuiltPlans.length > 0 && selectedPrebuiltId === null) {
      setSelectedPrebuiltId(prebuiltPlans[0].id);
    }
  }, [prebuiltPlans, selectedPrebuiltId]);

  const selectedPrebuilt = prebuiltPlans.find(p => p.id === selectedPrebuiltId) ?? prebuiltPlans[0];
  const currentPrebuiltDay = selectedPrebuilt?.days.find(d => d.day === activeDay);

  const dayTotals = useMemo(() => {
    if (!currentPrebuiltDay) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    return currentPrebuiltDay.meals.reduce(
      (acc, m) => ({
        kcal: acc.kcal + m.calories,
        protein: acc.protein + m.macros.protein,
        carbs: acc.carbs + m.macros.carbs,
        fat: acc.fat + m.macros.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [currentPrebuiltDay]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const handleLogMeal = async (name: string, category: MealCategory, calories: number) => {
    try {
      await addLog({ name, category, calories, source: "plan" });
      toast.success(`Logged ${name}`);
    } catch (err) {
      toast.error("Failed to log meal");
    }
  };

  const handleViewPdf = (url: string | null | undefined) => {
  if (!url) {
    toast.error("No PDF available for this plan");
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

  // Filter prebuilt meals by search
  const filteredPrebuiltMeals = useMemo(() => {
    if (!currentPrebuiltDay) return [];
    if (!debouncedQ.trim()) return currentPrebuiltDay.meals;
    const term = debouncedQ.trim().toLowerCase();
    return currentPrebuiltDay.meals.filter(m => m.name.toLowerCase().includes(term));
  }, [currentPrebuiltDay, debouncedQ]);

  // Filter personalized PDF plans by search
  const filteredPdfPlans = useMemo(() => {
    if (!personalized.data) return [];
    let result = personalized.data.filter((p: NutritionPlan) => p.pdfUrl);
    if (debouncedQ.trim()) {
      const term = debouncedQ.toLowerCase();
      result = result.filter((p: NutritionPlan) =>
        p.name?.toLowerCase().includes(term) ||
        p.nutritionist?.user?.fullName?.toLowerCase().includes(term) ||
        p.pdfNotes?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [personalized.data, debouncedQ]);

  const pdfActiveCount = filteredPdfPlans.filter((p: NutritionPlan) => p.status === 'ACTIVE').length;

  const isLoading = mode === "prebuilt" ? prebuilt.loading : personalized.loading;

  // Mobile daily summary for prebuilt
  const MobileDailySummary = () => (
    <div className="lg:hidden mb-4">
      <button
        onClick={() => setShowMobileSummary(!showMobileSummary)}
        className="w-full flex items-center justify-between rounded-xl border border-border bg-background p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2 font-medium">
          <BarChart3 size={18} className="text-primary" />
          Daily Summary — {dayTotals.kcal} kcal
        </span>
        {showMobileSummary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {showMobileSummary && (
        <Card className="mt-2">
          <CardContent className="p-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Zap size={14} className="text-primary" /> Protein
                </span>
                <span className="font-semibold">{dayTotals.protein}g</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (dayTotals.protein / 150) * 100)}%` }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Leaf size={14} className="text-amber-600" /> Carbs
                </span>
                <span className="font-semibold">{dayTotals.carbs}g</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-amber-600" style={{ width: `${Math.min(100, (dayTotals.carbs / 300) * 100)}%` }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Flame size={14} className="text-orange-600" /> Fat
                </span>
                <span className="font-semibold">{dayTotals.fat}g</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-orange-600" style={{ width: `${Math.min(100, (dayTotals.fat / 100) * 100)}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="w-full px-4 py-6">
        <Skeleton className="h-10 w-64 mb-4 mx-auto" />
        <Skeleton className="h-6 w-96 mb-8 mx-auto" />
        <div className="flex flex-wrap gap-2 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-28 shrink-0" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-3 py-4 md:px-6 md:py-6">

        {/* Header */}
        <div className="mb-4 md:mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            {mode === "prebuilt" ? <ChefHat size={28} className="text-primary" /> : <FileText size={28} className="text-primary" />}
            <h1 className="text-2xl md:text-3xl font-bold font-syne">Nutrition Plans</h1>
          </div>
          <p className="text-xs sm:text-base md:text-lg text-muted-foreground mt-1">
            {mode === "prebuilt"
              ? "Browse pre-built nutrition plans curated by our experts"
              : "Your personalized nutrition plans from your nutritionist"}
          </p>
        </div>

        {/* Search — mobile only */}
        <div className="relative mb-3 lg:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={mode === "prebuilt" ? "Search meals..." : "Search plans..."}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Mode Toggle — isolated row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setMode("prebuilt")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200
              ${mode === "prebuilt"
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-background text-foreground border-border hover:bg-muted hover:-translate-y-0.5"
              }`}
          >
            <FolderOpen size={16} />
            <span>Pre-built</span>
          </button>
          <button
            onClick={() => setMode("personalized")}
            disabled={!hasMealPlans}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200
              ${mode === "personalized"
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-background text-foreground border-border hover:bg-muted hover:-translate-y-0.5"
              } ${!hasMealPlans ? "opacity-50 cursor-not-allowed" : ""}`}
            title={!hasMealPlans ? "Upgrade to unlock personalized plans" : undefined}
          >
            {!hasMealPlans && <Lock size={14} />}
            <Sparkles size={16} />
            <span>Personalized</span>
          </button>
        </div>

        {/* Plan Selector — main area, no more sidebar scrolling */}
        {mode === "prebuilt" && prebuiltPlans.length > 0 && (
          <div className="mb-4 md:mb-6">
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid size={16} className="text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Select a plan</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {prebuiltPlans.map((plan) => {
                const isSelected = plan.id === selectedPrebuiltId;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPrebuiltId(plan.id)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200
                      ${isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background text-foreground border-border hover:bg-muted/60 hover:-translate-y-0.5"
                      }`}
                  >
                    <ListChecks size={16} />
                    <span className="truncate max-w-[160px]">{plan.title}</span>
                    <Badge
                      variant={isSelected ? "secondary" : "outline"}
                      className={`text-[10px] ${isSelected ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30" : ""}`}
                    >
                      {plan.days.length} days
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Day Selector — structured, never squishes */}
        {mode === "prebuilt" && selectedPrebuilt?.days && (
          <div className="mb-4 md:mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={16} className="text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Day {activeDay} — {DAY_LABEL[activeDay - 1] || "Select a day"}
              </span>
            </div>

            {/* Mobile: horizontal scroll so buttons never squish */}
            <div className="flex sm:hidden overflow-x-auto pb-2 gap-2 scrollbar-hide">
              {selectedPrebuilt.days.map((day) => {
                const isActive = day.day === activeDay;
                return (
                  <button
                    key={day.day}
                    onClick={() => setActiveDay(day.day)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border min-w-[72px] p-2 text-xs font-medium transition-all shrink-0
                      ${isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background text-foreground border-border hover:bg-muted/60"
                      }`}
                  >
                    <span>{DAY_LABEL[day.day - 1] || `D${day.day}`}</span>
                   
                  </button>
                );
              })}
            </div>

            {/* Desktop: clean 7-column grid */}
            <div className="hidden sm:grid grid-cols-7 gap-2">
              {selectedPrebuilt.days.map((day) => {
                const isActive = day.day === activeDay;
                return (
                  <button
                    key={day.day}
                    onClick={() => setActiveDay(day.day)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 md:p-3 text-xs md:text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                        : "bg-background text-foreground border-border hover:bg-muted/60 hover:-translate-y-0.5"
                      }`}
                  >
                    <span className="truncate">{DAY_LABEL[day.day - 1] || `Day ${day.day}`}</span>
                 
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Daily Summary */}
        {mode === "prebuilt" && <MobileDailySummary />}

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* CONTENT COLUMN */}
          <div className="flex-1 min-w-0">
            {mode === "prebuilt" ? (
              /* PREBUILT: Meal grid */
              filteredPrebuiltMeals.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="mb-3"><Search size={48} className="mx-auto text-muted-foreground" /></div>
                    <h3 className="text-lg font-semibold mb-1">No meals found</h3>
                    <p className="text-sm text-muted-foreground">
                      {debouncedQ ? "Try a different search term" : "No meals for this day"}
                    </p>
                    {debouncedQ && (
                      <Button variant="ghost" size="sm" className="mt-3" onClick={() => setQ("")}>
                        Clear search
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPrebuiltMeals.map((meal) => {
                    const mealType = meal.mealType.toLowerCase();
                    const MealIcon = MEAL_TYPE_ICONS[mealType] || Utensils;
                    const color = MEAL_TYPE_COLORS[mealType] || "hsl(var(--primary))";

                    return (
                      <Card
                        key={meal.id}
                        className="group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                          <div className="flex h-full w-full items-center justify-center">
                            <MealIcon size={48} className="text-primary/40 transition-transform duration-500 group-hover:scale-110" />
                          </div>
                          <div className="absolute right-3 top-3 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                            <Clock size={12} /> {meal.calories} kcal
                          </div>
                          <div className="absolute left-3 top-3">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {mealType}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <h3 className="mb-2 line-clamp-1 text-lg font-bold font-syne">{meal.name}</h3>

                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span className="flex items-center gap-1"><Flame size={12} /> Calories</span>
                              <span className="font-semibold">{meal.calories} kcal</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${Math.min(100, (meal.calories / 800) * 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center rounded-lg bg-muted/50 p-2">
                              <div className="text-xs font-bold text-primary">{meal.macros.protein}g</div>
                              <div className="text-[10px] text-muted-foreground">Protein</div>
                            </div>
                            <div className="text-center rounded-lg bg-muted/50 p-2">
                              <div className="text-xs font-bold text-amber-600">{meal.macros.carbs}g</div>
                              <div className="text-[10px] text-muted-foreground">Carbs</div>
                            </div>
                            <div className="text-center rounded-lg bg-muted/50 p-2">
                              <div className="text-xs font-bold text-orange-600">{meal.macros.fat}g</div>
                              <div className="text-[10px] text-muted-foreground">Fat</div>
                            </div>
                          </div>

                          <div className="mb-3 flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[10px] capitalize">{mealType}</Badge>
                            <Badge variant="outline" className="text-[10px]">{meal.calories} kcal</Badge>
                          </div>

                          <Button
                            className="w-full"
                            size="sm"
                            onClick={() => handleLogMeal(meal.name, mealType as MealCategory, meal.calories)}
                          >
                            <ListChecks className="mr-2 h-4 w-4" /> Log Meal
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )
            ) : (
              /* PERSONALIZED: PDF cards */
              filteredPdfPlans.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="mb-3">
                      <FileText size={48} className="mx-auto text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No PDF plans found</h3>
                    <p className="text-sm text-muted-foreground">
                      {debouncedQ
                        ? "Try a different search term"
                        : "Your nutritionist hasn't assigned any PDF plans yet"}
                    </p>
                    {debouncedQ && (
                      <Button variant="ghost" size="sm" className="mt-3" onClick={() => setQ("")}>
                        Clear search
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPdfPlans.map((plan: NutritionPlan) => (
                    <Card
                      key={plan.id}
                      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <FileText
                          size={64}
                          className="text-primary/30 transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute right-3 top-3">
                          <Badge
                            variant={plan.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {plan.status}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="mb-1 line-clamp-1 text-lg font-bold font-syne">
                          {plan.name || 'Untitled Plan'}
                        </h3>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <User size={14} />
                          <span className="truncate">
                            {plan.nutritionist?.user?.fullName || 'Unknown Nutritionist'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                          <CalendarDays size={14} />
                          <span>
                            {plan.createdAt
                              ? new Date(plan.createdAt).toLocaleDateString()
                              : 'Unknown date'}
                          </span>
                        </div>

                        {plan.pdfNotes && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {plan.pdfNotes}
                          </p>
                        )}

                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => handleViewPdf(plan.pdfUrl)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View PDF
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            )}
          </div>

          {/* DESKTOP SIDEBAR — cleaner, no plan selector buried here */}
          <aside className="hidden lg:block lg:w-80 space-y-6">

            {/* Search */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                  <Search size={20} className="text-primary" /> Search
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder={mode === "prebuilt" ? "Search meals..." : "Search plans..."}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-10 py-2 text-base"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Prebuilt sidebar */}
            {mode === "prebuilt" && (
              <>
                {/* Daily Summary */}
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                      <BarChart3 size={20} className="text-primary" /> Daily Summary
                    </h3>
                    <div className="text-center mb-4">
                      <div className="font-dm-serif text-3xl text-primary">
                        {dayTotals.kcal} <span className="text-base">kcal</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Total for {DAY_LABEL[activeDay - 1] || `Day ${activeDay}`}</div>
                    </div>
                    <Separator className="mb-4" />
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Zap size={14} className="text-primary" /> Protein
                        </span>
                        <span className="font-semibold">{dayTotals.protein}g</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (dayTotals.protein / 150) * 100)}%` }} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Leaf size={14} className="text-amber-600" /> Carbs
                        </span>
                        <span className="font-semibold">{dayTotals.carbs}g</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-amber-600" style={{ width: `${Math.min(100, (dayTotals.carbs / 300) * 100)}%` }} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Flame size={14} className="text-orange-600" /> Fat
                        </span>
                        <span className="font-semibold">{dayTotals.fat}g</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-orange-600" style={{ width: `${Math.min(100, (dayTotals.fat / 100) * 100)}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Days */}
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                      <CalendarDays size={20} className="text-primary" /> Days
                    </h3>
                    <ul className="space-y-2 text-base">
                      {selectedPrebuilt?.days.map((day) => {
                        const DayIcon = DAY_ICONS[day.day - 1] || Sun;
                        const isActive = day.day === activeDay;
                        return (
                          <li
                            key={day.day}
                            onClick={() => setActiveDay(day.day)}
                            className={`flex justify-between items-center cursor-pointer transition-colors py-2 rounded-lg px-3
                              ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground"}`}
                          >
                            <span className="flex items-center gap-2">
                              <DayIcon size={16} className={isActive ? "text-primary" : "text-muted-foreground"} />
                              <span>{DAY_LABEL[day.day - 1] || `Day ${day.day}`}</span>
                            </span>
                            <Badge variant={isActive ? "default" : "secondary"}>{day.meals.length} meals</Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>

                {/* Tip */}
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                      <Sparkles size={20} className="text-primary" /> Tip
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Log every plan meal — it'll auto-fill your diary so you can focus on the food, not the math. Consistency is key to reaching your goals!
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Personalized sidebar */}
            {mode === "personalized" && (
              <>
                {/* Summary */}
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                      <BarChart3 size={20} className="text-primary" /> Summary
                    </h3>
                    <div className="text-center mb-4">
                      <div className="font-dm-serif text-3xl text-primary">
                        {filteredPdfPlans.length} <span className="text-base">plans</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Assigned to you</div>
                    </div>
                    <Separator className="mb-4" />
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Zap size={14} className="text-primary" /> Active
                        </span>
                        <Badge variant="default">{pdfActiveCount}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <FileText size={14} className="text-muted-foreground" /> Other
                        </span>
                        <span className="font-semibold">{filteredPdfPlans.length - pdfActiveCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent PDFs */}
                {filteredPdfPlans.length > 0 && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                        <LayoutGrid size={20} className="text-primary" /> Recent
                      </h3>
                      <ul className="space-y-2">
                        {filteredPdfPlans.slice(0, 5).map((plan: NutritionPlan) => (
                          <li
                            key={plan.id}
                            onClick={() => handleViewPdf(plan.pdfUrl)}
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                          >
                            <FileText size={16} className="text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{plan.name || 'Untitled'}</p>
                              <p className="text-xs text-muted-foreground">
                                {plan.nutritionist?.user?.fullName || 'Unknown'}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Tip */}
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                      <Sparkles size={20} className="text-primary" /> Tip
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Click "View PDF" to open your nutrition plan in a new tab. You can download or print it directly from your browser.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

          </aside>

        </div>
      </div>
    </div>
  );
}