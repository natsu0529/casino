-- ユーザープロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  balance INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ゲーム履歴テーブル
CREATE TABLE game_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  game_type TEXT NOT NULL,
  bet_amount INTEGER NOT NULL,
  win_amount INTEGER NOT NULL,
  result TEXT NOT NULL, -- 'win', 'lose', 'tie'
  played_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security) を有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

-- プロフィールのRLSポリシー
-- 全ユーザーがprofilesテーブルを読み取り可能（ランキング機能用）
CREATE POLICY "Public profiles for ranking" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ゲーム履歴のRLSポリシー
CREATE POLICY "Users can view their own game history" ON game_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game history" ON game_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- トリガー関数：updated_at を自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- プロフィールテーブルにトリガーを設定
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- インデックスを作成してパフォーマンスを向上
CREATE INDEX idx_game_history_user_id ON game_history(user_id);
CREATE INDEX idx_game_history_played_at ON game_history(played_at);
CREATE INDEX idx_profiles_username ON profiles(username);

-- ゲーム履歴を3時間経過で自動削除するSQL（Supabaseスケジューラ等で定期実行）
DELETE FROM game_history
WHERE played_at < NOW() - INTERVAL '3 hours';
