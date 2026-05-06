import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "ring-offset-background transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        // Orange primary — matches .kl-btn-orange
        default: [
          "bg-primary text-primary-foreground rounded-md text-sm",
          "shadow-[0_4px_14px_hsl(var(--orange)/0.25)]",
          "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_hsl(var(--orange)/0.35)]",
          "hover:bg-primary/95",
        ].join(" "),
        // Destructive
        destructive: [
          "bg-[hsl(var(--error-light))] text-[hsl(var(--error))] border border-[hsl(var(--error))] rounded-md text-sm",
          "hover:bg-[hsl(var(--error))] hover:text-white hover:-translate-y-0.5",
        ].join(" "),
        // Ghost outline — matches .kl-btn-ghost
        outline: [
          "border border-[hsl(var(--gray-line))] bg-[hsl(var(--pure-white))] text-[hsl(var(--text-m))] rounded-md text-sm",
          "hover:border-[hsl(var(--orange))] hover:text-[hsl(var(--orange))] hover:bg-[hsl(var(--orange-20))]",
        ].join(" "),
        // Green secondary — matches .kl-btn-green
        secondary: [
          "bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))] border border-[hsl(var(--green))] rounded-md text-sm",
          "hover:bg-[hsl(var(--green))] hover:-translate-y-0.5",
        ].join(" "),
        ghost: [
          "rounded-xl text-[hsl(var(--text-m))] text-sm",
          "hover:bg-[hsl(var(--green-light))] hover:text-[hsl(var(--green-dark))]",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline rounded-none text-sm",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };