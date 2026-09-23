import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore, uid, today, convert, CURRENCIES, CATEGORIES } from "@/lib/store";
import { inputCls, btnCls } from "@/components/AppShell";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "المصروفات — فاتورتي" },
      { name: "description", content: "سجّل مصروفات عملك الحر حسب الفئة والعملة." },
      { property: "og:title", content: "المصروفات — فاتورتي" },
      { property: "og:description", content: "تتبع مصروفات المستقلين بسهولة." },
    ],
  }),
  component: Expenses,
});

function Expenses() {
  const { data, set, t, fmt } = useStore();
  const empty = { desc: "", amount: 0, currency: data.settings.currency, category: "software", date: today() };
  const [f, setF] = useState(empty);
  const base = data.settings.currency;
  const month = today().slice(0, 7);
  const monthTotal = data.expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + convert(e.amount, e.currency, base), 0);
  const add = () => { set((d) => ({ ...d, expenses: [...d.expenses, { id: uid(), ...f }] })); setF(empty); };
  const list = [...data.expenses].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">{t("expenses")}</h1>
        <div className="text-end"><p className="text-xs text-muted-foreground">{t("thisMonth")}</p><p className="font-bold text-destructive">{fmt(monthTotal, base)}</p></div>
      </div>
      <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <input className={inputCls} placeholder={t("description")} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min={0} className={inputCls} placeholder={t("amount")} value={f.amount || ""} onChange={(e) => setF({ ...f, amount: +e.target.value })} />
          <select className={inputCls} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select>
          <input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </div>
        <button disabled={!f.desc || !f.amount} onClick={add} className={`${btnCls} w-full`}><Plus className="h-4 w-4" />{t("addExpense")}</button>
      </div>
      {list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{t("noExpenses")}</p>}
      <div className="space-y-2">
        {list.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{e.desc}</p>
              <p className="text-xs text-muted-foreground">{t(e.category as (typeof CATEGORIES)[number])} · {e.date}</p>
            </div>
            <p className="shrink-0 text-sm font-bold">{fmt(e.amount, e.currency)}</p>
            <button aria-label={t("delete")} onClick={() => set((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== e.id) }))} className="shrink-0 p-1 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
