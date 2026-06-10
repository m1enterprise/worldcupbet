// World Cup 2026 match data
// Groups: 12 groups (A-L), 3 teams each, 48 teams total

export const TEAMS = {
  MEX: { name: "Meksyk", code: "MEX", flag: "🇲🇽", group: "A" },
  RSA: { name: "RPA", code: "RSA", flag: "🇿🇦", group: "A" },
  KOR: { name: "Korea Płd.", code: "KOR", flag: "🇰🇷", group: "A" },
  CZE: { name: "Czechy", code: "CZE", flag: "🇨🇿", group: "A" },
  CAN: { name: "Kanada", code: "CAN", flag: "🇨🇦", group: "B" },
  BIH: { name: "Bośnia", code: "BIH", flag: "🇧🇦", group: "B" },
  USA: { name: "USA", code: "USA", flag: "🇺🇸", group: "B" },
  PAR: { name: "Paragwaj", code: "PAR", flag: "🇵🇾", group: "B" },
  QAT: { name: "Katar", code: "QAT", flag: "🇶🇦", group: "C" },
  SUI: { name: "Szwajcaria", code: "SUI", flag: "🇨🇭", group: "C" },
  BRA: { name: "Brazylia", code: "BRA", flag: "🇧🇷", group: "C" },
  MAR: { name: "Maroko", code: "MAR", flag: "🇲🇦", group: "C" },
  HAI: { name: "Haiti", code: "HAI", flag: "🇭🇹", group: "D" },
  SCO: { name: "Szkocja", code: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "D" },
  AUS: { name: "Australia", code: "AUS", flag: "🇦🇺", group: "D" },
  TUR: { name: "Turcja", code: "TUR", flag: "🇹🇷", group: "D" },
  GER: { name: "Niemcy", code: "GER", flag: "🇩🇪", group: "E" },
  CUW: { name: "Curaçao", code: "CUW", flag: "🇨🇼", group: "E" },
  NED: { name: "Holandia", code: "NED", flag: "🇳🇱", group: "E" },
  JPN: { name: "Japonia", code: "JPN", flag: "🇯🇵", group: "E" },
  ARG: { name: "Argentyna", code: "ARG", flag: "🇦🇷", group: "F" },
  EGY: { name: "Egipt", code: "EGY", flag: "🇪🇬", group: "F" },
  FRA: { name: "Francja", code: "FRA", flag: "🇫🇷", group: "F" },
  COL: { name: "Kolumbia", code: "COL", flag: "🇨🇴", group: "F" },
  SEN: { name: "Senegal", code: "SEN", flag: "🇸🇳", group: "G" },
  ITA: { name: "Włochy", code: "ITA", flag: "🇮🇹", group: "G" },
  ECU: { name: "Ekwador", code: "ECU", flag: "🇪🇨", group: "G" },
  ESP: { name: "Hiszpania", code: "ESP", flag: "🇪🇸", group: "G" },
  NGA: { name: "Nigeria", code: "NGA", flag: "🇳🇬", group: "H" },
  ENG: { name: "Anglia", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "H" },
  URU: { name: "Urugwaj", code: "URU", flag: "🇺🇾", group: "H" },
  POR: { name: "Portugalia", code: "POR", flag: "🇵🇹", group: "H" },
  ALB: { name: "Albania", code: "ALB", flag: "🇦🇱", group: "I" },
  BEL: { name: "Belgia", code: "BEL", flag: "🇧🇪", group: "I" },
  PAN: { name: "Panama", code: "PAN", flag: "🇵🇦", group: "I" },
  DEN: { name: "Dania", code: "DEN", flag: "🇩🇰", group: "I" },
  IRN: { name: "Iran", code: "IRN", flag: "🇮🇷", group: "J" },
  WAL: { name: "Walia", code: "WAL", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", group: "J" },
  CRC: { name: "Kostaryka", code: "CRC", flag: "🇨🇷", group: "J" },
  SRB: { name: "Serbia", code: "SRB", flag: "🇷🇸", group: "J" },
  CRO: { name: "Chorwacja", code: "CRO", flag: "🇭🇷", group: "K" },
  CMR: { name: "Kamerun", code: "CMR", flag: "🇨🇲", group: "K" },
  NZL: { name: "Nowa Zelandia", code: "NZL", flag: "🇳🇿", group: "K" },
  POL: { name: "Polska", code: "POL", flag: "🇵🇱", group: "K" },
  SAU: { name: "Arabia Saudyjska", code: "SAU", flag: "🇸🇦", group: "L" },
  PER: { name: "Peru", code: "PER", flag: "🇵🇪", group: "L" },
  CHL: { name: "Chile", code: "CHL", flag: "🇨🇱", group: "L" },
  AUT: { name: "Austria", code: "AUT", flag: "🇦🇹", group: "L" },
};

// Match phases
export const PHASES = {
  GROUP: "group",
  ROUND_OF_32: "round_of_32",
  ROUND_OF_16: "round_of_16",
  QUARTER: "quarter_final",
  SEMI: "semi_final",
  THIRD: "third_place",
  FINAL: "final",
};

// Generate group stage matches
// Each group has 4 teams, 6 matches per group
const groupMatchups = {};
const groups = {};

Object.values(TEAMS).forEach((team) => {
  if (!groups[team.group]) groups[team.group] = [];
  groups[team.group].push(team.code);
});

let matchId = 1;
const allMatches = [];

// Group stage dates mapping (spread across tournament days)
const groupDates = {
  A: ["2026-06-11", "2026-06-12", "2026-06-16", "2026-06-17", "2026-06-21", "2026-06-22"],
  B: ["2026-06-12", "2026-06-13", "2026-06-17", "2026-06-18", "2026-06-22", "2026-06-23"],
  C: ["2026-06-13", "2026-06-14", "2026-06-18", "2026-06-19", "2026-06-23", "2026-06-24"],
  D: ["2026-06-14", "2026-06-14", "2026-06-19", "2026-06-19", "2026-06-24", "2026-06-24"],
  E: ["2026-06-14", "2026-06-14", "2026-06-19", "2026-06-20", "2026-06-24", "2026-06-25"],
  F: ["2026-06-15", "2026-06-15", "2026-06-20", "2026-06-20", "2026-06-25", "2026-06-25"],
  G: ["2026-06-15", "2026-06-16", "2026-06-20", "2026-06-21", "2026-06-25", "2026-06-26"],
  H: ["2026-06-16", "2026-06-16", "2026-06-21", "2026-06-21", "2026-06-26", "2026-06-26"],
  I: ["2026-06-15", "2026-06-16", "2026-06-20", "2026-06-21", "2026-06-25", "2026-06-26"],
  J: ["2026-06-17", "2026-06-17", "2026-06-22", "2026-06-22", "2026-06-27", "2026-06-27"],
  K: ["2026-06-17", "2026-06-18", "2026-06-22", "2026-06-23", "2026-06-27", "2026-06-28"],
  L: ["2026-06-18", "2026-06-18", "2026-06-23", "2026-06-23", "2026-06-28", "2026-06-28"],
};

const groupTimes = ["18:00", "21:00", "15:00", "18:00", "21:00", "21:00"];

Object.entries(groups).forEach(([groupName, teams]) => {
  const dates = groupDates[groupName];
  let mi = 0;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      allMatches.push({
        id: matchId++,
        homeTeam: teams[i],
        awayTeam: teams[j],
        date: dates[mi] || dates[0],
        time: groupTimes[mi] || "21:00",
        group: groupName,
        phase: PHASES.GROUP,
        homeScore: null,
        awayScore: null,
        status: "scheduled",
      });
      mi++;
    }
  }
});

