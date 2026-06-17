import {supabase} from '../supabase.js';

export async function getBets() {
  const { data, error } = await supabase
    .from('bets')
    .select('*')

  if (error) {
    console.error(error);
    return null;
  } else {
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
    return data;
}
}

export async function pushBonusBet(userId, bonusBet) {
  // only if before 1 match
  // '2026-06-11T19:00:00Z'
  const now = new Date();
  const ctf = new Date('2026-06-11T19:00:00Z');
  if (now > ctf) {
    return null
  }

    const { data, error } = await supabase
      .from('bonusbets')
      .select('*')
      .eq('bonusUserId', userId)
      .single();

    const existing = data ? true : null

    if (existing) {
    // return await base44.entities.Bet.update(existing.id, payload);
    const { data, error } = await supabase
        .from("bonusbets")
        .update(bonusBet)
        .eq("bonusUserId", userId)
        .select()
        .single();
    
      if (error) {
        console.log(error)
        return null
      } else {
        return(data);
      }
  } else {
    // return await base44.entities.Bet.create(payload);
    const { data, error } = await supabase
        .from('bonusbets')
        .insert(bonusBet)
        .select()
        .single();
    
      if (error) {
        console.log(error)
        return null
      } else {
        return(data);
      }
  }
  
}

export async function getBonusBetByUserId(userId) {
  const { data, error } = await supabase
        .from('bonusbets')
        .select('*')
        .eq('bonusUserId', userId)

  if (error) {
    console.error(error);
    return null;
  } else {
    return data;
}
}

export async function getBonusBets(userId) {
  const { data, error } = await supabase
        .from('bonusbets')
        .select('*')
  
  if (error) {
    console.error(error);
    return null;
  } else {
    return data;
}
}