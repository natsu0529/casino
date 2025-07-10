-- ランキング機能用のRLSポリシーを追加
-- 既存のポリシーを削除して新しいポリシーを作成

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- 新しいポリシー：全ユーザーがprofilesテーブルを読み取り可能（ランキング用）
CREATE POLICY "Public profiles for ranking" ON profiles
  FOR SELECT USING (true);

-- 注意：この設定により、usernameとbalanceは全ユーザーから見えるようになります
-- 個人情報（メールアドレスなど）はprofilesテーブルに保存しないでください
