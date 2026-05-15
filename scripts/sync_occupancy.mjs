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
  console.log('=== SYNCING LOCATION OCCUPANCIES ===\n');

  // Get all locations
  const { data: locs } = await supabase.from('locations').select('id, name, user_id');
  console.log(`Found ${locs?.length || 0} locations\n`);

  for (const loc of locs || []) {
    const { count } = await supabase.from('animals')
      .select('id', { count: 'exact', head: true })
      .eq('current_location_id', loc.id)
      .eq('user_id', loc.user_id);

    console.log(`  "${loc.name}" → ${count || 0} animals`);

    await supabase.from('locations')
      .update({ current_occupancy: count || 0 })
      .eq('id', loc.id);
  }

  console.log('\n=== VERIFICATION ===');
  const { data: updated } = await supabase.from('locations').select('name, current_occupancy, capacity');
  updated?.forEach(l => {
    const pct = l.capacity > 0 ? Math.round((l.current_occupancy / l.capacity) * 100) : 0;
    console.log(`  "${l.name}" occ=${l.current_occupancy} cap=${l.capacity} (${pct}% utilized)`);
  });
}

main().catch(console.error);
