import { motion } from "motion/react";
import { Clock3, Beer, Heart, Users, Hourglass, SkipForward } from "lucide-react";
import { GlowCard } from "@/components/fx/GlowCard";
import type { WrappedStats } from "@/lib/wrapped/computeStats";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 20, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <motion.div variants={item}>
      <GlowCard className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cyan/10">
          <Icon className="size-5 text-cyan" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-lg leading-none text-off-white">{value}</p>
          <p className="text-xs text-fog">{label}</p>
        </div>
      </GlowCard>
    </motion.div>
  );
}

/** Slide 3 (BRIEF §5.5) — the receipts. */
export function StatsSlide({ stats }: { stats: WrappedStats }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-5">
      <h2 className="mb-2 text-center font-heading text-2xl uppercase tracking-wide text-fog">
        Statystyki dnia
      </h2>
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3">
        <Stat icon={Clock3} label="Czas trwania gry" value={stats.durationLabel} />
        <Stat
          icon={Beer}
          label="Podejść do Drink Runnera"
          value={String(Math.max(1, stats.drinkRunnerAttempts))}
        />
        <Stat
          icon={Heart}
          label="Najdalej w Pokusie przed wygraną"
          value={stats.pokusaFarthestBeforeWin != null ? `${stats.pokusaFarthestBeforeWin}/20` : "—"}
        />
        <Stat icon={Users} label="Osób zaczepionych (szacunkowo)" value={String(stats.peopleEngaged)} />
        <Stat
          icon={Hourglass}
          label="Najdłuższe zadanie"
          value={stats.longestTask ? `${stats.longestTask.label} · ${stats.longestTask.title}` : "—"}
        />
        <Stat icon={SkipForward} label="Ile razy pominął" value={String(stats.skipsUsed)} />
      </motion.div>
    </div>
  );
}
