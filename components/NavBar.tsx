import Link from "next/link";

export function NavBar() {
  return (
    <header className="border-b border-panel-line bg-panel/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="jack" style={{ ["--tw-shadow" as any]: "" }}>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "#C9A24B", boxShadow: "0 0 8px rgba(201,162,75,0.8)" }}
            />
          </span>
          <span className="font-display text-lg font-semibold tracking-wide text-paper">
            SWITCHBOARD
          </span>
          <span className="hidden text-xs text-mute sm:inline">
            / AIマルチチャネル通知システム
          </span>
        </div>
        <nav className="flex gap-6 text-sm text-mute">
          <Link href="/" className="hover:text-paper transition-colors">
            管制盤
          </Link>
          <Link href="/inquiries" className="hover:text-paper transition-colors">
            問い合わせ一覧
          </Link>
          <Link href="/logs" className="hover:text-paper transition-colors">
            通知ログ
          </Link>
        </nav>
      </div>
    </header>
  );
}
