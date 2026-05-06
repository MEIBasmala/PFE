import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Store scroll positions keyed by location pathname + optional hash
const scrollPositions = new Map<string, number>();

export function useScrollRestoration() {
  const location = useLocation();
  const isRestoring = useRef(false);

  // Save scroll position before navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      const key = location.pathname;
      scrollPositions.set(key, window.scrollY);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location]);

  // Save on every scroll (optional, for more accuracy)
  useEffect(() => {
    const handleScroll = () => {
      const key = location.pathname;
      scrollPositions.set(key, window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  // Restore scroll position when the route changes
  useEffect(() => {
    // Prevent restoring if we just navigated via hash (e.g., #pricing)
    if (window.location.hash) {
      const element = document.getElementById(window.location.hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    const savedPosition = scrollPositions.get(location.pathname);
    if (savedPosition !== undefined) {
      isRestoring.current = true;
      window.scrollTo(0, savedPosition);
      // Allow time for any layout shifts
      setTimeout(() => { isRestoring.current = false; }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);
}