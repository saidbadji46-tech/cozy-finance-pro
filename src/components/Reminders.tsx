import { Link } from "@tanstack/react-router";
import { Bell, Mail, MessageCircle } from "lucide-react";
import { useStore, invoiceTotal, statusOf, today, type Invoice } from "@/lib/store";
import { StatusBadge } from "./AppShell";

export function useReminder() {
  const { data, set, t, fmt } = useStore();
  return (inv: Invoice, via: "whatsapp" | "email") => {
    const c = data.clients.find((x) => x.id === inv.clientId);
    const msg = t("reminderMsg")
      .replace("{name}", c?.name ?? "")
      .replace("{no}", String(inv.number).padStart(4, "0"))
      .replace("{amt}", fmt(invoiceTotal(inv), inv.currency))
      .replace("{due}", inv.dueDate);
    const url = via === "whatsapp"
      ? `https://wa.me/${(c?.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`
      : `mailto:${c?.email ?? ""}?subject=${encodeURIComponent(`${t("invoiceNo")} ${inv.number}`)}&body=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    set((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === inv.id ? { ...i, lastReminder: today() } : i)) }));
  };
}

export function ReminderButtons({ inv }: { inv: Invoice }) {
  const { t } = useStore();
  const remind = useReminder();
  return (
    <div className="flex shrink-0 gap-1.5">
      <button onClick={() => remind(inv, "whatsapp")} aria-label={t("whatsapp")} className="grid h-9 w-9 place-items-center rounded-full bg-success/15 text-success"><MessageCircle className="h-4 w-4" /></button>
      <button onClick={() => remind(inv, "email")} aria-label={t("email")} className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-primary"><Mail className="h-4 w-4" /></button>
    </div>
  );
}

export function RemindersPanel() {
  const { data, t, fmt } = useStore();
  const soon = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  const list = data.invoices.filter((i) => i.status !== "paid" && i.dueDate <= soon).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Bell className="h-4 w-4 text-accent" />{t("reminders")}</p>
      {list.length === 0 && <p className="text-xs text-muted-foreground">{t("noReminders")}</p>}
      <div className="space-y-2">
        {list.map((i) => {
          const c = data.clients.find((x) => x.id === i.clientId);
          const s = statusOf(i);
          return (
            <div key={i.id} className="flex items-center gap-2">
              <Link to="/invoices/$id" params={{ id: i.id }} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c?.name} · {fmt(invoiceTotal(i), i.currency)}</p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  {s === "overdue" ? <StatusBadge s="overdue" /> : <span>{t("dueSoon")}</span>} {i.dueDate}
                  {i.lastReminder && <span>· {t("lastReminded")} {i.lastReminder}</span>}
                </p>
              </Link>
              <ReminderButtons inv={i} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
