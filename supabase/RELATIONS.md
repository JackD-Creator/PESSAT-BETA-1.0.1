# Database Relations — Livestock Management System

## Legend
```
1:1  → one-to-one
1:N  → one-to-many (FK di tabel N)
N:M  → many-to-many (junction table)
```

---

## 1. Core Livestock

| # | Table | Relations |
|---|-------|-----------|
| 1 | `users` | `1:N` → health_records.recorded_by, vaccinations.recorded_by, weight_records.recorded_by, animal_movements.recorded_by, feed_purchases.recorded_by, feed_consumption.recorded_by, feed_formulas.created_by, medicine_purchases.recorded_by, medicine_usages.administered_by, animal_purchases.recorded_by, animal_sales.recorded_by, daily_production.recorded_by, product_sales.recorded_by, labor_expenses.recorded_by, stock_adjustments.recorded_by, financial_transactions.recorded_by, tasks.assigned_to, tasks.created_by, herd_groups.supervisor_id |
| 2 | `locations` | `1:N` → animals.current_location_id, animal_movements.from_location_id, animal_movements.to_location_id, herd_groups.location_id |
| 3 | `animals` | `1:N` (self) dam_id, sire_id<br>`N:1` → locations<br>`1:N` → weight_records, animal_movements, health_records, breeding_events, feed_consumption, medicine_usages, daily_production, animal_purchases, animal_sales, financial_transactions, alerts, tasks, animal_attributes<br>`1:1` → genetic_records |
| 4 | `attribute_definitions` | *(reference/master — no FK dependencies)* |
| 5 | `animal_attributes` | `N:1` → animals |
| 6 | `genetic_records` | `1:1` → animals |
| 7 | `weight_records` | `N:1` → animals, `N:1` → users(recorded_by) |
| 8 | `animal_movements` | `N:1` → animals, `N:1` → locations(from/to), `N:1` → users(recorded_by) |
| 9 | `herd_groups` | `N:1` → locations, `N:1` → users(supervisor_id) |
| 10 | `herd_group_members` | `N:1` → herd_groups, `N:1` → animals |

---

## 2. Health & Reproduction

| # | Table | Relations |
|---|-------|-----------|
| 11 | `health_records` | `N:1` → animals, `N:1` → users(recorded_by) |
| 12 | `vaccinations` | `N:1` → animals(via animal_id), `N:1` → herd_groups(via herd_group_id) |
| 13 | `breeding_events` | `N:1` → animals(animal_id), `N:1` → animals(sire_id), `N:1` → users(recorded_by) |

---

## 3. Feed & Medicine (Inventory — Moving Average Cost)

| # | Table | Relations |
|---|-------|-----------|
| 14 | `feeds` | `1:1` → feed_inventory, `1:N` → feed_purchases, feed_consumption, feed_formula_items |
| 15 | `feed_inventory` | `1:1` → feeds |
| 16 | `feed_purchases` | `N:1` → feeds, `N:1` → users(recorded_by) |
| 17 | `feed_consumption` | `N:1` → feeds, `N:1` → animals(via animal_id), `N:1` → herd_groups(via herd_group_id), `N:1` → users(recorded_by) |
| 18 | `feed_formulas` | `1:N` → feed_formula_items, `N:1` → users(created_by) |
| 19 | `feed_formula_items` | `N:1` → feed_formulas, `N:1` → feeds |
| 20 | `nutrition_requirements` | *(reference/master — no FK dependencies)* |
| 21 | `medicines` | `1:1` → medicine_inventory, `1:N` → medicine_purchases, medicine_usages |
| 22 | `medicine_inventory` | `1:1` → medicines |
| 23 | `medicine_purchases` | `N:1` → medicines, `N:1` → users(recorded_by) |
| 24 | `medicine_usages` | `N:1` → medicines, `N:1` → animals, `N:1` → health_records(via health_record_id), `N:1` → users(administered_by) |

---

## 4. Production & Sales

| # | Table | Relations |
|---|-------|-----------|
| 25 | `animal_purchases` | `1:1` → animals, `N:1` → users(recorded_by) |
| 26 | `animal_sales` | `1:1` → animals, `N:1` → users(recorded_by) |
| 27 | `daily_production` | `N:1` → animals(via animal_id), `N:1` → herd_groups(via herd_group_id), `N:1` → users(recorded_by) |
| 28 | `product_sales` | `N:1` → users(recorded_by) |

---

## 5. Finance (General Ledger)

| # | Table | Relations |
|---|-------|-----------|
| 29 | `labor_expenses` | `N:1` → users(worker_id), `N:1` → users(recorded_by) |
| 30 | `operational_expenses` | `N:1` → users(recorded_by) |
| 31 | `stock_adjustments` | `N:1` → users(recorded_by) |
| 32 | `financial_transactions` | *(polymorphic)* `source_table + source_id` → tabel sumber, `N:1` → animals, `N:1` → users(recorded_by) |

---

## 6. Operations & Notifications

| # | Table | Relations |
|---|-------|-----------|
| 33 | `alerts` | `N:1` → animals(via animal_id), `source_table + source_id` → polymorphic |
| 34 | `tasks` | `N:1` → users(assigned_to), `N:1` → users(created_by), `N:1` → animals(via related_animal_id), `N:1` → herd_groups(via related_herd_group_id) |

---

## Key Relationship Patterns

### Self-Reference (Animals)
```
animals.dam_id ──→ animals.id  (induk betina)
animals.sire_id ──→ animals.id  (pejantan)
```

### Polymorphic FK (Financial Transactions)
```
financial_transactions.source_table = 'feed_purchases'
financial_transactions.source_id   = feed_purchases.id
→ Composite UNIQUE (source_table, source_id) mencegah duplikasi
```

### Junction Table (Herd Group Members)
```
herd_group_members: (herd_group_id, animal_id) → N:M antara herd_groups & animals
```

### Moving Average Cost Flow
```
feed_purchases → update feed_inventory.avg_cost_per_unit
feed_consumption → baca avg_cost → hitung total_cost → update feed_inventory
```
Rumus: `new_avg = ((qty_lama × avg_lama) + (qty_beli × harga_beli)) / (qty_lama + qty_beli)`

### Financial Transaction Sources (14 sumber)
| Source Table | Category | Cash Flow |
|-------------|----------|-----------|
| feed_purchases | feed_purchase | cash_out |
| feed_consumption | feed_usage | non_cash |
| medicine_purchases | medicine_purchase | cash_out |
| medicine_usages | medicine_usage | non_cash |
| health_records | vet_service | cash_out |
| vaccinations | vaccination | cash_out |
| breeding_events | breeding | cash_out |
| animal_sales | animal_sale | cash_in |
| animal_purchases | animal_purchase | cash_out |
| product_sales | product_sale | cash_in |
| labor_expenses | labor | cash_out |
| operational_expenses | opex_[category] | cash_out |
| stock_adjustments | stock_loss | non_cash |
