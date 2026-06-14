import {supabase} from '../supabase.js';

export async function getScorers() {
  const { data, error } = await supabase
    .from('scorers')
    .select('*')

  if (error) {
    console.error(error);
    return null;
  } else {
    return data;
  }
}
