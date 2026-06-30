import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMatches } from "../lib/api";
import { loadBets, saveBetsForDay, getSession, logout } from "../lib/auth";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { pl } from "date-fns/locale";
import { Trophy, Table2, Star, BarChart3, Save, CheckCircle2, RefreshCw, LogOut, LoaderPinwheel, Users} from "lucide-react";
import { toast } from "sonner";

// ─── Scoring Engine ───────────────────────────────────────────────────────────
function calculateMatchPoints(bet, result) {
  if (bet.homeScore === null || bet.awayScore === null || result.homeScore === null || result.awayScore === null)
    return { points: 0, reason: "Brak danych" };

  const bH = parseInt(bet.homeScore), bA = parseInt(bet.awayScore);
  const rH = parseInt(result.homeScore), rA = parseInt(result.awayScore);
  const exact = bH === rH && bA === rA;
  const betOut = bH > bA ? "home" : bA > bH ? "away" : "draw";
  const actOut = rH > rA ? "home" : rA > rH ? "away" : "draw";
  const isGroup = result.phase === "group";

  if (isGroup) {
    if (exact) return { points: 5, reason: "Dokładny wynik" };
    if (betOut === actOut) return { points: 3, reason: "Trafiony rezultat" };
    return { points: 0, reason: "Nietrafiony" };
  }
  const betExt = bet.extraTimeWinner || null;
  const actExt = result.extraTimeWinner || null;
  if (exact && !actExt) return { points: 5, reason: "Dokładny wynik (90 min)" };
  if (exact && betOut === "draw" && actOut === "draw" && betExt && actExt && betExt === actExt)
    return { points: 7, reason: "Dokładny remis + trafiony zwycięzca" };
  if (!exact && betOut === actOut && !actExt) return { points: 3, reason: "Trafiony rezultat" };
  if (!exact && betOut === "draw" && actOut === "draw" && betExt && actExt && betExt === actExt)
    return { points: 5, reason: "Trafiony remis + zwycięzca" };
  return { points: 0, reason: "Nietrafiony" };
}

