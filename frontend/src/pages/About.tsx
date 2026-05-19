// src/pages/About.tsx

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Footer } from '@/components/layout';
import {
  ScrollToTop,
  Button,
  Card,
  CardContent,
  Badge,
  Separator,
} from '@/components/ui';

import {
  Rocket,
  Users,
  Check,
  Brain,
  Camera,
  BarChart3,
  Eye,
  Calculator,
  Server,
  Layers,
  Sparkles,
  Star,
  Info,
} from 'lucide-react';

/* ─── Static Data ─── */
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

const team = [
  {
    name: 'Meitah Basmala',
    photoUrl: '/team/basmala.jpg',
    role: 'Frontend & UI/UX',
    avatar: 'B',
    bio: 'Designed and built the entire user interface, from wireframes to responsive dashboards. Ensured a seamless, accessible experience for clients, nutritionists, and admins.',
    tags: ['React', 'TypeScript', 'UI/UX Design', 'Responsive', 'Figma'],
    gradient: 'from-kl-green-light to-kl-saffron-light',
  },
  {
    name: 'Anfel Larbatni',
    photoUrl: '/team/Anfel.jpg',
    role: 'Backend & API',
    avatar: 'A',
    bio: 'Developed the Node.js/Express API, PostgreSQL schema, and JWT authentication. Integrated AI model endpoints and managed role-based access for three user dashboards.',
    tags: ['Node.js', 'PostgreSQL', 'REST API', 'JWT Auth'],
    gradient: 'from-kl-saffron-light to-kl-orange-20',
  },
  {
    name: 'Cherifi Lamis Nour El Imene',
    photoUrl: '/team/Lamis.jpg',
    role: 'AI & Computer Vision',
    avatar: 'L',
    bio: 'Trained the YOLOv8 food detection model and the calorie regression network. Fine-tuned on FoodInsSeg dataset forreal-time nutrition estimation.',
    tags: ['YOLOv8', 'COCO', 'TensorFlow/Keras', 'kaggle', 'Python'],
    gradient: 'from-kl-orange-20 to-kl-green-light',
  },
];

const techStack = [
  {
    icon: Eye,
    title: 'Food Detection — YOLOv8',
    desc: 'First AI stage uses YOLOv8 trained on the FoodInsSeg dataset to identify individual food items with instance segmentation.',
    pills: ['YOLOv8', 'FoodInsSeg', 'Python'],
    colorClass: 'bg-[hsl(var(--green-light))]',
    iconColor: 'text-[hsl(var(--green-dark))]',
  },
  {
    icon: Calculator,
    title: 'Calorie Estimation — Regression Model',
    desc: 'A deep regression model trained on the Nutrition5k dataset using Google Colab to estimate macro and calorie content.',
    pills: ['TensorFlow', 'Keras', 'Google Colab'],
    colorClass: 'bg-[hsl(var(--saffron-light))]',
    iconColor: 'text-[#8a6200]',
  },
  {
    icon: Server,
    title: 'Backend — Node.js / Express',
    desc: 'RESTful API handling user auth, nutritionist assignments, meal logs, and AI model inference endpoints.',
    pills: ['Node.js', 'Express', 'PostgreSQL', 'JWT'],
    colorClass: 'bg-[hsl(var(--orange-20))]',
    iconColor: 'text-[#c05000]',
  },
  {
    icon: Layers,
    title: 'Frontend — React / Vite ',
    desc: 'Three role-specific dashboards (Client, Nutritionist, Admin) built in React with a unified design system.',
    pills: ['React', 'TypeScript', 'Vite', 'shadcn UI', 'TailwindCSS', 'Figma'],
    colorClass: 'bg-[hsl(var(--green-light))]',
    iconColor: 'text-[hsl(var(--green-dark))]',
  },
];

const steps = [
  { num: '01', title: 'Create Your Profile', desc: 'Register and fill in your health history, goals, and dietary preferences.' },
  { num: '02', title: 'Choose a Plan', desc: 'Select a subscription that fits your needs — standard, premium, or seasonal programs.' },
  { num: '03', title: 'Consult & Plan', desc: 'Meet with your nutritionist online and receive a personalized dietary plan within 24 hours.' },
  { num: '04', title: 'Track & Transform', desc: 'Use AI calorie tracking daily, monitor your progress, and adjust plans with expert guidance.' },
];

const missionValues = [
  { title: 'Science-first approach', desc: 'Every recommendation is backed by nutritional research, not fads.' },
  { title: 'Human + AI collaboration', desc: 'AI estimates, nutritionists validate. The best of both worlds.' },
];


