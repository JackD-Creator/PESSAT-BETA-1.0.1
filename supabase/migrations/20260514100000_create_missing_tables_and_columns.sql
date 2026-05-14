/*
  # Missing Tables & Columns for PRD 2.0

  ## New Tables
  1. `users` - User accounts for authentication & RBAC
  2. `attribute_definitions` - Dynamic attribute schema per species/purpose
  3. `animal_attributes` - Dynamic attribute values per animal
  4. `genetic_records` - Genetic & pedigree data

  ## ALTER TABLE Additions
  - animals: death_date, death_reason, updated_at
  - vaccinations: recorded_by
  - breeding_events: offspring_tag_ids
  - feed_formulas: target_phase, total_quantity_kg, calculated_protein_pct,
    calculated_tdn_pct, calculated_cost_per_kg, is_active, created_by, updated_at
  - feed_formula_items: percentage, cost_at_formulation
  - nutrition_requirements: physiological_phase, weight_range_kg, daily_dm_intake_kg,
    dm_pct_body_weight, cp_requirement_pct, tdn_requirement_pct, me_requirement_mcal,
    ca_requirement_pct, p_requirement_pct, reference
  - product_sales: expand product_type CHECK to include meat, manure
  - alerts: source_table, source_id
  - tasks: related_source_table, related_source_id, updated_at
*/

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','manager','worker')),
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLE: attribute_definitions
-- ============================================================
CREATE TABLE IF NOT EXISTS attribute_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species text NOT NULL CHECK (species IN ('cattle','sheep','goat')),
  purpose text CHECK (purpose IN ('dairy','beef','wool','dual','breeding')),
  attribute_key text NOT NULL,
  label text NOT NULL,
  data_type text NOT NULL CHECK (data_type IN ('text','number','date','boolean')),
  unit text,
  min_value numeric(10,2),
  max_value numeric(10,2),
  is_required boolean DEFAULT false,
  category text,
  sort_order integer DEFAULT 0,
  UNIQUE (species, purpose, attribute_key)
);

ALTER TABLE attribute_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read attribute_definitions"
  ON attribute_definitions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert attribute_definitions"
  ON attribute_definitions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update attribute_definitions"
  ON attribute_definitions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- TABLE: animal_attributes
-- ============================================================
CREATE TABLE IF NOT EXISTS animal_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id),
  attribute_key text NOT NULL,
  attribute_value text NOT NULL,
  recorded_date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE (animal_id, attribute_key, recorded_date)
);

ALTER TABLE animal_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read animal_attributes"
  ON animal_attributes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert animal_attributes"
  ON animal_attributes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update animal_attributes"
  ON animal_attributes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- TABLE: genetic_records
-- ============================================================
CREATE TABLE IF NOT EXISTS genetic_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL UNIQUE REFERENCES animals(id),
  inbreeding_coefficient numeric(5,2),
  genetic_merit_milk numeric(6,2),
  genetic_merit_growth numeric(6,2),
  genetic_merit_reproduction numeric(6,2),
  genetic_merit_wool numeric(6,2),
  dna_sample_id text,
  genotype_data text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE genetic_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read genetic_records"
  ON genetic_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert genetic_records"
  ON genetic_records FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update genetic_records"
  ON genetic_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ALTER animals: add missing columns
-- ============================================================
ALTER TABLE animals ADD COLUMN IF NOT EXISTS death_date date;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS death_reason text;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- ALTER vaccinations: add recorded_by
-- ============================================================
ALTER TABLE vaccinations ADD COLUMN IF NOT EXISTS recorded_by uuid;

-- ============================================================
-- ALTER breeding_events: add offspring_tag_ids
-- ============================================================
ALTER TABLE breeding_events ADD COLUMN IF NOT EXISTS offspring_tag_ids text;

