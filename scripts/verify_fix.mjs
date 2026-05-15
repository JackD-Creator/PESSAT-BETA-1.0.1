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

async function main() {
  const user = '7c4c7a1a-e4ff-4261-90cf-3b02eabe2aec';
  const groupId = '6c1de04b-1ceb-45f2-b628-333d4e27f0cb';

  console.log('=== TEST 1: OLD API (with user_id filter) ===');
  const { data: oldResult } = await supabase.from('herd_group_members')
    .select('*, animals(tag_id, species, breed, gender, status)')
    .eq('herd_group_id', groupId)
    .eq('user_id', user);
  console.log(`Results: ${oldResult?.length || 0}`);

  console.log('\n=== TEST 2: FIXED API (without user_id filter) ===');
  const { data: newResult } = await supabase.from('herd_group_members')
    .select('*, animals(tag_id, species, breed, gender, status)')
    .eq('herd_group_id', groupId);
  console.log(`Results: ${newResult?.length || 0}`);
  if (newResult?.length) {
    newResult.forEach(m => {
      console.log(`  Member: animal="${m.animals?.tag_id}" (${m.animals?.species}) joined=${m.joined_at}`);
    });
  }

  console.log('\n=== TEST 3: HerdGroupPage card data simulation ===');
  const { data: group } = await supabase.from('herd_groups').select('*').eq('id', groupId).single();
  const { data: members } = await supabase.from('herd_group_members')
    .select('*, animals(tag_id, species, breed, gender, status)')
    .eq('herd_group_id', groupId);
  const animals = members?.map(m => m.animals).filter(Boolean) || [];
  const healthy = animals.filter(a => a.status === 'healthy').length;
  const sick = animals.filter(a => a.status === 'sick').length;
  const pregnant = animals.filter(a => a.status === 'pregnant').length;
  console.log(`Group: "${group?.name}"`);
  console.log(`Location: "${group?.location_id ? 'has location' : 'no location assigned'}"`);
  console.log(`Supervisor: "${group?.supervisor_name || '(none)'}"`);
  console.log(`Member count: ${group?.member_count}`);
  console.log(`  Healthy: ${healthy}`);
  console.log(`  Sick: ${sick}`);
  console.log(`  Pregnant: ${pregnant}`);

  console.log('\n=== TEST 4: Occupancy after creating/updating animal ===');
  const locs = await supabase.from('locations').select('name, current_occupancy, capacity').eq('user_id', user);
  locs.data?.forEach(l => {
    console.log(`  "${l.name}" occ=${l.current_occupancy} cap=${l.capacity}`);
  });
}

main().catch(console.error);
