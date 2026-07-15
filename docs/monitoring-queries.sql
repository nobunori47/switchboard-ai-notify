-- ============================================================
-- 監視用SQL集(低予算案件向け・追加コストなしの監視)
-- Supabase SQL Editorで直接実行、またはCronで定期実行する想定
-- ============================================================

-- 1. 直近24時間の状態別件数(日常監視用)
-- 未処理(pending)や失敗(failed)が想定より多い場合は障害の兆候
select status, count(*) as count
from inquiry_queue
where created_at > now() - interval '24 hours'
group by status;

-- 2. 失敗件数が閾値を超えていないかチェック(アラート用)
-- この結果が1行でも返ってきたら、Slack等へ警告を出す運用を想定
select count(*) as failed_count
from inquiry_queue
where status = 'failed'
  and created_at > now() - interval '24 hours'
having count(*) >= 5;

-- 3. 緊急通知のSLA達成率(5分以内に通知できたか)
-- is_urgent=true のもののうち、classified_atからnotified_atまでが5分以内の割合
select
  count(*) filter (where is_urgent) as urgent_total,
  count(*) filter (
    where is_urgent
      and notified_at is not null
      and notified_at - classified_at <= interval '5 minutes'
  ) as urgent_within_sla,
  round(
    100.0 * count(*) filter (
      where is_urgent
        and notified_at is not null
        and notified_at - classified_at <= interval '5 minutes'
    ) / nullif(count(*) filter (where is_urgent), 0),
    1
  ) as sla_achievement_pct
from inquiry_queue
where created_at > now() - interval '7 days';

-- 4. 冪等性の健全性チェック(external_idの重複がないか念のため確認)
-- UNIQUE制約があるため通常は0件のはずだが、監視として残しておく
select external_id, count(*)
from inquiry_queue
where external_id is not null
group by external_id
having count(*) > 1;

-- ============================================================
-- Claude Code Headlessモードでの自動化例(教材より):
--
-- claude -p "Supabaseのinquiry_queueを直近24hで集計し、
--            failedが5件以上ならSlackに警告通知して"
--
-- これをCronで1時間ごとに実行するだけで、追加コストのかからない
-- 障害検知の仕組みになる。
-- ============================================================