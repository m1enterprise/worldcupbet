<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {betEntries.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nie postawiłeś jeszcze żadnych typów.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Przejdź do zakładki „Mecze" aby obstawiać.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {betEntries.map(({ matchId, bet, match }) => {
              const home = TEAMS[match.homeTeam];
              const away = TEAMS[match.awayTeam];
              const homeDisplay = home || {
                name: match.homeTeam,
                flag: "❓",
              };
              const awayDisplay = away || {
                name: match.awayTeam,
                flag: "❓",
              };

              const isFinished = match.status === "finished";
              let pointsInfo = null;
              if (isFinished) {
                pointsInfo = calculateMatchPoints(bet, {
                  homeScore: match.homeScore,
                  awayScore: match.awayScore,
                  extraTimeWinner: match.extraTimeWinner,
                  phase: match.phase,
                });
              }

              return (
                <div
                  key={matchId}
                  className="bg-card rounded-xl border border-border p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {format(parseISO(match.date), "d MMM", { locale: pl })} •{" "}
                      {match.group
                        ? `Gr. ${match.group}`
                        : PHASE_NAMES[match.phase]}
                    </span>
                    {isFinished && pointsInfo && (
                      <Badge
                        className={`text-[10px] font-bold ${
                          pointsInfo.points > 0
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-50 text-red-500 border-red-200"
                        }`}
                      >
                        {pointsInfo.points > 0 ? "+" : ""}
                        {pointsInfo.points} pkt
                      </Badge>
                    )}
                    {!isFinished && (
                      <Badge variant="secondary" className="text-[10px]">
                        Oczekuje
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg">{homeDisplay.flag}</span>
                    <span className="text-xs font-semibold flex-1 truncate">
                      {homeDisplay.name}
                    </span>
                    <span className="text-sm font-bold bg-muted rounded-lg px-2.5 py-1">
                      {bet.homeScore} : {bet.awayScore}
                    </span>
                    <span className="text-xs font-semibold flex-1 truncate text-right">
                      {awayDisplay.name}
                    </span>
                    <span className="text-lg">{awayDisplay.flag}</span>
                  </div>

                  {bet.extraTimeWinner && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                      Wygra po dogrywce:{" "}
                      <span className="font-bold">
                        {bet.extraTimeWinner === "home"
                          ? homeDisplay.name
                          : awayDisplay.name}
                      </span>
                    </p>
                  )}

                  {isFinished && pointsInfo && (
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">
                      Wynik: {match.homeScore}:{match.awayScore} • {pointsInfo.reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

</div>