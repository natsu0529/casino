-- ショップ機能用のスキーマ追加

-- profilesテーブルに爵位カラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS title VARCHAR(20) DEFAULT NULL;

-- 爵位の種類を制限する制約
ALTER TABLE profiles 
ADD CONSTRAINT check_title_values 
CHECK (title IS NULL OR title IN ('男爵', '子爵', '伯爵', '侯爵', '公爵'));

-- 購入履歴テーブル（オプション）
CREATE TABLE IF NOT EXISTS title_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(20) NOT NULL,
  price INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_profiles_title ON profiles(title);
CREATE INDEX IF NOT EXISTS idx_title_purchases_user_id ON title_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_title_purchases_purchased_at ON title_purchases(purchased_at DESC);

-- RLS設定
ALTER TABLE title_purchases ENABLE ROW LEVEL SECURITY;

-- 購入履歴のポリシー
DROP POLICY IF EXISTS "Users can view their own purchase history" ON title_purchases;
CREATE POLICY "Users can view their own purchase history" ON title_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchases" ON title_purchases;
CREATE POLICY "Users can insert their own purchases" ON title_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
