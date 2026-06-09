import { Toaster as Sonner } from "sonner";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { isLoggedIn } from "./lib/auth";
import './index.css'

import Login from "./pages/Login";
import Register from "./pages/Register";
import Matches from "./pages/Matches";
import Standings from "./pages/Standings";
import MyBets from "./pages/MyBets";
import Points from "./pages/Points";
import Service from "./pages/Service";

function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<RequireAuth><Matches /></RequireAuth>} />
        <Route path="/standings" element={<RequireAuth><Standings /></RequireAuth>} />
        <Route path="/my-bets" element={<RequireAuth><MyBets /></RequireAuth>} />
        <Route path="/points" element={<RequireAuth><Points /></RequireAuth>} />
        <Route path="/service" element={<RequireAuth><Service /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Sonner position="top-center" richColors />
    </Router>
  );
}
