(function () {


    // initialising vscode api so that back end can be connected
    const vscode = acquireVsCodeApi();


    // exposing the API gloablly so graph.js can use it
    window.vscodeAPI = vscode;

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'triggerReset' });
        });
    }
    

    const setBudgetBtn = document.getElementById('set-budget-btn');
    if (setBudgetBtn) {
        setBudgetBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'setBudget' });
        });
    }

    //dark mode toggle listener
    const btn = document.getElementById('theme-switch');
    btn.addEventListener('click', () => { document.body.classList.toggle('darkmode'); 

        if(heatChart){
            const newTextColor = getChartTextColor();
        heatChart.data.datasets[0].borderColor = getGridColor();
        heatChart.options.scales.x.ticks.color = newTextColor;
        heatChart.options.scales.y.ticks.color = newTextColor;
        heatChart.update();
        }
    });

    //heat map start here 

    function isoDayOfWeek(dt) {
        let wd = dt.getDay(); // 0...6 from sunday to saturday
        wd = (wd + 6) % 7 + 1 // 1...7 starting week monday
        return '' + wd;// get parsed

    };

    //generate empty data for the past 365 days
   function generateEmptyData() {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(end);
    start.setDate(start.getDate() - 364);

    const data2 = [];
    let dt = new Date(start);

    while (dt <= end) {
        const iso = dt.toISOString().substring(0, 10);

        data2.push({
            // Change x to the ISO date string so the time scale can read it
            x: iso, 
            y: isoDayOfWeek(dt),
            d: iso,
            v: 0
        });

        dt.setDate(dt.getDate() + 1);
    }
    return data2;
}
    //get grid color from css
const getGridColor = () => getComputedStyle(document.body).getPropertyValue('--grid-border').trim();
const getChartTextColor = () => getComputedStyle(document.body).getPropertyValue('--chart-text').trim();
    const data = {
        datasets: [{
            label: 'Heat Map',
            data: generateEmptyData(),
            anchor: 'start',



        //heat map color logic that changes 
        //the brighter the color the higher the emissions
backgroundColor(c) {
    const dataset = c.dataset.data;
    const value = dataset[c.dataIndex]?.v || 0;
     if (value > 0) { console.log('[TEST 4] backgroundColor called with v:', value); } // ← ADD THIS

    if (value === 0) {
        return 'rgba(200, 200, 200, 0.05)';
    }

    const { p50, p75 } = cachedThresholds;

    // GREEN (bottom 50%)
    if (value < p50) {
        const p = p50 > 0 ? value / p50 :0;
        const g = Math.round(120 + (p * 135));
        return `rgb(0, ${g}, 0)`;
    }

    // YELLOW (50%–75%)
    if (value < p75) {
        const range = (p75 - p50);
        const p = range > 0 ? (value - p50) / range : 0;
        const r = Math.round(180 + (p * 75));
        const g = Math.round(150 + (p * 105));
        return `rgb(${r}, ${g}, 0)`;
    }

    // RED (top 25%)
    const max = Math.max(...dataset.map(d => d.v));
    const p = (value - p75) / (max - p75 || 1);
    const r = Math.round(180 + (p * 75));
    return `rgb(${r}, 0, 0)`;
},
            borderColor: '#39FF14',
            borderRadius: 1,
            borderWidth: 1,
            hoverBackgroundColor: `rgba(54, 162, 235, 0.2)`,
            hoverBorderColor: `rgba(54, 162, 235, 1)`,
            width(c) {
                const a = c.chart.chartArea || {};
                const cols = 53;
                return (a.right - a.left) / cols -3 ;
            },
            height(c) {
                const a = c.chart.chartArea || {};
                return (a.bottom - a.top) / 7-3 ;
            },

        }]
    };

    //scales block
    const scales = {
        //y axis
        y: {
            type: 'linear',
            position: 'right',
            reverse: true,
            min: 1,
            max: 7,
            ticks: {
                color: '#ffffff',
                stepSize: 1,
                callback: function (value) {
                    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    return days[value - 1];
                },
                font: {
                    size: 9
                }
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
        //x axis
       x: {
    type: 'time',
    position: 'bottom',
    offset: true, 
    bounds: 'ticks', 
    time: {
        unit: 'week',
        round:'week',
        isoWeekday: 1,
        displayFormats: {
            week: 'MMM dd'
        }
    },
    //ticks settings
    ticks: {
        color: '#ffffff',
        source: 'auto', 
        maxRotation: 45,
        minRotation: 45,
        autoSkip: true,
        callback: function(value, index, values) {
            const date = new Date(value);
            date.setDate(date.getDate() + 6 );
            return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        },
        font: { size: 8 }
    },
    grid: { display: false },
    border: { display: false }
}
    };

    function getPercentileThresholds(data) {
    const values = data
        .map(d => d.v)
        .filter(v => v >0)
        .sort((a, b) => a - b);

    if (values.length === 0) {
        return { p50: 0, p75: 0 };
    }

    const p50Index = Math.floor(values.length * 0.5);
    const p75Index = Math.floor(values.length * 0.75);

    return {
        p50: values[p50Index],
        p75: values[p75Index]
    };
}

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
    const testBtn = document.getElementById('testBtn');
    if (testBtn) {
        testBtn.addEventListener('click', function () {
            generateData();
        });
    }

    let cachedThresholds = { p50: 0, p75: 0 };

    let heatChart;
    const heatCtx = document.getElementById('myChart');
    if (heatCtx) {
        heatChart = new Chart(heatCtx, config);
        console.log('[TEST 1] heatChart initialized:', heatChart ? 'OK' : 'FAILED');
    }


    function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        // This drops the opacity gradually for each new slice
        // Starting at solid neon green (1.0) and fading down to slightly transparent (0.2)
        const alpha = 1 - (i * (0.8 / Math.max(count - 1, 1)));
        colors.push(`rgba(0, 255, 0, ${alpha.toFixed(2)})`);

    }
    return colors;
}

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#888' } } }
    };

    // emissions by Model chart live data from backend
    const modelEmissionsChart = new Chart(document.getElementById('modelEmissionsChart'), {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: generateColors(0),
                borderColor:'0d0d0d',
                borderWidth:1
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


    window.addEventListener('message', event => {
    const message = event.data;
    console.log('[TEST 7] Message received:', message.command); // ← ADD THIS
    if (message.command === 'updateData') {
            const avgCostEl = document.getElementById('average-cost-display');
            if (avgCostEl && message.averageEmission !== undefined) {
                avgCostEl.innerText = message.averageEmission.toFixed(4);
            }

        if (message.heatMapData && heatChart) {
            //Get Today's date in LOCAL YYYY-MM-DD format
            const t = new Date();
            const todayLocal = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;

            //Map the data while fixing the "shifting date" bug
            const sanitizedData = message.heatMapData.map(point => {
                // Instead of new Date(point.x), we split the string to keep it LOCAL
                const parts = point.x.split('-');
                const actualDate = new Date(parts[0], parts[1] - 1, parts[2]);
                const day = actualDate.getDay(); // 0=Sun, 1=Mon...
                
                return {
                    ...point,
                    y:(day === 0 ? 7 : day) // Matches your 1-7 Mon-Sun scale
                };
            });

            // check if the backend send data for today?
            const todayMatch = sanitizedData.find(d => d.x === todayLocal);
            
            if (todayMatch) {
                console.log("SUCCESS: Found real data for today:", todayMatch);
            } else {
                // ONLY if today is missing, add a placeholder so the grid isn't empty
                console.log("Adding placeholder for today:", todayLocal);
                sanitizedData.push({
                    x: todayLocal,
                    y: parseInt(isoDayOfWeek(new Date())),
                    d: todayLocal,
                    v: 0
                });
            }

            // Update the chart
            cachedThresholds = getPercentileThresholds(sanitizedData);

// Pre-compute all colors BEFORE giving data to Chart.js
const computedColors = sanitizedData.map(point => {
    const value = point.v || 0;
    if (value === 0) return 'rgba(200, 200, 200, 0.05)';

    const { p50, p75 } = cachedThresholds;

    if (value < p50) {
        const p = p50 > 0 ? value / p50 : 0;
        const g = Math.round(120 + (p * 135));
        return `rgb(0, ${g}, 0)`;
    }
    if (value < p75) {
        const range = p75 - p50;
        const p = range > 0 ? (value - p50) / range : 0;
        const r = Math.round(180 + (p * 75));
        const g = Math.round(150 + (p * 105));
        return `rgb(${r}, ${g}, 0)`;
    }
    const max = Math.max(...sanitizedData.map(d => d.v));
    const p = (value - p75) / (max - p75 || 1);
    const r = Math.round(180 + (p * 75));
    return `rgb(${r}, 0, 0)`;
});

try {
                console.log('[TEST 2] Non-zero data points:', sanitizedData.filter(d => d.v > 0).length);
                console.log('[TEST 2] cachedThresholds:', cachedThresholds);
                console.log('[TEST 2] computedColors sample:', computedColors.slice(0, 5));
                heatChart.data.datasets[0].backgroundColor = computedColors;
                heatChart.data.datasets[0].data = sanitizedData;
                heatChart.update('none');
                console.log('[TEST 2] heatChart.update() called');

                console.log('[TEST 6] Non-zero points:', sanitizedData.filter(d => d.v > 0).map(d => ({ x: d.x, v: d.v, y: d.y })));
            } catch(err) {
                console.error('[TEST 5] CRASH:', err);
            }
        }

        // --- Keep your Model Chart and Budget logic below as is ---
        if (message.modelLabels && message.modelEmissions) {
            const hasData = message.modelLabels.length > 0;
            const emptyMsg = document.getElementById('model-empty-msg');
            if (emptyMsg) { emptyMsg.style.display = hasData ? 'none' : 'block'; }

                modelEmissionsChart.data.labels = message.modelLabels;
                modelEmissionsChart.data.datasets[0].data = message.modelEmissions;
                modelEmissionsChart.data.datasets[0].backgroundColor = generateColors(message.modelLabels.length);
                modelEmissionsChart.data.datasets[0].borderColor = '#0d0d0d';
                modelEmissionsChart.data.datasets[0].borderWidth = 1;
                modelEmissionsChart.update();

                //budget prgess bar update logic
                // calculate total session emissions by summing the array
                const totalEmissions = message.totalRepoEmissions !== undefined
                    ? message.totalRepoEmissions
                    : message.modelEmissions.reduce((sum, current) => sum + current, 0);

                // Hardcoding a budget limit for testing  

                const SESSION_BUDGET = message.sessionBudget !== undefined ? message.sessionBudget : 5;

                // calculate percentage 
                let percentUsed = 0;
                if (SESSION_BUDGET > 0) {
                    percentUsed = (totalEmissions / SESSION_BUDGET) * 100;
                }

                // capping visual width at 100% for display purposes
                const visualWidth = Math.min(percentUsed, 100);

            const fillEl = document.getElementById('session-progress-fill');
            const pctEl = document.getElementById('session-percent-used');
            const rightEl = document.getElementById('session-text-right');

            fillEl.style.width = visualWidth + '%';
            pctEl.innerText = percentUsed.toFixed(1) + '% used';
            rightEl.innerText = totalEmissions.toFixed(5) + 'g / ' + SESSION_BUDGET + 'g CO₂e';

                                
                fillEl.classList.remove('safe', 'warning', 'danger');

                if (percentUsed >= 66.6) {
                    fillEl.classList.add('danger');
                } else if (percentUsed >= 33.3) {
                    fillEl.classList.add('warning');
                } else {
                    fillEl.classList.add('safe');
                }

            }
        }
    });
    vscode.postMessage({ command: 'frontEndReady' });
})();