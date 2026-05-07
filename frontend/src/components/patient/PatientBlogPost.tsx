// src/components/patient/PatientBlogPost.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Heart, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { getBlogArticle, likeBlogArticle,addBlogComment ,getUser} from "@/services/api";
import type { BlogArticle, Comment } from "@/types/api";
import { formatShortDate } from "@/lib/date";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import {
  Button,
  Skeleton,
  Badge,
  Separator,
  Avatar,
  Textarea,
  AvatarFallback,
} from "@/components/ui";

const FAV_KEY = "kl_blog_favs";
// Build a schema that keeps safe formatting but strips all script vectors
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // Allow className on all elements (needed for prose styling)
    "*": ["className"],
    // Allow these specific table attributes
    table: ["className"],
    th: ["className", "align"],
    td: ["className", "align"],
    // Allow img src and alt but NOT onerror/onload
    img: ["src", "alt", "title", "width", "height", "className"],
  },
  // Strip these tags entirely — they are never needed in blog content
  strip: ["script", "style", "iframe", "object", "embed", "form", "input"],
};

function preprocessMarkdown(content: string): string {
  if (!content) return content;

  let result = content;

  // 1. Ensure headings (##) are isolated with double blank lines before/after
  result = result.replace(/([^\n])\n(##\s)/g, '$1\n\n$2');
  result = result.replace(/(##\s[^\n]+)\n([^\n#])/g, '$1\n\n$2');
  // Add extra blank line after heading (triple newline)
  result = result.replace(/(##\s[^\n]+)\n\n/g, '$1\n\n\n');

  // 2. Ensure every sentence end (., !, ?) followed by space and capital letter gets double newline
  result = result.replace(/([.!?])\s+(?=[A-Z0-9#])/g, '$1\n\n');

  // 3. Ensure blockquotes (>) have double blank line before
  result = result.replace(/([^\n])\n(>\s)/g, '$1\n\n$2');

  // 4. Ensure lists (-, *, or 1.) have double blank line before and after
  result = result.replace(/([^\n])\n([-*]\s|\d+\.\s)/g, '$1\n\n$2');
  result = result.replace(/([^\n])\n\n([-*]\s|\d+\.\s)/g, '$1\n\n\n$2');

  // 5. Add double blank line after a list ends (before next text that's not a list)
  result = result.replace(/(\n[-*].+\n)([^\n\-*])/g, '$1\n$2');

  // 6. Ensure tables have double blank line before and after
  result = result.replace(/([^\n])\n(\|)/g, '$1\n\n$2');
  result = result.replace(/(\|[^\n]+\n\|[^\n]+\n?)([^\n|])/g, '$1\n\n$2');

  // 7. Clean up excessive blank lines (more than 3) and ensure at least 2 between major blocks
  result = result.replace(/\n{4,}/g, '\n\n\n');

  return result;
}

export default function PatientBlogPost() {
  const currentUser = getUser<{ id: number; role: string; fullName: string }>();
const [commentText, setCommentText] = useState("");
const [submittingComment, setSubmittingComment] = useState(false);
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState<boolean>(() => {
    try {
      const favs = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]") as string[];
      return favs.includes(id);
    } catch {
      return false;
    }
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadArticle = async () => {
      setLoading(true);
      try {
        const data = await getBlogArticle(id);
        setArticle(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load article");
      } finally {
        setLoading(false);
      }
    };
    loadArticle();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (winScroll / height) * 100;
      setProgress(scrolled);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onLike = async () => {
    const next = !liked;
    setLiked(next);
    try {
      const favs = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]") as string[];
      const updated = next
        ? Array.from(new Set([...favs, String(id)]))
        : favs.filter((x) => x !== String(id));
      localStorage.setItem(FAV_KEY, JSON.stringify(updated));
    } catch { /* noop */ }
    if (next) {
      toast.success("Added to your liked articles ❤️");
      try { await likeBlogArticle(String(id)); } catch { /* ignore */ }
    }
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => toast.success("Link copied to clipboard!"));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl mb-6" />
        <Skeleton className="h-40 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
        <p className="text-muted-foreground mb-4">Blog post not found.</p>
        <Button variant="outline" onClick={() => navigate("/patient/blog")}>
          ← Back to blog
        </Button>
      </div>
    );
  }

  const catLabel = article.category?.charAt(0).toUpperCase() + article.category?.slice(1) || "General";
  const comments = article.comments ?? [];
  const commentCount = comments.length;
  const displayLikes = (article.likes ?? 0) + (liked ? 1 : 0);
  const processedContent = preprocessMarkdown(article.content);

  function simplePreprocess(content: string): string {
    if (!content) return content;

    // Ensure blank line before any line that starts with #, -, *, or digit+dot
    let result = content.replace(/([^\n])\n(?=#{1,6}\s|- |\* |\d+\. )/g, '$1\n\n');

    // Fix unclosed asterisks by assuming any * followed by a space or newline or end is intended as closing
    // This is naive but works for many cases
    result = result.replace(/\*([^*]+?)(\s|$)/g, '*$1*$2');

    return result;
  }
  return (
    <div className="relative">
      <div className="fixed top-0 left-0 z-50 h-1 bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button variant="ghost" size="sm" className="gap-1 pl-0" onClick={() => navigate("/patient/blog")}>
            <ArrowLeft className="h-4 w-4" /> Blog
          </Button>
          <span>/</span>
          <span>{catLabel}</span>
        </div>
        <div className="mb-3">
          <Badge variant="secondary">{catLabel}</Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{article.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6 pb-6 border-b">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {article.admin?.user?.fullName?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-foreground">
                {article.admin?.user?.fullName || "Admin"}
              </div>
              <div className="text-xs">Editor</div>
            </div>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>{formatShortDate(article.publishedAt || article.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{article.readMinutes || 5} min read</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer" onClick={onLike}>
            <Heart className={`h-3 w-3 ${liked ? "fill-destructive text-destructive" : ""}`} />
            <span>{displayLikes}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            <span>{commentCount}</span>
          </div>
        </div>
        {article.coverImage && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img src={article.coverImage} alt={article.title} className="w-full h-auto max-h-96 object-cover" />
          </div>
        )}
        <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none mb-8">
          <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}  // ← replaces rehypeRaw
  components={{
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
        {children}
      </td>
    ),
  }}
>
  {processedContent}
</ReactMarkdown>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          <Badge variant="outline">#{article.category || "general"}</Badge>
          <Badge variant="outline">#health</Badge>
          <Badge variant="outline">#wellness</Badge>
        </div>
        <div className="border-t pt-6 mb-8">
  <h3 className="text-lg font-semibold mb-4">Comments ({commentCount})</h3>

  {/* Comment form – only for authenticated patients */}
  {currentUser?.role === "PATIENT" ? (
    <div className="mb-6">
      <Textarea
        placeholder="Share your thoughts..."
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        rows={3}
        className="mb-2"
      />
      <Button
        onClick={async () => {
          if (!commentText.trim()) {
            toast.error("Please write a comment");
            return;
          }
          setSubmittingComment(true);
          try {
            const newComment = await addBlogComment(id, commentText);
            // Prepend new comment to the list
            setArticle((prev) =>
  prev
    ? {
        ...prev,
        comments: [newComment, ...(prev.comments || [])],
      }
    : prev
);
            setCommentText("");
            toast.success("Comment added");
          } catch (err) {
            toast.error("Failed to add comment");
          } finally {
            setSubmittingComment(false);
          }
        }}
        disabled={submittingComment}
      >
        {submittingComment ? "Posting..." : "Post Comment"}
      </Button>
    </div>
  ) : currentUser ? (
    <p className="text-sm text-muted-foreground mb-4">
      Only patients can leave comments.
    </p>
  ) : (
    <p className="text-sm text-muted-foreground mb-4">
      <Button variant="link" className="p-0" onClick={() => navigate("/auth")}>
        Sign in
      </Button>{" "}
      as a patient to join the discussion.
    </p>
  )}

  {/* Existing comments list */}
  {commentCount === 0 ? (
    <p className="text-muted-foreground text-sm">No comments yet. Be the first to share your thoughts!</p>
  ) : (
    <div className="space-y-4">
      {comments.map((comment: Comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary">
              {comment.patient?.user?.fullName?.[0]?.toUpperCase() || "P"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {comment.patient?.user?.fullName || "Patient"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatShortDate(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm mt-1">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
          <Button variant="outline" onClick={() => navigate("/patient/blog")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> All Articles
          </Button>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={onLike} className={liked ? "text-destructive" : ""}>
              <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-destructive" : ""}`} />
              {displayLikes}
            </Button>
            <Button variant="outline" onClick={() => toast.info("💬 Comment form coming soon!")}>
              <MessageCircle className="mr-2 h-4 w-4" /> {commentCount}
            </Button>
            <Button variant="outline" onClick={copyLink}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button onClick={() => navigate("/patient/consultations")}>Book Consultation</Button>
          </div>
        </div>
      </div>
    </div>
  );
}