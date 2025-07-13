-- ショップ機能用のスキーマ追加

-- profilesテーブルに爵位カラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS title VARCHAR(20) DEFAULT NULL;

-- 爵位の種類を制限する制約
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_title_values'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT check_title_values 
    CHECK (title IS NULL OR title IN ('男爵', '子爵', '伯爵', '侯爵', '公爵'));
  END IF;
END $$;

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

-- 爵位購入の段階的制約を強制するトリガー関数
CREATE OR REPLACE FUNCTION enforce_stepwise_title_purchase()
RETURNS TRIGGER AS $$
DECLARE
  current_title VARCHAR(20);
  current_index INT;
  new_index INT;
  title_order TEXT[] := ARRAY['男爵', '子爵', '伯爵', '侯爵', '公爵'];
BEGIN
  -- 現在の爵位を取得
  SELECT title INTO current_title FROM profiles WHERE id = NEW.user_id;

  -- 現在の爵位のインデックスを取得
  current_index := COALESCE(array_position(title_order, current_title), 0);

  -- 購入しようとしている爵位のインデックスを取得
  new_index := array_position(title_order, NEW.title);

  -- 購入が段階的でない場合はエラーをスロー
  IF new_index IS NULL OR new_index != current_index + 1 THEN
    RAISE EXCEPTION 'Invalid title purchase: You can only purchase the next title in order.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーをタイトル購入履歴テーブルに追加
DROP TRIGGER IF EXISTS enforce_stepwise_title_purchase_trigger ON title_purchases;
CREATE TRIGGER enforce_stepwise_title_purchase_trigger
BEFORE INSERT ON title_purchases
FOR EACH ROW
EXECUTE FUNCTION enforce_stepwise_title_purchase();
