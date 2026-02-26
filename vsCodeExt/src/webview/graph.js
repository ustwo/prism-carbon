let pendingCommitDots = null;
let cumulativeGraphButton;
let timelineGraphButton;
let slider;
let graphType = "cumulative"
let workspaceBranches = [];

const ref = document.getElementById("branchGraph");

if(ref){
    const container = document.createElement("div");
    container.id = "carbon-graph-wrapper";
    container.style.width = "100%";
    container.style.height = "300px";
    container.style.position = "relative";
    container.style.border = "1px solid var(--secondary-text)";
    container.style.borderRadius = "8px";
    container.style.background = "var(--base-variant)";
    container.style.color = "var(--text-color)";

    const title = document.createElement("h3");
    const referenceStrip = document.createElement("div");
    referenceStrip.style.display = "flex";
    referenceStrip.style.gap = "16px";
    referenceStrip.style.fontSize = "12px";
    referenceStrip.style.alignItems = "center";
    [
        {label: "Low Emission" , color: "var(--low-carbon)"},
        {label: "Average Emission" , color: "var(--avg-carbon)"},
        {label: "High Emission" , color: "var(--high-carbon)"},
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
    slider.style.border = "1px solid rgba(0,0,0,0.35)"
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
    if(message.command === "commitDots"){
        pendingCommitDots = message.data;
        drawGraphs();
    }

    if(message.command === "workspaceBranches"){
        workspaceBranches = message.data;
        drawGraphs();
    }
});

function deletePreviousGraph(){

    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    mainGraphArea.querySelectorAll("svg").forEach(svg => svg.remove());

    const horizontalPaths = document.querySelectorAll("#carbon-usage-graph-main-area > div > div");

    horizontalPaths.forEach(horizontalPath => {
        const horizontalLine = horizontalPath.querySelector("div");
        horizontalLine.querySelectorAll(".commit-dot").forEach(dot => dot.remove());
    });
}

function buildGraph(){
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
        mainGraphArea.innerHTML = "";

        const horizontalLineWrapper = document.createElement("div");
        horizontalLineWrapper.style.display = "flex";
        horizontalLineWrapper.style.flexDirection = "column";
        horizontalLineWrapper.style.height = "100%";
        horizontalLineWrapper.style.justifyContent = "space-evenly";

        workspaceBranches.forEach(branch => {

            const horizontalPath = document.createElement("div");
            horizontalPath.style.display = "flex";
            horizontalPath.style.alignItems = "center";
            horizontalPath.style.paddingLeft = "12px";

            const graphHeading = document.createElement("span");
            graphHeading.innerText = branch;
            graphHeading.style.width = "150px";
            graphHeading.style.color = "var(--text-color)";
            graphHeading.style.fontSize = "14px";
            graphHeading.style.fontWeight = "500";

            const horizontalLine = document.createElement("div");
            horizontalLine.style.position = "relative";
            horizontalLine.style.flex = "1";
            horizontalLine.style.height = "2px";
            horizontalLine.style.background = "var(--secondary-text)";
            horizontalLine.style.marginLeft = "10px";

            horizontalPath.appendChild(graphHeading);
            horizontalPath.appendChild(horizontalLine);
            horizontalLineWrapper.appendChild(horizontalPath);
        });

        mainGraphArea.appendChild(horizontalLineWrapper);
}

function deleteBranches(){
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    mainGraphArea.innerHTML = "";
}

function drawGraphs(){

    deletePreviousGraph();

    if(graphType === "timeline"){
        if(workspaceBranches.length === 0){
            return;
        }
        buildGraph();
        drawCommitDots();
    }
    else{
        deleteBranches();
        drawCumulativeGraph();
    }
}

function getCumulativeGraphData(){
    if(!pendingCommitDots){
        return{};
    } 

    const cumulativeGraphData = {};

    Object.keys(pendingCommitDots).forEach(branch => {
        let netTotal = 0;

        cumulativeGraphData[branch] = [...pendingCommitDots[branch]]
        .sort((a, b) => a.xAxis - b.xAxis)
        .map(commit => {
            netTotal += commit.carbon;
            return{
                time: commit.xAxis,
                netCarbon: netTotal
            }
        });
    });
    return cumulativeGraphData;

}

function drawCumulativeGraph(){
    const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.width = "100%";
    svg.style.height = "100%"

    const cumulativeGraphData = getCumulativeGraphData();

    Object.keys(cumulativeGraphData).forEach(branch => {

        let graphPoints = "";

        cumulativeGraphData[branch].forEach(graphPoint => {
            const xAxis = graphPoint.time;
            const yAxis = 240 - (graphPoint.netCarbon / 5);

            graphPoints += `${xAxis},${yAxis} `;
        });

        const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");

        path.setAttribute("points" , graphPoints);
        path.setAttribute("fill" , "none");
        path.setAttribute("stroke" , "var(--primary-color)");
        path.setAttribute("stroke-width" , "2");

        svg.appendChild(path);
    });
    mainGraphArea.appendChild(svg);
}

function getCColor(carbon){
    if(carbon < 15){
        return "var(--low-carbon)";
    }
    if(carbon < 40){
        return "var(--avg-carbon)";
    }
    return "var(--high-carbon)";
}

function drawCommitDots(){
    if (graphType === "timeline"){

        if (!pendingCommitDots){
            return;
        } 

        const horizontalPaths = document.querySelectorAll("#carbon-usage-graph-main-area > div > div");

        if (horizontalPaths.length === 0){
            return;
        } 

        horizontalPaths.forEach(horizontalPath => {
            const branchName = horizontalPath.querySelector("span").innerText;
            const horizontalLine = horizontalPath.querySelector("div");

            horizontalLine.querySelectorAll(".commit-dot").forEach(dot => dot.remove());

            const commitDots = pendingCommitDots[branchName];

            if(commitDots){
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

                    horizontalLine.appendChild(commitDot);
                    
                });
            }
        });
    }
}

function makeButtons(text, id){
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
