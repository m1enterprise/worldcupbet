export default function TeamInfo({
  team,
  mobile,
  align = "left"
}) {
  return (
    <div
      className={`flex-1 flex items-center gap-2.5 min-w-0 ${
        align === "right"
          ? "justify-end"
          : "justify-start"
      }`}
    >
      {align === "left" && (
        <div className="w-12 h-8">
          <img
            className="w-full h-full object-cover rounded"
            src={team?.crest}
            alt={team?.name}
          />
        </div>
      )}

      <div
        className={`min-w-0 ${
          align === "right"
            ? "text-right"
            : "text-left"
        }`}
      >
        <p className="text-sm font-bold">
          {mobile ? team?.tla : team?.name}
        </p>

        {!mobile && (
          <p className="text-[10px] text-muted-foreground">
            {team?.tla}
          </p>
        )}
      </div>

      {align === "right" && (
        <div className="w-12 h-8">
          <img
            className="w-full h-full object-cover rounded"
            src={team?.crest}
            alt={team?.name}
          />
        </div>
      )}
    </div>
  );
}