-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own game history" ON game_history;
DROP POLICY IF EXISTS "Users can insert their own game history" ON game_history;

-- より柔軟なポリシーを作成
CREATE POLICY "Enable read access for users based on user_id" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for users based on user_id" ON game_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users only" ON game_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
