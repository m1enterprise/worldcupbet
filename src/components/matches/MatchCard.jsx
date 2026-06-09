import React from "react";
import { TEAMS, PHASE_NAMES, PHASES } from "@/lib/matchData";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MatchCard({ match, bet, onChange, disabled }) {
  const home = TEAMS[match.homeTeam];
  const away = TEAMS[match.awayTeam];
  const isKnockout = match.phase !== PHASES.GROUP;
  const isFinished = match.status === "finished";

  const homeDisplay = home || { name: match.homeTeam, flag: "❓", code: match.homeTeam };
  const awayDisplay = away || { name: match.awayTeam, flag: "❓", code: match.awayTeam };

  const betHomeScore = bet?.homeScore ?? "";
  const betAwayScore = bet?.awayScore ?? "";
  const betExtraTimeWinner = bet?.extraTimeWinner ?? "";

  // Check if user bet is a draw (for knockout extra time winner)
  const isBetDraw =
    betHomeScore !== "" &&
    betAwayScore !== "" &&
    parseInt(betHomeScore) === parseInt(betAwayScore);

  const handleScoreChange = (side, value) => {
    const val = value === "" ? "" : Math.max(0, parseInt(value) || 0);
    const newBet = {
      homeScore: side === "home" ? val : betHomeScore,
      awayScore: side === "away" ? val : betAwayScore,
      extraTimeWinner: bet?.extraTimeWinner || "",
    };
    onChange(match.id, newBet);
  };

  const handleExtraTimeWinner = (value) => {
    onChange(match.id, {
      ...bet,
      homeScore: betHomeScore,
      awayScore: betAwayScore,
      extraTimeWinner: value,
    });
  };

  return (
    <div className={`bg-card rounded-2xl border border-border overflow-hidden transition-all ${
      isFinished ? "opacity-80" : "shadow-sm hover:shadow-md"
    }`}>
      {/* Match header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          {match.group && (
            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">
              Gr. {match.group}
            </Badge>
          )}
          {isKnockout && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5">
              {PHASE_NAMES[match.phase]}
            </Badge>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          {match.time}
        </span>
      </div>

      {/* Teams + Score inputs */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <span className="text-2xl leading-none">{homeDisplay.flag}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{homeDisplay.name}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{homeDisplay.code}</p>
          </div>
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isFinished ? (
            <div className="flex items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <span className="text-lg font-bold text-secondary-foreground">
                  {match.homeScore}
                </span>
              </div>
              <span className="text-muted-foreground font-bold">:</span>
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <span className="text-lg font-bold text-secondary-foreground">
                  {match.awayScore}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                max="20"
                value={betHomeScore}
                onChange={(e) => handleScoreChange("home", e.target.value)}
                disabled={disabled}
                className="w-11 h-11 text-center text-lg font-bold rounded-xl border-2 border-border focus:border-primary p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="-"
              />
              <span className="text-muted-foreground font-bold text-lg">:</span>
              <Input
                type="number"
                min="0"
                max="20"
                value={betAwayScore}
                onChange={(e) => handleScoreChange("away", e.target.value)}
                disabled={disabled}
                className="w-11 h-11 text-center text-lg font-bold rounded-xl border-2 border-border focus:border-primary p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="-"
              />
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">
          <div className="min-w-0 text-right">
            <p className="text-sm font-bold truncate">{awayDisplay.name}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{awayDisplay.code}</p>
          </div>
          <span className="text-2xl leading-none">{awayDisplay.flag}</span>
        </div>
      </div>

      {/* Knockout: Extra time winner selection */}
      {isKnockout && isBetDraw && !isFinished && !disabled && (
        <div className="px-4 pb-3">
          <div className="bg-muted/60 rounded-xl p-3">
            <p className="text-[11px] text-muted-foreground font-medium mb-2">
              Remis — kto wygra po dogrywce/karnych?
            </p>
            <Select value={betExtraTimeWinner} onValueChange={handleExtraTimeWinner}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Wybierz zwycięzcę..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">
                  {homeDisplay.flag} {homeDisplay.name}
                </SelectItem>
                <SelectItem value="away">
                  {awayDisplay.flag} {awayDisplay.name}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Finished match actual result row */}
      {isFinished && bet && (
        <div className="px-4 pb-3">
          <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs">
            <span className="text-muted-foreground">Twój typ: </span>
            <span className="font-bold">
              {bet.homeScore} : {bet.awayScore}
              {bet.extraTimeWinner && ` (wygra: ${bet.extraTimeWinner === "home" ? homeDisplay.name : awayDisplay.name})`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
