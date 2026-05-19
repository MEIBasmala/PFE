// src/components/patient/RecipeLibrary.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { 
  BookOpenText, Clock, Flame, List, ChefHat, Search, Heart, 
  FolderOpen, TrendingUp, BarChart3, Utensils, Sun, Moon, 
  Apple, Coffee, Globe, BookmarkCheck, PlusCircle, CheckCircle2,
  Loader2
} from "lucide-react";
import { useDiary } from "@/contexts/DiaryContext";
import { getRecipes, saveRecipe, unsaveRecipe, getSavedRecipes } from "@/services/api";
import { toast } from "sonner";
import type { Recipe, MealCategory } from "@/types/api";
import {
  Card, CardContent, Button, Badge, Skeleton, Dialog,
  DialogContent, DialogHeader, DialogTitle, DialogFooter, Input,
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
  const { addLog } = useDiary(); // ← use the real diary system
  
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "saved">("all");

  // Fetch recipes + saved status
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const [allRecipes, saved] = await Promise.all([
          getRecipes(filter === "all" ? undefined : filter),
          getSavedRecipes().catch(() => [] as Recipe[])
        ]);
        
        setRecipes(allRecipes);
        setSavedRecipeIds(new Set(saved.map((r: Recipe) => r.id)));
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
    let items = viewMode === "saved" 
      ? recipes.filter(r => savedRecipeIds.has(r.id))
      : recipes;
      
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
  }, [recipes, debouncedQ, savedRecipeIds, viewMode]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    counts.all = recipes.length;
    recipes.forEach((r) => {
      const cat = r.category || "uncategorized";
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return counts;
  }, [recipes]);

  const popular = useMemo(() => recipes.slice(0, 4), [recipes]);

  // Toggle save/unsave (backend persisted)
  const toggleSaveRecipe = useCallback(async (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    setSavingId(recipe.id);
    
    try {
      if (savedRecipeIds.has(recipe.id)) {
        await unsaveRecipe(recipe.id);
        setSavedRecipeIds(prev => {
          const next = new Set(prev);
          next.delete(recipe.id);
          return next;
        });
        toast.success(`Removed ${recipe.name} from saved`);
      } else {
        await saveRecipe(recipe.id);
        setSavedRecipeIds(prev => new Set([...prev, recipe.id]));
        toast.success(`Saved ${recipe.name} to your collection`);
      }
    } catch {
      toast.error("Failed to update saved recipes");
    } finally {
      setSavingId(null);
    }
  }, [savedRecipeIds]);

  // ── THE KEY FIX: Use DiaryContext.addLog to create REAL FoodLog ──
  const handleLogToDiary = async (recipe: Recipe) => {
    setLoggingId(recipe.id);
    try {
      // This creates an actual FoodLog entry via your existing diary system!
      await addLog({
        name: recipe.name,
        category: (recipe.category === "ramadan" ? "dinner" : recipe.category) as MealCategory,
        calories: recipe.kcal,
        source: "recipe", // ← shows "recipe" in AI Tracker
        imageUrl: recipe.imageUrl || undefined,
        // Optional: include macros in notes
        notes: `Protein: ${recipe.protein}g | Carbs: ${recipe.carbs}g | Fat: ${recipe.fat}g`,
      });
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Added to your diary! 🍽️</span>
          <span className="text-xs">{recipe.name} — {recipe.kcal} kcal</span>
          <span className="text-xs text-muted-foreground">Check your AI Tracker or Home page</span>
        </div>
      );
      
      // Close modal after logging
      setSelectedRecipe(null);
    } catch (err) {
      toast.error("Failed to add to diary");
    } finally {
      setLoggingId(null);
    }
  };

  const isSaved = (recipeId: string) => savedRecipeIds.has(recipeId);

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
            <Utensils size={20} className="text-primary" />
          
          <p className="text-xs sm:text-base md:text-lg text-muted-foreground mt-1">
            Discover healthy meals curated by our nutritionists
          </p>
          </div>
        </div>

        {/* Search — mobile */}
        <div className="relative mb-3 lg:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* View toggle + Filters */}
        <div className="flex flex-wrap gap-2 mb-4 md:mb-6 items-center">
          <button
            onClick={() => setViewMode("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200
              ${viewMode === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-background text-foreground border-border hover:bg-muted"
              }`}
          >
            <FolderOpen size={16} />
            <span>All Recipes</span>
            <span className="rounded-full bg-primary-foreground/20 px-2 py-0 text-xs font-semibold ml-1">
              {recipes.length}
            </span>
          </button>
          
          <button
            onClick={() => setViewMode("saved")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200
              ${viewMode === "saved"
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-background text-foreground border-border hover:bg-muted"
              }`}
          >
            <BookmarkCheck size={16} />
            <span>Saved</span>
            {savedRecipeIds.size > 0 && (
              <span className="rounded-full bg-primary-foreground/20 px-2 py-0 text-xs font-semibold ml-1">
                {savedRecipeIds.size}
              </span>
            )}
          </button>

          <div className="w-px h-8 bg-border mx-1 hidden sm:block" />

          {FILTERS.map((f) => {
            const Icon = f.icon;
            const isActive = filter === f.value && viewMode === "all";
            return (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setViewMode("all"); }}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200
                  ${isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background text-foreground border-border hover:bg-muted hover:-translate-y-0.5"
                  }`}
              >
                <Icon size={16} />
                <span>{f.label}</span>
                {categoryCounts[f.value] != null && (
                  <span className={`rounded-full px-2 py-0 text-xs font-semibold ml-1
                    ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {categoryCounts[f.value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1 min-w-0">
            {filtered.length === 0 && !loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mb-3">
                    {viewMode === "saved" ? (
                      <BookmarkCheck size={48} className="mx-auto text-muted-foreground" />
                    ) : (
                      <Search size={48} className="mx-auto text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {viewMode === "saved" ? "No saved recipes yet" : "No recipes found"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {viewMode === "saved" 
                      ? "Browse recipes and click the heart to save them here"
                      : debouncedQ ? "Try a different search term" : "Try a different category"
                    }
                  </p>
                  {viewMode === "saved" && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setViewMode("all")}>
                      Browse All Recipes
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((recipe) => (
                  <Card
                    key={recipe.id}
                    className="group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative"
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    {/* Save button */}
                    <button
                      onClick={(e) => toggleSaveRecipe(e, recipe)}
                      disabled={savingId === recipe.id}
                      className="absolute right-3 top-3 z-10 rounded-full bg-background/90 p-2 backdrop-blur-sm transition-all hover:scale-110 shadow-sm disabled:opacity-50"
                      title={isSaved(recipe.id) ? "Remove from saved" : "Save recipe"}
                    >
                      {savingId === recipe.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Heart 
                          size={16} 
                          className={isSaved(recipe.id) 
                            ? "fill-destructive text-destructive" 
                            : "text-muted-foreground hover:text-destructive"
                          } 
                        />
                      )}
                    </button>

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
                      <div className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                        <Clock size={12} /> {recipe.prepTime}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="mb-1 line-clamp-1 text-lg font-bold font-syne">{recipe.name}</h3>
                      <div className="mb-2 text-xs text-muted-foreground">
                        {recipe.kcal} kcal · P {recipe.protein}g · C {recipe.carbs}g · F {recipe.fat}g
                      </div>
                      <div className="mb-3 flex flex-wrap gap-1">
                        {recipe.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecipe(recipe);
                        }}
                      >
                        <BookOpenText className="mr-2 h-4 w-4" /> View Recipe
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

            {/* Saved Recipes Sidebar */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 text-xl font-syne flex items-center gap-2">
                  <BookmarkCheck size={20} className="text-primary" /> Saved Recipes
                </h3>
                {savedRecipeIds.size === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved recipes yet. Click the heart icon on any recipe to save it.</p>
                ) : (
                  <div className="space-y-3">
                    {recipes
                      .filter(r => savedRecipeIds.has(r.id))
                      .slice(0, 5)
                      .map(recipe => (
                        <div
                          key={recipe.id}
                          onClick={() => setSelectedRecipe(recipe)}
                          className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors group"
                        >
                          <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-lg">{recipe.emoji}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{recipe.name}</p>
                            <p className="text-xs text-muted-foreground">{recipe.kcal} kcal</p>
                          </div>
                          <CheckCircle2 size={16} className="text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    {savedRecipeIds.size > 5 && (
                      <button 
                        onClick={() => setViewMode("saved")}
                        className="text-sm text-primary hover:underline w-full text-center"
                      >
                        View all {savedRecipeIds.size} saved →
                      </button>
                    )}
                  </div>
                )}
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
                        onClick={() => { setFilter(f.value); setViewMode("all"); }}
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
                          <span className="text-2xl">{p.emoji}</span>
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
                    <span className="text-sm text-muted-foreground">Saved</span>
                    <Badge variant="outline">{savedRecipeIds.size}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Calories</span>
                    <Badge variant="outline">
                      {recipes.length > 0 ? Math.round(recipes.reduce((acc, r) => acc + r.kcal, 0) / recipes.length) : 0} kcal
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* Recipe Detail Modal */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        {selectedRecipe && (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-syne flex items-center gap-3">
                  <span className="text-4xl">{selectedRecipe.emoji}</span>
                  {selectedRecipe.name}
                </DialogTitle>
                <button
                  onClick={(e) => toggleSaveRecipe(e, selectedRecipe)}
                  disabled={savingId === selectedRecipe.id}
                  className="rounded-full p-2 hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {savingId === selectedRecipe.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Heart 
                      size={24} 
                      className={isSaved(selectedRecipe.id) 
                        ? "fill-destructive text-destructive" 
                        : "text-muted-foreground"
                      } 
                    />
                  )}
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock size={14} /> {selectedRecipe.prepTime}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Flame size={14} /> {selectedRecipe.kcal} kcal</span>
                <span>•</span>
                <span>P {selectedRecipe.protein}g</span>
                <span>•</span>
                <span>C {selectedRecipe.carbs}g</span>
                <span>•</span>
                <span>F {selectedRecipe.fat}g</span>
                {selectedRecipe.difficulty && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{selectedRecipe.difficulty}</span>
                  </>
                )}
              </div>
            </DialogHeader>

            {selectedRecipe.imageUrl && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img src={selectedRecipe.imageUrl} alt={selectedRecipe.name} className="w-full h-48 object-cover" />
              </div>
            )}

            {selectedRecipe.description && (
              <p className="mb-4 border-l-3 border-primary pl-3 text-sm italic text-muted-foreground">
                {selectedRecipe.description}
              </p>
            )}

            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                Protein {selectedRecipe.protein}g
              </Badge>
              <Badge variant="secondary">Carbs {selectedRecipe.carbs}g</Badge>
              <Badge variant="outline">Fat {selectedRecipe.fat}g</Badge>
              <Badge variant="outline">{selectedRecipe.kcal} kcal</Badge>
            </div>

            {selectedRecipe.ingredients?.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-base">
                  <List size={18} className="text-primary" /> Ingredients
                </h3>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRecipe.instructions?.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-base">
                  <ChefHat size={18} className="text-primary" /> Instructions
                </h3>
                <ol className="space-y-3">
                  {selectedRecipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mb-4 rounded-lg bg-muted/50 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Nutrition Facts</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-primary">{selectedRecipe.kcal}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Calories</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-primary">{selectedRecipe.protein}g</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Protein</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-amber-600">{selectedRecipe.carbs}g</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Carbs</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">{selectedRecipe.fat}g</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Fat</div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 flex gap-3">
              <Button
                onClick={() => handleLogToDiary(selectedRecipe)}
                disabled={loggingId === selectedRecipe.id}
                className="flex-1 gap-2"
              >
                {loggingId === selectedRecipe.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" /> Log to Diary
                  </>
                )}
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