import { createServerSupabase } from "@/lib/supabase";
import { InquiryRow } from "@/components/InquiryRow";
import { DEMO_INQUIRIES, isDemoMode } from "@/lib/demo-data";
import type { InquiryRow as InquiryRowType } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getItems(): Promise<InquiryRowType[]> {
  if (isDemoMode()) return DEMO_INQUIRIES;

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("inquiry_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as InquiryRowType[];
}

export default async function InquiriesPage() {
  const items = await getItems();
  const demo = isDemoMode();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="text-xs uppercase tracking-widest text-brass">Inquiry Log</div>
          {demo && (
            <span className="rounded-sm bg-brass/15 px-2 py-0.5 text-xs font-medium text-brass">
              DEMO MODE
            </span>
          )}
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-paper">
          問い合わせ一覧
        </h1>
        <p className="mt-2 text-sm text-mute">
          チャネル・カテゴリ・信頼度・状態を一括で確認できます。
        </p>
      </div>

      <div className="rounded-md border border-panel-line bg-panel-raised">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-mute">
            データがありません。
          </div>
        ) : (
          items.map((item) => <InquiryRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
