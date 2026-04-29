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
let selectedBranches = new Set();
let dynamicSizeChanger;
const branchSelectorTool = document.getElementById("branch-selector-tool");
let dropDownTool;
let displaySelectedBranchesCount;
let zoom = 1;
const zoomGap = 1.5;
const minZoom = 1;
const maxZoom = 100;

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
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.overflow = "hidden";

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

        const verticalRectangle = document.createElement("div");
        verticalRectangle.style.width = "5.5px";
        verticalRectangle.style.height = "16px";
        verticalRectangle.style.borderRadius = "2px";
        verticalRectangle.style.background = strip.color;
        verticalRectangle.style.display = "inline-block";
        verticalRectangle.style.boxShadow = "inset 0 0 1px rgba(0, 0, 0, 0.2)";

        const heading = document.createElement("span");
        heading.innerText = strip.label;
        heading.style.color = "var(--text-color)";

        reference.appendChild(verticalRectangle);
        reference.appendChild(heading);
        referenceStrip.appendChild(reference);
    });

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.margin = "10px";
    header.style.flexWrap = "wrap";
    header.style.gap = "8px";

    const references = document.createElement("div");
    references.style.display = "flex";
    references.style.alignItems = "center";
    references.style.gap = "14px";
    references.style.flexWrap = "wrap";

    title.innerText = "Carbon Usage Timeline (Commits per branch)";

    const toggleButtonContainer = document.createElement("div");
    toggleButtonContainer.style.display = "grid";
    toggleButtonContainer.style.gridTemplateColumns = "1fr 1fr";
    toggleButtonContainer.style.border = "1px solid var(--secondary-text)";
    toggleButtonContainer.style.borderRadius = "999px";
    toggleButtonContainer.style.padding = "3px";
    toggleButtonContainer.style.cursor = "pointer";
    toggleButtonContainer.style.position = "relative";

    const zoomButtonWrapper = document.createElement("div");
    zoomButtonWrapper.style.display = "flex";
    zoomButtonWrapper.style.flexDirection = "column";
    zoomButtonWrapper.style.alignItems = "center";
    zoomButtonWrapper.style.gap = "4px";
    zoomButtonWrapper.style.marginLeft = "10px";

    const zoomHeading = document.createElement("span");
    zoomHeading.textContent = "Zoom";
    zoomHeading.style.fontSize = "12px";
    zoomHeading.style.opacity = "0.7";

    const zoomButtonControls = document.createElement("div");
    zoomButtonControls.style.display = "flex";
    zoomButtonControls.style.gap = "6px";

    function makeZoomButton(symbol){
        const button = document.createElement("div");
        button.textContent = symbol;
        button.style.padding = "4px 10px";
        button.style.cursor = "pointer";
        button.style.border = "1px solid var(--secondary-text)";
        button.style.borderRadius = "6px";
        button.style.userSelect = "none";
        button.style.fontSize = "13px";
        button.style.transition = "all 0.15s ease";
        button.addEventListener("mouseenter", () => {
            button.style.background = "rgba(255, 255, 255, 0.08)";
        });
        button.addEventListener("mouseleave", () => {
            button.style.background = "transparent";
        });
        return button;
    }

    const zoomInButton = makeZoomButton("+");
    const zoomOutButton = makeZoomButton("−");

    zoomInButton.onclick = () => {
        zoom = Math.min(zoom * zoomGap, maxZoom);
        drawGraphs();
    }

    zoomOutButton.onclick = () => {
        zoom = Math.max(zoom / zoomGap, minZoom);
        drawGraphs();
    }

    zoomButtonControls.appendChild(zoomOutButton);
    zoomButtonControls.appendChild(zoomInButton);
    zoomButtonWrapper.appendChild(zoomHeading);
    zoomButtonWrapper.appendChild(zoomButtonControls);

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
    mainGraphArea.style.height = "auto";
    mainGraphArea.style.position = "relative";
    mainGraphArea.style.flex = "1";

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

    branchSelector = document.createElement("div");
    branchSelector.style.position = "relative";
    branchSelector.style.minWidth = "180px";

    const dropdownButton = document.createElement("div");
    dropdownButton.textContent = "Select branches to analyze";
    dropdownButton.style.padding = "6px 14px";
    dropdownButton.style.borderRadius = "999px";
    dropdownButton.style.border = "1px solid rgba(255, 255, 255, 0.15)";
    dropdownButton.style.cursor = "pointer";
    dropdownButton.style.background = "rgba(255, 255, 255, 0.05)";
    dropdownButton.style.backdropFilter = "blur(8px)";
    dropdownButton.style.color = "var(--text-color)";
    dropdownButton.style.fontSize = "13px";
    dropdownButton.style.minWidth = "220px";
    dropdownButton.style.transition = "all 0.25s ease";
    dropdownButton.style.display = "flex";
    dropdownButton.style.alignItems = "center";
    dropdownButton.style.justifyContent = "space-between";   
    dropdownButton.style.gap = "8px"; 
    dropdownButton.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.25)";

    displaySelectedBranchesCount = document.createElement("span");
    displaySelectedBranchesCount.style.fontSize = "11px";
    displaySelectedBranchesCount.style.fontWeight = "500";
    displaySelectedBranchesCount.style.opacity = "0.75";
    displaySelectedBranchesCount.style.whiteSpace = "nowrap";
    displaySelectedBranchesCount.style.color = "var(--text-color)";
    displaySelectedBranchesCount.style.padding = "4px 10px";
    displaySelectedBranchesCount.style.borderRadius = "999px";
    displaySelectedBranchesCount.style.background = "rgba(255, 255, 255, 0.08)";
    displaySelectedBranchesCount.style.border = "1px solid var(--secondary-text)";

    const dropDownArrow = document.createElement("span");
    dropDownArrow.innerHTML = "&#x25BC;";
    dropDownArrow.style.fontSize = "10px";
    dropDownArrow.style.opacity = "0.7";

    dropdownButton.appendChild(dropDownArrow);


    dropDownTool = document.createElement("div");
    dropDownTool.style.position = "absolute";
    dropDownTool.style.top = "110%";
    dropDownTool.style.left = "0";
    dropDownTool.style.background = "var(--base-variant)";
    dropDownTool.style.backdropFilter = "blur(10px)";
    dropDownTool.style.border = "1px solid rgba(255, 255, 255, 0.1)";
    dropDownTool.style.borderRadius = "8px";
    dropDownTool.style.padding = "8px";
    dropDownTool.style.display = "none";    
    dropDownTool.style.zIndex = "1000";
    dropDownTool.style.maxHeight = "200px";
    dropDownTool.style.overflowY = "auto";
    dropDownTool.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.4)";
    dropDownTool.style.animation = "fadeIn 0.2s ease";
    
    dropdownButton.addEventListener("click", () => {
        dropDownTool.style.display = dropDownTool.style.display === "none" ? "block" : "none";
    });

    dropdownButton.addEventListener("mouseenter", () => {
        dropdownButton.style.transform = "translateY(-1px)";
        dropdownButton.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.35)";
    });

    dropdownButton.addEventListener("mouseleave", () => {
        dropdownButton.style.transform = "translateY(0)";
        dropdownButton.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.25)";
    });

    branchSelector.appendChild(dropdownButton);
    branchSelector.appendChild(dropDownTool);

    const branchSelectorWrapper = document.createElement("div");
    branchSelectorWrapper.style.position = "relative";
    branchSelectorWrapper.style.display = "flex";
    branchSelectorWrapper.style.alignItems = "center";
    branchSelectorWrapper.style.gap = "10px";

    const branchSelectorToolText = document.createElement("span");
    branchSelectorToolText.textContent = "Branch Selection:";
    branchSelectorToolText.style.color = "var(--text-color)";

    branchSelectorWrapper.appendChild(branchSelectorToolText);
    branchSelectorWrapper.appendChild(branchSelector);
    branchSelectorWrapper.appendChild(displaySelectedBranchesCount);

    if (branchSelectorTool) {
        branchSelectorTool.appendChild(branchSelectorWrapper);
    }

    references.appendChild(toggleButtonContainer);
    references.appendChild(zoomButtonWrapper);

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
        if(JSON.stringify(workspaceBranches) === JSON.stringify(message.data)) return;
        workspaceBranches = message.data;
        dropDownTool.innerHTML = "";

        selectedBranches.clear();

        workspaceBranches.forEach(branch => {
            const heading = document.createElement("label");
            heading.style.display = "flex";
            heading.style.alignItems = "center";
            heading.style.gap = "8px";
            heading.style.cursor = "pointer";

            heading.addEventListener("mouseenter", () => {
                heading.style.background = "rgba(255, 255, 255, 0.05)";
                heading.style.borderRadius = "6px";
            });

            heading.addEventListener("mouseleave", () => {
                heading.style.background = "transparent";
            });

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.style.accentColor = "#4ade80";
            checkbox.style.cursor = "pointer";

            selectedBranches.add(branch);

            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    selectedBranches.add(branch);
                }
                else {
                    selectedBranches.delete(branch);
                }
                updateSelectedBranchesCount();
                drawGraphs();

                if (window.vscodeAPI) {
                    window.vscodeAPI.postMessage({ 
                        command: 'filterByBranch', 
                        branches: Array.from(selectedBranches) 
                    });
                }
            });

            const branchName = document.createElement("span");
            branchName.innerText = branch;

            heading.appendChild(checkbox);
            heading.appendChild(branchName);

            dropDownTool.appendChild(heading);

        });

        updateSelectedBranchesCount();
        
    }
});

