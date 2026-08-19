"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check, Upload, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTileContentAction } from "@/lib/actions/admin-tiles";
import {
  clearTileVideoAction,
  updateBrideNameAction,
  uploadFaceAction,
  uploadTileVideoAction,
} from "@/lib/actions/admin-media";
import { CATEGORY_LABEL } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Category, Tile } from "@/lib/types";

const CATEGORIES: Category[] = ["SPORT", "LUDZIE", "EKIPA", "WSTYD", "MALTA"];

const schema = z.object({
  title: z.string().min(1, "Wymagane"),
  description: z.string().min(1, "Wymagane"),
  category: z.enum(["SPORT", "LUDZIE", "EKIPA", "WSTYD", "MALTA"]),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  location: z.string().optional(),
  requiresProof: z.boolean(),
  requiresApproval: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

interface TileEditFormProps {
  tile: Tile;
  groomPhoto: string | null;
  bridePhoto: string | null;
  brideName: string | null;
}

export function TileEditForm({ tile, groomPhoto, bridePhoto, brideName }: TileEditFormProps) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: tile.title,
      description: tile.description,
      category: tile.category,
      difficulty: tile.difficulty,
      location: tile.location ?? "",
      requiresProof: tile.requiresProof,
      requiresApproval: tile.requiresApproval,
    },
  });

  async function onSubmit(values: FormValues) {
    setSaved(false);
    const res = await updateTileContentAction(tile.id, {
      title: values.title,
      description: values.description,
      category: values.category,
      difficulty: values.difficulty,
      location: values.location?.trim() || null,
      requiresProof: values.requiresProof,
      requiresApproval: values.requiresApproval,
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const category = watch("category");

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm text-fog">
        <ArrowLeft className="size-4" /> Wróć do dashboardu
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="glass flex flex-col gap-4 rounded-2xl p-4">
        <h2 className="font-heading text-sm tracking-[0.2em] text-fog">TREŚĆ ZADANIA</h2>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue("category", c)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                category === c
                  ? "border-cyan bg-cyan/15 text-cyan"
                  : "border-white/10 text-fog",
              )}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          Tytuł
          <input
            {...register("title")}
            className="h-12 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-off-white focus:border-cyan focus:outline-none"
          />
          {errors.title && <span className="text-xs text-blood">{errors.title.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Opis
          <textarea
            {...register("description")}
            rows={5}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 leading-relaxed text-off-white focus:border-cyan focus:outline-none"
          />
          {errors.description && (
            <span className="text-xs text-blood">{errors.description.message}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Lokalizacja (opcjonalnie)
          <input
            {...register("location")}
            className="h-12 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-off-white focus:border-cyan focus:outline-none"
          />
        </label>

        <div>
          <p className="mb-1.5 text-sm">Trudność</p>
          <div className="flex gap-2">
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setValue("difficulty", d as 1 | 2 | 3)}
                className={cn(
                  "flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-semibold",
                  watch("difficulty") === d
                    ? "border-magenta bg-magenta/15 text-magenta"
                    : "border-white/10 text-fog",
                )}
              >
                {"🔥".repeat(d)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-off-white">
            <input type="checkbox" {...register("requiresProof")} className="size-4" />
            Wymaga dowodu
          </label>
          <label className="flex items-center gap-2 text-sm text-off-white">
            <input type="checkbox" {...register("requiresApproval")} className="size-4" />
            Wymaga akceptacji admina
          </label>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-14 gap-2 rounded-2xl font-heading text-base tracking-wide"
          style={{
            background: saved ? "var(--color-mint)" : "var(--grad-cool)",
            color: "var(--color-void)",
          }}
        >
          {saved ? (
            <>
              <Check className="size-5" /> ZAPISANO
            </>
          ) : (
            "ZAPISZ"
          )}
        </Button>
      </form>

      <TileVideoUploader tileId={tile.id} videoUrl={tile.videoUrl ?? null} />

      <FaceUploaders groomPhoto={groomPhoto} bridePhoto={bridePhoto} brideName={brideName} />
    </div>
  );
}

function TileVideoUploader({ tileId, videoUrl }: { tileId: number; videoUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(videoUrl);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const formData = new FormData();
    formData.set("file", file);
    const res = await uploadTileVideoAction(tileId, formData);
    if (res.ok) setCurrent(URL.createObjectURL(file));
    setBusy(false);
  }

  async function clear() {
    setBusy(true);
    const res = await clearTileVideoAction(tileId);
    if (res.ok) setCurrent(null);
    setBusy(false);
  }

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-4">
      <h2 className="font-heading text-sm tracking-[0.2em] text-fog">
        WIDEO / AUDIO ZAMIAST REVEAL
      </h2>
      <p className="text-xs text-fog">
        Jeśli narzeczona nagra to zadanie swoim głosem — karta zadania odtworzy
        wideo zamiast animacji (BRIEF §9).
      </p>
      {current && <video src={current} controls className="w-full rounded-xl" />}
      <input ref={inputRef} type="file" accept="video/*,audio/*" className="hidden" onChange={handleFile} />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/10 text-xs font-semibold text-off-white disabled:opacity-40"
        >
          <Video className="size-4" /> WGRAJ
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={busy || !current}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/10 text-xs font-semibold text-fog disabled:opacity-40"
        >
          <X className="size-4" /> USUŃ
        </button>
      </div>
    </div>
  );
}

function FaceUploaders({
  groomPhoto,
  bridePhoto,
  brideName,
}: {
  groomPhoto: string | null;
  bridePhoto: string | null;
  brideName: string | null;
}) {
  const [name, setName] = useState(brideName ?? "");
  const [nameSaved, setNameSaved] = useState(false);

  async function saveName() {
    const res = await updateBrideNameAction(name);
    if (res.ok) {
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
  }

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-4">
      <h2 className="font-heading text-sm tracking-[0.2em] text-fog">
        TWARZE DO MINIGIER
      </h2>
      <p className="text-xs text-fog">
        Globalne dla całej gry (BRIEF §7.1, §7.2) — używane w Drink Runnerze i
        Pokusie, niezależnie od tego, z którego zadania je wgrasz.
      </p>

      <FaceSlot role="groom" label="Pan Młody" photo={groomPhoto} />
      <FaceSlot role="bride" label="Narzeczona" photo={bridePhoto} />

      <label className="flex flex-col gap-1.5 text-sm">
        Imię narzeczonej (widoczne w Pokusie zamiast etykiety &bdquo;NARZECZONA&rdquo;)
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-off-white focus:border-magenta focus:outline-none"
          />
          <button
            type="button"
            onClick={saveName}
            className="rounded-xl px-4 text-sm font-semibold"
            style={{
              background: nameSaved ? "var(--color-mint)" : "var(--grad-hot)",
              color: "var(--color-void)",
            }}
          >
            {nameSaved ? "OK" : "Zapisz"}
          </button>
        </div>
      </label>
    </div>
  );
}

function FaceSlot({
  role,
  label,
  photo,
}: {
  role: "groom" | "bride";
  label: string;
  photo: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(photo);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const formData = new FormData();
    formData.set("role", role);
    formData.set("file", file);
    const res = await uploadFaceAction(formData);
    if (res.ok) setCurrent(URL.createObjectURL(file));
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={label} className="size-full object-cover" />
        ) : (
          <Upload className="size-5 text-fog" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm text-off-white">{label}</p>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="text-xs font-semibold text-cyan disabled:opacity-40"
        >
          {current ? "Zmień zdjęcie" : "Wgraj zdjęcie"}
        </button>
      </div>
    </div>
  );
}
