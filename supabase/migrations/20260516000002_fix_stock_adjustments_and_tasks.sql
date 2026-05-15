/*
  # Fix stock_adjustments and tasks tables

  1. stock_adjustments:
     - Add missing columns: notes, cost_per_unit_at_time, total_cost_change
     - Add notes column that was missing from original schema

  2. tasks:
     - No schema changes needed (related_animal_id is already UUID FK)
*/

-- stock_adjustments: add missing columns
ALTER TABLE stock_adjustments ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE stock_adjustments ADD COLUMN IF NOT EXISTS cost_per_unit_at_time numeric(10,2);
ALTER TABLE stock_adjustments ADD COLUMN IF NOT EXISTS total_cost_change numeric(14,2);