// Knockout stage placeholder matches
const knockoutDates = {
  round_of_32: [
    "2026-06-29", "2026-06-29", "2026-06-29", "2026-06-29",
    "2026-06-30", "2026-06-30", "2026-06-30", "2026-06-30",
    "2026-07-01", "2026-07-01", "2026-07-01", "2026-07-01",
    "2026-07-02", "2026-07-02", "2026-07-02", "2026-07-02",
  ],
  round_of_16: [
    "2026-07-05", "2026-07-05", "2026-07-06", "2026-07-06",
    "2026-07-07", "2026-07-07", "2026-07-08", "2026-07-08",
  ],
  quarter_final: [
    "2026-07-11", "2026-07-11", "2026-07-12", "2026-07-12",
  ],
  semi_final: ["2026-07-15", "2026-07-16"],
  third_place: ["2026-07-19"],
  final: ["2026-07-19"],
};

Object.entries(knockoutDates).forEach(([phase, dates]) => {
  dates.forEach((date, idx) => {
    allMatches.push({
      id: matchId++,
      homeTeam: "TBD",
      awayTeam: "TBD",
      date,
      time: idx % 2 === 0 ? "18:00" : "21:00",
      group: null,
      phase,
      homeScore: null,
      awayScore: null,
      extraTimeWinner: null,
      status: "scheduled",
    });
  });
});

