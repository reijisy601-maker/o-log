-- デフォルトのセキュリティ設定を挿入
INSERT INTO security_settings (key, value)
VALUES 
  ('allowed_domains', '["example.com", "company.com"]'::jsonb),
  ('max_file_size', '10485760'::jsonb),
  ('allowed_file_types', '["image/jpeg", "image/png", "image/webp"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 月次統計を取得するビューを作成
CREATE OR REPLACE VIEW monthly_stats AS
SELECT 
  s.month,
  COUNT(DISTINCT up.id) as total_users,
  COUNT(DISTINCT s.user_id) as submitted_users,
  ROUND(
    (COUNT(DISTINCT s.user_id)::NUMERIC / NULLIF(COUNT(DISTINCT up.id), 0)) * 100,
    2
  ) as submission_rate,
  ROUND(AVG(s.score), 2) as average_score
FROM user_profiles up
LEFT JOIN submissions s ON up.id = s.user_id
WHERE up.role = 'user'
GROUP BY s.month
ORDER BY s.month DESC;

-- 未投稿ユーザーを取得する関数
CREATE OR REPLACE FUNCTION get_non_submitted_users(target_month TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  last_login TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.name,
    up.last_login
  FROM user_profiles up
  WHERE up.role = 'user'
    AND NOT EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.user_id = up.id AND s.month = target_month
    )
  ORDER BY up.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー作成時に自動的にプロファイルを作成するトリガー
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
