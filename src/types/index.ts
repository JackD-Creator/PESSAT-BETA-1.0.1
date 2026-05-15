export type UserRole = 'owner' | 'manager' | 'worker';

export type Species = 'cattle' | 'sheep' | 'goat';

export type AnimalStatus = 'healthy' | 'sick' | 'pregnant' | 'lactating' | 'dry' | 'culled' | 'sold' | 'dead';

export type AnimalPurpose = 'dairy' | 'beef' | 'wool' | 'dual' | 'breeding';

export type Gender = 'male' | 'female';

export type AcquisitionType = 'born' | 'purchased' | 'gift';

export type LocationType = 'shed' | 'paddock' | 'quarantine' | 'storage' | 'office' | 'milking_parlor';

export type HealthRecordType = 'checkup' | 'illness' | 'injury' | 'treatment' | 'surgery' | 'preventive';

export type BreedingEventType = 'heat' | 'insemination' | 'pregnancy_check' | 'birth' | 'abortion' | 'dry_off';

export type FeedCategory = 'forage' | 'concentrate' | 'mineral' | 'supplement' | 'byproduct' | 'complete_feed' | 'additive';

export type MedicineType = 'antibiotic' | 'vitamin' | 'vaccine' | 'antiparasitic' | 'hormone' | 'anti_inflammatory' | 'other';

export type ProductType = 'milk' | 'wool' | 'meat' | 'manure' | 'other';

export type Shift = 'morning' | 'evening' | 'all_day';

export type CashFlow = 'cash_in' | 'cash_out' | 'non_cash';

export type TransactionType = 'income' | 'expense';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type AlertType = 'vaccination_due' | 'low_stock_feed' | 'low_stock_medicine' | 'health_issue' | 'breeding_due' | 'task_overdue' | 'weight_loss';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type LaborCategory = 'salary' | 'wage' | 'overtime' | 'bonus' | 'other';

export type OperationalCategory = 'electricity' | 'water' | 'fuel' | 'repair' | 'maintenance' | 'transport' | 'insurance' | 'tax' | 'other';

export type DataType = 'text' | 'number' | 'date' | 'boolean';

export type AdjustmentItemType = 'feed' | 'medicine';

export type FarmScale = 'kecil' | 'sedang' | 'besar';

