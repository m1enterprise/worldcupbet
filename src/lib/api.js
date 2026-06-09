// football-data.org API integration for WC 2026

// const API_KEY = import.meta.env.FOOTBALL_DATA_API_KEY || "";
const API_KEY='8e954446587c48b59cc3a3520654cea6'
const BASE = "https://api.football-data.org/v4";

const PHASE_MAP = {
  "GROUP_STAGE": "group",
  "LAST_32": "round_of_32",
  "ROUND_OF_16": "round_of_16",
  "QUARTER_FINALS": "quarter_final",
  "SEMI_FINALS": "semi_final",
  "THIRD_PLACE": "third_place",
  "FINAL": "final",
};

const FLAG_MAP = {
  MEX: "🇲🇽", RSA: "🇿🇦", KOR: "🇰🇷", CZE: "🇨🇿",
  CAN: "🇨🇦", BIH: "🇧🇦", USA: "🇺🇸", PAR: "🇵🇾",
  QAT: "🇶🇦", SUI: "🇨🇭", BRA: "🇧🇷", MAR: "🇲🇦",
  HAI: "🇭🇹", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", AUS: "🇦🇺", TUR: "🇹🇷",
  GER: "🇩🇪", CUW: "🇨🇼", NED: "🇳🇱", JPN: "🇯🇵",
  ARG: "🇦🇷", EGY: "🇪🇬", FRA: "🇫🇷", COL: "🇨🇴",
  SEN: "🇸🇳", ITA: "🇮🇹", ECU: "🇪🇨", ESP: "🇪🇸",
  NGA: "🇳🇬", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", URU: "🇺🇾", POR: "🇵🇹",
  ALB: "🇦🇱", BEL: "🇧🇪", PAN: "🇵🇦", DEN: "🇩🇰",
  IRN: "🇮🇷", WAL: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", CRC: "🇨🇷", SRB: "🇷🇸",
  CRO: "🇭🇷", CMR: "🇨🇲", NZL: "🇳🇿", POL: "🇵🇱",
  SAU: "🇸🇦", PER: "🇵🇪", CHL: "🇨🇱", AUT: "🇦🇹",
  TBD: "❓",
};

function getFlag(tla) {
  return FLAG_MAP[tla] || "❓";
}

function mapMatch(m) {
  const date = m.utcDate ? m.utcDate.split("T")[0] : "2026-06-11";
  const time = m.utcDate ? m.utcDate.split("T")[1].substring(0, 5) : "21:00";
  const status = m.status === "FINISHED" ? "finished"
    : m.status === "IN_PLAY" || m.status === "PAUSED" ? "live"
    : "scheduled";
  const homeCode = m.homeTeam?.tla || "TBD";
  const awayCode = m.awayTeam?.tla || "TBD";
  const phase = PHASE_MAP[m.stage] || "group";
  const group = m.group ? m.group.replace("GROUP_", "") : null;

  return {
    id: m.id,
    homeTeam: homeCode,
    awayTeam: awayCode,
    homeName: m.homeTeam?.name || homeCode,
    awayName: m.awayTeam?.name || awayCode,
    homeFlag: getFlag(homeCode),
    awayFlag: getFlag(awayCode),
    date,
    time,
    group,
    phase,
    homeScore: m.score?.fullTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? null,
    extraTimeWinner: m.score?.extraTime?.home != null
      ? (m.score.extraTime.home > m.score.extraTime.away ? "home" : "away")
      : (m.score?.penalties?.home != null
        ? (m.score.penalties.home > m.score.penalties.away ? "home" : "away")
        : null),
    status,
  };
}

async function apiFetch(path) {
  const headers = {};
  if (API_KEY) headers["X-Auth-Token"] = API_KEY;
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`API error ${res.status}: sprawdź klucz API football-data.org`);
  return res.json();
}

export async function fetchTeams() {
  fetch("http://localhost:3000/api/pl/matches")
    .then(res => res.json())
    .then(data => {
      console.log(data);
    });

  return (data.matches || []).map(mapMatch);
}

export async function fetchMatches() {
  const matches = await fetch("http://localhost:3000/api/wc/matches")
  const data = await matches.json();
  console.log(data);
  return (data.matches || []);
}

export async function fetchStandings() {
  const data = await apiFetch("/competitions/WC/standings?season=2026");
  return data.standings || [];
}

export async function fetchScorers() {
  const data = await apiFetch("/competitions/WC/scorers?season=2026&limit=20");
  return (data.scorers || []).map(s => ({
    name: s.player?.name || "Unknown",
    team: s.team?.tla || "???",
    teamName: s.team?.name || "???",
    teamFlag: getFlag(s.team?.tla),
    goals: s.goals || 0,
    assists: s.assists || 0,
  }));
}
