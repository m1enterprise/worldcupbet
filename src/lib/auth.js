// Simple local auth - username/password stored in localStorage

const AUTH_KEY = 'user';
const BETS_KEY = "wc2026_bets";
const BONUS_KEY = "wc2026_bonus";

export function login(username, password) {
  const session = { username, loggedIn: true };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return session;
}

export function register(username, password) {
  const session = { username, loggedIn: true };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function getSession() {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
}

export function isLoggedIn() {
  const s = getSession();
  return !!(s && s.loggedIn);
}

export function loadBets() {
  const data = localStorage.getItem(BETS_KEY);
  return data ? JSON.parse(data) : {};
}

export function saveBets(bets) {
  localStorage.setItem(BETS_KEY, JSON.stringify(bets));
}

export function saveBetsForDay(dayBets) {
  const bets = loadBets();
  Object.entries(dayBets).forEach(([id, bet]) => { bets[id] = bet; });
  return bets;
}

export function loadBonusBets() {
  const data = localStorage.getItem(BONUS_KEY);
  return data ? JSON.parse(data) : {};
}

export function saveBonusBets(bonus) {
  localStorage.setItem(BONUS_KEY, JSON.stringify(bonus));
}
