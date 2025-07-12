-- 掲示板テーブルの作成
CREATE TABLE IF NOT EXISTS message_board (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_message_board_created_at ON message_board(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_board_user_id ON message_board(user_id);

-- RLS（Row Level Security）の有効化
ALTER TABLE message_board ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがメッセージを読むことができるポリシー
CREATE POLICY "Anyone can read messages" ON message_board
  FOR SELECT
  USING (true);

-- 認証済みユーザーのみがメッセージを投稿できるポリシー
CREATE POLICY "Authenticated users can insert messages" ON message_board
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のメッセージのみ更新・削除できるポリシー
CREATE POLICY "Users can update their own messages" ON message_board
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON message_board
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at カラムの自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_board_updated_at
  BEFORE UPDATE ON message_board
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
