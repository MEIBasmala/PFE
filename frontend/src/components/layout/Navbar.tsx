// src/components/layout/Navbar.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Home, ScanLineIcon, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const mobileRef = useRef<HTMLUListElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const dashboardPath =
    user?.role?.toUpperCase() === 'PATIENT' ? '/patient/dashboard' :
    user?.role?.toUpperCase() === 'NUTRITIONIST' ? '/nutritionist/dashboard' :
    user?.role?.toUpperCase() === 'ADMIN' ? '/admin/dashboard' :
    '/';

  const userAvatar = user?.fullName
    ? user.fullName.trim().charAt(0).toUpperCase()
    : '?';

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll spy
  useEffect(() => {
    if (location.pathname !== '/') return;
    const sections = [
      { id: 'home', label: 'Home' },
      { id: 'blog-section', label: 'Blog' },
      { id: 'pricing', label: 'Pricing' },
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((p, c) => c.intersectionRatio > p.intersectionRatio ? c : p);
          setActiveSection(top.target.id);
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -20% 0px' }
    );
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [location.pathname]);

  // Click outside to close mobile menu & avatar dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Handle scroll-to after navigation
  useEffect(() => {
    const state = location.state as { scrollTo?: string; scrollToTop?: boolean } | null;
    if (state?.scrollTo) {
      setTimeout(() => {
        const el = document.getElementById(state.scrollTo!);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveSection(state.scrollTo!);
        }
      }, 300);
      window.history.replaceState({}, document.title);
    }
    if (state?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const isLinkActive = (linkId: string) => {
    if (location.pathname !== '/') {
      if (linkId === 'home') return location.pathname === '/';
      if (linkId === 'about') return location.pathname === '/about';
      if (linkId === 'contact') return location.pathname === '/contact';
      return false;
    }
    if (linkId === 'home') return activeSection === 'home';
    if (linkId === 'blog') return activeSection === 'blog-section';
    if (linkId === 'pricing') return activeSection === 'pricing';
    return false;
  };

  const handleScrollLink = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('home');
    } else {
      navigate('/', { state: { scrollToTop: true } });
    }
  };

  const navLinkClass = (active: boolean) =>
    `relative text-[0.85rem] font-medium transition-colors py-1 whitespace-nowrap ${active
      ? 'text-kl-green-dark font-semibold after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-kl-green after:to-kl-orange after:rounded-full'
      : 'text-kl-text-m hover:text-kl-green-dark'
    }`;

  return (
    <nav
      className={`fixed z-[100] flex items-center justify-between transition-all duration-300 ${scrolled
          ? 'top-0 left-0 right-0 w-full px-4 sm:px-6 lg:px-8 py-2.5 bg-white/95 backdrop-blur-xl shadow-md border-b border-kl-gray-line'
          : 'top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[1200px] px-5 sm:px-7 py-2.5 sm:py-3 bg-white/95 backdrop-blur-[20px] rounded-full border border-kl-gray-line shadow-kl'
        }`}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0 no-underline group min-w-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-kl-green to-kl-orange flex items-center justify-center shrink-0 transition-transform group-hover:rotate-[8deg]">
          <img src="../img/logo.png" alt="KhabirLens" className="w-7 h-7 rounded-lg" />
        </div>
        <span className="font-syne font-extrabold text-[1.1rem] sm:text-[1.3rem] text-kl-green-dark tracking-tight truncate">
          Khabir<span className="bg-gradient-to-br from-kl-green to-kl-orange bg-clip-text text-transparent">Lens</span>
        </span>
      </Link>

      {/* Hamburger — visible below lg (1024px) */}
      <button
        className="lg:hidden bg-transparent border-none text-2xl cursor-pointer text-kl-green-dark p-1"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Desktop Nav — hidden below lg, flex row above */}
      <ul
        ref={mobileRef}
        className={`flex items-center gap-6 xl:gap-8 list-none ${mobileOpen
            ? 'fixed top-[64px] sm:top-[72px] left-0 right-0 bg-white/[0.98] backdrop-blur-[20px] flex-col gap-0 p-4 border-b border-kl-gray-line z-[99] shadow-lg animate-slideIn'
            : 'hidden lg:flex'
          }`}
      >
        {/* Home */}
        <li className={mobileOpen ? 'w-full py-2.5 border-b border-kl-gray-line/50 last:border-0' : ''}>
          <a href="/" onClick={handleHomeClick} className={`block ${navLinkClass(isLinkActive('home'))}`}>
            Home
          </a>
        </li>

        {/* Blog */}
        <li className={mobileOpen ? 'w-full py-2.5 border-b border-kl-gray-line/50 last:border-0' : ''}>
          <a href="#blog-section" onClick={e => handleScrollLink(e, 'blog-section')} className={`block ${navLinkClass(isLinkActive('blog'))}`}>
            Blog
          </a>
        </li>

        {/* Pricing */}
        <li className={mobileOpen ? 'w-full py-2.5 border-b border-kl-gray-line/50 last:border-0' : ''}>
          <a href="#pricing" onClick={e => handleScrollLink(e, 'pricing')} className={`block ${navLinkClass(isLinkActive('pricing'))}`}>
            Pricing
          </a>
        </li>

        {/* About */}
        <li className={mobileOpen ? 'w-full py-2.5 border-b border-kl-gray-line/50 last:border-0' : ''}>
          <Link to="/about" onClick={() => setMobileOpen(false)} className={`block ${navLinkClass(isLinkActive('about'))}`}>
            About
          </Link>
        </li>

        {/* Contact */}
        <li className={mobileOpen ? 'w-full py-2.5 border-b border-kl-gray-line/50 last:border-0' : ''}>
          <Link to="/contact" onClick={() => setMobileOpen(false)} className={`block ${navLinkClass(isLinkActive('contact'))}`}>
            Contact
          </Link>
        </li>

        {/* CTA / Avatar */}
        <li className={mobileOpen ? 'w-full py-3' : ''}>
          {user ? (
            <div ref={avatarRef} className="relative">
              {/* Desktop: avatar + mini dropdown */}
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="hidden lg:flex items-center gap-2 group focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-kl-green to-kl-orange flex items-center justify-center text-[0.9rem] font-bold text-kl-text-dark shadow-[0_2px_8px_rgba(194,230,110,0.35)] transition-all group-hover:-translate-y-0.5">
                  {userAvatar}
                </div>
                <div className="hidden xl:flex flex-col leading-tight text-left">
                  <span className="text-[0.75rem] font-semibold text-kl-green-dark truncate max-w-[100px]">{user.fullName?.split(' ')[0]}</span>
                  <span className="text-[0.65rem] text-kl-text-m capitalize">{user.role?.toLowerCase()}</span>
                </div>
                <ChevronDown size={14} className={`text-kl-text-m transition-transform ${avatarOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mobile: full row link to dashboard */}
              <Link
                to={dashboardPath}
                onClick={() => setMobileOpen(false)}
                className="lg:hidden flex items-center gap-3 no-underline"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-kl-green to-kl-orange flex items-center justify-center text-base font-bold text-kl-text-dark">
                  {userAvatar}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-kl-green-dark">{user.fullName}</span>
                  <span className="text-xs text-kl-text-m capitalize">{user.role?.toLowerCase()} Dashboard ↗</span>
                </div>
              </Link>

              {/* Avatar Dropdown */}
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-kl-gray-line shadow-lg py-1.5 z-[110] animate-slideIn">
                  <Link
                    to={dashboardPath}
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-kl-text-m hover:bg-kl-green-light hover:text-kl-green-dark transition-colors"
                  >
                    <Home size={14} /> Profile
                  </Link>
                  <Link
                    to={`${dashboardPath}/ai`}
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-kl-text-m hover:bg-kl-green-light hover:text-kl-green-dark transition-colors"
                  >
                    <ScanLineIcon size={14} /> Scan a meal
                  </Link>
                  <div className="mx-3 my-1 h-px bg-kl-gray-line" />
                  <button
                    onClick={() => { logout(); setAvatarOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center bg-gradient-to-br from-kl-green to-kl-orange text-kl-text-dark px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-[0.85rem] sm:text-[0.9rem] no-underline transition-all shadow-[0_2px_8px_rgba(194,230,110,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(194,230,110,0.4)] whitespace-nowrap"
            >
              Get Started →
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;