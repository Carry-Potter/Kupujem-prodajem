/**
 * Pozadinski worker: node-cron + skeniranje + Telegram.
 * Pokretanje: npm run worker (ili pm2/systemd u produkciji).
 */
import dotenv from "dotenv";
import cron from "node-cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { runScrapeCycle } from "@/services/job.service";

// Local dev: prvo .env.local (Next stil), zatim fallback na .env.
dotenv.config({ path: ".env.local" });
dotenv.config();

async function tick() {
  try {
    const admin = createAdminClient();
    await runScrapeCycle(admin);
    console.log("[notifyKP]", new Date().toISOString(), "ciklus završen.");
  } catch (e) {
    console.error("[notifyKP] Ciklus greška:", e);
  }
}

// Svakih 5 minuta proverava koja su upozorenja zbog plana spremna za sken
cron.schedule("*/5 * * * *", () => {
  void tick();
});

console.log(
  "[notifyKP] Worker je pokrenut. Cron: */5 * * * * (Pro ~5 min, Free ~24h po upozorenju)."
);

void tick();
