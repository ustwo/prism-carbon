(function () {
    'use strict';

    const vscode = acquireVsCodeApi();
    vscode.postMessage({ command: 'ready' });

    // ── Heatmap colour helper (mirrors dashboard.js logic) ─────────
    function hexToRgb(hex) {
        const h = (hex || '#888').replace('#', '');
        const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function heatColor(emissions, budgetLimit) {
        if (budgetLimit <= 0) { return 'var(--vscode-charts-green, #89d185)'; }
        const s   = getComputedStyle(document.body);
        const get = v => s.getPropertyValue(v).trim();

        const percent = emissions / budgetLimit;
        let hex, t;
        if (percent <= 0.01) {
            hex = get('--vscode-charts-green')  || '#89d185';
            t   = percent / 0.01;
        } else if (percent <= 0.05) {
            hex = get('--vscode-charts-yellow') || '#e2c08d';
            t   = (percent - 0.01) / 0.04;
        } else {
            hex = get('--vscode-charts-red')    || '#f14c4c';
            t   = Math.min((percent - 0.05) / 0.2, 1);
        }
        const [r, g, b] = hexToRgb(hex);
        return `rgba(${r},${g},${b},${(0.25 + t * 0.75).toFixed(2)})`;
    }

    // ── Custom tooltip overlay ─────────────────────────────────────
    const tip = document.createElement('div');
    tip.id = 'tip';
    document.body.appendChild(tip);

    function showTip(el, html) {
        tip.innerHTML = html;
        tip.style.display = 'block';
        const r    = el.getBoundingClientRect();
        const tw   = tip.offsetWidth;
        const left = Math.min(r.left + r.width / 2 - tw / 2, window.innerWidth - tw - 4);
        tip.style.left = Math.max(4, left) + 'px';
        tip.style.top  = (r.top - tip.offsetHeight - 6) + 'px';
    }

    function hideTip() { tip.style.display = 'none'; }

    // ── Message handler ────────────────────────────────────────────
    window.addEventListener('message', ({ data: msg }) => {
        if (msg.command !== 'update') { return; }
        render(msg.data);
    });

    function render(d) {
        // Progress bar
        const fill = document.getElementById('fill');
        const pct  = Math.min(d.percent, 100);
        fill.style.width = pct + '%';
        fill.className   = 'progress-fill ' +
            (pct >= 66.6 ? 'danger' : pct >= 33.3 ? 'warning' : 'safe');

        // Stats
        document.getElementById('used').textContent  = d.totalEmissions.toFixed(4) + 'g';
        document.getElementById('pct').textContent   = d.percent.toFixed(1) + '%';
        document.getElementById('limit').textContent = '/ ' + d.budgetLimit + 'g';

        // Meta
        const n = d.callCount;
        document.getElementById('calls').textContent =
            n + ' call' + (n !== 1 ? 's' : '');
        document.getElementById('avg').textContent =
            n > 0 ? 'avg ' + d.average.toFixed(4) + 'g' : 'avg —';

        // Sparkline
        const spark = document.getElementById('spark');
        const calls = d.recentCalls;

        if (!calls || !calls.length) {
            spark.innerHTML = '<span class="empty">No calls yet</span>';
            return;
        }

        const max = Math.max(...calls.map(c => c.emissions), 1e-9);
        spark.innerHTML = '';

        calls.forEach(call => {
            const el = document.createElement('div');
            el.className    = 'spark-bar';
            el.style.height = Math.max(3, (call.emissions / max) * 100) + '%';

            el.style.background = heatColor(call.emissions, d.budgetLimit);

            const model  = call.model  || 'Unknown';
            const source = call.source ? `<br><span class="tip-dim">${call.source}</span>` : '';
            const tipHtml =
                `<span class="tip-em">${call.emissions.toFixed(4)} g CO₂e</span><br>` +
                `<span class="tip-dim">${model}</span>` +
                source;

            el.addEventListener('mouseenter', () => showTip(el, tipHtml));
            el.addEventListener('mouseleave', hideTip);
            el.addEventListener('click', () => {
                hideTip();
                vscode.postMessage({ command: 'selectCall', dateTime: call.dateTime });
            });
            el.style.cursor = 'pointer';

            spark.appendChild(el);
        });
    }
})();
