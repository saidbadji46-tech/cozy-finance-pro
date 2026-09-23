import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, Trash2, Pencil, Plus } from "lucide-react";
import { useStore, convert, invoiceTotal } from "@/lib/store";
import { inputCls, btnCls, btnGhost } from "@/components/AppShell";
import { InvoiceRow } from "./index";

export const Route = createFileRoute("/clients/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل العميل — فاتورتي" },
      { name: "description", content: "بيانات العميل وفواتيره والمبالغ المستحقة." },
      { property: "og:title", content: "تفاصيل العميل — فاتورتي" },
      { property: "og:description", content: "إدارة بيانات العميل وفواتيره." },
    ],
  }),
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();
  const { data, set, t, fmt } = useStore();
  const nav = useNavigate();
  const c = data.clients.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(c ?? { id, name: "", email: "", phone: "", address: "", notes: "" });
  if (!c) return <div className="pt-10 text-center text-muted-foreground">{t("noClients")} · <Link to="/clients" className="text-primary">{t("clients")}</Link></div>;
  const base = data.settings.currency;
  const invs = data.invoices.filter((i) => i.clientId === id).sort((a, b) => b.number - a.number);
  const billed = invs.reduce((s, i) => s + convert(invoiceTotal(i), i.currency, base), 0);
  const due = invs.filter((i) => i.status !== "paid").reduce((s, i) => s + convert(invoiceTotal(i), i.currency, base), 0);
  const save = () => { set((d) => ({ ...d, clients: d.clients.map((x) => (x.id === id ? { ...f, id } : x)) })); setEditing(false); };
  const del = () => { set((d) => ({ ...d, clients: d.clients.filter((x) => x.id !== id) })); nav({ to: "/clients" }); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">{c.name[0]}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{c.name}</h1>
          <p className="truncate text-xs text-muted-foreground">{c.address}</p>
        </div>
        <button onClick={() => setEditing((e) => !e)} aria-label={t("edit")} className="shrink-0 rounded-full border border-border p-2"><Pencil className="h-4 w-4" /></button>
      </div>
      {editing ? (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <input className={inputCls} placeholder={t("name")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={inputCls} placeholder={t("email")} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input className={inputCls} placeholder={t("phone")} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input className={inputCls} placeholder={t("address")} value={f.address ?? ""} onChange={(e) => setF({ ...f, address: e.target.value })} />
          <textarea className={inputCls} rows={2} placeholder={t("notes")} value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={save} disabled={!f.name.trim()} className={btnCls}>{t("save")}</button>
            <button onClick={del} className={`${btnGhost} text-destructive`}><Trash2 className="h-4 w-4" />{t("delete")}</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {c.phone && <a href={`tel:${c.phone}`} className={btnGhost}><Phone className="h-4 w-4" />{c.phone}</a>}
          {c.email && <a href={`mailto:${c.email}`} className={`${btnGhost} min-w-0`}><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{c.email}</span></a>}
        </div>
      )}
      {c.notes && !editing && <p className="rounded-2xl bg-secondary p-3 text-sm">{c.notes}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{t("totalBilled")}</p><p className="font-bold">{fmt(billed, base)}</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{t("outstanding")}</p><p className="font-bold text-destructive">{fmt(due, base)}</p></div>
      </div>
      <Link to="/invoices/new" search={{ client: id }} className={`${btnCls} w-full`}><Plus className="h-4 w-4" />{t("newInvoice")}</Link>
      <div className="space-y-2">
        {invs.length === 0 && <p className="text-center text-sm text-muted-foreground">{t("noInvoices")}</p>}
        {invs.map((i) => <InvoiceRow key={i.id} id={i.id} />)}
      </div>
    </div>
  );
}
