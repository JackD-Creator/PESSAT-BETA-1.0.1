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

// Replicate the EXACT same API functions used by the app
async function getLocations(userId) {
  const q = supabase.from('locations').select('*').eq('user_id', userId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return data;
}

async function getHerdGroups(userId) {
  const q = supabase.from('herd_groups').select('*, locations(name)').eq('user_id', userId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return data;
}

async function getAnimals(userId) {
  let q = supabase.from('animals').select('*, locations!animals_current_location_id_fkey(name)');
  q = q.eq('user_id', userId);
  q = q.order('created_at', { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function getHerdGroupMembers(userId, herdGroupId) {
  const q = supabase.from('herd_group_members').select('*, animals(tag_id, species, breed, gender, status)').eq('herd_group_id', herdGroupId).eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function main() {
  // Get ALL users to see their full UUIDs
  const { data: users } = await supabase.from('users').select('id, full_name, email, role');
  
  for (const user of users) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`USER: ${user.full_name} (${user.email}) [${user.role}]`);
    console.log(`UUID: ${user.id}`);
    console.log(`${'='.repeat(60)}`);

    // Test getLocations
    try {
      const locs = await getLocations(user.id);
      console.log(`\n[1/4] getLocations() → ${locs.length} results`);
      locs.forEach(l => console.log(`  ✓ "${l.name}" type=${l.type} cap=${l.capacity} occ=${l.current_occupancy}`));
    } catch (e) {
      console.log(`\n[1/4] getLocations() → ERROR: ${e.message}`);
    }

    // Test getHerdGroups
    try {
      const groups = await getHerdGroups(user.id);
      console.log(`[2/4] getHerdGroups() → ${groups.length} results`);
      groups.forEach(g => console.log(`  ✓ "${g.name}" loc="${g.locations?.name || '-'}" supervisor="${g.supervisor_name || '-'}" members=${g.member_count}`));
    } catch (e) {
      console.log(`[2/4] getHerdGroups() → ERROR: ${e.message}`);
    }

    // Test getAnimals
    try {
      const animals = await getAnimals(user.id);
      console.log(`[3/4] getAnimals() → ${animals.length} results`);
      animals.forEach(a => {
        const locName = a.locations?.name || '-';
        console.log(`  ✓ "${a.tag_id}" ${a.species} ${a.breed} ${a.gender} ${a.status} ${a.current_weight_kg ?? 'null'}kg @${locName}`);
      });
    } catch (e) {
      console.log(`[3/4] getAnimals() → ERROR: ${e.message}`);
    }

    // Test getHerdGroupMembers for each group
    try {
      const groups = await getHerdGroups(user.id);
      for (const g of groups) {
        const members = await getHerdGroupMembers(user.id, g.id);
        console.log(`[4/4] getHerdGroupMembers("${g.name}") → ${members.length} results`);
        members.forEach(m => console.log(`  ✓ animal_id="${m.animal_id.slice(0,8)}" tag="${m.animals?.tag_id || '-'}" ${m.animals?.species || '-'}`));
      }
    } catch (e) {
      console.log(`[4/4] getHerdGroupMembers() → ERROR: ${e.message}`);
    }
  }
}

main().catch(console.error);
