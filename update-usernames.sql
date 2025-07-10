-- 既存のプロフィールのユーザー名を更新するSQL
-- 注意: このSQLは既に登録済みのユーザーのユーザー名を修正するためのものです

-- 1. 現在のプロフィールを確認
SELECT p.id, p.username, au.raw_user_meta_data->>'username' as registered_username
FROM profiles p
JOIN auth.users au ON p.id = au.id;

-- 2. ユーザー名を登録時の名前に更新
UPDATE profiles 
SET username = au.raw_user_meta_data->>'username'
FROM auth.users au 
WHERE profiles.id = au.id 
AND au.raw_user_meta_data->>'username' IS NOT NULL
AND au.raw_user_meta_data->>'username' != profiles.username;

-- 3. 更新後の確認
SELECT p.id, p.username, au.raw_user_meta_data->>'username' as registered_username
FROM profiles p
JOIN auth.users au ON p.id = au.id;
