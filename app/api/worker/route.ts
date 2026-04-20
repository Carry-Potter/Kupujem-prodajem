import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runScrapeCycle } from "@/services/job.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: Request): boolean {
  const configured =
    process.env.WORKER_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!configured) return false;

  const auth = req.headers.get("authorization")?.trim() ?? "";
  const expected = `Bearer ${configured}`;
  return auth === expected;
}

/**
 * GET /api/worker
 * Vercel cron/eksterni scheduler poziva ovu rutu da pokrene jedan ciklus skeniranja.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    await runScrapeCycle(admin);
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[notifyKP] /api/worker error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
