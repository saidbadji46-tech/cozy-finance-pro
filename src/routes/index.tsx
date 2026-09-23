import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Plus } from "lucide-react";
import { useStore, convert, invoiceTotal, statusOf } from "@/lib/store";
import { StatusBadge, btnCls } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "فاتورتي — لوحة تحكم الفواتير والأرباح" },
      { name: "description", content: "تابع إيراداتك ومصروفاتك وأرباحك كمستقل من هاتفك." },
      { property: "og:title", content: "فاتورتي — فواتير ومصروفات المستقلين" },
      { property: "og:description", content: "أنشئ فواتير PDF، تابع العملاء والأرباح بعملات متعددة." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, t, fmt } = useStore();
  const base = data.settings.currency;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const inc = data.invoices.filter((i) => i.status === "paid").reduce((s, i) => s + convert(invoiceTotal(i), i.currency, base), 0);
  const pend = data.invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + convert(invoiceTotal(i), i.currency, base), 0);
  const exp = data.expenses.reduce((s, e) => s + convert(e.amount, e.currency, base), 0);

  const months = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - k));
    const key = d.toISOString().slice(0, 7);
    return {
      name: d.toLocaleDateString(data.settings.lang === "ar" ? "ar" : "en", { month: "short" }),
      income: Math.round(data.invoices.filter((i) => i.status === "paid" && i.issueDate.startsWith(key)).reduce((s, i) => s + convert(invoiceTotal(i), i.currency, base), 0)),
      expenses: Math.round(data.expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + convert(e.amount, e.currency, base), 0)),
    };
  });
  const recent = [...data.invoices].sort((a, b) => b.number - a.number).slice(0, 4);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg">
        <p className="text-sm opacity-80">{t("profit")}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{fmt(inc - exp, base)}</p>
        <p className="mt-3 text-xs opacity-70">{t("approx")} {base}</p>
      </section>
      <div className="grid grid-cols-3 gap-3">
        {[
          [t("income"), inc, "text-success"],
          [t("pendingAmt"), pend, "text-warning-foreground"],
          [t("expensesTotal"), exp, "text-destructive"],
        ].map(([l, v, c]) => (
          <div key={l as string} className="min-w-0 rounded-2xl border border-border bg-card p-3">
            <p className="truncate text-[11px] text-muted-foreground">{l}</p>
            <p className={`mt-1 truncate text-sm font-bold ${c}`}>{fmt(v as number, base)}</p>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold">{t("last6")}</p>
        <div className="h-44">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} reversed={data.settings.lang === "ar"} />
                <Tooltip formatter={(v: number) => fmt(v, base)} />
                <Bar dataKey="income" name={t("income")} fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name={t("expensesTotal")} fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
      <Link to="/invoices/new" className={`${btnCls} w-full`}><Plus className="h-4 w-4" />{t("newInvoice")}</Link>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-semibold">{t("recent")}</p>
          <Link to="/invoices" className="text-sm text-primary">{t("viewAll")}</Link>
        </div>
        {recent.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t("noInvoices")}</p>}
        <div className="space-y-2">
          {recent.map((i) => <InvoiceRow key={i.id} id={i.id} />)}
        </div>
      </section>
    </div>
  );
}

export function InvoiceRow({ id }: { id: string }) {
  const { data, fmt } = useStore();
  const i = data.invoices.find((x) => x.id === id)!;
  const c = data.clients.find((x) => x.id === i.clientId);
  return (
    <Link to="/invoices/$id" params={{ id }} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{c?.name ?? "—"}</p>
        <p className="text-xs text-muted-foreground">#{String(i.number).padStart(4, "0")} · {i.dueDate}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-sm font-bold">{fmt(invoiceTotal(i), i.currency)}</p>
        <StatusBadge s={statusOf(i)} />
      </div>
    </Link>
  );
}
