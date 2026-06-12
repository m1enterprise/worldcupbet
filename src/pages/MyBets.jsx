import React, { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMatches } from "../lib/api";
import { loadBets, loadBonusBets, saveBonusBets, getSession, logout } from "../lib/auth";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Trophy, Table2, Star, BarChart3, Save, LogOut, Target, LoaderPinwheel, Users, Search } from "lucide-react";
import { toast } from "sonner";
import { TEAMS, TOP_SCORERS } from "../lib/matchData";

const PHASE_NAMES = {
  group: "Faza grupowa", round_of_32: "1/16 finału", round_of_16: "1/8 finału",
  quarter_final: "Ćwierćfinał", semi_final: "Półfinał", third_place: "Mecz o 3. miejsce", final: "Finał",
};

function calculateMatchPoints(bet, result) {

  console.log("BET=", bet)
  console.log("SCO=", result)

  if (bet.homeScore === null || bet.awayScore === null || result.homeScore === null || result.awayScore === null)
    return { points: 0, reason: "Brak danych" };
  const bH = parseInt(bet.homeScore), bA = parseInt(bet.awayScore);
  const rH = parseInt(result.homeScore), rA = parseInt(result.awayScore);
  const exact = bH === rH && bA === rA;
  const betOut = bH > bA ? "home" : bA > bH ? "away" : "draw";
  const actOut = rH > rA ? "home" : rA > rH ? "away" : "draw";
  if (result.phase === "group") {
    if (exact) return { points: 5, reason: "Dokładny wynik" };
    if (betOut === actOut) return { points: 3, reason: "Trafiony rezultat" };
    return { points: 0, reason: "Nietrafiony" };
  }
  const betExt = bet.extraTimeWinner || null, actExt = result.extraTimeWinner || null;
  if (exact && !actExt) return { points: 5, reason: "Dokładny wynik (90 min)" };
  if (exact && betOut === "draw" && actOut === "draw" && betExt && actExt && betExt === actExt)
    return { points: 7, reason: "Dokładny remis + zwycięzca" };
  if (!exact && betOut === actOut && !actExt) return { points: 3, reason: "Trafiony rezultat" };
  if (!exact && betOut === "draw" && actOut === "draw" && betExt && actExt && betExt === actExt)
    return { points: 5, reason: "Trafiony remis + zwycięzca" };
  return { points: 0, reason: "Nietrafiony" };
}

