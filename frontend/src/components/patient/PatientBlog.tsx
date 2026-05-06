import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Apple, Dumbbell, Heart, Leaf, Moon, RefreshCw, Search, Utensils, Newspaper, Tag, TrendingUp, FolderOpen } from "lucide-react";
import { getBlogArticles } from "@/services/api";
import { formatShortDate } from "@/lib/date";
import { apiCache } from "@/lib/apiCache";
import type { BlogArticle } from "@/types/api";

import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Skeleton,
} from "@/components/ui";

const BLOG_CATEGORIES = [
  { value: "all", label: "All", icon: FolderOpen },
  { value: "nutrition", label: "Nutrition", icon: Apple },
  { value: "recipes", label: "Recipes", icon: Utensils },
  { value: "wellness", label: "Wellness", icon: Leaf },
  { value: "fitness", label: "Fitness", icon: Dumbbell },
  { value: "ramadan", label: "Ramadan", icon: Moon },
];

const BLOG_CACHE_KEY = "blog:all";
const BLOG_TTL = 5 * 60_000;
const FAV_KEY = "kl_blog_favs";

const loadFavs = (): string[] => {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]") as string[]; } catch { return []; }
};

function CategoryIcon({ category, size = 32 }: { category: string; size?: number }) {
  const cls = "text-primary";
  switch (category) {
    case "nutrition": return <Apple size={size} className={cls} />;
    case "fitness": return <Dumbbell size={size} className={cls} />;
    case "ramadan": return <Moon size={size} className={cls} />;
    case "wellness": return <Leaf size={size} className={cls} />;
    case "recipes": return <Utensils size={size} className={cls} />;
    default: return <Utensils size={size} className={cls} />;
  }
}

