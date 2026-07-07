import { createServerSupabase } from "@/lib/supabase";
import { classifyWithClaude } from "@/lib/classify";
import { postToSlack } from "@/lib/slack";
import { recordNotificationResult } from "@/lib/notify-and-track";

/**
 * Vercel Cron から 1分ごとに呼び出される想定(vercel.jsonのschedule参照)。
 * 通常パス(緊急一次判定に該当しなかった問い合わせ)を巡回し、
 * Claudeで分類 → Slack通知 → status更新、を行う。
 *
 * 状態遷移の順序に注意:
 *   分類成功 → Slack通知 → 成功したら status="notified"
 * 通知が失敗した場合は "failed" のまま止め、retry_countとlast_errorを残す。
 * (先にstatusを進めてしまうと「送ったつもり」の事故につながるため)
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServerSupabase();

  // failedで再送時刻が来ているものも合わせて拾う
  const nowIso = new Date().toISOString();
  const { data: pending, error } = await supabase
    .from("inquiry_queue")
    .select("*")
    .or(`status.eq.pending,and(status.eq.failed,next_retry_at.lte.${nowIso})`)
    .limit(20);

  if (error) {
    return new Response(`Query error: ${error.message}`, { status: 500 });
  }

  const results: { id: string; outcome: string }[] = [];

  for (const row of pending ?? []) {
    try {
      // 分類がまだなら(pending)、Claudeで分類する。
      // failedからの再送の場合は既にcategoryがあるので再分類はスキップしてもよいが、
      // ここではシンプルに毎回分類し直す(コストは小さい)。
      const classification = await classifyWithClaude(row.raw_content);

      await supabase
        .from("inquiry_queue")
        .update({
          category: classification.category,
          confidence: classification.confidence,
          classification_reason: classification.reason,
          is_urgent: classification.urgent,
          status: "classified",
          classified_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      const slackResult = await postToSlack({
        category: classification.category,
        text: row.raw_content,
        urgent: classification.urgent,
      });

      await recordNotificationResult({
        inquiryId: row.id,
        target: "slack",
        result: slackResult,
        currentRetryCount: row.retry_count,
      });

      results.push({ id: row.id, outcome: slackResult.ok ? "notified" : "failed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      await supabase
        .from("inquiry_queue")
        .update({
          status: "failed",
          retry_count: row.retry_count + 1,
          last_error: message,
          next_retry_at: new Date(Date.now() + 60_000).toISOString(),
        })
        .eq("id", row.id);
      results.push({ id: row.id, outcome: `error: ${message}` });
    }
  }

  return Response.json({ processed: results.length, results });
}
