const USER_NAMES = {
  14: "Sud",
  15: "Cezar",
  16: "Jose",
  17: "KIEMON",
  18: "Kamilek",
  19: "ogmichu",
};

export default function BonusCard({ bonus }) {

  console.log(bonus)

  return (
    <div className="bg-card rounded-2xl border p-4">
      <p className="text-sm text-muted-foreground">
        BONUS BET {USER_NAMES[bonus?.bonusUserId]}
      </p>

      <div className="mt-3 space-y-2">
        <div>
          🏆 {bonus?.bonusChampion}
        </div>

        <div>
          👟 {bonus?.bonusScorer}
        </div>

        <div>
          🅰️ {bonus?.bonusAssister}
        </div>
      </div>
    </div>
  );
}