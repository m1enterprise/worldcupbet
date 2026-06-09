import {supabase} from '../supabase.js';

export async function pushBet(user_id, bet_data) {
  const { data, error } = await supabase
    .from('users')
    .update([
      {
        bets: bet_data
      },
    ])
    .eq('id', user_id);

  if (error) {
    console.error(error);
    return null
  } else {
    return data;
  }
}

export async function getBets(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq(id);

  if (error) {
    console.error(error);
    return null;
  } else {
    return data;
  }
}
