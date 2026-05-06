// src/pages/Homepage.tsx

import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {Navbar , Footer} from '@/components/layout';
import { toast } from '@/hooks/use-toast';
import {ScrollToTop, Button } from '@/components/ui';

import { Heart, MessageCircle, Bookmark, Lock, Rocket, BookOpen, Star, Camera, Users, Check, Info, Sparkles } from 'lucide-react';
import '../styles/homepage.css';


export const IMAGE_URLS = {
  pricing: '../src/assets/creamBg.jpg',
  missionBg: '../src/assets/healthyFood.jpg',
  testimonialBg: '../src/assets/testimonialBg.jpg',
  howItWorksBg: '../src/assets/howItWorksBg.jpg',
} as const;

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
  blogPosts?: BlogPost[];
  blogLoading?: boolean;
  onContactSubmit?: (payload: ContactPayload) => Promise<void>;
}

const DEFAULT_BLOG_POSTS: BlogPost[] = [
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

const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Starter',
    price: '0 DZD',
    period: '/forever',
    features: ['2 AI calorie scans per day', 'Pre‑built sample meals', 'Food diary & tracking', 'Basic blog access'],
    cta: 'Start Free',
    featured: false,
    badge: null,
  },
  {
    name: 'Basic',
    price: '3 500 DZD',
    period: '/month',
    features: ['10 AI calorie scans per day', '1 consultation/month (Zoom/Meet)', 'Pre‑built meal plans', 'Full recipe library', 'Email support'],
    cta: 'Choose Basic',
    featured: false,
    badge: null,
  },
  {
    name: 'Premium',
    price: '6 500 DZD',
    period: '/month',
    features: ['Unlimited AI scans', '2 consultations/month', 'Personalised meal plans', 'AI chatbot assistant', 'Rotating nutritionist specialists'],
    cta: 'Go Premium',
    featured: true,
    badge: 'Most Popular',
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
  { icon: 'fa-robot', title: 'AI Calorie Estimation', desc: 'Simply photograph your meal and our deep learning model instantly identifies food items and estimates calorie content.', colorClass: 'bg-kl-green-light' },
  { icon: 'fa-stethoscope', title: 'Online Consultations', desc: 'Book 1-on-1 video sessions with certified nutritionists worldwide.', colorClass: 'bg-kl-saffron-light/30' },
  { icon: 'fa-list-check', title: 'Personalized Diet Plans', desc: 'Receive custom nutrition plans tailored to your health goals and lifestyle.', colorClass: 'bg-kl-orange-20/50' },
  { icon: 'fa-chart-line', title: 'Progress Tracking', desc: 'Monitor your weight, nutrition intake, and health metrics over time with intuitive dashboards.', colorClass: 'bg-kl-green-light' },
  { icon: 'fa-newspaper', title: 'Premium Blog Library', desc: 'Get full access to our nutrition blog and expert articles after registration.', colorClass: 'bg-kl-saffron-light/30' },
  { icon: 'fa-lock', title: 'Secure & Private', desc: 'Your health data is encrypted and protected. Full GDPR compliance.', colorClass: 'bg-kl-green-light' },
];

const steps = [
  { num: '01', title: 'Create Your Profile', desc: 'Register and fill in your health history, goals, and dietary preferences.' },
  { num: '02', title: 'Choose a Plan', desc: 'Select a subscription that fits your needs — standard, premium, or seasonal programs.' },
  { num: '03', title: 'Consult & Plan', desc: 'Meet with your nutritionist online and receive a personalized dietary plan within 24 hours.' },
  { num: '04', title: 'Track & Transform', desc: 'Use AI calorie tracking daily, monitor your progress, and adjust plans with expert guidance.' },
];

