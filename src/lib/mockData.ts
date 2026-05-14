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

// ======= MOCK DATA =======

export const mockUsers: User[] = [
  { id: 1, full_name: 'Budi Santoso', email: 'budi@farm.id', role: 'owner', phone: '08123456789', is_active: true },
  { id: 2, full_name: 'Dewi Rahayu', email: 'dewi@farm.id', role: 'manager', phone: '08234567890', is_active: true },
  { id: 3, full_name: 'Andi Kurniawan', email: 'andi@farm.id', role: 'worker', phone: '08345678901', is_active: true },
  { id: 4, full_name: 'Siti Aminah', email: 'siti@farm.id', role: 'worker', phone: '08456789012', is_active: true },
];

export const mockLocations: Location[] = [
  { id: 1, name: 'Kandang A - Sapi Perah Laktasi', type: 'shed', capacity: 30, current_occupancy: 24, area_sqm: 450, is_active: true, notes: 'Kandang utama sapi perah' },
  { id: 2, name: 'Kandang B - Sapi Perah Kering', type: 'shed', capacity: 20, current_occupancy: 12, area_sqm: 300, is_active: true, notes: '' },
  { id: 3, name: 'Paddock 1 - Sapi Potong Penggemukan', type: 'paddock', capacity: 40, current_occupancy: 35, area_sqm: 2000, is_active: true, notes: 'Paddock penggemukan utama' },
  { id: 4, name: 'Kandang C - Domba & Kambing', type: 'shed', capacity: 60, current_occupancy: 48, area_sqm: 600, is_active: true, notes: '' },
  { id: 5, name: 'Karantina', type: 'quarantine', capacity: 10, current_occupancy: 2, area_sqm: 100, is_active: true, notes: 'Isolasi hewan sakit' },
  { id: 6, name: 'Ruang Pemerahan', type: 'milking_parlor', capacity: 8, current_occupancy: 0, area_sqm: 120, is_active: true, notes: '' },
  { id: 7, name: 'Gudang Pakan', type: 'storage', capacity: 0, current_occupancy: 0, area_sqm: 200, is_active: true, notes: 'Penyimpanan pakan dan obat' },
];

export const mockHerdGroups: HerdGroup[] = [
  { id: 1, name: 'Kandang A - Sapi Perah Laktasi', location_id: 1, location_name: 'Kandang A', supervisor_id: 2, supervisor_name: 'Dewi Rahayu', member_count: 24 },
  { id: 2, name: 'Paddock 1 - Sapi Potong Penggemukan', location_id: 3, location_name: 'Paddock 1', supervisor_id: 3, supervisor_name: 'Andi Kurniawan', member_count: 35 },
  { id: 3, name: 'Kandang C - Domba Garut', location_id: 4, location_name: 'Kandang C', supervisor_id: 4, supervisor_name: 'Siti Aminah', member_count: 28 },
  { id: 4, name: 'Kandang C - Kambing Boer', location_id: 4, location_name: 'Kandang C', supervisor_id: 4, supervisor_name: 'Siti Aminah', member_count: 20 },
];

