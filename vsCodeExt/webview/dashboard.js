(function () {


    // initialising vscode api so that back end can be connected
    const vscode = acquireVsCodeApi();


    // exposing the API gloablly so graph.js can use it
    window.vscodeAPI = vscode;

    // click listener so reset button can be used
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // sending a message to extension.ts
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
    start.setDate(start.getDate() - 365);

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

    if (value === 0) {
        return 'rgba(200, 200, 200, 0.05)';
    }

    // compute thresholds dynamically
    const { p50, p75 } = getPercentileThresholds(dataset);

    // GREEN (bottom 50%)
    if (value <= p50) {
        const p = value / p50 || 0;
        const g = Math.round(120 + (p * 135));
        return `rgb(0, ${g}, 0)`;
    }

    // YELLOW (50%–75%)
    if (value <= p75) {
        const p = (value - p50) / (p75 - p50 || 1);
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

    let heatChart;
    const heatCtx = document.getElementById('myChart');
    if (heatCtx) {
        heatChart = new Chart(heatCtx, config);
    }


    function generateColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = Math.floor(i * (360 / count));
            colors.push('hsl(' + hue + ', 70%, 50%)');
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
                backgroundColor: generateColors(0)
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
        if (message.command === 'updateData') {

            // live emission by model data from backend
            if (message.heatMapData && heatChart) {
                heatChart.data.datasets[0].data = message.heatMapData;
                heatChart.update();
            }
            if (message.modelLabels && message.modelEmissions) {
                const hasData = message.modelLabels.length > 0;
                const emptyMsg = document.getElementById('model-empty-msg');
                if (emptyMsg) { emptyMsg.style.display = hasData ? 'none' : 'block'; }

                modelEmissionsChart.data.labels = message.modelLabels;
                modelEmissionsChart.data.datasets[0].data = message.modelEmissions;
                modelEmissionsChart.data.datasets[0].backgroundColor = generateColors(message.modelLabels.length);
                modelEmissionsChart.update();

                //budget prgess bar update logic
                // calculate total session emissions by summing the array
                const totalEmissions = message.modelEmissions.reduce((sum, current) => sum + current, 0);

                // Hardcoding a budget limit for testing  

                const SESSION_BUDGET = message.sessionBudget !== undefined ? message.sessionBudget : 5;

                // calculate percentage 
                let percentUsed = 0;
                if (SESSION_BUDGET > 0) {
                    percentUsed = (totalEmissions / SESSION_BUDGET) * 100;
                }

                // capping visual width at 100% for display purposes
                const visualWidth = Math.min(percentUsed, 100);

                // update the progress bar and text elements
                const fillEl = document.getElementById('session-progress-fill');
                const pctEl = document.getElementById('session-percent-used');
                const rightEl = document.getElementById('session-text-right');

                fillEl.style.width = visualWidth + '%';
                pctEl.innerText = percentUsed.toFixed(1) + '% used';
                rightEl.innerText = totalEmissions.toFixed(5) + 'g / ' + SESSION_BUDGET + 'g CO₂e';

                // change colour to red if over 90% of budget is used
                if (percentUsed >= 90) {
                    fillEl.classList.add('danger');
                } else {
                    fillEl.classList.remove('danger');
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
    vscode.postMessage({ command: 'frontEndReady' });
})();