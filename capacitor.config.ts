import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.fatorati.invoices",
  appName: "فاتورتي",
  webDir: "capacitor-www",
  server: {
    url: "https://project--60912238-f570-45ec-9392-9eb0a1bcedbc.lovable.app",
    cleartext: false,
  },
  android: { backgroundColor: "#f7f4ec" },
};

export default config;
