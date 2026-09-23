import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Share2, Trash2, CheckCircle2, Clock } from "lucide-react";
import { useStore, invoiceTotal, statusOf } from "@/lib/store";
import { StatusBadge, btnCls, btnGhost, inputCls } from "@/components/AppShell";
import { ReminderButtons } from "@/components/Reminders";

export const Route = createFileRoute("/invoices/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الفاتورة — فاتورتي" },
      { name: "description", content: "عرض الفاتورة وتصديرها PDF ومشاركتها." },
      { property: "og:title", content: "تفاصيل الفاتورة — فاتورتي" },
      { property: "og:description", content: "صدّر فاتورتك PDF وشاركها مباشرة." },
    ],
  }),
  component: InvoiceView,
});

async function makePdf(el: HTMLElement) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const w = 190, h = (canvas.height * w) / canvas.width;
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 10, 10, w, Math.min(h, 277));
  return pdf;
}

function InvoiceView() {
  const { id } = Route.useParams();
  const { data, set, t, fmt } = useStore();
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const inv = data.invoices.find((i) => i.id === id);
  if (!inv) return <div className="pt-10 text-center text-muted-foreground">{t("noInvoices")} · <Link to="/invoices" className="text-primary">{t("invoices")}</Link></div>;
  const c = data.clients.find((x) => x.id === inv.clientId);
  const no = String(inv.number).padStart(4, "0");
  const file = `invoice-${no}.pdf`;

  const download = async () => { setBusy(true); try { (await makePdf(ref.current!)).save(file); } finally { setBusy(false); } };
  const share = async () => {
    setBusy(true);
    try {
      const blob = (await makePdf(ref.current!)).output("blob");
      const f = new File([blob], file, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: `${t("invoiceNo")} ${no}` });
      else (await makePdf(ref.current!)).save(file);
    } catch { /* cancelled */ } finally { setBusy(false); }
  };
  const toggle = () => set((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === id ? { ...i, status: i.status === "paid" ? "pending" : "paid" } : i)) }));
  const del = () => { set((d) => ({ ...d, invoices: d.invoices.filter((i) => i.id !== id) })); nav({ to: "/invoices" }); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="truncate text-xl font-bold">{t("invoiceNo")} {no}</h1>
        <StatusBadge s={statusOf(inv)} />
      </div>
      <div ref={ref} className="overflow-hidden rounded-2xl border border-border bg-card p-5 text-card-foreground">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t("from")}</p>
            <p className="truncate font-bold">{data.settings.businessName || t("app")}</p>
          </div>
          <div className="text-end">
            <p className="text-lg font-bold text-primary">{t("invoiceNo")} {no}</p>
            <p className="text-xs text-muted-foreground">{t("issueDate")}: {inv.issueDate}</p>
            <p className="text-xs text-muted-foreground">{t("dueDate")}: {inv.dueDate}</p>
          </div>
        </div>
        <div className="py-4">
          <p className="text-xs text-muted-foreground">{t("billTo")}</p>
          <p className="font-semibold">{c?.name}</p>
          <p className="text-xs text-muted-foreground">{c?.email} {c?.phone}</p>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-xs text-muted-foreground">
            <th className="py-2 text-start font-medium">{t("description")}</th><th className="font-medium">{t("qty")}</th><th className="text-end font-medium">{t("total")}</th>
          </tr></thead>
          <tbody>{inv.items.map((it, k) => (
            <tr key={k} className="border-b border-border/60">
              <td className="py-2">{it.desc}<div className="text-xs text-muted-foreground">{fmt(it.price, inv.currency)}</div></td>
              <td className="text-center">{it.qty}</td><td className="text-end">{fmt(it.qty * it.price, inv.currency)}</td>
            </tr>))}
          </tbody>
        </table>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary p-3">
          <span className="font-semibold">{t("total")}</span><span className="text-lg font-bold">{fmt(invoiceTotal(inv), inv.currency)}</span>
        </div>
        {inv.notes && <p className="mt-3 text-xs text-muted-foreground">{inv.notes}</p>}
        {data.settings.plan === "free" && <p className="mt-4 text-center text-[10px] text-muted-foreground">{t("watermark")}</p>}
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <select className={inputCls} value={inv.recurring ?? "none"}
          onChange={(e) => set((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === id ? { ...i, recurring: e.target.value as "none", nextDone: false } : i)) }))}>
          {(["none", "weekly", "monthly"] as const).map((r) => <option key={r} value={r}>{t("recurring")}: {t(r)}</option>)}
        </select>
        {inv.status !== "paid" && <ReminderButtons inv={inv} />}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button disabled={busy} onClick={download} className={btnCls}><Download className="h-4 w-4" />{t("downloadPdf")}</button>
        <button disabled={busy} onClick={share} className={btnGhost}><Share2 className="h-4 w-4" />{t("share")}</button>
        <button onClick={toggle} className={btnGhost}>{inv.status === "paid" ? <><Clock className="h-4 w-4" />{t("markPending")}</> : <><CheckCircle2 className="h-4 w-4" />{t("markPaid")}</>}</button>
        <button onClick={del} className={`${btnGhost} text-destructive`}><Trash2 className="h-4 w-4" />{t("delete")}</button>
      </div>
    </div>
  );
}
