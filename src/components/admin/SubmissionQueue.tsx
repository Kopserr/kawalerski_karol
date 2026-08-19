"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, Clock3 } from "lucide-react";
import { approveSubmissionAction, rejectSubmissionAction } from "@/lib/actions/tiles";
import { haptics } from "@/lib/utils/haptics";
import { cn } from "@/lib/utils";
import type { PendingSubmission } from "@/lib/data/admin";

interface SubmissionQueueProps {
  pending: PendingSubmission[];
  onResolved: (submissionId: string) => void;
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

/** The most important view in the admin panel — has to work one-handed,
 * two taps, on a phone, in a loud bar (BRIEF §8.1). */
export function SubmissionQueue({ pending, onResolved }: SubmissionQueueProps) {
  if (pending.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-fog">
        Kolejka pusta. Wszystkie dowody rozpatrzone.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {pending.map((s) => (
          <SubmissionCard key={s.id} submission={s} onResolved={() => onResolved(s.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function SubmissionCard({
  submission,
  onResolved,
}: {
  submission: PendingSubmission;
  onResolved: () => void;
}) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  async function approve() {
    setBusy("approve");
    haptics.tap();
    const res = await approveSubmissionAction(submission.tileId);
    if (res.ok) {
      haptics.success();
      onResolved();
    }
    setBusy(null);
  }

  async function reject() {
    if (!reason.trim()) return;
    setBusy("reject");
    const res = await rejectSubmissionAction(submission.tileId, reason.trim());
    if (res.ok) {
      haptics.error();
      onResolved();
    }
    setBusy(null);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="glass overflow-hidden rounded-2xl"
    >
      <div className="relative">
        {submission.mediaType === "video" ? (
          <video src={submission.mediaUrl} controls className="max-h-64 w-full bg-black" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={submission.mediaUrl} alt="Dowód" className="max-h-64 w-full object-cover" />
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-void/70 px-2 py-1 text-[10px] text-fog">
          <Clock3 className="size-3" /> {formatTime(submission.createdAt)}
        </span>
      </div>
      <div className="p-3">
        <p className="font-heading text-base">{submission.tileTitle}</p>

        {!rejecting ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={approve}
              disabled={busy !== null}
              className={cn(
                "flex h-16 items-center justify-center gap-2 rounded-2xl bg-mint/15 font-heading text-base text-mint disabled:opacity-50",
              )}
            >
              <Check className="size-6" /> ZATWIERDŹ
            </button>
            <button
              onClick={() => setRejecting(true)}
              disabled={busy !== null}
              className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-blood/15 font-heading text-base text-blood disabled:opacity-50"
            >
              <X className="size-6" /> ODRZUĆ
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
              placeholder="Krótki komentarz dla Pana Młodego…"
              className="h-12 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-off-white placeholder:text-fog/50 focus:border-blood focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRejecting(false)}
                className="h-12 rounded-xl border border-white/10 text-sm text-fog"
              >
                Anuluj
              </button>
              <button
                onClick={reject}
                disabled={!reason.trim() || busy !== null}
                className="h-12 rounded-xl bg-blood/20 text-sm font-semibold text-blood disabled:opacity-40"
              >
                Wyślij odrzucenie
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
