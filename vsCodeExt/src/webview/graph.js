let pendingCommitDots = null;
let cumulativeGraphButton;
let timelineGraphButton;
let slider;
let graphType = "cumulative";
let workspaceBranches = [];
let referenceStrip;
let hoverFunctionality;
let container;

const ref = document.getElementById("branchGraph");

if (ref) {
    container = document.createElement("div");
    container.id = "carbon-graph-wrapper";
    container.style.width = "100%";
    container.style.height = "300px";
    container.style.position = "relative";
    container.style.border = "1px solid var(--secondary-text)";
    container.style.borderRadius = "8px";
    container.style.background = "var(--base-variant)";
    container.style.color = "var(--text-color)";

    const title = document.createElement("h3");
    referenceStrip = document.createElement("div");
    referenceStrip.style.visibility = "hidden";
    referenceStrip.style.display = "flex";
    referenceStrip.style.gap = "16px";
    referenceStrip.style.fontSize = "12px";
    referenceStrip.style.alignItems = "center";
    [
        { label: "Low Emission", color: "var(--low-carbon)" },
        { label: "Average Emission", color: "var(--avg-carbon)" },
        { label: "High Emission", color: "var(--high-carbon)" },
    ].forEach(strip => {
        const reference = document.createElement("div");
        reference.style.display = "flex";
        reference.style.alignItems = "center";
        reference.style.gap = "6px";

        const dot = document.createElement("div");
        dot.style.width = "10px";
        dot.style.height = "10px";
        dot.style.borderRadius = "50%";
        dot.style.background = strip.color;

        const heading = document.createElement("span");
        heading.innerText = strip.label;
        heading.style.color = "var(--text-color)";

        reference.appendChild(dot);
        reference.appendChild(heading);
        referenceStrip.appendChild(reference);
    });

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.margin = "10px";

    const references = document.createElement("div");
    references.style.display = "flex";
    references.style.alignItems = "center";
    references.style.gap = "14px";

    title.innerText = "Carbon Usage Timeline (Commits per branch)";

    const toggleButtonContainer = document.createElement("div");
    toggleButtonContainer.style.display = "grid";
    toggleButtonContainer.style.gridTemplateColumns = "1fr 1fr";
    toggleButtonContainer.style.border = "1px solid var(--secondary-text)";
    toggleButtonContainer.style.borderRadius = "999px";
    toggleButtonContainer.style.padding = "3px";
    toggleButtonContainer.style.cursor = "pointer";
    toggleButtonContainer.style.position = "relative";

    slider = document.createElement("div");
    slider.style.position = "absolute";
    slider.style.inset = "3px";
    slider.style.width = "calc(50% - 3px)";
    slider.style.borderRadius = "999px";
    slider.style.transition = "transform 0.25s cubic-bezier(.4,0,.2,1)";
    slider.style.transform = "translateX(0%)";
    slider.style.background = "linear-gradient(to bottom, rgba(255,255,255,0.25), rgba(255,255,255,0.05))";
    slider.style.border = "1px solid rgba(0,0,0,0.35)";
    slider.style.boxShadow = `0 2px 6px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.15)`;
    slider.style.backdropFilter = "blur(4px)";

    cumulativeGraphButton = makeButtons("Cumulative Graph", "cumulative-button");
    timelineGraphButton = makeButtons("Timeline Graph", "timeline-button");

    cumulativeGraphButton.classList.add("toggle-active");
    timelineGraphButton.classList.add("toggle-inactive");

    const mainGraphArea = document.createElement("div");
    mainGraphArea.id = "carbon-usage-graph-main-area";
    mainGraphArea.style.width = "100%";
    mainGraphArea.style.height = "240px";
    mainGraphArea.style.position = "relative";

    hoverFunctionality = document.createElement("div");
    hoverFunctionality.id = "hover-functionality";
    hoverFunctionality.style.position = "absolute";
    hoverFunctionality.style.padding = "6px 10px";
    hoverFunctionality.style.fontSize = "12px";
    hoverFunctionality.style.borderRadius = "6px";
    hoverFunctionality.style.background = "var(--base-variant)";
    hoverFunctionality.style.border = "1px solid var(--secondary-text)"
    hoverFunctionality.style.color = "var(--text-color)";
    hoverFunctionality.style.pointerEvents = "none";
    hoverFunctionality.style.opacity = "0";
    hoverFunctionality.style.transition = "opacity 0.15s ease";
    hoverFunctionality.style.zIndex = "999";

    container.appendChild(hoverFunctionality);

    toggleButtonContainer.appendChild(slider);
    toggleButtonContainer.appendChild(cumulativeGraphButton);
    toggleButtonContainer.appendChild(timelineGraphButton);

    references.appendChild(title);
    references.appendChild(toggleButtonContainer);

    header.appendChild(references);
    header.appendChild(referenceStrip);

    container.appendChild(header);
    container.appendChild(mainGraphArea);

    ref.appendChild(container);
}