export const MATCHES = allMatches;

// Get unique match dates
export function getMatchDates() {
  const dates = [...new Set(MATCHES.map((m) => m.date))].sort();
  return dates;
}

// Get matches for a specific date
export function getMatchesByDate(date) {
  return MATCHES.filter((m) => m.date === date);
}

// Phase display names in Polish
export const PHASE_NAMES = {
  [PHASES.GROUP]: "Faza grupowa",
  [PHASES.ROUND_OF_32]: "1/16 finału",
  [PHASES.ROUND_OF_16]: "1/8 finału",
  [PHASES.QUARTER]: "Ćwierćfinał",
  [PHASES.SEMI]: "Półfinał",
  [PHASES.THIRD]: "Mecz o 3. miejsce",
  [PHASES.FINAL]: "Finał",
};

export const TOP_SCORERS = [
  { name: "Kylian Mbappé", team: "FRA" },
  { name: "Lamine Yamal", team: "ESP" },
  { name: "Lionel Messi", team: "ARG" },
  { name: "Harry Kane", team: "ENG" },
  { name: "Vinícius Jr.", team: "BRA" },
  { name: "Erling Haaland", team: "NED" },
  { name: "Lautaro Martínez", team: "ARG" },
  { name: "Bukayo Saka", team: "ENG" },
  { name: "Pedri", team: "ESP" },
  { name: "Rodri", team: "ESP" },
  { name: "Álvaro Morata", team: "ESP" },
  { name: "Marcus Rashford", team: "ENG" },
  { name: "Jude Bellingham", team: "ENG" },
  { name: "Phil Foden", team: "ENG" },
  { name: "Neymar Jr.", team: "BRA" },
  { name: "Raphinha", team: "BRA" },
  { name: "Richarlison", team: "BRA" },
  { name: "Julián Álvarez", team: "ARG" },
  { name: "Ángel Di María", team: "ARG" },
  { name: "Ousmane Dembélé", team: "FRA" },
  { name: "Antoine Griezmann", team: "FRA" },
  { name: "Olivier Giroud", team: "FRA" },
  { name: "Jamal Musiala", team: "GER" },
  { name: "Kai Havertz", team: "GER" },
  { name: "Thomas Müller", team: "GER" },
  { name: "Leroy Sané", team: "GER" },
  { name: "Cody Gakpo", team: "NED" },
  { name: "Memphis Depay", team: "NED" },
  { name: "Virgil van Dijk", team: "NED" },
  { name: "Romelu Lukaku", team: "BEL" },
  { name: "Kevin De Bruyne", team: "BEL" },
  { name: "Dries Mertens", team: "BEL" },
  { name: "Cristiano Ronaldo", team: "POR" },
  { name: "Bruno Fernandes", team: "POR" },
  { name: "Bernardo Silva", team: "POR" },
  { name: "Rafael Leão", team: "POR" },
  { name: "Luka Modrić", team: "CRO" },
  { name: "Ivan Perišić", team: "CRO" },
  { name: "Andrej Kramarić", team: "CRO" },
  { name: "Nicolo Barella", team: "ITA" },
  { name: "Federico Chiesa", team: "ITA" },
  { name: "Ciro Immobile", team: "ITA" },
  { name: "Victor Osimhen", team: "NGA" },
  { name: "Sadio Mané", team: "SEN" },
  { name: "Mohamed Salah", team: "EGY" },
  { name: "Son Heung-min", team: "KOR" },
  { name: "Hiroki Sakai", team: "JPN" },
  { name: "Takumi Minamino", team: "JPN" },
  { name: "Lorenzo Insigne", team: "ITA" },
  { name: "Granit Xhaka", team: "SUI" },
  { name: "Xherdan Shaqiri", team: "SUI" },
  { name: "Hakim Ziyech", team: "MAR" },
  { name: "Achraf Hakimi", team: "MAR" },
  { name: "Youssef En-Nesyri", team: "MAR" },
  { name: "Darwin Núñez", team: "URU" },
  { name: "Luis Suárez", team: "URU" },
  { name: "Alexis Sánchez", team: "CHL" },
  { name: "Ben White", team: "ENG" },
  { name: "Joško Gvardiol", team: "CRO" },
  { name: "Nico Williams", team: "ESP" },
  { name: "Ferran Torres", team: "ESP" },
];