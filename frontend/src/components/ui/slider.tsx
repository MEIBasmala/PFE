import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[hsl(var(--gray-bg))] border border-[hsl(var(--gray-line)/0.5)]">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-[hsl(var(--green))] to-[hsl(var(--orange))] rounded-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-5 w-5 rounded-full",
        "border-2 border-[hsl(var(--orange))]",
        "bg-[hsl(var(--pure-white))]",
        "shadow-[0_2px_8px_hsl(var(--orange)/0.3)]",
        "ring-offset-background transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--orange))] focus-visible:ring-offset-2",
        "hover:scale-110",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };