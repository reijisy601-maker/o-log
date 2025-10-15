# OrderLog セットアップガイド

## 環境変数の設定

### ローカル開発環境

1. `.env.local.example`を`.env.local`にコピー
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

2. `.env.local`を編集して、実際の値を設定

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key

# OpenAI
OPENAI_API_KEY=sk-your-actual-openai-key
\`\`\`

### Vercelデプロイ環境

1. Vercelプロジェクトの設定ページを開く
2. 「Environment Variables」セクションに移動
3. 以下の環境変数を追加：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | `eyJhbGc...` |
| `OPENAI_API_KEY` | OpenAI APIキー | `sk-proj-...` |

## データベースのセットアップ

Supabaseダッシュボードで以下のSQLスクリプトを順番に実行：

1. `scripts/01-create-tables.sql` - テーブル作成
2. `scripts/02-seed-data.sql` - 初期データ
3. `scripts/03-update-submissions-schema.sql` - スキーマ更新
4. `scripts/04-add-unique-constraint.sql` - ユニーク制約追加

## 環境変数の取得方法

### Supabase

1. [Supabaseダッシュボード](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択
3. 「Settings」→「API」を開く
4. 以下をコピー：
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### OpenAI

1. [OpenAI Platform](https://platform.openai.com/)にログイン
2. 「API keys」を開く
3. 「Create new secret key」をクリック
4. 生成されたキーをコピー → `OPENAI_API_KEY`

## デプロイ手順

1. v0から「Publish」ボタンをクリック
2. Vercelにデプロイ
3. Vercelで環境変数を設定
4. Supabaseでデータベースをセットアップ
5. デプロイされたURLにアクセスしてテスト

## トラブルシューティング

### 「Supabase環境変数が設定されていません」と表示される

- 環境変数が正しく設定されているか確認
- Vercelでデプロイを再実行（環境変数の変更後は再デプロイが必要）

### 「適切な画像ではありません」と表示される

- OpenAI APIキーが正しく設定されているか確認
- OpenAI APIの利用制限を確認

### 管理者ページにアクセスできない

- ユーザープロファイルの`is_admin`フラグを確認
- Supabaseダッシュボードで手動で設定：
\`\`\`sql
UPDATE user_profiles SET is_admin = true WHERE email = 'your-email@example.com';
