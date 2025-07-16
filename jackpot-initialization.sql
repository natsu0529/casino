-- ジャックポットプール初期化SQL
-- Supabaseのコンソールで実行してください

-- テーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS jackpot_pool (
  id SERIAL PRIMARY KEY,
  game_type TEXT UNIQUE NOT NULL,
  amount BIGINT NOT NULL DEFAULT 10000000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS設定
ALTER TABLE jackpot_pool ENABLE ROW LEVEL SECURITY;

-- 読み取り権限（全ユーザー）
CREATE POLICY "Allow public read access" 
ON jackpot_pool FOR SELECT 
USING (true);

-- 更新権限（認証済みユーザー）
CREATE POLICY "Allow authenticated users to update" 
ON jackpot_pool FOR UPDATE 
USING (auth.role() = 'authenticated');

-- 初期データ挿入（存在しない場合のみ）
INSERT INTO jackpot_pool (game_type, amount) 
VALUES ('vip_mega_bucks', 10000000)
ON CONFLICT (game_type) DO NOTHING;

-- 確認クエリ
SELECT * FROM jackpot_pool WHERE game_type = 'vip_mega_bucks';