export default function PatientBlog() {
  const navigate = useNavigate();
  const location = useLocation();
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [favs, setFavs] = useState<string[]>(() => loadFavs());

  const [allArticles, setAllArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchCount = useRef(0);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    const id = ++fetchCount.current;
    try {
      const articles = await getBlogArticles({});
      const articlesArray = Array.isArray(articles) ? articles : [];
      if (fetchCount.current !== id) return;
      setAllArticles(articlesArray);
      apiCache.set(BLOG_CACHE_KEY, articlesArray, BLOG_TTL);
    } catch (err) {
      if (fetchCount.current !== id) return;
      setError((err as Error).message || "Failed to load articles");
    } finally {
      if (fetchCount.current === id) setLoading(false);
    }
  };

  useEffect(() => {
    const cached = apiCache.get<BlogArticle[]>(BLOG_CACHE_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setAllArticles(cached);
      setLoading(false);
    }
    const id = ++fetchCount.current;
    getBlogArticles({})
      .then(articles => {
        const articlesArray = Array.isArray(articles) ? articles : [];
        if (fetchCount.current !== id) return;
        setAllArticles(articlesArray);
        apiCache.set(BLOG_CACHE_KEY, articlesArray, BLOG_TTL);
        setError(null);
      })
      .catch(err => {
        if (fetchCount.current !== id) return;
        if (!cached) setError(err.message || "Failed to load articles");
      })
      .finally(() => {
        if (fetchCount.current === id) setLoading(false);
      });
  }, [location.key]);

  useEffect(() => { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); }, [favs]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    let items = Array.isArray(allArticles) ? allArticles : [];
    if (category !== "all") items = items.filter((p) => p.category === category);
    if (debouncedQ.trim()) {
      const term = debouncedQ.trim().toLowerCase();
      items = items.filter(
        (p) => p.title.toLowerCase().includes(term) || p.content?.toLowerCase().includes(term)
      );
    }
    return items;
  }, [allArticles, category, debouncedQ]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    const articles = Array.isArray(allArticles) ? allArticles : [];
    counts.all = articles.length;
    articles.forEach((p) => {
      const cat = p.category || "uncategorized";
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return counts;
  }, [allArticles]);

  const popular = useMemo(() => {
    const articles = Array.isArray(allArticles) ? allArticles : [];
    return [...articles].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)).slice(0, 4);
  }, [allArticles]);

  const tags = ["nutrition", "weightloss", "ramadan", "protein", "healthyrecipes", "wellness", "fitness", "hydration"];
  const goPost = (id: number) => navigate(`/patient/blog/${id}`);

  // Loading skeleton (grid style, matching RecipeLibrary)
  if (loading && allArticles.length === 0) {
    return (
      <div className="w-full px-4 py-6">
        <Skeleton className="h-10 w-64 mb-4 mx-auto" />
        <Skeleton className="h-6 w-96 mb-8 mx-auto" />
        <div className="flex flex-wrap gap-2 mb-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-28 shrink-0" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
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

  if (error && allArticles.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="mb-3"><Newspaper size={48} className="mx-auto text-muted-foreground" /></div>
        <h3 className="text-xl font-semibold mb-1">Couldn't load articles</h3>
        <p className="text-base text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchArticles} size="lg">
          <RefreshCw className="mr-2 h-5 w-5" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-3 py-4 md:px-6 md:py-6 ">

        {/* Header */}
        <div className="mb-4 md:mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Newspaper size={28} className="text-primary" />
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight font-syne">
              Nutrition &amp; Wellness Blog
            </h1>
          </div>
          <p className="text-xs sm:text-base md:text-lg text-muted-foreground mt-1">
            Expert advice &amp; healthy recipes curated by our nutritionists
          </p>
        </div>

        {/* Search — mobile only */}
        <div className="relative mb-3 lg:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Category filters — unified pill style with Lucide icons */}
        <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
          {BLOG_CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200
                  ${category === c.value
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background text-foreground border-border hover:bg-muted hover:-translate-y-0.5"
                  }`}
              >
                <Icon size={16} />
                <span>{c.label}</span>
                {categoryCounts[c.value] != null && (
                  <span className={`rounded-full px-2 py-0 text-xs font-semibold ml-1
                    ${category === c.value ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {categoryCounts[c.value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Articles column */}
          <div className="flex-1 min-w-0 space-y-4 md:space-y-6">
            {filtered.length === 0 && !loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mb-3"><Search size={48} className="mx-auto text-muted-foreground" /></div>
                  <h3 className="text-lg font-semibold mb-1">No articles found</h3>
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
              <>
                {/* Featured card */}
                {featured && (
                  <Card className="overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex flex-col sm:flex-row gap-0 sm:gap-5 sm:p-5 md:gap-6 md:p-6">
                      <div className="w-full sm:w-40 sm:shrink-0 md:w-48">
                        <div className="w-full h-44 sm:h-36 sm:w-40 md:h-44 md:w-48 sm:rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
                          {featured.coverImage ? (
                            <img src={featured.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <CategoryIcon category={featured.category || "nutrition"} size={64} />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 p-4 sm:p-0">
                        <Badge variant="secondary" className="mb-2 px-2 py-0.5 text-xs sm:text-sm inline-flex items-center gap-1">
                          <TrendingUp size={12} /> Featured
                        </Badge>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 leading-snug font-syne">
                          {featured.title}
                        </h2>
                        <div className="flex flex-wrap gap-1.5 text-xs sm:text-sm text-muted-foreground mb-3">
                          <span>By Admin</span>
                          <span>•</span>
                          <span>{formatShortDate(featured.publishedAt || featured.createdAt)}</span>
                          <span>•</span>
                          <span>5 min read</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-4">
                          {featured.content?.substring(0, 160)}...
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goPost(featured.id)}
                          className="w-full sm:w-auto"
                        >
                          Read Article <span className="ml-1">&rarr;</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Article list — unified grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map((post) => (
                    <Card
                      key={post.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden active:opacity-80 h-full group"
                      onClick={() => goPost(post.id)}
                    >
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                        {post.coverImage ? (
                          <img src={post.coverImage} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <CategoryIcon category={post.category || "nutrition"} size={48} />
                          </div>
                        )}
                        <div className="absolute right-3 top-3 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                          <Heart size={12} className={favs.includes(String(post.id)) ? "fill-destructive text-destructive" : ""} />
                          {post.likes ?? 0}
                        </div>
                      </div>
                      <div className="p-4">
                        <Badge variant="outline" className="mb-2 text-xs inline-flex items-center gap-1">
                          <CategoryIcon category={post.category || "nutrition"} size={12} />
                          {post.category || "General"}
                        </Badge>
                        <h3 className="font-bold text-base line-clamp-2 leading-snug mb-2 font-syne">
                          {post.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Admin</span>
                          <span>{formatShortDate(post.publishedAt || post.createdAt)}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
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
                    placeholder="Search articles..."
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
                  {BLOG_CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    return (
                      <li
                        key={c.value}
                        onClick={() => setCategory(c.value)}
                        className="flex justify-between items-center cursor-pointer hover:text-primary transition-colors py-1"
                      >
                        <span className="flex items-center gap-2">
                          <Icon size={16} className="text-muted-foreground" />
                          <span>{c.label}</span>
                        </span>
                        <Badge variant="secondary">{categoryCounts[c.value] ?? 0}</Badge>
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
                  <p className="text-base text-muted-foreground">No articles yet.</p>
                ) : (
                  <div className="space-y-4">
                    {popular.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => goPost(p.id)}
                        className="flex gap-4 cursor-pointer group items-start"
                      >
                        <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center overflow-hidden">
                          {p.coverImage ? (
                            <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <CategoryIcon category={p.category || "nutrition"} size={28} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {p.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Heart size={12} /> {p.likes ?? 0}
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
                  <Tag size={20} className="text-primary" /> Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary text-sm py-1.5 px-3"
                      onClick={() => setQ(t)}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Popular tags strip — mobile only */}
          <div className="lg:hidden">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-base font-syne flex items-center gap-2">
                  <Tag size={16} className="text-primary" /> Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary text-xs py-1 px-2"
                      onClick={() => setQ(t)}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}