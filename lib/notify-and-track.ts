import { createServerSupabase } from "./supabase";

/**
 * 通知結果を notification_log に記録し、成功時のみ inquiry_queue のstatusを
 * "notified" に進める。失敗時は "failed" にし、retry_count と last_error を残す。
 *
 * 重要: statusは「実際に通知が届いた後」に更新する。
 * 分類が終わった時点でstatusを進めてしまうと、Slack/LINE送信が失敗しても
 * 見かけ上は成功したように見える、という事故につながるため。
 */
export async function recordNotificationResult(params: {
  inquiryId: string;
  target: "slack" | "line";
  result: { ok: boolean; error?: string };
  currentRetryCount: number;
}) {
  const supabase = createServerSupabase();
  const { inquiryId, target, result, currentRetryCount } = params;

  await supabase.from("notification_log").insert({
    inquiry_id: inquiryId,
    target,
    success: result.ok,
    error_message: result.error ?? null,
  });

  if (result.ok) {
    await supabase
      .from("inquiry_queue")
      .update({ status: "notified", notified_at: new Date().toISOString() })
      .eq("id", inquiryId);
  } else {
    const nextRetryAt = new Date(Date.now() + backoffMs(currentRetryCount));
    await supabase
      .from("inquiry_queue")
      .update({
        status: "failed",
        retry_count: currentRetryCount + 1,
        last_error: result.error ?? "unknown error",
        next_retry_at: nextRetryAt.toISOString(),
      })
      .eq("id", inquiryId);
  }
}

// Exponential backoff: 30秒 → 1分 → 2分 → 4分... (上限10分)
function backoffMs(retryCount: number): number {
  const base = 30_000;
  const capped = Math.min(base * 2 ** retryCount, 10 * 60_000);
  return capped;
}
