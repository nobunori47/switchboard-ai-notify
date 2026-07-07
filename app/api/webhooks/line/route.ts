import crypto from "node:crypto";
import { createServerSupabase } from "@/lib/supabase";
import { isUrgentCandidate } from "@/lib/classify";
import { handleUrgentCandidate } from "@/lib/urgent-handler";

export async function POST(req: Request) {
  const signature = req.headers.get("x-line-signature");
  const body = await req.text();

  // ── ① 署名検証 ──────────────────────────────────────
  // LINEが本当に送ってきたリクエストかを確認する。ここを通さないと
  // 偽のWebhookで不正なLINE Pushや誤通知を発火させられてしまう。
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) {
    return new Response("LINE_CHANNEL_SECRET is not configured", { status: 500 });
  }
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64");
  if (signature !== expected) {
    return new Response("Unauthorized: signature mismatch", { status: 401 });
  }

  const events = JSON.parse(body).events ?? [];
  const supabase = createServerSupabase();

  for (const ev of events) {
    if (ev.type !== "message" || ev.message?.type !== "text") continue;

    const text: string = ev.message.text;
    const externalId: string = ev.message.id;
    const sender: string | undefined = ev.source?.userId;

    // ── ② 冪等性チェック ─────────────────────────────
    // external_id にUNIQUE制約があるため、重複INSERTはDB側でエラーになる。
    // ここでは事前にチェックし、既存なら早期returnして無駄な処理をしない。
    const { data: existing } = await supabase
      .from("inquiry_queue")
      .select("id")
      .eq("external_id", externalId)
      .maybeSingle();

    if (existing) {
      continue; // 既に処理済み。二重通知を防ぐ。
    }

    // ── ③ 緊急一次判定(キーワード) ───────────────────
    const urgentCandidate = isUrgentCandidate(text);

    if (urgentCandidate) {
      // 緊急候補は同一関数内で完結させ、Cronの実行間隔を待たない(SLA: 5分以内)。
      await handleUrgentCandidate({ channel: "line", externalId, sender, text });
    } else {
      // 通常パス: キューに保存し、Headless Cronでの分類を待つ。
      await supabase.from("inquiry_queue").insert({
        channel: "line",
        external_id: externalId,
        sender,
        raw_content: text,
      });
    }
  }

  return new Response("OK");
}
