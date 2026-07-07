import { createClient } from "@supabase/supabase-js";

// サーバーサイド専用クライアント。
// service role key はRLSを迂回するため、必ずサーバー(API route / cron)からのみ使用し、
// クライアントコンポーネントには絶対に渡さないこと。
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabaseの環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を確認してください。"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
