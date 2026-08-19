import { Dumbbell, Users, PartyPopper, Mic2, Palmtree, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/types";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  SPORT: Dumbbell,
  LUDZIE: Users,
  EKIPA: PartyPopper,
  WSTYD: Mic2,
  MALTA: Palmtree,
};

export const CATEGORY_LABEL: Record<Category, string> = {
  SPORT: "Sport",
  LUDZIE: "Ludzie",
  EKIPA: "Ekipa",
  WSTYD: "Wstyd",
  MALTA: "Malta",
};
