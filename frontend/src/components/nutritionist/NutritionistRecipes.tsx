import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { nutritionistRecipesApi } from "@/services/api";
import type { Recipe } from "@/types/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Badge,
  Skeleton,
  Label,
  CardFooter,
} from "@/components/ui";
import { Search, Plus, X, Trash2, BookOpen } from "lucide-react";

export default function RecipeLibrary() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    nutritionistRecipesApi
      .list()
      .then((r) => setRecipes(r.recipes ?? []))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.category ?? "").toLowerCase().includes(q)
    );
  }, [recipes, query]);

  const remove = async (id: string) => {
    try {
      await nutritionistRecipesApi.remove(id);
      toast.success("Recipe deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <X className="mr-2 h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> New Recipe
            </>
          )}
        </Button>
      </div>

      {/* New Recipe Form (Dialog on mobile, inline on desktop) */}
      {showForm && (
        <NewRecipeForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
                <Skeleton className="mt-2 h-10 w-full" />
                <div className="mt-2 flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>No recipes found.</p>
          </CardContent>
        </Card>
      )}

      {/* Recipe grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <Card key={recipe.id} className="group transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{recipe.name}</h3>
                    {recipe.category && (
                      <p className="text-xs text-muted-foreground">{recipe.category}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => remove(recipe.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {recipe.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {recipe.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {recipe.kcal != null && (
                    <Badge variant="secondary">{recipe.kcal} kcal</Badge>
                  )}
                  {recipe.prepTime && (
                    <Badge variant="outline">{recipe.prepTime}</Badge>
                  )}
                  {recipe.ingredients?.length > 0 && (
                    <Badge variant="outline">
                      {recipe.ingredients.length} ingredients
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// New Recipe Form as a Card (inline)
function NewRecipeForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Recipe, "id">>({
    name: "",
    description: "",
    category: "",
    kcal: 0,
    prepTime: "",
    ingredients: [],
    instructions: [],
    emoji: "🍽️",
    protein: 0,
    carbs: 0,
    fat: 0,
    tags: [],
  });
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.prepTime.trim()) return toast.error("Prep time is required");
    setSaving(true);
    try {
      await nutritionistRecipesApi.create({
        ...form,
        ingredients: ingredientsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        instructions: instructionsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.success("Recipe created");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Recipe</CardTitle>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              placeholder="Recipe name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              placeholder="e.g., Breakfast, Lunch, Dinner"
              value={form.category ?? ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description"
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={500}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kcal</Label>
              <Input
                type="number"
                placeholder="Calories"
                value={form.kcal ?? ""}
                onChange={(e) =>
                  setForm({ ...form, kcal: e.target.value ? Number(e.target.value) : 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Prep time *</Label>
              <Input
                placeholder="e.g., 30 min"
                value={form.prepTime ?? ""}
                onChange={(e) => setForm({ ...form, prepTime: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ingredients (one per line)</Label>
            <Textarea
              rows={3}
              placeholder="1 cup oats\n2 tbsp honey\n..."
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Instructions (one per line)</Label>
            <Textarea
              rows={3}
              placeholder="Mix all ingredients\nBake for 20 minutes\n..."
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Recipe"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}