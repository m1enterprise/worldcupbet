import wcData from '../lib/wc_data.json'
import standingsData from '../lib/standings.json'
import {pushMatches, pushStandings} from '../services/supaBaseService';

export default function Service() {
  const runService = async () => {
    console.log('service_0')

    // current service logic
    standingsData.standings.forEach(match => {
      pushStandings(match);
    });

    console.log('service_1')
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div onClick={runService} className="">service_action</div>
    </div>
  );
}
