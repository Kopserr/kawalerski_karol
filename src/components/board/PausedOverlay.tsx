import { motion } from "motion/react";
import { Pause } from "lucide-react";

/** BRIEF §8.1's PAUZA GRY, groom side: "blokuje otwieranie zadań, pokazuje
 * ekran przerwa". */
export function PausedOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-void/90 backdrop-blur-md"
    >
      <div className="flex size-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
        <Pause className="size-7 text-gold" />
      </div>
      <h1 className="font-heading text-3xl text-gold">PRZERWA</h1>
      <p className="max-w-xs text-center text-sm text-fog">
        Ekipa wstrzymała grę na chwilę. Wróć za moment — nic nie znika.
      </p>
    </motion.div>
  );
}
