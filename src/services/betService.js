import {supabase} from '../supabase.js';

export async function getBets() {
  const { data, error } = await supabase
    .from('bets')
    .select('*')

  if (error) {
    console.error(error);
    return null;
  } else {
    console.log('bets: ', data)
    return data;
  }
}

export async function getBetsByUserId(userId) {
  const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('userId', userId)

  if (error) {
    console.error(error);
    return null;
  } else {
    console.log('bets: ', data)
    return data;
}
}