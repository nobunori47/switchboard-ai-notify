import { createServerSupabase } from "./supabase";
import { classifyWithClaude } from "./classify";
import { postToSlack } from "./slack";
import { pushLineMessage } from "./line";
import { recordNotificationResult } from "./notify-and-track";
import type { Channel } from "./types";

/**
 * キーワードで緊急候補と判定されたメッセージを、Claudeで再確認する。
 *
 * 判定後の分岐(A案を採用。Step2での検討メモ):
 *   urgent=true  → Slack + LINE Pushで即時通知(5分以内SLAを満たす)
 *   urgent=false → 誤通知を避けるため、通常キュー(status=pending)に戻す
 *                  → 次回Cronの巡回で通常の分類・Slack通知が行われる
 */
export async function handleUrgentCandidate(params: {
  channel: Channel;
  externalId: string;
  sender?: string;
  text: string;
}) {
  const supabase = createServerSupabase();
  const classification = await classifyWithClaude(params.text);

  const { data: inserted } = await supabase
    .from("inquiry_queue")
    .insert({
      channel: params.channel,
      external_id: params.externalId,
      sender: params.sender,
      raw_content: params.text,
      category: classification.category,
      confidence: classification.confidence,
      classification_reason: classification.reason,
      is_urgent: classification.urgent,
      status: "classified",
      classified_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (!inserted) return;

  if (!classification.urgent) {
    await supabase
      .from("inquiry_queue")
      .update({ status: "pending" })
      .eq("id", inserted.id);
    return;
  }

  const slackResult = await postToSlack({
    category: "クレーム",
    text: params.text,
    urgent: true,
  });
  await recordNotificationResult({
    inquiryId: inserted.id,
    target: "slack",
    result: slackResult,
    currentRetryCount: 0,
  });

  const lineResult = await pushLineMessage(`🚨 緊急対応が必要です:\n${params.text}`);
  await recordNotificationResult({
    inquiryId: inserted.id,
    target: "line",
    result: lineResult,
    currentRetryCount: 0,
  });
}