function deletePreviousGraph() {

    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    mainGraphArea.innerHTML = "";
}

function drawGraphs() {
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    const currentScroll = mainGraphArea.querySelector("div");

    let scrollRatio = 1;

    if(currentScroll){
        const maxScroll = currentScroll.scrollWidth - currentScroll.clientWidth;
        if(maxScroll > 0){
            scrollRatio = currentScroll.scrollLeft / maxScroll;
        }
    }

    deletePreviousGraph();

    if(!dynamicSizeChanger){
        enableDynamicSizeChanger();
    }

    if (graphType === "timeline") {
        if (referenceStrip) {
            referenceStrip.style.visibility = "visible";
        }

        drawCandleStickTimelineGraph(scrollRatio);

    }
    else {
        if (referenceStrip) {
            referenceStrip.style.visibility = "hidden";
        }

        drawCumulativeGraph(scrollRatio);
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

function drawCumulativeGraph(scrollRatio = 1) {
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const height = mainGraphArea.clientHeight;
    const margin = { top: 20, right: 40, bottom: 40, left: 60 };
    let maxTime = 0;
    let maxCarbon = 0;
    const timeScale = 40 * zoom;

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

    const graphHeight = height - margin.top - margin.bottom;

    Object.keys(cumulativeGraphData).forEach(branch => {

        if(!selectedBranches.has(branch)){
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
    yAxisHeading.setAttribute("x", -65);
    yAxisHeading.setAttribute("y", height / 1.6);
    yAxisHeading.setAttribute("fill", "var(--text-color)");
    yAxisHeading.setAttribute("transform", `rotate(-90 15 ${height / 2})`);
    yAxisHeading.textContent = "Carbon (g CO₂)";
    svg.appendChild(yAxisHeading);

    const xAxisHeading = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xAxisHeading.setAttribute("x", 60);
    xAxisHeading.setAttribute("y", height - 20);
    xAxisHeading.setAttribute("fill", "var(--text-color)");
    xAxisHeading.setAttribute("text-anchor", "start");
    xAxisHeading.setAttribute("dominant-baseline", "middle");
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

    setTimeout(() => {
        const maxScroll = horizontalScrollContainer.scrollWidth - horizontalScrollContainer.clientWidth;
        horizontalScrollContainer.scrollLeft = maxScroll * scrollRatio;
    }, 10);
}

function getCColor(carbon) {
    if (carbon < 30) {
        return "var(--low-carbon)";
    }
    if (carbon < 80) {
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


function drawCandleStickTimelineGraph(scrollRatio = 1){
    if (selectedBranches.size === 0) {
        return;
    }
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    
    if (!mainGraphArea || !pendingCommitDots) return;
    
    const allCommitsMap = new Map();

    Object.keys(pendingCommitDots).forEach(branch => {

        if(!selectedBranches.has(branch)) {
            return;
        }

        pendingCommitDots[branch].forEach(commit => {
            const time = new Date(commit.timeStamp).getTime();
            const match = branch + "_" + time;

            if(!allCommitsMap.has(match)){
                allCommitsMap.set(match, {
                    branch: branch,
                    carbon: 0,
                    time: time,
                    timeStamp: commit.timeStamp
                });
            }
            const findMatch = allCommitsMap.get(match);
            findMatch.carbon = findMatch.carbon + commit.carbon;
        });

    });

    const allCommits = Array.from(allCommitsMap.values());

    allCommits.sort((a,b) => a.time - b.time);

    const branchTotals = {};

    allCommits.forEach(commit => {
        if (!branchTotals[commit.branch]) {
            branchTotals[commit.branch] = 0;
        }
        
        branchTotals[commit.branch] = branchTotals[commit.branch] + commit.carbon;
        commit.cumulative = branchTotals[commit.branch];
    });

    if (allCommits.length === 0) return;

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

    const margin = { top: 20, right: 60, bottom: 50, left: 60 };

    const timeDifference = maxTime - minTime;
    const pixelsPerMilliseconds = (mainGraphArea.clientWidth / timeDifference) * zoom;

    const width = Math.max(mainGraphArea.clientWidth, (maxTime - minTime) * pixelsPerMilliseconds + margin.left + margin.right);
    const height = mainGraphArea.clientHeight;

    const graphHeight = height - margin.top - margin.bottom;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    allCommits.forEach(commit => {
        const xAxis = margin.left + (commit.time - minTime) * pixelsPerMilliseconds;
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


    const millisecondsPerPixel = 1 / pixelsPerMilliseconds;
    const millisecondsGap = 100 * millisecondsPerPixel;

    const intervals = [60 * 60 * 1000,
        2 * 60 * 60 * 1000,
        4 * 60 * 60 * 1000,
        8 * 60 * 60 * 1000,
        12 * 60 * 60 * 1000,
        24 * 60 * 60 * 1000,
    ];

    let selectedInterval = intervals[intervals.length - 1];

    for (let interval of intervals) {
        if (interval >= millisecondsGap) {
            selectedInterval = interval;
            break;
        }
    }
    let currentTime = Math.ceil(minTime / selectedInterval) * selectedInterval;

    while (currentTime <= maxTime) {
        const xMarkingsSpacing = margin.left + (currentTime - minTime) * pixelsPerMilliseconds;

        const xAxisHeading = document.createElementNS("http://www.w3.org/2000/svg", "text");
        xAxisHeading.setAttribute("x", xMarkingsSpacing);
        xAxisHeading.setAttribute("y", height - margin.bottom + 18);
        xAxisHeading.setAttribute("text-anchor", "middle");
        xAxisHeading.setAttribute("font-size", "10");
        xAxisHeading.setAttribute("fill", "var(--secondary-text)");

        if(selectedInterval < 24 * 60 * 60 * 1000){
            xAxisHeading.textContent = new Date(currentTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            });
        }
        else{
            xAxisHeading.textContent = new Date(currentTime).toLocaleDateString([], {
                day: "2-digit",
                month: "short"
            });
        }
        svg.appendChild(xAxisHeading);

        currentTime = currentTime + selectedInterval;
    }

    let lastDisplayedDay = null;
    currentTime = Math.ceil(minTime / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);

    while (currentTime <= maxTime) {
        const date = new Date(currentTime);
        const day = date.toDateString();
        const xMarkingsSpacing = margin.left + (currentTime - minTime) * pixelsPerMilliseconds;

        if (day !== lastDisplayedDay) {
            const dateHeading = document.createElementNS("http://www.w3.org/2000/svg", "text");
            dateHeading.setAttribute("x", xMarkingsSpacing);
            dateHeading.setAttribute("y", height - margin.bottom + 34);
            dateHeading.setAttribute("text-anchor", "start");
            dateHeading.setAttribute("font-size", "10");
            dateHeading.setAttribute("fill", "var(--text-color)");
            dateHeading.setAttribute("font-weight", "500");
            dateHeading.style.opacity = "0.8";

            dateHeading.textContent = date.toLocaleDateString([], {
                day: "2-digit",
                month: "short"
            });

            svg.appendChild(dateHeading);
            lastDisplayedDay = day;
        }
        currentTime = currentTime + (24 * 60 * 60 * 1000);
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
        heading.setAttribute("font-size", "10");
        heading.setAttribute("fill", "var(--secondary-text)");

        heading.textContent = carbonEmitted.toFixed(1) + "g";

        svg.appendChild(heading);
    }

    const now = Date.now();

    if(now >= minTime && now <= maxTime){
        const xAxisNow = margin.left + (now - minTime) * pixelsPerMilliseconds;
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
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        scrollContainer.scrollLeft = maxScroll * scrollRatio;
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

function updateSelectedBranchesCount(){
    const branchCount = selectedBranches.size;

    if(branchCount === 0){
        displaySelectedBranchesCount.textContent = "No branches selected";
    }
    else if(branchCount === workspaceBranches.length){
        displaySelectedBranchesCount.textContent = "All branches selected";
    }
    else {
        displaySelectedBranchesCount.textContent = `${branchCount} branch${branchCount > 1 ? "es" : ""} selected`;
    }
}