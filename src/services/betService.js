import {supabase} from '../supabase.js';

export async function pushBet(user_id, bet_day_data) {
  // global user_bets var
  let userBetsAll = []

  // fetch all user bets
  const { data: userBets, error: fetchError } = await supabase
    .from('users')
    .select('bets')
    .eq('id', user_id)
    .single();

  if (fetchError) {
    console.error(fetchError);
    return null;
  } else {
    userBetsAll = userBets || [];
  }

  console.log('Existing bets: ', userBetsAll);

  // bets => array of objects where object id === matchId and object items are bet info
  // when pushing a bet first check if there is already an object with match_id, then it would be an update
  userBetsAll.some(bet => bet.match_id === bet_day_data.match_id)


  // if not, it would be an insert

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        bets: bet_day_data
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
  console.log('Fetching bets for user:', id);
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(error);
    return null;
  } else {
    console.log('user: ', data)
    return data;
  }
}
