import type { InquiryRow as InquiryRowType } from "@/lib/types";
import {
  CATEGORY_COLOR,
  STATUS_LABEL,
  STATUS_COLOR,
  CHANNEL_LABEL,
} from "@/lib/category-style";

// このシステムの本質は「入ってきた問い合わせを、正しい行き先へ繋ぎ替える」こと。
// 交換手が配電盤でコードを差し替えていた様子を、
// [受信元] ──(カテゴリ色のコード)── [行き先] という一本の線で表現する。
export function InquiryRow({ item }: { item: InquiryRowType }) {
  const categoryColor = item.category ? CATEGORY_COLOR[item.category] : "#5B6474";
  const statusColor = STATUS_COLOR[item.status] ?? "#5B6474";

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b border-panel-line px-4 py-3 text-sm last:border-b-0">
      {/* 受信元 */}
      <div className="w-16 shrink-0 font-mono text-xs text-mute">
        {CHANNEL_LABEL[item.channel] ?? item.channel}
      </div>

      {/* パッチコード + 本文 */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="patch-cord w-8"
            style={{ background: categoryColor, color: categoryColor as any }}
          />
          <span className="truncate text-paper">{item.raw_content}</span>
        </div>
        {item.classification_reason && (
          <div className="mt-1 pl-10 text-xs text-mute">
            {item.classification_reason}
            {item.confidence != null && (
              <span className="ml-2 font-mono">conf {item.confidence.toFixed(2)}</span>
            )}
          </div>
        )}
      </div>

      {/* カテゴリ・緊急バッジ */}
      <div className="flex shrink-0 items-center gap-2">
        {item.is_urgent && (
          <span className="rounded-sm bg-signal-urgent/20 px-2 py-0.5 text-xs font-medium text-signal-urgent">
            緊急
          </span>
        )}
        <span
          className="rounded-sm px-2 py-0.5 text-xs font-medium"
          style={{ background: `${categoryColor}22`, color: categoryColor }}
        >
          {item.category ?? "未分類"}
        </span>
      </div>

      {/* ステータス */}
      <div className="shrink-0 text-right">
        <span
          className="jack text-xs font-medium"
          style={{ color: statusColor }}
        >
          <span
            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
            style={{ background: statusColor }}
          />
          {STATUS_LABEL[item.status] ?? item.status}
        </span>
      </div>
    </div>
  );
}