function BottomNav() {
  const location = useLocation();
  const items = [
    { path: "/", icon: LoaderPinwheel, label: "Mecze" },
    { path: "/standings", icon: Table2, label: "Tabele" },
    { path: "/my-bets", icon: Star, label: "Moje typy" },
    // { path: "/points", icon: BarChart3, label: "Punkty" },
    { path: "/ranking", icon: Users, label: "Ranking" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="max-w-2xl mx-auto flex">
        {items.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Header({ username }) {
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login"); };
  return (
    <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold leading-tight">Essa Bet</h1>
          <p className="text-xs text-secondary-foreground/60 font-medium">World Cup 2026</p>
        </div>
        {username && (
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-secondary-foreground/60 hover:text-secondary-foreground transition-colors">
            <span>{username}</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
}

// Searchable dropdown list picker
function SearchablePicker({ options, value, onChange, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  console.log(94, options)

  // const filtered = useMemo(() => {
  //   if (!query) return options;
  //   return options.filter((o) =>
  //     o?.name.toLowerCase().includes(query.toLowerCase())
  //   );
  // }, [options, query]);

  const filtered = options
  .map((player) => {
    const name = player.name.toLowerCase();
    const q = query.toLowerCase().trim();

    let score = 0;

    // Exact match
    if (name === q) score += 100;

    // Starts with query
    if (name.startsWith(q)) score += 50;

    // Any word starts with query
    if (name.split(" ").some((word) => word.startsWith(q))) score += 30;

    // Contains query
    if (name.includes(q)) score += 20;

    return { player, score };
  })
  .filter((x) => x.score > 0)
  .sort((a, b) => b.score - a.score)
  .map((x) => x.player);

  const selected = options.find((o) => o?.name === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
        className="w-full h-11 rounded-xl border border-border bg-background text-sm px-3 text-left flex items-center justify-between focus:outline-none focus:border-primary transition-colors"
      >
        {selected ? (
          <span className="font-medium">{selected?.name}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <span className="text-muted-foreground text-xs">▼</span>
      </button>

      {open && (
        // <div className="absolute z-50 left-0 right-0 top-12 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
        //   <div className="p-2 border-b border-border">
        //     <div className="relative">
        //       <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        //       <input
        //         autoFocus
        //         value={query}
        //         onChange={(e) => setQuery(e.target.value)}
        //         placeholder="Szukaj..."
        //         className="w-full pl-8 pr-3 h-8 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
        //       />
        //     </div>
        //   </div>
        //   <div className="absolute max-h-56 overflow-y-auto">
        //     {options.length === 0 ? (
        //       <p className="text-xs text-muted-foreground text-center py-4">Brak wyników</p>
        //     ) : (
        //       options.map((o) => (
        //         <button
        //           key={o.id}
        //           type="button"
        //           onClick={() => { onChange(o.name); setOpen(false); setQuery(""); }}
        //           className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${o?.name === value ? "bg-primary/10 text-primary font-semibold" : ""}`}
        //         >
        //           {o?.name}
        //         </button>
        //       ))
        //     )}
        //   </div>
        // </div>

        <div className="relative">
  {/* Search input */}
  <div className="relative">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
    <input
      autoFocus
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Szukaj..."
      className="w-full pl-8 pr-3 h-8 rounded-lg bg-background border border-border text-sm"
    />
  </div>

  {/* Dropdown */}
  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
    {filtered.length === 0 ? (
      <p className="text-xs text-muted-foreground text-center py-4">
        Brak wyników
      </p>
    ) : (
      filtered.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => {
            onChange(o.name);
            setOpen(false);
            setQuery("");
          }}
          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${
            o.name === value
              ? "bg-primary/10 text-primary font-semibold"
              : ""
          }`}
        >
          {o.name}
        </button>
      ))
    )}
  </div>
</div>
      )}
    </div>
  );
}

// import myBets from "../lib/my_bets.json";
// import wcData from "../lib/wc_data.json";
import { getMatches } from "../services/matchService";
import { getBets, getBetsByUserId, getBonusBetByUserId, pushBonusBet } from "../services/betService";
// import worldCupData from "../lib/players.json"

import playersData from "../lib/playersData.json"
import teamsData from "../lib/teamsData.json"
import { calcMatchPoints } from "../services/calcPointsService";

export default function MyBets() {
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => { if (!session) navigate("/login"); }, []);

  const [matches, setMatches] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const [bonusBets, setBonusBets] = useState({});
  const bets = useMemo(() => loadBets(), []);
  const [fetchedBonusData, setFetchedBonusData] = useState([])
  const [matchesFullBet, setMatchesFullBet] = useState([])

  // const [footballPlayers, setFootballPlayers] = useState([worldCupData.teams]) // footballPlayers.map(item)=>{item.squad}
  // const [footballTeams, setFootballTeams] = useState([worldCupData.teams])

  // const [footballPlayers, setFootballPlayers] = useState([])
  useEffect(()=>{
    console.log(1, playersData)
    console.log(2, teamsData)
  },[])

    // Teams list sorted alphabetically
  const teamOptions = useMemo(() => {
    return Object.values(TEAMS)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({ value: t.code, label: `${t.flag} ${t.name}` }));
  }, []);

  // Players list sorted by team flag + name
  const playerOptions = useMemo(() => {
    return TOP_SCORERS
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => {
        const team = TEAMS[p.team];
        return { value: p.name, label: `${team?.flag ?? ""} ${p.name} (${team?.name ?? p.team})` };
      });
  }, []);

  const handleBonusChange = (key, value) => setBonusBets((prev) => ({ ...prev, [key]: value }));

  const saveBonuses = async () => {
    const bonusData = {
      "bonusUserId": session.id,
      "bonusChampion": bonusBets.champion,
      "bonusScorer": bonusBets.topScorer,
      "bonusAssister": bonusBets.topAssister
    }

        console.log(192, bonusData)
    const data = await pushBonusBet(session.id, bonusData)
    if (!data) return toast.error("Bonus nie zostal dodany / zmieniony.")
    toast.success("Bonusy zapisane!");
  };

  useEffect(() => {
    const fetchData = async () => {
      // BETS BY USER ID
      const bet_data = await getBetsByUserId(session?.id);
      if (!bet_data) return console.log('No user_bet data found');

      // ALL MATCHES
      const data = await getMatches();
      if (!data) return console.log('No match data found');
      // edit match UTC time
        function utcToPolandIso(utcString) {
          const date = new Date(utcString);
          const parts = new Intl.DateTimeFormat('sv-SE', {
            timeZone: 'Europe/Warsaw',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).formatToParts(date);

          const get = type => parts.find(p => p.type === type).value;
          return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`;
        }
        
        data.map(match=>{
            const match_t = utcToPolandIso(match.utcDate)
            console.log(match.matchId, match_t)
            match.utcDate = match_t
        })

        const sorted = [...data].sort(
          (a, b) => new Date(a.utcDate) - new Date(b.utcDate)
        );
        
        setMatches(sorted || []);
        const matchesFullBetData = data.filter((match) => bet_data.some((bet) => String(bet.matchId) === String(match.id)));

      // BONUS BET BY USER ID
      const bonus_arr = await getBonusBetByUserId(session?.id)
      const bonus_data = bonus_arr[0]
      if (!bonus_data) return console.log('No user_bet data found');

      console.log(1, bet_data[0])
      console.log(2, data[0])

      // CALC USER POINTS
      // const userBetPoints = calcMatchPoints(bet_data[0], data[0])
      // console.log("CALC_BET_SCR: ", userBetPoints)

      setBonusBets({
        champion: bonus_data.bonusChampion,
        topScorer: bonus_data.bonusScorer,
        topAssister: bonus_data.bonusAssister
      })
      setUserBets(bet_data);
      // setMatches(data);
      setFetchedBonusData(bonus_data)
      setMatchesFullBet(matchesFullBetData)
    };
    fetchData();
  }, []);

  // const betEntries = useMemo(() => {
  //   return Object.entries(bets)
  //     .map(([matchId, bet]) => {
  //       const match = matches.find((m) => m.id === parseInt(matchId));
  //       if (!match) return null;
  //       return { matchId: parseInt(matchId), bet, match };
  //     })
  //     ?.filter(Boolean)
  //     ?.sort((a, b) => a.match?.date?.localeCompare(b.match.date));
  // }, [bets, matches]);

  // const teamOptions = useMemo(() => {
  //   const seen = new Set();
  //   return matches
  //     .filter((m) => m.homeTeam !== "TBD")
  //     .flatMap((m) => [
  //       { code: m.homeTeam, name: m.homeName, flag: m.homeFlag },
  //       { code: m.awayTeam, name: m.awayName, flag: m.awayFlag },
  //     ])
  //     .filter((t) => { if (seen.has(t.code)) return false; seen.add(t.code); return true; })
  //     .sort((a, b) => a?.name?.localeCompare(b.name));
  // }, [matches]);

  // const handleBonusChange = (key, value) => setBonusBets((prev) => ({ ...prev, [key]: value }));

  // const saveBonuses = () => {
  //   saveBonusBets(bonusBets);
  //   toast.success("Bonusy zapisane!");
  // };

  // if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header username={session?.username} />
      <main className="flex-1 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
          {/* Bonus bets */}

          {/* Bet history */}
          <div>
            <h2 className="font-display text-base font-bold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Postawione typy ({userBets?.length})
            </h2>

            {/* {userBets?.length === 0 && (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <p className="text-muted-foreground text-sm">Nie postawiłeś jeszcze żadnych typów.</p>
                <p className="text-muted-foreground text-xs mt-1">Przejdź do zakładki „Mecze" aby obstawiać.</p>
              </div>
            )} */}

            {/* {userBets.length > 0 && (
              <div className="space-y-4">
                {userBets.map((bet) => (
                  <div id={bet.id} className={`bg-card rounded-2xl border border-border overflow-hidden transition-all ${bet.status === 'finished' ? "opacity-80" : "shadow-sm hover:shadow-md"}`}>

                  <div key={bet.matchId} className="px-4 py-3 flex items-center gap-3">
                  
                    <div className="flex-1 flex items-center gap-2.5 min-w-0">
                      <div className="w-12 h-8">
                        <img className="w-full h-full object-cover rounded-[4px]"
                          src={bet.homeTeam.crest}/>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{bet.homeTeam.name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{bet.homeTeam.tla}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <span className="text-lg font-bold">{bet.homeScore}</span>
                      </div>
                      <span className="text-muted-foreground font-bold">:</span>
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <span className="text-lg font-bold">{bet.awayScore}</span>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">
                      <div className="min-w-0 text-right">
                        <p className="text-sm font-bold truncate">{bet.awayTeam.name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{bet.awayTeam.tla}</p>
                      </div>                    
                      <div className="w-12 h-8">
                        <img className="w-full h-full object-cover rounded-[4px]"
                          src={bet.awayTeam.crest}/>
                      </div>
                    </div>

                  </div>

                  </div>
                ))}
              </div>
            )} */}

    <div className="bg-card rounded-2xl border border-border p-3 text-center mb-1.5">
            <p className="text-muted-foreground text-sm">
              BONUS BET
            </p>
            <label className="tracking-wide mb-1.5 block text-start text-[11px] font-medium">
                  <span className="text-muted-foreground uppercase">🏆 Mistrz Świata: </span>
                  <span className="text-xs font-semibold flex-1 truncate">{fetchedBonusData?.bonusChampion}</span>
            </label>
            <label className="tracking-wide mb-1.5 block text-start text-[11px] font-medium">
                  <span className="text-muted-foreground uppercase">👟 Król Strzelców: </span>
                  <span className="text-xs font-semibold flex-1 truncate">{fetchedBonusData?.bonusScorer}</span>
            </label>
            <label className="tracking-wide mb-1.5 block text-start text-[11px] font-medium">
                  <span className="text-muted-foreground uppercase">👟 Król Asyst: </span> 
                  <span className="text-xs font-semibold flex-1 truncate">{fetchedBonusData?.bonusAssister}</span>
            </label>
      </div>

    {userBets.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nie postawiłeś jeszcze żadnych typów.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Przejdź do zakładki „Mecze" aby obstawiać.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {userBets.map((match) => {
              
              const isFinished = match.status === "FINISHED";
              let pointsInfo = null;
              // if (isFinished) {
              //   pointsInfo = calculateMatchPoints(match, {
              //     homeScore: matchBet?.score?.fullTime?.home,
              //     awayScore: matchBet?.score?.fullTime?.away,
              //     extraTimeWinner: matchBet?.score?.extraTimeWinner,
              //     phase: matchBet?.phase,
              //   });
              // }

              console.log("matches full bet", matchesFullBet)

              // filter matchesFullBet for this matchId
              const matchBetData = matchesFullBet?.filter((item)=>String(item?.id) === String(match?.matchId))?.[0]
              const userBetInfo = calcMatchPoints(match, matchBetData)
              console.log("CALC_BET_SCR: ", userBetInfo)
              return (
                <div
                  key={match.id}
                  className="bg-card rounded-xl border border-border p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {format(parseISO(match.matchUtcDate), "d MMM", { locale: pl })} •{" "}
                      {match.group
                        ? `Gr. ${match.group.slice(-1)}`
                        : PHASE_NAMES[match.phase]}
                    </span>
                    {userBetInfo && matchBetData?.status === "FINISHED" && (
                      <>
                      <div className="text-[12px] font-bold text-center">
                        {matchBetData?.score?.fullTime.home}:{matchBetData?.score?.fullTime.away}
                      </div>
                      <div
                        className={`text-[12px] font-bold ${
                          userBetInfo.points > 0
                            ? "text-green-700"
                            : "text-red-500"
                        }`}
                      >
                        {userBetInfo.points} pkt
                      </div>
                      </>
                    )}
                    {!(matchBetData?.status === "FINISHED") && (
                      <div variant="secondary" className="text-[10px]">
                        Oczekuje
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">

                    <div className="w-12 h-8">
                        <img className="w-full h-full object-cover rounded-[4px]"
                          src={match.homeTeam.crest}/>
                    </div>
                    <span className="text-xs font-semibold flex-1 truncate">
                      {match.homeTeam.name}
                    </span>
                    <span className="text-sm font-bold bg-muted rounded-lg px-2.5 py-1">
                      {match.homeScore} : {match.awayScore}
                    </span>
                    <span className="text-xs font-semibold flex-1 truncate text-right">
                      {match.awayTeam.name}
                    </span>
                    <div className="w-12 h-8">
                        <img className="w-full h-full object-cover rounded-[4px]"
                          src={match.awayTeam.crest}/>
                    </div>
                    
                    
                  </div>

                  {match.extraTimeWinner && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                      Wygra po dogrywce:{" "}
                      <span className="font-bold">
                        {match.extraTimeWinner === "home"
                          ? match.homeTeam.name
                          : match.awayTeam.name}
                      </span>
                    </p>
                  )}

                  {/* {isFinished && pointsInfo && (
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">
                      Wynik: {bet.score}:{match.awayScore} • {pointsInfo.reason}
                    </p>
                  )} */}
                </div>
              );
            })}
          </div>
        )}

          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
