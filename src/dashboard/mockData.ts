/****************************************************************
 *                        MOCKDATA.TS                           *
 *  FAKE CALLS FOR TESTING THE DASHBOARD CHARTS.                *
 *  Enabled only when PRISM_MOCK_DATA is set — use the           *
 *  "Run Extension (mock data)" launch config. Dates are always  *
 *  relative to now. Nothing is written to the call store.       *
 ****************************************************************/

import type { Call } from '../core/budget';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const DEFAULT_DAYS = 90;

const BRANCHES = ['main', 'feature/timeline-axis', 'fix/proxy-lifecycle', 'experiment/gemini'];
const MODELS = [
    { name: 'claude-sonnet-4', min: 2, max: 60 },
    { name: 'claude-opus-4', min: 20, max: 240 },
    { name: 'gpt-4o', min: 1, max: 40 },
    { name: 'gpt-5-mini', min: 0.5, max: 15 },
    { name: 'gemini-2.5-pro', min: 5, max: 90 },
];

/**
 * Number of days of mock data to generate, or null when mocking is off.
 * PRISM_MOCK_DATA=<n> → n days; "true" or anything non-numeric → 90 days.
 */
export function mockDays(): number | null {
    const raw = process.env.PRISM_MOCK_DATA;
    if (!raw || raw === '0' || raw.toLowerCase() === 'false') { return null; }
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULT_DAYS;
}

// Small seeded PRNG so the pattern is stable between reloads.
function mulberry32(seed: number) {
    return () => {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Fake calls spread over the last `days` calendar days (today included),
 * ending now. Today always has a burst of calls in the hours before now,
 * so the latest data sits next to the "Now" marker.
 */
export function generateMockCalls(days: number, now: number = Date.now()): Call[] {
    const rand = mulberry32(42);
    const calls: Call[] = [];

    const pushCall = (time: number, branch: string) => {
        const model = MODELS[Math.floor(rand() * MODELS.length)];
        const emissions = model.min + Math.pow(rand(), 2) * (model.max - model.min);
        calls.push({
            Model: model.name,
            DateTime: Math.round(time),
            Emissions: Number(emissions.toFixed(3)),
            Branch: rand() < 0.85 ? branch : BRANCHES[Math.floor(rand() * BRANCHES.length)],
        });
    };

    for (let d = days - 1; d >= 0; d--) {
        const branch = BRANCHES[Math.floor(rand() * BRANCHES.length)];

        if (d === 0) {
            // Today: 4–9 calls spread over the last 3 hours.
            const count = 4 + Math.floor(rand() * 6);
            for (let c = 0; c < count; c++) {
                pushCall(now - rand() * 3 * HOUR, branch);
            }
            continue;
        }

        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - d);
        dayStart.setHours(0, 0, 0, 0);

        const weekday = dayStart.getDay();
        const isWeekend = weekday === 0 || weekday === 6;
        // Leave gaps: most weekends and ~20% of weekdays have no calls.
        if ((isWeekend && rand() < 0.85) || (!isWeekend && rand() < 0.2)) { continue; }

        const sessions = 1 + Math.floor(rand() * 3); // 1–3 bursts per day
        for (let s = 0; s < sessions; s++) {
            const sessionStart = dayStart.getTime() + (9 + rand() * 9) * HOUR; // 09:00–18:00
            const callsInSession = 1 + Math.floor(rand() * 6);
            for (let c = 0; c < callsInSession; c++) {
                pushCall(sessionStart + c * (2 + rand() * 20) * 60 * 1000, branch);
            }
        }
    }

    return calls.sort((a, b) => a.DateTime - b.DateTime);
}
