let pendingCommitDots = null;
let cumulativeGraphButton;
let timelineGraphButton;
let slider;
let graphType = "timeline";
let workspaceBranches = [];
let referenceStrip;
let hoverFunctionality;
let container;
let branchSelector;
let selectedBranch = "all";
let dynamicSizeChanger;
const branchSelectorTool = document.getElementById("branch-selector-tool");

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
    slider.style.width = "calc(50% - 6px)";
    slider.style.borderRadius = "999px";
    slider.style.transition = "transform 0.25s cubic-bezier(.4,0,.2,1)";
    slider.style.transform = "translateX(0%)";
    slider.style.background = "linear-gradient(to bottom, rgba(255,255,255,0.25), rgba(255,255,255,0.05))";
    slider.style.border = "1px solid rgba(0,0,0,0.35)";
    slider.style.boxShadow = `0 2px 6px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.15)`;
    slider.style.backdropFilter = "blur(4px)";

    timelineGraphButton = makeButtons("Timeline Graph", "timeline-button");
    cumulativeGraphButton = makeButtons("Cumulative Graph", "cumulative-button");

    timelineGraphButton.classList.add("toggle-active");
    cumulativeGraphButton.classList.add("toggle-inactive");

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
    toggleButtonContainer.appendChild(timelineGraphButton);
    toggleButtonContainer.appendChild(cumulativeGraphButton);

    references.appendChild(title);
    branchSelector = document.createElement("select");
    branchSelector.style.padding = "6px 34px 6px 14px";
    branchSelector.style.borderRadius = "999px";
    branchSelector.style.background = "linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0.05))";
    branchSelector.style.color = "var(--text-color)";
    branchSelector.style.border = "1px solid rgba(0,0,0,0.45)";
    branchSelector.style.fontSize = "13px";
    branchSelector.style.fontWeight = "500";
    branchSelector.style.cursor = "pointer";
    branchSelector.style.appearance = "none";
    branchSelector.style.transition = "all 0.2s ease";
    branchSelector.style.minWidth = "160px";
    branchSelector.style.boxShadow = `0 2px 6px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.55), inset 0 -1px 2px rgba(0, 0, 0, 0.2)`;
    branchSelector.style.backdropFilter = "blur(4px)";
    branchSelector.style.backgroundColor = "var(--base-variant)";
    branchSelector.style.color = "var(--text-color)";
    

    branchSelector.addEventListener("change", () => {
        selectedBranch = branchSelector.value;

        document.dispatchEvent(new CustomEvent("branchChangeEvent", {
            detail: {branch: selectedBranch}
        }));

        drawGraphs();
    });

    branchSelector.addEventListener("mouseenter", () => {
        branchSelector.style.boxShadow = `0 3px 8px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.7), inset 0 -1px 2px rgba(0, 0, 0, 0.25)`;

    });

    branchSelector.addEventListener("mouseleave", () => {
        branchSelector.style.boxShadow = `0 2px 6px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.55), inset 0 -1px 2px rgba(0, 0, 0, 0.2)`;

    });

    branchSelector.addEventListener("focus", () => {
        branchSelector.style.outline = "none";
        branchSelector.style.borderColor = "var(--text-color)";
    });

    branchSelector.addEventListener("blur", () => {
        branchSelector.style.borderColor = "var(--secondary-text)";
    });


    const branchSelectorWrapper = document.createElement("div");
    branchSelectorWrapper.style.position = "relative";
    branchSelectorWrapper.style.display = "inline-flex";
    branchSelectorWrapper.style.alignItems = "center";

    const dropDownArrow = document.createElement("div");
    dropDownArrow.innerHTML = "&#x25BC;";
    dropDownArrow.style.position = "absolute";
    dropDownArrow.style.right = "10px";
    dropDownArrow.style.pointerEvents = "none";
    dropDownArrow.style.fontSize = "12px";
    dropDownArrow.style.color = "var(--text-color)";

    const branchSelectorToolText = document.createElement("span");
    branchSelectorToolText.textContent = "Select branch to analyze:";
    branchSelectorToolText.style.marginRight = "10px";
    branchSelectorToolText.style.color = "var(--text-color)";

    branchSelectorWrapper.appendChild(branchSelectorToolText);
    branchSelectorWrapper.appendChild(branchSelector);
    branchSelectorWrapper.appendChild(dropDownArrow);

    if (branchSelectorTool) {
        branchSelectorTool.appendChild(branchSelectorWrapper);
    }

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
        branchSelector.innerHTML = "";
        const allBranchesOption = document.createElement("option");
        allBranchesOption.value = "all";
        allBranchesOption.textContent = "All Branches";
        branchSelector.appendChild(allBranchesOption);

        workspaceBranches.forEach(branch => {
            const option = document.createElement("option");
            option.value = branch;
            option.textContent = branch;
            branchSelector.appendChild(option);
        });
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

    workspaceBranches.filter(branch => selectedBranch === "all" || branch === selectedBranch).forEach((branch, index) => {
        const hue = Math.floor((index * 137.5 + 150) % 360);
        const branchColor = `hsl(${hue}, 70%, 80%)`;

        const horizontalPath = document.createElement("div");
        horizontalPath.style.display = "flex";
        horizontalPath.style.alignItems = "center";
        horizontalPath.style.paddingLeft = "12px";
        horizontalPath.style.width = "100%";

        const horizontalLine = document.createElement("div");
        horizontalLine.style.position = "relative";
        horizontalLine.dataset.branch = branch;
        horizontalLine.style.flex = "1";
        horizontalLine.style.height = "2px";
        horizontalLine.style.background = branchColor;

        horizontalPath.appendChild(horizontalLine);
        horizontalLineWrapper.appendChild(horizontalPath);
    });

    mainGraphArea.appendChild(horizontalLineWrapper);

    const xAxisTimeStamp = document.createElement("div");
    xAxisTimeStamp.id = "timestamp-on-x-axis";
    xAxisTimeStamp.style.position = "relative";
    xAxisTimeStamp.style.height = "18px";
    xAxisTimeStamp.style.fontSize = "11px";
    xAxisTimeStamp.style.padding = "4px 12px";
    xAxisTimeStamp.style.color = "var(--secondary-text)";
    xAxisTimeStamp.style.marginTop = "6px";
    xAxisTimeStamp.style.width = "100%";

    mainGraphArea.appendChild(xAxisTimeStamp);
}

function deleteBranches() {
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    mainGraphArea.innerHTML = "";
}

function drawGraphs() {

    deletePreviousGraph();

    if(!dynamicSizeChanger){
        enableDynamicSizeChanger();
    }

    if (graphType === "timeline") {
        if (referenceStrip) {
            referenceStrip.style.visibility = "visible";
        }

        if (workspaceBranches.length > 0) {
            drawCandleStickTimelineGraph();
        }

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
            .map((commit, index) => {
                netTotal += commit.carbon;
                return {
                    time: index,
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
    const timeScale = 40;

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
    const width = Math.max(oldWidth, maxTime * timeScale + margin.left + margin.right + 200);

    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    Object.keys(cumulativeGraphData).forEach(branch => {

        if(selectedBranch !== "all" && branch !== selectedBranch){
            return;
        }

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
            branchHeading.setAttribute("x", endPoint.x + 10);
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
    yAxisHeading.textContent = "Carbon (g CO₂)";
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
    if (carbon < 15) {
        return "var(--low-carbon)";
    }
    if (carbon < 40) {
        return "var(--avg-carbon)";
    }
    return "var(--high-carbon)";
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
    slider.style.transform = "translateX(100%)";

    cumulativeGraphButton.classList.add("toggle-active");
    cumulativeGraphButton.classList.remove("toggle-inactive");

    timelineGraphButton.classList.add("toggle-inactive");
    timelineGraphButton.classList.remove("toggle-active");

    drawGraphs();
});

timelineGraphButton.addEventListener("click", () => {
    graphType = "timeline";
    slider.style.transform = "translateX(0%)";

    timelineGraphButton.classList.add("toggle-active");
    timelineGraphButton.classList.remove("toggle-inactive");

    cumulativeGraphButton.classList.add("toggle-inactive");
    cumulativeGraphButton.classList.remove("toggle-active");

    drawGraphs();
});


function drawCandleStickTimelineGraph(){
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    
    if (!mainGraphArea || !pendingCommitDots) return;
    mainGraphArea.innerHTML = "";
    
    const allCommits = [];

    Object.keys(pendingCommitDots).forEach(branch => {

        if (selectedBranch !== "all" && branch !== selectedBranch) return;

        let cumulativeTotal = 0;

        pendingCommitDots[branch].forEach(commit => {
            cumulativeTotal = cumulativeTotal + commit.carbon;
            allCommits.push({
                branch: branch,
                carbon: commit.carbon,
                cumulative: cumulativeTotal,
                time: new Date(commit.timeStamp).getTime(),
                timeStamp: commit.timeStamp
            });
        });

    });
    if (allCommits.length === 0) return;

    allCommits.sort((a,b) => a.time - b.time);

    const pixelsPerCommit = 50;

    const width = Math.max(mainGraphArea.clientWidth, allCommits.length * pixelsPerCommit);
    const height = mainGraphArea.clientHeight;

    const margin = { top: 20, right: 60, bottom: 50, left: 60 };

    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    let minTime = Infinity;
    let maxTime = -Infinity;
    let maxCarbon = 0;

    allCommits.forEach(c => {
        if (c.time < minTime) {
            minTime = c.time;
        }
        if (c.time > maxTime) {
            maxTime = c.time;
        }
        if (c.carbon > maxCarbon) {
            maxCarbon = c.carbon;
        }
    });

    if (maxCarbon === 0) {
        maxCarbon = 1;
    }

    const startEdgePadding = (maxTime - minTime) * 0.08;
    minTime = minTime - startEdgePadding;
    maxTime = maxTime + startEdgePadding;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    allCommits.forEach(commit => {
        const xAxis = margin.left + ((commit.time - minTime)/(maxTime - minTime)) * graphWidth;
        const topYSpace = margin.top + graphHeight - (commit.carbon / maxCarbon) * graphHeight;
        const bottomYSpace = margin.top + graphHeight;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", xAxis);
        line.setAttribute("x2", xAxis);
        line.setAttribute("y1", bottomYSpace);
        line.setAttribute("y2", topYSpace);

        line.setAttribute("stroke", getCColor(commit.carbon));
        line.setAttribute("stroke-width", "5.5");

        line.style.cursor = "pointer";
        
        line.addEventListener("mouseenter", () => {
            const timeStamp = new Date(commit.timeStamp).toLocaleString();
            hoverFunctionality.innerHTML = `<strong>Branch:</strong> ${commit.branch}<br>
                                        <strong>Carbon emitted by this commit:</strong> ${commit.carbon.toFixed(2)} g CO₂<br>
                                        <strong>Carbon emitted so far:</strong> ${commit.cumulative.toFixed(2)} g CO₂<br>
                                        <strong>Time:</strong> ${timeStamp}`;
            hoverFunctionality.style.opacity = "1";
        });

        line.addEventListener("mousemove", (e) => {
            const rect = container.getBoundingClientRect();
            hoverFunctionality.style.left = (e.clientX - rect.left + 12) + "px";
            hoverFunctionality.style.top = (e.clientY - rect.top - 20) + "px";
        });

        line.addEventListener("mouseleave", () => {
            hoverFunctionality.style.opacity = "0";
        });

        svg.appendChild(line);
    });

    const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxisLine.setAttribute("x1", margin.left);
    xAxisLine.setAttribute("x2", width - margin.right);
    xAxisLine.setAttribute("y1", height - margin.bottom);
    xAxisLine.setAttribute("y2", height - margin.bottom);
    xAxisLine.setAttribute("stroke", "var(--text-color)");

    svg.appendChild(xAxisLine);

    const xMarkingsSpacing = 140;
    const xMarkings = Math.floor(graphWidth / xMarkingsSpacing);
    for (let i = 0; i <= xMarkings; i++) {
        const time = minTime + (i / xMarkings) * (maxTime - minTime);
        const xAxis = margin.left + ((time - minTime)/(maxTime - minTime)) * graphWidth;

        const heading = document.createElementNS("http://www.w3.org/2000/svg", "text");

        heading.setAttribute("x", xAxis);
        heading.setAttribute("y", height - margin.bottom + 18);
        heading.setAttribute("text-anchor", "middle");
        heading.setAttribute("font-size", "12");
        heading.setAttribute("fill", "var(--secondary-text)");

        heading.textContent = new Date(time).toLocaleString([], {
             day: "2-digit",
             month: "short",
             hour: "2-digit",
             minute: "2-digit"
            });

        svg.appendChild(heading);
    }

    const yAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxisLine.setAttribute("x1", margin.left);
    yAxisLine.setAttribute("x2", margin.left);
    yAxisLine.setAttribute("y1", margin.top);
    yAxisLine.setAttribute("y2", height - margin.bottom);
    yAxisLine.setAttribute("stroke", "var(--text-color)");

    svg.appendChild(yAxisLine);

    const yMarkings = 5;

    for (let i = 1; i <= yMarkings; i++) {
        const carbonEmitted = (i / yMarkings) * maxCarbon;
        const yAxis = margin.top + graphHeight - (carbonEmitted / maxCarbon) * graphHeight;

        const heading = document.createElementNS("http://www.w3.org/2000/svg", "text");

        heading.setAttribute("x", margin.left - 8);
        heading.setAttribute("y", yAxis + 3);
        heading.setAttribute("text-anchor", "end");
        heading.setAttribute("font-size", "12");
        heading.setAttribute("fill", "var(--secondary-text)");

        heading.textContent = carbonEmitted.toFixed(1) + "g";

        svg.appendChild(heading);
    }

    const now = Date.now();

    if(now >= minTime && now <= maxTime){
        const xAxisNow = margin.left + ((now - minTime)/(maxTime - minTime)) * graphWidth;
        const nowVerticalLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        nowVerticalLine.setAttribute("x1", xAxisNow);
        nowVerticalLine.setAttribute("x2", xAxisNow);
        nowVerticalLine.setAttribute("y1", margin.top);
        nowVerticalLine.setAttribute("y2", height - margin.bottom);
        nowVerticalLine.setAttribute("stroke", "var(--secondary-text)");
        nowVerticalLine.setAttribute("stroke-dasharray", "5 5");

        svg.appendChild(nowVerticalLine);

        const nowHeading = document.createElementNS("http://www.w3.org/2000/svg", "text");
        nowHeading.setAttribute("x", xAxisNow);
        nowHeading.setAttribute("y", margin.top - 6);
        nowHeading.setAttribute("text-anchor", "middle");
        nowHeading.setAttribute("font-size", "11");
        nowHeading.setAttribute("fill", "var(--secondary-text)");
        nowHeading.setAttribute("font-weight", "600");
        nowHeading.textContent = "Now";
        svg.appendChild(nowHeading);
    }

    const scrollContainer = document.createElement("div");
    scrollContainer.style.width = "100%";
    scrollContainer.style.height = "100%";
    scrollContainer.style.overflowX = "auto";
    scrollContainer.style.overflowY = "hidden";

    scrollContainer.appendChild(svg);
    mainGraphArea.appendChild(scrollContainer);

    setTimeout(() => {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth;
    }, 10);
}

function enableDynamicSizeChanger() {
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");

    if (!mainGraphArea){
        return;
    }

    if(dynamicSizeChanger){
        dynamicSizeChanger.disconnect();
    }

    dynamicSizeChanger = new ResizeObserver(() => {
        drawGraphs();
    });

    dynamicSizeChanger.observe(mainGraphArea);


}
