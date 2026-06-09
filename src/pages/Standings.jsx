import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchStandings, fetchScorers } from "../lib/api";
import { getSession, logout } from "../lib/auth";
import { Trophy, CalendarDays, Table2, Star, BarChart3, RefreshCw, LogOut } from "lucide-react";

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav() {
  const location = useLocation();
  const items = [
    { path: "/", icon: CalendarDays, label: "Mecze" },
    { path: "/standings", icon: Table2, label: "Tabele" },
    { path: "/my-bets", icon: Star, label: "Moje typy" },
    { path: "/points", icon: BarChart3, label: "Punkty" },
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

// ─── Group Table ──────────────────────────────────────────────────────────────
function Table({ entry }) {
  const groupName = entry.group?.replace("GROUP_", "") || "?";
  const teams = entry.table || [];

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 bg-secondary">
        <h3 className="text-sm font-bold text-secondary-foreground">Gr {groupName.slice(-1)}</h3>
      </div>
      <div className="divide-y divide-border">
        <div className="grid grid-cols-[1fr_28px_28px_28px_28px_36px] gap-1 px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Drużyna</span><span className="text-center">M</span><span className="text-center">W</span>
          <span className="text-center">R</span><span className="text-center">P</span><span className="text-center">Pkt</span>
        </div>
        {teams.map((row, idx) => (
          <div key={row.team?.id || idx} className={`grid grid-cols-[1fr_28px_28px_28px_28px_36px] gap-1 px-4 py-2.5 items-center ${idx < 2 ? "bg-primary/5" : ""}`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
              {row.team?.crest ? (
                <img src={row.team?.crest} alt="" className="w-5 h-5 object-contain" />
              ) : (
                <span className="text-base">❓</span>
              )}
              <span className="text-sm font-semibold truncate">{row.team?.shortName || row.team?.name || "?"}</span>
            </div>
            <span className="text-xs text-center font-medium">{row.playedGames}</span>
            <span className="text-xs text-center font-medium">{row.won}</span>
            <span className="text-xs text-center font-medium">{row.draw}</span>
            <span className="text-xs text-center font-medium">{row.lost}</span>
            <span className="text-sm text-center font-bold text-primary">{row.points}</span>
          </div>
        ))}
      </div>
    </div>
    
  );
}

// ─── Scorers Table ────────────────────────────────────────────────────────────
function ScorersTable({ scorers, title, statKey }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 bg-secondary">
        <h3 className="text-sm font-bold text-secondary-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border">
        {scorers.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Dane będą dostępne po rozpoczęciu turnieju
          </div>
        ) : (
          scorers.map((player, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-primary text-primary-foreground" : idx < 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {idx + 1}
              </span>
              <span className="text-base">{player.teamFlag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{player.name}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{player.teamName}</p>
              </div>
              <span className="text-lg font-bold text-primary">{player[statKey]}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import standingsData from "../lib/standings.json";
import { getStandings } from "../services/standingService";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Standings() {
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => { if (!session) navigate("/login"); }, []);

  const [activeTab, setActiveTab] = useState("groups");
  const [standings, setStandings] = useState([]);
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    useEffect(() => {
      const fetchData = async () => {
        const data = await getStandings();
        setStandings(data);
      };
      fetchData();
      setLoading(false);
    }, []);

  // const groupStandings = standings.filter((s) => s.type === "TOTAL" && s.stage === "GROUP_STAGE");

  const tabs = [
    { key: "groups", label: "Tabela" },
    { key: "scorers", label: "Strzelcy" },
    { key: "assists", label: "Asysty" },
  ];

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header username={session?.username} />
      <main className="flex-1 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Tabs */}
          <div className="flex bg-muted rounded-xl p-1 gap-1 mb-4">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all ${activeTab === t.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Ładowanie danych...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-center">
              <p className="text-sm font-bold text-destructive mb-1">Błąd ładowania danych</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {activeTab === "groups" && (
                standings.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">Tabele grupowe będą dostępne po starcie turnieju</div>
                ) : (
                  standings.map((entry, i) => <Table key={i} entry={entry} />)
                )
              )}
              {activeTab === "scorers" && (
                <ScorersTable scorers={[...scorers].sort((a, b) => b.goals - a.goals)} title="Król strzelców" statKey="goals" />
              )}
              {activeTab === "assists" && (
                <ScorersTable scorers={[...scorers].sort((a, b) => b.assists - a.assists)} title="Król asyst" statKey="assists" />
              )}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
