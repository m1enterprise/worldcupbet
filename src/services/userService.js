import {supabase} from '../supabase.js';

export async function userRegister(username, password) {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        username,
        password,
        bets: [],
      },
    ])
    .select();

  if (error) {
    console.log(error)
    return null
  } else {
    return(data[0]);
  }
}

export async function userLogin(username, password) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