export const mockAnimals: Animal[] = [
  { id: 1, tag_id: 'SP-001', species: 'cattle', breed: 'FH (Friesian Holstein)', gender: 'female', birth_date: '2021-03-15', birth_weight_kg: 38, current_weight_kg: 540, status: 'lactating', purpose: 'dairy', color: 'Hitam Putih', current_location_id: 1, current_location_name: 'Kandang A - Sapi Perah Laktasi', acquisition_type: 'born', created_at: '2021-03-15' },
  { id: 2, tag_id: 'SP-002', species: 'cattle', breed: 'FH (Friesian Holstein)', gender: 'female', birth_date: '2020-07-20', birth_weight_kg: 40, current_weight_kg: 560, status: 'lactating', purpose: 'dairy', color: 'Hitam Putih', current_location_id: 1, current_location_name: 'Kandang A - Sapi Perah Laktasi', acquisition_type: 'born', created_at: '2020-07-20' },
  { id: 3, tag_id: 'SP-003', species: 'cattle', breed: 'Jersey', gender: 'female', birth_date: '2019-11-05', birth_weight_kg: 35, current_weight_kg: 490, status: 'pregnant', purpose: 'dairy', color: 'Cokelat', current_location_id: 1, current_location_name: 'Kandang A - Sapi Perah Laktasi', acquisition_type: 'purchased', acquisition_cost: 18000000, created_at: '2019-11-05' },
  { id: 4, tag_id: 'SP-004', species: 'cattle', breed: 'FH (Friesian Holstein)', gender: 'female', birth_date: '2021-01-10', birth_weight_kg: 39, current_weight_kg: 520, status: 'dry', purpose: 'dairy', color: 'Hitam Putih', current_location_id: 2, current_location_name: 'Kandang B - Sapi Perah Kering', acquisition_type: 'born', created_at: '2021-01-10' },
  { id: 5, tag_id: 'SP-005', species: 'cattle', breed: 'FH (Friesian Holstein)', gender: 'female', birth_date: '2022-05-22', birth_weight_kg: 36, current_weight_kg: 505, status: 'healthy', purpose: 'dairy', color: 'Hitam Putih', current_location_id: 1, current_location_name: 'Kandang A - Sapi Perah Laktasi', acquisition_type: 'born', created_at: '2022-05-22' },
  { id: 6, tag_id: 'SB-001', species: 'cattle', breed: 'Brahman', gender: 'male', birth_date: '2022-02-14', birth_weight_kg: 30, current_weight_kg: 380, status: 'healthy', purpose: 'beef', color: 'Abu-abu', current_location_id: 3, current_location_name: 'Paddock 1 - Sapi Potong Penggemukan', acquisition_type: 'purchased', acquisition_cost: 12000000, created_at: '2023-01-01' },
  { id: 7, tag_id: 'SB-002', species: 'cattle', breed: 'Simmental', gender: 'male', birth_date: '2022-06-30', birth_weight_kg: 32, current_weight_kg: 420, status: 'healthy', purpose: 'beef', color: 'Merah Putih', current_location_id: 3, current_location_name: 'Paddock 1 - Sapi Potong Penggemukan', acquisition_type: 'purchased', acquisition_cost: 13500000, created_at: '2023-01-01' },
  { id: 8, tag_id: 'SB-003', species: 'cattle', breed: 'Brahman', gender: 'male', birth_date: '2022-08-15', birth_weight_kg: 28, current_weight_kg: 360, status: 'sick', purpose: 'beef', color: 'Abu-abu', current_location_id: 5, current_location_name: 'Karantina', acquisition_type: 'purchased', acquisition_cost: 11500000, created_at: '2023-01-01' },
  { id: 9, tag_id: 'DG-001', species: 'sheep', breed: 'Garut', gender: 'male', birth_date: '2022-09-10', birth_weight_kg: 3.5, current_weight_kg: 42, status: 'healthy', purpose: 'wool', color: 'Putih', current_location_id: 4, current_location_name: 'Kandang C - Domba & Kambing', acquisition_type: 'born', created_at: '2022-09-10' },
  { id: 10, tag_id: 'DG-002', species: 'sheep', breed: 'Garut', gender: 'female', birth_date: '2022-11-20', birth_weight_kg: 3.2, current_weight_kg: 35, status: 'pregnant', purpose: 'wool', color: 'Putih', current_location_id: 4, current_location_name: 'Kandang C - Domba & Kambing', acquisition_type: 'born', created_at: '2022-11-20' },
  { id: 11, tag_id: 'KB-001', species: 'goat', breed: 'Boer', gender: 'male', birth_date: '2021-12-01', birth_weight_kg: 3.0, current_weight_kg: 68, status: 'healthy', purpose: 'beef', color: 'Merah Putih', current_location_id: 4, current_location_name: 'Kandang C - Domba & Kambing', acquisition_type: 'purchased', acquisition_cost: 4000000, created_at: '2021-12-01' },
  { id: 12, tag_id: 'KB-002', species: 'goat', breed: 'Ettawa', gender: 'female', birth_date: '2022-03-18', birth_weight_kg: 2.8, current_weight_kg: 45, status: 'lactating', purpose: 'dairy', color: 'Cokelat Putih', current_location_id: 4, current_location_name: 'Kandang C - Domba & Kambing', acquisition_type: 'born', created_at: '2022-03-18' },
];

export const mockWeightRecords: WeightRecord[] = [
  { id: 1, animal_id: 1, weigh_date: '2026-05-01', weight_kg: 540, body_condition_score: 3.5, chest_girth_cm: 195, body_length_cm: 158, height_cm: 142, recorded_by_name: 'Andi Kurniawan' },
  { id: 2, animal_id: 1, weigh_date: '2026-04-01', weight_kg: 535, body_condition_score: 3.5, recorded_by_name: 'Andi Kurniawan' },
  { id: 3, animal_id: 1, weigh_date: '2026-03-01', weight_kg: 528, body_condition_score: 3.0, recorded_by_name: 'Andi Kurniawan' },
  { id: 4, animal_id: 2, weigh_date: '2026-05-01', weight_kg: 560, body_condition_score: 4.0, recorded_by_name: 'Andi Kurniawan' },
  { id: 5, animal_id: 6, weigh_date: '2026-05-01', weight_kg: 380, body_condition_score: 3.0, recorded_by_name: 'Siti Aminah' },
  { id: 6, animal_id: 6, weigh_date: '2026-04-01', weight_kg: 361, body_condition_score: 3.0, recorded_by_name: 'Siti Aminah' },
  { id: 7, animal_id: 6, weigh_date: '2026-03-01', weight_kg: 341, body_condition_score: 2.5, recorded_by_name: 'Siti Aminah' },
];

export const mockHealthRecords: HealthRecord[] = [
  { id: 1, animal_id: 8, animal_tag: 'SB-003', record_date: '2026-05-10', type: 'illness', diagnosis: 'Diare akut', treatment: 'Antibiotik Oxytetracycline, cairan infus', vet_name: 'drh. Hasan', cost: 350000, is_resolved: false, follow_up_date: '2026-05-17', recorded_by_name: 'Dewi Rahayu' },
  { id: 2, animal_id: 1, animal_tag: 'SP-001', record_date: '2026-04-20', type: 'checkup', diagnosis: 'Kondisi sehat, BCS 3.5', treatment: '-', vet_name: 'drh. Hasan', cost: 150000, is_resolved: true, recorded_by_name: 'Dewi Rahayu' },
  { id: 3, animal_id: 3, animal_tag: 'SP-003', record_date: '2026-04-15', type: 'checkup', diagnosis: 'Kebuntingan normal, 7 bulan', treatment: 'Vitamin B kompleks', vet_name: 'drh. Hasan', cost: 100000, is_resolved: true, follow_up_date: '2026-05-20', recorded_by_name: 'Dewi Rahayu' },
  { id: 4, animal_id: 7, animal_tag: 'SB-002', record_date: '2026-03-10', type: 'injury', diagnosis: 'Luka kaki kanan akibat pagar', treatment: 'Pembersihan luka, salep antibiotik', vet_name: 'drh. Hasan', cost: 200000, is_resolved: true, recorded_by_name: 'Andi Kurniawan' },
];

