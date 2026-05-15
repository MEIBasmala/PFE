// src/components/patient/PatientMealPlan.tsx
import { useEffect, useMemo, useState } from "react";
import { 
  ListChecks, 
  Lock, 
  Sparkles, 
  Search, 
  ChefHat, 
  Clock, 
  Flame, 
  FolderOpen, 
  TrendingUp, 
  BarChart3, 
  Utensils, 
  Sun, 
  Moon, 
  Apple, 
  Coffee, 
  Leaf,
  CalendarDays,
  Zap,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getMyPlans, getPrebuiltPlans} from "@/services/api";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useDiary } from "@/contexts/DiaryContext";
import type { MealCategory, UIPlan,UIMeal } from "@/types/api";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  Separator,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay() || 7);
  const [mode, setMode] = useState<"prebuilt" | "personalized">(
    subscription?.package?.name?.toLowerCase() !== 'free' ? "personalized" : "prebuilt"
  );
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [showMobilePlans, setShowMobilePlans] = useState(false);
  const [selectedPrebuiltId, setSelectedPrebuiltId] = useState<number | null>(null);

  const prebuilt = useAsync(() => getPrebuiltPlans(), [], { skip: mode !== "prebuilt", toastOnError: false });
  const personalized = useAsync(() => getMyPlans(), [], { skip: mode !== "personalized", toastOnError: false });

  const hasMealPlans = subscription?.package?.name?.toLowerCase() !== 'free';
  const prebuiltPlans = prebuilt.data ?? [];

  useEffect(() => {
    if (prebuilt.data && prebuilt.data.length > 0 && selectedPrebuiltId === null && mode === "prebuilt") {
      setSelectedPrebuiltId(prebuilt.data[0].id);
    }
  }, [prebuilt.data, mode]);


  const selectedPlan = prebuiltPlans.find(p => p.id === selectedPrebuiltId) ?? prebuiltPlans[0];
  const currentPrebuiltDay = selectedPlan?.days.find(d => d.day === activeDay);

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

  const personalizedPlan = personalized.data?.[0] ?? null;

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

  // Get current meals based on mode
  const currentMeals = mode === "prebuilt" 
    ? (currentPrebuiltDay?.meals ?? [])
    : (personalizedPlan?.days.find(d => d.day === activeDay)?.meals ?? []);

  // Filter meals by search
  const filteredMeals = useMemo(() => {
    if (!debouncedQ.trim()) return currentMeals;
    const term = debouncedQ.trim().toLowerCase();
    return currentMeals.filter(m => m.name.toLowerCase().includes(term));
  }, [currentMeals, debouncedQ]);

  // Loading state matching Blog/Recipe pattern
  const isLoading = mode === "prebuilt" ? prebuilt.loading : personalized.loading;

  // Mobile plan selector component
  const MobilePlanSelector = () => {
    if (mode !== "prebuilt" || prebuiltPlans.length <= 1) return null;
    return (
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobilePlans(!showMobilePlans)}
          className="w-full flex items-center justify-between rounded-xl border border-border bg-background p-3 text-left hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2 font-medium">
            <FolderOpen size={18} className="text-primary" />
            {selectedPlan?.title || "Select Plan"}
          </span>
          {showMobilePlans ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showMobilePlans && (
          <div className="mt-2 rounded-xl border border-border bg-background overflow-hidden">
            {prebuiltPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => {
                  setSelectedPrebuiltId(plan.id);
                  setShowMobilePlans(false);
                }}
                className={`w-full flex items-center justify-between p-3 text-left transition-colors
                  ${plan.id === selectedPrebuiltId ? "bg-primary/10 text-primary" : "hover:bg-muted/50"}`}
              >
                <span className="flex items-center gap-2">
                  <ListChecks size={16} />
                  <span className="font-medium">{plan.title}</span>
                </span>
                <Badge variant={plan.id === selectedPrebuiltId ? "default" : "secondary"}>{plan.days.length} days</Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Mobile daily summary component
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

        <div className="mb-4 md:mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <ChefHat size={28} className="text-primary" />
           
          
          <p className="text-xs sm:text-base md:text-lg text-muted-foreground mt-1">
            {mode === "prebuilt" 
              ? "Browse pre-built nutrition plans curated by our experts"
              : "Your personalized meal plan from your nutritionist"}
          </p>
          </div>
        </div>

        {/* Search — mobile only */}
        <div className="relative mb-3 lg:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meals..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Mode toggle + Day selector — unified pill style */}
        <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
          {/* Mode pills */}
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

          <div className="w-px h-8 bg-border mx-1 hidden sm:block" />

          {/* Day pills */}
          {selectedPlan?.days.map((day) => {
            const DayIcon = DAY_ICONS[day.day - 1] || Sun;
            return (
              <button
                key={day.day}
                onClick={() => setActiveDay(day.day)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium border transition-all duration-200
                  ${day.day === activeDay
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background text-foreground border-border hover:bg-muted hover:-translate-y-0.5"
                  }`}
              >
                <DayIcon size={14} />
                <span>{DAY_LABEL[day.day - 1] || `Day ${day.day}`}</span>
              </button>
            );
          })}
        </div>

        {/* MOBILE: Priority sections — Plans & Summary appear BEFORE meals */}
        <MobilePlanSelector />
        <MobileDailySummary />

        {/* Main layout — unified two-column with sidebar */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Meals column */}
          <div className="flex-1 min-w-0">
            {filteredMeals.length === 0 && !isLoading ? (
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
                {filteredMeals.map((meal) => {
                  const mealType = meal.mealType.toLowerCase();
                  const MealIcon = MEAL_TYPE_ICONS[mealType] || Utensils;
                  const color = MEAL_TYPE_COLORS[mealType] || "hsl(var(--primary))";

                  return (
                    <Card
                      key={meal.id}
                      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {/* Card top — gradient banner with meal type icon */}
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

                        {/* Calories bar */}
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

                        {/* Macros grid */}
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

                        {/* Tags */}
                        <div className="mb-3 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {mealType}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {meal.calories} kcal
                          </Badge>
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
            )}
          </div>

          {/* DESKTOP SIDEBAR — Reordered: Summary first, then Plans, then Days, then Search, then Tip */}
          <aside className="hidden lg:block lg:w-80 space-y-6">

            {/* 1. Daily Summary — HIGHEST PRIORITY */}
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

            {/* 2. Plans Selector — SECOND PRIORITY */}
            {mode === "prebuilt" && prebuiltPlans.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                    <LayoutGrid size={20} className="text-primary" /> Plans
                  </h3>
                  {prebuiltPlans.length === 1 ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary">
                      <ListChecks size={16} />
                      <span className="font-medium">{prebuiltPlans[0].title}</span>
                      <Badge variant="default" className="ml-auto">{prebuiltPlans[0].days.length} days</Badge>
                    </div>
                  ) : (
                    <ul className="space-y-2 text-base">
                      {prebuiltPlans.map((plan) => {
                        const isSelected = plan.id === selectedPrebuiltId;
                        return (
                          <li
                            key={plan.id}
                            onClick={() => setSelectedPrebuiltId(plan.id)}
                            className={`flex justify-between items-center cursor-pointer transition-colors py-2 rounded-lg px-3
                              ${isSelected 
                                ? "bg-primary/10 text-primary font-medium" 
                                : "hover:bg-muted/50 text-foreground"
                              }`}
                          >
                            <span className="flex items-center gap-2">
                              <ListChecks size={16} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                              <span className="truncate">{plan.title}</span>
                            </span>
                            <Badge variant={isSelected ? "default" : "secondary"}>{plan.days.length} days</Badge>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 3. Days */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                  <CalendarDays size={20} className="text-primary" /> Days
                </h3>
                <ul className="space-y-2 text-base">
                  {selectedPlan?.days.map((day) => {
                    const DayIcon = DAY_ICONS[day.day - 1] || Sun;
                    const isActive = day.day === activeDay;
                    return (
                      <li
                        key={day.day}
                        onClick={() => setActiveDay(day.day)}
                        className={`flex justify-between items-center cursor-pointer transition-colors py-2 rounded-lg px-3
                          ${isActive 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "hover:bg-muted/50 text-foreground"
                          }`}
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

            {/* 4. Search */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                  <Search size={20} className="text-primary" /> Search
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search meals..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-10 py-2 text-base"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 5. Tip */}
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
          </aside>

        </div>
      </div>
    </div>
  );
}