window.addEventListener("message", event => {
    const message = event.data;
    if (message.command === "commitDots") {
        pendingCommitDots = message.data;
        drawGraphs();
    }

    if (message.command === "workspaceBranches") {
        workspaceBranches = message.data;
        drawGraphs();
    }
});

function deletePreviousGraph() {

    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    mainGraphArea.innerHTML = "";
}


function buildGraph() {
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    if (!mainGraphArea) return;

    mainGraphArea.innerHTML = "";

    const horizontalLineWrapper = document.createElement("div");
    horizontalLineWrapper.style.display = "flex";
    horizontalLineWrapper.style.flexDirection = "column";
    horizontalLineWrapper.style.height = "100%";
    horizontalLineWrapper.style.justifyContent = "space-evenly";
    horizontalLineWrapper.style.width = "100%";

    workspaceBranches.forEach((branch, index) => {
        const hue = Math.floor((index * 137.5 + 150) % 360);
        const branchColor = `hsl(${hue}, 70%, 80%)`;

        const horizontalPath = document.createElement("div");
        horizontalPath.style.display = "flex";
        horizontalPath.style.alignItems = "center";
        horizontalPath.style.paddingLeft = "12px";
        horizontalPath.style.width = "100%";

        const graphHeading = document.createElement("span");
        graphHeading.innerText = branch;
        graphHeading.style.width = "150px";
        graphHeading.style.minWidth = "150px";
        graphHeading.style.color = branchColor;
        graphHeading.style.fontSize = "14px";
        graphHeading.style.fontWeight = "500";

        const horizontalLine = document.createElement("div");
        horizontalLine.style.position = "relative";
        horizontalLine.style.flex = "1";
        horizontalLine.style.height = "2px";
        horizontalLine.style.background = branchColor;
        horizontalLine.style.marginLeft = "10px";

        horizontalPath.appendChild(graphHeading);
        horizontalPath.appendChild(horizontalLine);
        horizontalLineWrapper.appendChild(horizontalPath);
    });

    mainGraphArea.appendChild(horizontalLineWrapper);
}

function deleteBranches() {
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    mainGraphArea.innerHTML = "";
}

function drawGraphs() {

    deletePreviousGraph();

    if (graphType === "timeline") {
        if (referenceStrip) {
            referenceStrip.style.visibility = "visible";
        }

        if (workspaceBranches.length === 0) {
            return;
        }

        buildGraph();
        drawCommitDots();
    }
    else {
        if (referenceStrip) {
            referenceStrip.style.visibility = "hidden";
        }

        deleteBranches();
        drawCumulativeGraph();
    }
}

function getCumulativeGraphData() {
    if (!pendingCommitDots) {
        return {};
    }

    const cumulativeGraphData = {};

    Object.keys(pendingCommitDots).forEach(branch => {
        let netTotal = 0;

        cumulativeGraphData[branch] = [...pendingCommitDots[branch]]
            .sort((a, b) => a.xAxis - b.xAxis)
            .map(commit => {
                netTotal += commit.carbon;
                return {
                    time: commit.xAxis,
                    netCarbon: netTotal
                };
            });
    });
    return cumulativeGraphData;

}

