import { Link, useLocation } from "react-router-dom";
import {
  LoaderPinwheel,
  Table2,
  Star,
  Users
} from "lucide-react";

export default function BottomNav() {
  const location = useLocation();

  const items = [
    {
      path: "/",
      label: "Mecze",
      icon: LoaderPinwheel
    },
    {
      path: "/standings",
      label: "Tabele",
      icon: Table2
    },
    {
      path: "/my-bets",
      label: "Bety",
      icon: Star
    },
    {
      path: "/ranking",
      label: "Ranking",
      icon: Users
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-card">
      <div className="max-w-2xl mx-auto flex">
        {items.map(({ path, label, icon: Icon }) => {
          const active =
            location.pathname === path;

          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center py-2 ${
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}