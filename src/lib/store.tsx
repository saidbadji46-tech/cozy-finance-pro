import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dict, type Lang, type TKey } from "./i18n";

export type Client = { id: string; name: string; email: string; phone: string; address?: string; notes?: string };
export type Item = { desc: string; qty: number; price: number };
export type Invoice = {
  id: string; number: number; clientId: string; currency: string; items: Item[];
  issueDate: string; dueDate: string; status: "paid" | "pending"; notes: string;
  recurring?: "none" | "weekly" | "monthly"; nextDone?: boolean; lastReminder?: string;
};
export type Expense = { id: string; desc: string; amount: number; currency: string; category: string; date: string };
export type Settings = { lang: Lang; currency: string; plan: "free" | "pro"; businessName: string };
export type Data = { clients: Client[]; invoices: Invoice[]; expenses: Expense[]; settings: Settings };

export const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "KWD", "EGP", "MAD"];
const RATES: Record<string, number> = { USD: 1, EUR: 1.08, GBP: 1.27, SAR: 0.267, AED: 0.272, KWD: 3.25, EGP: 0.0206, MAD: 0.1 };
export const CATEGORIES = ["software", "equipment", "travel", "office", "marketing", "other"] as const;
export const FREE_INVOICES_PER_MONTH = 5;
export const FREE_CLIENTS = 3;

export const convert = (a: number, from: string, to: string) => (a * (RATES[from] ?? 1)) / (RATES[to] ?? 1);
export const invoiceTotal = (i: Invoice) => i.items.reduce((s, it) => s + it.qty * it.price, 0);
export const today = () => new Date().toISOString().slice(0, 10);
export const statusOf = (i: Invoice) => (i.status === "paid" ? "paid" : i.dueDate < today() ? "overdue" : "pending");
const addDays = (d: string, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const addMonths = (d: string, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x.toISOString().slice(0, 10); };
export const shiftDate = (d: string, r: "weekly" | "monthly") => (r === "weekly" ? addDays(d, 7) : addMonths(d, 1));
export function generateRecurring(d: Data): Data {
  const invoices = [...d.invoices];
  let changed = false, guard = 0;
  for (let k = 0; k < invoices.length && guard < 200; k++) {
    const inv = invoices[k]!;
    if (!inv.recurring || inv.recurring === "none" || inv.nextDone) continue;
    const next = shiftDate(inv.issueDate, inv.recurring);
    if (next > today()) continue;
    guard++; changed = true;
    invoices[k] = { ...inv, nextDone: true };
    const { lastReminder: _lr, ...rest } = inv; void _lr;
    invoices.push({ ...rest, id: uid(), number: Math.max(...invoices.map((i) => i.number)) + 1, issueDate: next,
      dueDate: shiftDate(inv.dueDate, inv.recurring), status: "pending", nextDone: false });
  }
  return changed ? { ...d, invoices } : d;
}
export const uid = () => Math.random().toString(36).slice(2, 10);

const KEY = "fatorati-v1";
const initial: Data = { clients: [], invoices: [], expenses: [], settings: { lang: "ar", currency: "USD", plan: "free", businessName: "" } };

type Ctx = { data: Data; set: (fn: (d: Data) => Data) => void; t: (k: TKey) => string; fmt: (n: number, c: string) => string };
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) { const p = JSON.parse(s); setData(generateRecurring({ ...initial, ...p, settings: { ...initial.settings, ...p.settings } })); }
    } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(data)); }, [data, ready]);
  useEffect(() => {
    document.documentElement.lang = data.settings.lang;
    document.documentElement.dir = data.settings.lang === "ar" ? "rtl" : "ltr";
  }, [data.settings.lang]);
  const lang = data.settings.lang;
  const t = (k: TKey) => dict[lang][k] ?? k;
  const fmt = (n: number, c: string) =>
    new Intl.NumberFormat(lang === "ar" ? "ar-u-nu-latn" : "en-US", { style: "currency", currency: c, maximumFractionDigits: 2 }).format(n);
  return <StoreCtx.Provider value={{ data, set: setData, t, fmt }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}
