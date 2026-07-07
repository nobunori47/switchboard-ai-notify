import { createServerSupabase } from "@/lib/supabase";
import { StatCard } from "@/components/StatCard";
import { InquiryRow } from "@/components/InquiryRow";
import { LiveFlowDiagram } from "@/components/LiveFlowDiagram";
import { DEMO_INQUIRIES, DEMO_STATS, isDemoMode } from "@/lib/demo-data";
import type { DashboardStats, InquiryRow as InquiryRowType } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getData() {
  if (isDemoMode()) {
    return { stats: DEMO_STATS, recent: DEMO_INQUIRIES };
  }

  const supabase = createServerSupabase();

  const [{ data: stats }, { data: recent }] = await Promise.all([
    supabase.from("dashboard_stats").select("*").single(),
    supabase
      .from("inquiry_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return {
    stats: stats as DashboardStats | null,
    recent: (recent ?? []) as InquiryRowType[],
  };
}

export default async function DashboardPage() {
  const { stats, recent } = await getData();
  const demo = isDemoMode();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="text-xs uppercase tracking-widest text-brass">Control Board</div>
          {demo && (
            <span className="rounded-sm bg-brass/15 px-2 py-0.5 text-xs font-medium text-brass">
              DEMO MODE — フィクスチャデータを表示中
            </span>
          )}
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-paper">
          問い合わせ管制盤
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mute">
          メール・LINEから届いた問い合わせを、AIがカテゴリ判定し、Slackへ自動で繋ぎ替えます。
          クレームは配電盤の緊急回路を通り、5分以内に営業部長個人のLINEへ直結します。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="総受信件数" value={stats?.total_count ?? 0} accent="#5B7FA6" />
        <StatCard
          label="緊急件数"
          value={stats?.urgent_count ?? 0}
          accent="#C1443C"
        />
        <StatCard
          label="通知成功率"
          value={stats?.success_rate_pct != null ? `${stats.success_rate_pct}%` : "—"}
          accent="#4F8A7B"
        />
        <StatCard label="失敗件数" value={stats?.failed_count ?? 0} accent="#C1443C" />
      </div>

      <LiveFlowDiagram stats={stats} />

      <div className="rounded-md border border-panel-line bg-panel-raised">
        <div className="flex items-center justify-between border-b border-panel-line px-4 py-3">
          <h2 className="font-display text-sm font-semibold tracking-wide text-paper">
            直近の接続履歴
          </h2>
          <span className="text-xs text-mute">最新12件</span>
        </div>
        {recent.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-mute">
            まだ問い合わせがありません。npm run seed でテストデータを投入できます。
          </div>
        ) : (
          <div>
            {recent.map((item) => (
              <InquiryRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
