import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore, uid, today, CURRENCIES, FREE_INVOICES_PER_MONTH, type Item } from "@/lib/store";
import { inputCls, btnCls, btnGhost } from "@/components/AppShell";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({
    meta: [
      { title: "فاتورة جديدة — فاتورتي" },
      { name: "description", content: "أنشئ فاتورة احترافية في ثوانٍ." },
      { property: "og:title", content: "فاتورة جديدة — فاتورتي" },
      { property: "og:description", content: "أنشئ فاتورة احترافية وصدّرها PDF." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { client?: string } => (typeof s["client"] === "string" ? { client: s["client"] } : {}),
  component: NewInvoice,
});

function NewInvoice() {
  const { data, set, t, fmt } = useStore();
  const nav = useNavigate();
  const due = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  const search = Route.useSearch();
  const [clientId, setClientId] = useState(search.client ?? "");
  const [recurring, setRecurring] = useState<"none" | "weekly" | "monthly">("none");
  const [currency, setCurrency] = useState(data.settings.currency);
  const [issueDate, setIssue] = useState(today());
  const [dueDate, setDue] = useState(due);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([{ desc: "", qty: 1, price: 0 }]);

  const month = today().slice(0, 7);
  const usedThisMonth = data.invoices.filter((i) => i.issueDate.startsWith(month)).length;
  const blocked = data.settings.plan === "free" && usedThisMonth >= FREE_INVOICES_PER_MONTH;
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const upd = (k: number, p: Partial<Item>) => setItems((a) => a.map((x, j) => (j === k ? { ...x, ...p } : x)));

  if (data.clients.length === 0)
    return (
      <div className="space-y-4 pt-10 text-center">
        <p className="text-muted-foreground">{t("needClient")}</p>
        <Link to="/clients" className={btnCls}>{t("addClient")}</Link>
      </div>
    );
  if (blocked)
    return (
      <div className="space-y-4 pt-10 text-center">
        <p className="text-muted-foreground">{t("limitReached")}</p>
        <Link to="/pro" className={btnCls}>{t("upgrade")}</Link>
      </div>
    );

  const save = () => {
    const id = uid();
    const number = Math.max(0, ...data.invoices.map((i) => i.number)) + 1;
    set((d) => ({ ...d, invoices: [...d.invoices, { id, number, clientId, currency, issueDate, dueDate, notes, recurring, status: "pending", items: items.filter((i) => i.desc) }] }));
    nav({ to: "/invoices/$id", params: { id } });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("newInvoice")}</h1>
      <label className="block space-y-1 text-sm">{t("client")}
        <select className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">{t("selectClient")}</option>
          {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="space-y-1 text-sm">{t("currency")}
          <select className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">{t("issueDate")}<input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssue(e.target.value)} /></label>
        <label className="space-y-1 text-sm">{t("dueDate")}<input type="date" className={inputCls} value={dueDate} onChange={(e) => setDue(e.target.value)} /></label>
      </div>
      <label className="block space-y-1 text-sm">{t("recurring")}
        <select className={inputCls} value={recurring} onChange={(e) => setRecurring(e.target.value as "none")}>
          {(["none", "weekly", "monthly"] as const).map((r) => <option key={r} value={r}>{t(r)}</option>)}
        </select>
      </label>
      <div className="space-y-2">
        <p className="text-sm font-semibold">{t("items")}</p>
        {items.map((it, k) => (
          <div key={k} className="space-y-2 rounded-2xl border border-border bg-card p-3">
            <div className="flex gap-2">
              <input className={inputCls} placeholder={t("description")} value={it.desc} onChange={(e) => upd(k, { desc: e.target.value })} />
              {items.length > 1 && <button onClick={() => setItems((a) => a.filter((_, j) => j !== k))} className="shrink-0 px-2 text-destructive"><Trash2 className="h-4 w-4" /></button>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={0} className={inputCls} placeholder={t("qty")} value={it.qty} onChange={(e) => upd(k, { qty: +e.target.value })} />
              <input type="number" min={0} className={inputCls} placeholder={t("price")} value={it.price || ""} onChange={(e) => upd(k, { price: +e.target.value })} />
            </div>
          </div>
        ))}
        <button onClick={() => setItems((a) => [...a, { desc: "", qty: 1, price: 0 }])} className={`${btnGhost} w-full`}><Plus className="h-4 w-4" />{t("addItem")}</button>
      </div>
      <textarea className={inputCls} rows={2} placeholder={t("notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex items-center justify-between rounded-2xl bg-secondary p-4">
        <span className="font-semibold">{t("total")}</span><span className="text-xl font-bold">{fmt(total, currency)}</span>
      </div>
      <button disabled={!clientId || !items.some((i) => i.desc)} onClick={save} className={`${btnCls} w-full`}>{t("save")}</button>
    </div>
  );
}