function drawCumulativeGraph() {
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const height = mainGraphArea.clientHeight;
    const margin = { top: 20, right: 40, bottom: 40, left: 60 };
    let maxTime = 0;
    let maxCarbon = 0;
    const timeScale = 5;

    const cumulativeGraphData = getCumulativeGraphData();


    Object.values(cumulativeGraphData).forEach(branch => {
        branch.forEach(graphPoint => {
            if (graphPoint.time > maxTime) {
                maxTime = graphPoint.time;
            }
            if (graphPoint.netCarbon > maxCarbon) {
                maxCarbon = graphPoint.netCarbon;
            }
        });
    });

    if (maxTime === 0) {
        maxTime = 1;
    }
    if (maxCarbon === 0) {
        maxCarbon = 1;
    }

    const oldWidth = mainGraphArea.clientWidth;
    const width = Math.max(oldWidth, maxTime * timeScale + margin.left + margin.right + 100);

    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    Object.keys(cumulativeGraphData).forEach(branch => {

        const branchIndex = workspaceBranches.indexOf(branch);
        const hue = Math.floor((branchIndex * 137.5 + 150) % 360);
        const branchColour = branchIndex != -1 ? `hsl(${hue}, 70%, 80%)` : "var(--text-color)";

        let graphPoints = "";
        let endPoint = null;

        cumulativeGraphData[branch].forEach(graphPoint => {
            const xAxis = margin.left + graphPoint.time * timeScale;
            const yAxis = margin.top + graphHeight - (graphPoint.netCarbon / maxCarbon) * graphHeight;

            graphPoints += `${xAxis},${yAxis} `;
            endPoint = { x: xAxis, y: yAxis };
        });

        const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");

        path.setAttribute("points", graphPoints);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", branchColour);
        path.setAttribute("stroke-width", "2");

        svg.appendChild(path);

        if (endPoint) {
            const branchHeading = document.createElementNS("http://www.w3.org/2000/svg", "text");
            branchHeading.setAttribute("x", endPoint.x + 4);
            branchHeading.setAttribute("y", endPoint.y - 6);
            branchHeading.setAttribute("fill", branchColour);
            branchHeading.setAttribute("font-size", "11");
            branchHeading.textContent = branch;
            svg.appendChild(branchHeading);
        }
    });

    const yAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxisLine.setAttribute("x1", margin.left);
    yAxisLine.setAttribute("y1", margin.top);
    yAxisLine.setAttribute("x2", margin.left);
    yAxisLine.setAttribute("y2", height - margin.bottom);
    yAxisLine.setAttribute("stroke", "var(--text-color)");
    svg.appendChild(yAxisLine);

    const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxisLine.setAttribute("x1", margin.left);
    xAxisLine.setAttribute("y1", height - margin.bottom);
    xAxisLine.setAttribute("x2", width - margin.right);
    xAxisLine.setAttribute("y2", height - margin.bottom);
    xAxisLine.setAttribute("stroke", "var(--text-color)");
    svg.appendChild(xAxisLine);

    const yAxisHeading = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yAxisHeading.setAttribute("x", 15);
    yAxisHeading.setAttribute("y", height / 2);
    yAxisHeading.setAttribute("fill", "var(--text-color)");
    yAxisHeading.setAttribute("transform", `rotate(-90 15 ${height / 2})`);
    yAxisHeading.textContent = "Carbon";
    svg.appendChild(yAxisHeading);

    const xAxisHeading = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xAxisHeading.setAttribute("x", width / 2);
    xAxisHeading.setAttribute("y", height - 5);
    xAxisHeading.setAttribute("fill", "var(--text-color)");
    xAxisHeading.setAttribute("text-anchor", "middle");
    xAxisHeading.textContent = "Time";
    svg.appendChild(xAxisHeading);

    const horizontalScrollContainer = document.createElement("div");
    horizontalScrollContainer.style.width = "100%";
    horizontalScrollContainer.style.height = "100%";
    horizontalScrollContainer.style.overflowX = "auto";
    horizontalScrollContainer.style.overflowY = "hidden";
    horizontalScrollContainer.style.display = "block";
    horizontalScrollContainer.style.whiteSpace = "nowrap";

    svg.style.minWidth = width + "px";
    svg.style.flexShrink = "0";

    horizontalScrollContainer.appendChild(svg);
    mainGraphArea.appendChild(horizontalScrollContainer);
}

