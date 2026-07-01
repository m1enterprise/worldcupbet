import React from "react";
// import { TEAMS, PHASE_NAMES } from "@/lib/matchData";

// ─── PHASE NAMES ─────────────────────────────────────────────────────────────
const PHASE_NAMES = {
  group: "Faza grupowa",
  LAST_32: "1/16 finału",
  LAST_16: "1/8 finału",
  QUARTER_FINALS: "Ćwierćfinał",
  SEMI_FINALS: "Półfinał",
  THIRD_PLACE: "Mecz o 3. miejsce",
  FINAL: "Finał",
};

// ─── Single match card in the bracket ─────────────────────────────────────────
function BracketMatch({ match }) {
  const isFinished = match?.status === "FINISHED";
  const home = match ? match.homeTeam : null;
  const away = match ? match.awayTeam : null;
  const homeDisplay = home || { name: match?.homeName || "TBD", flag: "❓" };
  const awayDisplay = away || { name: match?.awayName || "TBD", flag: "❓" };

  const homeWin = isFinished && (match.homeScore > match.awayScore || match.extraTimeWinner === "home");
  const awayWin = isFinished && (match.awayScore > match.homeScore || match.extraTimeWinner === "away");

  console.log("MATCH", match)
  console.log(match.score.fullTime.home)

  return (
    <div className={`bg-card rounded-xl border overflow-hidden w-full ${isFinished ? "border-border opacity-90" : "border-border shadow-sm"}`}>
      {match?.time && (
        <div className="px-3 py-1 bg-muted/50 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between">
          <span>{match.date && match.date.slice(5).replace("-", "/")}</span>
          <span>{match.time}</span>
        </div>
      )}
      <div className="flex items-center gap-2 px-2.5 py-2">
        {/* Home */}

        <div className="w-10 h-6">
            <img
              className="w-full h-full object-cover rounded-[4px]"
              src={homeDisplay?.crest}
              alt={homeDisplay?.tla}
            />
        </div>
        <span className={`flex-1 text-xs font-semibold truncate ${homeWin ? "text-primary" : "text-foreground"}`}>
          {homeDisplay.tla}
        </span>
        <span className={`text-sm font-bold w-5 text-center ${homeWin ? "text-primary" : "text-muted-foreground"}`}>
          {match?.score?.fullTime?.home}
        </span>
      </div>
      <div className="flex items-center gap-2 px-2.5 py-2 border-t border-border/50">
        {/* Away */}
        
        <div className="w-10 h-6">
            <img
              className="w-full h-full object-cover rounded-[4px]"
              src={awayDisplay?.crest}
              alt={awayDisplay?.tla}
            />
        </div>
        <span className={`flex-1 text-xs font-semibold truncate ${awayWin ? "text-primary" : "text-foreground"}`}>
          {awayDisplay.tla}
        </span>
        <span className={`text-sm font-bold w-5 text-center ${awayWin ? "text-primary" : "text-muted-foreground"}`}>
          {match?.score?.fullTime?.away}
        </span>
      </div>
    </div>
  );
}

// ─── Round column ─────────────────────────────────────────────────────────────
function RoundColumn({ title, matches, accent }) {
  return (
    <div className="flex flex-col min-w-[160px]">

        <div className="px-4 py-2.5 bg-secondary mb-3 text-center w-full">
            <h3 className="text-sm font-bold text-secondary-foreground">{title}</h3>
        </div>
      {/* <div className={`text-center mb-3 ${accent}`}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider">{title}</h3>
      </div> */}
      <div className="flex-1 flex flex-col justify-around gap-3 px-3">
        {matches.map((match, idx) => (
          <BracketMatch key={idx} match={match} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Playoffs Component ──────────────────────────────────────────────────
export default function PlayoffsView({ matches }) {
  const knockoutMatches = (matches || []).filter((m) => m.phase !== "group");

  // Group by phase in order
  const phaseOrder = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];
  const rounds = phaseOrder
    .map((phase) => ({
      phase,
      title: PHASE_NAMES[phase],
      matches: knockoutMatches.filter((m) => m.stage === phase),
    }))
    .filter((r) => r.matches.length > 0);

  if (rounds.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        Playoffy
      </div>
    );
  }

  // Separate final + third place from the main bracket
//   const bracketRounds = rounds.filter((r) => r.phase !== "THIRD_PLACE" && r.phase !== "FINAL");
  const finalRound = rounds.find((r) => r.phase === "FINAL");
  const thirdPlaceRound = rounds.find((r) => r.phase === "THIRD_PLACE");

  console.log("")

  return (
    <div className="">
      {/* Horizontal scrolling bracket */}
      <div 
        className="bg-card rounded-2xl border border-border overflow-hidden"
        >
        <div className="flex overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
          {rounds.map((round) => (
            <RoundColumn
              key={round.phase}
              title={round.title}
              matches={round.matches}
              accent="text-primary"
            />
          ))}
          {/* Final + Third place side by side */}
          {/* {(finalRound || thirdPlaceRound) && (
            <div className="flex flex-col min-w-[160px]">
              <div className="text-center mb-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-primary">Finał</h3>
              </div>
              <div className="flex-1 flex flex-col justify-end gap-3 px-1">
                {thirdPlaceRound && (
                  <div>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider text-center mb-1.5">O 3. miejsce</p>
                    {thirdPlaceRound.matches.map((m, i) => (
                      <BracketMatch key={i} match={m} />
                    ))}
                  </div>
                )}
                {finalRound && (
                  <div>
                    <p className="text-[9px] text-primary font-bold uppercase tracking-wider text-center mb-1.5">🏆 Wielki Finał</p>
                    {finalRound.matches.map((m, i) => (
                      <BracketMatch key={i} match={m} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )} */}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 text-center">Przewiń w bok aby zobaczyć całą drabinkę →</p>
      </div>
    </div>
  );
}