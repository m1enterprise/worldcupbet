import { Trophy, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout } from "../lib/auth";

export default function Header({ username }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary-foreground" />
        </div>

        <div className="flex-1">
          <h1 className="font-display text-lg font-bold">
            Essa Bet
          </h1>

          <p className="text-xs text-secondary-foreground/60">
            World Cup 2026
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs"
        >
          {username}
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}