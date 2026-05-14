/*
  # Feed and Medicine Inventory Tables

  ## Summary
  Creates tables for managing feed types, feed inventory, medicine types,
  medicine inventory, and related purchase/consumption records.

  ## New Tables
  1. `feeds` - Feed type definitions with nutritional data
  2. `feed_inventory` - Current stock levels per feed type
  3. `feed_purchases` - Feed purchase history
  4. `feed_consumption` - Daily feed usage records per herd group
  5. `feed_formulas` - Ration formulation recipes
  6. `feed_formula_items` - Ingredients per formula
  7. `nutrition_requirements` - Nutritional targets per animal type
  8. `medicines` - Medicine type definitions
  9. `medicine_inventory` - Current medicine stock levels
  10. `medicine_purchases` - Medicine purchase history
  11. `medicine_usages` - Medicine usage records per animal

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read and write all feed/medicine data
*/

-- Feeds
CREATE TABLE IF NOT EXISTS feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('forage','concentrate','mineral','supplement','byproduct','complete_feed','additive')),
  sub_category text,
  form text,
  unit text DEFAULT 'kg',
  dry_matter_pct numeric(5,2),
  crude_protein_pct numeric(5,2),
  crude_fiber_pct numeric(5,2),
  tdn_pct numeric(5,2),
  metabolizable_energy numeric(8,2),
  calcium_pct numeric(5,2),
  phosphorus_pct numeric(5,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feeds"
  ON feeds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert feeds"
  ON feeds FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update feeds"
  ON feeds FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Feed Inventory
CREATE TABLE IF NOT EXISTS feed_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid NOT NULL REFERENCES feeds(id),
  quantity_on_hand numeric(10,2) DEFAULT 0,
  avg_cost_per_unit numeric(10,2) DEFAULT 0,
  total_cost numeric(14,2) DEFAULT 0,
  min_threshold numeric(10,2) DEFAULT 0,
  last_purchase_date date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE feed_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feed_inventory"
  ON feed_inventory FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert feed_inventory"
  ON feed_inventory FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update feed_inventory"
  ON feed_inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Feed Purchases
CREATE TABLE IF NOT EXISTS feed_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid NOT NULL REFERENCES feeds(id),
  purchase_date date NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit text DEFAULT 'kg',
  price_per_unit numeric(10,2) NOT NULL,
  total_amount numeric(14,2) NOT NULL,
  supplier text,
  invoice_number text,
  notes text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feed_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feed_purchases"
  ON feed_purchases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert feed_purchases"
  ON feed_purchases FOR INSERT TO authenticated WITH CHECK (true);

-- Feed Consumption
CREATE TABLE IF NOT EXISTS feed_consumption (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid NOT NULL REFERENCES feeds(id),
  herd_group_id uuid REFERENCES herd_groups(id),
  animal_id uuid REFERENCES animals(id),
  consumption_date date NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit text DEFAULT 'kg',
  cost_per_unit numeric(10,2) DEFAULT 0,
  total_cost numeric(14,2) DEFAULT 0,
  notes text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feed_consumption ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feed_consumption"
  ON feed_consumption FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert feed_consumption"
  ON feed_consumption FOR INSERT TO authenticated WITH CHECK (true);

-- Feed Formulas
CREATE TABLE IF NOT EXISTS feed_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_species text CHECK (target_species IN ('cattle','sheep','goat','all')),
  target_purpose text,
  total_weight_kg numeric(8,2) DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feed_formulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feed_formulas"
  ON feed_formulas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert feed_formulas"
  ON feed_formulas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update feed_formulas"
  ON feed_formulas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Feed Formula Items
CREATE TABLE IF NOT EXISTS feed_formula_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id uuid NOT NULL REFERENCES feed_formulas(id),
  feed_id uuid NOT NULL REFERENCES feeds(id),
  quantity_kg numeric(8,2) NOT NULL,
  percentage numeric(5,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feed_formula_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feed_formula_items"
  ON feed_formula_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert feed_formula_items"
  ON feed_formula_items FOR INSERT TO authenticated WITH CHECK (true);

-- Nutrition Requirements
CREATE TABLE IF NOT EXISTS nutrition_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species text NOT NULL,
  purpose text NOT NULL,
  production_stage text,
  dm_requirement_kg numeric(6,2),
  crude_protein_pct numeric(5,2),
  tdn_pct numeric(5,2),
  calcium_g numeric(7,2),
  phosphorus_g numeric(7,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nutrition_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read nutrition_requirements"
  ON nutrition_requirements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert nutrition_requirements"
  ON nutrition_requirements FOR INSERT TO authenticated WITH CHECK (true);

-- Medicines
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('antibiotic','vitamin','vaccine','antiparasitic','hormone','anti_inflammatory','other')),
  unit text DEFAULT 'botol',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read medicines"
  ON medicines FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert medicines"
  ON medicines FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update medicines"
  ON medicines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Medicine Inventory
CREATE TABLE IF NOT EXISTS medicine_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid NOT NULL REFERENCES medicines(id),
  quantity_on_hand numeric(10,2) DEFAULT 0,
  avg_cost_per_unit numeric(10,2) DEFAULT 0,
  total_cost numeric(14,2) DEFAULT 0,
  min_threshold numeric(10,2) DEFAULT 0,
  expiry_date date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medicine_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read medicine_inventory"
  ON medicine_inventory FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert medicine_inventory"
  ON medicine_inventory FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update medicine_inventory"
  ON medicine_inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Medicine Purchases
CREATE TABLE IF NOT EXISTS medicine_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid NOT NULL REFERENCES medicines(id),
  purchase_date date NOT NULL,
  quantity numeric(10,2) NOT NULL,
  price_per_unit numeric(10,2) NOT NULL,
  total_amount numeric(14,2) NOT NULL,
  supplier text,
  expiry_date date,
  batch_number text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medicine_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read medicine_purchases"
  ON medicine_purchases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert medicine_purchases"
  ON medicine_purchases FOR INSERT TO authenticated WITH CHECK (true);

-- Medicine Usages
CREATE TABLE IF NOT EXISTS medicine_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid NOT NULL REFERENCES medicines(id),
  animal_id uuid NOT NULL REFERENCES animals(id),
  health_record_id uuid REFERENCES health_records(id),
  usage_date date NOT NULL,
  quantity numeric(8,2) NOT NULL,
  dosage_notes text,
  cost_per_unit numeric(10,2) DEFAULT 0,
  total_cost numeric(12,2) DEFAULT 0,
  administered_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medicine_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read medicine_usages"
  ON medicine_usages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert medicine_usages"
  ON medicine_usages FOR INSERT TO authenticated WITH CHECK (true);
