-- ============================================================
-- SwitchBoard AI Notify: 問い合わせキュー テーブル
-- 案件5 T-11(リスク管理)の議論を反映した拡張スキーマ
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists inquiry_queue (
  id uuid primary key default gen_random_uuid(),

  -- 受信元情報
  channel text not null check (channel in ('gmail', 'line')),
  external_id text unique,              -- R-06冪等性対策: 各APIのMessageId。UNIQUE制約で二重処理を防ぐ
  sender text,                          -- 送信者(メールアドレス/LINE表示名)
  raw_content text not null,

  -- AI分類結果
  category text check (category in ('賃貸', '売買', '内見', 'クレーム')),
  confidence numeric(3,2),              -- R-08対策: AI判断の信頼度(0.00-1.00)
  classification_reason text,           -- R-08対策: なぜそのカテゴリと判断したかの短い理由

  -- 緊急度・状態管理
  is_urgent boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'classified', 'notified', 'failed')),

  -- 障害対応(コンティンジェンシープラン)
  retry_count int not null default 0,
  last_error text,
  next_retry_at timestamptz,

  -- タイムスタンプ(状態遷移の追跡)
  created_at timestamptz not null default now(),
  classified_at timestamptz,
  notified_at timestamptz
);

create index if not exists idx_inquiry_status_created
  on inquiry_queue (status, created_at);

create index if not exists idx_inquiry_urgent
  on inquiry_queue (is_urgent) where is_urgent = true;

-- ============================================================
-- 通知ログ: Slack/LINEへの送信結果を個別に記録(R-10: 原因追跡用)
-- ============================================================

create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references inquiry_queue(id) on delete cascade,
  target text not null check (target in ('slack', 'line')),
  success boolean not null,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_log_inquiry
  on notification_log (inquiry_id);

-- ============================================================
-- ダッシュボード集計用ビュー
-- ============================================================

create or replace view dashboard_stats as
select
  count(*) as total_count,
  count(*) filter (where is_urgent) as urgent_count,
  count(*) filter (where status = 'failed') as failed_count,
  count(*) filter (where status = 'notified') as notified_count,
  round(
    100.0 * count(*) filter (where status = 'notified')
    / nullif(count(*) filter (where status in ('notified', 'failed')), 0),
    1
  ) as success_rate_pct
from inquiry_queue;
