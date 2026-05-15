export type UserRole = 'owner' | 'manager' | 'worker';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string;
  is_active: boolean;
}

export interface Location {
  id: number;
  name: string;
  type: 'shed' | 'paddock' | 'quarantine' | 'storage' | 'office' | 'milking_parlor';
  capacity: number;
  current_occupancy: number;
  area_sqm: number;
  is_active: boolean;
  notes: string;
}

export interface Animal {
  id: number;
  tag_id: string;
  rfid?: string;
  species: 'cattle' | 'sheep' | 'goat';
  breed: string;
  gender: 'male' | 'female';
  birth_date: string;
  birth_weight_kg: number;
  current_weight_kg: number;
  status: 'healthy' | 'sick' | 'pregnant' | 'lactating' | 'dry' | 'culled' | 'sold' | 'dead';
  purpose: 'dairy' | 'beef' | 'wool' | 'dual' | 'breeding';
  color: string;
  photo_url?: string;
  dam_id?: number;
  sire_id?: number;
  current_location_id: number;
  current_location_name: string;
  acquisition_type: 'born' | 'purchased' | 'gift';
  acquisition_cost?: number;
  acquisition_date?: string;
  notes?: string;
  created_at: string;
}

export interface WeightRecord {
  id: number;
  animal_id: number;
  weigh_date: string;
  weight_kg: number;
  body_condition_score?: number;
  chest_girth_cm?: number;
  body_length_cm?: number;
  height_cm?: number;
  notes?: string;
  recorded_by_name: string;
}

export interface HealthRecord {
  id: number;
  animal_id: number;
  animal_tag: string;
  record_date: string;
  type: 'checkup' | 'illness' | 'injury' | 'treatment' | 'surgery' | 'preventive';
  diagnosis?: string;
  treatment?: string;
  vet_name?: string;
  cost: number;
  is_resolved: boolean;
  follow_up_date?: string;
  notes?: string;
  recorded_by_name: string;
}

export interface Vaccination {
  id: number;
  animal_id?: number;
  animal_tag?: string;
  herd_group_id?: number;
  herd_group_name?: string;
  vaccine_name: string;
  batch_number?: string;
  date_administered: string;
  next_due_date?: string;
  cost: number;
  administered_by?: string;
  notes?: string;
}

export interface BreedingEvent {
  id: number;
  animal_id: number;
  animal_tag: string;
  sire_id?: number;
  sire_tag?: string;
  event_type: 'heat' | 'insemination' | 'pregnancy_check' | 'birth' | 'abortion' | 'dry_off';
  event_date: string;
  expected_due_date?: string;
  actual_birth_date?: string;
  offspring_count?: number;
  cost: number;
  notes?: string;
}

export interface Feed {
  id: number;
  name: string;
  category: 'forage' | 'concentrate' | 'mineral' | 'supplement' | 'byproduct' | 'complete_feed' | 'additive';
  sub_category?: string;
  form?: string;
  unit: string;
  dry_matter_pct?: number;
  crude_protein_pct?: number;
  crude_fiber_pct?: number;
  tdn_pct?: number;
  metabolizable_energy?: number;
  calcium_pct?: number;
  phosphorus_pct?: number;
  is_active: boolean;
}

export interface FeedInventory {
  id: number;
  feed_id: number;
  feed_name: string;
  feed_category: string;
  quantity_on_hand: number;
  unit: string;
  avg_cost_per_unit: number;
  total_cost: number;
  min_threshold: number;
  last_purchase_date?: string;
  days_remaining: number;
}

export interface Medicine {
  id: number;
  name: string;
  type: 'antibiotic' | 'vitamin' | 'vaccine' | 'antiparasitic' | 'hormone' | 'anti_inflammatory' | 'other';
  unit: string;
  is_active: boolean;
}

export interface MedicineInventory {
  id: number;
  medicine_id: number;
  medicine_name: string;
  medicine_type: string;
  quantity_on_hand: number;
  unit: string;
  avg_cost_per_unit: number;
  total_cost: number;
  min_threshold: number;
}

