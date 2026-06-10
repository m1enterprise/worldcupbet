import React, { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMatches } from "../lib/api";
import { loadBets, loadBonusBets, saveBonusBets, getSession, logout } from "../lib/auth";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Trophy, Table2, Star, BarChart3, Save, LogOut, Target, LoaderPinwheel, Users } from "lucide-react";
import { toast } from "sonner";

const PHASE_NAMES = {
  group: "Faza grupowa", round_of_32: "1/16 finału", round_of_16: "1/8 finału",
  quarter_final: "Ćwierćfinał", semi_final: "Półfinał", third_place: "Mecz o 3. miejsce", final: "Finał",
};

function calculateMatchPoints(bet, result) {
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
    { path: "/points", icon: BarChart3, label: "Punkty" },
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
          <p className="text-xs text-secondary-foreground/60 font-medium">World Cup 2026 v1.2</p>
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

// import myBets from "../lib/my_bets.json";
// import wcData from "../lib/wc_data.json";
import { getMatches } from "../services/matchService";
import { getBets, getBetsByUserId } from "../services/betService";

export default function MyBets() {
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => { if (!session) navigate("/login"); }, []);

  const [matches, setMatches] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const [bonusBets, setBonusBets] = useState(() => loadBonusBets());
  const bets = useMemo(() => loadBets(), []);

  useEffect(() => {
    // 2. get full match data for match.id === bet.id
    const fetchData = async () => {
      // BETS BY USER ID
      const bet_data = await getBetsByUserId(session?.id);
      if (!bet_data) return console.log('No user_bet data found');
      console.log('bet_data: ', bet_data);

      // ALL MATCHES
      const data = await getMatches();
      if (!data) return console.log('No match data found');
      const matchesFullBet = data.filter((match) => bet_data.some((bet) => bet.id === match.id));

      setUserBets(bet_data);
      setMatches(matchesFullBet);

      // console.log(matchesFullBet)
      // console.log(bet_data);
      console.log(122, bet_data?.length === 0 ? '0' : '>')
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
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="font-display text-base font-bold">Bonusy (+10 pkt każdy)</h2>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Mistrz Świata</label>
                <select value={bonusBets.champion || ""} onChange={(e) => handleBonusChange("champion", e.target.value)}
                  className="w-full h-11 rounded-xl border border-border bg-background text-sm px-3 focus:outline-none focus:border-primary">
                  <option value="">Wybierz drużynę...</option>
                  {/* {teamOptions?.map((t) => (
                    <option key={t.code} value={t.code}>{t.flag} {t.name}</option>
                  ))} */}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Król strzelców</label>
                <input value={bonusBets.topScorer || ""} onChange={(e) => handleBonusChange("topScorer", e.target.value)}
                  placeholder="Imię i nazwisko..."
                  className="w-full h-11 rounded-xl border border-border bg-background text-sm px-3 focus:outline-none focus:border-primary" />
              </div>
              {/* <button onClick={saveBonuses} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                <Save className="w-4 h-4" />Zapisz bonusy
              </button> */}
            </div>
          </div>

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
              
              const isFinished = match.status === "finished";
              let pointsInfo = null;
              // if (isFinished) {
              //   pointsInfo = calculateMatchPoints(match, {
              //     homeScore: match.homeScore,
              //     awayScore: match.awayScore,
              //     extraTimeWinner: match.extraTimeWinner,
              //     phase: match.phase,
              //   });
              // }

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
                    {isFinished && pointsInfo && (
                      <div
                        className={`text-[10px] font-bold ${
                          pointsInfo.points > 0
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-50 text-red-500 border-red-200"
                        }`}
                      >
                        {pointsInfo.points > 0 ? "+" : ""}
                        {pointsInfo.points} pkt
                      </div>
                    )}
                    {!isFinished && (
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
                      {match.homeScore || '?'} : {match.awayScore || '?'}
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
