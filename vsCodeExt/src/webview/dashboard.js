(function(){

 const btn = document.getElementById('theme-switch');
            btn.addEventListener('click', () => { document.body.classList.toggle('darkmode'); });

            // --- NEW TUTORIAL CHART START ---

function isoDayOfWeek (dt){
    let wd = dt.getDay(); // 0...6 from sunday to saturday
    wd = (wd + 6 ) % 7 +1 // 1...7 starting week monday
    return '' + wd ;// get parsed

};

function generateData(){
    const d = new Date ();
    const today = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const data2 = [];
    const end = today;
    let dt = new Date (new Date().setDate(end.getDate()-365));
    while (dt <= end){
        const iso = dt.toISOString().substring(0, 10);
        data2.push({
            x: iso,
            y: isoDayOfWeek(dt),
            d: iso,
            v: Math.random() * 50
        });
        dt = new Date(dt.setDate(dt.getDate() + 1));
    }
    console.log(data2);
    return data2;
}

//setup block
const data = {
    datasets: [{
        label: 'Heat Map',
        data: generateData(),
        backgroundColor(c){
            const value = c.dataset.data[c.dataIndex].v;
            const alpha = (10+ value) / 60;
            return `rgba(0, 200, 0, ${alpha})`;
        },
        borderColor: `green`,
        borderRadius: 1,
        borderWidth: 1,
        hoverBackgroundColor: `rgba(54, 162, 235, 0.2)`,
        hoverBorderColor: `rgba(54, 162, 235, 1)`,
        width(c){
            const a = c.chart.chartArea || {};
            return (a.right - a.left) / 53 -1 ;
        },
        height(c){
            const a = c.chart.chartArea || {};
            return (a.bottom - a.top) / 7 - 1 ;
        },

    }]
};

//scales block
const scales ={
    y:{
        type: 'time',
        offset: true,
        time: {
            unit: 'day',
            round:'day',
            isoWeek: 1,
            parser: 'i',
            displayFormats:{
                day: 'iii'
            }

        },
        reverse: true,
        position: 'right',
        ticks:{
            maxRotation: 0,
            autoSkip: true,
            padding: 1,
            font: {
                size:9
            }
        },
        grid:{
            display: false,
            drawBorder: false,
            tickLength: 0
        }
    },
    x:{
        type:'time',
        position: 'bottom',
        offset:true,
        time: {
            unit: 'week',
            round:'week',
            isoWeekDay: 1 ,
            displayFormats:{
                week: 'MMM dd'
            }
        },
        ticks:{
            maxRotation: 0,
            autoSkip: true,
            font:{
                size: 9
            }
        },
        grid:{
            display: false,
            drawBorder: false,
            tickLength: 0,
        }
    }
};

// config
const config = {
    type:'matrix',
    data,
    options:{
        maintainAspectRatio: false,
        scales: scales,
        pluggins: {

        }
    }
};

// --- TO CONNECT THE BUTTON ---
    const testBtn = document.getElementById('testBtn');
    if (testBtn) {
        testBtn.addEventListener('click', function() {
            generateData();
        });
    }


    const ctxTutorial = document.getElementById('myChart'); 
if (ctxTutorial) {
    // We pass your 'config' variable here so it knows about the data and scales
    const myChart = new Chart(ctxTutorial, config); 

    // Now update your button so it actually talks to THIS chart
    const testBtn = document.getElementById('testBtn');
    if (testBtn) {
        testBtn.addEventListener('click', function() {
            myChart.data.datasets[0].data = generateData();
            myChart.update();
        });
    }


            /* --- COMMENT OUT FROM HERE ---
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Weekly Sales',
                    data: [18, 12, 6, 9, 12, 3, 9],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }

            --- TO HERE --- */
        

        // Update the version number in the header if you added the span
        const versionTag = document.getElementById('chartVersion');
        if (versionTag) { versionTag.innerText = Chart.version; }
    }
    // --- NEW TUTORIAL CHART END ---



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

            // the file size pie chart.
            
            const sizeChart = new Chart(document.getElementById('emissionChart'), {
                type: 'pie',
                data: {
                    labels: ['Main.js', 'test.js', 'worker1.js', 'Helper.js', 'Other'],
                    datasets: [{ data: [300, 150, 80, 60, 25], backgroundColor: generateColors(5) }]
                },
                options: commonOptions
            });

            // the carbon cost pie chart
            const ctxCarbon = document.getElementById('carbonCostChart');
            const carbonChart = new Chart(ctxCarbon, {
                type: 'pie',
                data: {
                    labels: ['Main.js', 'test.js', 'worker1.js', 'Helper.js', 'Other'],
                    datasets: [{ data: [400, 200, 50, 30, 100], backgroundColor: generateColors(5) }]
                },
                options: commonOptions
            });

            // the drill down budget chart
            const budgetChart = new Chart(document.getElementById('budgetChart'), {
                type: 'pie',
                data: {
                    labels: ['Used by File', 'Remaining Budget'],
                    datasets: [{ data: [0, 100], backgroundColor: ['#e74c3c', '#2ecc71'] }]
                },
                options: commonOptions
            });

            // --- Emissions by Model chart (live data from backend) ---
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
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return label + ': ' + value.toFixed(8) + ' g CO₂e';
                                }
                            }
                        }
                    }
                }
            });

            // this is the logic for the drill down, when a section of the carbon cost chart is clicked, it will update the budget chart to show how much of the budget that file is using and how much is remaining
            ctxCarbon.onclick = function(evt) {
                const points = carbonChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
                if (points.length) {
                    const index = points[0].index;
                    const label = carbonChart.data.labels[index];
                    const value = carbonChart.data.datasets[0].data[index];
                    
                    const totalBudget = 600; // Example total budget
                    const remaining = Math.max(0, totalBudget - value);

                    document.getElementById('drilldown-title').innerText = label + " vs Total Budget";
                    budgetChart.data.datasets[0].data = [value, remaining];
                    budgetChart.update();

                    document.getElementById('drilldown-view').scrollIntoView({ behavior: 'smooth' });
                    document.getElementById('drilldown-view').style.display = 'block';
                }
            };

            document.getElementById('back-btn').onclick = function() {
                document.getElementById('main-view').style.display = 'flex';
                document.getElementById('header').style.display = 'block';
                document.getElementById('drilldown-view').style.display = 'none';
            };

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'updateData') {
                    // existing file size / carbon cost charts
                    if(message.fileSizes) sizeChart.data.datasets[0].data = message.fileSizes;
                    if(message.carbonData) carbonChart.data.datasets[0].data = message.carbonData;
                    sizeChart.update();
                    carbonChart.update();

                    // live Emissions by Model chart
                    if (message.modelLabels && message.modelEmissions) {
                        const hasData = message.modelLabels.length > 0;
                        const emptyMsg = document.getElementById('model-empty-msg');
                        if (emptyMsg) { emptyMsg.style.display = hasData ? 'none' : 'block'; }

                        modelEmissionsChart.data.labels = message.modelLabels;
                        modelEmissionsChart.data.datasets[0].data = message.modelEmissions;
                        modelEmissionsChart.data.datasets[0].backgroundColor = generateColors(message.modelLabels.length);
                        modelEmissionsChart.update();
                    }
                }
            });
    })();