import Anthropic from "@anthropic-ai/sdk";
import type { ClassificationResult } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `あなたは不動産管理会社に届く問い合わせを仕分けるアシスタントです。
次の4カテゴリのいずれかに分類してください: 賃貸, 売買, 内見, クレーム

判断基準:
- 賃貸: 部屋を借りたい、賃貸物件の空き状況などの相談
- 売買: 物件の売却・購入に関する相談
- 内見: 物件見学の日程調整・予約
- クレーム: 設備の不具合、対応への不満、苦情、至急の対応要求

注意点:
- 「至急」「クレーム」等の単語が含まれていても、文脈上クレームでない場合(例: 内見の日程を至急決めたい)はクレームに分類しない
- 逆に、明確な単語がなくても、強い不満や困りごとが読み取れる場合はクレームとして扱う
- 天気の話題など、不動産と無関係な内容は confidence を低く設定し、最も近いと思われるカテゴリを推測する
- urgent は「5分以内の即時対応が必要か」の判断。クレームの中でも緊急度が低いものは urgent=false でよい

必ず次のJSON形式のみで回答してください。前置き・説明文・コードブロック記号は一切不要です。
{"category": "賃貸|売買|内見|クレーム", "confidence": 0.00から1.00の数値, "urgent": true または false, "reason": "20文字程度の判断理由"}`;

export async function classifyWithClaude(
  text: string
): Promise<ClassificationResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claudeからテキスト応答が得られませんでした");
  }

  try {
    const cleaned = textBlock.text.trim().replace(/```json|```/g, "");
    const parsed = JSON.parse(cleaned);
    return {
      category: parsed.category,
      confidence: Number(parsed.confidence),
      urgent: Boolean(parsed.urgent),
      reason: parsed.reason ?? "",
    };
  } catch (err) {
    throw new Error(
      `Claudeの応答をJSONとして解析できませんでした: ${textBlock.text}`
    );
  }
}

// Webhook受信時点での一次判定(キーワードマッチ)。
// これだけで確定させず、緊急"候補"の絞り込みにのみ使う。
const URGENT_KEYWORDS = /クレーム|至急|苦情|怒り|困っ|納得できな|対応して/;

export function isUrgentCandidate(text: string): boolean {
  return URGENT_KEYWORDS.test(text);
}