export const mockVaccinations: Vaccination[] = [
  { id: 1, animal_id: undefined, herd_group_id: 1, herd_group_name: 'Kandang A - Sapi Perah Laktasi', vaccine_name: 'Vaksin Anthrax', batch_number: 'AX-2026-001', date_administered: '2026-03-01', next_due_date: '2026-09-01', cost: 1200000, administered_by: 'drh. Hasan' },
  { id: 2, animal_id: 8, animal_tag: 'SB-003', vaccine_name: 'Vaksin FMDV (PMK)', batch_number: 'PMK-2026-012', date_administered: '2026-02-15', next_due_date: '2026-05-17', cost: 85000, administered_by: 'drh. Hasan' },
  { id: 3, animal_id: undefined, herd_group_id: 3, herd_group_name: 'Kandang C - Domba Garut', vaccine_name: 'Vaksin Pasteurellosis', batch_number: 'PT-2026-005', date_administered: '2026-04-10', next_due_date: '2026-10-10', cost: 750000, administered_by: 'drh. Hasan' },
];

export const mockBreedingEvents: BreedingEvent[] = [
  { id: 1, animal_id: 3, animal_tag: 'SP-003', event_type: 'insemination', event_date: '2025-10-01', expected_due_date: '2026-07-08', cost: 150000 },
  { id: 2, animal_id: 3, animal_tag: 'SP-003', event_type: 'pregnancy_check', event_date: '2025-11-15', cost: 100000, notes: 'Positif bunting, perkembangan normal' },
  { id: 3, animal_id: 4, animal_tag: 'SP-004', event_type: 'dry_off', event_date: '2026-03-01', cost: 0, notes: 'Dikeringkan untuk persiapan kelahiran' },
  { id: 4, animal_id: 10, animal_tag: 'DG-002', event_type: 'insemination', event_date: '2026-01-10', expected_due_date: '2026-06-06', cost: 50000 },
  { id: 5, animal_id: 10, animal_tag: 'DG-002', event_type: 'pregnancy_check', event_date: '2026-02-20', cost: 75000, notes: 'Positif bunting' },
];

export const mockFeeds: Feed[] = [
  { id: 1, name: 'Rumput Gajah', category: 'forage', sub_category: 'Rumput Segar', form: 'fresh', unit: 'kg', dry_matter_pct: 18, crude_protein_pct: 8.5, crude_fiber_pct: 32, tdn_pct: 55, metabolizable_energy: 1980, calcium_pct: 0.3, phosphorus_pct: 0.25, is_active: true },
  { id: 2, name: 'Dedak Padi', category: 'concentrate', sub_category: 'Sumber Energi', form: 'dry', unit: 'kg', dry_matter_pct: 89, crude_protein_pct: 12, crude_fiber_pct: 11, tdn_pct: 65, metabolizable_energy: 2340, calcium_pct: 0.07, phosphorus_pct: 1.5, is_active: true },
  { id: 3, name: 'Bungkil Kedelai', category: 'concentrate', sub_category: 'Sumber Protein', form: 'dry', unit: 'kg', dry_matter_pct: 88, crude_protein_pct: 44, crude_fiber_pct: 6, tdn_pct: 78, metabolizable_energy: 2808, calcium_pct: 0.32, phosphorus_pct: 0.65, is_active: true },
  { id: 4, name: 'Konsentrat Sapi Perah', category: 'complete_feed', form: 'pellet', unit: 'kg', dry_matter_pct: 87, crude_protein_pct: 18, crude_fiber_pct: 9, tdn_pct: 72, metabolizable_energy: 2592, calcium_pct: 0.8, phosphorus_pct: 0.5, is_active: true },
  { id: 5, name: 'Mineral Block', category: 'mineral', sub_category: 'Mineral Makro', form: 'block', unit: 'kg', dry_matter_pct: 98, crude_protein_pct: 0, is_active: true },
  { id: 6, name: 'Jerami Padi', category: 'forage', sub_category: 'Jerami', form: 'dry', unit: 'kg', dry_matter_pct: 85, crude_protein_pct: 3.5, crude_fiber_pct: 38, tdn_pct: 42, is_active: true },
  { id: 7, name: 'Silase Jagung', category: 'forage', sub_category: 'Silase', form: 'silage', unit: 'kg', dry_matter_pct: 30, crude_protein_pct: 8, crude_fiber_pct: 25, tdn_pct: 65, is_active: true },
];

export const mockFeedInventory: FeedInventory[] = [
  { id: 1, feed_id: 1, feed_name: 'Rumput Gajah', feed_category: 'Hijauan', quantity_on_hand: 1850, unit: 'kg', avg_cost_per_unit: 500, total_cost: 925000, min_threshold: 500, last_purchase_date: '2026-05-10', days_remaining: 12 },
  { id: 2, feed_id: 2, feed_name: 'Dedak Padi', feed_category: 'Konsentrat', quantity_on_hand: 420, unit: 'kg', avg_cost_per_unit: 3200, total_cost: 1344000, min_threshold: 200, last_purchase_date: '2026-05-08', days_remaining: 18 },
  { id: 3, feed_id: 3, feed_name: 'Bungkil Kedelai', feed_category: 'Konsentrat', quantity_on_hand: 180, unit: 'kg', avg_cost_per_unit: 8500, total_cost: 1530000, min_threshold: 200, last_purchase_date: '2026-04-25', days_remaining: 6 },
  { id: 4, feed_id: 4, feed_name: 'Konsentrat Sapi Perah', feed_category: 'Pakan Komplit', quantity_on_hand: 850, unit: 'kg', avg_cost_per_unit: 5200, total_cost: 4420000, min_threshold: 300, last_purchase_date: '2026-05-07', days_remaining: 22 },
  { id: 5, feed_id: 5, feed_name: 'Mineral Block', feed_category: 'Mineral', quantity_on_hand: 45, unit: 'kg', avg_cost_per_unit: 12000, total_cost: 540000, min_threshold: 20, last_purchase_date: '2026-04-01', days_remaining: 30 },
  { id: 6, feed_id: 6, feed_name: 'Jerami Padi', feed_category: 'Hijauan', quantity_on_hand: 320, unit: 'kg', avg_cost_per_unit: 800, total_cost: 256000, min_threshold: 500, last_purchase_date: '2026-04-20', days_remaining: 8 },
  { id: 7, feed_id: 7, feed_name: 'Silase Jagung', feed_category: 'Hijauan', quantity_on_hand: 2400, unit: 'kg', avg_cost_per_unit: 650, total_cost: 1560000, min_threshold: 500, last_purchase_date: '2026-05-01', days_remaining: 25 },
];