const testimonials = [
  { text: 'The AI calorie scanner is a game changer! I photograph my meals and instantly know the nutritional content. Lost 8kg in 3 months!', name: 'Sarah M.', role: 'Premium user · Algeria', avatar: 'S', badge: 'Lost 8kg in 3 months', badgeIcon: 'fa-trophy', bgClass: '', featured: true },
  { text: 'As someone with PCOS, finding the right nutrition plan was always hard. My nutritionist on KhabirLens finally understood my condition.', name: 'Lina K.', role: 'Pro user · Tunisia', avatar: 'L', badge: 'Managing PCOS', badgeIcon: 'fa-heart', bgClass: 'bg-kl-saffron-light text-[#c47f00]', featured: false },
  { text: 'The Ramadan plan was perfectly tailored to my schedule and health goals. I felt energized the whole month. Highly recommend!', name: 'Ahmed R.', role: 'Premium user since 2024', avatar: 'A', badge: 'Best Ramadan ever', badgeIcon: 'fa-moon', bgClass: 'bg-kl-orange-20 text-[#c05a20]', featured: false },
];

const Homepage = ({
  blogPosts = DEFAULT_BLOG_POSTS,
  blogLoading = false,
  onContactSubmit,
}: HomepageProps) => {
  const [showModal, setShowModal] = useState(false);
  const [contactForm, setContactForm] = useState<ContactPayload>({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Scroll reveal observer
  useEffect(() => {
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
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el) => observer.observe(el));

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
    document.querySelectorAll('.reveal-stagger').forEach((el) => staggerObserver.observe(el));

    const stepsContainer = document.querySelector('.steps-container');
    if (stepsContainer) {
      const stepObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              stepObs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      stepObs.observe(stepsContainer);
    }

    document.querySelectorAll('.step').forEach((el, idx) => {
      (el as HTMLElement).style.transitionDelay = `${idx * 130}ms`;
      const stepCardObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('visible');
              stepCardObs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      stepCardObs.observe(el);
    });

    // Also observe step-reveal elements (for the How It Works grid)
    document.querySelectorAll('.step-reveal').forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      staggerObserver.disconnect();
    };
  }, []);

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

  return (
    <div className="warm-bg">
      <Navbar />
      <ScrollToTop />

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-kl-white rounded-[28px] max-w-[450px] w-[90%] p-8 text-center animate-fadeUp relative" onClick={e => e.stopPropagation()}>
            <Button  className="absolute top-4 right-4 text-xl cursor-pointer text-kl-text-m hover:text-kl-orange bg-transparent border-none" onClick={() => setShowModal(false)}>×</Button >
            <div className="styled-emoji mx-auto mb-4" style={{ width: 70, height: 70 }}>
              <Lock size={28} className="text-[hsl(var(--green-dark))]" />
            </div>
            <h3 className="font-syne text-2xl font-[800] mb-2">Unlock Full Access</h3>
            <p className="text-kl-text-m mb-6">Create a free account to read full articles, leave comments, and get personalized nutrition advice.</p>
            <div className="flex gap-4 justify-center">
              <Link to="/auth" className="kl-btn kl-btn-orange px-6 py-3 no-underline flex items-center gap-2">Sign Up Free →</Link>
              <button className="kl-btn kl-btn-ghost" onClick={() => setShowModal(false)}>Maybe Later</button>
            </div>
            <p className="text-[0.7rem] mt-4 text-kl-text-m">
              Already have an account? <Link to="/auth" className="text-kl-orange">Log in</Link>
            </p>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center text-center px-[6%] pt-32 pb-20 z-[1] " id="home">
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {floatingFoodsPositions.map((item, i) => (
            <span key={i} className="absolute animate-floatAround" style={{
              ...(item.top ? { top: item.top } : { bottom: item.bottom }),
              ...(item.left ? { left: item.left } : { right: item.right }),
              fontSize: item.fontSize, opacity: 0.35, animationDelay: `${i * -1.5}s`,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.05))',
            }}>{item.emoji}</span>
          ))}
        </div>
        <div className="relative z-[1]">
          <div className="inline-flex items-center gap-2 bg-kl-green-light border border-kl-green rounded-[50px] px-4 py-1.5 text-[0.8rem] font-medium text-kl-green-dark mb-8 animate-fadeUp">
            <span className="w-[7px] h-[7px] rounded-full bg-kl-green animate-pulse-custom" />
            <i className="fas fa-robot" /> AI-Powered Nutrition Platform
          </div>
          <h1 className="font-syne text-[clamp(3rem,7vw,6rem)] font-[800] leading-[1.05] tracking-[-2px] mb-6 animate-fadeUp-1">
            Eat Smart.<br /><span className="bg-gradient-to-br from-kl-green-dark to-kl-orange bg-clip-text text-transparent">Live Better.</span>
          </h1>
          <p className="text-lg text-kl-text-m max-w-[580px] mx-auto leading-[1.7] mb-10 font-light animate-fadeUp-2">
            Personalized dietary consultations, AI-assisted calorie tracking, and expert nutritionist guidance — all in one place.
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-fadeUp-3 max-[480px]:flex-col max-[480px]:items-center">
            <Link to="/auth" className="kl-btn kl-btn-orange px-8 py-3.5 text-[0.95rem] no-underline flex items-center gap-2 active:scale-[0.98] transition-transform">
              <Rocket size={18} /> Start Your Journey
            </Link>
            <button className="kl-btn kl-btn-ghost px-8 py-3.5 text-[0.95rem] flex items-center gap-2 active:scale-[0.98] transition-transform" onClick={() => setShowModal(true)}>
              <BookOpen size={18} /> Read Our Blog
            </button>
          </div>
        </div>
        <div className="mt-16 flex justify-center animate-fadeUp-4">
          <svg className="w-64 h-12" viewBox="0 0 280 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 25 Q 70 12, 130 25 T 230 25" stroke="url(#lineGradient)" strokeWidth="2" strokeLinecap="round" strokeDasharray="260" strokeDashoffset="260" style={{ animation: 'drawLine 2s ease forwards' }} />
            <path d="M23 29 Q 73 16, 133 29 T 233 29" stroke="url(#lineGradient2)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="260" strokeDashoffset="260" style={{ animation: 'drawLine 2.2s ease 0.1s forwards' }} opacity="0.5" />
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c2e66e" /><stop offset="100%" stopColor="#ffa257" />
              </linearGradient>
              <linearGradient id="lineGradient2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e8f7c0" /><stop offset="100%" stopColor="#ffcb65" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      <div className="h-px bg-kl-gray-line mx-[6%]" />

      {/* FEATURES  */}
      <section className="relative z-[1] py-16 px-[6%] bg-kl-white" id="features"> {/* was py-24 */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(194,230,110,0.25) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative z-[1]">
          <div className="reveal">
            <span className="text-[0.7rem] font-semibold tracking-[2px] uppercase text-kl-green-dark mb-3 block">
              <Sparkles size={12} className="inline-block align-middle mr-1" /> Features
            </span>
            <h2 className="font-syne text-[clamp(1.6rem,3vw,2.2rem)] font-[800] tracking-[-0.5px] leading-[1.2] mb-2">Everything You Need<br />to Transform Your Health</h2>
            <p className="text-kl-text-m text-sm max-w-[550px] leading-[1.5] font-light">A complete ecosystem combining AI technology and human expertise for your wellness journey.</p>
          </div>
          <div className="grid grid-cols-3 gap-5 mt-10 max-lg:grid-cols-2 max-md:grid-cols-1 reveal-stagger"> {/* reduced gap and margin */}
            {features.map((f, i) => (
              <div key={i} className="bg-kl-white border border-kl-gray-line rounded-[18px] p-5 transition-all duration-&lsqb;350ms&rsqb; relative overflow-hidden shadow-kl-card hover:-translate-y-2 hover:scale-[1.01] hover:border-kl-green hover:shadow-kl-hover before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-kl-green before:to-kl-orange before:opacity-0 hover:before:opacity-100 before:transition-opacity group">
                <div className={`w-[44px] h-[44px] rounded-[12px] flex items-center justify-center flex-shrink-0 ${f.colorClass} transition-transform group-hover:scale-110 group-hover:rotate-[-5deg] mb-3`}>
                  <i className={`fas ${f.icon} text-lg text-kl-green-dark`} />
                </div>
                <div className="font-syne text-[1rem] font-bold mb-1">{f.title}</div>
                <div className="text-[0.8rem] text-kl-text-m leading-[1.5]">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-kl-gray-line mx-[6%]" />

      {/* MISSION */}
      <div className="relative overflow-hidden" style={{ backgroundImage: `url('${IMAGE_URLS.missionBg}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} id="mission">
        <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'linear-gradient(180deg, rgba(246,243,238,0.96) 0%, rgba(232,247,192,0.93) 100%)' }} />
        <div className="relative z-[1] py-24 px-[6%]">
          <div className="max-w-[1200px] mx-auto grid grid-cols-2 gap-20 items-center max-lg:grid-cols-1">
            <div className="relative reveal-left max-lg:order-[-1]">
              <div className="bg-white/85 backdrop-blur-[4px] border border-kl-gray-line rounded-[28px] p-10">
                <div className="flex gap-4 mb-7">
                  {[{ icon: 'fa-camera', bg: 'bg-kl-green-light', clr: 'text-kl-green-dark' }, { icon: 'fa-brain', bg: 'bg-kl-saffron-light', clr: 'text-[#8a6200]' }, { icon: 'fa-chart-pie', bg: 'bg-[#ffe8d5]', clr: 'text-[#c05000]' }].map((item, i) => (
                    <div key={i} className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg} transition-transform hover:scale-[1.15] hover:rotate-[-6deg]`}>
                      <i className={`fas ${item.icon} text-xl ${item.clr}`} />
                    </div>
                  ))}
                </div>
                <div className="font-syne text-[1.4rem] font-bold leading-[1.4]">
                  "Point your phone at any<br /><span className="text-kl-orange">meal — get instant</span><br />calorie insights."
                </div>
              </div>
              <div className="absolute -top-5 right-5 bg-kl-white border border-kl-gray-line rounded-[14px] px-5 py-3 text-[0.78rem] font-semibold shadow-kl-m animate-float flex items-center gap-2 max-md:hidden">
                <span className="w-2 h-2 rounded-full bg-kl-green-dark" /> YOLOv8 Food Detection
              </div>
              <div className="absolute -bottom-5 left-5 bg-kl-white border border-kl-gray-line rounded-[14px] px-5 py-3 text-[0.78rem] font-semibold shadow-kl-m animate-float-delay flex items-center gap-2 max-md:hidden">
                <span className="w-2 h-2 rounded-full bg-kl-orange" /> Real-time Analysis
              </div>
            </div>
            <div className="reveal-right">
              <span className="text-[0.75rem] font-semibold tracking-[2px] uppercase text-kl-green-dark mb-4 block">
                <Sparkles size={12} className="inline-block align-middle mr-1" /> Why KhabirLens
              </span>
              <h2 className="font-syne text-[clamp(1.8rem,3vw,2.5rem)] font-[800] tracking-[-1px] leading-[1.15] mb-5">AI precision meets human expertise.</h2>
              <p className="text-kl-text-m leading-[1.75] text-[0.95rem] mb-4">Stop guessing what's in your food. Our two-stage AI pipeline detects every ingredient in your meal photo and calculates precise macros in seconds — then pairs you with a certified nutritionist who understands your goals.</p>
              <p className="text-kl-text-m leading-[1.75] text-[0.95rem] mb-6">No manual logging. No generic advice. Just real science, real experts, and real results tailored to you.</p>
              <div className="flex flex-col gap-3 mt-6">
                {[
                  { title: 'Science-first approach', desc: 'Every recommendation backed by nutritional research, not trends.' },
                  { title: 'Human + AI collaboration', desc: 'AI estimates, nutritionists validate. The best of both worlds.' },
                ].map((v, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-[22px] h-[22px] rounded-full bg-kl-green-light border-[1.5px] border-kl-green flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={10} className="text-kl-green-dark" />
                    </div>
                    <div>
                      <strong className="text-[0.9rem] block">{v.title}</strong>
                      <span className="text-[0.82rem] text-kl-text-m">{v.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-kl-gray-line mx-[6%]" />

      {/* BLOG PREVIEW */}
      <section className="blog-section" id="blog-section">
        <div className="reveal text-center">
          <span className="section-tag">
            <Sparkles size={12} className="inline-block align-middle mr-1" /> Latest from Our Blog
          </span>
          <h3 className="section-title">Expert Articles & Tips</h3>
          <p className="section-sub mx-auto">Discover nutrition insights, healthy recipes, and wellness advice from our experts.</p>
        </div>
        <div className="home-blog-grid">
          {blogLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="blog-card" style={{ opacity: 0.6 }}>
                <div className="blog-card-img" style={{ background: 'var(--gray-bg)' }}></div>
                <div className="blog-card-content"><div className="blog-card-title">Loading...</div></div>
              </div>
            ))
          ) : (
            blogPosts.map((post) => (
              <div key={post.id} className="blog-card reveal">
                <div className="lock-overlay-badge"><i className="fas fa-lock"></i> Sign up to read</div>
                <div className="blog-card-img">
                  {post.imageUrl ? <img src={post.imageUrl} alt={post.title} /> : <div className="styled-emoji"><i className="fas fa-newspaper"></i></div>}
                </div>
                <div className="blog-card-content">
                  <span className="blog-card-tag">{post.category}</span>
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-excerpt">{post.excerpt.substring(0, 100)}...</p>
                  <div className="blog-card-meta">
                    <span><i className="fas fa-user"></i> {post.author}</span>
                    <span><i className="fas fa-calendar"></i> {post.date}</span>
                    <span><i className="fas fa-clock"></i> {post.readTime}</span>
                  </div>
                  <div className="blog-card-actions">
                    <button onClick={() => setShowModal(true)}><i className="far fa-heart"></i> {post.likes}</button>
                    <button onClick={() => setShowModal(true)}><i className="far fa-comment"></i> {post.comments}</button>
                    <button onClick={() => setShowModal(true)}><i className="far fa-bookmark"></i> Save</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="text-center mt-8">
          <button className="btn-outline" onClick={() => setShowModal(true)}><i className="fas fa-lock"></i> Sign up to read full articles and comment →</button>
        </div>
      </section>

      <div className="h-px bg-kl-gray-line mx-[6%]" />

      {/* HOW IT WORKS */}
      <section className="relative py-24 px-[6%] overflow-hidden" style={{ backgroundImage: `url('${IMAGE_URLS.howItWorksBg}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} id="how-it-works">
        <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(180deg, rgba(246,243,238,0.96) 0%, rgba(232,247,192,0.92) 100%)' }} />
        <div className="relative z-[1] max-w-[1200px] mx-auto">
          <div className="text-center reveal">
            <span className="text-[0.75rem] font-semibold tracking-[2px] uppercase text-kl-green-dark mb-4 block">
              <Sparkles size={12} className="inline-block align-middle mr-1" /> Process
            </span>
            <h2 className="font-syne text-[clamp(2rem,4vw,3rem)] font-[800] tracking-[-1px] leading-[1.1] mb-4">How KhabirLens Works</h2>
            <p className="text-kl-text-m text-base max-w-[600px] mx-auto leading-[1.7] font-light">From sign-up to transformation in four simple steps.</p>
          </div>
          <div className="grid grid-cols-4 gap-8 mt-14 relative max-md:grid-cols-1 before:content-[''] before:absolute before:top-10 before:left-[10%] before:right-[10%] before:h-px before:bg-kl-green before:opacity-40 max-md:before:hidden">
            {steps.map((s, i) => (
              <div key={i} className="text-center py-8 px-4 group step-reveal opacity-0 translate-y-8 transition-all duration-&lsqb;600ms&rsqb;" style={{ transitionDelay: `${i * 130}ms` }}>
                <div className="w-16 h-16 rounded-full bg-kl-green-light border-[1.5px] border-kl-green flex items-center justify-center font-syne text-xl font-[800] text-kl-green-dark mx-auto mb-5 transition-all group-hover:scale-[1.12] group-hover:shadow-[0_8px_24px_rgba(194,230,110,0.5)]">
                  {s.num}
                </div>
                <div className="font-syne text-base font-bold mb-2">{s.title}</div>
                <div className="text-[0.85rem] text-kl-text-m leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-kl-gray-line mx-[6%]" />

      {/* TESTIMONIALS */}
      <div className="relative overflow-hidden py-28 px-[6%]" style={{ backgroundImage: `url('${IMAGE_URLS.testimonialBg}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, rgba(28,26,23,0.84) 0%, rgba(74,122,8,0.62) 100%)' }} />
        <div className="absolute -top-36 -left-36 w-[480px] h-[480px] rounded-full pointer-events-none z-0 animate-float" style={{ background: 'radial-gradient(circle, rgba(194,230,110,0.1) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full pointer-events-none z-0 animate-float-delay" style={{ background: 'radial-gradient(circle, rgba(255,162,87,0.09) 0%, transparent 70%)' }} />
        <div className="relative z-[1] max-w-[1200px] mx-auto">
          <div className="text-center reveal">
            <span className="text-[0.75rem] font-semibold tracking-[2px] uppercase text-kl-green mb-4 block">
              <Sparkles size={12} className="inline-block align-middle mr-1" /> Testimonials
            </span>
            <h2 className="font-syne text-[clamp(2rem,4vw,3rem)] font-[800] tracking-[-1px] leading-[1.1] mb-4 text-white">Real Results,<br />Real People</h2>
            <p className="text-white/70 text-base max-w-[600px] mx-auto leading-[1.7] font-light">Thousands of users have transformed their health with KhabirLens.</p>
          </div>
          <div className="mt-14"></div>
          <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1 reveal-stagger">
            {testimonials.map((t, i) => (
              <div key={i} className={`rounded-[22px] p-8 transition-all duration-&lsqb;320ms&rsqb; relative overflow-hidden group hover:-translate-y-2 hover:scale-[1.01] before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-kl-green before:to-kl-orange before:transition-opacity ${t.featured ? 'before:opacity-100 border-[rgba(194,230,110,0.3)]' : 'before:opacity-0 hover:before:opacity-100 border-[rgba(255,255,255,0.13)]'}`} style={{ background: t.featured ? 'rgba(194,230,110,0.08)' : 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: `1px solid ${t.featured ? 'rgba(194,230,110,0.3)' : 'rgba(255,255,255,0.13)'}` }}>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[50px] text-[0.68rem] font-semibold text-kl-green mb-3" style={{ background: 'rgba(194,230,110,0.14)', border: '1px solid rgba(194,230,110,0.28)' }}>
                  <i className={`fas ${t.badgeIcon}`} /> {t.badge}
                </div>
                <div className="text-kl-saffron text-base mb-3 tracking-[3px]">{[...Array(5)].map((_, si) => <span key={si} style={{ animation: `starPop 0.4s ease both`, animationDelay: `${si * 0.05}s` }}>★</span>)}</div>
                <p className="text-[0.93rem] text-white/90 leading-[1.75] mb-6 italic relative pt-1">
                  <span className="font-syne text-[2.8rem] text-[rgba(194,230,110,0.28)] leading-none block mb-2">"</span>{t.text}
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold transition-transform group-hover:scale-[1.08] border-2 border-white/15 ${t.bgClass || 'bg-kl-green-light text-kl-green-dark'}`}>{t.avatar}</div>
                  <div><div className="font-bold text-[0.9rem] text-white">{t.name}</div><div className="text-kl-green text-[0.73rem] mt-0.5">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-kl-gray-line mx-[6%]" />



      {/* PRICING */}
      <section
        id="pricing"
        className="relative z-[1] py-16 px-[6%] overflow-hidden"
      >
        {/* Background image layer */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('${IMAGE_URLS.pricing}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Blur overlay */}
        <div
          className="absolute inset-0 z-1"
          style={{

            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(12px)',
          }}
        />

        {/* Content */}
        <div className="relative z-2">
          <div style={{ textAlign: 'center' }} className="reveal">
            <span className="section-tag font-syne">
              <Sparkles size={12} className="inline-block align-middle mr-1" /> Pricing
            </span>
            <h2 className="section-title font-syne">Simple, Transparent Plans</h2>
            <p className="section-sub mx-auto">Choose the perfect plan for your health journey.</p>
          </div>

          <div
            className="grid grid-cols-3 gap-5 mt-10 max-w-[1100px] mx-auto max-lg:grid-cols-2 max-md:grid-cols-1"
            style={{ maxWidth: '1100px', margin: '2rem auto 0' }}
          >
            {DEFAULT_PRICING_PLANS.map((plan, idx) => (
              <div
                key={plan.name}
                className={`pricing-card-sm ${plan.featured ? 'featured-sm' : ''} bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border ${plan.featured ? 'border-kl-green shadow-kl-green/30' : 'border-gray-200'}`}
                style={{
                  background: plan.featured
                    ? 'rgba(194, 230, 110, 0.25)'
                    : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {plan.badge && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-kl-green text-white text-[0.65rem] font-bold px-3 py-0.5 rounded-full whitespace-nowrap z-10 shadow-sm">
                    {plan.badge}
                  </div>
                )}
                <div className="text-center mb-4">
                  <div className="font-syne text-xl font-bold mb-1">{plan.name}</div>
                  <div className="font-syne text-2xl font-extrabold text-kl-green-dark">
                    {plan.price}
                    <span className="text-sm font-normal text-kl-text-m ml-1">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-5 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-kl-text-m">
                      <span className="text-kl-green-dark font-bold text-base">✓</span>
                      <span className="text-[0.8rem]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className="w-full py-2 rounded-full font-semibold text-sm bg-kl-orange text-white hover:shadow-md transition-all active:scale-95"
                  onClick={() => setShowModal(true)}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
  <Link
    to="/auth"
    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/80 border border-kl-gray-line text-kl-text-m font-medium text-sm hover:bg-kl-white hover:border-kl-green hover:text-kl-green-dark transition-all duration-200"
  >
    <Sparkles size={14} />
    Register to discover more offers & seasonal programs
  </Link>
</div>
        </div>
      </section>

      <div className="h-px bg-kl-gray-line mx-[6%]" />
      {/* CTA SECTION */}
      <section className="relative py-24 px-[6%] overflow-hidden">
        {/* Subtle gradient background layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-kl-green-light/20 via-transparent to-kl-orange-20/30 pointer-events-none" />

        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-kl-green/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-kl-orange/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-kl-green-dark bg-kl-green-light/50 px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <Sparkles size={16} /> Get Started
          </span>

          <h2 className="font-syne text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-kl-green-dark to-kl-orange bg-clip-text text-transparent">
            Ready to eat smarter?
          </h2>

          <p className="text-kl-text-m text-base max-w-2xl mx-auto leading-relaxed mb-10">
            Whether you're tracking calories, managing a condition, or just building better habits —
            KhabirLens has everything you need. Sign up free and see what AI nutrition feels like.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/auth"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-kl-orange to-orange-500 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
            >
              <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"></span>
              <Rocket size={18} className="relative z-10" />
              <span className="relative z-10">Get Started Free</span>
            </Link>

            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white border-2 border-kl-green text-kl-green-dark font-semibold text-sm shadow-md hover:bg-kl-green-light hover:border-kl-green-dark hover:-translate-y-0.5 transition-all duration-200"
            >
              <Star size={18} />
              See Plans
            </button>

            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-transparent border border-kl-gray-line text-kl-text-m font-semibold text-sm hover:bg-kl-white hover:border-kl-green hover:text-kl-green-dark hover:-translate-y-0.5 transition-all duration-200"
            >
              <Info size={18} />
              About Us
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Homepage;