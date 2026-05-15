/*
  PESSAT Demo Seed Data
  =====================
  Run this in Supabase SQL Editor to populate all features with realistic demo data.
  Prerequisites: At least one user with role='owner' must exist in the users table.

  To use: paste this entire script into Supabase SQL Editor → Run
*/

DO $$
DECLARE
  _uid        UUID;

  -- Location IDs
  _loc_main   UUID := gen_random_uuid();
  _loc_pad    UUID := gen_random_uuid();
  _loc_quar   UUID := gen_random_uuid();

  -- Herd Group IDs
  _grp_dairy  UUID := gen_random_uuid();
  _grp_beef   UUID := gen_random_uuid();

  -- Animal IDs
  _a1 UUID := gen_random_uuid();  -- Sapi Perah 1
  _a2 UUID := gen_random_uuid();  -- Sapi Perah 2
  _a3 UUID := gen_random_uuid();  -- Sapi Perah 3
  _a4 UUID := gen_random_uuid();  -- Sapi Potong 1
  _a5 UUID := gen_random_uuid();  -- Sapi Potong 2
  _a6 UUID := gen_random_uuid();  -- Domba Potong 1
  _a7 UUID := gen_random_uuid();  -- Domba Potong 2
  _a8 UUID := gen_random_uuid();  -- Kambing Perah 1
  _a9 UUID := gen_random_uuid();  -- Kambing Perah 2
  _a10 UUID := gen_random_uuid(); -- Sapi Perah Bunting

  -- Feed IDs
  _f1 UUID := gen_random_uuid();  -- Hijauan Segar
  _f2 UUID := gen_random_uuid();  -- Konsentrat
  _f3 UUID := gen_random_uuid();  -- Silase
  _f4 UUID := gen_random_uuid();  -- Hay/Jerami

  -- Medicine IDs
  _m1 UUID := gen_random_uuid();  -- Amoxicillin
  _m2 UUID := gen_random_uuid();  -- Vitamin B Complex
  _m3 UUID := gen_random_uuid();  -- Ivermectin
  _m4 UUID := gen_random_uuid();  -- Dexamethasone

  -- Misc IDs
  _formula1  UUID := gen_random_uuid();
  _formula2  UUID := gen_random_uuid();
  _hr1       UUID := gen_random_uuid();
  _hr2       UUID := gen_random_uuid();
  _hr3       UUID := gen_random_uuid();
  _fp1       UUID := gen_random_uuid();
  _fp2       UUID := gen_random_uuid();
  _fp3       UUID := gen_random_uuid();
  _fp4       UUID := gen_random_uuid();
  _mp1       UUID := gen_random_uuid();
  _mp2       UUID := gen_random_uuid();
  _ap1       UUID := gen_random_uuid();
  _as1       UUID := gen_random_uuid();
  _prod1     UUID := gen_random_uuid();

