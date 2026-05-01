-- Daily activity progress tracker
CREATE TABLE IF NOT EXISTS daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  vocab BOOLEAN NOT NULL DEFAULT FALSE,
  writing BOOLEAN NOT NULL DEFAULT FALSE,
  shadowing BOOLEAN NOT NULL DEFAULT FALSE,
  thinking BOOLEAN NOT NULL DEFAULT FALSE,
  speaking BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their progress"
  ON daily_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
