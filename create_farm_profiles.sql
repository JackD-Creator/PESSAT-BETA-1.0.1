-- Run this in Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/ooghavjtmbdybbhtanhs/sql/new)
CREATE TABLE IF NOT EXISTS farm_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  farm_name TEXT DEFAULT '',
  owner_name TEXT DEFAULT '',
  address TEXT DEFAULT '',
  farm_scale TEXT DEFAULT 'kecil' CHECK (farm_scale IN ('kecil', 'sedang', 'besar')),
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  social_media TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE farm_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON farm_profiles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own profile" ON farm_profiles
  FOR SELECT USING (auth.uid() = user_id);
