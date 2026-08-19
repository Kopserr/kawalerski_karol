import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";
import { GlowCard } from "@/components/fx/GlowCard";

interface PhasePlaceholderProps {
  title: string;
  phaseLabel: string;
  description: string;
  backHref?: string;
}

/** Marks a route that's real in the routing map but whose feature lands in
 * a later build phase (BRIEF §13 — "rób fazami, nie buduj wszystkiego naraz"). */
export function PhasePlaceholder({
  title,
  phaseLabel,
  description,
  backHref = "/board",
}: PhasePlaceholderProps) {
  return (
    <main className="mx-auto flex h-dvh w-full max-w-[520px] flex-col items-center justify-center gap-4 bg-void px-6 text-center safe-x safe-top safe-bottom">
      <GlowCard className="flex w-full flex-col items-center gap-4 p-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-cyan/10">
          <Hammer className="size-7 text-cyan" />
        </div>
        <h1 className="font-heading text-2xl">{title}</h1>
        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
          {phaseLabel}
        </span>
        <p className="text-sm leading-relaxed text-fog">{description}</p>
        <Link
          href={backHref}
          className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm text-off-white"
        >
          <ArrowLeft className="size-4" /> Wróć do planszy
        </Link>
      </GlowCard>
    </main>
  );
}
