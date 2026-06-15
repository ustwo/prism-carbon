/*************************************************************************
 *                             DASHBOARD.JS                              *
 *         HOLDS THE LOGIC FOR THE DASHBOARD WEBVIEW, INCLUDING          *
 * CHART SETUP AND COMMUNICATION WITH EXTENSION FOR ALL DYNAMIC ELEMENTS *
 *************************************************************************/

(function () {


    // initialising vscode api so that back end can be connected
    const vscode = acquireVsCodeApi();


    // exposing the API gloablly so graph.js can use it
    window.vscodeAPI = vscode;

    // ── Theme helpers ─────────────────────────────────────────────
    const themeColors = (() => {
        const s = getComputedStyle(document.body);
        const get = v => s.getPropertyValue(v).trim();
        return {
            editorBg:   get('--vscode-editor-background')     || '#1e1e1e',
            fg:         get('--vscode-charts-foreground')
                     || get('--vscode-editor-foreground')      || '#cccccc',
            descFg:     get('--vscode-descriptionForeground')  || '#8e8e8e',
            focusBorder:get('--vscode-focusBorder')            || '#007fd4',
            panelBorder:get('--vscode-panel-border')           || '#454545',
            green:      get('--vscode-charts-green')           || '#89d185',
            yellow:     get('--vscode-charts-yellow')          || '#e2c08d',
            orange:     get('--vscode-charts-orange')          || '#f5884a',
            red:        get('--vscode-charts-red')             || '#f14c4c',
            blue:       get('--vscode-charts-blue')            || '#75beff',
            purple:     get('--vscode-charts-purple')          || '#b180d7',
        };
    })();

    // ── Carbon impact colours (configurable, updated when colorConfig arrives) ──
    const CARBON_DEFAULTS = {
        neutral: '#888888',
        green:   '#89d185',
        amber:   '#e2c08d',
        red:     '#f14c4c',
        minLogs: 10,
    };
    const carbonColors = {
        neutral: CARBON_DEFAULTS.neutral,
        green:   CARBON_DEFAULTS.green,
        amber:   CARBON_DEFAULTS.amber,
        red:     CARBON_DEFAULTS.red,
    };
    let carbonMinLogs = CARBON_DEFAULTS.minLogs;

    function applyCarbonColors(cfg) {
        carbonColors.neutral = cfg.neutral || carbonColors.neutral;
        carbonColors.green   = cfg.green   || carbonColors.green;
        carbonColors.amber   = cfg.amber   || carbonColors.amber;
        carbonColors.red     = cfg.red     || carbonColors.red;
        if (cfg.minLogs !== undefined) { carbonMinLogs = cfg.minLogs; }
        const r = document.documentElement;
        r.style.setProperty('--carbon-neutral', carbonColors.neutral);
        r.style.setProperty('--carbon-green',   carbonColors.green);
        r.style.setProperty('--carbon-amber',   carbonColors.amber);
        r.style.setProperty('--carbon-red',     carbonColors.red);
        // Sync color pickers and min-logs input
        const n  = document.getElementById('color-neutral');
        const g  = document.getElementById('color-green');
        const a  = document.getElementById('color-amber');
        const rd = document.getElementById('color-red');
        const ml = document.getElementById('color-min-logs');
        if (n)  { n.value  = carbonColors.neutral; }
        if (g)  { g.value  = carbonColors.green; }
        if (a)  { a.value  = carbonColors.amber; }
        if (rd) { rd.value = carbonColors.red; }
        if (ml) { ml.value = String(carbonMinLogs); }
    }

    // ── Percentile classification ─────────────────────────────────
    // callThresholds is updated when updateData arrives
    let callThresholds = { count: 0, p50: null, p90: null };

    function classifyEmissions(emissions) {
        if (!callThresholds.p50 || !callThresholds.p90 || callThresholds.count < carbonMinLogs) {
            return 'neutral';
        }
        if (emissions <= callThresholds.p50) { return 'green'; }
        if (emissions <= callThresholds.p90) { return 'amber'; }
        return 'red';
    }

    function categoryToColor(cat) {
        return carbonColors[cat] || carbonColors.neutral;
    }

    // Per-day heatmap percentiles (computed from heatmap data, not per-request)
    let heatPercentiles = { count: 0, p50: null, p90: null };

    function classifyDayEmissions(v) {
        if (!heatPercentiles.p50 || !heatPercentiles.p90 || heatPercentiles.count < carbonMinLogs) {
            return 'neutral';
        }
        if (v <= heatPercentiles.p50) { return 'green'; }
        if (v <= heatPercentiles.p90) { return 'amber'; }
        return 'red';
    }

    // Palette for pie/radar — VSCode chart colours in order
    const palette = [
        themeColors.blue, themeColors.green, themeColors.yellow, themeColors.orange,
        themeColors.red,  themeColors.purple,
    ];

    // Adaptive formatter: uses enough decimal places so the value is never "0.00"
    function formatStat(value, unit, singularUnit) {
        if (value === 0) return `0 ${unit}`;
        let str;
        if (value >= 0.01)          { str = value.toFixed(2); }
        else if (value >= 0.00001)  { str = value.toFixed(6); }
        else                        { str = value.toExponential(2); }
        const label = (singularUnit && parseFloat(str) === 1) ? singularUnit : unit;
        return `${str} ${label}`;
    }

    // Parse a '#rrggbb' hex string → [r, g, b]
    function hexToRgbArr(hex) {
        const h = (hex || '#888888').replace('#', '');
        const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    // ── Log refresh interval control ────────────────────────────────
    const intervalInput   = document.getElementById('interval-input');
    const intervalSaveBtn = document.getElementById('interval-save-btn');
    const intervalSavedMsg = document.getElementById('interval-saved-msg');

    if (intervalSaveBtn && intervalInput) {
        intervalSaveBtn.addEventListener('click', () => {
            const seconds = parseInt(intervalInput.value, 10);
            if (isNaN(seconds) || seconds < 0) { return; }
            vscode.postMessage({ command: 'setRefreshInterval', seconds });
            if (intervalSavedMsg) {
                intervalSavedMsg.textContent = '✓ Saved';
                setTimeout(() => { intervalSavedMsg.textContent = ''; }, 2000);
            }
        });

        intervalInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { intervalSaveBtn.click(); }
        });
    }

    // ── Color config save ────────────────────────────────────────────
    const colorSaveBtn  = document.getElementById('color-save-btn');
    const colorSavedMsg = document.getElementById('color-saved-msg');

    if (colorSaveBtn) {
        colorSaveBtn.addEventListener('click', () => {
            const neutral = document.getElementById('color-neutral')?.value;
            const green   = document.getElementById('color-green')?.value;
            const amber   = document.getElementById('color-amber')?.value;
            const red     = document.getElementById('color-red')?.value;
            const minLogs = parseInt(document.getElementById('color-min-logs')?.value || '10', 10);
            vscode.postMessage({ command: 'saveColors', neutral, green, amber, red, minLogs });
            applyCarbonColors({ neutral, green, amber, red, minLogs });
            if (colorSavedMsg) {
                colorSavedMsg.textContent = '✓ Saved';
                setTimeout(() => { colorSavedMsg.textContent = ''; }, 2000);
            }
        });
    }

    const colorResetBtn = document.getElementById('color-reset-btn');
    if (colorResetBtn) {
        colorResetBtn.addEventListener('click', () => {
            const { neutral, green, amber, red, minLogs } = CARBON_DEFAULTS;
            vscode.postMessage({ command: 'saveColors', neutral, green, amber, red, minLogs });
            applyCarbonColors({ neutral, green, amber, red, minLogs });
            if (colorSavedMsg) {
                colorSavedMsg.textContent = '✓ Reset';
                setTimeout(() => { colorSavedMsg.textContent = ''; }, 2000);
            }
        });
    }

    // click listener so reset button can be used

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'triggerReset' });
        });
    }
    
    // click listener for set budget button 
    const setBudgetBtn = document.getElementById('set-budget-btn');
    if (setBudgetBtn) {
        setBudgetBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'setBudget' });
        });
    }

    const purgeBtn = document.getElementById('purge-btn');
    if (purgeBtn) {
        purgeBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'triggerPurge' });
        });
    }

    // Theme is now driven by VSCode's vscode-dark/vscode-light body classes.
    // No manual toggle needed.

    // --- heat map here ---

    function isoDayOfWeek(dt) {
        let wd = dt.getUTCDay(); // 0...6 from sunday to saturday (UTC)
        wd = (wd + 6) % 7 + 1; // 1...7 starting week monday
        return '' + wd;
    }
 //generates empty data for heatmap
   function generateEmptyData() {
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

    const data2 = [];
    let dt = new Date(start.getTime());

    while (dt <= end) {
        const iso = dt.toISOString().substring(0, 10);

        data2.push({
            x: iso,
            y: isoDayOfWeek(dt),
            d: iso,
            v: 0
        });

        dt = new Date(dt.getTime() + 24 * 60 * 60 * 1000);
    }
    return data2;
}
    //setup block
