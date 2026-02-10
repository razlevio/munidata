import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    month: "numeric",
    year: "2-digit",
  })
    .format(date)
    .replace("/", "/");
}