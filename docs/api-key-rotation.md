# APIキーローテーション手順(開発者向け)

外部API連携案件では「キーが漏れたらどうすればいいですか?」とクライアントから
必ず聞かれます。この手順書は、その質問にすぐ答えられるようにするためのものです。

---

## 基本方針

1. 漏洩(または漏洩の疑い)に気づいたら、まず該当キーを**無効化**する
2. 新しいキーを発行する
3. Vercelの環境変数を更新する
4. 再デプロイ(Vercelは環境変数更新後、通常は手動で再デプロイが必要)
5. テストメッセージで動作確認する

---

## サービス別・再発行手順

### LINE Messaging API

- **再発行URL**: https://developers.line.biz/console/
- **対象**: `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`
- **手順**:
  1. LINE Developersコンソールにログイン
  2. 対象チャネルを選択
  3. 「チャネル基本設定」でChannel Secretを再発行(またはMessaging API設定でアクセストークンを再発行)
  4. 新しい値をコピー

### Slack

- **再発行URL**: https://api.slack.com/apps
- **対象**: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`
- **手順**:
  1. 対象のSlack Appを選択
  2. 「OAuth & Permissions」→「Revoke All OAuth Tokens」で既存トークンを無効化
  3. 「Reinstall to [ワークスペース名]」で再インストールし、新しいBot Tokenを取得
  4. Signing Secretは「Basic Information」→「App Credentials」から再生成可能

### Anthropic (Claude API)

- **再発行URL**: https://console.anthropic.com/settings/keys
- **対象**: `ANTHROPIC_API_KEY`
- **手順**:
  1. 該当キーを「Delete」で削除(無効化)
  2. 「Create Key」で新しいキーを発行
  3. 新しい値をコピー

### Supabase

- **再発行URL**: https://supabase.com/dashboard/project/_/settings/api-keys
- **対象**: `SUPABASE_SERVICE_ROLE_KEY`
- **手順**: Project Settings → API Keys から再生成(JWT Secretのローテーションが必要な場合は影響範囲が大きいため慎重に)

---

## Vercelへの反映手順

1. `https://vercel.com/[アカウント]/[プロジェクト名]/settings/environment-variables` を開く
2. 該当する環境変数を編集し、新しい値に更新
3. 「Save」
4. Deploymentsタブから最新のデプロイを選択し、「Redeploy」を実行(環境変数の変更は再デプロイしないと反映されません)

---

## 再発行後の動作確認チェックリスト

- [ ] `.env.local`(ローカル環境)も同じ値に更新した
- [ ] Vercelの環境変数を更新し、再デプロイした
- [ ] テスト用の問い合わせを1件送信し、Slackへの通知が届くことを確認した
- [ ] （LINE/Slackの場合）署名検証が正しく通ることを確認した(不正な署名では401が返ることも確認)
- [ ] 旧キーが無効化され、使用できなくなっていることを確認した