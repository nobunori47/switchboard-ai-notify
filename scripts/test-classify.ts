// テストデータをclassifyWithClaudeに直接渡し、分類が想定通りか確認するスクリプト。
// Step3の教材アドバイス通り、Webhook経由のフローに繋ぐ前にここで分類精度を確認する。
//
// 実行方法: npx tsx scripts/test-classify.ts
import { classifyWithClaude, isUrgentCandidate } from "../lib/classify";
import testData from "./test-inquiries.json";

async function main() {
  console.log("=== 分類テスト開始 ===\n");
  let correctCount = 0;

  for (const [i, item] of testData.entries()) {
    const urgentCandidate = isUrgentCandidate(item.text);
    const result = await classifyWithClaude(item.text);

    const isMatch = item.expected.startsWith(result.category);
    if (isMatch) correctCount++;

    console.log(`No.${i + 1} [${item.channel}]`);
    console.log(`  本文: ${item.text}`);
    console.log(`  期待値: ${item.expected}`);
    console.log(
      `  判定結果: ${result.category} (confidence=${result.confidence}, urgent=${result.urgent})`
    );
    console.log(`  理由: ${result.reason}`);
    console.log(`  キーワード一次判定(緊急候補): ${urgentCandidate ? "YES" : "no"}`);
    console.log(`  一致: ${isMatch ? "OK" : "要確認"}`);
    console.log("");
  }

  console.log(`=== 結果: ${correctCount}/${testData.length} 件が想定と一致 ===`);
}

main().catch((err) => {
  console.error("テスト実行中にエラーが発生しました:", err);
  process.exit(1);
});
