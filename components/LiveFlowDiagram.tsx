import type { DashboardStats } from "@/lib/types";

// このシステムが「何をするものか」を一目で伝えるための、
// 配電盤の結線図をイメージしたフロー可視化。
// 各ノードに実データの件数を添えることで、静的な図ではなく
// 「今どれだけ処理しているか」が伝わるようにしている。
export function LiveFlowDiagram({ stats }: { stats: DashboardStats | null }) {
  const total = stats?.total_count ?? 0;
  const urgent = stats?.urgent_count ?? 0;
  const notified = stats?.notified_count ?? 0;

  return (
    <div className="rounded-md border border-panel-line bg-panel-raised p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold tracking-wide text-paper">
          結線図 — 今どこを流れているか
        </h2>
        <span className="text-xs text-mute">リアルタイム</span>
      </div>

      <svg viewBox="0 0 760 200" className="w-full" role="img" aria-label="処理フロー">
        {/* 受信元ノード */}
        <Node x={30} y={40} label="Gmail" sub="ブリッジ経由" color="#5B7FA6" />
        <Node x={30} y={140} label="LINE" sub="公式アカウント" color="#5B7FA6" />

        {/* 受信元 → Queue */}
        <Cord x1={110} y1={40} x2={230} y2={100} color="#5B7FA6" />
        <Cord x1={110} y1={140} x2={230} y2={100} color="#5B7FA6" />

        <Node x={230} y={90} label="Queue" sub={`${total}件`} color="#C9A24B" />

        {/* Queue → Claude */}
        <Cord x1={310} y1={100} x2={430} y2={100} color="#C9A24B" />
        <Node x={430} y={90} label="Claude" sub="分類・判定" color="#C9A24B" />

        {/* Claude → Slack / LINE Push */}
        <Cord x1={510} y1={90} x2={630} y2={40} color="#4F8A7B" />
        <Cord x1={510} y1={110} x2={630} y2={140} color="#C1443C" />

        <Node x={630} y={40} label="Slack" sub={`${notified}件 通知済み`} color="#4F8A7B" />
        <Node x={630} y={140} label="LINE Push" sub={`緊急 ${urgent}件`} color="#C1443C" />
      </svg>

      <p className="mt-4 text-xs text-mute">
        黄色のコードは通常パス(Headless Cron・1分間隔)、赤いコードは緊急パス
        (Webhook受信と同一関数内で即時処理)を表しています。
      </p>
    </div>
  );
}

function Node({
  x,
  y,
  label,
  sub,
  color,
}: {
  x: number;
  y: number;
  label: string;
  sub: string;
  color: string;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={80}
        height={40}
        rx={4}
        fill="#1B1E26"
        stroke={color}
        strokeWidth={1.5}
      />
      <circle cx={10} cy={10} r={3} fill={color} />
      <text x={40} y={17} textAnchor="middle" fontSize="11" fontWeight={600} fill="#EDEAE2">
        {label}
      </text>
      <text x={40} y={30} textAnchor="middle" fontSize="9" fill="#9CA3B0">
        {sub}
      </text>
    </g>
  );
}

function Cord({
  x1,
  y1,
  x2,
  y2,
  color,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}) {
  const midX = (x1 + x2) / 2;
  return (
    <path
      d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth={2}
      opacity={0.75}
    />
  );
}
