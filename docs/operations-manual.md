# マルチチャネル通知システム 運用マニュアル

対象: 不動産管理会社ご担当者様
最終更新: 2026年7月

---

## 普段の確認

- Slackチャネル「#switchboard-test」(本番では #問い合わせ-賃貸 など カテゴリ別)を見るだけでOKです
- 賃貸・売買・内見・クレームの4カテゴリに自動で振り分けられます
- クレーム(緊急)と判定された場合は、Slack通知に加えて営業部長個人のLINEにも即時通知が届きます(5分以内)

---

## 障害だと感じたら

以下の順で確認してください。

1. **Vercelダッシュボード**で、Functionsのエラーログを確認する
   - `https://vercel.com/[アカウント名]/switchboard-ai-notify` → Deployments → Functions
2. **Supabase**で `inquiry_queue` テーブルの `status = 'failed'` の件数を確認する
   - Table Editor → inquiry_queue → statusでフィルタ
3. **5分以上Slackに通知が来ない場合**は、開発担当へご連絡ください
   - その際、上記2点で確認した内容(いつから・何件failedか)を伝えていただけるとスムーズです

---

## APIキー再発行が必要なケース

| ケース | 対応 |
|---|---|
| LINE Channel Secret / Access Tokenの漏洩 | LINE Developersコンソールで再発行 |
| Slack Bot Tokenの漏洩 | Slack App設定(OAuth & Permissions)で再発行 |
| Anthropic APIキーの漏洩 | Anthropic Consoleで再発行 |

再発行後は、Vercelの環境変数(Project Settings → Environment Variables)を更新し、再デプロイすることで反映されます。詳細な手順は「APIキーローテーション手順」を参照してください。

---

## 月額運用コストの目安

- Vercel: Hobbyプラン(無料)〜Proプラン(本番運用時推奨)
- Supabase: Freeプラン(無料枠内で運用可能な想定)
- Slack / LINE Messaging API: 無料利用枠内
- Anthropic API: 従量課金(問い合わせ件数に応じて数百円〜数千円/月を想定)

**合計で月額1〜2万円以内**を目安に設計しています。