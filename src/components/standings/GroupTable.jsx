import React from "react";
import { TEAMS } from "@/lib/matchData";

export default function GroupTable({ groupName, teams }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 bg-secondary">
        <h3 className="text-sm font-bold text-secondary-foreground">
          Grupa {groupName}
        </h3>
      </div>
      <div className="divide-y divide-border">
        {/* Header */}
        <div className="grid grid-cols-[1fr_32px_32px_32px_32px_40px] gap-1 px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Drużyna</span>
          <span className="text-center">M</span>
          <span className="text-center">W</span>
          <span className="text-center">R</span>
          <span className="text-center">P</span>
          <span className="text-center">Pkt</span>
        </div>
        {/* Rows */}
        {teams.map((team, idx) => {
          const t = TEAMS[team.code];
          return (
            <div
              key={team.code}
              className={`grid grid-cols-[1fr_32px_32px_32px_32px_40px] gap-1 px-4 py-2.5 items-center ${
                idx < 2 ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground w-4">
                  {idx + 1}
                </span>
                <span className="text-base">{t?.flag || "❓"}</span>
                <span className="text-sm font-semibold truncate">
                  {t?.name || team.code}
                </span>
              </div>
              <span className="text-xs text-center font-medium">{team.played}</span>
              <span className="text-xs text-center font-medium">{team.won}</span>
              <span className="text-xs text-center font-medium">{team.drawn}</span>
              <span className="text-xs text-center font-medium">{team.lost}</span>
              <span className="text-sm text-center font-bold text-primary">
                {team.points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
