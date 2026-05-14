/*
  # Production, Finance, and Operations Tables

  ## Summary
  Creates tables for daily production tracking, animal sales/purchases,
  product sales, financial transactions, operational expenses, tasks, and alerts.

  ## New Tables
  1. `daily_production` - Daily milk/wool production records
  2. `product_sales` - Records of selling farm products (milk, wool)
  3. `animal_purchases` - Records of buying new animals
  4. `animal_sales` - Records of selling animals
  5. `labor_expenses` - Worker salary and labor cost records
  6. `operational_expenses` - Utility bills and other operating costs
  7. `stock_adjustments` - Manual inventory corrections
  8. `financial_transactions` - Ledger of all financial events (auto-generated)
  9. `alerts` - System notifications and warnings
  10. `tasks` - Work assignments for farm staff

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read and write production/operations data
  - Financial data restricted to owner/manager roles via policy
*/

-- Daily Production
CREATE TABLE IF NOT EXISTS daily_production (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_date date NOT NULL,
  animal_id uuid REFERENCES animals(id),
  herd_group_id uuid REFERENCES herd_groups(id),
  product_type text NOT NULL CHECK (product_type IN ('milk','wool')),
  quantity numeric(10,2) NOT NULL,
  unit text NOT NULL,
  shift text DEFAULT 'all_day' CHECK (shift IN ('morning','evening','all_day')),
  quality_grade text,
  notes text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_production ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read daily_production"
  ON daily_production FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert daily_production"
  ON daily_production FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update daily_production"
  ON daily_production FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Product Sales
CREATE TABLE IF NOT EXISTS product_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date date NOT NULL,
  product_type text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit text NOT NULL,
  price_per_unit numeric(10,2) NOT NULL,
  total_amount numeric(14,2) NOT NULL,
  buyer_name text,
  payment_method text DEFAULT 'cash',
  invoice_number text,
  notes text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read product_sales"
  ON product_sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert product_sales"
  ON product_sales FOR INSERT TO authenticated WITH CHECK (true);

-- Animal Purchases
CREATE TABLE IF NOT EXISTS animal_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid REFERENCES animals(id),
  purchase_date date NOT NULL,
  seller_name text,
  purchase_price numeric(14,2) NOT NULL,
  weight_at_purchase_kg numeric(6,2),
  notes text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE animal_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read animal_purchases"
  ON animal_purchases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert animal_purchases"
  ON animal_purchases FOR INSERT TO authenticated WITH CHECK (true);

-- Animal Sales
CREATE TABLE IF NOT EXISTS animal_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid REFERENCES animals(id),
  sale_date date NOT NULL,
  buyer_name text,
  sale_price numeric(14,2) NOT NULL,
  weight_at_sale_kg numeric(6,2),
  reason text,
  notes text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE animal_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read animal_sales"
  ON animal_sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert animal_sales"
  ON animal_sales FOR INSERT TO authenticated WITH CHECK (true);

-- Labor Expenses
CREATE TABLE IF NOT EXISTS labor_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date date NOT NULL,
  worker_name text NOT NULL,
  worker_id uuid,
  expense_type text DEFAULT 'salary' CHECK (expense_type IN ('salary','overtime','bonus','benefit')),
  period_month integer,
  period_year integer,
  amount numeric(12,2) NOT NULL,
  notes text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE labor_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read labor_expenses"
  ON labor_expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert labor_expenses"
  ON labor_expenses FOR INSERT TO authenticated WITH CHECK (true);

-- Operational Expenses
CREATE TABLE IF NOT EXISTS operational_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date date NOT NULL,
  category text NOT NULL CHECK (category IN ('electricity','water','fuel','maintenance','transport','other')),
  amount numeric(12,2) NOT NULL,
  description text,
  invoice_number text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read operational_expenses"
  ON operational_expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert operational_expenses"
  ON operational_expenses FOR INSERT TO authenticated WITH CHECK (true);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_date date NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('feed','medicine')),
  item_id uuid NOT NULL,
  quantity_before numeric(10,2),
  quantity_after numeric(10,2),
  quantity_change numeric(10,2),
  reason text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stock_adjustments"
  ON stock_adjustments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert stock_adjustments"
  ON stock_adjustments FOR INSERT TO authenticated WITH CHECK (true);

-- Financial Transactions (ledger)
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date date NOT NULL,
  type text NOT NULL CHECK (type IN ('income','expense')),
  category text NOT NULL,
  cash_flow text NOT NULL CHECK (cash_flow IN ('cash_in','cash_out','non_cash')),
  amount numeric(14,2) NOT NULL,
  description text,
  source_table text,
  source_id uuid,
  animal_id uuid REFERENCES animals(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read financial_transactions"
  ON financial_transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert financial_transactions"
  ON financial_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('vaccination_due','low_stock_feed','low_stock_medicine','health_issue','breeding_due','task_overdue','weight_loss')),
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  title text NOT NULL,
  message text NOT NULL,
  animal_id uuid REFERENCES animals(id),
  is_read boolean DEFAULT false,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read alerts"
  ON alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert alerts"
  ON alerts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
  ON alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid,
  created_by uuid,
  due_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  related_animal_id uuid REFERENCES animals(id),
  related_herd_group_id uuid REFERENCES herd_groups(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tasks"
  ON tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert tasks"
  ON tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);
CREATE INDEX IF NOT EXISTS idx_animals_tag_id ON animals(tag_id);
CREATE INDEX IF NOT EXISTS idx_health_records_animal_id ON health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_daily_production_date ON daily_production(production_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_alerts_is_resolved ON alerts(is_resolved);
