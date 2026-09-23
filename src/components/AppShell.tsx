import { Link } from "@tanstack/react-router";
import { Home, FileText, Users, Wallet, Crown, Languages } from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, data, set } = useStore();
  const nav = [
    { to: "/", icon: Home, label: t("home") },
    { to: "/invoices", icon: FileText, label: t("invoices") },
    { to: "/clients", icon: Users, label: t("clients") },
    { to: "/expenses", icon: Wallet, label: t("expenses") },
    { to: "/pro", icon: Crown, label: t("pro") },
  ] as const;
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-5 py-3 backdrop-blur">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">ف</span>
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight">{t("app")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("tagline")}</p>
          </div>
        </Link>
        <button
          onClick={() => set((d) => ({ ...d, settings: { ...d.settings, lang: d.settings.lang === "ar" ? "en" : "ar" } }))}
          className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm font-medium"
        >
          <Languages className="h-4 w-4" /> {data.settings.lang === "ar" ? "EN" : "ع"}
        </button>
      </header>
      <main className="flex-1 px-5 pb-28 pt-5">{children}</main>
      <nav className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.to === "/" }}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
            activeProps={{ className: "!text-primary font-semibold" }}
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function StatusBadge({ s }: { s: "paid" | "pending" | "overdue" }) {
  const { t } = useStore();
  const cls = { paid: "bg-success/15 text-success", pending: "bg-warning/20 text-warning-foreground", overdue: "bg-destructive/15 text-destructive" }[s];
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{t(s)}</span>;
}

export const inputCls = "w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
export const btnCls = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground active:scale-[.98] disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold active:scale-[.98]";
