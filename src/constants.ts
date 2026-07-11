import type { Category, Expense } from './types';

export const CATEGORIES: Category[] = [
  { id: "food", name: "Food", icon: "🍜", color: "#C9622F" },
  { id: "travel", name: "Travel", icon: "✈️", color: "#3E7DB5" },
  { id: "leisure", name: "Leisure", icon: "🎬", color: "#9B5DC0" },
  { id: "misc", name: "Miscellaneous", icon: "🧾", color: "#8A8676" },
  { id: "habits", name: "Habits", icon: "☕", color: "#B5853E" },
  { id: "growth", name: "Self Growth", icon: "📚", color: "#4A8C6E" },
];

export const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export const LS_ENTRIES = "ledger_entries_v1";
export const LS_CAPS = "ledger_caps_v1";
export const LS_THEME = "ledger_theme_v1";

// Format money as Indian locale currency (e.g. ₹1,23,456.78)
export const fmt = (n: number): string => {
  return "₹" + (Math.round(n * 100) / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
};

export const pad = (n: number): string => String(n).padStart(2, '0');

export const dkey = (d: Date): string => {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const startOfWeek = (d: Date): Date => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const startOfMonth = (d: Date): Date => {
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export const endOfMonth = (d: Date): Date => {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
};

export const inRange = (d: Date, from: Date, to: Date): boolean => {
  return d >= from && d <= to;
};

export const sum = (list: Expense[]): number => {
  return list.reduce((acc, e) => acc + e.amount, 0);
};

export const entriesBetween = (entries: Expense[], from: Date, to: Date): Expense[] => {
  return entries.filter(e => {
    const d = new Date(e.date + "T00:00:00");
    return inRange(d, from, to);
  });
};
