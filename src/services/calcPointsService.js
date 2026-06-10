/**
 * calc_points_service.js
 *
 * Serwis do obliczania punktów dla każdego usera na podstawie
 * ich betów i realnych wyników meczów.
 *
 * ZASADY PUNKTACJI:
 *
 * Faza grupowa:
 *   5 pkt - dokładny wynik
 *   3 pkt - trafiony zwycięzca / remis (bez dokładnego wyniku)
 *   0 pkt - chybiony
 *
 * Faza pucharowa:
 *   7 pkt - dokładny remis + trafiony zwycięzca po dogrywce
 *   5 pkt - dokładny wynik do 90 min (bez dogrywki)
 *   5 pkt - nieodkładny remis + trafiony zwycięzca po dogrywce
 *   3 pkt - trafiony rezultat (wygrana / przegrana / remis bez detali zwycięzcy)
 *   2 pkt - chybiony rezultat, ale trafiony zwycięzca po dogrywce
 *   0 pkt - brak trafień
 *
 * Bety są grupowane per userId, a wyniki per matchId.
 */

// Etapy pucharowe wg football-data.org
const KNOCKOUT_STAGES = new Set([
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
]);

/**
 * Czy mecz jest w fazie pucharowej?
 * @param {string} stage - np. "GROUP_STAGE", "ROUND_OF_16" itd.
 */
function isKnockout(stage) {
  return KNOCKOUT_STAGES.has(stage?.toUpperCase());
}

/**
 * Wyznacz zwycięzcę regulaminowego czasu gry:
 * "home" | "away" | "draw"
 */
function getOutcome(homeScore, awayScore) {
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return "draw";
}

/**
 * Oblicz punkty za jeden mecz dla jednego usera.
 *
 * @param {Object} bet  - { homeScore, awayScore, extraTimeWinner }
 *                        (liczby lub null)
 * @param {Object} match - { stage, score: { winner, duration, fullTime: { home, away } } }
 * @returns {{ points: number, isCorrect: boolean, isExact: boolean }}
 */
export function calcMatchPoints(bet, match) {
  const { score, stage } = match;

  // Brak wyniku meczu lub betu → 0 pkt
  if (
    score?.fullTime?.home == null ||
    score?.fullTime?.away == null ||
    bet?.homeScore == null ||
    bet?.awayScore == null
  ) {
    return { points: 0, isCorrect: false, isExact: false };
  }

  const rH = parseInt(score.fullTime.home);
  const rA = parseInt(score.fullTime.away);
  const bH = parseInt(bet.homeScore);
  const bA = parseInt(bet.awayScore);

  const exactScore = bH === rH && bA === rA;
  const realOutcome = getOutcome(rH, rA);
  const betOutcome = getOutcome(bH, bA);
  const correctOutcome = realOutcome === betOutcome;

  // Zwycięzca po dogrywce / karnych z football-data: "HOME_TEAM" | "AWAY_TEAM"
  const realExtWinner =
    score.winner === "HOME_TEAM" && realOutcome === "draw"
      ? "home"
      : score.winner === "AWAY_TEAM" && realOutcome === "draw"
      ? "away"
      : null;

  // Zwycięzca po dogrywce z betu usera
  const betExtWinner = bet.extraTimeWinner || null; // "home" | "away" | null

  // ── FAZA GRUPOWA ──────────────────────────────────────────────
  if (!isKnockout(stage)) {
    if (exactScore) return { points: 5, isCorrect: true, isExact: true };
    if (correctOutcome) return { points: 3, isCorrect: true, isExact: false };
    return { points: 0, isCorrect: false, isExact: false };
  }

  // ── FAZA PUCHAROWA ────────────────────────────────────────────

  // Czy mecz zakończył się w dogrywce / karnych?
  const wentToET =
    score.duration === "EXTRA_TIME" || score.duration === "PENALTY_SHOOTOUT";

  // 7 pkt: dokładny remis 90 min + trafiony zwycięzca po dogrywce
  if (exactScore && realOutcome === "draw" && wentToET && betExtWinner && betExtWinner === realExtWinner) {
    return { points: 7, isCorrect: true, isExact: true };
  }

  // 5 pkt: dokładny wynik do 90 min (bez dogrywki)
  if (exactScore && !wentToET) {
    return { points: 5, isCorrect: true, isExact: true };
  }

  // 5 pkt: nieodkładny remis, ale trafiony zwycięzca po dogrywce
  if (!exactScore && betOutcome === "draw" && realOutcome === "draw" && wentToET && betExtWinner && betExtWinner === realExtWinner) {
    return { points: 5, isCorrect: true, isExact: false };
  }

  // 3 pkt: trafiony rezultat meczu (90 min)
  if (correctOutcome && !wentToET) {
    return { points: 3, isCorrect: true, isExact: false };
  }

  // 3 pkt: trafiony rezultat remisu (90 min) - dogrywka ale chybiony zwycięzca
  if (correctOutcome && realOutcome === "draw" && wentToET) {
    return { points: 3, isCorrect: true, isExact: false };
  }

  // 2 pkt: zły rezultat 90 min, ale trafiony zwycięzca po dogrywce
  if (!correctOutcome && wentToET && betExtWinner && betExtWinner === realExtWinner) {
    return { points: 2, isCorrect: false, isExact: false };
  }

  return { points: 0, isCorrect: false, isExact: false };
}

