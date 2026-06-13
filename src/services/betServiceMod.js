/**
 * bet_service.js
 * 
 * Warstwa serwisowa do zapisu i edycji betów per-user.
 * 
 * ARCHITEKTURA:
 * - Bety są zapisywane w encji `Bet` w bazie Base44.
 * - `created_by_id` (built-in) automatycznie = zalogowany user_id.
 * - Jeden rekord = jeden mecz + jeden user (unikalność: match_id + created_by_id).
 * - Cutoff: nie można obstawiać meczu mniej niż 1 minutę przed jego rozpoczęciem.
 * 
 * OPERACJE:
 * - saveBet(match, betData)     → tworzy nowy lub aktualizuje istniejący bet
 * - getUserBets()               → wszystkie bety zalogowanego usera
 * - getBetForMatch(matchId)     → bet dla konkretnego meczu (lub null)
 * - canBetOnMatch(match)        → boolean - czy można jeszcze obstawiać
 * - deleteBet(betId)            → usuwa bet
 */

import { be } from "date-fns/locale";
import { getMatchById } from "./matchService";
import { supabase } from "../supabase";

// import { base44 } from "@/api/base44Client";

const CUTOFF_MINUTES = 1; // minut przed meczem - ostatnia chwila na bet

/**
 * Zwraca true jeśli można jeszcze obstawiać dany mecz.
 * Cutoff = 1 minuta przed kickoffem.
 */
export async function canBetOnMatch(betData) {
    // fetch match by id
    const match = await getMatchById(betData.matchId)
    if (!match) return console.error("could not fetch match by id")
// '2026-06-10T19:00:00Z'
  if (match.status === "finished" || match.status === "live") return false;

//   const matchDateTime = parseMatchDateTime(match.date, match.time);
//   const matchDateTime = parseMatchDateTime(match.utcDate);
const matchDateTime = new Date(match.utcDate);

    console.log("check match when", matchDateTime)

//   if (!matchDateTime) return true; // brak daty - pozwól obstawiać

  const now = new Date();
  const ctf = new Date(matchDateTime.getTime() - CUTOFF_MINUTES * 60 * 1000);
  console.log(now)
  console.log(ctf)
  console.log(now<ctf)
  return now < ctf;
}

/**
 * Parsuje datę i czas meczu do obiektu Date.
 */
// function parseMatchDateTime(utcDate) {
//   if (!utcDate) return null;
//   try {
//     const time = timeStr || "00:00";
//     return new Date(`${utcDate}T${time}:00`);
//   } catch {
//     return null;
//   }
// }

/**
 * Zapisuje lub aktualizuje bet dla zalogowanego usera.
 * Jeśli bet dla tego meczu już istnieje - aktualizuje go.
 * Jeśli nie - tworzy nowy.
 * 
 * @param {Object} match - obiekt meczu { id, date, time, homeTeam, awayTeam, ... }
 * @param {Object} betData - { homeScore, awayScore, extraTimeWinner }
 * @returns {Object} zapisany rekord betu
 * @throws {Error} jeśli za późno na obstawianie
 */
export async function saveBet(userId, betData) {
    console.log('saveBet', userId, betData)
    const canBet = await canBetOnMatch(betData)
    // const canBet = true
console.log('canBet: ',canBet)
    if (!canBet) {
        return null
    }
console.log('went after canBet check - bet valid')
  const payload = {
    matchId: betData.matchId,
    userId: userId,
    matchUtcDate: betData.matchUtcDate,
    homeTeam: betData.homeTeam,
    awayTeam: betData.awayTeam,
    homeScore: betData.homeScore !== "" ? Number(betData.homeScore) : null,
    awayScore: betData.awayScore !== "" ? Number(betData.awayScore) : null,
    extraTimeWinner: betData.extraTimeWinner || "",
  };

  // Sprawdź czy bet już istnieje dla tego meczu
  const existing = await getBetForMatch(userId, betData.matchId);

  console.log(100)

  if (existing) {
    // return await base44.entities.Bet.update(existing.id, payload);
    const { data, error } = await supabase
        .from("bets")
        .update(payload)
        .eq("userId", userId)
        .eq("matchId", betData.matchId)
        .select()
        .single();
    
      if (error) {
        console.log(error)
        return null
      } else {
            console.log(200)
            console.log(data)
        return(data);
      }
  } else {
    // return await base44.entities.Bet.create(payload);
    const { data, error } = await supabase
        .from('bets')
        .insert([
          payload
        ])
        .select()
        .single();
    
      if (error) {
        console.log(error)
        return null
      } else {
            console.log(300)

        return(data);
      }
  }

  
}

/**
 * Pobiera wszystkie bety zalogowanego usera.
 * (Base44 automatycznie filtruje po created_by_id = aktualny user)
 * 
 * @returns {Array} lista betów
 */
export async function getUserBets(userId) {
//   return await base44.entities.Bet.list("-created_date", 500);
   const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('userId', userId)
        .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  } else {
    console.log('bets: ', data)
    return data;
  }

}

/**
 * Pobiera bet dla konkretnego meczu (dla zalogowanego usera).
 * 
 * @param {string} matchId 
 * @returns {Object|null} bet lub null
 */
export async function getBetForMatch(userId, matchId) {
  const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq("userId", userId)
      .eq("matchId", matchId)
      .maybeSingle();
  
    if (error) {
      console.error(error);
      return null;
    }
  
    return data; 
}

/**
 * Usuwa bet.
 * 
 * @param {string} betId - ID rekordu betu
 */
export async function deleteBet(betId) {
  return await base44.entities.Bet.delete(betId);
}

/**
 * Konwertuje bety z bazy do formatu kompatybilnego z localStorage (legacy).
 * Przydatne przy migracji lub jako fallback.
 * 
 * @param {Array} bets - lista betów z bazy
 * @returns {Object} { matchId: { homeScore, awayScore, extraTimeWinner } }
 */
export function betsToLegacyFormat(bets) {
  const result = {};
  bets.forEach((bet) => {
    result[bet.match_id] = {
      homeScore: bet.home_score ?? "",
      awayScore: bet.away_score ?? "",
      extraTimeWinner: bet.extra_time_winner || "",
    };
  });
  return result;
}