import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
const envRaw = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envRaw.split('\n')) {
  const m = line.match(/^(.+?)=(.+)$/);
  if (m) env[m[1]] = m[2];
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function inspect(tbl, filter = '*') {
  const { data, error } = await supabase.from(tbl).select(filter);
  if (error) return { error: error.message, data: [] };
  return { data, error: null };
}

async function main() {
  console.log('========================================');
  console.log('  DATABASE INSPECTION');
  console.log('========================================\n');

  // ALL herd_groups with all columns
  console.log('--- HERD GROUPS (all columns) ---');
  const hgs = await inspect('herd_groups');
  if (hgs.error) { console.log('ERROR:', hgs.error); }
  else {
    console.log('Count:', hgs.data.length);
    hgs.data.forEach(g => {
      console.log(JSON.stringify(g, null, 2));
    });
  }

  // ALL locations with all columns
  console.log('\n--- LOCATIONS (all columns) ---');
  const locs = await inspect('locations');
  if (locs.error) { console.log('ERROR:', locs.error); }
  else {
    console.log('Count:', locs.data.length);
    locs.data.forEach(l => console.log(JSON.stringify(l)));
  }

  // ALL animals with user_id
  console.log('\n--- ANIMALS ---');
  const animals = await inspect('animals', 'id, tag_id, species, breed, gender, status, current_weight_kg, current_location_id, user_id');
  if (animals.error) { console.log('ERROR:', animals.error); }
  else {
    console.log('Count:', animals.data.length);
    animals.data.forEach(a => console.log(JSON.stringify(a)));
    // Group by user_id
    const byUser = {};
    animals.data.forEach(a => { byUser[a.user_id] = (byUser[a.user_id] || 0) + 1; });
    console.log('\nAnimals by user_id:', JSON.stringify(byUser));
  }

  // ALL herd_group_members
  console.log('\n--- HERD GROUP MEMBERS ---');
  const members = await inspect('herd_group_members', '*, animals(id, tag_id, species, breed, gender, status)');
  if (members.error) { console.log('ERROR:', members.error); }
  else {
    console.log('Count:', members.data.length);
    members.data.forEach(m => console.log(JSON.stringify(m, null, 2)));
  }

  // Simulate what getLocations returns for each user
  console.log('\n--- SIMULATING API CALLS ---');
  for (const uid of ['7c4c7a1a', 'ad4558ed']) {
    const u = await supabase.from('users').select('id, full_name, email').eq('id', uid).single();
    console.log(`\nUser: ${u.data?.full_name || uid}`);
    
    const locs = await supabase.from('locations').select('*').eq('user_id', uid).order('name');
    console.log(`  getLocations(): ${locs.data?.length || 0} results`);
    (locs.data || []).forEach(l => console.log(`    "${l.name}" type=${l.type} cap=${l.capacity} occ=${l.current_occupancy}`));

    const hgs = await supabase.from('herd_groups').select('*, locations(name)').eq('user_id', uid).order('name');
    console.log(`  getHerdGroups(): ${hgs.data?.length || 0} results`);
    (hgs.data || []).forEach(g => console.log(`    "${g.name}" loc="${g.locations?.name || '-'}" supervisor="${g.supervisor_name || '-'}" members=${g.member_count}`));

    const animals = await supabase.from('animals').select('*, locations!animals_current_location_id_fkey(name)').eq('user_id', uid).order('created_at', { ascending: false });
    console.log(`  getAnimals(): ${animals.data?.length || 0} results`);
    if (animals.error) console.log(`    ERROR: ${animals.error.message}`);
    (animals.data || []).forEach(a => console.log(`    "${a.tag_id}" breed="${a.breed}" gender=${a.gender} weight=${a.current_weight_kg ?? 'null'} " loc="${a.locations?.name || '-'}"`));

    // Check the actual user_id in animals table for this user
    const animCount = await supabase.from('animals').select('id', { count: 'exact', head: true }).eq('user_id', uid);
    console.log(`  Total animals with user_id=${uid.slice(0,8)}: ${animCount.count || 0}`);
  }
}

main().catch(console.error);
