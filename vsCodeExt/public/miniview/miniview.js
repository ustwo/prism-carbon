(function () {
    'use strict';

    const vscode = acquireVsCodeApi();

    // Signal the extension that the webview is ready.
    // The provider responds immediately with current budget data.
    vscode.postMessage({ command: 'ready' });

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
        const bars  = d.recentEmissions;

        if (!bars.length) {
            spark.innerHTML = '<span class="empty">No calls yet</span>';
            return;
        }

        const max = Math.max(...bars, 1e-9);
        spark.innerHTML = '';
        bars.forEach(val => {
            const el = document.createElement('div');
            el.className = 'spark-bar';
            el.style.height = Math.max(3, (val / max) * 100) + '%';
            const ratio = d.budgetLimit > 0 ? (val / d.budgetLimit) * 100 : 0;
            el.style.background =
                ratio >= 66.6 ? 'var(--vscode-charts-red,    #f14c4c)'
              : ratio >= 33.3 ? 'var(--vscode-charts-yellow, #e2c08d)'
              :                 'var(--vscode-charts-green,  #89d185)';
            el.title = val.toFixed(4) + ' g CO₂e';
            spark.appendChild(el);
        });
    }
})();
