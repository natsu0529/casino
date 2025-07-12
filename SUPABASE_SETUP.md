# Supabase セットアップガイド

## 🚨 緊急: メッセージボード データベース エラーの修正

**エラー**: `"Could not find a relationship between 'message_board' and 'profiles'"` (PGRST200)
**原因**: `message_board` テーブルが Supabase データベースに作成されていません。

### 即座に修正する手順:

#### 1. Supabase ダッシュボードにアクセス
1. [https://app.supabase.com](https://app.supabase.com) にアクセス
2. あなたのアカウントでログイン
3. casino-app プロジェクトを選択

#### 2. データベーススキーマを適用
1. 左サイドバーの **SQL Editor** をクリック
2. **"New Query"** をクリック
3. `message-board-schema.sql` ファイルの全内容をコピー
4. SQL エディターに貼り付け
5. **"Run"** をクリックして実行

#### 3. テーブル作成を確認
1. 左サイドバーの **Database** → **Tables** に移動
2. `message_board` テーブルが表示されることを確認
3. テーブルをクリックして以下を確認:
   - カラム: `id`, `user_id`, `content`, `created_at`, `updated_at`
   - 外部キー: `user_id` → `profiles(id)`

#### 4. RLS ポリシーを確認
1. `message_board` テーブルビュー内
2. **RLS** タブに移動
3. 以下のポリシーが存在することを確認:
   - "Anyone can read messages"
   - "Authenticated users can insert messages"
   - "Users can update their own messages"
   - "Users can delete their own messages"

#### 5. 修正をテスト
スキーマ適用後、React アプリを再起動:
```bash
pnpm dev
```

メッセージボードが正常に動作するはずです！

---

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

## メッセージボード専用トラブルシューティング

### 代替案: SQL コマンドを個別実行

SQL Editor で以下のコマンドを一つずつ実行することもできます:

```sql
-- 1. テーブル作成
CREATE TABLE IF NOT EXISTS message_board (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. インデックス作成
CREATE INDEX IF NOT EXISTS idx_message_board_created_at ON message_board(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_board_user_id ON message_board(user_id);

-- 3. RLS 有効化
ALTER TABLE message_board ENABLE ROW LEVEL SECURITY;

-- 4. ポリシー作成
CREATE POLICY "Anyone can read messages" ON message_board FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert messages" ON message_board FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own messages" ON message_board FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages" ON message_board FOR DELETE USING (auth.uid() = user_id);
```

### エラー対処法

#### "table already exists" エラーが出る場合:
テーブルが既に存在するが設定が間違っている可能性があります:
```sql
DROP TABLE IF EXISTS message_board CASCADE;
-- その後、完全なスキーマを再実行
```

#### 外部キーエラーが発生する場合:
`profiles` テーブルが存在することを確認:
```sql
SELECT * FROM profiles LIMIT 1;
```

#### Supabase キャッシュをクリア:
スキーマキャッシュのリフレッシュが必要な場合:
1. Supabase ダッシュボード: **Settings** → **API**
2. **"Refresh Schema Cache"** をクリック

### DB セットアップ後の次のステップ:
1. ユーザー登録/ログインのテスト
2. メッセージ投稿のテスト
3. メッセージ取得のテスト
4. リアルタイム更新の動作確認
