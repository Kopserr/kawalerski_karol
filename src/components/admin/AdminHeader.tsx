"use client";

import Link from "next/link";
import { LogOut, ShieldAlert } from "lucide-react";
import { signOutAction } from "@/lib/actions/admin-auth";

export function AdminHeader({ title }: { title: string }) {
  return (
    <header className="safe-top sticky top-0 z-20 glass flex items-center justify-between rounded-b-2xl px-4 py-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-fog">Panel admina</p>
        <h1 className="font-heading text-lg leading-none">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/admin/danger"
          aria-label="Strefa niebezpieczna"
          className="flex size-9 items-center justify-center rounded-full border border-blood/30 bg-blood/10 text-blood"
        >
          <ShieldAlert className="size-4" />
        </Link>
        <button
          onClick={() => signOutAction()}
          aria-label="Wyloguj"
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