const getGridColor = () => getComputedStyle(document.body).getPropertyValue('--grid-border').trim();
//allows chart text to adapt to theme changes
const getChartTextColor = () => getComputedStyle(document.body).getPropertyValue('--chart-text').trim();
    const data = {
        datasets: [{
            label: 'Heat Map',
            data: generateEmptyData(),
            anchor: 'start',
         
         
         
backgroundColor(c) {
    const point = c.dataset.data[c.dataIndex];
    if (!point || point.v === 0) {
        const [r, g, b] = hexToRgbArr(themeColors.fg);
        return `rgba(${r},${g},${b},0.07)`;
    }
    const cat = classifyDayEmissions(point.v);
    const hex = categoryToColor(cat);
    const [r, g, b] = hexToRgbArr(hex);
    // Opacity 0.35 (neutral / not enough data) or 0.5–1.0 (classified)
    const opacity = cat === 'neutral' ? 0.35 : 0.55;
    return `rgba(${r},${g},${b},${opacity})`;
},
            borderColor(c) {
                const point = c.dataset.data[c.dataIndex];
                if (!point || point.v === 0) { return themeColors.editorBg; }
                const cat = classifyDayEmissions(point.v);
                const hex = categoryToColor(cat);
                const [r, g, b] = hexToRgbArr(hex);
                return `rgba(${r},${g},${b},0.8)`;
            },
            borderRadius: 2,
            borderWidth: 1,
            hoverBackgroundColor: themeColors.focusBorder + '40',
            hoverBorderColor: themeColors.focusBorder,
            width(c) {
                const a = c.chart.chartArea || {};
                if (!a.right) { return 10; }
                const xScale = c.chart.scales?.x;
                let visibleWeeks = 54;
                if (xScale && xScale.max != null && xScale.min != null) {
                    const weekMs = 7 * 24 * 60 * 60 * 1000;
                    // +1 accounts for partial weeks at range boundaries
                    // (e.g. a 7-day range can span parts of 2 calendar weeks)
                    visibleWeeks = Math.max(2, Math.ceil((xScale.max - xScale.min) / weekMs) + 1);
                }
                return Math.max(3, (a.right - a.left) / visibleWeeks - 2);
            },
            height(c) {
                const a = c.chart.chartArea || {};
                return Math.max(3, (a.bottom - a.top) / 7 - 2);
            },

        }]
    };

    //scales block
    const scales = {
        y: {
            type: 'linear',
            position: 'right',
            reverse: true,
            min: 1,
            max: 7,
            ticks: {
                color: themeColors.fg,
                stepSize: 1,
                callback: function (value) {
                    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    return days[value - 1];
                },
                font: { size: 9 }
            },
            grid: {
                display: false,
                drawBorder: false,
                tickLength: 0
            },
            border: {
                display:false
            }
        },
       x: {
    type: 'time',
    position: 'bottom',
    offset: true, // This stops the skewing by giving columns room
    bounds: 'ticks', // This stops the blocks from vanishing
    time: {
        unit: 'week',
        round:'week',
        isoWeekday: 1,
        displayFormats: {
            week: 'MMM dd' //start date of the week will be shown on x axis
        }
    },
    ticks: {
        color: themeColors.fg,
        source: 'auto',
        maxRotation: 45,
        minRotation: 45,
        autoSkip: true,
        callback: function(value, index, values) {
            const date = new Date(value);
            date.setUTCDate(date.getUTCDate() + 6);
            return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        },
        font: { size: 8 }
    },
    grid: { display: false },
    border: { display: false }
}
    };

    // config
    const config = {
        type: 'matrix',
        data,
        options: {
            maintainAspectRatio: false,
            layout:{
                padding:{
                    top: 15,
                }
            },
            scales: scales,

            plugins: {
                legend: {
            display: false
        },
                tooltip: {
                    callbacks: {
                        title: function (context) {
                            return context[0].raw.d;
                        },
                        label: function (context) {
                            const value = context.raw.v || 0;
                            if (value === 0) { return 'No emissions recorded'; }
                            return 'Emissions: ' + value.toFixed(5) + ' g CO₂e';
                        }

                    }
                }

            }
        }
    };

    // test button to generate random data for heatmap
    const testBtn = document.getElementById('testBtn');
    if (testBtn) {
        testBtn.addEventListener('click', function () {
            generateData();
        });
    }


   // Initialize the heatmap chart
    let heatChart;
    const heatCtx = document.getElementById('myChart');
    if (heatCtx) {
        heatChart = new Chart(heatCtx, config);
    }

    // ── Heatmap range filter ───────────────────────────────────────
    let heatmapRangeDays = 365;

    function applyHeatmapRange() {
        if (!heatChart) { return; }
        const now     = new Date();
        const endUTC  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const startUTC = new Date(endUTC.getTime() - (heatmapRangeDays - 1) * 24 * 60 * 60 * 1000);
        heatChart.options.scales.x.min = startUTC.toISOString().substring(0, 10);
        heatChart.options.scales.x.max = endUTC.toISOString().substring(0, 10);
        heatChart.update('none');
    }

    document.querySelectorAll('.heatmap-range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.heatmap-range-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            heatmapRangeDays = parseInt(btn.dataset.days, 10);
            applyHeatmapRange();
        });
    });

    function generateDynamicColours(dataLength){
        const colours = [];
        for (let i = 0; i < dataLength; i++) {
            colours.push(palette[i % palette.length]);
        }
        return colours;
    }
   // Common options for all charts — all colours from VSCode theme
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: themeColors.descFg } } }
    };

    // emissions by Model chart live data from backend
    const modelEmissionsChart = new Chart(document.getElementById('modelEmissionsChart'), {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: generateDynamicColours(data.datasets[0].data.length),
                borderColor: themeColors.editorBg,
                borderWidth: 2
            }]
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return label + ': ' + value.toFixed(8) + ' g CO₂e';
                        }
                    }
                }
            }
        }
    });

    // radar chart config
    const radarElement = document.getElementById('radarChart');
    let radarChart;
    if (radarElement) {
        radarChart = new Chart(radarElement, {
            type: 'radar',
            data: {
                labels: [],
                datasets: []},
            options: {
                ...commonOptions,
                scales: {
                    r: {
                        ticks: {display: false},
                        grid: {color: getGridColor()},
                        pointLabels: {color: getChartTextColor()},
                        angleLines: {color: getGridColor()}
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.raw || 0;
                                return context.dataset.label + value.toFixed(4) + ' g CO₂e';
                            }
                        }
                    }
                }
            }
        });
        const radarContainer = document.getElementById('radar-container');
        const radarFullscreenBtn = document.getElementById('radar-fullscreen-btn');

        // fullscreen time 
        if (radarContainer && radarFullscreenBtn) {
            radarFullscreenBtn.addEventListener('click', () => {
                radarContainer.classList.toggle('radar-fullscreen-mode');

                const isFullscreen = radarContainer.classList.contains('radar-fullscreen-mode');
                
                if (isFullscreen) {
                    radarFullscreenBtn.innerHTML = '✖ Exit Fullscreen';
                } else {
                    radarFullscreenBtn.innerHTML = '⛶ Fullscreen';
                }

                if (radarChart) {
                    radarChart.resize();
                }
            });
        }
    }
    

    window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'updateData') {
            // Apply configurable carbon colours
            if (message.colorConfig) {
                applyCarbonColors(message.colorConfig);
            }

            // Update percentile thresholds for per-request classification
            if (message.callThresholds) {
                callThresholds = message.callThresholds;
            }

            const avgCostEl = document.getElementById('average-cost-display');
            if (avgCostEl && message.averageEmission !== undefined) {
                avgCostEl.innerText = message.averageEmission.toFixed(4);
            }

            // Populate the refresh interval input with the current setting value
            if (message.refreshIntervalSec !== undefined && intervalInput) {
                intervalInput.value = String(message.refreshIntervalSec);
            }

            // live emission by model data from backend
            if (message.heatMapData && heatChart) {
                // Compute per-day percentiles for heatmap colour classification
                const nonZero = message.heatMapData.filter(d => d.v > 0).map(d => d.v).sort((a, b) => a - b);
                const hn = nonZero.length;
                heatPercentiles = {
                    count: hn,
                    p50: hn >= 10 ? nonZero[Math.floor(hn * 0.5)] : null,
                    p90: hn >= 10 ? nonZero[Math.floor(hn * 0.9)] : null,
                };
                heatChart.data.datasets[0].data = message.heatMapData;
                heatChart.update('none');
                applyHeatmapRange(); // keep the selected time window
            }
            if (message.radarData && radarChart) {
                const hasData = message.radarData.labels.length > 0;
                const emptyMsg = document.getElementById('radar-empty-msg');
                if (emptyMsg) { emptyMsg.style.display = hasData ? 'none' : 'block'; }

                radarChart.data.labels = message.radarData.labels;
                message.radarData.datasets.forEach((ds, index) => {
                    const regularColour = palette[index % palette.length];
                    const fadedColour = palette[index % palette.length] + '75'; // Adding transparency to the base color
                    ds.backgroundColor = fadedColour;
                    ds.borderColor = regularColour;
                    ds.pointBackgroundColor = fadedColour;
                    ds.borderWidth = 1.5;
                });
                radarChart.data.datasets = message.radarData.datasets;
                radarChart.update();
            }
            if (message.conversionData){
                const carEmptyMsg   = document.getElementById('car-empty-msg');
                const phoneEmptyMsg = document.getElementById('phone-empty-msg');
                const treeEmptyMsg  = document.getElementById('tree-empty-msg');
                const cd = message.conversionData;
                if (carEmptyMsg)   { carEmptyMsg.innerText   = `Equivalent to ${formatStat(cd.milesDriven,          'miles driven')}`; }
                if (phoneEmptyMsg) { phoneEmptyMsg.innerText = `Equivalent to charging ${formatStat(cd.phoneCharges, 'iPhone 17s', 'iPhone 17')}`; }
                if (treeEmptyMsg)  { treeEmptyMsg.innerText  = `Equivalent to the carbon absorption of ${formatStat(cd.treeYearlyAbsorption, 'trees', 'tree')}`; }
            }
            if (message.modelLabels && message.modelEmissions) {
                const hasData = message.modelLabels.length > 0;
                const emptyMsg = document.getElementById('model-empty-msg');
                if (emptyMsg) { emptyMsg.style.display = hasData ? 'none' : 'block'; }

                modelEmissionsChart.data.labels = message.modelLabels;
                modelEmissionsChart.data.datasets[0].data = message.modelEmissions;
                modelEmissionsChart.data.datasets[0].backgroundColor = generateDynamicColours(message.modelLabels.length);
                modelEmissionsChart.data.datasets[0].borderColor = themeColors.editorBg;
                modelEmissionsChart.data.datasets[0].borderWidth = 1;
                modelEmissionsChart.update();


                // ── Project Emissions tracker ──────────────────────────
                const totalEmissions = message.totalRepoEmissions ?? 0;
                const SESSION_BUDGET = message.sessionBudget || 0; // 0 = no budget set

                const fillEl  = document.getElementById('session-progress-fill');
                const wrapEl  = document.getElementById('session-progress-wrap');
                const pctEl   = document.getElementById('session-percent-used');
                const rightEl = document.getElementById('session-text-right');

                if (SESSION_BUDGET > 0) {
                    const percentUsed  = (totalEmissions / SESSION_BUDGET) * 100;
                    const visualWidth  = Math.min(percentUsed, 100);
                    if (fillEl) { fillEl.style.width = visualWidth + '%'; }
                    if (wrapEl) {
                        wrapEl.style.display = '';
                        wrapEl.setAttribute('aria-valuenow', Math.round(percentUsed).toString());
                    }
                    if (pctEl)  { pctEl.innerText  = percentUsed.toFixed(1) + '% used'; }
                    if (rightEl) { rightEl.innerText = totalEmissions.toFixed(5) + 'g / ' + SESSION_BUDGET + 'g CO₂e'; }
                    if (fillEl) {
                        if (percentUsed >= 66.6) {
                            fillEl.className = 'progress-bar-fill danger';
                        } else if (percentUsed >= 33.3) {
                            fillEl.className = 'progress-bar-fill warning';
                        } else {
                            fillEl.className = 'progress-bar-fill safe';
                        }
                    }
                } else {
                    if (wrapEl) { wrapEl.style.display = 'none'; }
                    if (pctEl)  { pctEl.innerText  = ''; }
                    if (rightEl) { rightEl.innerText = totalEmissions.toFixed(5) + 'g CO₂e total'; }
                }

                // Update average emission display if data is available
                if (message.averageEmission !== undefined) {
                    const avgEl = document.getElementById('average-cost-display');
                    if (avgEl) {
                        avgEl.innerText = message.averageEmission.toFixed(4) + ' g';
                    }
                }

            }
        }
    });

    // Scale each animation to fill its .animation-stage container.
    // transform: scale() is visual-only, so the animation's layout size never
    // escapes the clipping boundary of .animation-stage.
    const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
            const stage = entry.target;
            // Use the smaller dimension so the animation fits both axes
            const size = Math.min(entry.contentRect.width, entry.contentRect.height) * 0.82;

            const car = stage.querySelector('.car-element');
            if (car) { car.style.transform = `scale(${size / 450})`; }

            const tree = stage.querySelector('.tree-element');
            if (tree) { tree.style.transform = `scale(${size / 450})`; }

            const phone = stage.querySelector('.phone-element');
            if (phone) { phone.style.transform = `scale(${size / 400})`; }
        }
    });

    document.querySelectorAll('.animation-stage').forEach(s => observer.observe(s));
    vscode.postMessage({ command: 'frontEndReady' });
})();