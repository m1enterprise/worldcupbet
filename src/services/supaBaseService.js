import {supabase} from '../supabase.js';

export async function pushMatches(match_data) {
  const { data, error } = await supabase
    .from('matches')
    .insert([
      {
      match_id: match_data?.id,
      utcDate: match_data?.utcDate,
      status: match_data?.status,
      matchday: match_data?.matchday,
      stage: match_data?.stage,
      group: match_data?.group,
      lastUpdated: match_data?.lastUpdated,
      homeTeam: match_data?.homeTeam,
      awayTeam: match_data?.awayTeam,
      score: match_data?.score,
      },
    ]);

  if (error) {
    console.error(error);
  } else {
    console.log('Inserted:', data);
  }
}

export async function pushStandings(data) {
  const { sbdata, error } = await supabase
    .from('standings')
    .insert([
      {
        stage: data?.stage,
        type: data?.type,
        group: data?.group,
        table: data?.table,
      },
    ]);

  if (error) {
    console.error(error);
  } else {
    console.log('Inserted:', sbdata);
  }
}