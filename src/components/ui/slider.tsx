import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

interface SliderWithTicksProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  max: number;
  min?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
  showTicks?: boolean;
  skipInterval?: number;
}

const SliderWithTicks = React.forwardRef<HTMLDivElement, SliderWithTicksProps>(
  (
    {
      value,
      onValueChange,
      max,
      min = 0,
      step = 1,
      className,
      disabled = false,
      showTicks = true,
      skipInterval,
    },
    ref
  ) => {
    // Calculate dynamic skip interval based on max value if not provided
    const calculateSkipInterval = () => {
      if (skipInterval) return skipInterval;
      if (max <= 10) return 1; // Show all ticks for small ranges
      if (max <= 20) return 2; // Show every 2nd tick
      if (max <= 50) return 5; // Show every 5th tick
      if (max <= 100) return 10; // Show every 10th tick
      return Math.ceil(max / 10); // For larger ranges, show approximately 10 ticks
    };

    const dynamicSkipInterval = calculateSkipInterval();
    const ticks = [...Array(max + 1)].map((_, i) => i);

    return (
      <div ref={ref} className={cn("w-full", className)}>
        <Slider
          value={value}
          onValueChange={onValueChange}
          max={max}
          min={min}
          step={step}
          disabled={disabled}
          className="w-full"
        />
        {showTicks && max > 0 && (
          <span
            className="text-muted-foreground mt-3 flex w-full items-center justify-between gap-1 px-2.5 text-xs font-medium"
            aria-hidden="true"
          >
            {ticks.map((tickValue, i) => (
              <span
                key={`tick-${tickValue}`}
                className="flex w-0 flex-col items-center justify-center gap-2"
              >
                <span
                  className={cn(
                    "bg-muted-foreground/70 h-1 w-px",
                    i % dynamicSkipInterval !== 0 && "h-0.5"
                  )}
                />
                <span
                  className={cn(i % dynamicSkipInterval !== 0 && "opacity-0")}
                >
                  {tickValue}
                </span>
              </span>
            ))}
          </span>
        )}
      </div>
    );
  }
);

SliderWithTicks.displayName = "SliderWithTicks";

export { Slider, SliderWithTicks };
