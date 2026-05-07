// src/pages/Homepage.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Footer } from '@/components/layout';
import { toast } from '@/hooks/use-toast';
import {
  ScrollToTop,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Skeleton,
  Badge,
  Separator,
} from '@/components/ui';

import {
  Heart,
  MessageCircle,
  Bookmark,
  Lock,
  Rocket,
  BookOpen,
  Star,
  Camera,
  Users,
  Check,
  Info,
  Sparkles,
  Brain,
  Stethoscope,
  ClipboardList,
  TrendingUp,
  Newspaper,
  Shield,
  ArrowRight,
  X,
  AlertCircle,
} from 'lucide-react';

import { getBlogArticles } from '@/services/api/blog.api';
import { getPackages } from '@/services/api/subscriptions.api';
import { useAuth } from '@/contexts/AuthContext';
import '../styles/homepage.css';

/* ─── Image URLs ─── */
export const IMAGE_URLS = {
  pricing: '../src/assets/creamBg.jpg',
  missionBg: '../src/assets/healthyFood.jpg',
  testimonialBg: '../src/assets/testimonialBg.jpg',
  howItWorksBg: '../src/assets/howItWorksBg.jpg',
} as const;

/* ─── Types ─── */
export interface BlogPost {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  likes: number;
  comments: number;
  imageUrl?: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  featured: boolean;
  badge: string | null;
}

interface HomepageProps {
  onContactSubmit?: (payload: ContactPayload) => Promise<void>;
}

/* ─── Static fallback blog posts (shown if API fails) ─── */
const FALLBACK_BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: 'The Complete Guide to Mindful Eating',
    category: 'Wellness',
    excerpt: 'Discover how mindful eating can transform your relationship with food...',
    author: 'Dr. Amina Zouari',
    date: 'Apr 12',
    readTime: '7 min read',
    likes: 234,
    comments: 45,
    imageUrl: '/img/mindful-eating.jpg',
  },
  {
    id: 2,
    title: '10 High-Protein Breakfast Ideas',
    category: 'Recipes',
    excerpt: 'Start your day with these delicious protein-packed breakfasts...',
    author: 'Chef Karim',
    date: 'Apr 10',
    readTime: '5 min read',
    likes: 189,
    comments: 32,
    imageUrl: '/img/protein-breakfast.jpg',
  },
  {
    id: 3,
    title: 'Ramadan Fasting: Complete Nutrition Guide',
    category: 'Ramadan',
    excerpt: 'Stay energized and healthy during Ramadan with evidence-based nutrition...',
    author: 'Dr. Fatima L.',
    date: 'Apr 5',
    readTime: '8 min read',
    likes: 567,
    comments: 89,
    imageUrl: '/img/ramadan-fasting.jpg',
  },
];

/* ─── Static fallback pricing (shown if API fails) ─── */
const FALLBACK_PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Basic',
    price: '3 500 DZD',
    period: '/month',
    features: ['10 AI calorie scans per day', '1 consultation/month (Zoom/Meet)', 'Pre-built meal plans', 'Full recipe library', 'Email support'],
    cta: 'Choose Basic',
    featured: false,
    badge: null,
  },
  {
    name: 'Premium',
    price: '6 500 DZD',
    period: '/month',
    features: ['Unlimited AI scans', '2 consultations/month', 'Personalised meal plans', 'AI chatbot assistant', 'Rotating nutritionist specialists'],
    cta: 'Go Premium',
    featured: true,
    badge: 'Most Popular',
  },
  {
    name: 'Elite',
    price: '9 500 DZD',
    period: '/month',
    features: ['Everything in Premium', 'Dedicated nutritionist', 'Weekly check-ins', 'Priority support', 'Custom grocery lists'],
    cta: 'Go Elite',
    featured: false,
    badge: null,
  },
];

const floatingFoodsPositions = [
  { emoji: '🥗', top: '8%', left: '3%', fontSize: '2rem' },
  { emoji: '🥑', top: '12%', left: '15%', fontSize: '1.8rem' },
  { emoji: '🍎', top: '5%', right: '8%', fontSize: '2.5rem' },
  { emoji: '🍐', top: '18%', right: '22%', fontSize: '1.6rem' },
  { emoji: '🥦', top: '35%', left: '2%', fontSize: '2rem' },
  { emoji: '🥕', top: '42%', left: '12%', fontSize: '2rem' },
  { emoji: '🍅', top: '28%', left: '20%', fontSize: '2rem' },
  { emoji: '🥒', top: '32%', right: '5%', fontSize: '2rem' },
  { emoji: '🍓', top: '45%', right: '18%', fontSize: '2rem' },
  { emoji: '🫐', top: '38%', right: '28%', fontSize: '2rem' },
  { emoji: '🍒', bottom: '25%', left: '4%', fontSize: '2rem' },
  { emoji: '🍊', bottom: '18%', left: '18%', fontSize: '2rem' },
  { emoji: '🍌', bottom: '32%', left: '28%', fontSize: '2rem' },
  { emoji: '🥝', bottom: '15%', right: '6%', fontSize: '2rem' },
  { emoji: '🍍', bottom: '28%', right: '22%', fontSize: '2rem' },
  { emoji: '🥭', bottom: '8%', right: '35%', fontSize: '2rem' },
];

const features = [
  { icon: Brain, title: 'AI Calorie Estimation', desc: 'Simply photograph your meal and our deep learning model instantly identifies food items and estimates calorie content.', colorClass: 'bg-[hsl(var(--green-light))]' },
  { icon: Stethoscope, title: 'Online Consultations', desc: 'Book 1-on-1 video sessions with certified nutritionists worldwide.', colorClass: 'bg-[hsl(var(--saffron-light))]' },
  { icon: ClipboardList, title: 'Personalized Diet Plans', desc: 'Receive custom nutrition plans tailored to your health goals and lifestyle.', colorClass: 'bg-[hsl(var(--orange-20))]' },
  { icon: TrendingUp, title: 'Progress Tracking', desc: 'Monitor your weight, nutrition intake, and health metrics over time with intuitive dashboards.', colorClass: 'bg-[hsl(var(--green-light))]' },
  { icon: Newspaper, title: 'Premium Blog Library', desc: 'Get full access to our nutrition blog and expert articles after registration.', colorClass: 'bg-[hsl(var(--saffron-light))]' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your health data is encrypted and protected. Full GDPR compliance.', colorClass: 'bg-[hsl(var(--green-light))]' },
];

const steps = [
  { num: '01', title: 'Create Your Profile', desc: 'Register and fill in your health history, goals, and dietary preferences.' },
  { num: '02', title: 'Choose a Plan', desc: 'Select a subscription that fits your needs — standard, premium, or seasonal programs.' },
  { num: '03', title: 'Consult & Plan', desc: 'Meet with your nutritionist online and receive a personalized dietary plan within 24 hours.' },
  { num: '04', title: 'Track & Transform', desc: 'Use AI calorie tracking daily, monitor your progress, and adjust plans with expert guidance.' },
];

const testimonials = [
  { text: 'The AI calorie scanner is a game changer! I photograph my meals and instantly know the nutritional content. Lost 8kg in 3 months!', name: 'Sarah M.', role: 'Premium user · Algeria', avatar: 'S', badge: 'Lost 8kg in 3 months', badgeIcon: Star, featured: true },
  { text: 'As someone with PCOS, finding the right nutrition plan was always hard. My nutritionist on KhabirLens finally understood my condition.', name: 'Lina K.', role: 'Pro user · Tunisia', avatar: 'L', badge: 'Managing PCOS', badgeIcon: Heart, featured: false },
  { text: 'The Ramadan plan was perfectly tailored to my schedule and health goals. I felt energized the whole month. Highly recommend!', name: 'Ahmed R.', role: 'Premium user since 2024', avatar: 'A', badge: 'Best Ramadan ever', badgeIcon: Sparkles, featured: false },
];

/* ─── Component ─── */
const Homepage = ({ onContactSubmit }: HomepageProps) => {
  const navigate = useNavigate();
const { user: currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  // 'role-blog' | 'role-pricing' — to show role-restriction alert inside same modal
  const [modalReason, setModalReason] = useState<'signup' | 'role-blog' | 'role-pricing'>('signup');

  const [contactForm, setContactForm] = useState<ContactPayload>({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Blog state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);

  // Pricing state — only non-free/non-seasonal standard plans, max 3
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);

  /* ── Fetch blog posts ── */
useEffect(() => {
  getBlogArticles({})
    .then((articles) => {
      const published = articles
        .filter((a) => a.status === 'PUBLISHED')
        .slice(0, 3)
        .map((article) => ({
          id: article.id,
          title: article.title,
          category: article.category || 'General',
          excerpt: article.content.substring(0, 120) + '...',
          author: article.admin?.user.fullName || 'KhabirLens Team',
          date: new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          readTime: `${Math.max(1, Math.ceil(article.content.length / 1000))} min read`,
          likes: article.likes || 0,
          comments: article.comments?.length || 0,
          imageUrl: article.coverImage,
        }));
      setBlogPosts(published.length > 0 ? published : FALLBACK_BLOG_POSTS);
    })
    .catch(() => setBlogPosts(FALLBACK_BLOG_POSTS))
    .finally(() => setBlogLoading(false));
}, []);

/* ── Fetch pricing packages ── */
useEffect(() => {
  getPackages()
    .then((packages) => {
      const standard = packages
        .filter((pkg) => !pkg.isSeasonal && (pkg.priceMonthly ?? 0) > 0)
        .slice(0, 3)
        .map((pkg) => ({
          name: pkg.name,
          price: `${(pkg.priceMonthly ?? 0).toLocaleString('fr-DZ')} DZD`,
          period: '/month',
          features: pkg.features,
          cta: `Choose ${pkg.name}`,
          featured: pkg.highlight,
          badge: pkg.highlight ? 'Most Popular' : null,
        }));
      setPricingPlans(standard.length > 0 ? standard : FALLBACK_PRICING_PLANS);
    })
    .catch(() => setPricingPlans(FALLBACK_PRICING_PLANS))
    .finally(() => setPricingLoading(false));
}, []);

  /* ── Scroll reveal observer — re-runs when async data finishes loading ── */
  useEffect(() => {
    // Small timeout lets React flush the new DOM nodes before we observe them
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
              setTimeout(() => entry.target.classList.add('visible'), i * 80);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el) => {
        if (!el.classList.contains('visible')) observer.observe(el);
      });

      const staggerObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              staggerObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      document.querySelectorAll('.reveal-stagger').forEach((el) => {
        if (!el.classList.contains('visible')) staggerObserver.observe(el);
      });
      document.querySelectorAll('.step-reveal').forEach((el) => {
        if (!el.classList.contains('visible')) observer.observe(el);
      });

      return () => {
        observer.disconnect();
        staggerObserver.disconnect();
      };
    }, 50);

    return () => clearTimeout(timer);
    // Re-observe after blog/pricing data arrives so their cards get picked up
  }, [blogLoading, pricingLoading]);

  /* ── Contact submit ── */
  const defaultContactSubmit = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
    toast({ title: 'Message sent!', description: "We'll get back to you soon." });
  }, []);

  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await (onContactSubmit ?? defaultContactSubmit)(contactForm);
      setContactForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast({
        title: 'Something went wrong',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Smart routing helpers ── */
  /**
   * Handles "Read Blog" / blog card actions.
   * - Not logged in → sign-up modal
   * - PATIENT → navigate to patient blog page
   * - Other role → modal with role restriction notice
   */
  const handleBlogAction = () => {
    if (!currentUser) {
      setModalReason('signup');
      setShowModal(true);
      return;
    }
    if (currentUser.role === 'PATIENT') {
      navigate('/patient/blog');
      return;
    }
    // NUTRITIONIST or ADMIN
    setModalReason('role-blog');
    setShowModal(true);
  };

  /**
   * Handles pricing plan CTA clicks.
   * - Not logged in → sign-up modal
   * - PATIENT → navigate to patient subscription page
   * - Other role → modal with role restriction notice
   */
  const handlePricingAction = () => {
    if (!currentUser) {
      setModalReason('signup');
      setShowModal(true);
      return;
    }
    if (currentUser.role === 'PATIENT') {
      navigate('/patient/subscription');
      return;
    }
    setModalReason('role-pricing');
    setShowModal(true);
  };

  /* ── Modal content by reason ── */
  const modalContent = {
    signup: {
      icon: <Lock size={28} className="text-[hsl(var(--green-dark))]" />,
      iconBg: 'bg-[hsl(var(--green-light))]',
      title: 'Unlock Full Access',
      description:
        'Create a free account to read full articles, leave comments, and get personalized nutrition advice.',
      footer: (
        <>
          <div className="flex gap-3 justify-center pt-2">
            <Button asChild>
              <Link to="/auth" className="no-underline flex items-center gap-2">
                Sign Up Free <ArrowRight size={16} />
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Maybe Later
            </Button>
          </div>
          <p className="text-[0.7rem] mt-2 text-[hsl(var(--text-m))]">
            Already have an account?{' '}
            <Link to="/auth" className="text-[hsl(var(--orange))] hover:underline">
              Log in
            </Link>
          </p>
        </>
      ),
    },
    'role-blog': {
      icon: <AlertCircle size={28} className="text-[hsl(var(--orange))]" />,
      iconBg: 'bg-[hsl(var(--orange-20))]',
      title: 'Patient Area Only',
      description:
        'The blog section is available exclusively for patient accounts. Your current role doesn\'t have access to this page.',
      footer: (
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Got It
          </Button>
        </div>
      ),
    },
    'role-pricing': {
      icon: <AlertCircle size={28} className="text-[hsl(var(--orange))]" />,
      iconBg: 'bg-[hsl(var(--orange-20))]',
      title: 'Patient Area Only',
      description:
        'Subscription plans are for patient accounts. Your current role doesn\'t have access to the subscription dashboard.',
      footer: (
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Got It
          </Button>
        </div>
      ),
    },
  };

  const activeModal = modalContent[modalReason];

  return (
    <div className="warm-bg">
      <Navbar />
      <ScrollToTop />

      {/* ── Unified Dialog ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[450px] text-center">
          <DialogHeader>
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${activeModal.iconBg}`}>
              {activeModal.icon}
            </div>
            <DialogTitle className="font-syne text-2xl font-extrabold">
              {activeModal.title}
            </DialogTitle>
            <DialogDescription className="text-[hsl(var(--text-m))]">
              {activeModal.description}
            </DialogDescription>
          </DialogHeader>
          {activeModal.footer}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center text-center px-[6%] pt-32 pb-20 z-[1]"
        id="home"
      >
        {/* Floating food emojis */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {floatingFoodsPositions.map((item, i) => (
            <span
              key={i}
              className="absolute animate-floatAround"
              style={{
                ...(item.top ? { top: item.top } : { bottom: item.bottom }),
                ...(item.left ? { left: item.left } : { right: item.right }),
                fontSize: item.fontSize,
                opacity: 0.35,
                animationDelay: `${i * -1.5}s`,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.05))',
              }}
            >
              {item.emoji}
            </span>
          ))}
        </div>

        <div className="relative z-[1]">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-[hsl(var(--green-light))] border border-[hsl(var(--green))] rounded-full px-4 py-1.5 text-[0.8rem] font-medium text-[hsl(var(--green-dark))] mb-8 animate-fadeUp">
            <span className="w-[7px] h-[7px] rounded-full bg-[hsl(var(--green))] animate-pulse-custom" />
            <Brain size={14} /> AI-Powered Nutrition Platform
          </div>

          <h1 className="font-syne text-[clamp(3rem,7vw,6rem)] font-[800] leading-[1.05] tracking-[-2px] mb-6 animate-fadeUp-1">
            Eat Smart.
            <br />
            <span className="bg-gradient-to-br from-[hsl(var(--green-dark))] to-[hsl(var(--orange))] bg-clip-text text-transparent">
              Live Better.
            </span>
          </h1>

          <p className="text-lg text-[hsl(var(--text-m))] max-w-[580px] mx-auto leading-[1.7] mb-10 font-light animate-fadeUp-2">
            Personalized dietary consultations, AI-assisted calorie tracking, and expert nutritionist guidance — all in one place.
          </p>

          <div className="flex gap-4 justify-center flex-wrap animate-fadeUp-3 max-[480px]:flex-col max-[480px]:items-center">
            {currentUser ? (
              <Button asChild size="lg" className="px-8 py-3.5 text-[0.95rem]">
                <Link
                  to={
                    currentUser.role === 'PATIENT'
                      ? '/patient/dashboard'
                      : currentUser.role === 'NUTRITIONIST'
                        ? '/nutritionist/dashboard'
                        : '/admin'
                  }
                  className="no-underline flex items-center gap-2"
                >
                  <Rocket size={18} /> Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="px-8 py-3.5 text-[0.95rem]">
                <Link to="/auth" className="no-underline flex items-center gap-2">
                  <Rocket size={18} /> Start Your Journey
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-3.5 text-[0.95rem] flex items-center gap-2"
              onClick={handleBlogAction}
            >
              <BookOpen size={18} /> Read Our Blog
            </Button>
          </div>
        </div>

        {/* Decorative SVG line */}
        <div className="mt-16 flex justify-center animate-fadeUp-4">
          <svg className="w-64 h-12" viewBox="0 0 280 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 25 Q 70 12, 130 25 T 230 25"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="260"
              strokeDashoffset="260"
              style={{ animation: 'drawLine 2s ease forwards' }}
            />
            <path
              d="M23 29 Q 73 16, 133 29 T 233 29"
              stroke="url(#lineGradient2)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray="260"
              strokeDashoffset="260"
              style={{ animation: 'drawLine 2.2s ease 0.1s forwards' }}
              opacity="0.5"
            />
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c2e66e" />
                <stop offset="100%" stopColor="#ffa257" />
              </linearGradient>
              <linearGradient id="lineGradient2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e8f7c0" />
                <stop offset="100%" stopColor="#ffcb65" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      <Separator className="mx-[6%]" />

      {/* ═══════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════ */}
      <section className="relative z-[1] py-16 px-[6%] bg-[hsl(var(--pure-white))]" id="features">
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(194,230,110,0.25) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative z-[1]">
          <div className="reveal">
            <span className="text-[0.7rem] font-semibold tracking-[2px] uppercase text-[hsl(var(--green-dark))] mb-3 block">
              <Sparkles size={12} className="inline-block align-middle mr-1" /> Features
            </span>
            <h2 className="font-syne text-[clamp(1.6rem,3vw,2.2rem)] font-[800] tracking-[-0.5px] leading-[1.2] mb-2">
              Everything You Need
              <br />
              to Transform Your Health
            </h2>
            <p className="text-[hsl(var(--text-m))] text-sm max-w-[550px] leading-[1.5] font-light">
              A complete ecosystem combining AI technology and human expertise for your wellness journey.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-5 mt-10 max-lg:grid-cols-2 max-md:grid-cols-1 reveal-stagger">
            {features.map((f, i) => (
              <Card key={i} className="group">
                <CardContent className="p-5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${f.colorClass} transition-transform group-hover:scale-110 group-hover:-rotate-6 mb-3`}
                  >
                    <f.icon size={20} className="text-[hsl(var(--green-dark))]" />
                  </div>
                  <CardTitle className="text-base mb-1">{f.title}</CardTitle>
                  <CardDescription className="text-[0.8rem] leading-[1.5]">
                    {f.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-[6%]" />

      {/* ═══════════════════════════════════════
          MISSION
      ═══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: `url('${IMAGE_URLS.missionBg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        id="mission"
      >
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'linear-gradient(180deg, rgba(246,243,238,0.96) 0%, rgba(232,247,192,0.93) 100%)',
          }}
        />
        <div className="relative z-[1] py-24 px-[6%]">
          <div className="max-w-[1200px] mx-auto grid grid-cols-2 gap-20 items-center max-lg:grid-cols-1">
            {/* Visual */}
            <div className="relative reveal-left max-lg:order-[-1]">
              <Card className="p-10">
                <div className="flex gap-4 mb-7">
                  {[
                    { icon: Camera, bg: 'bg-[hsl(var(--green-light))]', clr: 'text-[hsl(var(--green-dark))]' },
                    { icon: Brain, bg: 'bg-[hsl(var(--saffron-light))]', clr: 'text-[#8a6200]' },
                    { icon: TrendingUp, bg: 'bg-[hsl(var(--orange-20))]', clr: 'text-[#c05000]' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg} transition-transform hover:scale-[1.15] hover:rotate-[-6deg]`}
                    >
                      <item.icon size={22} className={item.clr} />
                    </div>
                  ))}
                </div>
                <div className="font-syne text-[1.4rem] font-bold leading-[1.4]">
                  "Point your phone at any
                  <br />
                  <span className="text-[hsl(var(--orange))]">meal — get instant</span>
                  <br />
                  calorie insights."
                </div>
              </Card>

              <div className="absolute -top-5 right-5 bg-[hsl(var(--pure-white))] border border-[hsl(var(--gray-line))] rounded-[14px] px-5 py-3 text-[0.78rem] font-semibold shadow-[var(--sh-m)] animate-float flex items-center gap-2 max-md:hidden">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--green-dark))]" /> YOLOv8 Food Detection
              </div>
              <div className="absolute -bottom-5 left-5 bg-[hsl(var(--pure-white))] border border-[hsl(var(--gray-line))] rounded-[14px] px-5 py-3 text-[0.78rem] font-semibold shadow-[var(--sh-m)] animate-float-delay flex items-center gap-2 max-md:hidden">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--orange))]" /> Real-time Analysis
              </div>
            </div>

            {/* Text */}
            <div className="reveal-right">
              <span className="text-[0.75rem] font-semibold tracking-[2px] uppercase text-[hsl(var(--green-dark))] mb-4 block">
                <Sparkles size={12} className="inline-block align-middle mr-1" /> Why KhabirLens
              </span>
              <h2 className="font-syne text-[clamp(1.8rem,3vw,2.5rem)] font-[800] tracking-[-1px] leading-[1.15] mb-5">
                AI precision meets human expertise.
              </h2>
              <p className="text-[hsl(var(--text-m))] leading-[1.75] text-[0.95rem] mb-4">
                Stop guessing what's in your food. Our two-stage AI pipeline detects every ingredient in your meal photo and calculates precise macros in seconds — then pairs you with a certified nutritionist who understands your goals.
              </p>
              <p className="text-[hsl(var(--text-m))] leading-[1.75] text-[0.95rem] mb-6">
                No manual logging. No generic advice. Just real science, real experts, and real results tailored to you.
              </p>
              <div className="flex flex-col gap-3 mt-6">
                {[
                  { title: 'Science-first approach', desc: 'Every recommendation backed by nutritional research, not trends.' },
                  { title: 'Human + AI collaboration', desc: 'AI estimates, nutritionists validate. The best of both worlds.' },
                ].map((v, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-[22px] h-[22px] rounded-full bg-[hsl(var(--green-light))] border-[1.5px] border-[hsl(var(--green))] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={10} className="text-[hsl(var(--green-dark))]" />
                    </div>
                    <div>
                      <strong className="text-[0.9rem] block">{v.title}</strong>
                      <span className="text-[0.82rem] text-[hsl(var(--text-m))]">{v.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="mx-[6%]" />

      {/* ═══════════════════════════════════════
          BLOG PREVIEW
      ═══════════════════════════════════════ */}
      <section className="blog-section" id="blog-section">
        <div className="reveal text-center">
          <span className="section-tag">
            <Sparkles size={12} className="inline-block align-middle mr-1" /> Latest from Our Blog
          </span>
          <h3 className="section-title">Expert Articles & Tips</h3>
          <p className="section-sub mx-auto">
            Discover nutrition insights, healthy recipes, and wellness advice from our experts.
          </p>
        </div>

        <div className="home-blog-grid">
          {blogLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-[160px] w-full rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
            ))
          ) : (
            blogPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                {/* Only show lock badge when user isn't a patient */}
                {(!currentUser || currentUser.role !== 'PATIENT') && (
                  <div className="lock-overlay-badge">
                    <Lock size={10} /> {currentUser ? 'Patient access only' : 'Sign up to read'}
                  </div>
                )}
                <div className="blog-card-img">
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt={post.title} />
                  ) : (
                    <div className="styled-emoji">
                      <Newspaper size={22} className="text-[hsl(var(--green-dark))]" />
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <Badge variant="secondary" className="mb-2">
                    {post.category}
                  </Badge>
                  <h3 className="font-syne text-base font-bold mb-1">{post.title}</h3>
                  <p className="text-[0.8rem] text-[hsl(var(--text-m))] leading-[1.4] mb-3">
                    {post.excerpt.substring(0, 100)}...
                  </p>
                  <div className="blog-card-meta">
                    <span className="flex items-center gap-1">
                      <Users size={10} /> {post.author}
                    </span>
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <div className="blog-card-actions">
                    <button onClick={handleBlogAction}>
                      <Heart size={12} /> {post.likes}
                    </button>
                    <button onClick={handleBlogAction}>
                      <MessageCircle size={12} /> {post.comments}
                    </button>
                    <button onClick={handleBlogAction}>
                      <Bookmark size={12} /> Save
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Smart CTA below blog cards */}
        <div className="text-center mt-8">
          {currentUser?.role === 'PATIENT' ? (
            <Button asChild variant="default">
              <Link to="/patient/blog" className="no-underline inline-flex items-center gap-2">
                <BookOpen size={14} /> Browse All Articles <ArrowRight size={14} />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={handleBlogAction}>
              <Lock size={14} className="mr-1" />
              {currentUser
                ? 'Blog access is for patient accounts'
                : 'Sign up to read full articles and comment →'}
            </Button>
          )}
        </div>
      </section>

      <Separator className="mx-[6%]" />

      {/* ═══════════════════════════════════════
          PRICING PREVIEW (non-free standard plans)
      ═══════════════════════════════════════ */}
      <section
        id="pricing"
        className="relative z-[1] py-16 px-[6%] overflow-hidden"
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('${IMAGE_URLS.pricing}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div
          className="absolute inset-0 z-1"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(12px)',
          }}
        />

        <div className="relative z-2">
          <div className="text-center reveal">
            <span className="section-tag font-syne">
              <Sparkles size={12} className="inline-block align-middle mr-1" /> Pricing
            </span>
            <h2 className="section-title font-syne">Simple, Transparent Plans</h2>
            <p className="section-sub mx-auto">
              Choose the perfect plan for your health journey.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-5 mt-10 max-w-[1100px] mx-auto max-lg:grid-cols-2 max-md:grid-cols-1">
            {pricingLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-24 mx-auto" />
                    <Skeleton className="h-8 w-32 mx-auto" />
                    <div className="space-y-2 mt-4">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <Skeleton key={j} className="h-4 w-full" />
                      ))}
                    </div>
                    <Skeleton className="h-9 w-full mt-4" />
                  </CardContent>
                </Card>
              ))
              : pricingPlans.map((plan) => (
                <div key={plan.name} className="relative h-full">
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-[hsl(var(--green))] text-white text-[0.65rem] font-bold px-3 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                      {plan.badge}
                    </div>
                  )}
                  <Card
                    className={`h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${plan.badge ? 'pt-2' : ''
                      }`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <CardContent className="p-6 text-center flex flex-col h-full">
                      <div className="font-syne text-xl font-bold mb-1">{plan.name}</div>
                      <div className="font-syne text-2xl font-extrabold text-[hsl(var(--green-dark))]">
                        {plan.price}
                        <span className="text-sm font-normal text-[hsl(var(--text-m))] ml-1">
                          {plan.period}
                        </span>
                      </div>
                      <ul className="space-y-2 my-5 text-sm text-left flex-grow">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-[hsl(var(--text-m))]">
                            <Check size={14} className="text-[hsl(var(--green-dark))] flex-shrink-0" />
                            <span className="text-[0.8rem]">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full" variant="secondary" onClick={handlePricingAction}>
                        {plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
          </div>

          {/* Smart CTA below plans */}
          <div className="text-center mt-10">
            {currentUser?.role === 'PATIENT' ? (
              <Button asChild>
                <Link to="/patient/subscription" className="no-underline inline-flex items-center gap-2">
                  <Sparkles size={14} />
                  Manage My Subscription <ArrowRight size={14} />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link to="/auth" className="no-underline inline-flex items-center gap-2">
                  <Sparkles size={14} />
                  Register to discover more offers & seasonal programs
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <Separator className="mx-[6%]" />

      {/* ═══════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════ */}
      <section
        className="relative py-24 px-[6%] overflow-hidden"
        style={{
          backgroundImage: `url('${IMAGE_URLS.howItWorksBg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        id="how-it-works"
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(180deg, rgba(246,243,238,0.96) 0%, rgba(232,247,192,0.92) 100%)',
          }}
        />
        <div className="relative z-[1] max-w-[1200px] mx-auto">
          <div className="text-center reveal">
            <span className="text-[0.75rem] font-semibold tracking-[2px] uppercase text-[hsl(var(--green-dark))] mb-4 block">
              <Sparkles size={12} className="inline-block align-middle mr-1" /> Process
            </span>
            <h2 className="font-syne text-[clamp(2rem,4vw,3rem)] font-[800] tracking-[-1px] leading-[1.1] mb-4">
              How KhabirLens Works
            </h2>
            <p className="text-[hsl(var(--text-m))] text-base max-w-[600px] mx-auto leading-[1.7] font-light">
              From sign-up to transformation in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-8 mt-14 relative max-md:grid-cols-1 max-md:before:hidden">
            {/* Connector line */}
            <div className="absolute top-10 left-[10%] right-[10%] h-px bg-[hsl(var(--green))] opacity-40 max-md:hidden" />

            {steps.map((s, i) => (
              <div
                key={i}
                className="text-center py-8 px-4 group step-reveal"
                style={{ transitionDelay: `${i * 130}ms` }}
              >
                <div className="w-16 h-16 rounded-full bg-[hsl(var(--green-light))] border-[1.5px] border-[hsl(var(--green))] flex items-center justify-center font-syne text-xl font-[800] text-[hsl(var(--green-dark))] mx-auto mb-5 transition-all group-hover:scale-[1.12] group-hover:shadow-[0_8px_24px_rgba(194,230,110,0.5)]">
                  {s.num}
                </div>
                <div className="font-syne text-base font-bold mb-2">{s.title}</div>
                <div className="text-[0.85rem] text-[hsl(var(--text-m))] leading-relaxed">
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-[6%]" />

      {/* ═══════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden py-28 px-[6%]"
        style={{
          backgroundImage: `url('${IMAGE_URLS.testimonialBg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, rgba(28,26,23,0.84) 0%, rgba(74,122,8,0.62) 100%)',
          }}
        />
        <div
          className="absolute -top-36 -left-36 w-[480px] h-[480px] rounded-full pointer-events-none z-0 animate-float"
          style={{ background: 'radial-gradient(circle, rgba(194,230,110,0.1) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full pointer-events-none z-0 animate-float-delay"
          style={{ background: 'radial-gradient(circle, rgba(255,162,87,0.09) 0%, transparent 70%)' }}
        />

        <div className="relative z-[1] max-w-[1200px] mx-auto">
          <div className="text-center reveal">
            <span className="text-[0.75rem] font-semibold tracking-[2px] uppercase text-[hsl(var(--green))] mb-4 block">
              <Sparkles size={12} className="inline-block align-middle mr-1" /> Testimonials
            </span>
            <h2 className="font-syne text-[clamp(2rem,4vw,3rem)] font-[800] tracking-[-1px] leading-[1.1] mb-4 text-white">
              Real Results,
              <br />
              Real People
            </h2>
            <p className="text-white/70 text-base max-w-[600px] mx-auto leading-[1.7] font-light">
              Thousands of users have transformed their health with KhabirLens.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1 reveal-stagger mt-14">
            {testimonials.map((t, i) => (
              <Card
                key={i}
                className={`relative overflow-hidden group transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01] ${t.featured ? 'before:opacity-100' : 'before:opacity-0 hover:before:opacity-100'
                  }`}
                style={{
                  background: t.featured
                    ? 'rgba(194,230,110,0.08)'
                    : 'rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${t.featured ? 'rgba(194,230,110,0.3)' : 'rgba(255,255,255,0.13)'}`,
                }}
              >
                <CardContent className="p-8">
                  <Badge
                    variant="outline"
                    className="mb-3 text-[0.68rem] font-semibold text-[hsl(var(--green))] border-[hsl(var(--green))]/30 bg-[hsl(var(--green))]/10"
                  >
                    <t.badgeIcon size={10} className="mr-1" /> {t.badge}
                  </Badge>

                  <div className="text-[hsl(var(--saffron))] text-base mb-3 tracking-[3px]">
                    {[...Array(5)].map((_, si) => (
                      <span
                        key={si}
                        style={{ animation: `starPop 0.4s ease both`, animationDelay: `${si * 0.05}s` }}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <p className="text-[0.93rem] text-white/90 leading-[1.75] mb-6 italic relative pt-1">
                    <span className="font-syne text-[2.8rem] text-[rgba(194,230,110,0.28)] leading-none block mb-2">
                      "
                    </span>
                    {t.text}
                  </p>

                  <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold transition-transform group-hover:scale-[1.08] border-2 border-white/15 ${t.featured
                        ? 'bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))]'
                        : 'bg-[hsl(var(--saffron-light))] text-[#8a6200]'
                        }`}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-[0.9rem] text-white">{t.name}</div>
                      <div className="text-[hsl(var(--green))] text-[0.73rem] mt-0.5">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Separator className="mx-[6%]" />

      {/* ═══════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════ */}
      <section className="relative py-24 px-[6%] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--green-light))]/20 via-transparent to-[hsl(var(--orange-20))]/30 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[hsl(var(--green))]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[hsl(var(--orange))]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-1.5 text-sm font-semibold tracking-wide uppercase"
          >
            <Sparkles size={16} className="mr-1" /> Get Started
          </Badge>

          <h2 className="font-syne text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-[hsl(var(--green-dark))] to-[hsl(var(--orange))] bg-clip-text text-transparent">
            Ready to eat smarter?
          </h2>

          <p className="text-[hsl(var(--text-m))] text-base max-w-2xl mx-auto leading-relaxed mb-10">
            Whether you're tracking calories, managing a condition, or just building better habits —
            KhabirLens has everything you need. Sign up free and see what AI nutrition feels like.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            {currentUser ? (
              <Button asChild size="lg" className="px-8 py-3.5">
                <Link
                  to={
                    currentUser.role === 'PATIENT'
                      ? '/patient/dashboard'
                      : currentUser.role === 'NUTRITIONIST'
                        ? '/nutritionist/dashboard'
                        : '/admin'
                  }
                  className="no-underline inline-flex items-center gap-2"
                >
                  <Rocket size={18} /> Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="px-8 py-3.5">
                <Link to="/auth" className="no-underline inline-flex items-center gap-2">
                  <Rocket size={18} /> Get Started Free
                </Link>
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              className="px-8 py-3.5"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Star size={18} /> See Plans
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="px-8 py-3.5"
              asChild
            >
              <Link to="/about" className="no-underline inline-flex items-center gap-2">
                <Info size={18} /> About Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Homepage;