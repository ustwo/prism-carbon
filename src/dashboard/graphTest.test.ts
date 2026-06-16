import * as assert from 'assert';

// Mirrors the percentile-based classification in public/dashboard/graph.js.
// Commits are coloured by where they fall in the p50/p90 distribution of the
// drawn commits, using the configurable carbon palette (--carbon-* CSS vars).
// Below `minLogs` commits there is no statistical basis, so everything is neutral.
export function computeCommitPercentiles(
    carbons: number[],
    minLogs = 10,
): { count: number; p50: number | null; p90: number | null } {
    const vals = carbons.filter(v => v > 0).sort((a, b) => a - b);
    const n = vals.length;
    if (n < minLogs) {
        return { count: n, p50: null, p90: null };
    }
    return {
        count: n,
        p50: vals[Math.floor(n * 0.5)],
        p90: vals[Math.floor(n * 0.9)],
    };
}

export function getCColor(
    carbon: number,
    percentiles: { p50: number | null; p90: number | null },
): string {
    if (!percentiles || !percentiles.p50 || !percentiles.p90) {
        return "var(--carbon-neutral)";
    }
    if (carbon <= percentiles.p50) {
        return "var(--carbon-green)";
    }
    if (carbon <= percentiles.p90) {
        return "var(--carbon-amber)";
    }
    return "var(--carbon-red)";
}

export const carbonEmissionReferenceStrip = [
    { label: "Low (below p50)", color: "var(--carbon-green)" },
    { label: "Average (p50–p90)", color: "var(--carbon-amber)" },
    { label: "High (above p90)", color: "var(--carbon-red)" },
];

suite('Carbon Usage Graph Tests', () => {

    // 10 values 1..10 → p50 = vals[5] = 6, p90 = vals[9] = 10
    const sample = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const pct = computeCommitPercentiles(sample);

    suite('computeCommitPercentiles test', () => {
        test('Returns neutral (null) percentiles below minLogs', () => {
            const p = computeCommitPercentiles([1, 2, 3]);
            assert.strictEqual(p.p50, null);
            assert.strictEqual(p.p90, null);
        });
        test('Computes p50/p90 once enough commits exist', () => {
            assert.strictEqual(pct.p50, 6);
            assert.strictEqual(pct.p90, 10);
        });
        test('Ignores zero-carbon commits when computing the distribution', () => {
            const p = computeCommitPercentiles([0, 0, 0, 0, 0, 1, 2, 3]);
            assert.strictEqual(p.count, 3);
        });
    });

    suite('getCColor test', () => {
        test('Falls back to neutral when there is not enough data', () => {
            assert.strictEqual(getCColor(5, { p50: null, p90: null }), "var(--carbon-neutral)");
        });
        test('Below p50 should be green', () => {
            assert.strictEqual(getCColor(3, pct), "var(--carbon-green)");
        });
        test('Between p50 and p90 should be amber', () => {
            assert.strictEqual(getCColor(8, pct), "var(--carbon-amber)");
        });
        test('Above p90 should be red', () => {
            assert.strictEqual(getCColor(11, pct), "var(--carbon-red)");
        });
        test('Boundary value at p50 should be green (inclusive)', () => {
            assert.strictEqual(getCColor(6, pct), "var(--carbon-green)");
        });
        test('Boundary value at p90 should be amber (inclusive)', () => {
            assert.strictEqual(getCColor(10, pct), "var(--carbon-amber)");
        });
    });

    suite('carbonEmissionReferenceStrip test', () => {
        test('Should contain only 3 emission categories', () => {
            assert.strictEqual(carbonEmissionReferenceStrip.length, 3);
        });
        test('Each strip should have label and color', () => {
            carbonEmissionReferenceStrip.forEach(eachStrip => {
                assert.ok(eachStrip.label);
                assert.ok(eachStrip.color);
            });
        });
        test('Strip colours match the getCColor palette', () => {
            assert.strictEqual(getCColor(3, pct), carbonEmissionReferenceStrip[0].color);
            assert.strictEqual(getCColor(8, pct), carbonEmissionReferenceStrip[1].color);
            assert.strictEqual(getCColor(11, pct), carbonEmissionReferenceStrip[2].color);
        });
    });

});
