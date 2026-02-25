(function(){

 const btn = document.getElementById('theme-switch');
            btn.addEventListener('click', () => { document.body.classList.toggle('darkmode'); });

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

            

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'updateData') 

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
                
            });
    })();