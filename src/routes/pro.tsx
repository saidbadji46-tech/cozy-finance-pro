import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Crown } from "lucide-react";
import { useStore, CURRENCIES } from "@/lib/store";
import { inputCls, btnCls } from "@/components/AppShell";

export const Route = createFileRoute("/pro")({
  head: () => ({
    meta: [
      { title: "الحساب والاشتراك — فاتورتي" },
      { name: "description", content: "إعدادات حسابك وخطط الاشتراك المجانية والاحترافية." },
      { property: "og:title", content: "خطط فاتورتي — مجاني واحترافي" },
      { property: "og:description", content: "ابدأ مجاناً وقم بالترقية لفواتير وعملاء بلا حدود." },
    ],
  }),
  component: Pro,
});

function Pro() {
  const { data, set, t } = useStore();
  const [msg, setMsg] = useState(false);
  const s = data.settings;
  const upd = (p: Partial<typeof s>) => set((d) => ({ ...d, settings: { ...d.settings, ...p } }));
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">{t("settings")}</h1>
        <label className="block space-y-1 text-sm">{t("businessName")}
          <input className={inputCls} value={s.businessName} onChange={(e) => upd({ businessName: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-sm">{t("baseCurrency")}
            <select className={inputCls} value={s.currency} onChange={(e) => upd({ currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="space-y-1 text-sm">{t("language")}
            <select className={inputCls} value={s.lang} onChange={(e) => upd({ lang: e.target.value as "ar" | "en" })}>
              <option value="ar">العربية</option><option value="en">English</option>
            </select>
          </label>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t("plans")}</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between"><p className="font-bold">{t("free")}</p><p className="text-lg font-bold">$0</p></div>
          <ul className="mt-3 space-y-1.5 text-sm">{(["f1", "f2", "f3"] as const).map((k) => <li key={k} className="flex gap-2"><Check className="h-4 w-4 text-success" />{t(k)}</li>)}</ul>
          {s.plan === "free" && <p className="mt-3 text-xs font-semibold text-primary">{t("currentPlan")}</p>}
        </div>
        <div className="rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-bold"><Crown className="h-5 w-5 text-accent" />{t("proPlan")}</p>
            <p className="text-lg font-bold">$7<span className="text-xs opacity-70">{t("perMonth")}</span></p>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">{(["f4", "f5", "f3", "f6", "f7"] as const).map((k) => <li key={k} className="flex gap-2"><Check className="h-4 w-4 text-accent" />{t(k)}</li>)}</ul>
          <button onClick={() => setMsg(true)} className={`${btnCls} mt-4 w-full !bg-accent !text-accent-foreground`}>{t("upgrade")}</button>
          {msg && <p className="mt-2 text-center text-xs opacity-80">{t("comingSoon")}</p>}
        </div>
      </section>
    </div>
  );
}
