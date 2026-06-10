import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getSession, logout } from "@/lib/auth";
import { Trophy, Table2, Star, BarChart3, Medal, RefreshCw, LogOut, Users, LoaderPinwheel } from "lucide-react";

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
          <h1 className="font-display text-lg font-bold leading-tight">World Cup 2026</h1>
          <p className="text-xs text-secondary-foreground/60 font-medium">Typer turniejowy</p>
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

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.PlayerScore.list("-total_points", 100)
      .then(setPlayers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myRank = players.findIndex(p => p.username === session?.username) + 1;

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
                <p className="text-secondary-foreground/60 text-xs font-semibold uppercase tracking-wider">Twoja pozycja</p>
                <p className="text-4xl font-display font-black text-secondary-foreground">
                  {myRank > 0 ? `#${myRank}` : "—"}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                <Trophy className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="text-right">
                <p className="text-secondary-foreground/60 text-xs font-semibold uppercase tracking-wider">Graczy</p>
                <p className="text-4xl font-display font-black text-secondary-foreground">{players.length}</p>
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
            ) : players.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground px-4">
                <p className="font-semibold mb-1">Brak danych</p>
                <p className="text-xs">Żaden gracz nie zsynchronizował jeszcze swoich punktów. Zapisz typy na stronie Mecze!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Header row */}
                <div className="grid grid-cols-[32px_1fr_52px_52px_52px_52px] gap-1 px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>#</span>
                  <span>Gracz</span>
                  <span className="text-center">Pkt</span>
                  <span className="text-center">Typy</span>
                  <span className="text-center">Trafne</span>
                  <span className="text-center">Dokł.</span>
                </div>
                {players.map((player, idx) => {
                  const isMe = player.username === session?.username;
                  const accuracy = player.bets_placed > 0
                    ? Math.round((player.bets_correct / player.bets_placed) * 100)
                    : 0;
                  return (
                    <div key={player.id}
                      className={`grid grid-cols-[32px_1fr_52px_52px_52px_52px] gap-1 px-4 py-3 items-center transition-colors
                        ${isMe ? "bg-primary/5 border-l-2 border-primary" : ""}
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
                        <p className={`text-sm font-bold truncate ${isMe ? "text-primary" : ""}`}>
                          {player.username}
                          {isMe && <span className="ml-1.5 text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Ty</span>}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{accuracy}% trafność</p>
                      </div>
                      <span className={`text-base font-bold text-center ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-600" : "text-foreground"}`}>
                        {player.total_points}
                      </span>
                      <span className="text-xs text-center text-muted-foreground font-medium">{player.bets_placed}</span>
                      <span className="text-xs text-center text-green-600 font-medium">{player.bets_correct}</span>
                      <span className="text-xs text-center text-primary font-medium">{player.exact_scores}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Legenda kolumn</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2"><span className="w-8 text-center font-bold text-foreground">Pkt</span><span className="text-muted-foreground">Łączne punkty</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-center font-bold text-foreground">Typy</span><span className="text-muted-foreground">Postawione typy</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-center font-bold text-green-600">Trafne</span><span className="text-muted-foreground">Trafione wyniki</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-center font-bold text-primary">Dokł.</span><span className="text-muted-foreground">Dokładne wyniki (5+ pkt)</span></div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}