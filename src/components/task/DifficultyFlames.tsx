import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function DifficultyFlames({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Trudność ${level} z 3`}>
      {[1, 2, 3].map((n) => (
        <Flame
          key={n}
          className={cn("size-4", n <= level ? "text-magenta" : "text-white/15")}
          fill={n <= level ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}