function getCColor(carbon) {
    if (carbon < 0.5) {
        return "var(--low-carbon)";
    }
    if (carbon < 4.5) {
        return "var(--avg-carbon)";
    }
    return "var(--high-carbon)";
}

function drawCommitDots() {
    if (graphType === "timeline") {

        if (!pendingCommitDots) {
            return;
        }

        const horizontalPaths = document.querySelectorAll("#carbon-usage-graph-main-area > div > div");

        if (horizontalPaths.length === 0) {
            return;
        }

        horizontalPaths.forEach(horizontalPath => {
            const branchName = horizontalPath.querySelector("span").innerText;
            const horizontalLine = horizontalPath.querySelector("div");

            horizontalLine.querySelectorAll(".commit-dot").forEach(dot => dot.remove());

            const commitDots = pendingCommitDots[branchName];

            if (commitDots) {
                commitDots.forEach(commit => {
                    const commitDot = document.createElement("div");
                    commitDot.classList.add("commit-dot");
                    commitDot.style.width = "10px";
                    commitDot.style.height = "10px";
                    commitDot.style.borderRadius = "50%";
                    commitDot.style.position = "absolute";
                    commitDot.style.left = commit.xAxis + "px";
                    commitDot.style.background = getCColor(commit.carbon);
                    commitDot.style.transform = "translateY(-4px)";
                    commitDot.style.cursor = "pointer";

                    commitDot.addEventListener("mouseenter", (e) => {
                        hoverFunctionality.innerHTML = `<strong>${branchName}</strong><br/>
                                                        Carbon: ${commit.carbon}g CO2`;
                        hoverFunctionality.style.opacity = "1";
                    });

                    commitDot.addEventListener("mousemove", (e) => {
                        const position = container.getBoundingClientRect();
                        hoverFunctionality.style.left = (e.clientX - position.left + 12) + "px";
                        hoverFunctionality.style.top = (e.clientY - position.top - 20) + "px";
                    });

                    commitDot.addEventListener("mouseleave", () => {
                        hoverFunctionality.style.opacity = "0";
                    });

                    horizontalLine.appendChild(commitDot);

                });
            }
        });
    }
}

function makeButtons(text, id) {
    const button = document.createElement("div");
    button.innerText = text;
    button.id = id;
    button.style.cssText = `padding:4px 10px; font-size:12px; color:var(--text-color); z-index:1; display:flex; align-items:center; 
    justify-content:center; height:28px; font-weight:500; transition:color 0.2s ease;`;
    return button;
}

cumulativeGraphButton.addEventListener("click", () => {
    graphType = "cumulative";
    slider.style.transform = "translateX(0%)";

    cumulativeGraphButton.classList.add("toggle-active");
    cumulativeGraphButton.classList.remove("toggle-inactive");

    timelineGraphButton.classList.add("toggle-inactive");
    timelineGraphButton.classList.remove("toggle-active");

    drawGraphs();
});

timelineGraphButton.addEventListener("click", () => {
    graphType = "timeline";
    slider.style.transform = "translateX(calc(100% + 3px))";

    timelineGraphButton.classList.add("toggle-active");
    timelineGraphButton.classList.remove("toggle-inactive");

    cumulativeGraphButton.classList.add("toggle-inactive");
    cumulativeGraphButton.classList.remove("toggle-active");

    drawGraphs();
});
