// import { chromium } from 'playwright';

export async function scrapeWorldCupMatches() {
    const browser = await chromium.launch({
        headless: true
    });

    const page = await browser.newPage();

    await page.goto(
        'https://www.flashscore.pl/pilka-nozna/swiat/mistrzostwa-swiata/mecze/',
        {
            waitUntil: 'networkidle'
        }
    );

    // Wait for matches to appear
    await page.waitForSelector('[id^="g_1_"]');

    const matches = await page.evaluate(() => {
        return [...document.querySelectorAll('[id^="g_1_"]')]
            .map(match => {
                const teams = match.querySelectorAll('.event__participant');

                return {
                    id: match.id.replace('g_1_', ''),
                    homeTeam: teams[0]?.textContent?.trim() || null,
                    awayTeam: teams[1]?.textContent?.trim() || null,
                    time: match.querySelector('.event__time')?.textContent?.trim() || null,
                    score: match.querySelector('.event__scores')?.textContent?.trim() || null
                };
            });
    });

    await browser.close();

    return matches;
}
