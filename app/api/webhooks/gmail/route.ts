import { createServerSupabase } from "@/lib/supabase";
import { isUrgentCandidate } from "@/lib/classify";
import { handleUrgentCandidate } from "@/lib/urgent-handler";

/**
 * Gmail連携について:
 * 本格的なGmail APIのpush通知(Cloud Pub/Sub経由)はOAuth・Watch登録・
 * history.list差分取得など、MVPの範囲を超える実装コストがかかる。
 *
 * そのため、このエンドポイントは「Gmailに届いたメールの内容を、
 * 軽量なブリッジ(Google Apps Scriptのトリガーなど)からPOSTしてもらう」
 * という現実的な構成を前提にしている。
 *
 * 認証はGmail側の署名ではなく、共有シークレット(GMAIL_BRIDGE_SECRET)で行う。
 * このシークレットはApps Script側にも同じ値を設定しておく。
 */
export async function POST(req: Request) {
  const providedSecret = req.headers.get("x-bridge-secret");
  const expectedSecret = process.env.GMAIL_BRIDGE_SECRET;

  if (!expectedSecret) {
    return new Response("GMAIL_BRIDGE_SECRET is not configured", { status: 500 });
  }
  if (providedSecret !== expectedSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json();
  const { messageId, from, subject, body } = payload as {
    messageId: string;
    from: string;
    subject: string;
    body: string;
  };

  if (!messageId || !body) {
    return new Response("Bad Request: messageId and body are required", { status: 400 });
  }

  const text = subject ? `${subject}\n${body}` : body;
  const supabase = createServerSupabase();

  // ── 冪等性チェック(GmailのメールIDで重複判定) ──────────
  const { data: existing } = await supabase
    .from("inquiry_queue")
    .select("id")
    .eq("external_id", messageId)
    .maybeSingle();

  if (existing) {
    return new Response("OK (duplicate, skipped)");
  }

  if (isUrgentCandidate(text)) {
    await handleUrgentCandidate({ channel: "gmail", externalId: messageId, sender: from, text });
  } else {
    await supabase.from("inquiry_queue").insert({
      channel: "gmail",
      external_id: messageId,
      sender: from,
      raw_content: text,
    });
  }

  return new Response("OK");
}
