-- VIP専用掲示板テーブルの作成
CREATE TABLE vip_message_board (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) を有効にする
ALTER TABLE vip_message_board ENABLE ROW LEVEL SECURITY;

-- VIP専用掲示板の読み取りポリシー（爵位を持つユーザーのみ）
CREATE POLICY "VIP users can read VIP messages" ON vip_message_board
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.title IS NOT NULL
        )
    );

-- VIP専用掲示板の投稿ポリシー（爵位を持つユーザーのみ）
CREATE POLICY "VIP users can post VIP messages" ON vip_message_board
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.title IS NOT NULL
        )
    );

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_vip_message_board_created_at ON vip_message_board(created_at DESC);
CREATE INDEX idx_vip_message_board_user_id ON vip_message_board(user_id);

-- 既存のテーブルがある場合の修正用SQL（上記でエラーが出る場合に実行）
-- DROP TABLE IF EXISTS vip_message_board CASCADE;

-- または既存テーブルの外部キー制約を変更する場合：
-- ALTER TABLE vip_message_board DROP CONSTRAINT IF EXISTS vip_message_board_user_id_fkey;
-- ALTER TABLE vip_message_board ADD CONSTRAINT vip_message_board_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
