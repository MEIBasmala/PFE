import * as React from "react";
import { cn } from "@/lib/utils";

// Base Card — matches .kl-card-enhanced with the top-gradient reveal on hover
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-lg border border-[hsl(var(--gray-line))]",
        "bg-[hsl(var(--pure-white))] text-[hsl(var(--text-dark))]",
        "shadow-[var(--card-shadow)]",
        "transition-all duration-250 ease-out",
        // Top gradient accent line, revealed on hover
        "before:absolute before:inset-x-0 before:top-0 before:h-[3px]",
        "before:bg-gradient-to-r before:from-[hsl(var(--green))] before:to-[hsl(var(--orange))]",
        "before:opacity-0 before:transition-opacity before:duration-300",
        "hover:-translate-y-1 hover:shadow-[var(--hover-shadow)] hover:border-[hsl(var(--green-light))]",
        "hover:before:opacity-100",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "font-syne text-xl font-bold leading-none tracking-tight text-[hsl(var(--text-dark))]",
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-[hsl(var(--text-m))]", className)}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };