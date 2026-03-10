(function () {


    // initialising vscode api so that back end can be connected
    const vscode = acquireVsCodeApi();

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

    const btn = document.getElementById('theme-switch');
    btn.addEventListener('click', () => { document.body.classList.toggle('darkmode'); });

    // --- heat map here ---

    function isoDayOfWeek(dt) {
        let wd = dt.getDay(); // 0...6 from sunday to saturday
        wd = (wd + 6) % 7 + 1 // 1...7 starting week monday
        return '' + wd;// get parsed

    };

    function generateEmptyData() {
        const d = new Date();
        const today = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const data2 = [];
        const end = today;
        let dt = new Date(new Date().setDate(end.getDate() - 365));
        while (dt <= end) {
            const iso = dt.toISOString().substring(0, 10);
            data2.push({
                x: iso,
                y: isoDayOfWeek(dt),
                d: iso,
                v: 0
            });
            dt = new Date(dt.setDate(dt.getDate() + 1));
        }
        // console.log(data2);
        return data2;
    }

    //setup block

    const data = {
        datasets: [{
            label: 'Heat Map',
            data: generateEmptyData(),
            backgroundColor(c) {
                if (!c.dataset.data[c.dataIndex]) { return 'rgba(200, 200, 200, 0.1)'; }
                const value = c.dataset.data[c.dataIndex].v;
                if (value === 0) { return 'rgba(200, 200, 200, 0.1)'; }
                const alpha = Math.min(1, (10 + (value * 0.2)) / 60);
                return `rgba(0, 200, 0, ${alpha})`;
            },
            borderColor: `green`,
            borderRadius: 1,
            borderWidth: 1,
            hoverBackgroundColor: `rgba(54, 162, 235, 0.2)`,
            hoverBorderColor: `rgba(54, 162, 235, 1)`,
            width(c) {
                const a = c.chart.chartArea || {};
                return (a.right - a.left) / 53 - 1;
            },
            height(c) {
                const a = c.chart.chartArea || {};
                return (a.bottom - a.top) / 7 - 1;
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
            }
        },
        x: {
            type: 'time',
            position: 'bottom',
            offset: true,
            time: {
                unit: 'week',
                isoWeekDay: 1,
                displayFormats: {
                    week: 'MMM dd'
                }
            },
            ticks: {
                maxRotation: 0,
                autoSkip: true,
                font: {
                    size: 9
                }
            },
            grid: {
                display: false,
                drawBorder: false,
                tickLength: 0,
            }
        }
    };

    // config
    const config = {
        type: 'matrix',
        data,
        options: {
            maintainAspectRatio: false,
            scales: scales,

            plugins: {
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

    // --- TO CONNECT THE BUTTON ---
    const testBtn = document.getElementById('testBtn');
    if (testBtn) {
        testBtn.addEventListener('click', function () {
            generateData();
        });
    }


    // const ctxTutorial = document.getElementById('myChart');
    // if (ctxTutorial) {
    //     // We pass your 'config' variable here so it knows about the data and scales
    //     const myChart = new Chart(ctxTutorial, config);

    //     // Now update your button so it actually talks to THIS chart
    //     const testBtn = document.getElementById('testBtn');
    //     if (testBtn) {
    //         testBtn.addEventListener('click', function () {
    //             myChart.data.datasets[0].data = generateData();
    //             myChart.update();
    //         });
    //     }


    //     /* --- COMMENT OUT FROM HERE ---
    //     data: {
    //         labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    //         datasets: [{
    //             label: 'Weekly Sales',
    //             data: [18, 12, 6, 9, 12, 3, 9],
    //             backgroundColor: 'rgba(54, 162, 235, 0.2)',
    //             borderColor: 'rgba(54, 162, 235, 1)',
    //             borderWidth: 1
    //         }]
    //     },
    //     options: {
    //         responsive: true,
    //         maintainAspectRatio: false,
    //         scales: {
    //             y: { beginAtZero: true }
    //         }
    //     }

    //     --- TO HERE --- */


    //     // Update the version number in the header if you added the span
    //     const versionTag = document.getElementById('chartVersion');
    //     if (versionTag) { versionTag.innerText = Chart.version; }
    // }
    // --- NEW TUTORIAL CHART END ---


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
            }
        }
    });
    vscode.postMessage({ command: 'frontEndReady' });
})();