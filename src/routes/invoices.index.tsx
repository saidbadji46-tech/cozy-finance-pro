import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore, statusOf } from "@/lib/store";
import { InvoiceRow } from "./index";

export const Route = createFileRoute("/invoices/")({
  head: () => ({
    meta: [
      { title: "الفواتير — فاتورتي" },
      { name: "description", content: "كل فواتيرك مع حالتها: مدفوعة، معلقة، أو متأخرة." },
      { property: "og:title", content: "الفواتير — فاتورتي" },
      { property: "og:description", content: "تتبع حالة فواتيرك بسهولة من الهاتف." },
    ],
  }),
  component: Invoices,
});

function Invoices() {
  const { data, t } = useStore();
  const [f, setF] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const list = [...data.invoices].sort((a, b) => b.number - a.number).filter((i) => f === "all" || statusOf(i) === f);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("invoices")}</h1>
      <div className="flex gap-2 overflow-x-auto">
        {(["all", "paid", "pending", "overdue"] as const).map((k) => (
          <button key={k} onClick={() => setF(k)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${f === k ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}>
            {t(k)} ({k === "all" ? data.invoices.length : data.invoices.filter((i) => statusOf(i) === k).length})
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t("noInvoices")}</p>}
      <div className="space-y-2">{list.map((i) => <InvoiceRow key={i.id} id={i.id} />)}</div>
      <Link to="/invoices/new" aria-label={t("newInvoice")}
        className="fixed bottom-24 end-[max(1.25rem,calc(50vw-14rem+1.25rem))] grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-xl">
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
