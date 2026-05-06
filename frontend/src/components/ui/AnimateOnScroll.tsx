// src/components/ui/AnimateOnScroll.tsx
/**
 * Declarative scroll-reveal wrapper component.
 * 
 * Usage:
 *   <AnimateOnScroll animation="fade-up" delay={0.2}>
 *     <YourCard />
 *   </AnimateOnScroll>
 * 
 *   <StaggerContainer staggerDelay={0.1}>
 *     {items.map(item => <Card key={item.id}>{item.name}</Card>)}
 *   </StaggerContainer>
 */

import { useScrollReveal, useReducedMotion } from "@/hooks/useAnimations";
import { cn } from "@/lib/utils";
import { type ReactNode, type CSSProperties } from "react";

type AnimationType = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale-in" | "blur-in";

interface AnimateOnScrollProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span" | "h1" | "h2" | "h3" | "p";
  threshold?: number;
  style?: CSSProperties;
}

const animationClasses: Record<AnimationType, { hidden: string; visible: string }> = {
  "fade-up":    { hidden: "opacity-0 translate-y-6",      visible: "opacity-100 translate-y-0" },
  "fade-down":  { hidden: "opacity-0 -translate-y-6",     visible: "opacity-100 translate-y-0" },
  "fade-left":  { hidden: "opacity-0 -translate-x-6",     visible: "opacity-100 translate-x-0" },
  "fade-right": { hidden: "opacity-0 translate-x-6",      visible: "opacity-100 translate-x-0" },
  "scale-in":   { hidden: "opacity-0 scale-95",           visible: "opacity-100 scale-100" },
  "blur-in":    { hidden: "opacity-0 blur-sm",            visible: "opacity-100 blur-0" },
};

export default function AnimateOnScroll({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 0.6,
  className,
  as: Tag = "div",
  threshold,
  style,
}: AnimateOnScrollProps) {
  const { ref, isVisible, reduced } = useScrollReveal({ threshold });
  const { hidden, visible } = animationClasses[animation];

  const computedStyle: CSSProperties = reduced
    ? { ...style }
    : {
        ...style,
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
        willChange: "transform, opacity",
      };

  return (
    <Tag
      ref={ref as any}
      className={cn(
        "transition-all ease-out",
        isVisible ? visible : hidden,
        className
      )}
      style={computedStyle}
    >
      {children}
    </Tag>
  );
}

// ─── StaggerContainer ─────────────────────────────────────────────────────
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  duration?: number;
  threshold?: number;
}

export function StaggerContainer({ 
  children, 
  className, 
  staggerDelay = 0.08,
  duration = 0.5,
  threshold,
}: StaggerContainerProps) {
  const { ref, isVisible, reduced } = useScrollReveal<HTMLDivElement>({ threshold });
  const childArray = Array.isArray(children) ? children : [children];

  return (
    <div ref={ref} className={className}>
      {childArray.map((child, i) => (
        <div
          key={i}
          className={cn(
            "transition-all ease-out",
            isVisible || reduced
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-5"
          )}
          style={{
            transitionDuration: `${duration}s`,
            transitionDelay: reduced ? "0s" : `${i * staggerDelay}s`,
            willChange: "transform, opacity",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ─── AnimatedCounter ────────────────────────────────────────────────────
interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ 
  end, 
  duration = 1200, 
  prefix = "", 
  suffix = "",
  className,
}: AnimatedCounterProps) {
  const { count, ref } = useCountUp(end, duration);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Re-import for the component above
import { useCountUp } from "@/hooks/useAnimations";