export const mockMedicineInventory: MedicineInventory[] = [
  { id: 1, medicine_id: 1, medicine_name: 'Oxytetracycline 20%', medicine_type: 'Antibiotik', quantity_on_hand: 8, unit: 'botol', avg_cost_per_unit: 45000, total_cost: 360000, min_threshold: 5 },
  { id: 2, medicine_id: 2, medicine_name: 'Vitamin B Kompleks', medicine_type: 'Vitamin', quantity_on_hand: 24, unit: 'botol', avg_cost_per_unit: 35000, total_cost: 840000, min_threshold: 10 },
  { id: 3, medicine_id: 3, medicine_name: 'Ivermectin', medicine_type: 'Antiparasit', quantity_on_hand: 3, unit: 'botol', avg_cost_per_unit: 85000, total_cost: 255000, min_threshold: 5 },
  { id: 4, medicine_id: 4, medicine_name: 'Oxytocin', medicine_type: 'Hormon', quantity_on_hand: 15, unit: 'ampul', avg_cost_per_unit: 25000, total_cost: 375000, min_threshold: 10 },
];

export const mockDailyProduction: DailyProduction[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date('2026-05-14');
  date.setDate(date.getDate() - i);
  return {
    id: i + 1,
    production_date: date.toISOString().split('T')[0],
    herd_group_id: 1,
    herd_group_name: 'Kandang A - Sapi Perah Laktasi',
    product_type: 'milk',
    quantity: 185 + Math.floor(Math.random() * 25 - 10),
    unit: 'liter',
    shift: 'all_day',
    recorded_by_name: 'Siti Aminah',
  };
});

export const mockFinancialTransactions: FinancialTransaction[] = [
  { id: 1, transaction_date: '2026-05-10', type: 'income', category: 'product_sale', cash_flow: 'cash_in', amount: 3200000, description: 'Penjualan susu 160L x Rp 20.000', source_table: 'product_sales' },
  { id: 2, transaction_date: '2026-05-09', type: 'income', category: 'product_sale', cash_flow: 'cash_in', amount: 3180000, description: 'Penjualan susu 159L x Rp 20.000', source_table: 'product_sales' },
  { id: 3, transaction_date: '2026-05-08', type: 'expense', category: 'feed_purchase', cash_flow: 'cash_out', amount: 4420000, description: 'Pembelian Konsentrat Sapi Perah 850kg', source_table: 'feed_purchases' },
  { id: 4, transaction_date: '2026-05-07', type: 'expense', category: 'feed_purchase', cash_flow: 'cash_out', amount: 1344000, description: 'Pembelian Dedak Padi 420kg', source_table: 'feed_purchases' },
  { id: 5, transaction_date: '2026-05-06', type: 'expense', category: 'labor', cash_flow: 'cash_out', amount: 3500000, description: 'Gaji pekerja kandang - Mei 2026', source_table: 'labor_expenses' },
  { id: 6, transaction_date: '2026-05-05', type: 'expense', category: 'vet_service', cash_flow: 'cash_out', amount: 350000, description: 'Biaya perawatan SB-003', source_table: 'health_records', animal_id: 8 },
  { id: 7, transaction_date: '2026-05-04', type: 'income', category: 'product_sale', cash_flow: 'cash_in', amount: 3400000, description: 'Penjualan susu 170L x Rp 20.000', source_table: 'product_sales' },
  { id: 8, transaction_date: '2026-05-03', type: 'expense', category: 'feed_usage', cash_flow: 'non_cash', amount: 1850000, description: 'Pemakaian pakan harian - Kandang A', source_table: 'feed_consumption' },
  { id: 9, transaction_date: '2026-05-02', type: 'expense', category: 'opex_electricity', cash_flow: 'cash_out', amount: 1250000, description: 'Tagihan listrik April 2026', source_table: 'operational_expenses' },
  { id: 10, transaction_date: '2026-05-01', type: 'income', category: 'animal_sale', cash_flow: 'cash_in', amount: 15000000, description: 'Penjualan SB-008 (Brahman 450kg)', source_table: 'animal_sales' },
  { id: 11, transaction_date: '2026-04-28', type: 'expense', category: 'feed_purchase', cash_flow: 'cash_out', amount: 925000, description: 'Pembelian Rumput Gajah 1850kg', source_table: 'feed_purchases' },
  { id: 12, transaction_date: '2026-04-25', type: 'expense', category: 'vaccination', cash_flow: 'cash_out', amount: 750000, description: 'Vaksinasi Pasteurellosis - Kandang C', source_table: 'vaccinations' },
];

