// src/hooks/useAnimations.ts
/**
 * Animation utilities for KhabirLens dashboard
 * 
 * Usage:
 *   import { useScrollReveal, useReducedMotion, useTilt, useCountUp } from "@/hooks/useAnimations";
 * 
 *   // Scroll reveal
 *   const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
 *   <div ref={ref} className={isVisible ? "is-visible" : ""}>Content</div>
 * 
 *   // 3D tilt on cards
 *   const { ref: tiltRef, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>(8);
 *   <div ref={tiltRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>Card</div>
 * 
 *   // Count-up numbers
 *   const { count, ref: countRef } = useCountUp(1500, 1200);
 *   <span ref={countRef}>{count}</span>
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ─── useReducedMotion ─────────────────────────────────────────────────────
/** Returns true if user prefers reduced motion */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

// ─── useScrollReveal ──────────────────────────────────────────────────────
interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/** 
 * IntersectionObserver-based scroll reveal hook.
 * Returns ref to attach to element, and isVisible boolean.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.12, rootMargin = "0px 0px -30px 0px", triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setIsVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(el);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, reduced]);

  return { ref, isVisible, reduced };
}

// ─── useStagger ───────────────────────────────────────────────────────────
/** 
 * Stagger animation for lists. Attach parentRef to container.
 * Returns Set of visible item indices.
 */
export function useStagger(itemCount: number, baseDelay = 0.08) {
  const reduced = useReducedMotion();
  const parentRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (reduced) {
      setVisibleItems(new Set(Array.from({ length: itemCount }, (_, i) => i)));
      return;
    }
    const parent = parentRef.current;
    if (!parent) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems((prev) => new Set([...prev, i]));
            }, i * baseDelay * 1000);
          }
          observer.unobserve(parent);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(parent);
    return () => observer.disconnect();
  }, [itemCount, baseDelay, reduced]);

  return { parentRef, visibleItems };
}

// ─── useCountUp ───────────────────────────────────────────────────────────
/** 
 * Animated number counter. Attach ref to element.
 * Counts from 0 to `end` over `duration` ms.
 */
export function useCountUp(end: number, duration = 1200, startOnVisible = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnVisible) {
      setStarted(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (!started) return;
    if (reduced) {
      setCount(end);
      return;
    }
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration, reduced]);

  return { count, ref };
}

// ─── useTilt ──────────────────────────────────────────────────────────────
/** 
 * 3D tilt effect on mouse move. Attach ref and event handlers to element.
 * max = max rotation in degrees.
 */
export function useTilt<T extends HTMLElement>(max = 8) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      if (reduced || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * max * 2;
      const rotateY = (x - 0.5) * max * 2;
      ref.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    },
    [reduced, max]
  );

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
  }, []);

  return { ref, onMouseMove, onMouseLeave, reduced };
}

// ─── useSpring ────────────────────────────────────────────────────────────
/** 
 * Physics-based spring animation for numeric values.
 * Returns smoothly interpolated current value.
 */
export function useSpring(target: number, tension = 0.15, friction = 0.8) {
  const [current, setCurrent] = useState(target);
  const velocityRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      const diff = target - current;
      velocityRef.current += diff * tension;
      velocityRef.current *= friction;
      const next = current + velocityRef.current;
      setCurrent(next);
      if (Math.abs(diff) > 0.01 || Math.abs(velocityRef.current) > 0.01) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, tension, friction]);

  return current;
}

// ─── useInView ────────────────────────────────────────────────────────────
/** Simple boolean in-view detection */
export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
