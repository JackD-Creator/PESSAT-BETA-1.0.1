-- Add supervisor_name column to herd_groups (text field, not FK)
ALTER TABLE herd_groups
  ADD COLUMN supervisor_name text;

-- Backfill: copy supervisor_id uuid display value if present
UPDATE herd_groups
  SET supervisor_name = supervisor_id::text
  WHERE supervisor_name IS NULL AND supervisor_id IS NOT NULL;