-- ============================================================
-- ALTER feed_formulas: add missing columns
-- ============================================================
ALTER TABLE feed_formulas ADD COLUMN IF NOT EXISTS target_phase text;
ALTER TABLE feed_formulas ADD COLUMN IF NOT EXISTS total_quantity_kg numeric(8,2);
ALTER TABLE feed_formulas ADD COLUMN IF NOT EXISTS calculated_protein_pct numeric(5,2);
ALTER TABLE feed_formulas ADD COLUMN IF NOT EXISTS calculated_tdn_pct numeric(5,2);
ALTER TABLE feed_formulas ADD COLUMN IF NOT EXISTS calculated_cost_per_kg numeric(10,2);
ALTER TABLE feed_formulas ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE feed_formulas ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE feed_formulas ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- ALTER feed_formula_items: add missing columns
-- ============================================================
ALTER TABLE feed_formula_items ADD COLUMN IF NOT EXISTS percentage numeric(5,2);
ALTER TABLE feed_formula_items ADD COLUMN IF NOT EXISTS cost_at_formulation numeric(10,2);

-- ============================================================
-- ALTER nutrition_requirements: add/replace columns
-- ============================================================
ALTER TABLE nutrition_requirements ADD COLUMN IF NOT EXISTS physiological_phase text;
ALTER TABLE nutrition_requirements ADD COLUMN IF NOT EXISTS weight_range_kg text;
ALTER TABLE nutrition_requirements ADD COLUMN IF NOT EXISTS daily_dm_intake_kg numeric(6,2);
ALTER TABLE nutrition_requirements ADD COLUMN IF NOT EXISTS dm_pct_body_weight numeric(4,1);
ALTER TABLE nutrition_requirements ADD COLUMN IF NOT EXISTS cp_requirement_pct numeric(5,2);
ALTER TABLE nutrition_requirements ADD COLUMN IF NOT EXISTS tdn_requirement_pct numeric(5,2);
ALTER TABLE nutrition_requirements ADD COLUMN IF NOT EXISTS me_requirement_mcal numeric(8,2);
ALTER TABLE nutrition_requirements ADD COLUMN IF NOT EXISTS ca_requirement_pct numeric(5,2);
ALTER TABLE nutrition_requirements ADD COLUMN IF NOT EXISTS p_requirement_pct numeric(5,2);
ALTER TABLE nutrition_requirements ADD COLUMN IF NOT EXISTS reference text;

-- ============================================================
-- ALTER product_sales: expand product type
-- ============================================================
-- Drop existing check and recreate (only if it exists)
ALTER TABLE product_sales DROP CONSTRAINT IF EXISTS product_sales_product_type_check;
ALTER TABLE product_sales ADD CONSTRAINT product_sales_product_type_check
  CHECK (product_type IN ('milk','wool','meat','manure','other'));

-- ============================================================
-- ALTER alerts: add source tracking
-- ============================================================
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS source_table text;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS source_id text;

-- ============================================================
-- ALTER tasks: add source tracking + updated_at
-- ============================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS related_source_table text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS related_source_id text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- Additional Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_animals_species_status ON animals(species, status);
CREATE INDEX IF NOT EXISTS idx_animals_dam_id ON animals(dam_id);
CREATE INDEX IF NOT EXISTS idx_animals_sire_id ON animals(sire_id);
CREATE INDEX IF NOT EXISTS idx_breeding_events_event_type ON breeding_events(event_type);
CREATE INDEX IF NOT EXISTS idx_feed_consumption_date ON feed_consumption(consumption_date);
CREATE INDEX IF NOT EXISTS idx_medicine_usages_date ON medicine_usages(usage_date);
CREATE INDEX IF NOT EXISTS idx_animal_purchases_date ON animal_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_animal_sales_date ON animal_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_alerts_type_severity ON alerts(type, severity);
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_product_sales_date ON product_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_labor_expenses_date ON labor_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_operational_expenses_date ON operational_expenses(expense_date);
