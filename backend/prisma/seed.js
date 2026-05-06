// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding prebuilt meal plans...');

  // Helper to create a plan with meals and food items
  async function createPrebuiltPlan(name, description, durationDays, mealsData) {
    // Use findFirst because 'name' is not unique (only combination with isTemplate would be, but we don't have that constraint)
    const existing = await prisma.nutritionPlan.findFirst({
      where: { name, isTemplate: true },
    });
    if (existing) {
      console.log(`⚠️ Plan "${name}" already exists, skipping.`);
      return;
    }

    const plan = await prisma.nutritionPlan.create({
      data: {
        name,
        isTemplate: true,
        status: 'ACTIVE',
        durationDays,
        meals: {
          create: mealsData.map(meal => ({
            dayNumber: meal.day,
            mealType: meal.mealType,
            instructions: meal.instructions || null,
            foodItems: {
              create: meal.foodItems.map(food => ({
                name: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                portionSize: food.portionSize,
              })),
            },
          })),
        },
      },
      include: { meals: { include: { foodItems: true } } },
    });
    console.log(`✅ Created prebuilt plan: "${name}" (${durationDays} days)`);
    return plan;
  }

  // ---------- Plan 1: Standard Weight Loss (1500-1700 kcal/day) ----------
  const standardMeals = [
    // Day 1
    { day: 1, mealType: 'BREAKFAST', instructions: 'Cook oats with water, top with berries',
      foodItems: [
        { name: 'Rolled oats', calories: 150, protein: 5, carbs: 27, fat: 3, portionSize: '40g dry' },
        { name: 'Mixed berries', calories: 60, protein: 1, carbs: 14, fat: 0, portionSize: '100g' },
        { name: 'Chia seeds', calories: 60, protein: 2, carbs: 5, fat: 4, portionSize: '1 tbsp' }
      ]
    },
    { day: 1, mealType: 'LUNCH', instructions: 'Grill chicken, use light vinaigrette',
      foodItems: [
        { name: 'Grilled chicken breast', calories: 165, protein: 31, carbs: 0, fat: 4, portionSize: '120g' },
        { name: 'Mixed greens salad', calories: 50, protein: 2, carbs: 8, fat: 1, portionSize: '2 cups' },
        { name: 'Cherry tomatoes', calories: 30, protein: 1, carbs: 6, fat: 0, portionSize: '100g' },
        { name: 'Light vinaigrette', calories: 80, protein: 0, carbs: 3, fat: 8, portionSize: '1 tbsp' }
      ]
    },
    { day: 1, mealType: 'SNACK',
      foodItems: [{ name: 'Non-fat Greek yogurt', calories: 100, protein: 17, carbs: 6, fat: 0, portionSize: '150g' }]
    },
    { day: 1, mealType: 'DINNER', instructions: 'Bake salmon at 400°F for 12-15 min',
      foodItems: [
        { name: 'Baked salmon fillet', calories: 250, protein: 25, carbs: 0, fat: 17, portionSize: '120g' },
        { name: 'Quinoa (cooked)', calories: 120, protein: 4, carbs: 21, fat: 2, portionSize: '1/2 cup' },
        { name: 'Steamed broccoli', calories: 55, protein: 4, carbs: 11, fat: 0, portionSize: '1 cup' }
      ]
    },
    // Day 2
    { day: 2, mealType: 'BREAKFAST', instructions: 'Scramble eggs in non-stick pan',
      foodItems: [
        { name: 'Eggs (large)', calories: 210, protein: 18, carbs: 3, fat: 15, portionSize: '3 whole' },
        { name: 'Baby spinach', calories: 20, protein: 2, carbs: 3, fat: 0, portionSize: '2 cups' },
        { name: 'Cherry tomatoes', calories: 15, protein: 0, carbs: 3, fat: 0, portionSize: '5 halves' }
      ]
    },
    { day: 2, mealType: 'LUNCH', instructions: 'Use whole wheat tortilla',
      foodItems: [
        { name: 'Turkey breast slices', calories: 120, protein: 24, carbs: 2, fat: 2, portionSize: '100g' },
        { name: 'Avocado', calories: 120, protein: 2, carbs: 6, fat: 11, portionSize: '1/4 medium' },
        { name: 'Whole wheat tortilla', calories: 120, protein: 4, carbs: 22, fat: 2, portionSize: '1 small' },
        { name: 'Lettuce & tomato', calories: 20, protein: 1, carbs: 4, fat: 0, portionSize: 'as needed' }
      ]
    },
    { day: 2, mealType: 'SNACK', instructions: 'Natural peanut butter, no added sugar',
      foodItems: [
        { name: 'Medium apple', calories: 95, protein: 0, carbs: 25, fat: 0, portionSize: '1 apple' },
        { name: 'Peanut butter', calories: 95, protein: 4, carbs: 3, fat: 8, portionSize: '1 tbsp' }
      ]
    },
    { day: 2, mealType: 'DINNER', instructions: 'Stir-fry in a non-stick pan',
      foodItems: [
        { name: 'Lean beef strips', calories: 250, protein: 38, carbs: 0, fat: 12, portionSize: '120g' },
        { name: 'Brown rice (cooked)', calories: 110, protein: 2, carbs: 23, fat: 1, portionSize: '1/2 cup' },
        { name: 'Bell peppers & onion', calories: 40, protein: 1, carbs: 9, fat: 0, portionSize: '1 cup' },
        { name: 'Soy sauce (low sodium)', calories: 10, protein: 0, carbs: 1, fat: 0, portionSize: '1 tbsp' }
      ]
    },
    // Day 3
    { day: 3, mealType: 'BREAKFAST', instructions: 'Top with banana slices',
      foodItems: [
        { name: 'Smoothie bowl base (frozen berries, spinach, protein powder)', calories: 300, protein: 20, carbs: 40, fat: 6, portionSize: '1 bowl' },
        { name: 'Granola', calories: 60, protein: 1, carbs: 12, fat: 1, portionSize: '15g' }
      ]
    },
    { day: 3, mealType: 'LUNCH', instructions: 'Rinse canned chickpeas',
      foodItems: [
        { name: 'Quinoa (cooked)', calories: 220, protein: 8, carbs: 39, fat: 4, portionSize: '1 cup' },
        { name: 'Chickpeas', calories: 120, protein: 6, carbs: 20, fat: 2, portionSize: '100g' },
        { name: 'Cucumber & tomato', calories: 30, protein: 1, carbs: 6, fat: 0, portionSize: '1 cup' },
        { name: 'Lemon tahini dressing', calories: 90, protein: 2, carbs: 3, fat: 8, portionSize: '1 tbsp' }
      ]
    },
    { day: 3, mealType: 'SNACK',
      foodItems: [{ name: 'Handful of almonds', calories: 160, protein: 6, carbs: 6, fat: 14, portionSize: '1 oz' }]
    },
    { day: 3, mealType: 'DINNER', instructions: 'Use lean ground turkey',
      foodItems: [
        { name: 'Turkey burger patty', calories: 200, protein: 32, carbs: 0, fat: 8, portionSize: '150g' },
        { name: 'Whole wheat bun', calories: 120, protein: 5, carbs: 22, fat: 2, portionSize: '1 bun' },
        { name: 'Sweet potato fries (baked)', calories: 120, protein: 2, carbs: 28, fat: 0, portionSize: '1 medium' },
        { name: 'Lettuce & pickle', calories: 10, protein: 0, carbs: 2, fat: 0, portionSize: 'as needed' }
      ]
    },
    // Day 4
    { day: 4, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Whole grain toast', calories: 160, protein: 6, carbs: 28, fat: 3, portionSize: '2 slices' },
        { name: 'Avocado', calories: 120, protein: 2, carbs: 6, fat: 11, portionSize: '1/4 medium' },
        { name: 'Poached egg', calories: 70, protein: 6, carbs: 1, fat: 5, portionSize: '1 egg' }
      ]
    },
    { day: 4, mealType: 'LUNCH',
      foodItems: [
        { name: 'Lentil soup', calories: 180, protein: 12, carbs: 30, fat: 2, portionSize: '1 cup' },
        { name: 'Whole wheat roll', calories: 80, protein: 3, carbs: 15, fat: 1, portionSize: '1 small' }
      ]
    },
    { day: 4, mealType: 'SNACK',
      foodItems: [{ name: 'Cottage cheese', calories: 80, protein: 11, carbs: 4, fat: 2, portionSize: '1/2 cup' }]
    },
    { day: 4, mealType: 'DINNER', instructions: 'Bake chicken with rosemary',
      foodItems: [
        { name: 'Baked chicken thigh (skinless)', calories: 230, protein: 24, carbs: 0, fat: 14, portionSize: '120g' },
        { name: 'Roasted vegetables (zucchini, bell peppers, onion)', calories: 80, protein: 2, carbs: 15, fat: 2, portionSize: '1.5 cups' },
        { name: 'Quinoa (cooked)', calories: 110, protein: 4, carbs: 20, fat: 2, portionSize: '1/2 cup' }
      ]
    },
    // Day 5
    { day: 5, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Protein pancakes (mix)', calories: 300, protein: 24, carbs: 35, fat: 8, portionSize: '2 pancakes' },
        { name: 'Sugar-free syrup', calories: 20, protein: 0, carbs: 5, fat: 0, portionSize: '2 tbsp' }
      ]
    },
    { day: 5, mealType: 'LUNCH',
      foodItems: [
        { name: 'Canned tuna in water', calories: 120, protein: 26, carbs: 0, fat: 1, portionSize: '1 can' },
        { name: 'Whole grain bread', calories: 160, protein: 6, carbs: 28, fat: 3, portionSize: '2 slices' },
        { name: 'Light mayo', calories: 35, protein: 0, carbs: 1, fat: 4, portionSize: '1 tsp' },
        { name: 'Celery sticks', calories: 10, protein: 0, carbs: 2, fat: 0, portionSize: '2 stalks' }
      ]
    },
    { day: 5, mealType: 'SNACK',
      foodItems: [{ name: 'String cheese', calories: 80, protein: 6, carbs: 1, fat: 5, portionSize: '1 stick' }]
    },
    { day: 5, mealType: 'DINNER',
      foodItems: [
        { name: 'Vegetarian chili (beans, tomatoes, corn)', calories: 280, protein: 15, carbs: 45, fat: 3, portionSize: '1.5 cups' },
        { name: 'Brown rice (cooked)', calories: 110, protein: 2, carbs: 23, fat: 1, portionSize: '1/2 cup' }
      ]
    },
    // Day 6
    { day: 6, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Chia pudding (made with almond milk)', calories: 280, protein: 8, carbs: 20, fat: 18, portionSize: '1 cup' },
        { name: 'Fresh raspberries', calories: 30, protein: 1, carbs: 7, fat: 0, portionSize: '1/2 cup' }
      ]
    },
    { day: 6, mealType: 'LUNCH', instructions: 'Use low‑sodium broth',
      foodItems: [
        { name: 'Vegetable & tofu stir-fry', calories: 320, protein: 18, carbs: 25, fat: 15, portionSize: '1.5 cups' },
        { name: 'Brown rice (cooked)', calories: 110, protein: 2, carbs: 23, fat: 1, portionSize: '1/2 cup' }
      ]
    },
    { day: 6, mealType: 'SNACK',
      foodItems: [{ name: 'Hard-boiled egg', calories: 70, protein: 6, carbs: 1, fat: 5, portionSize: '1 egg' }]
    },
    { day: 6, mealType: 'DINNER',
      foodItems: [
        { name: 'Grilled shrimp skewers', calories: 140, protein: 24, carbs: 2, fat: 3, portionSize: '100g' },
        { name: 'Zucchini noodles', calories: 40, protein: 2, carbs: 8, fat: 0, portionSize: '2 cups' },
        { name: 'Pesto sauce', calories: 120, protein: 2, carbs: 2, fat: 12, portionSize: '1 tbsp' }
      ]
    },
    // Day 7
    { day: 7, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Omelette with mushrooms and cheese', calories: 350, protein: 24, carbs: 6, fat: 24, portionSize: '3 eggs + 1/2 cup veggies' }
      ]
    },
    { day: 7, mealType: 'LUNCH', instructions: 'Mix everything in a bowl',
      foodItems: [
        { name: 'Mediterranean bowl (hummus, grilled veggies, feta, olives)', calories: 450, protein: 15, carbs: 35, fat: 25, portionSize: '1 bowl' },
        { name: 'Whole wheat pita', calories: 130, protein: 5, carbs: 25, fat: 1, portionSize: '1 small' }
      ]
    },
    { day: 7, mealType: 'SNACK',
      foodItems: [{ name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0, portionSize: '1 medium' }]
    },
    { day: 7, mealType: 'DINNER', instructions: 'Use fresh herbs',
      foodItems: [
        { name: 'Baked cod fillet', calories: 180, protein: 34, carbs: 0, fat: 4, portionSize: '150g' },
        { name: 'Sweet potato (baked)', calories: 115, protein: 2, carbs: 27, fat: 0, portionSize: '1 medium' },
        { name: 'Steamed green beans', calories: 44, protein: 2, carbs: 10, fat: 0, portionSize: '1 cup' }
      ]
    }
  ];

  await createPrebuiltPlan(
    'Standard Weight Loss Week',
    'Balanced 1500-1700 kcal/day plan for sustainable weight loss (40% carbs, 30% protein, 30% fat)',
    7,
    standardMeals
  );

  // ---------- Plan 2: Keto Diet Plan (20-50g carbs/day) ----------
  const ketoMeals = [
    // Day 1
    { day: 1, mealType: 'BREAKFAST', instructions: 'Cook in coconut oil or butter',
      foodItems: [
        { name: 'Eggs (large)', calories: 210, protein: 18, carbs: 3, fat: 15, portionSize: '3 whole' },
        { name: 'Bacon strips', calories: 215, protein: 15, carbs: 1, fat: 17, portionSize: '4 strips' },
        { name: 'Avocado', calories: 120, protein: 2, carbs: 6, fat: 11, portionSize: '1/4 medium' }
      ]
    },
    { day: 1, mealType: 'LUNCH', instructions: 'No croutons, use Caesar dressing',
      foodItems: [
        { name: 'Grilled chicken thigh', calories: 250, protein: 25, carbs: 0, fat: 17, portionSize: '120g' },
        { name: 'Romaine lettuce', calories: 15, protein: 1, carbs: 3, fat: 0, portionSize: '3 cups' },
        { name: 'Parmesan cheese', calories: 110, protein: 10, carbs: 1, fat: 7, portionSize: '30g' },
        { name: 'Caesar dressing (keto)', calories: 150, protein: 1, carbs: 2, fat: 15, portionSize: '2 tbsp' }
      ]
    },
    { day: 1, mealType: 'SNACK',
      foodItems: [
        { name: 'Celery sticks', calories: 10, protein: 0, carbs: 2, fat: 0, portionSize: '4 stalks' },
        { name: 'Cream cheese', calories: 100, protein: 2, carbs: 2, fat: 10, portionSize: '2 tbsp' }
      ]
    },
    { day: 1, mealType: 'DINNER', instructions: 'Bake with butter, lemon, garlic',
      foodItems: [
        { name: 'Wild salmon fillet', calories: 280, protein: 30, carbs: 0, fat: 17, portionSize: '150g' },
        { name: 'Asparagus spears', calories: 40, protein: 4, carbs: 7, fat: 0, portionSize: '10 spears' },
        { name: 'Butter sauce', calories: 100, protein: 0, carbs: 0, fat: 11, portionSize: '1 tbsp' }
      ]
    },
    // Day 2
    { day: 2, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Bulletproof coffee', calories: 250, protein: 0, carbs: 0, fat: 28, portionSize: '1 cup + 1 tbsp MCT oil + 1 tbsp butter' }
      ]
    },
    { day: 2, mealType: 'LUNCH',
      foodItems: [
        { name: 'Tuna salad with mayo', calories: 480, protein: 35, carbs: 2, fat: 35, portionSize: '1 can tuna mixed with 2 tbsp mayo' },
        { name: 'Mixed greens', calories: 10, protein: 1, carbs: 2, fat: 0, portionSize: '2 cups' }
      ]
    },
    { day: 2, mealType: 'SNACK',
      foodItems: [{ name: 'Almonds', calories: 170, protein: 6, carbs: 6, fat: 15, portionSize: '1/4 cup' }]
    },
    { day: 2, mealType: 'DINNER', instructions: 'Use spiralized zucchini instead of pasta',
      foodItems: [
        { name: 'Zucchini noodles', calories: 40, protein: 2, carbs: 8, fat: 0, portionSize: '2 cups' },
        { name: 'Beef meatballs (homemade, no breadcrumbs)', calories: 400, protein: 35, carbs: 6, fat: 26, portionSize: '4 meatballs' },
        { name: 'Alfredo sauce (keto)', calories: 200, protein: 4, carbs: 3, fat: 20, portionSize: '1/4 cup' }
      ]
    },
    // Day 3
    { day: 3, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Coconut flour pancakes', calories: 320, protein: 12, carbs: 12, fat: 26, portionSize: '2 pancakes' },
        { name: 'Sugar‑free syrup', calories: 15, protein: 0, carbs: 4, fat: 0, portionSize: '1 tbsp' }
      ]
    },
    { day: 3, mealType: 'LUNCH',
      foodItems: [
        { name: 'Pork rinds', calories: 160, protein: 14, carbs: 0, fat: 10, portionSize: '1 oz' },
        { name: 'Guacamole (small)', calories: 100, protein: 1, carbs: 6, fat: 9, portionSize: '2 tbsp' }
      ]
    },
    { day: 3, mealType: 'SNACK',
      foodItems: [{ name: 'Cheese stick', calories: 80, protein: 6, carbs: 1, fat: 6, portionSize: '1 stick' }]
    },
    { day: 3, mealType: 'DINNER',
      foodItems: [
        { name: 'Ribeye steak', calories: 550, protein: 42, carbs: 0, fat: 42, portionSize: '200g' },
        { name: 'Sautéed mushrooms in butter', calories: 100, protein: 2, carbs: 6, fat: 8, portionSize: '1 cup' }
      ]
    },
    // Day 4
    { day: 4, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Scrambled eggs with cheddar', calories: 330, protein: 22, carbs: 3, fat: 26, portionSize: '3 eggs + 1/4 cup cheese' }
      ]
    },
    { day: 4, mealType: 'LUNCH',
      foodItems: [
        { name: 'Chicken wings (baked, no breading)', calories: 420, protein: 38, carbs: 0, fat: 30, portionSize: '6 wings' },
        { name: 'Celery sticks with blue cheese dip', calories: 100, protein: 2, carbs: 3, fat: 9, portionSize: '2 tbsp dip' }
      ]
    },
    { day: 4, mealType: 'SNACK',
      foodItems: [{ name: 'Hard-boiled egg', calories: 70, protein: 6, carbs: 1, fat: 5, portionSize: '1 egg' }]
    },
    { day: 4, mealType: 'DINNER',
      foodItems: [
        { name: 'Pork chops', calories: 350, protein: 30, carbs: 0, fat: 24, portionSize: '150g' },
        { name: 'Cauliflower rice (buttered)', calories: 60, protein: 2, carbs: 6, fat: 4, portionSize: '1 cup' }
      ]
    },
    // Day 5
    { day: 5, mealType: 'BREAKFAST',
      foodItems: [{ name: 'Full‑fat Greek yogurt', calories: 220, protein: 20, carbs: 9, fat: 12, portionSize: '200g' }]
    },
    { day: 5, mealType: 'LUNCH',
      foodItems: [
        { name: 'Cheeseburger (no bun)', calories: 450, protein: 35, carbs: 5, fat: 32, portionSize: '1 patty + cheese' },
        { name: 'Lettuce wrap', calories: 5, protein: 0, carbs: 1, fat: 0, portionSize: '2 leaves' }
      ]
    },
    { day: 5, mealType: 'SNACK',
      foodItems: [{ name: 'Macadamia nuts', calories: 200, protein: 2, carbs: 4, fat: 21, portionSize: '1/4 cup' }]
    },
    { day: 5, mealType: 'DINNER',
      foodItems: [
        { name: 'Shrimp scampi (with zucchini noodles)', calories: 420, protein: 35, carbs: 10, fat: 28, portionSize: '1 serving' }
      ]
    },
    // Day 6
    { day: 6, mealType: 'BREAKFAST',
      foodItems: [{ name: 'Keto smoothie (coconut milk, spinach, protein powder)', calories: 350, protein: 25, carbs: 8, fat: 25, portionSize: '16 oz' }]
    },
    { day: 6, mealType: 'LUNCH',
      foodItems: [
        { name: 'Egg salad with avocado', calories: 400, protein: 20, carbs: 8, fat: 34, portionSize: '1 cup' }
      ]
    },
    { day: 6, mealType: 'SNACK',
      foodItems: [{ name: 'Parmesan crisps', calories: 150, protein: 10, carbs: 2, fat: 11, portionSize: '1 oz' }]
    },
    { day: 6, mealType: 'DINNER',
      foodItems: [
        { name: 'Grilled lamb chops', calories: 500, protein: 45, carbs: 0, fat: 35, portionSize: '200g' },
        { name: 'Roasted radishes', calories: 40, protein: 1, carbs: 8, fat: 1, portionSize: '1 cup' }
      ]
    },
    // Day 7
    { day: 7, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Ham and cheese omelette', calories: 380, protein: 28, carbs: 4, fat: 28, portionSize: '3 eggs + 2 oz ham + 1/4 cup cheese' }
      ]
    },
    { day: 7, mealType: 'LUNCH',
      foodItems: [
        { name: 'Buffalo chicken dip (celery sticks)', calories: 320, protein: 22, carbs: 4, fat: 24, portionSize: '1/2 cup dip' }
      ]
    },
    { day: 7, mealType: 'SNACK',
      foodItems: [{ name: 'Olives', calories: 50, protein: 0, carbs: 2, fat: 5, portionSize: '5 olives' }]
    },
    { day: 7, mealType: 'DINNER',
      foodItems: [
        { name: 'Fatty fish (mackerel) with garlic butter', calories: 400, protein: 35, carbs: 1, fat: 28, portionSize: '150g' },
        { name: 'Creamed spinach', calories: 250, protein: 8, carbs: 10, fat: 20, portionSize: '1 cup' }
      ]
    }
  ];

  await createPrebuiltPlan(
    'Keto Kickstart Week',
    'High-fat (70%), moderate protein (25%), low-carb (5%) plan for ketosis (~1800 kcal/day)',
    7,
    ketoMeals
  );

  // ---------- Plan 3: Vegetarian High Protein (120g+ protein/day) ----------
  const vegHighProteinMeals = [
    // Day 1
    { day: 1, mealType: 'BREAKFAST', instructions: 'Layer in parfait glass',
      foodItems: [
        { name: 'Greek yogurt (full fat)', calories: 220, protein: 20, carbs: 9, fat: 12, portionSize: '200g' },
        { name: 'Chia seeds', calories: 140, protein: 5, carbs: 12, fat: 9, portionSize: '2 tbsp' },
        { name: 'Granola (low sugar)', calories: 120, protein: 3, carbs: 18, fat: 4, portionSize: '30g' }
      ]
    },
    { day: 1, mealType: 'LUNCH', instructions: 'Pan-fry patty 4 min per side',
      foodItems: [
        { name: 'Black bean burger patty', calories: 250, protein: 15, carbs: 30, fat: 8, portionSize: '1 patty' },
        { name: 'Whole wheat bun', calories: 120, protein: 5, carbs: 22, fat: 2, portionSize: '1 bun' },
        { name: 'Avocado slices', calories: 80, protein: 1, carbs: 4, fat: 7, portionSize: '1/4 avocado' },
        { name: 'Spinach & tomato', calories: 30, protein: 2, carbs: 5, fat: 0, portionSize: 'as needed' }
      ]
    },
    { day: 1, mealType: 'SNACK', instructions: 'Mix with cinnamon',
      foodItems: [
        { name: 'Cottage cheese (low fat)', calories: 160, protein: 25, carbs: 6, fat: 4, portionSize: '1 cup' },
        { name: 'Pineapple chunks', calories: 80, protein: 1, carbs: 21, fat: 0, portionSize: '100g' }
      ]
    },
    { day: 1, mealType: 'DINNER', instructions: 'Bake tofu at 400°F for 25 min',
      foodItems: [
        { name: 'Extra firm tofu', calories: 180, protein: 20, carbs: 4, fat: 10, portionSize: '200g' },
        { name: 'Quinoa (cooked)', calories: 222, protein: 8, carbs: 39, fat: 4, portionSize: '1 cup' },
        { name: 'Roasted zucchini', calories: 60, protein: 2, carbs: 10, fat: 1, portionSize: '1.5 cups' },
        { name: 'Tahini drizzle', calories: 90, protein: 3, carbs: 3, fat: 8, portionSize: '1 tbsp' }
      ]
    },
    // Day 2
    { day: 2, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Protein smoothie (pea protein, almond milk, banana, spinach)', calories: 300, protein: 25, carbs: 45, fat: 7, portionSize: '16 oz' }
      ]
    },
    { day: 2, mealType: 'LUNCH',
      foodItems: [
        { name: 'Lentil salad (cooked lentils, cucumber, feta, lemon vinaigrette)', calories: 450, protein: 25, carbs: 55, fat: 16, portionSize: '2 cups' }
      ]
    },
    { day: 2, mealType: 'SNACK',
      foodItems: [{ name: 'Edamame (shelled)', calories: 120, protein: 11, carbs: 9, fat: 5, portionSize: '1/2 cup' }]
    },
    { day: 2, mealType: 'DINNER',
      foodItems: [
        { name: 'Seitan stir-fry (with broccoli, bell peppers, soy sauce)', calories: 420, protein: 35, carbs: 30, fat: 12, portionSize: '1.5 cups' },
        { name: 'Brown rice (cooked)', calories: 110, protein: 2, carbs: 23, fat: 1, portionSize: '1/2 cup' }
      ]
    },
    // Day 3
    { day: 3, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Scrambled eggs with spinach', calories: 240, protein: 20, carbs: 4, fat: 16, portionSize: '3 eggs + 1 cup spinach' },
        { name: 'Whole grain toast', calories: 80, protein: 3, carbs: 15, fat: 1, portionSize: '1 slice' }
      ]
    },
    { day: 3, mealType: 'LUNCH',
      foodItems: [
        { name: 'Chickpea wrap (mashed chickpeas, avocado, lettuce, tahini)', calories: 520, protein: 20, carbs: 60, fat: 24, portionSize: '1 wrap' }
      ]
    },
    { day: 3, mealType: 'SNACK',
      foodItems: [{ name: 'Roasted pumpkin seeds', calories: 140, protein: 6, carbs: 5, fat: 12, portionSize: '1/4 cup' }]
    },
    { day: 3, mealType: 'DINNER',
      foodItems: [
        { name: 'Tempeh bowl (marinated tempeh, quinoa, roasted broccoli)', calories: 480, protein: 30, carbs: 50, fat: 18, portionSize: '1.5 cups' }
      ]
    },
    // Day 4
    { day: 4, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Peanut butter banana smoothie (whey protein, almond milk)', calories: 350, protein: 28, carbs: 40, fat: 12, portionSize: '16 oz' }
      ]
    },
    { day: 4, mealType: 'LUNCH',
      foodItems: [
        { name: 'Caprese salad with fresh mozzarella', calories: 420, protein: 22, carbs: 12, fat: 32, portionSize: '1 large' }
      ]
    },
    { day: 4, mealType: 'SNACK',
      foodItems: [{ name: 'Roasted chickpeas', calories: 120, protein: 6, carbs: 18, fat: 3, portionSize: '1/2 cup' }]
    },
    { day: 4, mealType: 'DINNER',
      foodItems: [
        { name: 'Eggplant parmesan (baked, not fried)', calories: 390, protein: 24, carbs: 35, fat: 18, portionSize: '1 serving' }
      ]
    },
    // Day 5
    { day: 5, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Tofu scramble (with turmeric, nutritional yeast, spinach)', calories: 280, protein: 24, carbs: 12, fat: 15, portionSize: '1.5 cups' }
      ]
    },
    { day: 5, mealType: 'LUNCH',
      foodItems: [
        { name: 'Falafel pita with tahini sauce', calories: 510, protein: 20, carbs: 60, fat: 22, portionSize: '2 falafel + pita' }
      ]
    },
    { day: 5, mealType: 'SNACK',
      foodItems: [{ name: 'Protein bar (vegan, low sugar)', calories: 200, protein: 15, carbs: 22, fat: 8, portionSize: '1 bar' }]
    },
    { day: 5, mealType: 'DINNER',
      foodItems: [
        { name: 'Lentil & sweet potato shepherd\'s pie', calories: 460, protein: 20, carbs: 65, fat: 12, portionSize: '1.5 cups' }
      ]
    },
    // Day 6
    { day: 6, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Oatmeal with pea protein powder', calories: 320, protein: 22, carbs: 45, fat: 6, portionSize: '1 serving' }
      ]
    },
    { day: 6, mealType: 'LUNCH',
      foodItems: [
        { name: 'Quinoa bowl (black beans, corn, avocado, lime dressing)', calories: 530, protein: 18, carbs: 65, fat: 22, portionSize: '1.5 cups' }
      ]
    },
    { day: 6, mealType: 'SNACK',
      foodItems: [{ name: 'Hummus with bell pepper slices', calories: 150, protein: 5, carbs: 15, fat: 8, portionSize: '1/4 cup hummus' }]
    },
    { day: 6, mealType: 'DINNER',
      foodItems: [
        { name: 'Vegan protein pasta (lentil pasta, cashew cream sauce)', calories: 490, protein: 26, carbs: 60, fat: 18, portionSize: '1.5 cups' }
      ]
    },
    // Day 7
    { day: 7, mealType: 'BREAKFAST',
      foodItems: [
        { name: 'Veggie omelette (3 eggs, mushrooms, peppers, cheese)', calories: 370, protein: 28, carbs: 8, fat: 26, portionSize: '1 omelette' }
      ]
    },
    { day: 7, mealType: 'LUNCH',
      foodItems: [
        { name: 'Mediterranean quinoa salad (feta, olives, cucumber, chickpeas)', calories: 470, protein: 18, carbs: 55, fat: 20, portionSize: '2 cups' }
      ]
    },
    { day: 7, mealType: 'SNACK',
      foodItems: [{ name: 'Cottage cheese with berries', calories: 140, protein: 18, carbs: 12, fat: 3, portionSize: '1/2 cup + 1/2 cup berries' }]
    },
    { day: 7, mealType: 'DINNER',
      foodItems: [
        { name: 'Portobello mushroom burgers (with cheese, avocado)', calories: 480, protein: 22, carbs: 40, fat: 26, portionSize: '1 burger' }
      ]
    }
  ];

  await createPrebuiltPlan(
    'Vegetarian High Protein Week',
    'Plant-powered 120g+ protein/day with complete amino acid profiles',
    7,
    vegHighProteinMeals
  );

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });