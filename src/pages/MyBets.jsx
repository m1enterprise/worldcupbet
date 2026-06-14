import React, { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMatches } from "../lib/api";
import { loadBets, loadBonusBets, saveBonusBets, getSession, logout } from "../lib/auth";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Trophy, Table2, Star, BarChart3, Save, LogOut, Target, LoaderPinwheel, Users, Search } from "lucide-react";
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

function MatchCard({ match, fetchedBetData}) {
  const isKnockout = match?.stage !== "GROUP_STAGE";
  const isFinished = match?.status === "FINISHED";

  // const fetchedBet = fetchedBetData?.find((bet) => String(bet?.matchId) === String(match?.id))
  const fetchedBet = fetchedBetData
  const pointsInfo = calcMatchPoints(fetchedBetData, match)

  // let pointsInfo = null;
  // if (isFinished && fetchedBet && fetchedBet.homeScore !== "" && fetchedBet.homeScore !== undefined) {
  //   pointsInfo = calcMatchPoints(fetchedBet, { homeScore: match.score.fullTime.homeScore, awayScore: match.score.fullTime.awayScore, extraTimeWinner: match.score.fullTime?.extraTimeWinner, phase: match.phase });
  // }
  // const match_t = `${Number(match.utcDate.slice(-9, -7))+2}${String(match.utcDate.slice(-7, -4))}`
  // const match_t = `${String((Number(match.utcDate.slice(-9, -7)) + 2) % 24).padStart(2, '0')}${match.utcDate.slice(-7, -4)}`;
  const match_t = match.utcDate

  // console.log("POINTS", pointsInfo)
  // console.log("MATCH_T", match_t)
  // console.log("MATCH", match.id)
  // console.log("FETCHED_BET", fetchedBet)

  return (
    <div className={`relative bg-card rounded-2xl border border-border overflow-hidden transition-all ${isFinished ? "opacity-70" : "shadow-sm hover:shadow-md"}`}>
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-start gap-2 text-muted-foreground"> 
          {match.group && <span className="text-[10px] font-medium rounded-full">{match.group.slice(-1)}</span>}
          {isKnockout && <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">{PHASE_NAMES[match.phase]}</span>}
          {match.status === "live" && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500 text-white rounded-full animate-pulse">NA ŻYWO</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-medium">
            {
              match_t?.slice(-9,-4)
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
                    src={match?.homeTeam?.crest}/>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">{match?.homeTeam?.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{match?.homeTeam?.tla}</p>
                </div>                    
              </div>
            )
          }
          {
            useIsMobile() && (
              <div className="flex-1 flex items-center gap-2.5 justify-start min-w-0"> 
                <div className="w-12 h-8">
                  <img   className="w-full h-full object-cover rounded-[4px]"
                    src={match?.homeTeam?.crest}/>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">{match?.homeTeam?.tla}</p>
                </div> 
              </div>
            )
          }

          {
          // fetchedBet && (
          // <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
          //     <span className="text-[11px] text-muted-foreground font-medium">BET</span>
          //     <span className="text-[11px] text-muted-foreground font-medium">{fetchedBet?.homeScore} : {fetchedBet?.awayScore}</span>
          // </div>
          // )
          }

          <div className="flex items-center gap-1.5 shrink-0">
            {isFinished && (
              <div className="flex items-center gap-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold">{match?.score?.fullTime?.home}</span>
                </div>
                <span className="text-muted-foreground font-bold">:</span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold">{match?.score?.fullTime?.away}</span>
                </div>
              </div>
            )}
          </div>

          {
            !useIsMobile() && (
              <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">
                <div className="min-w-0 text-right">
                  <p className="text-sm font-bold">{match?.awayTeam?.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{match?.awayTeam?.tla}</p>
                </div>                    
                <div className="w-12 h-8">
                  <img   className="w-full h-full object-cover rounded-[4px]"
                    src={match?.awayTeam?.crest}/>
                </div>
              </div>
            )
          }
          {
            useIsMobile() && (
              <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">                   
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">{match?.awayTeam?.tla}</p>
                </div> 
                <div className="w-12 h-8">
                  <img   className="w-full h-full object-cover rounded-[4px]"
                    src={match?.awayTeam?.crest}/>
                </div>
              </div>
            )
          }
      </div> 

      {(
        <div className="px-4 pb-3">
          <div className={`bg-muted/50 rounded-lg px-3 py-2 text-xs flex items-center justify-between bg-gradient-to-r from-white/10 via-white/10 ${
            !isFinished
              ? 'to-gray-100'
              : pointsInfo?.points > 0
                ? 'to-green-100'
                : 'to-red-100'
            }`}>
            <span>
              <span className="text-muted-foreground">BET </span>
              <span className="font-bold">{fetchedBet?.homeScore} : {fetchedBet?.awayScore}</span>
            </span>
            
            {pointsInfo && isFinished ?
              <span>
                <span className="font-bold">{pointsInfo?.points}</span> 
                <span className=""> PKT</span>
              </span>
              :
              <div className="text-muted-foreground">OCZEKUJE</div>
            }
            
          </div>
        </div>
      )}
    </div>
  );
}

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

import { getMatches } from "../services/matchService";
import { getBets, getBetsByUserId, getBonusBetByUserId, pushBonusBet } from "../services/betService";

import playersData from "../lib/playersData.json"
import teamsData from "../lib/teamsData.json"
import { calcMatchPoints } from "../services/calcPointsService";
import { useIsMobile } from "../hooks/use-mobile";
import { getUsers } from "../services/userService";
import { getScorers } from "../services/scorersService";

export default function MyBets() {
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => { if (!session) navigate("/login"); }, []);

  const [matches, setMatches] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const [bonusBets, setBonusBets] = useState({});
  const bets = useMemo(() => loadBets(), []);
  const [allUsersBet, setAllUsersBet] = useState([])
  const [fetchedBonusData, setFetchedBonusData] = useState([])
  const [matchesFullBet, setMatchesFullBet] = useState([])
  const [currentMatch, setCurrentMatch] = useState([])

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
            match.utcDate = match_t
        })

        const sorted = [...data].sort(
          (a, b) => new Date(a.utcDate) - new Date(b.utcDate)
        );
        
        setMatches(sorted || []);
        const matchesFullBetData = data.filter((match) => bet_data.some((bet) => String(bet.matchId) === String(match.id)));

        // SET CURRENT MATCH
        const currentMatchSort = sorted?.filter(match=>match.status !== "FINISHED")?.[0];
        console.log("CURRENT", currentMatchSort)

        // const matchDateTime = new Date(currentMatchSort.utcDate);
        // const currentMatch
        const now = new Date();
        const ctf = new Date(currentMatchSort.utcDate)
        ctf.setHours(ctf.getHours() - 2);
        const isStarted = now > ctf

        currentMatchSort.isStarted = isStarted
        setCurrentMatch(currentMatchSort)

        // ALL USERS BET FOR THE CURRENT MATCH
        const all_bets = await getBets()
        const all_bets_sort = all_bets.filter(bet=> String(bet.matchId) === String(currentMatchSort.id))

        const all_users = await getUsers()
        all_bets_sort.map(bet=>{
          const getUser = all_users.filter(user=>String(user.id) === String(bet.userId))?.[0]
          bet.username = getUser?.username
        })
        setAllUsersBet(all_bets_sort)

      // BONUS BET BY USER ID
      const bonus_arr = await getBonusBetByUserId(session?.id)
      const bonus_data = bonus_arr[0]
      if (!bonus_data) return console.log('No user_bet data found');

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header username={session?.username} />
      <main className="flex-1 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
    
          {/* Bet history */}
          <div>
            <h2 className="font-display text-base font-bold mb-3 flex items-center gap-2">
              <LoaderPinwheel className="w-5 h-5 text-primary"/>
              Najblizszy mecz
            </h2> 

            <div className={`relative bg-card rounded-2xl border border-border overflow-hidden transition-all shadow-sm hover:shadow-md mb-3`}>
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-start gap-2 text-muted-foreground"> 
          {currentMatch.group && <span className="text-[10px] font-medium rounded-full">{currentMatch.group.slice(-1)}</span>}
          {/* {isKnockout && <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">{PHASE_NAMES[currentMatch.phase]}</span>} */}
          {currentMatch.status === "live" && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500 text-white rounded-full animate-pulse">NA ŻYWO</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-medium">
            {
              // currentMatch_t?.slice(-9,-4)
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
                    src={currentMatch?.homeTeam?.crest}/>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">{currentMatch?.homeTeam?.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{currentMatch?.homeTeam?.tla}</p>
                </div>                    
              </div>
            )
          }
          {
            useIsMobile() && (
              <div className="flex-1 flex items-center gap-2.5 justify-start min-w-0"> 
                <div className="w-12 h-8">
                  <img   className="w-full h-full object-cover rounded-[4px]"
                    src={currentMatch?.homeTeam?.crest}/>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">{currentMatch?.homeTeam?.tla}</p>
                </div> 
              </div>
            )
          }

          {
          // fetchedBet && (
          // <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
          //     <span className="text-[11px] text-muted-foreground font-medium">BET</span>
          //     <span className="text-[11px] text-muted-foreground font-medium">{fetchedBet?.homeScore} : {fetchedBet?.awayScore}</span>
          // </div>
          // )
          }

          {!currentMatch?.isStarted && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">vs</span>
              </div>
            </div>
          )}

          {currentMatch?.isStarted && 
            (
              <div className="flex items-center gap-1.5 shrink-0">
              
              <div className="flex items-center gap-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold">{currentMatch?.score?.fullTime?.home || 0}</span>
                </div>
                <span className="text-muted-foreground font-bold">:</span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold">{currentMatch?.score?.fullTime?.away || 0}</span>
                </div>
              </div>
            
              </div>
          )}

          {
            !useIsMobile() && (
              <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">
                <div className="min-w-0 text-right">
                  <p className="text-sm font-bold">{currentMatch?.awayTeam?.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{currentMatch?.awayTeam?.tla}</p>
                </div>                    
                <div className="w-12 h-8">
                  <img   className="w-full h-full object-cover rounded-[4px]"
                    src={currentMatch?.awayTeam?.crest}/>
                </div>
              </div>
            )
          }
          {
            useIsMobile() && (
              <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">                   
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold">{currentMatch?.awayTeam?.tla}</p>
                </div> 
                <div className="w-12 h-8">
                  <img   className="w-full h-full object-cover rounded-[4px]"
                    src={currentMatch?.awayTeam?.crest}/>
                </div>
              </div>
            )
          }
      </div> 

      {!currentMatch?.isStarted && (
        <div className="px-4 pb-3">
          <div className={`bg-muted/50 rounded-lg px-3 py-2 text-center text-xs flex items-center justify-center bg-gradient-to-r from-white/10 via-white/10 ${'to-gray-100'}`}>  
                <span className="text-muted-foreground text-center">BETY INNYCH USERÓW BĘDĄ DOSTĘPNE PO ROZPOCZĘCIU MECZU</span>
          </div>
        </div>
      )}

      {currentMatch?.isStarted && (
        <div className="px-4 pb-3">
        {allUsersBet?.map(userBet=>(
          <div key={userBet.id} className={`mb-2 bg-muted/50 rounded-lg px-3 py-2 text-xs flex items-center justify-between bg-gradient-to-r from-white/10 via-white/10 ${'to-gray-100'}`}>
              <span className="text-muted-foreground">BET USERA {userBet?.username}</span>
              <span className="text-muted-foreground"> {userBet?.homeTeam?.tla} <span className="font-bold text-secondary">{userBet?.homeScore} : {userBet?.awayScore}</span> {userBet?.awayTeam?.tla}</span>
          </div>
        ))}
        </div>
      )}
    </div>

            <h2 className="font-display text-base font-bold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Twoje bety ({userBets?.length})
            </h2> 

            <div className="bg-card rounded-2xl border border-border p-3 text-center mb-3">
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

    {userBets.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nie postawiłeś jeszcze żadnych typów.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Przejdź do zakładki „Mecze" aby obstawiać.
            </p>
          </div>
        )} 
        
        {userBets?.length > 0 && (
          <div className="px-0 space-y-3">
            {userBets?.map(bet=>{
              // filter BET MATCH FULL INFO
              const betMatchFullInfo = matches.filter(match=> String(match.id) === String(bet.matchId))?.[0]

              // console.log(352, betMatchFullInfo)

              return (
                  <MatchCard
                    key={bet?.matchId} 

                    // BET MATCH FULL INFO
                    match={betMatchFullInfo}

                    // BET INFO
                    fetchedBetData={bet}

                    // BET CALC POINTS INFO
                    // betCalcPointsInfo={[]} 
                  />
              )
            })}
          </div>  
        )}

        { 
          //     const isFinished = match.status === "FINISHED";
          //     let pointsInfo = null;
          //     // if (isFinished) {
          //     //   pointsInfo = calculateMatchPoints(match, {
          //     //     homeScore: matchBet?.score?.fullTime?.home,
          //     //     awayScore: matchBet?.score?.fullTime?.away,
          //     //     extraTimeWinner: matchBet?.score?.extraTimeWinner,
          //     //     phase: matchBet?.phase,
          //     //   });
          //     // }

          //     console.log("matches full bet", matchesFullBet)

          //     // filter matchesFullBet for this matchId
          //     const matchBetData = matchesFullBet?.filter((item)=>String(item?.id) === String(match?.matchId))?.[0]
          //     const userBetInfo = calcMatchPoints(match, matchBetData)
          //     console.log("CALC_BET_SCR: ", userBetInfo)
          //     return (
          //       <div
          //         key={match.id}
          //         className="bg-card rounded-xl border border-border p-3"
          //       >
          //         <div className="flex items-center justify-between mb-1.5">
          //           <span className="text-[10px] text-muted-foreground font-medium">
          //             {format(parseISO(match.matchUtcDate), "d MMM", { locale: pl })} •{" "}
          //             {match.group
          //               ? `Gr. ${match.group.slice(-1)}`
          //               : PHASE_NAMES[match.phase]}
          //           </span>
          //           {userBetInfo && matchBetData?.status === "FINISHED" && (
          //             <>
          //             <div className="text-[12px] font-bold text-center">
          //               {matchBetData?.score?.fullTime.home}:{matchBetData?.score?.fullTime.away}
          //             </div>
          //             <div
          //               className={`text-[12px] font-bold ${
          //                 userBetInfo.points > 0
          //                   ? "text-green-700"
          //                   : "text-red-500"
          //               }`}
          //             >
          //               {userBetInfo.points} pkt
          //             </div>
          //             </>
          //           )}
          //           {!(matchBetData?.status === "FINISHED") && (
          //             <div variant="secondary" className="text-[10px]">
          //               Oczekuje
          //             </div>
          //           )}
          //         </div>
          //         <div className="flex items-center gap-2">

          //           <div className="w-12 h-8">
          //               <img className="w-full h-full object-cover rounded-[4px]"
          //                 src={match.homeTeam.crest}/>
          //           </div>
          //           <span className="text-xs font-semibold flex-1 truncate">
          //             {match.homeTeam.name}
          //           </span>
          //           <span className="text-sm font-bold bg-muted rounded-lg px-2.5 py-1">
          //             {match.homeScore} : {match.awayScore}
          //           </span>
          //           <span className="text-xs font-semibold flex-1 truncate text-right">
          //             {match.awayTeam.name}
          //           </span>
          //           <div className="w-12 h-8">
          //               <img className="w-full h-full object-cover rounded-[4px]"
          //                 src={match.awayTeam.crest}/>
          //           </div>
                    
                    
          //         </div>

          //         {match.extraTimeWinner && (
          //           <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          //             Wygra po dogrywce:{" "}
          //             <span className="font-bold">
          //               {match.extraTimeWinner === "home"
          //                 ? match.homeTeam.name
          //                 : match.awayTeam.name}
          //             </span>
          //           </p>
          //         )}

          //         {/* {isFinished && pointsInfo && (
          //           <p className="text-[10px] text-muted-foreground mt-1 text-center">
          //             Wynik: {bet.score}:{match.awayScore} • {pointsInfo.reason}
          //           </p>
          //         )} */}
          //       </div>
          //     );
          //   })}
          // </div>
        }
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
