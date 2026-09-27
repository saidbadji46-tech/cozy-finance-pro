import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.fatorati.invoices",
  appName: "فاتورتي",
  webDir: "capacitor-www",
  server: {
    url: "https://cozy-finance-pro.lovable.app",
    cleartext: false,
  },
  android: { backgroundColor: "#f7f4ec" },
};

export default config;
