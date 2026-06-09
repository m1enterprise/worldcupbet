import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Trophy, CalendarDays, Table2, Star, BarChart3 } from "lucide-react";

const navItems = [
  { path: "/", icon: CalendarDays, label: "Mecze" },
  { path: "/standings", icon: Table2, label: "Tabele" },
  { path: "/my-bets", icon: Star, label: "Moje typy" },
  { path: "/points", icon: BarChart3, label: "Punkty" },
];

export default function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-tight tracking-tight">
              World Cup 2026
            </h1>
            <p className="text-xs text-secondary-foreground/60 font-medium">
              Typer turniejowy
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
