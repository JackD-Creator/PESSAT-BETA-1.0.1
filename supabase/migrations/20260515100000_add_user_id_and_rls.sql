/*
  # Add user_id for data isolation + proper RLS

  Adds user_id column to every data table so each user only sees
  their own data.  Updates all RLS policies to use auth.uid().
*/

-- ============================================================
-- Helper: add user_id column if missing
-- ============================================================
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'animals','locations','herd_groups','herd_group_members',
    'weight_records','animal_movements',
    'health_records','vaccinations','breeding_events',
    'feeds','feed_inventory','feed_purchases','feed_consumption',
    'feed_formulas','feed_formula_items','nutrition_requirements',
    'medicines','medicine_inventory','medicine_purchases','medicine_usages',
    'daily_production','product_sales','animal_purchases','animal_sales',
    'labor_expenses','operational_expenses','stock_adjustments',
    'financial_transactions','alerts','tasks',
    'attribute_definitions','animal_attributes','genetic_records'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- Drop old permissive RLS policies and replace with scoped ones
-- ============================================================

-- 1. users
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own data" ON users
  FOR DELETE TO authenticated USING (auth.uid() = id);
-- Admin (owner) can manage all users: handled via service_role, not RLS

-- 2. animals
DROP POLICY IF EXISTS "Authenticated users can read animals" ON animals;
DROP POLICY IF EXISTS "Authenticated users can insert animals" ON animals;
DROP POLICY IF EXISTS "Authenticated users can update animals" ON animals;
CREATE POLICY "Users can read own animals" ON animals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own animals" ON animals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own animals" ON animals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own animals" ON animals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. locations
DROP POLICY IF EXISTS "Authenticated users can read locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON locations;
CREATE POLICY "Users can read own locations" ON locations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own locations" ON locations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own locations" ON locations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own locations" ON locations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. herd_groups
DROP POLICY IF EXISTS "Authenticated users can read herd_groups" ON herd_groups;
DROP POLICY IF EXISTS "Authenticated users can insert herd_groups" ON herd_groups;
DROP POLICY IF EXISTS "Authenticated users can update herd_groups" ON herd_groups;
CREATE POLICY "Users can read own herd_groups" ON herd_groups
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own herd_groups" ON herd_groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own herd_groups" ON herd_groups
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own herd_groups" ON herd_groups
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. herd_group_members
DROP POLICY IF EXISTS "Authenticated users can read herd_group_members" ON herd_group_members;
DROP POLICY IF EXISTS "Authenticated users can insert herd_group_members" ON herd_group_members;
DROP POLICY IF EXISTS "Authenticated users can update herd_group_members" ON herd_group_members;
CREATE POLICY "Users can read own herd_group_members" ON herd_group_members
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own herd_group_members" ON herd_group_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 6. weight_records
DROP POLICY IF EXISTS "Authenticated users can read weight_records" ON weight_records;
DROP POLICY IF EXISTS "Authenticated users can insert weight_records" ON weight_records;
CREATE POLICY "Users can read own weight_records" ON weight_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight_records" ON weight_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 7. animal_movements
DROP POLICY IF EXISTS "Authenticated users can read animal_movements" ON animal_movements;
DROP POLICY IF EXISTS "Authenticated users can insert animal_movements" ON animal_movements;
CREATE POLICY "Users can read own animal_movements" ON animal_movements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own animal_movements" ON animal_movements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 8. health_records
DROP POLICY IF EXISTS "Authenticated users can read health_records" ON health_records;
DROP POLICY IF EXISTS "Authenticated users can insert health_records" ON health_records;
DROP POLICY IF EXISTS "Authenticated users can update health_records" ON health_records;
CREATE POLICY "Users can read own health_records" ON health_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health_records" ON health_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health_records" ON health_records
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. vaccinations
DROP POLICY IF EXISTS "Authenticated users can read vaccinations" ON vaccinations;
DROP POLICY IF EXISTS "Authenticated users can insert vaccinations" ON vaccinations;
DROP POLICY IF EXISTS "Authenticated users can update vaccinations" ON vaccinations;
CREATE POLICY "Users can read own vaccinations" ON vaccinations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vaccinations" ON vaccinations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vaccinations" ON vaccinations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. breeding_events
DROP POLICY IF EXISTS "Authenticated users can read breeding_events" ON breeding_events;
DROP POLICY IF EXISTS "Authenticated users can insert breeding_events" ON breeding_events;
DROP POLICY IF EXISTS "Authenticated users can update breeding_events" ON breeding_events;
CREATE POLICY "Users can read own breeding_events" ON breeding_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own breeding_events" ON breeding_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own breeding_events" ON breeding_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. feeds
DROP POLICY IF EXISTS "Authenticated users can read feeds" ON feeds;
DROP POLICY IF EXISTS "Authenticated users can insert feeds" ON feeds;
DROP POLICY IF EXISTS "Authenticated users can update feeds" ON feeds;
CREATE POLICY "Users can read own feeds" ON feeds
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feeds" ON feeds
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feeds" ON feeds
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 12. feed_inventory
DROP POLICY IF EXISTS "Authenticated users can read feed_inventory" ON feed_inventory;
DROP POLICY IF EXISTS "Authenticated users can insert feed_inventory" ON feed_inventory;
DROP POLICY IF EXISTS "Authenticated users can update feed_inventory" ON feed_inventory;
CREATE POLICY "Users can read own feed_inventory" ON feed_inventory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feed_inventory" ON feed_inventory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feed_inventory" ON feed_inventory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 13. feed_purchases
DROP POLICY IF EXISTS "Authenticated users can read feed_purchases" ON feed_purchases;
DROP POLICY IF EXISTS "Authenticated users can insert feed_purchases" ON feed_purchases;
CREATE POLICY "Users can read own feed_purchases" ON feed_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feed_purchases" ON feed_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 14. feed_consumption
DROP POLICY IF EXISTS "Authenticated users can read feed_consmptn" ON feed_consumption;
DROP POLICY IF EXISTS "Authenticated users can insert feed_consmptn" ON feed_consumption;
CREATE POLICY "Users can read own feed_consumption" ON feed_consumption
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feed_consumption" ON feed_consumption
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 15. feed_formulas
DROP POLICY IF EXISTS "Authenticated users can read feed_formulas" ON feed_formulas;
DROP POLICY IF EXISTS "Authenticated users can insert feed_formulas" ON feed_formulas;
DROP POLICY IF EXISTS "Authenticated users can update feed_formulas" ON feed_formulas;
CREATE POLICY "Users can read own feed_formulas" ON feed_formulas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feed_formulas" ON feed_formulas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feed_formulas" ON feed_formulas
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 16. feed_formula_items
DROP POLICY IF EXISTS "Authenticated users can read feed_formula_items" ON feed_formula_items;
DROP POLICY IF EXISTS "Authenticated users can insert feed_formula_items" ON feed_formula_items;
CREATE POLICY "Users can read own feed_formula_items" ON feed_formula_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feed_formula_items" ON feed_formula_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 17. nutrition_requirements
DROP POLICY IF EXISTS "Authenticated users can read nutrition_requirements" ON nutrition_requirements;
CREATE POLICY "Users can read own nutrition_requirements" ON nutrition_requirements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 18. medicines
DROP POLICY IF EXISTS "Authenticated users can read medicines" ON medicines;
DROP POLICY IF EXISTS "Authenticated users can insert medicines" ON medicines;
DROP POLICY IF EXISTS "Authenticated users can update medicines" ON medicines;
CREATE POLICY "Users can read own medicines" ON medicines
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medicines" ON medicines
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medicines" ON medicines
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 19. medicine_inventory
DROP POLICY IF EXISTS "Authenticated users can read medicine_inventory" ON medicine_inventory;
DROP POLICY IF EXISTS "Authenticated users can insert medicine_inventory" ON medicine_inventory;
DROP POLICY IF EXISTS "Authenticated users can update medicine_inventory" ON medicine_inventory;
CREATE POLICY "Users can read own medicine_inventory" ON medicine_inventory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medicine_inventory" ON medicine_inventory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medicine_inventory" ON medicine_inventory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 20. medicine_purchases
DROP POLICY IF EXISTS "Authenticated users can read medicine_purchases" ON medicine_purchases;
DROP POLICY IF EXISTS "Authenticated users can insert medicine_purchases" ON medicine_purchases;
CREATE POLICY "Users can read own medicine_purchases" ON medicine_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medicine_purchases" ON medicine_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 21. medicine_usages
DROP POLICY IF EXISTS "Authenticated users can read medicine_usages" ON medicine_usages;
DROP POLICY IF EXISTS "Authenticated users can insert medicine_usages" ON medicine_usages;
CREATE POLICY "Users can read own medicine_usages" ON medicine_usages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medicine_usages" ON medicine_usages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 22. daily_production
DROP POLICY IF EXISTS "Authenticated users can read daily_production" ON daily_production;
DROP POLICY IF EXISTS "Authenticated users can insert daily_production" ON daily_production;
DROP POLICY IF EXISTS "Authenticated users can update daily_production" ON daily_production;
CREATE POLICY "Users can read own daily_production" ON daily_production
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily_production" ON daily_production
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily_production" ON daily_production
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 23. product_sales
DROP POLICY IF EXISTS "Authenticated users can read product_sales" ON product_sales;
DROP POLICY IF EXISTS "Authenticated users can insert product_sales" ON product_sales;
CREATE POLICY "Users can read own product_sales" ON product_sales
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own product_sales" ON product_sales
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 24. animal_purchases
DROP POLICY IF EXISTS "Authenticated users can read animal_purchases" ON animal_purchases;
DROP POLICY IF EXISTS "Authenticated users can insert animal_purchases" ON animal_purchases;
CREATE POLICY "Users can read own animal_purchases" ON animal_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own animal_purchases" ON animal_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 25. animal_sales
DROP POLICY IF EXISTS "Authenticated users can read animal_sales" ON animal_sales;
DROP POLICY IF EXISTS "Authenticated users can insert animal_sales" ON animal_sales;
CREATE POLICY "Users can read own animal_sales" ON animal_sales
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own animal_sales" ON animal_sales
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 26. labor_expenses
DROP POLICY IF EXISTS "Authenticated users can read labor_expenses" ON labor_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert labor_expenses" ON labor_expenses;
CREATE POLICY "Users can read own labor_expenses" ON labor_expenses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own labor_expenses" ON labor_expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 27. operational_expenses
DROP POLICY IF EXISTS "Authenticated users can read operational_expenses" ON operational_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert operational_expenses" ON operational_expenses;
CREATE POLICY "Users can read own operational_expenses" ON operational_expenses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own operational_expenses" ON operational_expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 28. stock_adjustments
DROP POLICY IF EXISTS "Authenticated users can read stock_adjustments" ON stock_adjustments;
DROP POLICY IF EXISTS "Authenticated users can insert stock_adjustments" ON stock_adjustments;
CREATE POLICY "Users can read own stock_adjustments" ON stock_adjustments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stock_adjustments" ON stock_adjustments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 29. financial_transactions
DROP POLICY IF EXISTS "Authenticated users can read financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert financial_transactions" ON financial_transactions;
CREATE POLICY "Users can read own fin. transactions" ON financial_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fin. transactions" ON financial_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 30. alerts
DROP POLICY IF EXISTS "Authenticated users can read alerts" ON alerts;
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON alerts;
DROP POLICY IF EXISTS "Authenticated users can update alerts" ON alerts;
CREATE POLICY "Users can read own alerts" ON alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON alerts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 31. tasks
DROP POLICY IF EXISTS "Authenticated users can read tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
CREATE POLICY "Users can read own tasks" ON tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 32. attribute_definitions
DROP POLICY IF EXISTS "Authenticated users can read attribute_definitions" ON attribute_definitions;
DROP POLICY IF EXISTS "Authenticated users can insert attribute_definitions" ON attribute_definitions;
DROP POLICY IF EXISTS "Authenticated users can update attribute_definitions" ON attribute_definitions;
CREATE POLICY "Users can read own attribute_definitions" ON attribute_definitions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attribute_definitions" ON attribute_definitions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attribute_definitions" ON attribute_definitions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 33. animal_attributes
DROP POLICY IF EXISTS "Authenticated users can read animal_attributes" ON animal_attributes;
DROP POLICY IF EXISTS "Authenticated users can insert animal_attributes" ON animal_attributes;
DROP POLICY IF EXISTS "Authenticated users can update animal_attributes" ON animal_attributes;
CREATE POLICY "Users can read own animal_attributes" ON animal_attributes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own animal_attributes" ON animal_attributes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own animal_attributes" ON animal_attributes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 34. genetic_records
DROP POLICY IF EXISTS "Authenticated users can read genetic_records" ON genetic_records;
DROP POLICY IF EXISTS "Authenticated users can insert genetic_records" ON genetic_records;
DROP POLICY IF EXISTS "Authenticated users can update genetic_records" ON genetic_records;
CREATE POLICY "Users can read own genetic_records" ON genetic_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own genetic_records" ON genetic_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own genetic_records" ON genetic_records
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 35. farm_profiles
ALTER TABLE farm_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
DROP POLICY IF EXISTS "Service role full access" ON farm_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON farm_profiles;
CREATE POLICY "Users can read own farm_profile" ON farm_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own farm_profile" ON farm_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own farm_profile" ON farm_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
