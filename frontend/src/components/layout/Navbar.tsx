// src/components/layout/Navbar.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const dashboardPath =
    user?.role?.toUpperCase() === 'PATIENT' ? '/patient/dashboard' :
    user?.role?.toUpperCase() === 'NUTRITIONIST' ? '/nutritionist/dashboard' :
    user?.role?.toUpperCase() === 'ADMIN' ? '/admin/dashboard' :
    '/';

  const userAvatar = user?.fullName
    ? user.fullName.trim().charAt(0).toUpperCase()
    : '?';

  // Scroll handler for navbar background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll spy: track which section is visible on homepage
  useEffect(() => {
    if (location.pathname !== '/') return;

    const sections = [
      { id: 'home', label: 'Home' },
      { id: 'blog-section', label: 'Blog' },
      { id: 'pricing', label: 'Pricing' },
      // About and Contact are separate pages – no corresponding homepage sections
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries.reduce((prev, curr) =>
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev
          );
          setActiveSection(topEntry.target.id);
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -20% 0px' }
    );

    sections.forEach(section => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  // Helper to determine if a link is active
  const isLinkActive = (linkId: string) => {
    if (location.pathname !== '/') {
      if (linkId === 'home') return location.pathname === '/';
      if (linkId === 'about') return location.pathname === '/about';
      if (linkId === 'contact') return location.pathname === '/contact';
      return false;
    }
    // On homepage, scroll spy for other links
    if (linkId === 'home') return activeSection === 'home';
    if (linkId === 'blog') return activeSection === 'blog-section';
    if (linkId === 'pricing') return activeSection === 'pricing';
    if (linkId === 'about') return false;
    if (linkId === 'contact') return false;
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

  // Handle scroll-to after navigation from another page
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
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
  }, [location]);

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[1200px] z-[100] flex items-center justify-between px-7 py-3 backdrop-blur-[20px] bg-white/95 rounded-[60px] border border-kl-gray-line transition-all duration-300 ${scrolled ? '!top-0 !rounded-none !w-full !max-w-full shadow-md border-l-0 border-r-0 border-t-0' : 'shadow-kl'
        }`}
    >
      <Link to="/" className="flex items-center gap-2.5 no-underline group">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-kl-green to-kl-orange flex items-center justify-center text-sm font-bold text-kl-white transition-transform group-hover:rotate-[8deg]">
          <img src="../img/logo.png" alt="KhabirLens" className="w-7 h-7 rounded-lg" />
        </div>
        <span className="font-syne font-[800] text-[1.3rem] text-kl-green-dark tracking-tight">
          Khabir<span className="bg-gradient-to-br from-kl-green to-kl-orange bg-clip-text text-transparent">Lens</span>
        </span>
      </Link>

      <button
        className="hidden md-max:block bg-transparent border-none text-2xl cursor-pointer text-kl-green-dark"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      <ul
        className={`flex gap-8 list-none items-center md-max:fixed md-max:top-[70px] md-max:left-0 md-max:right-0 md-max:bg-white/[0.98] md-max:backdrop-blur-[20px] md-max:flex-col md-max:gap-0 md-max:p-4 md-max:border-b md-max:border-kl-gray-line md-max:z-[99] md-max:transition-transform md-max:duration-300 ${mobileOpen ? 'md-max:translate-y-0' : 'md-max:-translate-y-[150%]'
          }`}
      >
        {/* Home */}
        <li>
          <a
            href="/"
            onClick={handleHomeClick}
            className={`text-kl-text-m no-underline text-[0.9rem] font-medium transition-all relative py-1 hover:text-kl-green-dark cursor-pointer ${isLinkActive('home') ? 'text-kl-green-dark font-semibold after:content-[""] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-kl-green after:to-kl-orange after:rounded' : ''
              }`}
          >
            Home
          </a>
        </li>

        {/* Blog */}
        <li>
          <a
            href="#blog-section"
            className={`text-kl-text-m no-underline text-[0.9rem] font-medium transition-all relative py-1 hover:text-kl-green-dark cursor-pointer ${isLinkActive('blog') ? 'text-kl-green-dark font-semibold after:content-[""] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-kl-green after:to-kl-orange after:rounded' : ''
              }`}
            onClick={e => handleScrollLink(e, 'blog-section')}
          >
            Blog
          </a>
        </li>

        {/* Pricing */}
        <li>
          <a
            href="#pricing"
            className={`text-kl-text-m no-underline text-[0.9rem] font-medium transition-all relative py-1 hover:text-kl-green-dark cursor-pointer ${isLinkActive('pricing') ? 'text-kl-green-dark font-semibold after:content-[""] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-kl-green after:to-kl-orange after:rounded' : ''
              }`}
            onClick={e => handleScrollLink(e, 'pricing')}
          >
            Pricing
          </a>
        </li>

        {/* About */}
        <li>
          <Link
            to="/about"
            className={`text-kl-text-m no-underline text-[0.9rem] font-medium transition-all relative py-1 hover:text-kl-green-dark ${isLinkActive('about') ? 'text-kl-green-dark font-semibold after:content-[""] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-kl-green after:to-kl-orange after:rounded' : ''
              }`}
            onClick={() => setMobileOpen(false)}
          >
            About
          </Link>
        </li>

        {/* Contact */}
        <li>
          <Link
            to="/contact"
            className={`text-kl-text-m no-underline text-[0.9rem] font-medium transition-all relative py-1 hover:text-kl-green-dark ${isLinkActive('contact') ? 'text-kl-green-dark font-semibold after:content-[""] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-kl-green after:to-kl-orange after:rounded' : ''
              }`}
            onClick={() => setMobileOpen(false)}
          >
            Contact
          </Link>
        </li>

        {/* CTA Button / User Avatar */}
        <li>
          {user ? (
            <Link
              to={dashboardPath}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 no-underline group"
              title={`Go to your dashboard`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-kl-green to-kl-orange flex items-center justify-center text-[0.95rem] font-bold text-kl-text-dark shadow-[0_2px_8px_rgba(194,230,110,0.35)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_6px_16px_rgba(194,230,110,0.45)]">
                {userAvatar}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[0.8rem] font-semibold text-kl-green-dark">{user.fullName?.split(' ')[0]}</span>
                <span className="text-[0.68rem] text-kl-text-m capitalize">{user.role?.toLowerCase()} ↗</span>
              </div>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="bg-gradient-to-br from-kl-green to-kl-orange text-kl-text-dark px-6 py-2.5 rounded-[40px] font-bold text-[0.9rem] no-underline transition-all shadow-[0_2px_8px_rgba(194,230,110,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(194,230,110,0.4)]"
              onClick={() => setMobileOpen(false)}
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