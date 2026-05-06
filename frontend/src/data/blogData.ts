// src/data/blogData.ts
export interface BlogPost {
  id: number;
  title: string;
  author: string;
  date: string;
  fullDate?: string;
  readTime: string;
  category: string;
  excerpt: string;
  imageEmoji: string;
  isFeatured?: boolean;
  content?: string;
}

export interface PopularPost {
  title: string;
  readTime: string;
  views: string;
  emoji: string;
}

export const featuredPost: BlogPost = {
  id: 1,
  title: "10 Science-Backed Foods That Speed Up Your Metabolism",
  author: "Dr. Amira Nasri",
  date: "March 10, 2026",
  readTime: "8 min read",
  category: "nutrition",
  excerpt: "Discover the scientifically proven foods that can naturally boost your metabolism and help you achieve your health goals faster.",
  content: `<p>Have you ever wondered why some people seem to eat whatever they want without gaining weight while others struggle despite careful eating? The answer often lies in metabolic rate.</p>
    <h2>1. Green Tea</h2><p>Green tea contains catechins, powerful antioxidants that have been shown to increase fat oxidation and boost metabolic rate by 4-5%.</p>
    <h2>2. Lean Protein</h2><p>Protein has the highest thermic effect of food (TEF) — your body burns 20-30% of its calories just digesting protein.</p>
    <blockquote>"Increasing your protein intake by just 15% can boost your daily calorie burn by up to 150 calories." — Dr. Amira Nasri</blockquote>`,
  imageEmoji: "🥗",
  isFeatured: true,
};

export const blogPosts: BlogPost[] = [
  { id: 1, title: "10 Science-Backed Foods That Speed Up Your Metabolism", author: "Dr. Amira Nasri", date: "Mar 10, 2026", fullDate: "March 10, 2026", readTime: "8 min read", category: "nutrition", excerpt: "Discover the scientifically proven foods that can naturally boost your metabolism.", imageEmoji: "🥗", isFeatured: true },
  { id: 2, title: "How to Build a Balanced Plate at Every Meal", author: "Dr. Karim B.", date: "Mar 8, 2026", fullDate: "March 8, 2026", readTime: "6 min read", category: "nutrition", excerpt: "Learn the simple method nutritionists use to plan every meal: the plate method.", imageEmoji: "🍽️" },
  { id: 3, title: "Staying Energized During Ramadan Fasting", author: "Dr. Younes T.", date: "Mar 5, 2026", fullDate: "March 5, 2026", readTime: "10 min read", category: "ramadan", excerpt: "The best Suhoor foods to maintain energy levels throughout a full day of fasting.", imageEmoji: "🌙" },
  { id: 4, title: "Should You Exercise Before or After Eating?", author: "Dr. Amira N.", date: "Mar 3, 2026", fullDate: "March 3, 2026", readTime: "7 min read", category: "fitness", excerpt: "The science behind workout timing and its impact on fat burning and muscle gain.", imageEmoji: "🏃" },
  { id: 5, title: "Why You're Always Thirsty — And How to Fix It", author: "Dr. Leila M.", date: "Feb 28, 2026", fullDate: "February 28, 2026", readTime: "5 min read", category: "wellness", excerpt: "Dehydration myths, daily water needs, and how to build a better hydration habit.", imageEmoji: "💧" },
  { id: 6, title: "5 High-Protein Breakfasts Under 300 Calories", author: "Dr. Karim B.", date: "Feb 25, 2026", fullDate: "February 25, 2026", readTime: "6 min read", category: "recipes", excerpt: "Start your day right with these delicious, protein-packed breakfast options.", imageEmoji: "🍳" },
  { id: 7, title: "The Surprising Link Between Sleep and Weight Loss", author: "Dr. Amira N.", date: "Feb 22, 2026", fullDate: "February 22, 2026", readTime: "8 min read", category: "wellness", excerpt: "How quality sleep affects your metabolism and weight loss journey.", imageEmoji: "😴" },
  { id: 8, title: "Avocado & Brain Health: What Science Says", author: "Dr. Leila M.", date: "Feb 18, 2026", fullDate: "February 18, 2026", readTime: "4 min read", category: "nutrition", excerpt: "The cognitive benefits of incorporating avocados into your diet.", imageEmoji: "🥑" },
  { id: 9, title: "Green Tea Benefits: More Than Just Caffeine", author: "Dr. Karim B.", date: "Feb 15, 2026", fullDate: "February 15, 2026", readTime: "6 min read", category: "wellness", excerpt: "Discover the antioxidant power and health benefits of green tea.", imageEmoji: "🍵" },
  { id: 10, title: "Protein Timing Guide for Optimal Results", author: "Dr. Amira N.", date: "Feb 12, 2026", fullDate: "February 12, 2026", readTime: "8 min read", category: "fitness", excerpt: "When and how much protein to consume for muscle recovery and growth.", imageEmoji: "💪" },
  { id: 11, title: "Healthy Ramadan: A Complete Nutrition Guide", author: "Dr. Younes T.", date: "Feb 8, 2026", fullDate: "February 8, 2026", readTime: "12 min read", category: "ramadan", excerpt: "Comprehensive guide to maintaining health during the holy month.", imageEmoji: "🕌" },
  { id: 12, title: "Quick & Healthy Dinner Recipes Under 20 Minutes", author: "Dr. Karim B.", date: "Feb 5, 2026", fullDate: "February 5, 2026", readTime: "5 min read", category: "recipes", excerpt: "Delicious, nutritious meals you can prepare in a flash.", imageEmoji: "🍝" },
];

export const popularPosts: PopularPost[] = [
  { title: "Avocado & Brain Health", readTime: "4 min read", views: "2.3k", emoji: "🥑" },
  { title: "Green Tea Benefits", readTime: "6 min read", views: "1.8k", emoji: "🍵" },
  { title: "Protein Timing Guide", readTime: "8 min read", views: "1.5k", emoji: "💪" },
  { title: "Sleep & Weight Loss", readTime: "5 min read", views: "1.2k", emoji: "😴" },
];

export const getPostsByCategory = (category: string) => {
  if (category === 'all') return blogPosts;
  return blogPosts.filter(p => p.category === category);
};

export const getCategoryCounts = () => ({
  all: blogPosts.length,
  nutrition: blogPosts.filter(p => p.category === 'nutrition').length,
  fitness: blogPosts.filter(p => p.category === 'fitness').length,
  ramadan: blogPosts.filter(p => p.category === 'ramadan').length,
  wellness: blogPosts.filter(p => p.category === 'wellness').length,
  recipes: blogPosts.filter(p => p.category === 'recipes').length,
});
