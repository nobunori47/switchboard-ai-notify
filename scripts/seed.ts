// ダッシュボードの見た目を確認するためのシードスクリプト。
// 実際にwebhookを叩かなくても、queueにテストデータを投入して
// 管制盤・問い合わせ一覧・通知ログの画面を確認できる。
//
// 実行方法: npm run seed
import { createServerSupabase } from "../lib/supabase";
import { classifyWithClaude, isUrgentCandidate } from "../lib/classify";
import testData from "./test-inquiries.json";

async function main() {
  const supabase = createServerSupabase();
  console.log("=== シード投入開始 ===");

  for (const [i, item] of testData.entries()) {
    const externalId = `seed-${Date.now()}-${i}`;
    const urgentCandidate = isUrgentCandidate(item.text);

    // 半分程度は「分類済み・通知済み」として投入し、残りは「受付待ち」のまま
    // Cronがまだ処理していない状態を再現する。
    const shouldClassifyNow = i % 2 === 0;

    if (shouldClassifyNow) {
      const result = await classifyWithClaude(item.text);
      const status = Math.random() > 0.15 ? "notified" : "failed";

      await supabase.from("inquiry_queue").insert({
        channel: item.channel,
        external_id: externalId,
        raw_content: item.text,
        category: result.category,
        confidence: result.confidence,
        classification_reason: result.reason,
        is_urgent: result.urgent,
        status,
        classified_at: new Date().toISOString(),
        notified_at: status === "notified" ? new Date().toISOString() : null,
        last_error: status === "failed" ? "Slack API timeout (simulated)" : null,
        retry_count: status === "failed" ? 1 : 0,
      });
      console.log(`No.${i + 1}: ${result.category} として投入 (${status})`);
    } else {
      await supabase.from("inquiry_queue").insert({
        channel: item.channel,
        external_id: externalId,
        raw_content: item.text,
        is_urgent: urgentCandidate,
        status: "pending",
      });
      console.log(`No.${i + 1}: 受付待ちとして投入`);
    }
  }

  console.log("=== シード投入完了。npm run dev でダッシュボードを確認してください ===");
}

main().catch((err) => {
  console.error("シード投入中にエラーが発生しました:", err);
  process.exit(1);
});
