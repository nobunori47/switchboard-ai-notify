import type { Category } from "./types";

const CHANNEL_MAP: Record<Category, string | undefined> = {
  賃貸: process.env.SLACK_CHANNEL_RENTAL,
  売買: process.env.SLACK_CHANNEL_SALE,
  内見: process.env.SLACK_CHANNEL_VIEWING,
  クレーム: process.env.SLACK_CHANNEL_COMPLAINT,
};

export async function postToSlack(params: {
  category: Category;
  text: string;
  urgent?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const channelId = CHANNEL_MAP[params.category];
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token || !channelId) {
    return { ok: false, error: "Slackの環境変数(トークン/チャンネルID)が未設定です" };
  }

  const prefix = params.urgent ? "🚨 緊急 " : "";

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel: channelId,
        text: `${prefix}[${params.category}] ${params.text}`,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      return { ok: false, error: `Slack API error: ${json.error}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown error" };
  }
}
