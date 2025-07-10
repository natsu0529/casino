# Google認証設定ガイド

## 1. Google Cloud Consoleでの設定

### Step 1: Google Cloud Projectの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成、または既存のプロジェクトを選択
3. プロジェクト名を設定（例：casino-app-auth）

### Step 2: OAuth 2.0認証情報の作成
1. 左側メニューから「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
3. アプリケーションの種類で「ウェブアプリケーション」を選択
4. 名前を入力（例：Casino App Web Client）
5. 承認済みのJavaScript生成元に以下を追加：
   - `http://localhost:5173` (開発環境)
   - `https://your-vercel-domain.vercel.app` (本番環境)
6. 承認済みのリダイレクトURIに以下を追加：
   - `https://your-supabase-project.supabase.co/auth/v1/callback`

### Step 3: クライアントIDとシークレットを取得
作成完了後、以下の情報をメモ：
- クライアントID
- クライアントシークレット

## 2. Supabaseでの設定

### Supabase Dashboardでの設定
1. Supabaseプロジェクトのダッシュボードにアクセス
2. 左側メニューから「Authentication」→「Providers」を選択
3. 「Google」を有効化
4. Google Cloud Consoleで取得した以下を入力：
   - Client ID
   - Client Secret
5. 「Save」をクリック

### リダイレクトURLの設定
「Authentication」→「Settings」→「URL Configuration」で以下のURLを設定：
- Site URL: `https://your-vercel-domain.vercel.app`
- Additional redirect URLs:
  - `http://localhost:5173` (開発環境)
  - `https://your-vercel-domain.vercel.app`

## 3. 環境変数の設定

### .env.local ファイル（開発環境）
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Vercelでの環境変数設定（本番環境）
1. Vercelダッシュボードにアクセス
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」
4. 以下の環境変数を追加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 4. 実装完了事項

✅ Google認証のサポートを追加
✅ 既存のメール認証と併用可能
✅ Google認証時の自動プロフィール作成
✅ UIにGoogleログインボタンを追加

## 5. 使用方法

1. ユーザーは「Googleでログイン」ボタンをクリック
2. Googleの認証画面にリダイレクト
3. Google認証完了後、アプリに戻る
4. 初回ログイン時は自動的にプロフィールが作成される
5. Google認証のユーザー名は以下の優先順位で設定：
   - Google full_name
   - Google name
   - メールアドレスの@より前の部分
   - ランダムなユーザーID

## 6. 注意事項

- メール認証とGoogle認証は両方利用可能
- 同じメールアドレスでも認証方法が異なれば別ユーザーとして扱われる
- Google認証はメールアドレスの確認が不要
- 本番環境では必ずHTTPS URLを使用する
