(function () {


    // initialising vscode api so that back end can be connected
    const vscode = acquireVsCodeApi();


    // exposing the API gloablly so graph.js can use it
    window.vscodeAPI = vscode;

    // define colour palette:
    const palette = [
        "#D8F3DC",
        "#B7e4C7",
        "#95D5B2",
        "#74C69D",
        "#52B788",
        "#40916C",
        "#2D6A4F",
        "#1B4332",
        "#081C15"
    ];

    const warningColor = '#FFBF00'; // Amber
    const dangerColor = '#FF0000';
    const safeColor = '#39FF14';

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
    btn.addEventListener('click', () => { document.body.classList.toggle('darkmode'); 

        if(heatChart){
            const newTextColor = getChartTextColor();
        heatChart.data.datasets[0].borderColor = getGridColor();
        heatChart.options.scales.x.ticks.color = newTextColor;
        heatChart.options.scales.y.ticks.color = newTextColor;
        heatChart.update();
        }
    });

    // --- heat map here ---

    function isoDayOfWeek(dt) {
        let wd = dt.getDay(); // 0...6 from sunday to saturday
        wd = (wd + 6) % 7 + 1; // 1...7 starting week monday
        return '' + wd;// get parsed

    }

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
    //setup block
const getGridColor = () => getComputedStyle(document.body).getPropertyValue('--grid-border').trim();
const getChartTextColor = () => getComputedStyle(document.body).getPropertyValue('--chart-text').trim();
    const data = {
        datasets: [{
            label: 'Heat Map',
            data: generateEmptyData(),
            anchor: 'start',
         
         
         
   backgroundColor(c) {
    function adjustColor(hex, factor) {
    const num = parseInt(hex.replace('#', ''), 16);

    let r = (num >> 16) + factor;
    let g = ((num >> 8) & 0x00FF) + factor;
    let b = (num & 0x0000FF) + factor;

    r = Math.max(Math.min(255, r), 0);
    g = Math.max(Math.min(255, g), 0);
    b = Math.max(Math.min(255, b), 0);

    return `rgb(${r}, ${g}, ${b})`;
}
    const data = c.dataset.data;
    const point = data[c.dataIndex];

    const currentDate = point?.d;
   
    // Get CSS variables 
    const styles = getComputedStyle(document.body);
    const low = styles.getPropertyValue('--low-carbon').trim();
    const avg = styles.getPropertyValue('--avg-carbon').trim();
    const high = styles.getPropertyValue('--high-carbon').trim();

    //convert from hex to rgba
    function hexToRgba(hex, alpha) {
        const bigint = parseInt(hex.replace('#', ''), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }


    // Calculate total for the day
    const dayTotal = data
        .filter(d => d.d === currentDate)
        .reduce((sum, d) => sum + (d.v || 0), 0);

    if (dayTotal === 0) {
        return 'rgba(200, 200, 200, 0.1)';
    }

    const SESSION_BUDGET = window.sessionBudget || 5;
    if (SESSION_BUDGET <= 0) return '#999';

    const percent = (dayTotal / SESSION_BUDGET) * 100;

    let alpha;

    if (percent <= 1) {
       alpha = 0.4 + (percent / 1) * 0.6;
        return hexToRgba(low, alpha);
    }   // green 
    if (percent <= 5) {
       const p = (percent - 1) / 4;
        alpha = 0.4 + p * 0.6;
        return hexToRgba(avg, alpha);
    }    // orange 
    
    
    const p = Math.min((percent - 5) / 15, 1);
    alpha = 0.4 + p * 0.6;

    return hexToRgba(high, alpha);   // red 
                                      // they're all defined in the css
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
        y: {
            type: 'linear',
            position: 'right',
            reverse: true,
            min: 1,
            max: 7,
            ticks: {
                color:'#ffffff',
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
            week: 'MMM dd'
        }
    },
    ticks: {
        color:'#ffffff',
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

    // --- TO CONNECT THE BUTTON ---
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
        // This drops the opacity gradually for each new slice
        // Starting at solid neon green (1.0) and fading down to slightly transparent (0.2)
        const alpha = 1 - (i * (0.8 / Math.max(count - 1, 1)));
        colors.push(`rgba(0, 255, 0, ${alpha.toFixed(2)})`);
    }
    return colors;
    }

    function generateDynamicColours(dataLength){
        const colours = [];
        for (let i = 0; i < dataLength; i++) {
            colours.push(palette[i % palette.length]);
        }
        return colours;
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
                backgroundColor: generateDynamicColours(data.datasets[0].data.length),
                borderColor:'#0d0d0d',
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

            if (message.sessionBudget !== undefined) {
        window.sessionBudget = message.sessionBudget;
    }

            // live emission by model data from backend
            if (message.heatMapData && heatChart) {
                heatChart.data.datasets[0].data = message.heatMapData;
                heatChart.update();
            }
            if (message.radarData && radarChart) {
                const hasData = message.radarData.labels.length > 0;
                const emptyMsg = document.getElementById('radar-empty-msg');
                if (emptyMsg) { emptyMsg.style.display = hasData ? 'none' : 'block'; }

                radarChart.data.labels = message.radarData.labels;
                message.radarData.datasets.forEach((ds, index) => {
                    const regularColour = palette[index % palette.length];
                    const fadedColour = palette[index % palette.length] + '75'; // Adding transparency to the base color
                    // const hue = Math.floor((index * 137.5) % 360);
                    ds.backgroundColor = fadedColour;
                    ds.borderColor = regularColour;
                    ds.pointBackgroundColor = fadedColour;
                    ds.borderWidth = 1.5;
                });
                radarChart.data.datasets = message.radarData.datasets;
                radarChart.update();
            }
            if (message.conversionData){
                const carEmptyMsg = document.getElementById('car-empty-msg');
                const phoneEmptyMsg = document.getElementById('phone-empty-msg');
                const treeEmptyMsg = document.getElementById('tree-empty-msg');
                if (carEmptyMsg) { carEmptyMsg.innerText = message.conversionData.milesDriven === 0 ? "Equivalent to 0 miles driven" : `Equivalent to ${message.conversionData.milesDriven.toFixed(2)} miles driven`; }
                if (phoneEmptyMsg) { phoneEmptyMsg.innerText = message.conversionData.phoneCharges === 0 ? "Equivalent to charging 0 iPhone 17s" : `Equivalent to charging ${message.conversionData.phoneCharges.toFixed(2)} iPhone 17s`; }
                if (treeEmptyMsg) { treeEmptyMsg.innerText = message.conversionData.treeYearlyAbsorption === 0 ? "Equivalent to the carbon absorption of 0 trees" : `Equivalent to the carbon absorption of ${message.conversionData.treeYearlyAbsorption.toFixed(2)} trees`; }
            }
            if (message.modelLabels && message.modelEmissions) {
                const hasData = message.modelLabels.length > 0;
                const emptyMsg = document.getElementById('model-empty-msg');
                if (emptyMsg) { emptyMsg.style.display = hasData ? 'none' : 'block'; }

                modelEmissionsChart.data.labels = message.modelLabels;
                modelEmissionsChart.data.datasets[0].data = message.modelEmissions;
                modelEmissionsChart.data.datasets[0].backgroundColor = generateDynamicColours(message.modelLabels.length);
                modelEmissionsChart.data.datasets[0].borderColor = '#0d0d0d';
                modelEmissionsChart.data.datasets[0].borderWidth = 1;
                modelEmissionsChart.update();

                // // radar updating logic
                // const dynamicColours = generateColors(message.modelLabels.length);
                // const fadedDynamicColours = dynamicColours.map(color => color.replace(/[\d.]+\)$/, '0.2)'));                newRadarChart.data.labels = message.modelLabels;
                // // for (let i = 0; i < message.modelLabels.length; i++) {
                // newRadarChart.data.datasets[0].data = message.modelEmissions;
                // radarConfig.baseColour = dynamicColours;

                // newRadarChart.data.datasets[0].backgroundColor = fadedDynamicColours;
                // newRadarChart.data.datasets[0].borderColor = dynamicColours;
                // newRadarChart.data.datasets[0].pointBackgroundColor = fadedDynamicColours;
                // newRadarChart.data.datasets[0].pointHoverBorderColor = fadedDynamicColours;
                // // newRadarChart.data.datasets[0].backgroundColor = 'rgba(50, 205, 50, 0.2)'; // Adding transparency to the base color
                // // newRadarChart.data.datasets[0].borderColor = 'rgba(50, 205, 50, 1)';
                // // newRadarChart.data.datasets[0].pointBackgroundColor = 'rgba(50, 205, 50, 0.2)';
                // // newRadarChart.data.datasets[0].pointHoverBorderColor = 'rgba(50, 205, 50, 0.2)';
                
                // newRadarChart.update();
            // }


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
                if (percentUsed >= 66.6) {
                    fillEl.classList.remove('warning');
                    fillEl.classList.add('danger');
                } else if (percentUsed >= 33.3) {
                    fillEl.classList.remove('danger');
                    fillEl.classList.add('warning');
                } else {
                    fillEl.classList.remove('danger');
                    fillEl.classList.remove('warning');
                    fillEl.classList.add('safe');
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

    const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
            const parent = entry.target;
            const currentWidth = entry.contentRect.width;
            const safeSpace = currentWidth * 0.85;

            const car = parent.querySelector('.car-element');
            if (car) { 
                car.style.transform = `scale(${safeSpace / 450})`; 
            }

            const tree = parent.querySelector('.tree-element');
            if (tree) { 
                tree.style.transform = `scale(${safeSpace / 450})`; 
            }

            const phone = parent.querySelector('.phone-element');
            if (phone) { 
                phone.style.transform = `scale(${safeSpace / 400})`; 
            }
        }
    });

    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(item => observer.observe(item));
    vscode.postMessage({ command: 'frontEndReady' });
})();