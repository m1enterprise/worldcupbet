import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getSession, logout } from "../lib/auth";
// import { fetchMatches } from "@/lib/api";
import { calcMatchPoints, calcPointsForAllUsers } from "../services/calcPointsService";
import { Trophy, Table2, Star, BarChart3, Medal, RefreshCw, LogOut, Users, LoaderPinwheel } from "lucide-react";
import { getBets } from "../services/betService";
import { getUsers } from "../services/userService";
import { getMatches } from "../services/matchService";

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

const MEDAL_COLORS = ["text-yellow-400", "text-slate-400", "text-amber-600"];
const MEDAL_BG = ["bg-yellow-400/10", "bg-slate-400/10", "bg-amber-600/10"];

export default function Ranking() {
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => { if (!session) navigate("/login"); }, []);

  const [allBets, setAllBets] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allUsersBetCalc, setAllUsersBetCalc] = useState([]);
  const [userRank, setUserRank] = useState(null)

  useEffect(() => {
    // try{
    //   // Pobierz WSZYSTKIE bety (wszystkich userów) - admin może widzieć wszystkie
    //    const bets = await getBets()
    //   // Pobierz listę userów (do mapowania userId → username)
    //     setAllBets(bets);
    //     setAllUsers(users);
    //     setMatches(apiMatches);

    //   // Pobierz mecze z API
    //   fetchMatches(),
    // } catch(() => {})
      
    // finally(() => setLoading(false));

    const fetchData = async () => {
          try {
            setLoading(true);
            
            // Pobierz WSZYSTKIE bety (wszystkich userów) - admin może widzieć wszystkie
            const bets = await getBets()
            
            // Pobierz listę userów (do mapowania userId → username)
            const users = await getUsers()
            
            // Pobierz mecze z API
            const matches = await getMatches()

            const usersBetCalcData = []
            // Calc punkty dla each usera
            users.map(user=>{
              // users bets filter
              const userBets = bets.filter(bet=>String(bet.userId) === String(user.id))
              
              // object per user
              const userObject = {
                userId: user.id,
                userUsername: user.username,
                userPoints: 0,
                userPointsCorrect: 0,
                userPointsExact: 0,
                userBets: [],
              }

              userBets.map(bet=>{
                const matchBetData = matches?.filter((item)=>String(item?.id) === String(bet?.matchId))?.[0]
                if (matchBetData.status !== "FINISHED") return
                const userBetInfo = calcMatchPoints(bet, matchBetData)
                userObject.userBets.push(userBetInfo)
              })

              // calc all points
              let calc = 0
              // calc all isCorrect
              let calcCorrect = 0
              // calc all isExact
              let calcExact = 0
              userObject.userBets.map(bet=>{
                calc = calc + bet.points
                bet.isCorrect ? calcCorrect=calcCorrect+1 : null
                bet.isExact ? calcExact=calcExact+1 : null
              })
              userObject.userPoints=calc
              userObject.userPointsCorrect=calcCorrect
              userObject.userPointsExact=calcExact

              // console.log(userObject)

              usersBetCalcData.push(userObject)
            })

            // sort by pkt
            // const usersBetCalcDataSort = usersBetCalcData.sort(item=>item.points)
            const usersBetCalcDataSort = [...usersBetCalcData].sort(
              (a, b) => b.userPoints - a.userPoints
            );

            usersBetCalcDataSort.map((user, index)=>{
              if (user.userId === session.id){
                setUserRank(index+1)
                return
              }
            })

            setAllBets(bets);
            setAllUsers(users);
            setMatches(matches);
            setAllUsersBetCalc(usersBetCalcDataSort);
          } catch (err) {
            console.log(err.message);
          } finally {
            setLoading(false);
          }
        };
    
        fetchData();
  }, []);

  // Konwertuj mecze z formatu lokalnego API do formatu football-data.org
  // (calcPointsForAllUsers oczekuje: id, status, stage, score.fullTime.home/away, score.duration, score.winner)
  const normalizedMatches = useMemo(() => {
    return matches.map((m) => ({
      id: String(m.id),
      status: m.status === "finished" ? "FINISHED" : m.status?.toUpperCase() ?? "SCHEDULED",
      stage: m.phase === "group" ? "GROUP_STAGE" :
             m.phase === "round_of_32" ? "ROUND_OF_32" :
             m.phase === "round_of_16" ? "ROUND_OF_16" :
             m.phase === "quarter_final" ? "QUARTER_FINALS" :
             m.phase === "semi_final" ? "SEMI_FINALS" :
             m.phase === "third_place" ? "THIRD_PLACE" :
             m.phase === "final" ? "FINAL" : "GROUP_STAGE",
      score: {
        winner: m.homeScore != null && m.awayScore != null
          ? m.homeScore > m.awayScore ? "HOME_TEAM"
            : m.awayScore > m.homeScore ? "AWAY_TEAM"
            : m.extraTimeWinner === "home" ? "HOME_TEAM"
            : m.extraTimeWinner === "away" ? "AWAY_TEAM"
            : "DRAW"
          : null,
        duration: m.extraTimeWinner ? "EXTRA_TIME" : "REGULAR",
        fullTime: {
          home: m.homeScore,
          away: m.awayScore,
        },
      },
    }));
  }, [matches]);

  // Oblicz ranking przy użyciu calc_points_service
  const ranking = useMemo(() => {
    if (!allBets.length || !normalizedMatches.length) return [];

    const calcResults = calcPointsForAllUsers(allBets, normalizedMatches);

    // Mapuj userId → username
    const userMap = {};
    allUsers.forEach((u) => { userMap[u.id] = u.username || u.email || u.id; });

    return calcResults.map((entry) => ({
      ...entry,
      username: userMap[entry.userId] || entry.userId,
      isMe: entry.userId === session?.userId,
    }));
  }, [allBets, normalizedMatches, allUsers, session]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header username={session?.username} />
      <main className="flex-1 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Hero */}
          <div className="bg-gradient-to-br from-secondary to-secondary/80 rounded-3xl p-5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,175,55,0.08),transparent_70%)]" />
            <div className="relative flex items-center justify-between">
              <div className="text-left">
                <p className="text-secondary-foreground/60 text-xs font-semibold uppercase tracking-wider">Miejsce</p>
                <p className="text-4xl font-display font-black text-secondary-foreground text-center">
                  {userRank ? userRank : ''}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                <Trophy className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="text-right">
                <p className="text-secondary-foreground/60 text-xs font-semibold uppercase tracking-wider">Graczy</p>
                <p className="text-4xl font-display font-black text-secondary-foreground text-center">{ranking.length}</p>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-secondary flex items-center gap-2">
              <Medal className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-secondary-foreground">Tabela klasyfikacji</h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Ładowanie rankingu...</p>
              </div>
            ) : ranking.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground px-4">
                <p className="font-semibold mb-1">Brak danych</p>
                <p className="text-xs">Żaden gracz nie postawił jeszcze żadnych typów na zakończone mecze.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Header row */}
                <div className="grid grid-cols-[32px_1fr_52px_52px_52px] gap-1 px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>#</span>
                  <span>Gracz</span>
                  <span className="text-center">Pkt</span>
                  <span className="text-center">Trafne</span>
                  <span className="text-center">Dokł.</span>
                </div>
                {allUsersBetCalc.map((player, idx) => {
                  const accuracy = player.bets_placed > 0
                    ? Math.round((player.trafione_wyniki / player.bets_placed) * 100)
                    : 0;
                  return (
                    <div key={player.userId}
                      className={`grid grid-cols-[32px_1fr_52px_52px_52px] gap-1 px-4 py-3 items-center transition-colors
                        ${player.isMe ? "bg-primary/5 border-l-2 border-primary" : ""}
                        ${idx < 3 ? MEDAL_BG[idx] : ""}
                      `}>
                      <div className="flex items-center justify-center">
                        {idx < 3 ? (
                          <Medal className={`w-4 h-4 ${MEDAL_COLORS[idx]}`} />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${player.isMe ? "text-primary" : ""}`}>
                          {player.userUsername}
                          {player.isMe && <span className="ml-1.5 text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Ty</span>}
                        </p>
                        {/* <p className="text-[10px] text-muted-foreground">{accuracy}% trafność</p> */}
                      </div>
                      <span className={`text-base font-bold text-center ${idx === 0 ? "text-green-600" : idx === 1 ? "text-green-600" : idx === 2 ? "text-green-600" : "text-green-600"}`}>
                        {player.userPoints}
                      </span>
                      <span className="text-sm text-center text-green-600 font-bold">{player.userPointsCorrect}</span>
                      <span className="text-sm text-center text-primary font-bold">{player.userPointsExact}</span>
                    </div>
                  );
                })};
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Legenda punktacji</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2"><span className="w-8 text-center font-bold text-green-600">2</span><span className="text-muted-foreground">Trafiony zwycięzca ET</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-center font-bold text-green-600">5</span><span className="text-muted-foreground">Dokładny wynik (gr.)</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-center font-bold text-green-600">3</span><span className="text-muted-foreground">Trafiony zwycięzca</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-center font-bold text-green-600">7</span><span className="text-muted-foreground">Remis + dogrywka (dokł.)</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-center font-bold text-green-600">5</span><span className="text-muted-foreground">Remis + dogrywka</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-center font-bold text-green-600">10</span><span className="text-muted-foreground">Bonus (mistrz / król)</span></div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}