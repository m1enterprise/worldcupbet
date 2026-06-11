import React, { useMemo, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// import { fetchMatches } from "../lib/api";
import { loadBets, loadBonusBets, getSession, logout } from "../lib/auth";
import { Trophy, Table2, Star, BarChart3, Target, Flame, TrendingUp, LogOut, LoaderPinwheel, Users } from "lucide-react";

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

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-display font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function Points() {
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => { if (!session) navigate("/login"); }, []);

  const [matches, setMatches] = useState([]);
  // useEffect(() => { fetchMatches().then(setMatches).catch(() => {}); }, []);

  const bets = useMemo(() => loadBets(), []);
  const bonusBets = useMemo(() => loadBonusBets(), []);

  const { total, details } = useMemo(() => {
    let total = 0;
    const details = [];
    Object.entries(bets).forEach(([matchId, bet]) => {
      const match = matches.find((m) => m.id === parseInt(matchId));
      if (!match || match.status !== "finished") return;
      const result = { homeScore: match.homeScore, awayScore: match.awayScore, extraTimeWinner: match.extraTimeWinner, phase: match.phase };
      const { points, reason } = calculateMatchPoints(bet, result);
      total += points;
      details.push({ matchId: parseInt(matchId), points, reason, match });
    });
    return { total, details };
  }, [bets, matches]);

  const totalBets = Object.keys(bets).length;
  const finishedBets = details.length;
  const correctBets = details.filter((d) => d.points > 0).length;
  const exactScores = details.filter((d) => d.points >= 5).length;
  const accuracy = finishedBets > 0 ? Math.round((correctBets / finishedBets) * 100) : 0;
  const groupPoints = details.filter((d) => d.match?.phase === "group").reduce((s, d) => s + d.points, 0);
  const knockoutPoints = total - groupPoints;

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header username={session?.username} />
      <main className="flex-1 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
          {/* Hero */}
          <div className="bg-gradient-to-br from-secondary to-secondary/80 rounded-3xl p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,175,55,0.08),transparent_70%)]" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-3">
                <Trophy className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-secondary-foreground/60 text-xs font-semibold uppercase tracking-widest mb-1">Łącznie punktów</p>
              <p className="text-5xl font-display font-black text-secondary-foreground">{total}</p>
              <p className="text-secondary-foreground/40 text-xs font-medium mt-2">
                z {totalBets} {totalBets === 1 ? "typu" : "typów"} • {finishedBets} rozstrzygnięte
              </p>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Target} label="Trafność" value={`${accuracy}%`} accent="bg-primary/10 text-primary" />
            <StatCard icon={Flame} label="Dokładne wyniki" value={exactScores} accent="bg-destructive/10 text-destructive" />
            <StatCard icon={TrendingUp} label="Faza grupowa" value={`${groupPoints} pkt`} accent="bg-blue-100 text-blue-600" />
            <StatCard icon={TrendingUp} label="Faza pucharowa" value={`${knockoutPoints} pkt`} accent="bg-purple-100 text-purple-600" />
          </div>

          {/* Bonuses
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-primary/5 border-b border-border">
              <h3 className="text-sm font-bold">Bonusy</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-lg">🏆</span><span className="text-sm font-medium">Mistrz Świata</span></div>
                <span className="text-sm font-bold text-primary">{bonusBets.champion || "Nie obstawiono"}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-lg">⚽</span><span className="text-sm font-medium">Król strzelców</span></div>
                <span className="text-sm font-bold text-primary">{bonusBets.topScorer || "Nie obstawiono"}</span>
              </div>
            </div>
          </div> */}

          {/* Points breakdown */}
          {details.length > 0 && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-primary/5 border-b border-border">
                <h3 className="text-sm font-bold">Rozbicie punktów</h3>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {details.map((d) => (
                  <div key={d.matchId} className="px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">{d.match?.homeName} vs {d.match?.awayName}</p>
                      <p className="text-[10px] text-muted-foreground">{d.reason}</p>
                    </div>
                    <span className={`text-sm font-bold ${d.points > 0 ? "text-green-600" : "text-red-400"}`}>
                      {d.points > 0 ? "+" : ""}{d.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
