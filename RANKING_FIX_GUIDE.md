# 資産ランキング修正ガイド

## 問題
資産ランキングに自分だけしか表示されない

## 原因
SupabaseのRLS（Row Level Security）ポリシーが「自分のプロフィールのみ読み取り可能」に設定されているため

## 解決方法

### 1. Supabase SQL Editorでポリシーを更新

1. Supabaseダッシュボードにアクセス
2. 左側メニューから「SQL Editor」を選択
3. 以下のSQLを実行：

```sql
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- 新しいポリシー：全ユーザーがprofilesテーブルを読み取り可能
CREATE POLICY "Public profiles for ranking" ON profiles
  FOR SELECT USING (true);
```

### 2. 確認方法

1. アプリを再読み込み
2. ホームページの「資産ランキング TOP3」を確認
3. 他のユーザーが表示されることを確認

## 注意事項

- この設定により、usernameとbalanceは全ユーザーから見えるようになります
- 個人情報（メールアドレスなど）はprofilesテーブルに保存しないでください
- ランキング機能のために必要な設定です

## セキュリティ

- UPDATE/INSERTポリシーは変更なし（自分のデータのみ更新可能）
- 読み取りのみ全ユーザーに許可
- ゲーム履歴は引き続き自分のみ閲覧可能
