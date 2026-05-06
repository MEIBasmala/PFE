// src/components/patient/RecipeCard.tsx
import { useState } from "react";
import { Clock, BookOpenText, List, ChefHat } from "lucide-react";
import type { Recipe } from "@/types/api";
import { toast } from "sonner";
import { logRecipeToDiary } from "@/services/api";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";

interface RecipeCardProps {
  recipe: Recipe;
  onLog?: () => void;
}

export default function RecipeCard({ recipe, onLog }: RecipeCardProps) {
  const [open, setOpen] = useState(false);
  const [logging, setLogging] = useState(false);

  const handleLog = async () => {
    setLogging(true);
    try {
      await logRecipeToDiary(recipe.id, {
        date: new Date().toISOString().split("T")[0],
        mealType: recipe.category === "ramadan" ? "dinner" : recipe.category,
        time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
      });
      toast.success(`Added ${recipe.name} to your diary`);
      onLog?.();
    } catch {
      toast.error("Failed to add to diary");
    } finally {
      setLogging(false);
    }
  };

  return (
    <>
      <Card
        className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        onClick={() => setOpen(true)}
      >
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-4xl transition-transform group-hover:scale-110">
              {recipe.emoji}
            </div>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" /> {recipe.prepTime}
            </Badge>
          </div>
          <h3 className="mb-1 line-clamp-1 text-lg font-bold">{recipe.name}</h3>
          <div className="mb-2 text-xs text-muted-foreground">
            {recipe.kcal} kcal · P {recipe.protein}g · C {recipe.carbs}g · F {recipe.fat}g
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <Button
            className="w-full"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleLog();
            }}
            disabled={logging}
          >
            <BookOpenText className="mr-2 h-4 w-4" />
            {logging ? "Adding..." : "Log to Diary"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
            <div className="mt-1 flex gap-2 text-sm text-muted-foreground">
              <span>{recipe.prepTime}</span>
              <span>•</span>
              <span>{recipe.kcal} kcal</span>
              {recipe.difficulty && (
                <>
                  <span>•</span>
                  <span className="capitalize">{recipe.difficulty}</span>
                </>
              )}
            </div>
          </DialogHeader>
          <div className="mb-4 text-5xl">{recipe.emoji}</div>
          {recipe.description && (
            <p className="mb-4 border-l-3 pl-3 text-sm italic text-muted-foreground">
              {recipe.description}
            </p>
          )}
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="default">Protein {recipe.protein}g</Badge>
            <Badge variant="secondary">Carbs {recipe.carbs}g</Badge>
            <Badge variant="outline">Fat {recipe.fat}g</Badge>
          </div>
          {recipe.ingredients?.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <List className="h-4 w-4" /> Ingredients
              </h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>
          )}
          {recipe.instructions?.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <ChefHat className="h-4 w-4" /> Instructions
              </h3>
              <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                {recipe.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          <DialogFooter className="mt-4 flex gap-3">
            <Button onClick={handleLog} disabled={logging} className="flex-1">
              <BookOpenText className="mr-2 h-4 w-4" />
              {logging ? "Adding..." : "Log to Diary"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}