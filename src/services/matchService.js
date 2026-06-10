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

export async function getMatchById(id){
  const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single();
    
      if (error) {
        console.error(error);
        return null;
      }
    
      return data;
}