const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Intersection Observer for scroll reveals (fixes invisibility)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const elements = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .step-reveal'
    );
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="warm-bg">
      <Navbar />
      <ScrollToTop />

      {/* ═══════════════════════════════════════
          HERO (no changes) 
      ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center text-center px-[6%] pt-32 pb-20 z-[1]">
        {/* floating foods */}
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
          <h1 className="font-syne text-[clamp(3rem,5vw,4rem)] font-[800] leading-[1.05] tracking-[-2px] mb-6 animate-fadeUp-1">
            We built{' '}
            <span className="bg-gradient-to-br from-[hsl(var(--green-dark))] to-[hsl(var(--orange))] bg-clip-text text-transparent">
              KhabirLens
            </span>
            <br />
            to make nutrition simple.
          </h1>
          <p className="text-lg text-[hsl(var(--text-m))] max-w-[580px] mx-auto leading-[1.7] mb-10 font-light animate-fadeUp-2">
            An AI-powered nutrition platform that brings together computer vision, expert guidance,
            and a strong commitment to healthier living in Algeria and beyond.
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-fadeUp-3">
            <Button asChild size="lg" className="px-8 py-3.5">
              <Link to="/auth" className="no-underline inline-flex items-center gap-2">
                <Rocket size={18} /> Try It Free
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-3.5"
              onClick={() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Users size={18} /> Meet the Team
            </Button>
          </div>
        </div>

        {/* wavy line */}
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
          MISSION – radii changed to rounded-xl 
      ═══════════════════════════════════════ */}
      <section className="py-24 px-[6%] bg-[hsl(var(--pure-white))] relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(194,230,110,0.25) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative z-[1] max-w-[1200px] mx-auto grid grid-cols-2 gap-20 items-center max-lg:grid-cols-1">
          {/* Visual card – was rounded-[28px], now rounded-xl */}
          <div className="relative reveal-left">
            <Card className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-lg shadow-md">
              <CardContent className="p-10">
                <div className="flex gap-4 mb-7">
                  {[
                    { icon: Brain, colorClass: 'bg-[hsl(var(--green-light))]' },
                    { icon: Camera, colorClass: 'bg-[hsl(var(--saffron-light))]' },
                    { icon: BarChart3, colorClass: 'bg-[hsl(var(--orange-20))]' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.colorClass} transition-transform hover:scale-[1.15] hover:rotate-[-6deg]`}
                    >
                      <item.icon size={22} className="text-[hsl(var(--green-dark))]" />
                    </div>
                  ))}
                </div>
                <div className="font-syne text-[1.4rem] font-bold leading-[1.4]">
                  "Snap a photo.<br />
                  Get <span className="text-[hsl(var(--orange))]">instant nutrition</span>
                  <br />insights — no guesswork."
                </div>
              </CardContent>
            </Card>
            {/* floating badges unchanged */}
            <div className="absolute -top-5 right-5 bg-[hsl(var(--pure-white))] border border-[hsl(var(--gray-line))] rounded-[14px] px-5 py-3 text-[0.78rem] font-semibold shadow-kl-m animate-float flex items-center gap-2 max-md:hidden">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--green-dark))]" /> YOLOv8 Food Detection
            </div>
            <div className="absolute -bottom-5 left-5 bg-[hsl(var(--pure-white))] border border-[hsl(var(--gray-line))] rounded-[14px] px-5 py-3 text-[0.78rem] font-semibold shadow-kl-m animate-float-delay flex items-center gap-2 max-md:hidden">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--orange))]" /> Calorie Regression Model
            </div>
          </div>

          {/* Text section unchanged */}
          <div className="reveal-right">
            <Badge variant="outline" className="mb-4 text-[0.75rem] font-semibold tracking-[2px] uppercase text-[hsl(var(--green-dark))] border-[hsl(var(--green-dark))]/30 bg-transparent px-0 border-0">
              <Sparkles size={12} className="mr-1" /> Our Mission
            </Badge>
            <h2 className="font-syne text-[clamp(1.8rem,3vw,2.5rem)] font-[800] tracking-[-1px] leading-[1.15] mb-5">
              Nutrition intelligence, for everyone.
            </h2>
            <p className="text-[hsl(var(--text-m))] leading-[1.75] text-[0.95rem] mb-6">
              Our goal is simple: make tracking what you eat effortless. No manual logging — just
              point your phone and let AI do the rest. Then pair that with real nutritionists who
              guide you toward your goals.
            </p>
            <div className="flex flex-col gap-3 mt-6">
              {missionValues.map((v, i) => (
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
      </section>

      <Separator className="mx-[6%]" />

      {/* ═══════════════════════════════════════
          NAMING STORY (glass cards keep custom rounding)
      ═══════════════════════════════════════ */}
      <section
        className="relative py-28 px-[6%] overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600&q=80&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0 z-0"
          style={{ background: 'linear-gradient(135deg, rgba(28,26,23,0.84) 0%, rgba(74,122,8,0.62) 100%)' }}
        />
        <div className="relative z-[1] max-w-[900px] mx-auto text-center">
          <span className="text-[0.75rem] font-semibold tracking-[2px] uppercase text-[hsl(var(--green))] mb-4 block">
            <Sparkles size={12} className="inline-block align-middle mr-1" /> The Name
          </span>
          <h2 className="font-syne text-[clamp(2rem,4vw,3.2rem)] font-[800] tracking-[-1px] leading-[1.1] mb-6 text-white reveal">
            What does{' '}
            <span className="bg-gradient-to-br from-[hsl(var(--green))] to-[hsl(var(--orange))] bg-clip-text text-transparent">
              KhabirLens
            </span>{' '}
            mean?
          </h2>

          <div
            className="grid grid-cols-2 gap-8 mt-10 text-left max-md:grid-cols-1 rounded-lg reveal"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '3rem',
            }}
          >
            {/* Khabir card */}
            <div
              className="p-6 rounded-lg"
              style={{ background: 'rgba(194,230,110,0.12)', border: '1px solid rgba(194,230,110,0.3)' }}
            >
              <div className="font-syne text-[2.8rem] font-[800] text-[hsl(var(--green))] mb-1">Khabir</div>
              <div className="text-[0.75rem] font-semibold tracking-[2px] uppercase text-white/50 mb-3">
                Arabic — خبير
              </div>
              <p className="text-[0.9rem] text-white/85 leading-[1.65]">
                In Arabic, <strong className="text-[hsl(var(--green))]">Khabir (خبير)</strong> means{' '}
                <em>expert</em> or <em>knowledgeable</em>. It reflects the platform's core promise:
                professional nutritionist expertise and science-backed guidance you can trust.
              </p>
            </div>
            {/* Lens card */}
            <div
              className="p-6 rounded-lg"
              style={{ background: 'rgba(255,162,87,0.12)', border: '1px solid rgba(255,162,87,0.3)' }}
            >
              <div className="font-syne text-[2.8rem] font-[800] text-[hsl(var(--orange))] mb-1">Lens</div>
              <div className="text-[0.75rem] font-semibold tracking-[2px] uppercase text-white/50 mb-3">
                English — the AI eye
              </div>
              <p className="text-[0.9rem] text-white/85 leading-[1.65]">
                <strong className="text-[hsl(var(--orange))]">Lens</strong> represents the AI computer
                vision pipeline — the camera that looks at your meal, identifies the food, and estimates
                its nutritional content in seconds.
              </p>
            </div>
          </div>

          <p className="mt-10 text-base text-white/70 leading-[1.7] font-light max-w-[640px] mx-auto reveal">
            Together, <strong className="text-white/95">KhabirLens</strong> is the expert eye —
            combining Arabic heritage with cutting-edge AI to make nutrition guidance accessible,
            intelligent, and deeply personal.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TEAM – rounded-[24px] → rounded-xl
      ═══════════════════════════════════════ */}
      <section id="team" className="py-24 px-[6%] bg-[hsl(var(--pure-white))]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16 reveal">
            <span className="text-[0.75rem] font-semibold tracking-[2px] uppercase text-[hsl(var(--green-dark))] mb-4 block">
              <Sparkles size={12} className="inline-block align-middle mr-1" /> Our Team
            </span>
            <h2 className="font-syne text-[clamp(2rem,4vw,3rem)] font-[800] tracking-[-1px] leading-[1.1] mb-4">
              Built by people who care.
            </h2>
            <p className="text-[hsl(var(--text-m))] text-base max-w-[600px] mx-auto leading-[1.7] font-light">
              A team of CS students combining frontend, backend, and AI expertise to create KhabirLens.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((t, i) => (
              <Card
                key={i}
                className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-lg text-center transition-all duration-[350ms] shadow-md relative overflow-hidden group hover:-translate-y-2.5 hover:scale-[1.01] hover:border-[hsl(var(--green))] hover:shadow-lg before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-[hsl(var(--green))] before:to-[hsl(var(--orange))] before:opacity-0 hover:before:opacity-100 before:transition-opacity reveal"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <CardContent className="p-8">
                  <div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${t.gradient} border-[3px] border-[hsl(var(--pure-white))] shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex items-center justify-center mx-auto mb-5 font-syne text-[1.8rem] font-[800] text-[hsl(var(--green-dark))] transition-transform group-hover:scale-[1.08] group-hover:rotate-[4deg]`}
                  >
                    {t.avatar}
                  </div>
                  <div className="font-syne text-[1.1rem] font-bold mb-1">{t.name}</div>
                  <div className="text-[0.78rem] font-semibold text-[hsl(var(--orange))] uppercase tracking-[1px] mb-3">
                    {t.role}
                  </div>
                  <p className="text-[0.83rem] text-[hsl(var(--text-m))] leading-[1.6] mb-5">{t.bio}</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {t.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[0.65rem] font-semibold px-3 py-0.5 rounded-full bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))] hover:bg-[hsl(var(--green-light))]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-[6%]" />

      {/* ═══════════════════════════════════════
          HOW IT WORKS – step cards are custom, no radius change needed
      ═══════════════════════════════════════ */}
      <section
        className="relative py-24 px-[6%] overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1600&q=80&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0 z-0"
          style={{ background: 'linear-gradient(180deg, rgba(246,243,238,0.96) 0%, rgba(232,247,192,0.92) 100%)' }}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14 relative">
            {/* Connector line */}
            <div className="absolute top-10 left-[10%] right-[10%] h-px bg-[hsl(var(--green))] opacity-40 hidden lg:block" />
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
                <div className="text-[0.85rem] text-[hsl(var(--text-m))] leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-[6%]" />

      {/* ═══════════════════════════════════════
          TECH STACK – rounded-[20px] → rounded-lg
      ═══════════════════════════════════════ */}
      <section className="py-24 px-[6%] bg-[hsl(var(--cream-bg))]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16 reveal">
            <span className="text-[0.75rem] font-semibold tracking-[2px] uppercase text-[hsl(var(--green-dark))] mb-4 block">
              <Sparkles size={12} className="inline-block align-middle mr-1" /> Under the Hood
            </span>
            <h2 className="font-syne text-[clamp(2rem,4vw,3rem)] font-[800] tracking-[-1px] leading-[1.1] mb-4">
              How KhabirLens is built
            </h2>
            <p className="text-[hsl(var(--text-m))] text-base max-w-[600px] mx-auto leading-[1.7] font-light">
              A look at the technology stack powering the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {techStack.map((t, i) => (
              <Card
                key={i}
                className="border-[hsl(var(--gray-line))] rounded-lg shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:border-[hsl(var(--green))] hover:shadow-lg group reveal"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <CardContent className="p-8 flex gap-5 items-start">
                  <div
                    className={`w-[52px] h-[52px] rounded-xl flex items-center justify-center flex-shrink-0 ${t.colorClass} transition-transform group-hover:rotate-[-8deg] group-hover:scale-110`}
                  >
                    <t.icon size={22} className={t.iconColor} />
                  </div>
                  <div>
                    <h3 className="font-syne text-base font-bold mb-1.5">{t.title}</h3>
                    <p className="text-[0.83rem] text-[hsl(var(--text-m))] leading-[1.6] mb-3">{t.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.pills.map(p => (
                        <Badge
                          key={p}
                          variant="outline"
                          className="text-[0.65rem] font-semibold px-3 py-0.5 rounded-full bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] text-[hsl(var(--text-m))]"
                        >
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CTA 
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

          <h2 className="font-syne text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-[hsl(var(--text-dark))]">            Ready to eat smarter?
          </h2>

          <p className="text-[hsl(var(--text-m))] text-base max-w-2xl mx-auto leading-relaxed mb-10">
            Whether you're tracking calories, managing a condition, or just building better habits —
            KhabirLens has everything you need. Sign up free and see what AI nutrition feels like.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="px-8 py-3.5">
              <Link to="/auth" className="no-underline inline-flex items-center gap-2">
                <Rocket size={18} /> Get Started Free
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="px-8 py-3.5"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Star size={18} /> See Plans
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3.5" asChild>
              <Link to="/" className="no-underline inline-flex items-center gap-2">
                <Info size={18} /> Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;