export interface DailyProduction {
  id: number;
  production_date: string;
  animal_id?: number;
  animal_tag?: string;
  herd_group_id?: number;
  herd_group_name?: string;
  product_type: 'milk' | 'wool';
  quantity: number;
  unit: string;
  shift: 'morning' | 'evening' | 'all_day';
  recorded_by_name: string;
}

export interface FinancialTransaction {
  id: number;
  transaction_date: string;
  type: 'income' | 'expense';
  category: string;
  cash_flow: 'cash_in' | 'cash_out' | 'non_cash';
  amount: number;
  description?: string;
  source_table: string;
  animal_id?: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  assigned_to: number;
  assigned_to_name: string;
  created_by: number;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  related_animal_id?: number;
  related_animal_tag?: string;
  related_herd_group_id?: number;
  completed_at?: string;
  created_at: string;
}

export interface Alert {
  id: number;
  type: 'vaccination_due' | 'low_stock_feed' | 'low_stock_medicine' | 'health_issue' | 'breeding_due' | 'task_overdue' | 'weight_loss';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  animal_id?: number;
  animal_tag?: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

export interface HerdGroup {
  id: number;
  name: string;
  location_id?: number;
  location_name?: string;
  supervisor_id?: number;
  supervisor_name?: string;
  member_count: number;
  notes?: string;
}

// Summary stats for dashboard
// ======= NEW TABLES (PRD 2.0) =======

export interface AttributeDefinition {
  id: number;
  species: 'cattle' | 'sheep' | 'goat';
  purpose?: string;
  attribute_key: string;
  label: string;
  data_type: 'text' | 'number' | 'date' | 'boolean';
  unit?: string;
  min_value?: number;
  max_value?: number;
  is_required: boolean;
  category?: string;
  sort_order: number;
}

export interface AnimalAttribute {
  id: number;
  animal_id: number;
  attribute_key: string;
  attribute_value: string;
  recorded_date?: string;
}

export interface GeneticRecord {
  id: number;
  animal_id: number;
  inbreeding_coefficient?: number;
  genetic_merit_milk?: number;
  genetic_merit_growth?: number;
  genetic_merit_reproduction?: number;
  genetic_merit_wool?: number;
  dna_sample_id?: string;
  genotype_data?: string;
  notes?: string;
}

export interface FeedFormula {
  id: number;
  name: string;
  target_species: 'cattle' | 'sheep' | 'goat';
  target_purpose?: string;
  target_phase: string;
  total_quantity_kg: number;
  calculated_protein_pct?: number;
  calculated_tdn_pct?: number;
  calculated_cost_per_kg?: number;
  is_active: boolean;
  notes?: string;
  created_by?: number;
}

export interface FeedFormulaItem {
  id: number;
  formula_id: number;
  feed_id: number;
  quantity_kg: number;
  percentage: number;
  cost_at_formulation?: number;
}

export interface NutritionRequirement {
  id: number;
  species: 'cattle' | 'sheep' | 'goat';
  purpose: string;
  physiological_phase: string;
  weight_range_kg?: string;
  daily_dm_intake_kg?: number;
  dm_pct_body_weight?: number;
  cp_requirement_pct?: number;
  tdn_requirement_pct?: number;
  me_requirement_mcal?: number;
  ca_requirement_pct?: number;
  p_requirement_pct?: number;
  reference?: string;
}

export interface LaborExpense {
  id: number;
  expense_date: string;
  worker_name: string;
  worker_id?: number;
  expense_type: 'salary' | 'overtime' | 'bonus' | 'benefit';
  period_month?: number;
  period_year?: number;
  amount: number;
  notes?: string;
  recorded_by_name: string;
}

export interface OperationalExpense {
  id: number;
  expense_date: string;
  category: string;
  amount: number;
  description?: string;
  invoice_number?: string;
  recorded_by_name: string;
}

export interface StockAdjustment {
  id: number;
  adjustment_date: string;
  item_type: 'feed' | 'medicine';
  item_id: number;
  quantity_before?: number;
  quantity_after?: number;
  quantity_change: number;
  reason: string;
  notes?: string;
  recorded_by_name: string;
}


