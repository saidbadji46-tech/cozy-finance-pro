import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { useStore, uid, convert, invoiceTotal, FREE_CLIENTS } from "@/lib/store";
import { inputCls, btnCls } from "@/components/AppShell";

export const Route = createFileRoute("/clients/")({
  head: () => ({
    meta: [
      { title: "العملاء — فاتورتي" },
      { name: "description", content: "أدر عملاءك وتابع ما دفعوه وما عليهم." },
      { property: "og:title", content: "العملاء — فاتورتي" },
      { property: "og:description", content: "إدارة العملاء للمستقلين." },
    ],
  }),
  component: Clients,
});

function Clients() {
  const { data, set, t, fmt } = useStore();
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const blocked = data.settings.plan === "free" && data.clients.length >= FREE_CLIENTS;
  const add = () => { set((d) => ({ ...d, clients: [...d.clients, { id: uid(), ...f }] })); setF({ name: "", email: "", phone: "" }); };
  const base = data.settings.currency;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("clients")}</h1>
      {blocked ? (
        <div className="rounded-2xl border border-accent bg-accent/15 p-4 text-sm">
          {t("limitReached")} <Link to="/pro" className="font-semibold text-primary underline">{t("upgrade")}</Link>
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <input className={inputCls} placeholder={t("name")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} type="email" placeholder={t("email")} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <input className={inputCls} type="tel" placeholder={t("phone")} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
          <button disabled={!f.name.trim()} onClick={add} className={`${btnCls} w-full`}><UserPlus className="h-4 w-4" />{t("addClient")}</button>
        </div>
      )}
      {data.clients.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{t("noClients")}</p>}
      <div className="space-y-2">
        {data.clients.map((c) => {
          const invs = data.invoices.filter((i) => i.clientId === c.id);
          const sum = invs.reduce((s, i) => s + convert(invoiceTotal(i), i.currency, base), 0);
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary font-bold text-primary">{c.name[0]}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{invs.length} {t("invoicesCount")} · {fmt(sum, base)}</p>
              </div>
              <button aria-label={t("delete")} onClick={() => set((d) => ({ ...d, clients: d.clients.filter((x) => x.id !== c.id) }))} className="shrink-0 p-2 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
