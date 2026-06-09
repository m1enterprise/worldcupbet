import {supabase} from '../supabase.js';

export async function getMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select('*');

  if (error) {
    console.error(error);
    return null;
  } else {
    return data;
  }
}
