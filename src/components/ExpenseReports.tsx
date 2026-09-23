import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Line, LineChart, XAxis, Tooltip } from "recharts";
import { useStore, convert, CATEGORIES } from "@/lib/store";

const COLORS = ["var(--color-primary)", "var(--color-accent)", "var(--color-success)", "var(--color-destructive)", "var(--color-chart-2)", "var(--color-muted-foreground)"];

export function ExpenseReports() {
  const { data, t, fmt } = useStore();
  const [period, setPeriod] = useState<"m1" | "m3" | "m12" | "allTime">("m1");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const base = data.settings.currency;
  const months = { m1: 1, m3: 3, m12: 12, allTime: 1200 }[period];
  const start = new Date(); start.setDate(1); start.setMonth(start.getMonth() - (months - 1));
  const from = start.toISOString().slice(0, 10);
  const list = data.expenses.filter((e) => e.date >= from);
  const total = list.reduce((s, e) => s + convert(e.amount, e.currency, base), 0);
  const byCat = CATEGORIES.map((c) => ({ key: c, name: t(c), value: list.filter((e) => e.category === c).reduce((s, e) => s + convert(e.amount, e.currency, base), 0) }))
    .filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
  const span = period === "allTime" ? Math.max(1, new Set(list.map((e) => e.date.slice(0, 7))).size) : months;
  const trend = Array.from({ length: 12 }, (_, k) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (11 - k));
    const key = d.toISOString().slice(0, 7);
    return { name: d.toLocaleDateString(data.settings.lang, { month: "short" }), v: Math.round(data.expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + convert(e.amount, e.currency, base), 0)) };
  });

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <p className="font-semibold">{t("reports")}</p>
      <div className="flex gap-1.5 overflow-x-auto">
        {(["m1", "m3", "m12", "allTime"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${period === p ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{t(p)}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="min-w-0 rounded-xl bg-muted p-2"><p className="text-[10px] text-muted-foreground">{t("total")}</p><p className="truncate text-sm font-bold">{fmt(total, base)}</p></div>
        <div className="min-w-0 rounded-xl bg-muted p-2"><p className="text-[10px] text-muted-foreground">{t("avgMonth")}</p><p className="truncate text-sm font-bold">{fmt(total / span, base)}</p></div>
        <div className="min-w-0 rounded-xl bg-muted p-2"><p className="text-[10px] text-muted-foreground">{t("topCategory")}</p><p className="truncate text-sm font-bold">{byCat[0]?.name ?? "—"}</p></div>
      </div>
      <p className="text-xs font-semibold text-muted-foreground">{t("byCategory")}</p>
      {byCat.length === 0 ? <p className="text-xs text-muted-foreground">{t("noExpenses")}</p> : (
        <div className="flex items-center gap-3">
          <div className="h-28 w-28 shrink-0">
            {mounted && <ResponsiveContainer><PieChart><Pie data={byCat} dataKey="value" innerRadius={30} outerRadius={52} stroke="none">
              {byCat.map((c) => <Cell key={c.key} fill={COLORS[CATEGORIES.indexOf(c.key)] ?? "gray"} />)}</Pie></PieChart></ResponsiveContainer>}
          </div>
          <ul className="min-w-0 flex-1 space-y-1 text-xs">
            {byCat.map((c) => (
              <li key={c.key} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[CATEGORIES.indexOf(c.key)] }} />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="shrink-0 font-semibold">{Math.round((c.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs font-semibold text-muted-foreground">{t("monthlyTrend")}</p>
      <div className="h-32">
        {mounted && <ResponsiveContainer><LineChart data={trend}>
          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} reversed={data.settings.lang === "ar"} interval={1} />
          <Tooltip formatter={(v) => fmt(Number(v ?? 0), base)} />
          <Line dataKey="v" name={t("expensesTotal")} stroke="var(--color-destructive)" strokeWidth={2} dot={false} />
        </LineChart></ResponsiveContainer>}
      </div>
    </section>
  );
}
