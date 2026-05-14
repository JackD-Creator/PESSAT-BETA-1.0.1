/*
  # Health, Vaccination, and Breeding Tables

  ## Summary
  Creates tables for tracking animal health records, vaccinations, and breeding events.

  ## New Tables
  1. `health_records` - Medical records per animal (checkups, illnesses, treatments)
  2. `vaccinations` - Vaccination history for animals or herd groups
  3. `breeding_events` - Reproductive events (heat, insemination, birth, etc.)

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read all data and insert/update records
*/

-- Health Records
CREATE TABLE IF NOT EXISTS health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id),
  record_date date NOT NULL,
  type text NOT NULL CHECK (type IN ('checkup','illness','injury','treatment','surgery','preventive')),
  diagnosis text,
  treatment text,
  vet_name text,
  cost numeric(12,2) DEFAULT 0,
  is_resolved boolean DEFAULT false,
  follow_up_date date,
  notes text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read health_records"
  ON health_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert health_records"
  ON health_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update health_records"
  ON health_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Vaccinations
CREATE TABLE IF NOT EXISTS vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid REFERENCES animals(id),
  herd_group_id uuid REFERENCES herd_groups(id),
  vaccine_name text NOT NULL,
  batch_number text,
  date_administered date NOT NULL,
  next_due_date date,
  cost numeric(12,2) DEFAULT 0,
  administered_by text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vaccinations"
  ON vaccinations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vaccinations"
  ON vaccinations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vaccinations"
  ON vaccinations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Breeding Events
CREATE TABLE IF NOT EXISTS breeding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id),
  sire_id uuid REFERENCES animals(id),
  event_type text NOT NULL CHECK (event_type IN ('heat','insemination','pregnancy_check','birth','abortion','dry_off')),
  event_date date NOT NULL,
  expected_due_date date,
  actual_birth_date date,
  offspring_count integer,
  cost numeric(12,2) DEFAULT 0,
  notes text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE breeding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read breeding_events"
  ON breeding_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert breeding_events"
  ON breeding_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update breeding_events"
  ON breeding_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
