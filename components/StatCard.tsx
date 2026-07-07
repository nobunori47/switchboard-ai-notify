export function StatCard(props: {
  label: string;
  value: string | number;
  accent?: string;
  caption?: string;
}) {
  const { label, value, accent = "#C9A24B", caption } = props;
  return (
    <div className="rounded-md border border-panel-line bg-panel-raised p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-mute">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
        />
        {label}
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold text-paper">{value}</div>
      {caption && <div className="mt-1 text-xs text-mute">{caption}</div>}
    </div>
  );
}
