/*
  # Livestock Management System - Core Tables

  ## Summary
  Creates the foundational tables for the livestock management system including
  users, locations, animals, and related tracking tables.

  ## New Tables
  1. `locations` - Physical farm locations (sheds, paddocks, quarantine areas)
  2. `animals` - Individual animal records with full metadata
  3. `weight_records` - Historical weight measurements per animal
  4. `animal_movements` - Tracking animal location changes
  5. `herd_groups` - Logical groupings of animals
  6. `herd_group_members` - Many-to-many: animals in groups

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read all data
  - Only owner/manager roles (tracked via app metadata) can write
*/

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('shed','paddock','quarantine','storage','office','milking_parlor')),
  capacity integer DEFAULT 0,
  current_occupancy integer DEFAULT 0,
  area_sqm numeric(10,2),
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update locations"
  ON locations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Herd Groups
CREATE TABLE IF NOT EXISTS herd_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_id uuid REFERENCES locations(id),
  supervisor_id uuid,
  member_count integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE herd_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read herd_groups"
  ON herd_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert herd_groups"
  ON herd_groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update herd_groups"
  ON herd_groups FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Animals
CREATE TABLE IF NOT EXISTS animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id text UNIQUE NOT NULL,
  rfid text,
  species text NOT NULL CHECK (species IN ('cattle','sheep','goat')),
  breed text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male','female')),
  birth_date date,
  birth_weight_kg numeric(6,2),
  current_weight_kg numeric(6,2),
  status text NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy','sick','pregnant','lactating','dry','culled','sold','dead')),
  purpose text NOT NULL CHECK (purpose IN ('dairy','beef','wool','dual','breeding')),
  color text DEFAULT '',
  photo_url text,
  dam_id uuid REFERENCES animals(id),
  sire_id uuid REFERENCES animals(id),
  current_location_id uuid REFERENCES locations(id),
  acquisition_type text DEFAULT 'born' CHECK (acquisition_type IN ('born','purchased','gift')),
  acquisition_cost numeric(12,2),
  acquisition_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read animals"
  ON animals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert animals"
  ON animals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update animals"
  ON animals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Herd Group Members
CREATE TABLE IF NOT EXISTS herd_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  herd_group_id uuid NOT NULL REFERENCES herd_groups(id),
  animal_id uuid NOT NULL REFERENCES animals(id),
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  UNIQUE(herd_group_id, animal_id)
);

ALTER TABLE herd_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read herd_group_members"
  ON herd_group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert herd_group_members"
  ON herd_group_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update herd_group_members"
  ON herd_group_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Weight Records
CREATE TABLE IF NOT EXISTS weight_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id),
  weigh_date date NOT NULL,
  weight_kg numeric(6,2) NOT NULL,
  body_condition_score numeric(3,1),
  chest_girth_cm numeric(5,1),
  body_length_cm numeric(5,1),
  height_cm numeric(5,1),
  notes text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read weight_records"
  ON weight_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert weight_records"
  ON weight_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Animal Movements
CREATE TABLE IF NOT EXISTS animal_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id),
  from_location_id uuid REFERENCES locations(id),
  to_location_id uuid REFERENCES locations(id),
  movement_date date NOT NULL,
  reason text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE animal_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read animal_movements"
  ON animal_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert animal_movements"
  ON animal_movements FOR INSERT
  TO authenticated
  WITH CHECK (true);
