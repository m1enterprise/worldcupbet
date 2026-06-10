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

// import { base44 } from "@/api/base44Client";

const CUTOFF_MINUTES = 1; // minut przed meczem - ostatnia chwila na bet

/**
 * Zwraca true jeśli można jeszcze obstawiać dany mecz.
 * Cutoff = 1 minuta przed kickoffem.
 */
export function canBetOnMatch(match) {
  if (match.status === "finished" || match.status === "live") return false;

  const matchDateTime = parseMatchDateTime(match.date, match.time);
  if (!matchDateTime) return true; // brak daty - pozwól obstawiać

  const now = new Date();
  const cutoff = new Date(matchDateTime.getTime() - CUTOFF_MINUTES * 60 * 1000);
  return now < cutoff;
}

/**
 * Parsuje datę i czas meczu do obiektu Date.
 */
function parseMatchDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  try {
    const time = timeStr || "00:00";
    return new Date(`${dateStr}T${time}:00`);
  } catch {
    return null;
  }
}

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
export async function saveBet(userId, match, betData) {
  if (!canBetOnMatch(match)) {
    throw new Error("Nie mozna obstawiec tego meczu ktory sie rozpoczal, pozdro.");
  }

  const payload = {
    match_id: String(match.id),
    match_date: match.date,
    match_time: match.time,
    home_team: match.homeTeam,
    away_team: match.awayTeam,
    home_score: betData.homeScore !== "" ? Number(betData.homeScore) : null,
    away_score: betData.awayScore !== "" ? Number(betData.awayScore) : null,
    extra_time_winner: betData.extraTimeWinner || "",
  };

  // Sprawdź czy bet już istnieje dla tego meczu
  const existing = await getBetForMatch(String(match.id));

  if (existing) {
    // return await base44.entities.Bet.update(existing.id, payload);
    const { data, error } = await supabase
        .from('bets')
        .insert(payload)
        .select();
    
      if (error) {
        console.log(error)
        return null
      } else {
        return(data[0]);
      }

  } else {
    // return await base44.entities.Bet.create(payload);
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
}

/**
 * Pobiera wszystkie bety zalogowanego usera.
 * (Base44 automatycznie filtruje po created_by_id = aktualny user)
 * 
 * @returns {Array} lista betów
 */
export async function getUserBets() {
  return await base44.entities.Bet.list("-created_date", 500);
}

/**
 * Pobiera bet dla konkretnego meczu (dla zalogowanego usera).
 * 
 * @param {string} matchId 
 * @returns {Object|null} bet lub null
 */
export async function getBetForMatch(matchId) {
  const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('matchId', matchId)
      .single();
  
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