import { memo, useMemo } from "react";
import { useIsMobile } from "../hooks/use-mobile";
import { calcMatchPoints } from "../services/calcPointsService";

const USER_NAMES = {
  14: "Sud",
  15: "Cezar",
  16: "Jose",
  17: "KIEMON",
  18: "Kamilek",
  19: "ogmichu",
};

const PHASE_NAMES = {
  group: "Faza grupowa",
  LAST_32: "1/16 finału",
  LAST_16: "1/8 finału",
  quarter_final: "Ćwierćfinał",
  semi_final: "Półfinał",
  third_place: "Mecz o 3. miejsce",
  final: "Finał",
};

function MatchCardAll({
  match,        // {}
  matchAllBets  // []
}) {
  const isMobile = useIsMobile();
  const isKnockout = match?.stage !== "GROUP_STAGE";
  const isFinished = match?.status === "FINISHED";
  const isStarted = new Date(match?.utcDate) <= new Date()

  if (matchAllBets) {
    matchAllBets = [...matchAllBets]
      .map(bet => ({
          ...bet,
          "pointsInfo": calcMatchPoints(bet, match)
      })
    )
  }

  const matchTime = `${String(new Date(match?.utcDate))?.slice(16, 21)}`

  return (
    <div
      className={`relative bg-card rounded-2xl border border-border overflow-hidden transition-all ${
        isFinished
          ? "opacity-70"
          : "shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between px-4 pt-3 grid grid-cols-3">
        <div className="flex items-start gap-2 text-muted-foreground text-left">

          {match?.group && (
            <span className="text-[10px] font-medium rounded-full">
              {match.group.slice(-1)}
            </span>
          )}

          {isKnockout && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {
              PHASE_NAMES[match?.stage]
              }

            </span>
          )}
        </div>

        {match?.status !== "TIMED" && match?.status !== "FINISHED" ? (
          <div className="flex justify-center">
          <span className="text-[10px] text-center font-bold px-2 py-0.5 bg-red-500 text-white rounded-full animate-pulse">
              MECZ TRWA
            </span>
          </div>
        ): <div></div>}

        <span className="text-[11px] text-muted-foreground font-medium text-right">
          {matchTime}
        </span>
      </div>

      <div className="px-4 py-3 flex items-center gap-3">

        {
          // HOME
        }
        <div className="flex-1 flex items-center gap-2.5 justify-start min-w-0">
          <div className="w-12 h-8">
            <img
              className="w-full h-full object-cover rounded-[4px]"
              src={match?.homeTeam?.crest}
              alt={match?.homeTeam?.name}
            />
          </div>

          <div className="min-w-0 text-left">
            <p className="text-sm font-bold">
              {isMobile
                ? match?.homeTeam?.tla
                : match?.homeTeam?.name}
            </p>

            {!isMobile && (
              <p className="text-[10px] text-muted-foreground font-medium">
                {match?.homeTeam?.tla}
              </p>
            )}
          </div>
        </div>

        {
          // SCORE
        }
        {isStarted && (
          <div className="flex items-center gap-1.5 shrink-0">
            {(
              <div className="flex items-center gap-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {match?.score?.fullTime?.home}
                  </span>
                </div>

                <span className="text-muted-foreground font-bold">
                  :
                </span>

                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {match?.score?.fullTime?.away}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {
          // AWAY
        }
        <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">
          <div className="min-w-0 text-right">
            <p className="text-sm font-bold">
              {isMobile
                ? match?.awayTeam?.tla
                : match?.awayTeam?.name}
            </p>

            {!isMobile && (
              <p className="text-[10px] text-muted-foreground font-medium">
                {match?.awayTeam?.tla}
              </p>
            )}
          </div>

          <div className="w-12 h-8">
            <img
              className="w-full h-full object-cover rounded-[4px]"
              src={match?.awayTeam?.crest}
              alt={match?.awayTeam?.name}
            />
          </div>
        </div>
      </div>

      {
        // ALL USERS BETS
      }
      {isStarted && matchAllBets && (
        <div className="px-4 pb-3">
          {matchAllBets.map(userBet => (
            <div
              key={userBet.id}
              className={`grid grid-cols-3 w-full mb-2 bg-muted/50 rounded-lg px-3 py-2 text-xs flex items-center justify-between bg-gradient-to-r from-white/10 via-white/10 ${
                !isFinished
                  ? "to-gray-100"
                  : userBet?.pointsInfo?.points >= 5
                  ? "to-yellow-100"
                  : userBet?.pointsInfo?.points > 0
                  ? "to-green-100"
                  : "to-red-100"
              }`}
            >
              <span className="text-muted-foreground text-left">
                BET{" "}
                {USER_NAMES[userBet?.userId]}
              </span>

              <span className={`text-muted-foreground text-center`}>
                <span className={`${userBet?.extraTimeWinner === "home" ? "text-green-900 font-bold underline" : ""}`}>{userBet?.homeTeam?.tla}{" "}</span>
                
                <span className="font-bold text-secondary">
                  {userBet?.homeScore}
                  {" : "}
                  {userBet?.awayScore}
                </span>{" "}

                <span className={`${userBet?.extraTimeWinner === "away" ? "text-green-900 font-bold underline" : ""}`}>{userBet?.awayTeam?.tla}{" "}</span>
              </span>

              <span className="text-muted-foreground text-right">
                {userBet?.pointsInfo?.points} PKT
              </span>
            </div>
          ))}
        </div>
      )}

      {!isStarted && (
        <div className="px-4 pb-3">
          <div
              className={`w-full bg-muted/50 rounded-lg px-3 py-2 text-muted-foreground text-xs text-center`}
          >
              BETY BEDA WIDOCZNE PO ROZPOCZECIU MECZU
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MatchCardAll);