// ─── PHASE NAMES ─────────────────────────────────────────────────────────────
const PHASE_NAMES = {
  group: "Faza grupowa",
  LAST_32: "1/16 finału",
  LAST_16: "1/8 finału",
  quarter_final: "Ćwierćfinał",
  semi_final: "Półfinał",
  third_place: "Mecz o 3. miejsce",
  final: "Finał",
};

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav() {
  const location = useLocation();
  const items = [
    { path: "/", icon: LoaderPinwheel, label: "Mecze" },
    { path: "/standings", icon: Table2, label: "Tabele" },
    { path: "/my-bets", icon: Star, label: "Bety" },
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

// ─── Header ───────────────────────────────────────────────────────────────────
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

// ─── Day Selector ─────────────────────────────────────────────────────────────
function DaySelector({ dates, selectedDate, onSelect }) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const c = scrollRef.current;
      const el = activeRef.current;
      c.scrollTo({ left: el.offsetLeft - c.offsetWidth / 2 + el.offsetWidth / 2, behavior: "smooth" });
    }
  }, [selectedDate]);

  const getLabel = (dateStr) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Dziś";
    if (isTomorrow(d)) return "Jutro";
    return format(d, "EEE", { locale: pl });
  };

  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto px-4 py-3 -mx-4" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
      {dates.map((dateStr) => {
        const active = dateStr === selectedDate;
        return (
          <button key={dateStr} ref={active ? activeRef : null} onClick={() => onSelect(dateStr)}
            className={`shrink-0 flex flex-col items-center px-3.5 py-2 rounded-xl transition-all ${active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-card border border-border text-foreground hover:bg-muted"}`}>
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{getLabel(dateStr)}</span>
            <span className="text-base font-bold leading-tight">{format(parseISO(dateStr), "d")}</span>
            <span className="text-[10px] font-medium opacity-60">{format(parseISO(dateStr), "MMM", { locale: pl })}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ match, bet, fetchedBetData, onChange, disabled }) {
  const isKnockout = match.stage !== "GROUP_STAGE";
  const isFinished = match.status === "FINISHED";

  const now = new Date();
  const ctf = new Date(match.utcDate);
  ctf.setHours(ctf.getHours() - 2);

  const iso = new Date().toISOString();

  // np. "2026-06-14T18:42:15.123Z"
  // if (now > ctf) {
  //   return null
  // }
  const canBet = now < ctf

  const bH = bet?.homeScore ?? "";
  const bA = bet?.awayScore ?? "";
  const bET = bet?.extraTimeWinner ?? "";
  const isBetDraw = bH !== "" && bA !== "" && parseInt(bH) === parseInt(bA);

  const fetchedBet = fetchedBetData?.find((bet) => String(bet?.matchId) === String(match?.id))

  const wentToET =
    match.score.duration === "EXTRA_TIME" || match.score.duration === "PENALTY_SHOOTOUT";

  if (wentToET) {
    const regular_score = match.score.regularTime
    match.score.fullTime = match.score.regularTime

    console.log("RS", regular_score)
  }

  // const [etWinner, setEtWinner] = useState(null)
  const handleScore = (side, value) => {
    const val = value === "" ? "" : Math.max(0, parseInt(value) || 0);
    onChange(match, { homeScore: side === "home" ? val : bH, awayScore: side === "away" ? val : bA, extraTimeWinner: side === "etWinner" ? value : bET });
  };

  // const handleExt = (value) => {
  //   onChange(match.id, { ...bet, homeScore: bH, awayScore: bA, extraTimeWinner: value })
  //   console.log("handle", value)
  // };

  // let pointsInfo = null;
  // if (isFinished && bet && bet.homeScore !== "" && bet.homeScore !== undefined) {
  //   pointsInfo = calculateMatchPoints(bet, { homeScore: match.homeScore, awayScore: match.awayScore, extraTimeWinner: match.extraTimeWinner, phase: match.phase });
  // }

  // bet, match
  const pointsInfo = calcMatchPoints(fetchedBet, match)

  // const match_t = `${Number(match.utcDate.slice(-9, -7))+2}${String(match.utcDate.slice(-7, -4))}`
  // const match_t = `${String((Number(match.utcDate.slice(-9, -7)) + 2) % 24).padStart(2, '0')}${match.utcDate.slice(-7, -4)}`;
  const match_t = match.utcDate

  // console.log(match)
  console.log(match.stage)

  return (
    <div className={`relative bg-card rounded-2xl border border-border overflow-hidden transition-all ${isFinished ? "opacity-70" : "shadow-sm hover:shadow-md"}`}>
      <div className="flex items-center justify-between px-4 pt-3 grid grid-cols-3">
        <div className="flex items-start gap-2 text-muted-foreground"> 
          {match.group && <span className="text-[10px] font-medium rounded-full">{match.group.slice(-1)}</span>}
          {isKnockout && <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">{PHASE_NAMES[match.stage]}</span>}     
        </div>

         {match?.status !== "TIMED" && match?.status !== "FINISHED" ? (
                    <div className="flex justify-center">
                    <span className="text-[10px] text-center font-bold px-2 py-0.5 bg-red-500 text-white rounded-full animate-pulse">
                        MECZ TRWA
                      </span>
                    </div>
                  ):<div></div>}  

        <div className="text-right">
          <span className="text-[11px] text-muted-foreground font-medium text-right">
            {
              match_t.slice(-9,-4)
            }
          </span>
        </div>
      </div>

      <div className="px-4 py-3 flex items-center gap-3">
        
         {
            !useIsMobile() && (
              <div className="flex-1 flex items-center gap-2.5 justify-start min-w-0">
                <div className="w-12 h-8">
                  <img   className="w-full h-full object-cover rounded-[4px]"
                    src={match.homeTeam.crest}/>
                </div>

                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">{match.homeTeam.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{match.homeTeam.tla}</p>
                </div>                    
              </div>
            )
          }

          {
            useIsMobile() && (
              <div className="flex-1 flex items-center gap-2.5 justify-start min-w-0"> 
                <div className="w-12 h-8">
                  <img className="w-full h-full object-cover rounded-[4px]"
                    src={match.homeTeam.crest}/>
                </div>

                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">{match.homeTeam.tla}</p>
                  {/* <p className="text-[10px] text-muted-foreground font-medium">{match.homeTeam.tla}</p> */}
                </div> 
              </div>
            )
          }

          {
          // fetchedBet && (
          // <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
          //     <span className="text-[11px] text-muted-foreground font-medium">BET</span>
          //     <span className="text-[11px] text-muted-foreground font-medium">{fetchedBet.homeScore} : {fetchedBet.awayScore}</span>
          // </div>
          // )
          }

        <div className="flex items-center gap-1.5 shrink-0">
          {match?.status !== "TIMED" ? (
            <div className="flex items-center gap-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold">{match?.score?.fullTime?.home}</span>
              </div>
              <span className="text-muted-foreground font-bold">:</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold">{match?.score?.fullTime?.away}</span>
              </div>
            </div>

          ) : (
            <>
            {canBet && (
              <div className="flex items-center gap-1">
              <input type="number" min="0" max="20" value={bH} onChange={(e) => handleScore("home", e.target.value)} disabled={disabled}
                className="w-11 h-11 text-center text-lg font-bold rounded-xl border-2 border-border focus:border-primary bg-background focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="-" />
              <span className="text-muted-foreground font-bold text-lg">:</span>
              <input type="number" min="0" max="20" value={bA} onChange={(e) => handleScore("away", e.target.value)} disabled={disabled}
                className="w-11 h-11 text-center text-lg font-bold rounded-xl border-2 border-border focus:border-primary bg-background focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="-" />
            </div>
            )}
            </>
          )}
          
        </div>

          {
            !useIsMobile() && (
              <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">
                <div className="min-w-0 text-right">
                  <p className="text-sm font-bold">{match.awayTeam.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{match.awayTeam.tla}</p>
                </div>                    
                <div className="w-12 h-8">
                  <img   className="w-full h-full object-cover rounded-[4px]"
                    src={match.awayTeam.crest}/>
                </div>
              </div>
            )
          }

          {
            useIsMobile() && (
              <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">                   
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">{match.awayTeam.tla}</p>
                </div> 
                <div className="w-12 h-8">
                  <img   className="w-full h-full object-cover rounded-[4px]"
                    src={match.awayTeam.crest}/>
                </div>
              </div>
            )
          }
      </div> 

      {isKnockout && isBetDraw && !isFinished && !disabled && (
        <div className="px-4 pb-3">
          <div className="bg-muted/60 rounded-xl p-3">
            <p className="text-[11px] text-muted-foreground font-medium mb-2">Remis — kto wygra po dogrywce/karnych?</p>
            <select value={bET} onChange={(e) => {
              handleScore("etWinner", e.target.value)
              // setEtWinner(e.target.value)
            }}
              className="w-full h-9 rounded-xl border border-border bg-background text-sm px-3 focus:outline-none focus:border-primary">
              <option value="">Wybierz zwycięzcę...</option>
              <option value="home">{match?.homeTeam?.name}</option>
              <option value="away">{match?.awayTeam?.name}</option>
            </select>
          </div>
        </div>
      )}

      {
      // isFinished && bet && (
      //   <div className="px-4 pb-3">
      //     <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs flex items-center justify-between">
      //       <span><span className="text-muted-foreground">Twój typ: </span><span className="font-bold">{bet.homeScore} : {bet.awayScore}</span></span>
      //       {pointsInfo && <span className="text-muted-foreground">{pointsInfo.reason}</span>}
      //     </div>
      //   </div>
      // )
      }

      {(
        <div className="px-4 pb-3">
          <div className={`grid grid-cols-3 w-full mb-2 bg-muted/50 rounded-lg px-3 py-2 text-xs flex items-center justify-between bg-gradient-to-r from-white/10 via-white/10 ${
                !isFinished
                  ? "to-gray-100"
                  : pointsInfo?.points >= 5
                  ? "to-yellow-100"
                  : pointsInfo?.points > 0
                  ? "to-green-100"
                  : "to-red-100"
              }`}>
              <span className="">BET</span>

            <span className="text-muted-foreground text-center">
                <span className={`${fetchedBet?.extraTimeWinner === "home" ? "text-green-900 font-bold underline" : ""}`}>{fetchedBet?.homeTeam?.tla}{" "}</span>
                <span className="font-bold text-secondary">
                  {fetchedBet?.homeScore}
                  {" : "}
                  {fetchedBet?.awayScore}
                </span>{" "}
                <span className={`${fetchedBet?.extraTimeWinner === "away" ? "text-green-900 font-bold underline" : ""}`}>{fetchedBet?.awayTeam?.tla}{" "}</span>
              </span>

            {pointsInfo && isFinished ?
              <span className="text-right">
                <span className="font-bold">{pointsInfo?.points}</span> 
                <span className=""> PKT</span>
              </span>
              :
              <div className="text-right text-muted-foreground">OCZEKUJE</div>
            }
            
          </div>
        </div>
      )}
    </div>
  );
}

import wcData from "../lib/wc_data.json"
import { getMatches } from "../services/matchService";
// import { pushBet } from "../services/betService";
import { getUserBets, saveBet } from "../services/betServiceMod";
import { getBetsByUserId } from "../services/betService";
import { useIsMobile } from "../hooks/use-mobile";
import { calcMatchPoints } from "../services/calcPointsService";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Matches() {
  const navigate = useNavigate();
  const session = getSession();
  
  useEffect(() => {
    
    if (!session) navigate("/login");

  }, []);

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [dayBets, setDayBets] = useState([]);
  const [fetchedBetData, setFetchedBetData] = useState([])

  useEffect(() => {    
    const fetchData = async () => {
      try {
        setLoading(true);

        const data = await getMatches();

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
            match.utcDate = match_t
        })

        const sorted = [...data].sort(
          (a, b) => new Date(a.utcDate) - new Date(b.utcDate)
        );
        
        setMatches(sorted || []);

        const betData = await getBetsByUserId(session.id)
        setFetchedBetData(betData || [])


        console.log()
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // setLoading(false);
  }, []);

  const dates = useMemo(() => {
    const d = [...new Set(matches?.map((m) => m.utcDate?.slice(0, 10)))].sort();

    return d;
  }, [matches]);

  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (dates.length && !selectedDate) {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(dates.includes(today) ? today : dates[0]);
    }
  }, [dates]);

  const dayMatches = useMemo(() => matches?.filter((m) => m.utcDate?.slice(0, 10) === selectedDate), [matches, selectedDate]);
  // useEffect(() => {
  //   if (!selectedDate) return;
  //   const currentBets = loadBets();
  //   const obj = {};
  //   dayMatches?.forEach((m) => { if (currentBets[m.id]) obj[m.id] = currentBets[m.id]; });
  //   setDayBets(obj);
  //   setSaved(false);
  // }, [selectedDate, matches]);

  const handleDateChange = useCallback((date) => { setSelectedDate(date); setSaved(false); }, []);

  const handleBetChange = useCallback((match, bet) => {
    const betObject = {
      matchId: match.id,
      matchUtcDate: match.utcDate,
      matchStatus: match.status,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: bet.homeScore,
      awayScore: bet.awayScore,
      extraTimeWinner: bet.extraTimeWinner ?? "",
    };

    setDayBets((prev) => {
      const existingIndex = prev.findIndex(
        (b) => b.matchId === match.id
      );

      if (existingIndex >= 0) {
        return prev.map((b) =>
          b.matchId === match.id ? betObject : b
        );
      }

      return [...prev, betObject];
    });

    setSaved(false);
  }, []);

  const handleSave = async () => {

    console.log(0, "saving bets: ", dayBets)

    const updated = saveBetsForDay(dayBets);
    const arr = Object.values(updated);
    for (const bet of arr) {
      const betRe = await saveBet(session.id, bet);
      if (!betRe) {
        setDayBets([])
        toast.error("Nie mozna obstawic meczu ktory sie rozpoczal, pozdro.");
        throw new Error("Nie mozna obstawic meczu ktory sie rozpoczal, pozdro.");
      }
    }
    
    setSaved(true);
    toast.success("Typy zapisane!");
    setTimeout(() => setSaved(false), 2000);
    };

  // const hasBets = Object.keys(dayBets).some((id) => dayBets[id]?.homeScore !== "" && dayBets[id]?.homeScore !== undefined);
  const hasBets = dayBets.some(
  (bet) => bet.homeScore != null && bet.homeScore !== ""
);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header username={session?.username} />
      <main className="flex-1 pb-24">
        <div className="max-w-2xl mx-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Ładowanie meczy...</p>
            </div>
          )}

          {error && (
            <div className="mx-4 mt-4 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-center">
              <p className="text-sm font-bold text-destructive mb-1">Błąd ładowania danych</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">Sprawdź klucz API football-data.org w zmiennej <code className="bg-muted px-1 rounded">VITE_FOOTBALL_DATA_API_KEY</code></p>
            </div>
          )}

          {!loading && !error && dates.length > 0 && (
            <>
              <div className="px-4">
                <DaySelector dates={dates} selectedDate={selectedDate} onSelect={handleDateChange} />
              </div>

              <div className="px-4 pt-2 pb-3">
                <p className="text-xs text-muted-foreground font-medium">
                  {dayMatches?.length} {dayMatches?.length === 1 ? "mecz" : dayMatches?.length < 5 ? "mecze" : "meczy"} w tym dniu
                </p>
              </div>

              <div className="px-4 space-y-3">
                {dayMatches?.map((match) => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    bet={dayBets?.find((bet) => bet?.matchId === match?.id)} 
                    fetchedBetData={fetchedBetData} 
                    onChange={handleBetChange} 
                    disabled={match.status === "finished"} 
                  />
                ))}
              </div>

              {dayMatches?.length > 0 && (
                <div className="px-4 pt-6 pb-4">
                  <button onClick={handleSave} disabled={!hasBets}
                    className={`w-full h-14 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${saved ? "bg-green-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                    {saved ? <><CheckCircle2 className="w-5 h-5" />Zapisano!</> : <><Save className="w-5 h-5" />Zapisz typy</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
