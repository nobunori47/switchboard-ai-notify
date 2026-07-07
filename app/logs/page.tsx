import { createServerSupabase } from "@/lib/supabase";
import { DEMO_LOGS, isDemoMode } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

interface LogRow {
  id: string;
  inquiry_id: string;
  target: "slack" | "line";
  success: boolean;
  error_message: string | null;
  created_at: string;
  inquiry_queue: { raw_content: string; category: string | null } | null;
}

async function getLogs(): Promise<LogRow[]> {
  if (isDemoMode()) return DEMO_LOGS as LogRow[];

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("notification_log")
    .select("*, inquiry_queue(raw_content, category)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as unknown as LogRow[];
}

export default async function LogsPage() {
  const logs = await getLogs();
  const demo = isDemoMode();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="text-xs uppercase tracking-widest text-brass">Notification Log</div>
          {demo && (
            <span className="rounded-sm bg-brass/15 px-2 py-0.5 text-xs font-medium text-brass">
              DEMO MODE
            </span>
          )}
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-paper">通知ログ</h1>
        <p className="mt-2 text-sm text-mute">
          Slack・LINEへの送信結果を個別に記録。失敗時は「なぜ通知されなかったか」を
          ここで追跡できます(R-10対策)。
        </p>
      </div>

      <div className="rounded-md border border-panel-line bg-panel-raised">
        {logs.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-mute">ログがありません。</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b border-panel-line px-4 py-3 text-sm last:border-b-0"
            >
              <span className="w-14 font-mono text-xs uppercase text-mute">
                {log.target}
              </span>
              <span className="truncate text-paper">
                {log.inquiry_queue?.raw_content ?? "(問い合わせデータなし)"}
              </span>
              {log.error_message && (
                <span className="truncate text-xs text-signal-error">
                  {log.error_message}
                </span>
              )}
              <span
                className="jack text-xs font-medium"
                style={{ color: log.success ? "#4F8A7B" : "#C1443C" }}
              >
                <span
                  className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                  style={{ background: log.success ? "#4F8A7B" : "#C1443C" }}
                />
                {log.success ? "成功" : "失敗"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
