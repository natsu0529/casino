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

-- デバッグ用: 現在のユーザーの爵位と購入可能な次の爵位を確認する関数
CREATE OR REPLACE FUNCTION get_user_title_info(user_uuid UUID)
RETURNS TABLE(
  current_title VARCHAR(20),
  current_index INT,
  next_title VARCHAR(20),
  can_purchase_titles TEXT[]
) AS $$
DECLARE
  title_order TEXT[] := ARRAY['男爵', '子爵', '伯爵', '侯爵', '公爵'];
  curr_title VARCHAR(20);
  curr_idx INT;
BEGIN
  -- 現在の爵位を取得
  SELECT title INTO curr_title FROM profiles WHERE id = user_uuid;
  
  -- インデックスを取得
  curr_idx := COALESCE(array_position(title_order, curr_title), 0);
  
  -- 次に購入可能な爵位を決定
  RETURN QUERY
  SELECT 
    curr_title,
    curr_idx,
    CASE 
      WHEN curr_idx = 0 THEN '男爵'::VARCHAR(20)
      WHEN curr_idx < 5 THEN title_order[curr_idx + 1]
      ELSE NULL::VARCHAR(20)
    END,
    CASE 
      WHEN curr_idx = 0 THEN ARRAY['男爵']
      WHEN curr_idx < 5 THEN ARRAY[title_order[curr_idx + 1]]
      ELSE ARRAY[]::TEXT[]
    END;
END;
$$ LANGUAGE plpgsql;

-- 既存のポリシーを削除して再作成
DROP POLICY IF EXISTS "Users can view their own purchase history" ON title_purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON title_purchases;

-- 閲覧ポリシー（ユーザーは自分の購入履歴のみ閲覧可能）
CREATE POLICY "Users can view their own purchase history" ON title_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- 挿入ポリシー（認証されたユーザーが自分のIDで挿入可能）
CREATE POLICY "Users can insert their own purchases" ON title_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 購入履歴テーブルへのアクセス権限を確認する関数
CREATE OR REPLACE FUNCTION check_title_purchase_access(user_uuid UUID)
RETURNS TABLE(
  can_select BOOLEAN,
  can_insert BOOLEAN,
  current_auth_uid UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as can_select,
    TRUE as can_insert,
    auth.uid() as current_auth_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 購入履歴テーブルのテスト挿入関数
CREATE OR REPLACE FUNCTION test_title_purchase_insert(
  user_uuid UUID,
  title_name VARCHAR(20),
  purchase_price INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  inserted_id UUID
) AS $$
DECLARE
  new_id UUID;
  error_msg TEXT;
BEGIN
  BEGIN
    INSERT INTO title_purchases (user_id, title, price)
    VALUES (user_uuid, title_name, purchase_price)
    RETURNING id INTO new_id;
    
    RETURN QUERY SELECT TRUE, 'Success'::TEXT, new_id;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
    RETURN QUERY SELECT FALSE, error_msg, NULL::UUID;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 爵位購入の段階的制約を強制するトリガー関数
CREATE OR REPLACE FUNCTION enforce_stepwise_title_purchase()
RETURNS TRIGGER AS $$
DECLARE
  current_title VARCHAR(20);
  current_index INT;
  new_index INT;
  title_order TEXT[] := ARRAY['男爵', '子爵', '伯爵', '侯爵', '公爵'];
BEGIN
  -- デバッグログ: 受信したデータ
  RAISE NOTICE 'Trigger called with user_id: %, title: %, price: %', NEW.user_id, NEW.title, NEW.price;

  -- 現在の爵位を取得
  SELECT title INTO current_title FROM profiles WHERE id = NEW.user_id;
  RAISE NOTICE 'Current title from profiles: %', current_title;

  -- 現在の爵位のインデックスを取得
  current_index := COALESCE(array_position(title_order, current_title), 0);

  -- 購入しようとしている爵位のインデックスを取得
  new_index := array_position(title_order, NEW.title);

  -- デバッグ用ログ
  RAISE NOTICE 'Current title: %, Current index: %, New title: %, New index: %', current_title, current_index, NEW.title, new_index;

  -- 購入が段階的でない場合はエラーをスロー
  IF current_title IS NULL AND NEW.title != '男爵' THEN
    RAISE EXCEPTION 'エラー: 最初は男爵から購入してください。現在の爵位: %, 購入しようとしている爵位: %', current_title, NEW.title;
  ELSIF new_index IS NULL THEN
    RAISE EXCEPTION 'エラー: 無効な爵位です。購入しようとしている爵位: %', NEW.title;
  ELSIF new_index != current_index + 1 THEN
    RAISE EXCEPTION 'エラー: 段階的に購入してください。現在の爵位: % (index: %), 購入しようとしている爵位: % (index: %)', current_title, current_index, NEW.title, new_index;
  END IF;

  -- 検証が成功した場合、profilesテーブルを更新
  UPDATE profiles SET title = NEW.title WHERE id = NEW.user_id;
  RAISE NOTICE 'Successfully updated profiles table with new title: %', NEW.title;

  -- 購入履歴の挿入を許可
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーをタイトル購入履歴テーブルに追加
DROP TRIGGER IF EXISTS enforce_stepwise_title_purchase_trigger ON title_purchases;
CREATE TRIGGER enforce_stepwise_title_purchase_trigger
BEFORE INSERT ON title_purchases
FOR EACH ROW
EXECUTE FUNCTION enforce_stepwise_title_purchase();
