# 認証フロー (Authentication Flow)

## マジックリンク認証の仕組み

このアプリケーションでは、Supabase Auth のマジックリンク方式を使用しています。

### 基本フロー

1. **ログイン画面** (`/`)
   - ユーザーがメールアドレスと社内パスコードを入力
   - `signInWithMagicLink` または `signUpWithCode` を呼び出し
   - Supabase がマジックリンク付きメールを送信

2. **マジックリンク**
   ```
   https://o-log.vercel.app/#access_token=...&refresh_token=...&type=magiclink
   ```
   - リンクにはアクセストークンとリフレッシュトークンがハッシュフラグメント形式で含まれる

3. **コールバック処理** (`/auth/callback`)
   - クライアント側で `window.location.hash` からトークンを抽出
   - `/api/auth/session` にトークンを送信
   - API ルートでセッションを確立し、Cookie を設定
   - ユーザーロールに応じて `/dashboard` または `/admin` へリダイレクト

4. **保護されたページ** (`/dashboard`, `/admin`)
   - Middleware が Cookie (`sb-access-token`) の存在を確認
   - Cookie がない場合は `/` へリダイレクト
   - Cookie がある場合はページへアクセスを許可

## 修正内容: Cookie 伝播の競合状態

### 問題の原因

以前の実装では、`app/auth/callback/page.tsx` で以下のようにクライアント側ルーティングを使用していました:

```typescript
router.push(redirectPath)  // ❌ 問題あり
```

この場合、以下の競合状態が発生していました:

1. `/api/auth/session` が Cookie を設定（サーバー側）
2. API レスポンスが返る
3. `router.push("/dashboard")` を実行（クライアント側ルーティング）
4. Next.js がクライアント側ナビゲーションを実行
5. **Middleware が `/dashboard` リクエストを受信するが、Cookie がまだリクエストに含まれていない**
6. Middleware が認証失敗と判断し、`/` へリダイレクト

### 解決方法

**フルページリロード**を使用して Cookie が確実にリクエストに含まれるようにしました:

```typescript
window.location.href = redirectPath  // ✅ 修正後
```

`window.location.href` を使用することで:
- ブラウザが完全にページをリロード
- 新しいリクエストに Cookie が確実に含まれる
- Middleware が正しく Cookie を検出
- 認証済みユーザーとして保護されたページへアクセス可能

### なぜ router.push では駄目なのか

Next.js の `router.push()` はクライアント側ルーティングを実行します:
- サーバーへの完全なリクエストを送信しない場合がある
- Cookie がブラウザに設定されていても、Next.js のクライアント側ナビゲーションで即座に使用されない可能性がある
- Middleware は新しいリクエストが来る時に実行されるため、クライアント側ルーティングのタイミングでは Cookie が適切に伝播されていない

## セキュリティ考慮事項

### Cookie 設定

`/api/auth/session/route.ts` で設定される Cookie:

```typescript
cookieStore.set("sb-access-token", access_token, {
  path: "/",
  httpOnly: true,                              // XSS 攻撃対策
  secure: process.env.NODE_ENV === "production", // 本番環境では HTTPS のみ
  sameSite: "lax",                             // CSRF 攻撃対策
  maxAge: 60 * 60,                             // 1時間
})
```

- `httpOnly`: JavaScript からアクセス不可（XSS 攻撃対策）
- `secure`: 本番環境では HTTPS 接続のみで送信
- `sameSite: "lax"`: クロスサイトリクエストでの送信を制限（CSRF 対策）

### Middleware での認証チェック

`middleware.ts` は保護されたパスへのアクセス時に Cookie の存在を確認:

```typescript
const protectedPaths = ["/dashboard", "/admin"]
const supabaseCookie = allCookies.find((c) => c.name === "sb-access-token")

if (!supabaseCookie || !supabaseCookie.value) {
  return NextResponse.redirect(new URL("/", request.url))
}
```

## トラブルシューティング

### マジックリンクが機能しない場合

1. **環境変数の確認**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Vercel のデプロイ環境で正しく設定されているか確認

2. **Supabase の設定**
   - Email Templates が正しく設定されているか
   - Redirect URL が許可リストに含まれているか
     - Supabase ダッシュボード → Authentication → URL Configuration
     - `https://o-log.vercel.app/auth/callback` を追加

3. **Cookie の確認**
   - ブラウザの開発者ツールで Cookie を確認
   - `sb-access-token` が設定されているか
   - Cookie の有効期限が切れていないか

4. **ログの確認**
   - ブラウザのコンソールログで認証フローを追跡
   - デバッグ情報が表示される場合は内容を確認

### よくあるエラー

- **"認証トークンが見つかりません"**: マジックリンクの形式が不正、またはトークンが URL に含まれていない
- **"セッション設定エラー"**: Supabase への接続エラー、または無効なトークン
- **"/" に戻される**: Cookie が設定されていない、または Middleware で検出されていない（この問題は修正済み）

## 開発者向けメモ

### ローカル開発環境での注意点

ローカル開発時は `.env.local` を作成し、環境変数を設定してください:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### テスト用マジックリンク

開発中にマジックリンクをテストする場合:
1. ローカルサーバーを起動 (`pnpm dev`)
2. ログイン画面でメールアドレスを入力
3. Supabase ダッシュボードの Authentication → Users → ユーザーの Email 列から「Send magic link」を使用
4. メールを確認してリンクをクリック

### デバッグログ

認証コールバックページには詳細なデバッグログが実装されています。問題が発生した場合は、ブラウザのコンソールとページ上のデバッグ情報を確認してください。