export const mockTasks: Task[] = [
  { id: 1, title: 'Vaksinasi FMDV - SB-003', description: 'Jadwal ulang vaksinasi PMK untuk SB-003', assigned_to: 3, assigned_to_name: 'Andi Kurniawan', created_by: 2, due_date: '2026-05-17', priority: 'urgent', status: 'pending', related_animal_id: 8, related_animal_tag: 'SB-003', created_at: '2026-05-14' },
  { id: 2, title: 'Pemantauan SP-003 (Bunting)', description: 'Cek kondisi SP-003 - perkiraan lahir 8 Juli 2026', assigned_to: 3, assigned_to_name: 'Andi Kurniawan', created_by: 2, due_date: '2026-05-15', priority: 'high', status: 'pending', related_animal_id: 3, related_animal_tag: 'SP-003', created_at: '2026-05-10' },
  { id: 3, title: 'Pencatatan produksi susu pagi', description: 'Input data produksi susu shift pagi Kandang A', assigned_to: 4, assigned_to_name: 'Siti Aminah', created_by: 2, due_date: '2026-05-14', priority: 'high', status: 'in_progress', related_animal_id: undefined, created_at: '2026-05-14' },
  { id: 4, title: 'Order Bungkil Kedelai', description: 'Stok Bungkil Kedelai menipis - sisa 180kg, min 200kg', assigned_to: 2, assigned_to_name: 'Dewi Rahayu', created_by: 1, due_date: '2026-05-15', priority: 'urgent', status: 'pending', created_at: '2026-05-13' },
  { id: 5, title: 'Penimbangan bulanan - Sapi Potong', description: 'Timbang seluruh sapi di Paddock 1', assigned_to: 3, assigned_to_name: 'Andi Kurniawan', created_by: 2, due_date: '2026-05-13', priority: 'medium', status: 'pending', created_at: '2026-05-01' },
  { id: 6, title: 'Pembersihan kandang C', description: 'Desinfeksi mingguan kandang domba & kambing', assigned_to: 4, assigned_to_name: 'Siti Aminah', created_by: 2, due_date: '2026-05-14', priority: 'medium', status: 'completed', completed_at: '2026-05-14', created_at: '2026-05-07' },
  { id: 7, title: 'Order Jerami Padi', description: 'Stok jerami menipis - sisa 320kg, min 500kg', assigned_to: 2, assigned_to_name: 'Dewi Rahayu', created_by: 1, due_date: '2026-05-14', priority: 'high', status: 'pending', created_at: '2026-05-12' },
];

export const mockAlerts: Alert[] = [
  { id: 1, type: 'low_stock_feed', severity: 'critical', title: 'Stok Bungkil Kedelai Menipis', message: 'Stok tersisa 180 kg, di bawah minimum 200 kg. Estimasi tersisa 6 hari.', is_read: false, is_resolved: false, created_at: '2026-05-13T08:00:00' },
  { id: 2, type: 'low_stock_feed', severity: 'critical', title: 'Stok Jerami Padi Menipis', message: 'Stok tersisa 320 kg, di bawah minimum 500 kg. Estimasi tersisa 8 hari.', is_read: false, is_resolved: false, created_at: '2026-05-12T08:00:00' },
  { id: 3, type: 'vaccination_due', severity: 'warning', title: 'Vaksinasi FMDV Jatuh Tempo', message: 'SB-003 perlu vaksinasi ulang PMK pada 17 Mei 2026 (3 hari lagi).', animal_id: 8, animal_tag: 'SB-003', is_read: false, is_resolved: false, created_at: '2026-05-14T06:00:00' },
  { id: 4, type: 'low_stock_medicine', severity: 'critical', title: 'Stok Ivermectin Menipis', message: 'Stok tersisa 3 botol, di bawah minimum 5 botol.', is_read: false, is_resolved: false, created_at: '2026-05-13T09:00:00' },
  { id: 5, type: 'health_issue', severity: 'warning', title: 'SB-003 Sedang Sakit', message: 'SB-003 terdiagnosis diare akut sejak 10 Mei 2026. Belum resolved.', animal_id: 8, animal_tag: 'SB-003', is_read: true, is_resolved: false, created_at: '2026-05-10T10:00:00' },
  { id: 6, type: 'breeding_due', severity: 'info', title: 'Perkiraan Kelahiran SP-003', message: 'SP-003 diperkirakan melahirkan pada 8 Juli 2026. Persiapkan kandang bersalin.', animal_id: 3, animal_tag: 'SP-003', is_read: true, is_resolved: false, created_at: '2026-05-07T08:00:00' },
  { id: 7, type: 'task_overdue', severity: 'warning', title: 'Tugas Terlambat: Penimbangan Sapi Potong', message: 'Tugas penimbangan bulanan sapi potong sudah melewati batas waktu (13 Mei 2026).', is_read: false, is_resolved: false, created_at: '2026-05-14T07:00:00' },
];

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

// ======= NEW MOCK DATA =======

export const mockAttributeDefinitions: AttributeDefinition[] = [
  { id: 1, species: 'cattle', purpose: 'dairy', attribute_key: 'lactation_number', label: 'Laktasi Ke', data_type: 'number', unit: 'kali', min_value: 1, max_value: 15, is_required: true, category: 'Produksi', sort_order: 1 },
  { id: 2, species: 'cattle', purpose: 'dairy', attribute_key: 'days_in_milk', label: 'Hari Laktasi', data_type: 'number', unit: 'hari', min_value: 0, max_value: 400, is_required: true, category: 'Produksi', sort_order: 2 },
  { id: 3, species: 'cattle', purpose: 'dairy', attribute_key: 'milk_yield_morning', label: 'Susu Pagi', data_type: 'number', unit: 'liter', is_required: false, category: 'Produksi', sort_order: 3 },
  { id: 4, species: 'cattle', purpose: 'dairy', attribute_key: 'milk_yield_evening', label: 'Susu Sore', data_type: 'number', unit: 'liter', is_required: false, category: 'Produksi', sort_order: 4 },
  { id: 5, species: 'cattle', purpose: 'dairy', attribute_key: 'total_305d_milk', label: 'Total Susu 305 Hari', data_type: 'number', unit: 'liter', is_required: false, category: 'Produksi', sort_order: 5 },
  { id: 6, species: 'cattle', purpose: 'dairy', attribute_key: 'body_condition_score', label: 'BCS', data_type: 'number', unit: '1-5', min_value: 1, max_value: 5, is_required: true, category: 'Kesehatan', sort_order: 6 },
  { id: 7, species: 'cattle', purpose: 'dairy', attribute_key: 'dry_period_start', label: 'Mulai Kering', data_type: 'date', is_required: false, category: 'Reproduksi', sort_order: 7 },
  { id: 8, species: 'cattle', purpose: 'beef', attribute_key: 'body_condition_score', label: 'BCS', data_type: 'number', unit: '1-5', min_value: 1, max_value: 5, is_required: true, category: 'Kesehatan', sort_order: 1 },
  { id: 9, species: 'cattle', purpose: 'beef', attribute_key: 'average_daily_gain', label: 'ADG', data_type: 'number', unit: 'kg/hari', is_required: true, category: 'Pertumbuhan', sort_order: 2 },
  { id: 10, species: 'cattle', purpose: 'beef', attribute_key: 'feed_conversion_ratio', label: 'FCR', data_type: 'number', is_required: false, category: 'Pakan', sort_order: 3 },
  { id: 11, species: 'cattle', purpose: 'beef', attribute_key: 'target_slaughter_weight', label: 'Target Bobot Potong', data_type: 'number', unit: 'kg', is_required: false, category: 'Produksi', sort_order: 4 },
  { id: 12, species: 'cattle', purpose: 'beef', attribute_key: 'estimated_slaughter_date', label: 'Estimasi Potong', data_type: 'date', is_required: false, category: 'Produksi', sort_order: 5 },
  { id: 13, species: 'sheep', attribute_key: 'body_condition_score', label: 'BCS', data_type: 'number', unit: '1-5', min_value: 1, max_value: 5, is_required: true, category: 'Kesehatan', sort_order: 1 },
  { id: 14, species: 'sheep', attribute_key: 'wool_grade', label: 'Grade Wol', data_type: 'text', is_required: false, category: 'Produksi', sort_order: 2 },
  { id: 15, species: 'sheep', attribute_key: 'wool_yield_per_shearing', label: 'Hasil Wol/Cukur', data_type: 'number', unit: 'kg', is_required: false, category: 'Produksi', sort_order: 3 },
  { id: 16, species: 'sheep', attribute_key: 'average_daily_gain', label: 'ADG', data_type: 'number', unit: 'kg/hari', is_required: true, category: 'Pertumbuhan', sort_order: 4 },
  { id: 17, species: 'sheep', attribute_key: 'litter_size_avg', label: 'Rata-rata Anak', data_type: 'number', unit: 'ekor', is_required: false, category: 'Reproduksi', sort_order: 5 },
  { id: 18, species: 'goat', attribute_key: 'body_condition_score', label: 'BCS', data_type: 'number', unit: '1-5', min_value: 1, max_value: 5, is_required: true, category: 'Kesehatan', sort_order: 1 },
  { id: 19, species: 'goat', attribute_key: 'milk_yield_per_day', label: 'Susu/Hari', data_type: 'number', unit: 'liter', is_required: false, category: 'Produksi', sort_order: 2 },
  { id: 20, species: 'goat', attribute_key: 'average_daily_gain', label: 'ADG', data_type: 'number', unit: 'kg/hari', is_required: true, category: 'Pertumbuhan', sort_order: 3 },
  { id: 21, species: 'goat', attribute_key: 'litter_size_avg', label: 'Rata-rata Anak', data_type: 'number', unit: 'ekor', is_required: false, category: 'Reproduksi', sort_order: 4 },
];

export const mockAnimalAttributes: AnimalAttribute[] = [
  { id: 1, animal_id: 1, attribute_key: 'lactation_number', attribute_value: '3', recorded_date: '2026-05-14' },
  { id: 2, animal_id: 1, attribute_key: 'days_in_milk', attribute_value: '185', recorded_date: '2026-05-14' },
  { id: 3, animal_id: 1, attribute_key: 'milk_yield_morning', attribute_value: '12.5', recorded_date: '2026-05-14' },
  { id: 4, animal_id: 1, attribute_key: 'milk_yield_evening', attribute_value: '10.2', recorded_date: '2026-05-14' },
  { id: 5, animal_id: 1, attribute_key: 'body_condition_score', attribute_value: '3.5', recorded_date: '2026-05-14' },
  { id: 6, animal_id: 2, attribute_key: 'lactation_number', attribute_value: '4', recorded_date: '2026-05-14' },
  { id: 7, animal_id: 2, attribute_key: 'days_in_milk', attribute_value: '210', recorded_date: '2026-05-14' },
  { id: 8, animal_id: 2, attribute_key: 'milk_yield_morning', attribute_value: '14.0', recorded_date: '2026-05-14' },
  { id: 9, animal_id: 2, attribute_key: 'milk_yield_evening', attribute_value: '11.5', recorded_date: '2026-05-14' },
  { id: 10, animal_id: 6, attribute_key: 'average_daily_gain', attribute_value: '0.85', recorded_date: '2026-05-14' },
  { id: 11, animal_id: 7, attribute_key: 'average_daily_gain', attribute_value: '0.92', recorded_date: '2026-05-14' },
  { id: 12, animal_id: 9, attribute_key: 'body_condition_score', attribute_value: '3.0', recorded_date: '2026-05-14' },
  { id: 13, animal_id: 10, attribute_key: 'body_condition_score', attribute_value: '3.5', recorded_date: '2026-05-14' },
  { id: 14, animal_id: 10, attribute_key: 'average_daily_gain', attribute_value: '0.12', recorded_date: '2026-05-14' },
  { id: 15, animal_id: 12, attribute_key: 'milk_yield_per_day', attribute_value: '2.5', recorded_date: '2026-05-14' },
];

export const mockGeneticRecords: GeneticRecord[] = [
  { id: 1, animal_id: 1, genetic_merit_milk: 850, dna_sample_id: 'DNA-001', notes: 'Progeny dari SP-001 induk unggul' },
  { id: 2, animal_id: 2, genetic_merit_milk: 920, dna_sample_id: 'DNA-002' },
  { id: 3, animal_id: 6, genetic_merit_growth: 1.2, dna_sample_id: 'DNA-006', notes: 'Pejantan unggul' },
];

export const mockFeedFormulas: FeedFormula[] = [
  { id: 1, name: 'Ransum Sapi Perah Laktasi Awal', target_species: 'cattle', target_purpose: 'dairy', target_phase: 'Laktasi Awal', total_quantity_kg: 100, calculated_protein_pct: 16.5, calculated_tdn_pct: 70, calculated_cost_per_kg: 4200, is_active: true, created_by: 2 },
  { id: 2, name: 'Ransum Penggemukan Sapi Potong', target_species: 'cattle', target_purpose: 'beef', target_phase: 'Penggemukan', total_quantity_kg: 100, calculated_protein_pct: 13, calculated_tdn_pct: 68, calculated_cost_per_kg: 3800, is_active: true, created_by: 2 },
  { id: 3, name: 'Ransum Domba Penggemukan', target_species: 'sheep', target_purpose: 'wool', target_phase: 'Penggemukan', total_quantity_kg: 50, calculated_protein_pct: 14.5, calculated_tdn_pct: 66, calculated_cost_per_kg: 4500, is_active: true, created_by: 2 },
];

export const mockFeedFormulaItems: FeedFormulaItem[] = [
  { id: 1, formula_id: 1, feed_id: 1, quantity_kg: 50, percentage: 50, cost_at_formulation: 25000 },
  { id: 2, formula_id: 1, feed_id: 2, quantity_kg: 20, percentage: 20, cost_at_formulation: 64000 },
  { id: 3, formula_id: 1, feed_id: 3, quantity_kg: 15, percentage: 15, cost_at_formulation: 127500 },
  { id: 4, formula_id: 1, feed_id: 5, quantity_kg: 5, percentage: 5, cost_at_formulation: 60000 },
  { id: 5, formula_id: 2, feed_id: 1, quantity_kg: 40, percentage: 40, cost_at_formulation: 20000 },
  { id: 6, formula_id: 2, feed_id: 2, quantity_kg: 30, percentage: 30, cost_at_formulation: 96000 },
  { id: 7, formula_id: 2, feed_id: 6, quantity_kg: 10, percentage: 10, cost_at_formulation: 8000 },
  { id: 8, formula_id: 2, feed_id: 5, quantity_kg: 5, percentage: 5, cost_at_formulation: 60000 },
  { id: 9, formula_id: 3, feed_id: 1, quantity_kg: 17.5, percentage: 35, cost_at_formulation: 8750 },
  { id: 10, formula_id: 3, feed_id: 2, quantity_kg: 15, percentage: 30, cost_at_formulation: 48000 },
  { id: 11, formula_id: 3, feed_id: 3, quantity_kg: 7.5, percentage: 15, cost_at_formulation: 63750 },
  { id: 12, formula_id: 3, feed_id: 5, quantity_kg: 2.5, percentage: 5, cost_at_formulation: 30000 },
];

export const mockNutritionRequirements: NutritionRequirement[] = [
  { id: 1, species: 'cattle', purpose: 'dairy', physiological_phase: 'Laktasi Awal', weight_range_kg: '500-650', daily_dm_intake_kg: 16.5, dm_pct_body_weight: 3.0, cp_requirement_pct: 17, tdn_requirement_pct: 70, me_requirement_mcal: 38, ca_requirement_pct: 0.7, p_requirement_pct: 0.45, reference: 'NRC 2001' },
  { id: 2, species: 'cattle', purpose: 'dairy', physiological_phase: 'Laktasi Tengah', weight_range_kg: '500-650', daily_dm_intake_kg: 14.5, dm_pct_body_weight: 2.8, cp_requirement_pct: 15, tdn_requirement_pct: 66.5, me_requirement_mcal: 34, ca_requirement_pct: 0.6, p_requirement_pct: 0.4, reference: 'NRC 2001' },
  { id: 3, species: 'cattle', purpose: 'dairy', physiological_phase: 'Kering', weight_range_kg: '500-650', daily_dm_intake_kg: 9, dm_pct_body_weight: 1.8, cp_requirement_pct: 12.5, tdn_requirement_pct: 58, me_requirement_mcal: 20, ca_requirement_pct: 0.45, p_requirement_pct: 0.35, reference: 'NRC 2001' },
  { id: 4, species: 'cattle', purpose: 'beef', physiological_phase: 'Penggemukan', weight_range_kg: '300-450', daily_dm_intake_kg: 12, dm_pct_body_weight: 2.8, cp_requirement_pct: 13, tdn_requirement_pct: 68, me_requirement_mcal: 28, ca_requirement_pct: 0.5, p_requirement_pct: 0.35, reference: 'NRC 2000' },
  { id: 5, species: 'sheep', purpose: 'wool', physiological_phase: 'Penggemukan', weight_range_kg: '30-50', daily_dm_intake_kg: 1.5, dm_pct_body_weight: 3.5, cp_requirement_pct: 15, tdn_requirement_pct: 67, me_requirement_mcal: 3.5, ca_requirement_pct: 0.5, p_requirement_pct: 0.35, reference: 'NRC 2007' },
  { id: 6, species: 'goat', purpose: 'dairy', physiological_phase: 'Laktasi', weight_range_kg: '40-60', daily_dm_intake_kg: 1.8, dm_pct_body_weight: 3.5, cp_requirement_pct: 17, tdn_requirement_pct: 66, me_requirement_mcal: 4.0, ca_requirement_pct: 0.7, p_requirement_pct: 0.45, reference: 'NRC 2007' },
];

