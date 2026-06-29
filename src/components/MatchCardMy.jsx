import { memo, useMemo } from "react";
import { useIsMobile } from "../hooks/use-mobile";
import { calcMatchPoints } from "../services/calcPointsService";
// import { PHASE_NAMES } from "../constants/phaseNames";

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
  round_of_32: "1/16 finału",
  round_of_16: "1/8 finału",
  quarter_final: "Ćwierćfinał",
  semi_final: "Półfinał",
  third_place: "Mecz o 3. miejsce",
  final: "Finał",
};

function MatchCardMy({
  match,
  fetchedBetData,
  allBetsData,
}) {
  const isMobile = useIsMobile();

  const isKnockout =
    match?.stage !== "GROUP_STAGE";

  const isFinished =
    match?.status === "FINISHED";

  // console.log("MATCH", match)
  // console.log("FETCHEDBETDATA", fetchedBetData)
  // console.log("ALLBETSDATA", allBetsData)
  
  let pointsInfo = {}
  if (fetchedBetData) {
    pointsInfo = useMemo(() => {
      return calcMatchPoints(
        fetchedBetData,
        match
      );
    }, [fetchedBetData, match]);
  }
  // console.log("pointsInfo", pointsInfo)

  if (allBetsData) {
    // const testMod = [...allBetsData]
    //   .map(bet => ({
    //       ...bet,
    //       "pointsInfo": calcMatchPoints(bet, match)
    //   })
    // )

    allBetsData = [...allBetsData]
      .map(bet => ({
          ...bet,
          "pointsInfo": calcMatchPoints(bet, match)
      })
    )
  }

  // let pointsInfoAllUsersBets = []
  // if (allBetsData) {
  //   allBetsData.forEach(userBet=>{

  //     const pointsInfoUserBet = calcMatchPoints(
  //       userBet,
  //       match
  //     );
  //     pointsInfoAllUsersBets.push(pointsInfoUserBet)

  //   })
  // }
  // console.log("pointsInfoAllUsersBets", pointsInfoAllUsersBets)

  // console.log("test", match, allBetsData)

  // const currentMatchAllBets = useMemo(() => {
  //   if (!allBetsData) return [];

  //   return allBetsData
  //     .filter(
  //       bet =>
  //         String(bet?.matchId) ===
  //         String(match?.id)
  //     )
  //     .map(bet => ({
  //       ...bet,
  //       pointsInfo: calcMatchPoints(
  //         bet,
  //         match
  //       ),
  //     }));
  // }, [allBetsData, match]);

  // const pointsInfo = {}

  const matchTime =
    match?.utcDate?.slice(-9, -4);

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
              {PHASE_NAMES[match?.phase]}
            </span>
          )}
        </div>

        {match?.status === "LIVE" ? (
          <div className="flex justify-center">
          <span className="text-[10px] text-center font-bold px-2 py-0.5 bg-red-500 text-white rounded-full animate-pulse">
              MECZ TRWA
            </span>
          </div>
        ) : (<div></div>)}

        <span className="text-[11px] text-muted-foreground font-medium text-right">
          {matchTime}
        </span>
      </div>

      <div className="px-4 py-3 flex items-center gap-3">

        {/* HOME */}

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

        {/* SCORE */}

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

        {/* AWAY */}

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

      {!allBetsData && (
        <div className="px-4 pb-3">
          {/* <div
            className={`bg-muted/50 rounded-lg px-3 py-2 text-xs flex items-center justify-between bg-gradient-to-r from-white/10 via-white/10 ${
              !isFinished
                ? "to-gray-100"
                : pointsInfo?.points > 0
                ? "to-green-100"
                : "to-red-100"
            }`}
          >
            <span>
              <span className="text-muted-foreground">
                BET 1
              </span>{" "}
              <span className="font-bold">
                {fetchedBetData?.homeScore}
                {" : "}
                {fetchedBetData?.awayScore}
              </span>
            </span>

            {isFinished ? (
              <span>
                <span className="font-bold">
                  {pointsInfo?.points}
                </span>{" "}
                PKT
              </span>
            ) : (
              <div className="text-muted-foreground">
                OCZEKUJE
              </div>
            )}
          </div> */}



            <div
              className={`grid grid-cols-3 w-full mb-2 bg-muted/50 rounded-lg px-3 py-2 text-xs flex items-center justify-between bg-gradient-to-r from-white/10 via-white/10 ${
                !isFinished
                  ? "to-gray-100"
                  : pointsInfo?.points >= 5
                  ? "to-yellow-100"
                  : pointsInfo?.points > 0
                  ? "to-green-100"
                  : "to-red-100"
              }`}
            >
              <span className="text-muted-foreground text-left">
                TWÓJ BET
              </span>

              <span className="text-muted-foreground text-center">
                <span className={`${fetchedBetData?.extraTimeWinner === "home" ? "text-green-900 font-bold underline" : ""}`}>{fetchedBetData?.homeTeam?.tla}{" "}</span>
                <span className="font-bold text-secondary">
                  {fetchedBetData?.homeScore}
                  {" : "}
                  {fetchedBetData?.awayScore}
                </span>{" "}
                <span className={`${fetchedBetData?.extraTimeWinner === "away" ? "text-green-900 font-bold underline" : ""}`}>{fetchedBetData?.awayTeam?.tla}{" "}</span>
              </span>

             {isFinished ? (
              <span>
                <span className="font-bold text-right">
                  {pointsInfo?.points} PKT
                </span>
              </span>
            ) : (
              <div className="text-muted-foreground text-right">
                OCZEKUJE
              </div>
            )}
            </div>



        </div>
      )}

      {allBetsData && (
        <div className="px-4 pb-3">
          {allBetsData.map(userBet => (
            <div
              key={userBet.id}
              className={`grid grid-cols-3 w-full mb-2 bg-muted/50 rounded-lg px-3 py-2 text-xs flex items-center justify-between bg-gradient-to-r from-white/10 via-white/10 ${
                !isFinished
                  ? "to-gray-100"
                  : pointsInfo?.points >= 5
                  ? "to-yellow-100"
                  : pointsInfo?.points > 0
                  ? "to-green-100"
                  : "to-red-100"
              }`}
            >
              <span className="text-muted-foreground text-left">
                BET{" "}
                {USER_NAMES[userBet?.userId]}
              </span>

              <span className="text-muted-foreground text-center">
                {userBet?.homeTeam?.tla}{" "}
                <span className="font-bold text-secondary">
                  {userBet?.homeScore}
                  {" : "}
                  {userBet?.awayScore}
                </span>{" "}
                {userBet?.awayTeam?.tla}
              </span>

              <span className="text-muted-foreground text-right">
                {userBet?.pointsInfo?.points} PKT
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(MatchCardMy);