export interface FarmProfile {
  id: string;
  user_id: string;
  farm_name: string;
  owner_name: string;
  address: string;
  farm_scale: FarmScale;
  phone: string;
  email: string;
  website: string;
  social_media: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================
// TABLE 1: users
// ============================================================
export interface User {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  owner_id?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================
// TABLE 2: locations
// ============================================================
export interface Location {
  id: string;
  name: string;
  type: LocationType;
  capacity: number;
  current_occupancy: number;
  area_sqm?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

// ============================================================
// TABLE 3: animals
// ============================================================
export interface Animal {
  id: string;
  tag_id: string;
  rfid?: string;
  species: Species;
  breed: string;
  gender: Gender;
  birth_date?: string;
  birth_weight_kg?: number;
  current_weight_kg?: number;
  status: AnimalStatus;
  purpose: AnimalPurpose;
  color?: string;
  photo_url?: string;
  dam_id?: string;
  sire_id?: string;
  current_location_id?: string;
  acquisition_type: AcquisitionType;
  acquisition_cost?: number;
  acquisition_date?: string;
  death_date?: string;
  death_reason?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================
// TABLE 4: attribute_definitions
// ============================================================
export interface AttributeDefinition {
  id: string;
  species: Species;
  purpose?: AnimalPurpose;
  attribute_key: string;
  label: string;
  data_type: DataType;
  unit?: string;
  min_value?: number;
  max_value?: number;
  is_required: boolean;
  category?: string;
  sort_order: number;
}

// ============================================================
// TABLE 5: animal_attributes
// ============================================================
export interface AnimalAttribute {
  id: string;
  animal_id: string;
  attribute_key: string;
  attribute_value: string;
  recorded_date?: string;
  created_at: string;
}

// ============================================================
// TABLE 6: genetic_records
// ============================================================
 export interface GeneticRecord {
  id: string;
  animal_id: string;
  inbreeding_coefficient?: number;
  genetic_merit_milk?: number;
  genetic_merit_growth?: number;
  genetic_merit_reproduction?: number;
  genetic_merit_wool?: number;
  dna_sample_id?: string;
  genotype_data?: string;
  notes?: string;
  created_at: string;
}

// ============================================================
// TABLE 7: weight_records
// ============================================================
export interface WeightRecord {
  id: string;
  animal_id: string;
  weigh_date: string;
  weight_kg: number;
  body_condition_score?: number;
  chest_girth_cm?: number;
  body_length_cm?: number;
  height_cm?: number;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 8: animal_movements
// ============================================================
export interface AnimalMovement {
  id: string;
  animal_id: string;
  from_location_id?: string;
  to_location_id: string;
  movement_date: string;
  reason?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 9: herd_groups
// ============================================================
export interface HerdGroup {
  id: string;
  name: string;
  location_id?: string;
  supervisor_id?: string;
  supervisor_name?: string;
  member_count: number;
  notes?: string;
  created_at: string;
}

// ============================================================
// TABLE 10: herd_group_members
// ============================================================
export interface HerdGroupMember {
  id: string;
  herd_group_id: string;
  animal_id: string;
  joined_at: string;
  left_at?: string;
}

// ============================================================
// TABLE 11: health_records
// ============================================================
export interface HealthRecord {
  id: string;
  animal_id: string;
  record_date: string;
  type: HealthRecordType;
  diagnosis?: string;
  treatment?: string;
  vet_name?: string;
  cost: number;
  is_resolved: boolean;
  follow_up_date?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 12: vaccinations
// ============================================================
export interface Vaccination {
  id: string;
  animal_id?: string;
  herd_group_id?: string;
  vaccine_name: string;
  batch_number?: string;
  date_administered: string;
  next_due_date?: string;
  cost: number;
  administered_by?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 13: breeding_events
// ============================================================
export interface BreedingEvent {
  id: string;
  animal_id: string;
  sire_id?: string;
  event_type: BreedingEventType;
  event_date: string;
  expected_due_date?: string;
  actual_birth_date?: string;
  offspring_count?: number;
  offspring_tag_ids?: string;
  cost: number;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 14: feeds
// ============================================================
export interface Feed {
  id: string;
  name: string;
  category: FeedCategory;
  sub_category?: string;
  form?: string;
  unit: string;
  conversion_to_kg?: number;
  dry_matter_pct?: number;
  crude_protein_pct?: number;
  crude_fiber_pct?: number;
  crude_fat_pct?: number;
  ash_pct?: number;
  tdn_pct?: number;
  metabolizable_energy?: number;
  calcium_pct?: number;
  phosphorus_pct?: number;
  shelf_life_days?: number;
  storage_condition?: string;
  default_min_threshold?: number;
  supplier?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

// ============================================================
// TABLE 15: feed_inventory
// ============================================================
export interface FeedInventory {
  id: string;
  feed_id: string;
  quantity_on_hand: number;
  avg_cost_per_unit: number;
  total_cost: number;
  min_threshold: number;
  last_purchase_date?: string;
  updated_at: string;
}

// ============================================================
// TABLE 16: feed_purchases
// ============================================================
export interface FeedPurchase {
  id: string;
  feed_id: string;
  purchase_date: string;
  quantity: number;
  unit?: string;
  price_per_unit: number;
  total_amount: number;
  supplier?: string;
  invoice_number?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 17: feed_consumption
// ============================================================
export interface FeedConsumption {
  id: string;
  feed_id: string;
  herd_group_id?: string;
  animal_id?: string;
  consumption_date: string;
  quantity: number;
  unit?: string;
  cost_per_unit: number;
  total_cost: number;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 18: feed_formulas
// ============================================================
export interface FeedFormula {
  id: string;
  name: string;
  target_species: Species;
  target_purpose?: AnimalPurpose;
  target_phase: string;
  total_quantity_kg: number;
  calculated_protein_pct?: number;
  calculated_tdn_pct?: number;
  calculated_cost_per_kg?: number;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================
// TABLE 19: feed_formula_items
// ============================================================
export interface FeedFormulaItem {
  id: string;
  formula_id: string;
  feed_id: string;
  quantity_kg: number;
  percentage: number;
  cost_at_formulation?: number;
}

// ============================================================
// TABLE 20: nutrition_requirements
// ============================================================
export interface NutritionRequirement {
  id: string;
  species: Species;
  purpose: AnimalPurpose;
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
  created_at: string;
}

// ============================================================
// TABLE 21: medicines
// ============================================================
export interface Medicine {
  id: string;
  name: string;
  type: MedicineType;
  unit: string;
  default_min_threshold?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

// ============================================================
// TABLE 22: medicine_inventory
// ============================================================
export interface MedicineInventory {
  id: string;
  medicine_id: string;
  quantity_on_hand: number;
  avg_cost_per_unit: number;
  total_cost: number;
  min_threshold: number;
  expiry_date?: string;
  updated_at: string;
}

// ============================================================
// TABLE 23: medicine_purchases
// ============================================================
export interface MedicinePurchase {
  id: string;
  medicine_id: string;
  purchase_date: string;
  quantity: number;
  price_per_unit: number;
  total_amount: number;
  supplier?: string;
  expiry_date?: string;
  batch_number?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 24: medicine_usages
// ============================================================
export interface MedicineUsage {
  id: string;
  medicine_id: string;
  animal_id: string;
  health_record_id?: string;
  usage_date: string;
  quantity: number;
  dosage_notes?: string;
  cost_per_unit: number;
  total_cost: number;
  administered_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 25: animal_purchases
// ============================================================
export interface AnimalPurchase {
  id: string;
  animal_id: string;
  purchase_date: string;
  seller_name?: string;
  purchase_price: number;
  additional_costs?: number;
  total_cost: number;
  weight_at_purchase_kg?: number;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 26: animal_sales
// ============================================================
export interface AnimalSale {
  id: string;
  animal_id: string;
  sale_date: string;
  buyer_name?: string;
  sale_price: number;
  weight_at_sale_kg?: number;
  reason?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 27: daily_production
// ============================================================
export interface DailyProduction {
  id: string;
  production_date: string;
  animal_id?: string;
  herd_group_id?: string;
  product_type: ProductType;
  quantity: number;
  unit: string;
  shift: Shift;
  quality_grade?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 28: product_sales
// ============================================================
export interface ProductSale {
  id: string;
  sale_date: string;
  product_type: ProductType;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_amount: number;
  buyer_name?: string;
  payment_method?: string;
  invoice_number?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 29: labor_expenses
// ============================================================
export interface LaborExpense {
  id: string;
  expense_date: string;
  worker_name: string;
  worker_id?: string;
  expense_type: LaborCategory;
  period_month?: number;
  period_year?: number;
  amount: number;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 30: operational_expenses
// ============================================================
export interface OperationalExpense {
  id: string;
  expense_date: string;
  category: OperationalCategory;
  amount: number;
  description?: string;
  invoice_number?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 31: stock_adjustments
// ============================================================
export interface StockAdjustment {
  id: string;
  adjustment_date: string;
  item_type: AdjustmentItemType;
  item_id: string;
  quantity_before?: number;
  quantity_after?: number;
  quantity_change: number;
  reason: string;
  notes?: string;
  cost_per_unit_at_time?: number;
  total_cost_change?: number;
  recorded_by?: string;
  user_id?: string;
  created_at: string;
}

// ============================================================
// TABLE 32: financial_transactions
// ============================================================
export interface FinancialTransaction {
  id: string;
  transaction_date: string;
  type: TransactionType;
  category: string;
  cash_flow: CashFlow;
  amount: number;
  description?: string;
  source_table: string;
  source_id: string;
  animal_id?: string;
  recorded_by?: string;
  created_at: string;
}

// ============================================================
// TABLE 33: alerts
// ============================================================
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  source_table?: string;
  source_id?: string;
  animal_id?: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

// ============================================================
// TABLE 34: tasks
// ============================================================
export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  created_by: string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  related_animal_id?: string;
  related_herd_group_id?: string;
  related_source_table?: string;
  related_source_id?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================
// Dashboard & View Types
// ============================================================
export interface DashboardStats {
  cattleCount: number;
  sheepCount: number;
  goatCount: number;
  totalAnimals: number;
  healthyCount: number;
  sickCount: number;
  pregnantCount: number;
  lactatingCount: number;
  dryCount: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  totalFeedValue: number;
  totalMedValue: number;
  totalInventoryValue: number;
  avgMilkToday: number;
  pendingTasks: number;
  overdueTasks: number;
  unreadAlerts: number;
  criticalAlerts: number;
  lowStockCount: number;
}

// ============================================================
// Enum lookup for labels
// ============================================================
export const SPECIES_LABELS: Record<Species, string> = {
  cattle: 'Sapi',
  sheep: 'Domba',
  goat: 'Kambing',
};

export const ANIMAL_STATUS_LABELS: Record<AnimalStatus, string> = {
  healthy: 'Sehat',
  sick: 'Sakit',
  pregnant: 'Bunting',
  lactating: 'Laktasi',
  dry: 'Kering',
  culled: 'Afkir',
  sold: 'Terjual',
  dead: 'Mati',
};

export const PURPOSE_LABELS: Record<AnimalPurpose, string> = {
  dairy: 'Perah',
  beef: 'Potong',
  wool: 'Wol',
  dual: 'Dwiguna',
  breeding: 'Bibit',
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  shed: 'Kandang',
  paddock: 'Padang Rumput',
  quarantine: 'Karantina',
  storage: 'Gudang',
  office: 'Kantor',
  milking_parlor: 'Ruang Perah',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  urgent: 'Mendesak',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Tertunda',
  in_progress: 'Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: 'Informasi',
  warning: 'Peringatan',
  critical: 'Kritis',
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  vaccination_due: 'Vaksinasi Jatuh Tempo',
  low_stock_feed: 'Stok Pakan Menipis',
  low_stock_medicine: 'Stok Obat Menipis',
  health_issue: 'Masalah Kesehatan',
  breeding_due: 'Perkiraan Kelahiran',
  task_overdue: 'Tugas Terlambat',
  weight_loss: 'Penurunan Berat Badan',
};

export const FEED_CATEGORY_LABELS: Record<FeedCategory, string> = {
  forage: 'Hijauan',
  concentrate: 'Konsentrat',
  mineral: 'Mineral',
  supplement: 'Suplemen',
  byproduct: 'Limbah Pertanian',
  complete_feed: 'Pakan Komplit',
  additive: 'Aditif',
};
