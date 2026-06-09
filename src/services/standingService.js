import {supabase} from '../supabase.js';

export async function getStandings() {
  const { data, error } = await supabase
    .from('standings')
    .select('*');

  if (error) {
    console.error(error);
    return null
  } else {
    return data;
  }
}
