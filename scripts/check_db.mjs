import { createClient } from './src/utils/supabase/server.js';

async function checkLocations() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('Location').select('*');
  if (error) {
    console.error(error);
    return;
  }
  console.log('Locations:', JSON.stringify(data, null, 2));
  
  const { data: cabinData } = await supabase.from('Cabin').select('*');
  console.log('Cabins:', JSON.stringify(cabinData, null, 2));
}

checkLocations();