/**
 * Główna funkcja serwisu.
 * Oblicza punkty dla wszystkich userów.
 *
 * @param {Array} bets   - lista betów z Bet entity
 *   każdy bet: { created_by_id, match_id, home_score, away_score, extra_time_winner }
 *
 * @param {Array} matches - lista meczów z API / encji
 *   każdy mecz: { id, status, stage, score: { winner, duration, fullTime: { home, away } } }
 *
 * @param {Array} [bonusData] - opcjonalnie: [{ userId, champion, topScorer }]
 *   (jeśli podane, dolicza +10 pkt za trafionego mistrza/króla strzelców)
 * @param {Object} [tournamentResults] - { champion: "ESP", topScorer: "Messi" }
 *
 * @returns {Array} calcPointsArray - posortowane malejąco po punktach
 *   [{ userId, zdobyte_punkty, trafione_wyniki, dokladnie_trafione_wyniki }, ...]
 */
export function calcPointsForAllUsers(bets, matches, bonusData = [], tournamentResults = null) {
    // console.log(1, bets)
    // console.log(2, matches)
    // console.log(3, bonusData)
    // console.log(4, tournamentResults)



    console.log('start calc')

  // Indeks meczów wg ID (string) dla O(1) lookup
  const matchIndex = {};
  matches.forEach((m) => {
    matchIndex[String(m.id)] = m;
  });

      console.log('calc 1: ', matchIndex)


  // Zbierz bety per userId
  const userBetsMap = {};
  bets.forEach((bet) => {
    const uid = bet.userId;
    if (!uid) return;
    if (!userBetsMap[uid]) userBetsMap[uid] = [];
    userBetsMap[uid].push(bet);
  });

        console.log('calc 2: ', userBetsMap)


  // Przelicz punkty per user
  const results = Object.entries(userBetsMap).map(([userId, userBets]) => {
    let zdobyte_punkty = 0;
    let trafione_wyniki = 0;
    let dokladnie_trafione_wyniki = 0;
    let bets_placed = 0;

    userBets.forEach((bet) => {
      const match = matchIndex[String(bet.match_id)];
      // Liczymy tylko zakończone mecze
        console.log('calc for bet: ', bet.id)

      if (!match || match.status !== "FINISHED") return;

        console.log('valid calc, continue: ', bet.id)

      bets_placed++;

      const betNorm = {
        homeScore: bet.home_score,
        awayScore: bet.away_score,
        extraTimeWinner: bet.extra_time_winner || null,
      };

      const { points, isCorrect, isExact } = calcMatchPoints(betNorm, match);
      zdobyte_punkty += points;
      if (isCorrect) trafione_wyniki++;
      if (isExact) dokladnie_trafione_wyniki++;
    });

    // Bonusy
    if (tournamentResults && bonusData.length > 0) {
      const userBonus = bonusData.find((b) => b.userId === userId);
      if (userBonus) {
        if (tournamentResults.champion && userBonus.champion === tournamentResults.champion) {
          zdobyte_punkty += 10;
        }
        if (
          tournamentResults.topScorer &&
          userBonus.topScorer &&
          userBonus.topScorer.trim().toLowerCase() ===
            tournamentResults.topScorer.trim().toLowerCase()
        ) {
          zdobyte_punkty += 10;
        }
      }
    }

    return {
      userId,
      zdobyte_punkty,
      trafione_wyniki,
      dokladnie_trafione_wyniki,
      bets_placed,
    };
  });

  // Sortuj malejąco po punktach, przy remisie - więcej dokładnych wyników wyżej
  results.sort((a, b) => {
    if (b.zdobyte_punkty !== a.zdobyte_punkty) return b.zdobyte_punkty - a.zdobyte_punkty;
    return b.dokladnie_trafione_wyniki - a.dokladnie_trafione_wyniki;
  });

  return results;
}