import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Base glassmorphism card per BRIEF §4.2. */
export function GlowCard({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("glass rounded-2xl", className)} {...props} />;
}
