import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConfidenceStars({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${value}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={cn(
            "transition",
            i < value ? "fill-amber-400 text-amber-400" : "text-zinc-700",
          )}
        />
      ))}
    </div>
  );
}