export const mockLaborExpenses: LaborExpense[] = [
  { id: 1, expense_date: '2026-05-01', worker_name: 'Andi Kurniawan', worker_id: 3, expense_type: 'salary', period_month: 5, period_year: 2026, amount: 2500000, recorded_by_name: 'Dewi Rahayu' },
  { id: 2, expense_date: '2026-05-01', worker_name: 'Siti Aminah', worker_id: 4, expense_type: 'salary', period_month: 5, period_year: 2026, amount: 2500000, recorded_by_name: 'Dewi Rahayu' },
  { id: 3, expense_date: '2026-05-07', worker_name: 'Andi Kurniawan', expense_type: 'overtime', period_month: 5, period_year: 2026, amount: 350000, recorded_by_name: 'Dewi Rahayu' },
];

export const mockOperationalExpenses: OperationalExpense[] = [
  { id: 1, expense_date: '2026-05-05', category: 'electricity', amount: 1250000, description: 'Tagihan listrik April 2026', invoice_number: 'INV-PLN-0426', recorded_by_name: 'Dewi Rahayu' },
  { id: 2, expense_date: '2026-05-02', category: 'water', amount: 450000, description: 'Tagihan PDAM April 2026', invoice_number: 'INV-PDAM-0426', recorded_by_name: 'Dewi Rahayu' },
  { id: 3, expense_date: '2026-04-28', category: 'fuel', amount: 850000, description: 'Bensin traktor & generator', recorded_by_name: 'Andi Kurniawan' },
  { id: 4, expense_date: '2026-04-20', category: 'maintenance', amount: 2750000, description: 'Servis mesin pemerahan', recorded_by_name: 'Dewi Rahayu' },
];

export const mockStockAdjustments: StockAdjustment[] = [
  { id: 1, adjustment_date: '2026-05-10', item_type: 'feed', item_id: 1, quantity_before: 2100, quantity_after: 1850, quantity_change: -250, reason: 'Rusak terkena hujan', notes: 'Rumput gajah di gudang B bocor', recorded_by_name: 'Andi Kurniawan' },
  { id: 2, adjustment_date: '2026-04-25', item_type: 'medicine', item_id: 3, quantity_before: 8, quantity_after: 5, quantity_change: -3, reason: 'Kadaluwarsa', notes: 'Batch Ivermectin IVM-001 expired', recorded_by_name: 'Dewi Rahayu' },
];

export const getDashboardStats = () => {
  const cattleCount = mockAnimals.filter(a => a.species === 'cattle').length;
  const sheepCount = mockAnimals.filter(a => a.species === 'sheep').length;
  const goatCount = mockAnimals.filter(a => a.species === 'goat').length;

  const healthyCount = mockAnimals.filter(a => a.status === 'healthy').length;
  const sickCount = mockAnimals.filter(a => a.status === 'sick').length;
  const pregnantCount = mockAnimals.filter(a => a.status === 'pregnant').length;
  const lactatingCount = mockAnimals.filter(a => a.status === 'lactating').length;
  const dryCount = mockAnimals.filter(a => a.status === 'dry').length;

  const totalIncome = mockFinancialTransactions
    .filter(t => t.type === 'income' && t.cash_flow === 'cash_in')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = mockFinancialTransactions
    .filter(t => t.type === 'expense' && t.cash_flow !== 'non_cash')
    .reduce((s, t) => s + t.amount, 0);

  const totalFeedValue = mockFeedInventory.reduce((s, f) => s + f.total_cost, 0);
  const totalMedValue = mockMedicineInventory.reduce((s, m) => s + m.total_cost, 0);

  const avgMilkToday = mockDailyProduction[0]?.quantity || 188;

  const pendingTasks = mockTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const overdueTasks = mockTasks.filter(t => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date('2026-05-14') && t.status !== 'completed' && t.status !== 'cancelled';
  }).length;

  const unreadAlerts = mockAlerts.filter(a => !a.is_read).length;
  const criticalAlerts = mockAlerts.filter(a => a.severity === 'critical' && !a.is_resolved).length;

  return {
    cattleCount,
    sheepCount,
    goatCount,
    totalAnimals: mockAnimals.length,
    healthyCount,
    sickCount,
    pregnantCount,
    lactatingCount,
    dryCount,
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    totalFeedValue,
    totalMedValue,
    totalInventoryValue: totalFeedValue + totalMedValue,
    avgMilkToday,
    pendingTasks,
    overdueTasks,
    unreadAlerts,
    criticalAlerts,
    lowStockCount: mockFeedInventory.filter(f => f.quantity_on_hand < f.min_threshold).length + mockMedicineInventory.filter(m => m.quantity_on_hand < m.min_threshold).length,
  };
};
