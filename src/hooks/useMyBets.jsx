import { useEffect, useState } from "react";
import {
  getMatches
} from "../services/matchService";

import {
  getBets,
  getBetsByUserId,
  getBonusBetByUserId,
  getBonusBets
} from "../services/betService";

import { getUsers } from "../services/userService";

export function useMyBets(userId) {
  const [loading, setLoading] = useState(true);

  const [matches, setMatches] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const [allBets, setAllBets] = useState([]);
  const [bonusBets, setBonusBets] = useState([]);
  const [users, setUsers] = useState([]);
  const [upMatch, setUpMatch] = useState([]);
  const [upMatchAllBets, setUpMatchAllBets] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [
          matchesData,
          userBetsData,
          allBetsData,
          bonusData,
          usersData
        ] = await Promise.all([
          getMatches(),
          getBetsByUserId(userId),
          getBets(),
          getBonusBets(),
          getUsers()
        ]);

        const currentMatch = [...matchesData].filter(match=>match.status !== "FINISHED")[0]

        const upMatchBetsData = [...allBetsData].filter(bet => String(bet?.matchId) === String(currentMatch?.id))

            //   data
            //     .map(bet => ({
            //       ...bet,
            //       pointsInfo: calcMatchPoints(
            //         bet,
            //         currentMatch
            //       ),
            //     }));

        setMatches(matchesData);
        setUserBets(userBetsData);
        setAllBets(allBetsData);
        setBonusBets(bonusData);
        setUsers(usersData);
        setUpMatch(currentMatch);
        setUpMatchAllBets(upMatchBetsData);

      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      load();
    }
  }, [userId]);

  return {
    loading,
    matches,
    userBets,
    allBets,
    bonusBets,
    users,
    upMatch,
    upMatchAllBets
  };
}