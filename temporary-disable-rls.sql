-- 開発中の一時的な解決策
-- 注意: 本番環境では使用しないでください

-- 一時的にRLSを無効化
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_history DISABLE ROW LEVEL SECURITY;

-- 再度有効化する場合は以下を実行
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
