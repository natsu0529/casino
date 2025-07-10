# Supabase セットアップガイド

このカジノアプリケーションでSupabaseを使用するためのセットアップ手順です。

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ/ログイン
4. 「New Project」をクリック
5. プロジェクト名を入力（例：casino-app）
6. データベースパスワードを設定
7. リージョンを選択（日本の場合は Northeast Asia (Tokyo)）
8. 「Create new project」をクリック

## 2. データベーススキーマの設定

プロジェクトが作成されたら：

1. Supabaseダッシュボードの左メニューから「SQL Editor」を選択
2. 「New query」をクリック
3. `database-schema.sql`の内容をコピーペースト
4. 「Run」をクリックしてスキーマを作成

## 3. 環境変数の設定

1. Supabaseダッシュボードの左メニューから「Settings」→「API」を選択
2. 以下の値をコピー：
   - Project URL
   - anon public key

3. プロジェクトの`.env`ファイルを更新：

```bash
# .env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. 認証設定

1. Supabaseダッシュボードの左メニューから「Authentication」→「Settings」を選択
2. 「Site URL」に開発環境のURL（例：`http://localhost:5173`）を設定
3. 「Email Auth」が有効になっていることを確認

## 5. RLS (Row Level Security) の確認

データベーススキーマの設定時に、以下のRLSポリシーが適用されています：

- **profiles テーブル**: ユーザーは自分のプロフィールのみ閲覧・更新可能
- **game_history テーブル**: ユーザーは自分のゲーム履歴のみ閲覧・挿入可能

## 6. テーブル構造

### profiles テーブル
- `id`: ユーザーID（auth.users と連携）
- `username`: ユーザー名
- `balance`: 残高
- `created_at`: 作成日時
- `updated_at`: 更新日時

### game_history テーブル
- `id`: ゲーム履歴ID
- `user_id`: ユーザーID
- `game_type`: ゲーム種類（blackjack, poker, slot, etc.）
- `bet_amount`: ベット額
- `win_amount`: 勝利額
- `result`: 結果（win, lose, tie）
- `played_at`: プレイ日時

## 7. アプリケーションの実行

```bash
# 依存関係をインストール（既に実行済み）
pnpm install

# 開発サーバーを起動
pnpm dev
```

## 8. 機能確認

アプリケーションが正常に動作することを確認：

1. ユーザー登録機能
2. ログイン機能
3. ゲームプレイ時の残高更新
4. ゲーム履歴の記録

## 9. 本番環境への移行

本番環境にデプロイする場合：

1. 本番用のSupabaseプロジェクトを作成
2. 環境変数を本番環境に設定
3. Supabaseの「Site URL」に本番環境のURLを設定

## トラブルシューティング

### よくある問題

1. **認証エラー**: 環境変数が正しく設定されているか確認
2. **データベースエラー**: RLSポリシーが正しく設定されているか確認
3. **メール認証**: テスト環境では確認メール機能を無効化することも可能

### デバッグ方法

ブラウザの開発者ツールのコンソールで、Supabaseからの詳細なエラーメッセージを確認できます。

```javascript
// Supabaseクライアントの動作確認
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY)
```

## 追加機能の実装

さらに機能を追加する場合：

1. **リーダーボード**: ユーザーの総勝利額でランキング
2. **統計情報**: 個人のゲーム統計
3. **友達機能**: ユーザー間の交流機能
4. **リアルタイム更新**: Supabaseのリアルタイム機能を活用

これらの機能を実装する際は、適切なRLSポリシーの設定を忘れずに行ってください。
