import React from "react";
import { TEAMS } from "@/lib/matchData";

export default function ScorersTable({ scorers, title, statKey }) {
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
          scorers.map((player, idx) => {
            const team = TEAMS[player.team];
            return (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  idx === 0
                    ? "bg-primary text-primary-foreground"
                    : idx < 3
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {idx + 1}
                </span>
                <span className="text-base">{team?.flag || "❓"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{player.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {team?.name || player.team}
                  </p>
                </div>
                <span className="text-lg font-bold text-primary">
                  {player[statKey]}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}