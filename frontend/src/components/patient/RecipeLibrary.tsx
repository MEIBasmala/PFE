// src/components/patient/RecipeLibrary.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpenText, Clock, Flame, List, ChefHat, Search, Heart, Star, FolderOpen, TrendingUp, BarChart3, Utensils, Sun, Moon, Apple, Coffee, Globe } from "lucide-react";
import { getRecipes, logRecipeToDiary } from "@/services/api";
import { toast } from "sonner";
import type { Recipe } from "@/types/api";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
} from "@/components/ui";

const FILTERS = [
  { value: "all", label: "All", icon: FolderOpen },
  { value: "breakfast", label: "Breakfast", icon: Coffee },
  { value: "lunch", label: "Lunch", icon: Sun },
  { value: "dinner", label: "Dinner", icon: Moon },
  { value: "snack", label: "Snack", icon: Apple },
  { value: "ramadan", label: "Ramadan", icon: Moon },
  { value: "algerian", label: "Traditional", icon: Globe },
];

export default function RecipeLibrary() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const data = await getRecipes(filter === "all" ? undefined : filter);
        setRecipes(data);
      } catch {
        toast.error("Could not load recipes");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, [filter]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    let items = recipes;
    if (debouncedQ.trim()) {
      const term = debouncedQ.trim().toLowerCase();
      items = items.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.tags?.some((tag) => tag.toLowerCase().includes(term)) ||
          r.description?.toLowerCase().includes(term)
      );
    }
    return items;
  }, [recipes, debouncedQ]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    counts.all = recipes.length;
    recipes.forEach((r) => {
      const cat = r.category || "uncategorized";
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return counts;
  }, [recipes]);

  const popular = useMemo(() => {
    return recipes.slice(0, 4);
  }, [recipes]);

  const handleLogToDiary = async (recipe: Recipe) => {
    setLoggingId(recipe.id);
    try {
      await logRecipeToDiary(recipe.id, {
        date: new Date().toISOString().split("T")[0],
        mealType: recipe.category === "ramadan" ? "dinner" : recipe.category,
        time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
      });
      toast.success(`Added ${recipe.name} to your diary`);
    } catch {
      toast.error("Failed to add to diary");
    } finally {
      setLoggingId(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <Skeleton className="h-10 w-64 mb-4 mx-auto" />
        <Skeleton className="h-6 w-96 mb-8 mx-auto" />
        <div className="flex flex-wrap gap-2 mb-6">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-10 w-28 shrink-0" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
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
            <Utensils size={28} className="text-primary" />
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight font-syne">
              Recipe Library
            </h1>
          </div>
          <p className="text-xs sm:text-base md:text-lg text-muted-foreground mt-1">
            Discover healthy meals curated by our nutritionists
          </p>
        </div>

        {/* Search — mobile only */}
        <div className="relative mb-3 lg:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Filter buttons — unified pill style with Lucide icons */}
        <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200
                  ${filter === f.value
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background text-foreground border-border hover:bg-muted hover:-translate-y-0.5"
                  }`}
              >
                <Icon size={16} />
                <span>{f.label}</span>
                {categoryCounts[f.value] != null && (
                  <span className={`rounded-full px-2 py-0 text-xs font-semibold ml-1
                    ${filter === f.value ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {categoryCounts[f.value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main layout — unified two-column with sidebar */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Recipes column */}
          <div className="flex-1 min-w-0">
            {filtered.length === 0 && !loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mb-3"><Search size={48} className="mx-auto text-muted-foreground" /></div>
                  <h3 className="text-lg font-semibold mb-1">No recipes found</h3>
                  <p className="text-sm text-muted-foreground">
                    {debouncedQ ? "Try a different search term" : "Try a different category"}
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
                {filtered.map((recipe) => (
                  <Card
                    key={recipe.id}
                    className="group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-6xl">
                          <Utensils size={48} className="text-primary/40" />
                        </div>
                      )}
                      <div className="absolute right-3 top-3 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                        <Clock size={12} /> {recipe.prepTime}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="mb-1 line-clamp-1 text-lg font-bold font-syne">{recipe.name}</h3>

                      <div className="mb-3 flex flex-wrap gap-1">
                        {recipe.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="mb-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1"><Flame size={12} /> Calories</span>
                          <span className="font-semibold">{recipe.kcal} kcal</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, (recipe.kcal / 800) * 100)}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="text-center">
                            <div className="text-xs font-bold text-primary">{recipe.protein}g</div>
                            <div className="text-[10px] text-muted-foreground">Protein</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold text-amber-600">{recipe.carbs}g</div>
                            <div className="text-[10px] text-muted-foreground">Carbs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold text-orange-600">{recipe.fat}g</div>
                            <div className="text-[10px] text-muted-foreground">Fat</div>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogToDiary(recipe);
                        }}
                        disabled={loggingId === recipe.id}
                      >
                        {loggingId === recipe.id ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <BookOpenText className="mr-2 h-4 w-4" /> Log to Diary
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block lg:w-80 space-y-6">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                  <Search size={20} className="text-primary" /> Search
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search recipes..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-10 py-2 text-base"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                  <FolderOpen size={20} className="text-primary" /> Categories
                </h3>
                <ul className="space-y-3 text-base">
                  {FILTERS.map((f) => {
                    const Icon = f.icon;
                    return (
                      <li
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className="flex justify-between items-center cursor-pointer hover:text-primary transition-colors py-1"
                      >
                        <span className="flex items-center gap-2">
                          <Icon size={16} className="text-muted-foreground" />
                          <span>{f.label}</span>
                        </span>
                        <Badge variant="secondary">{categoryCounts[f.value] ?? 0}</Badge>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                  <TrendingUp size={20} className="text-primary" /> Popular This Week
                </h3>
                {popular.length === 0 ? (
                  <p className="text-base text-muted-foreground">No recipes yet.</p>
                ) : (
                  <div className="space-y-4">
                    {popular.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedRecipe(p)}
                        className="flex gap-4 cursor-pointer group items-start"
                      >
                        <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Utensils size={28} className="text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {p.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock size={12} /> {p.prepTime}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                  <BarChart3 size={20} className="text-primary" /> Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Recipes</span>
                    <Badge variant="secondary">{recipes.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Calories</span>
                    <Badge variant="outline">
                      {recipes.length > 0 ? Math.round(recipes.reduce((acc, r) => acc + r.kcal, 0) / recipes.length) : 0} kcal
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Categories</span>
                    <Badge variant="outline">{FILTERS.length - 1}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

        </div>
      </div>

      {/* Recipe detail dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        {selectedRecipe && (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-syne">{selectedRecipe.name}</DialogTitle>
              <div className="mt-1 flex gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock size={14} /> {selectedRecipe.prepTime}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Flame size={14} /> {selectedRecipe.kcal} kcal</span>
                {selectedRecipe.difficulty && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{selectedRecipe.difficulty}</span>
                  </>
                )}
              </div>
            </DialogHeader>
            <div className="mb-4 flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10">
              <Utensils size={40} className="text-primary" />
            </div>
            {selectedRecipe.description && (
              <p className="mb-4 border-l-3 pl-3 text-sm italic text-muted-foreground">
                {selectedRecipe.description}
              </p>
            )}
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="default">Protein {selectedRecipe.protein}g</Badge>
              <Badge variant="secondary">Carbs {selectedRecipe.carbs}g</Badge>
              <Badge variant="outline">Fat {selectedRecipe.fat}g</Badge>
            </div>
            {selectedRecipe.ingredients?.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <List size={16} /> Ingredients
                </h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedRecipe.instructions?.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <ChefHat size={16} /> Instructions
                </h3>
                <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                  {selectedRecipe.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            <DialogFooter className="mt-4 flex gap-3">
              <Button
                onClick={() => {
                  handleLogToDiary(selectedRecipe);
                  setSelectedRecipe(null);
                }}
                disabled={loggingId === selectedRecipe.id}
                className="flex-1"
              >
                <BookOpenText className="mr-2 h-4 w-4" />
                {loggingId === selectedRecipe.id ? "Adding..." : "Log to Diary"}
              </Button>
              <Button variant="outline" onClick={() => setSelectedRecipe(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}