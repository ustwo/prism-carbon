(function () {
    'use strict';

    const vscode = acquireVsCodeApi();
    vscode.postMessage({ command: 'ready' });

    // ── Carbon impact colours (updated when colorConfig arrives) ───
    const carbonColors = {
        neutral: '#888888',
        green:   '#89d185',
        amber:   '#e2c08d',
        red:     '#f14c4c',
    };

    function applyCarbonColors(cfg) {
        if (!cfg) { return; }
        carbonColors.neutral = cfg.neutral || carbonColors.neutral;
        carbonColors.green   = cfg.green   || carbonColors.green;
        carbonColors.amber   = cfg.amber   || carbonColors.amber;
        carbonColors.red     = cfg.red     || carbonColors.red;
        const r = document.documentElement;
        r.style.setProperty('--carbon-neutral', carbonColors.neutral);
        r.style.setProperty('--carbon-green',   carbonColors.green);
        r.style.setProperty('--carbon-amber',   carbonColors.amber);
        r.style.setProperty('--carbon-red',     carbonColors.red);
    }

    function categoryToColor(cat) {
        return carbonColors[cat] || carbonColors.neutral;
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
        // Apply colour config first so everything uses the right palette
        if (d.colorConfig) { applyCarbonColors(d.colorConfig); }

        // ── Budget bar (optional — only shown when budget is set) ──
        const wrap = document.getElementById('budget-bar-wrap');
        const fill = document.getElementById('fill');
        const pct  = document.getElementById('pct');
        const lim  = document.getElementById('limit');

        if (d.budgetLimit > 0) {
            const pctVal = Math.min(d.percent, 100);
            if (fill) {
                fill.style.width = pctVal + '%';
                fill.className = 'progress-fill ' +
                    (pctVal >= 66.6 ? 'danger' : pctVal >= 33.3 ? 'warning' : 'safe');
            }
            if (wrap) { wrap.style.display = ''; }
            if (pct)  { pct.textContent  = d.percent.toFixed(1) + '%'; }
            if (lim)  { lim.textContent  = '/ ' + d.budgetLimit + 'g'; }
        } else {
            if (wrap) { wrap.style.display = 'none'; }
            if (pct)  { pct.textContent  = ''; }
            if (lim)  { lim.textContent  = ''; }
        }

        // ── Stats ──────────────────────────────────────────────────
        document.getElementById('used').textContent = d.totalEmissions.toFixed(4) + 'g';

        // ── Meta ───────────────────────────────────────────────────
        const n = d.callCount;
        document.getElementById('calls').textContent =
            n + ' call' + (n !== 1 ? 's' : '');
        document.getElementById('avg').textContent =
            n > 0 ? 'avg ' + d.average.toFixed(4) + 'g' : 'avg —';

        // ── Sparkline ──────────────────────────────────────────────
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

            // Colour driven by percentile category, not budget
            el.style.background = categoryToColor(call.category || 'neutral');

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