BEGIN
  -- ── Get first owner user ──────────────────────────────────────────────────
  SELECT id INTO _uid FROM users WHERE role = 'owner' LIMIT 1;
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'No owner user found. Please create an owner account via the app first, then run this seed.';
  END IF;

  RAISE NOTICE 'Seeding data for user %', _uid;

  -- ── Locations ─────────────────────────────────────────────────────────────
  INSERT INTO locations (id, name, type, capacity, current_occupancy, area_sqm, is_active, notes, user_id)
  VALUES
    (_loc_main, 'Kandang Utama A', 'shed',          30, 10, 500.0, true, 'Kandang sapi perah utama',  _uid),
    (_loc_pad,  'Padang Rumput 1', 'paddock',        50,  5, 2000.0, true, 'Area penggembalaan pagi',   _uid),
    (_loc_quar, 'Kandang Karantina', 'quarantine',    5,  0, 80.0,  true, 'Isolasi hewan sakit baru',  _uid)
  ON CONFLICT DO NOTHING;

  -- ── Herd Groups ───────────────────────────────────────────────────────────
  INSERT INTO herd_groups (id, name, location_id, member_count, notes, supervisor_name, user_id)
  VALUES
    (_grp_dairy, 'Kelompok Sapi Perah', _loc_main, 4, 'Sapi perah FH dan PO laktasi',   'Budi Santoso', _uid),
    (_grp_beef,  'Kelompok Sapi Potong', _loc_pad,  2, 'Sapi potong program penggemukan', 'Agus Prasetyo', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Animals ───────────────────────────────────────────────────────────────
  INSERT INTO animals (id, tag_id, species, breed, gender, birth_date, current_weight_kg, status, purpose,
                       color, current_location_id, acquisition_type, acquisition_cost, acquisition_date, user_id)
  VALUES
    (_a1,  'SP-001', 'cattle', 'Friesian Holstein', 'female', '2020-03-15', 520.0, 'lactating', 'dairy', 'Hitam-Putih', _loc_main, 'purchased', 18000000, '2021-06-01', _uid),
    (_a2,  'SP-002', 'cattle', 'Friesian Holstein', 'female', '2019-07-22', 495.0, 'lactating', 'dairy', 'Hitam-Putih', _loc_main, 'purchased', 16500000, '2021-06-01', _uid),
    (_a3,  'SP-003', 'cattle', 'Peranakan Ongole',  'female', '2021-01-10', 380.0, 'dry',       'dairy', 'Putih',      _loc_main, 'born',      0,         '2021-01-10', _uid),
    (_a4,  'SP-004', 'cattle', 'Simmental',         'male',   '2022-05-18', 450.0, 'healthy',   'beef',  'Kuning-Coklat', _loc_pad, 'purchased', 14000000, '2023-01-15', _uid),
    (_a5,  'SP-005', 'cattle', 'Limousin',          'male',   '2022-08-30', 420.0, 'healthy',   'beef',  'Merah Kecoklatan', _loc_pad, 'purchased', 13500000, '2023-01-15', _uid),
    (_a6,  'DB-001', 'sheep',  'Garut',             'male',   '2022-11-05',  45.0, 'healthy',   'beef',  'Putih',      _loc_main, 'purchased', 2500000,   '2023-03-01', _uid),
    (_a7,  'DB-002', 'sheep',  'Garut',             'female', '2023-02-14',  38.0, 'healthy',   'beef',  'Hitam-Putih', _loc_main, 'born',     0,          '2023-02-14', _uid),
    (_a8,  'KB-001', 'goat',   'Etawa',             'female', '2021-09-20',  52.0, 'lactating', 'dairy', 'Coklat-Putih', _loc_main, 'purchased', 5500000,  '2022-04-10', _uid),
    (_a9,  'KB-002', 'goat',   'Etawa',             'female', '2022-03-08',  48.0, 'healthy',   'dairy', 'Hitam-Putih', _loc_main, 'purchased', 5000000,  '2022-09-01', _uid),
    (_a10, 'SP-010', 'cattle', 'Friesian Holstein', 'female', '2020-11-12', 480.0, 'pregnant',  'dairy', 'Hitam-Putih', _loc_main, 'purchased', 17000000, '2021-08-15', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Herd Group Members ───────────────────────────────────────────────────
  INSERT INTO herd_group_members (id, herd_group_id, animal_id, joined_at, user_id)
  VALUES
    (gen_random_uuid(), _grp_dairy, _a1,  NOW() - INTERVAL '2 years',  _uid),
    (gen_random_uuid(), _grp_dairy, _a2,  NOW() - INTERVAL '2 years',  _uid),
    (gen_random_uuid(), _grp_dairy, _a3,  NOW() - INTERVAL '1 year',   _uid),
    (gen_random_uuid(), _grp_dairy, _a10, NOW() - INTERVAL '6 months', _uid),
    (gen_random_uuid(), _grp_beef,  _a4,  NOW() - INTERVAL '1 year',   _uid),
    (gen_random_uuid(), _grp_beef,  _a5,  NOW() - INTERVAL '1 year',   _uid)
  ON CONFLICT DO NOTHING;

  -- Update herd group member counts
  UPDATE herd_groups SET member_count = 4 WHERE id = _grp_dairy AND user_id = _uid;
  UPDATE herd_groups SET member_count = 2 WHERE id = _grp_beef  AND user_id = _uid;

  -- ── Weight Records ────────────────────────────────────────────────────────
  INSERT INTO weight_records (id, animal_id, weigh_date, weight_kg, body_condition_score, notes, user_id)
  VALUES
    (gen_random_uuid(), _a1,  NOW()::date - 30, 510.0, 3.5, 'Kondisi baik, laktasi aktif', _uid),
    (gen_random_uuid(), _a1,  NOW()::date,      520.0, 3.5, 'Berat meningkat',             _uid),
    (gen_random_uuid(), _a4,  NOW()::date - 60, 420.0, 3.0, 'Awal program penggemukan',    _uid),
    (gen_random_uuid(), _a4,  NOW()::date,      450.0, 3.5, 'Target tercapai 30 kg/bulan', _uid),
    (gen_random_uuid(), _a10, NOW()::date - 14, 475.0, 3.5, 'Bobot bunting 7 bulan',       _uid)
  ON CONFLICT DO NOTHING;

  -- ── Health Records ───────────────────────────────────────────────────────
  INSERT INTO health_records (id, animal_id, record_date, type, diagnosis, treatment, vet_name, cost,
                               is_resolved, follow_up_date, notes, user_id)
  VALUES
    (_hr1, _a2,  NOW()::date - 45, 'illness',   'Mastitis ringan',     'Antibiotik intra-mammae 3 hari', 'drh. Wibowo',  350000,  true,  NULL,                 'Sembuh total setelah 3 hari pengobatan', _uid),
    (_hr2, _a6,  NOW()::date - 20, 'checkup',   'Pemeriksaan rutin',   'Cacing ditemukan, diberi ivermectin', 'drh. Sari', 150000, true,  NULL,                 'Kondisi umum baik',                     _uid),
    (_hr3, _a10, NOW()::date - 7,  'checkup',   'Pemeriksaan kebuntingan', 'Konfirmasi bunting 8 bulan, estimasi lahir 1 bulan', 'drh. Wibowo', 200000, false, NOW()::date + 30, 'Persiapkan kandang melahirkan', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Vaccinations ─────────────────────────────────────────────────────────
  INSERT INTO vaccinations (id, animal_id, herd_group_id, vaccine_name, batch_number, date_administered,
                             next_due_date, cost, administered_by, notes, user_id)
  VALUES
    (gen_random_uuid(), NULL, _grp_dairy, 'Anthrax + Brucellosis', 'BT-2024-01', NOW()::date - 365,
     NOW()::date + 2, 250000, 'drh. Wibowo', 'Vaksinasi massal kelompok perah', _uid),
    (gen_random_uuid(), _a6,  NULL,       'Orf (Ecthyma)',         'OF-2024-03', NOW()::date - 180,
     NOW()::date + 4, 75000,  'drh. Sari',   'Vaksinasi domba individu',        _uid),
    (gen_random_uuid(), NULL, _grp_beef,  'FMD (PMK)',             'FD-2024-02', NOW()::date - 180,
     NOW()::date + 6, 300000, 'drh. Wibowo', 'Vaksinasi wajib PMK sapi potong', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Breeding Events ───────────────────────────────────────────────────────
  INSERT INTO breeding_events (id, animal_id, event_type, event_date, expected_due_date, cost, notes, user_id)
  VALUES
    (gen_random_uuid(), _a10, 'insemination',    NOW()::date - 270, NOW()::date + 10, 150000, 'IB dengan straw FH import', _uid),
    (gen_random_uuid(), _a10, 'pregnancy_check', NOW()::date - 240, NULL,             100000, 'Konfirmasi bunting positif', _uid),
    (gen_random_uuid(), _a3,  'dry_off',         NOW()::date - 60,  NULL,             0,      'Sapi masuk periode kering', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Feeds ─────────────────────────────────────────────────────────────────
  INSERT INTO feeds (id, name, category, unit, dry_matter_pct, crude_protein_pct, tdn_pct, is_active, user_id)
  VALUES
    (_f1, 'Hijauan Segar (Rumput Gajah)', 'forage',      'kg', 18.0, 10.5, 52.0, true, _uid),
    (_f2, 'Konsentrat Sapi Perah',        'concentrate', 'kg', 88.0, 17.0, 72.0, true, _uid),
    (_f3, 'Silase Jagung',                'forage',      'kg', 30.0, 8.5,  65.0, true, _uid),
    (_f4, 'Hay / Jerami Padi',            'forage',      'kg', 85.0, 5.0,  45.0, true, _uid)
  ON CONFLICT DO NOTHING;

  -- ── Feed Purchases ────────────────────────────────────────────────────────
  INSERT INTO feed_purchases (id, feed_id, purchase_date, quantity, unit, price_per_unit, total_amount,
                               supplier, invoice_number, user_id)
  VALUES
    (_fp1, _f1, NOW()::date - 25, 2000, 'kg', 400,   800000,  'CV Hijau Subur',  'INV-2024-001', _uid),
    (_fp2, _f2, NOW()::date - 20,  500, 'kg', 4500, 2250000,  'PT Konsentrat Jaya','INV-2024-002', _uid),
    (_fp3, _f1, NOW()::date - 10, 1500, 'kg', 420,   630000,  'CV Hijau Subur',  'INV-2024-003', _uid),
    (_fp4, _f3, NOW()::date - 8,  1000, 'kg', 350,   350000,  'UD Agro Tani',    'INV-2024-004', _uid),
    (gen_random_uuid(), _f4, NOW()::date - 5, 500, 'kg', 800, 400000, 'UD Agro Tani', 'INV-2024-005', _uid),
    (gen_random_uuid(), _f2, NOW()::date - 3, 300, 'kg', 4500, 1350000, 'PT Konsentrat Jaya', 'INV-2024-006', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Feed Inventory (manual insert, mirrors purchase totals) ───────────────
  INSERT INTO feed_inventory (id, feed_id, quantity_on_hand, avg_cost_per_unit, total_cost, min_threshold,
                               last_purchase_date, user_id)
  VALUES
    (gen_random_uuid(), _f1, 2800, 408,  1142400, 500,  NOW()::date - 10, _uid),
    (gen_random_uuid(), _f2,  700, 4500, 3150000, 200,  NOW()::date - 3,  _uid),
    (gen_random_uuid(), _f3,  900, 350,   315000, 200,  NOW()::date - 8,  _uid),
    (gen_random_uuid(), _f4,  450, 800,   360000, 100,  NOW()::date - 5,  _uid)
  ON CONFLICT DO NOTHING;

  -- ── Feed Consumption ──────────────────────────────────────────────────────
  INSERT INTO feed_consumption (id, feed_id, herd_group_id, consumption_date, quantity, unit,
                                 cost_per_unit, total_cost, notes, user_id)
  VALUES
    (gen_random_uuid(), _f1, _grp_dairy, NOW()::date - 3,  80, 'kg', 408, 32640, 'Pemberian pagi dan sore', _uid),
    (gen_random_uuid(), _f2, _grp_dairy, NOW()::date - 3,  30, 'kg', 4500, 135000, 'Konsentrat 3 kg/ekor x 10 ekor', _uid),
    (gen_random_uuid(), _f1, _grp_beef,  NOW()::date - 2,  40, 'kg', 408, 16320, 'Hijauan sapi potong',     _uid),
    (gen_random_uuid(), _f3, _grp_dairy, NOW()::date - 1,  50, 'kg', 350, 17500, 'Silase tambahan',         _uid),
    (gen_random_uuid(), _f2, _grp_dairy, NOW()::date,      30, 'kg', 4500, 135000, 'Konsentrat pagi',       _uid)
  ON CONFLICT DO NOTHING;

  -- ── Feed Formulas ─────────────────────────────────────────────────────────
  INSERT INTO feed_formulas (id, name, target_species, target_purpose, target_phase, total_quantity_kg,
                              calculated_protein_pct, calculated_tdn_pct, is_active, user_id)
  VALUES
    (_formula1, 'Ransum Sapi Perah Laktasi Awal', 'cattle', 'dairy', 'Laktasi Awal', 25.0, 16.5, 68.0, true, _uid),
    (_formula2, 'Ransum Sapi Potong Penggemukan',  'cattle', 'beef',  'Penggemukan',  10.0, 13.5, 70.0, true, _uid)
  ON CONFLICT DO NOTHING;

  INSERT INTO feed_formula_items (id, formula_id, feed_id, quantity_kg, percentage, user_id)
  VALUES
    (gen_random_uuid(), _formula1, _f1, 15.0, 60.0, _uid),
    (gen_random_uuid(), _formula1, _f2,  7.0, 28.0, _uid),
    (gen_random_uuid(), _formula1, _f3,  3.0, 12.0, _uid),
    (gen_random_uuid(), _formula2, _f1,  5.0, 50.0, _uid),
    (gen_random_uuid(), _formula2, _f2,  3.0, 30.0, _uid),
    (gen_random_uuid(), _formula2, _f4,  2.0, 20.0, _uid)
  ON CONFLICT DO NOTHING;

  -- ── Nutrition Requirements ────────────────────────────────────────────────
  INSERT INTO nutrition_requirements (id, species, purpose, physiological_phase, daily_dm_intake_kg,
                                       cp_requirement_pct, tdn_requirement_pct, ca_requirement_pct,
                                       p_requirement_pct, reference, user_id)
  VALUES
    (gen_random_uuid(), 'cattle', 'dairy',    'Laktasi Awal',   16.5, 17.0, 70.0, 0.70, 0.45, 'NRC 2001', _uid),
    (gen_random_uuid(), 'cattle', 'dairy',    'Laktasi Tengah', 14.5, 15.0, 66.5, 0.60, 0.40, 'NRC 2001', _uid),
    (gen_random_uuid(), 'cattle', 'dairy',    'Kering',          9.0, 12.5, 57.5, 0.45, 0.33, 'NRC 2001', _uid),
    (gen_random_uuid(), 'cattle', 'beef',     'Penggemukan',    12.0, 13.0, 68.5, 0.50, 0.35, 'NRC 2000', _uid),
    (gen_random_uuid(), 'cattle', 'beef',     'Induk Bunting',   9.0, 11.0, 57.5, 0.45, 0.33, 'NRC 2000', _uid),
    (gen_random_uuid(), 'sheep',  'beef',     'Penggemukan',     1.5, 15.0, 67.5, 0.50, 0.35, 'NRC 2007', _uid),
    (gen_random_uuid(), 'sheep',  'breeding', 'Induk Bunting',   1.25, 13.0, 60.0, 0.60, 0.40, 'NRC 2007', _uid),
    (gen_random_uuid(), 'goat',   'beef',     'Penggemukan',     1.25, 15.0, 67.5, 0.50, 0.35, 'NRC 2007', _uid),
    (gen_random_uuid(), 'goat',   'dairy',    'Laktasi',         1.75, 17.0, 66.5, 0.70, 0.45, 'NRC 2007', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Medicines ─────────────────────────────────────────────────────────────
  INSERT INTO medicines (id, name, type, unit, default_min_threshold, is_active, user_id)
  VALUES
    (_m1, 'Amoxicillin 500mg', 'antibiotic',     'tablet', 50, true, _uid),
    (_m2, 'Vitamin B Complex', 'vitamin',         'botol',  10, true, _uid),
    (_m3, 'Ivermectin 1% Inj', 'antiparasitic',   'botol',   5, true, _uid),
    (_m4, 'Dexamethasone Inj', 'anti_inflammatory','vial',  10, true, _uid)
  ON CONFLICT DO NOTHING;

  -- ── Medicine Purchases ────────────────────────────────────────────────────
  INSERT INTO medicine_purchases (id, medicine_id, purchase_date, quantity, price_per_unit, total_amount,
                                   supplier, batch_number, expiry_date, user_id)
  VALUES
    (_mp1, _m1, NOW()::date - 30, 200, 3500,  700000, 'Apotek Ternak Sehat', 'AMX-2024-01', '2026-12-31', _uid),
    (_mp2, _m2, NOW()::date - 25,  30, 45000, 1350000,'PT Medion',            'VB-2024-01',  '2026-06-30', _uid),
    (gen_random_uuid(), _m3, NOW()::date - 20,  20, 85000, 1700000,'PT Medion', 'IVM-2024-01', '2026-09-30', _uid),
    (gen_random_uuid(), _m4, NOW()::date - 15,  50, 22000, 1100000,'Apotek Ternak Sehat','DX-2024-01','2026-03-31', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Medicine Inventory ────────────────────────────────────────────────────
  INSERT INTO medicine_inventory (id, medicine_id, quantity_on_hand, avg_cost_per_unit, total_cost,
                                   min_threshold, expiry_date, user_id)
  VALUES
    (gen_random_uuid(), _m1, 190, 3500,  665000, 50, '2026-12-31', _uid),
    (gen_random_uuid(), _m2,  28, 45000, 1260000, 10, '2026-06-30', _uid),
    (gen_random_uuid(), _m3,  18, 85000, 1530000,  5, '2026-09-30', _uid),
    (gen_random_uuid(), _m4,  48, 22000, 1056000, 10, '2026-03-31', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Medicine Usages ───────────────────────────────────────────────────────
  INSERT INTO medicine_usages (id, medicine_id, animal_id, health_record_id, usage_date, quantity,
                                dosage_notes, cost_per_unit, total_cost, administered_by, user_id)
  VALUES
    (gen_random_uuid(), _m1, _a2, _hr1, NOW()::date - 45, 10, '2 tablet 2x sehari x 3 hari', 3500, 35000, 'drh. Wibowo', _uid),
    (gen_random_uuid(), _m3, _a6, _hr2, NOW()::date - 20,  1, '1 ml/10 kg BB (inj. SC)',      85000, 85000,'drh. Sari',   _uid),
    (gen_random_uuid(), _m2, _a10,NULL, NOW()::date - 7,   2, 'Suplemen kebuntingan',          45000, 90000,'Petugas Kandang', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Daily Production (10 hari terakhir – susu) ────────────────────────────
  INSERT INTO daily_production (id, production_date, herd_group_id, product_type, quantity, unit, shift,
                                  quality_grade, notes, user_id)
  SELECT
    gen_random_uuid(),
    (NOW()::date - generate_series(0, 9)) AS production_date,
    _grp_dairy,
    'milk',
    (75 + (random() * 15)::int)::numeric,
    'liter',
    'all_day',
    CASE WHEN random() > 0.2 THEN 'A' ELSE 'B' END,
    'Produksi normal kelompok perah',
    _uid
  ON CONFLICT DO NOTHING;

  -- ── Product Sales ─────────────────────────────────────────────────────────
  INSERT INTO product_sales (id, sale_date, product_type, quantity, unit, price_per_unit, total_amount,
                              buyer_name, payment_method, user_id)
  VALUES
    (_prod1, NOW()::date - 6, 'milk', 450.0, 'liter', 6500, 2925000, 'KUD Sejahtera',    'transfer', _uid),
    (gen_random_uuid(), NOW()::date - 3, 'milk', 430.0, 'liter', 6500, 2795000, 'KUD Sejahtera','transfer', _uid),
    (gen_random_uuid(), NOW()::date,     'milk', 460.0, 'liter', 6500, 2990000, 'KUD Sejahtera','transfer', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Animal Purchases ──────────────────────────────────────────────────────
  INSERT INTO animal_purchases (id, animal_id, purchase_date, seller_name, purchase_price, additional_costs,
                                 total_cost, weight_at_purchase_kg, notes, user_id)
  VALUES
    (_ap1, _a4,  '2023-01-15', 'Pak Sumarno – Boyolali', 13500000, 500000, 14000000, 380.0,
     'Sapi Simmental umur 10 bulan', _uid),
    (gen_random_uuid(), _a5, '2023-01-15', 'Pak Sumarno – Boyolali', 13000000, 500000, 13500000, 360.0,
     'Sapi Limousin umur 9 bulan', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Animal Sales ──────────────────────────────────────────────────────────
  INSERT INTO animal_sales (id, animal_id, sale_date, buyer_name, sale_price, weight_at_sale_kg,
                             reason, notes, user_id)
  VALUES
    (_as1, _a7, NOW()::date - 45, 'Pak Baskoro – Solo', 4500000, 42.0, 'Jual saat Idul Adha',
     'Domba betina dijual ke pembeli langsung', _uid)
  ON CONFLICT DO NOTHING;

  -- ── Labor Expenses ────────────────────────────────────────────────────────
  INSERT INTO labor_expenses (id, expense_date, worker_name, expense_type, period_month, period_year,
                               amount, notes, user_id)
  VALUES
    (gen_random_uuid(), NOW()::date - 20, 'Budi Santoso',  'salary', EXTRACT(MONTH FROM NOW())::int - 1,
     EXTRACT(YEAR FROM NOW())::int, 2500000, 'Gaji bulan lalu – kandang perah', _uid),
    (gen_random_uuid(), NOW()::date - 20, 'Agus Prasetyo', 'salary', EXTRACT(MONTH FROM NOW())::int - 1,
     EXTRACT(YEAR FROM NOW())::int, 2500000, 'Gaji bulan lalu – kandang potong', _uid),
    (gen_random_uuid(), NOW()::date - 5,  'Siti Rahayu',   'wage',   EXTRACT(MONTH FROM NOW())::int,
     EXTRACT(YEAR FROM NOW())::int, 1800000, 'Upah harian – pencatat produksi',  _uid)
  ON CONFLICT DO NOTHING;

  -- ── Operational Expenses ─────────────────────────────────────────────────
  INSERT INTO operational_expenses (id, expense_date, category, amount, description, user_id)
  VALUES
    (gen_random_uuid(), NOW()::date - 15, 'electricity', 850000,  'Listrik kandang + pompa air bulan ini',   _uid),
    (gen_random_uuid(), NOW()::date - 10, 'water',       200000,  'Tagihan PDAM untuk kandang',              _uid),
    (gen_random_uuid(), NOW()::date - 8,  'fuel',        350000,  'Solar genset dan kendaraan operasional',  _uid),
    (gen_random_uuid(), NOW()::date - 3,  'repair',      750000,  'Perbaikan atap kandang utama bocor',      _uid)
  ON CONFLICT DO NOTHING;

  -- ── Stock Adjustments ────────────────────────────────────────────────────
  INSERT INTO stock_adjustments (id, adjustment_date, item_type, item_id, quantity_change, reason, notes,
                                  cost_per_unit_at_time, total_cost_change, user_id)
  VALUES
    (gen_random_uuid(), NOW()::date - 12, 'feed',     _f1, -150, 'rusak',       'Hijauan busuk terpapar hujan', 408, 61200, _uid),
    (gen_random_uuid(), NOW()::date - 5,  'medicine', _m4,  -2,  'kadaluwarsa', 'Vial DX kadaluwarsa ditemukan saat stock opname', 22000, 44000, _uid)
  ON CONFLICT DO NOTHING;

  -- ── Financial Transactions (manual – auto-gen is done by API) ────────────
  INSERT INTO financial_transactions (id, transaction_date, type, category, cash_flow, amount,
                                       description, source_table, source_id, user_id)
  VALUES
    (gen_random_uuid(), NOW()::date - 45, 'expense', 'medicine_usage',  'non_cash', 35000,
     'Pemakaian Amoxicillin – SP-002', 'medicine_usages', _hr1::text, _uid),
    (gen_random_uuid(), NOW()::date - 30, 'expense', 'feed_purchase',   'cash_out', 800000,
     'Pembelian Hijauan Segar', 'feed_purchases', _fp1::text, _uid),
    (gen_random_uuid(), NOW()::date - 20, 'expense', 'feed_purchase',   'cash_out', 2250000,
     'Pembelian Konsentrat', 'feed_purchases', _fp2::text, _uid),
    (gen_random_uuid(), NOW()::date - 20, 'expense', 'labor',           'cash_out', 2500000,
     'Gaji Budi Santoso', 'labor_expenses', gen_random_uuid()::text, _uid),
    (gen_random_uuid(), NOW()::date - 20, 'expense', 'labor',           'cash_out', 2500000,
     'Gaji Agus Prasetyo', 'labor_expenses', gen_random_uuid()::text, _uid),
    (gen_random_uuid(), NOW()::date - 15, 'expense', 'opex_electricity','cash_out', 850000,
     'Listrik kandang', 'operational_expenses', gen_random_uuid()::text, _uid),
    (gen_random_uuid(), NOW()::date - 10, 'expense', 'feed_purchase',   'cash_out', 630000,
     'Pembelian Hijauan Segar lanjutan', 'feed_purchases', _fp3::text, _uid),
    (gen_random_uuid(), NOW()::date - 8,  'expense', 'feed_purchase',   'cash_out', 350000,
     'Pembelian Silase', 'feed_purchases', _fp4::text, _uid),
    (gen_random_uuid(), NOW()::date - 6,  'income',  'product_sale',    'cash_in',  2925000,
     'Penjualan susu 450 L', 'product_sales', _prod1::text, _uid),
    (gen_random_uuid(), NOW()::date - 3,  'income',  'product_sale',    'cash_in',  2795000,
     'Penjualan susu 430 L', 'product_sales', gen_random_uuid()::text, _uid),
    (gen_random_uuid(), NOW()::date,      'income',  'product_sale',    'cash_in',  2990000,
     'Penjualan susu 460 L', 'product_sales', gen_random_uuid()::text, _uid),
    (gen_random_uuid(), NOW()::date - 45, 'income',  'animal_sale',     'cash_in',  4500000,
     'Jual Domba DB-002', 'animal_sales', _as1::text, _uid),
    (gen_random_uuid(), NOW()::date - 12, 'expense', 'stock_loss',      'non_cash', 61200,
     'Penyesuaian stok: rusak', 'stock_adjustments', gen_random_uuid()::text, _uid)
  ON CONFLICT DO NOTHING;

  -- ── Tasks ─────────────────────────────────────────────────────────────────
  INSERT INTO tasks (id, title, description, assigned_to, created_by, due_date, priority, status,
                     related_animal_id, user_id)
  VALUES
    (gen_random_uuid(), 'Persiapkan kandang melahirkan SP-010',
     'Bersihkan kandang, siapkan lampu penerangan dan peralatan melahirkan',
     _uid, _uid, NOW()::date + 7, 'urgent', 'pending', _a10, _uid),
    (gen_random_uuid(), 'Vaksinasi PMK sapi betina',
     'Jadwalkan vaksinasi PMK untuk SP-001, SP-002, SP-003',
     _uid, _uid, NOW()::date + 14, 'high', 'pending', NULL, _uid),
    (gen_random_uuid(), 'Stock opname semua pakan',
     'Hitung ulang stok dan update di sistem',
     _uid, _uid, NOW()::date + 3, 'medium', 'in_progress', NULL, _uid),
    (gen_random_uuid(), 'Bayar gaji karyawan bulan ini',
     'Transfer gaji 3 karyawan kandang',
     _uid, _uid, NOW()::date + 10, 'high', 'pending', NULL, _uid),
    (gen_random_uuid(), 'Servis mesin perah',
     'Periksa dan servis mesin milking parlor – jadwal 3 bulanan',
     _uid, _uid, NOW()::date - 5, 'medium', 'pending', NULL, _uid)
  ON CONFLICT DO NOTHING;

  -- ── Alerts ────────────────────────────────────────────────────────────────
  INSERT INTO alerts (id, type, severity, title, message, animal_id, is_read, is_resolved, user_id)
  VALUES
    (gen_random_uuid(), 'breeding_due', 'warning', 'SP-010 Perkiraan Melahirkan 10 Hari Lagi',
     'Sapi SP-010 diperkirakan melahirkan dalam 10 hari. Pastikan kandang melahirkan sudah siap.',
     _a10, false, false, _uid),
    (gen_random_uuid(), 'vaccination_due', 'info', 'Jadwal Vaksinasi PMK – Sapi Potong',
     'Vaksinasi PMK kelompok sapi potong jatuh tempo dalam 14 hari.',
     NULL, false, false, _uid),
    (gen_random_uuid(), 'health_issue', 'critical', 'SP-010 Pemantauan Pra-Kelahiran',
     'SP-010 memerlukan pemeriksaan rutin mingguan hingga melahirkan.',
     _a10, false, false, _uid),
    (gen_random_uuid(), 'task_overdue', 'warning', 'Servis Mesin Perah Terlambat',
     'Tugas servis mesin perah sudah melewati tenggat 5 hari lalu.',
     NULL, false, false, _uid)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed data berhasil dimasukkan untuk user %', _uid;
END $$;
