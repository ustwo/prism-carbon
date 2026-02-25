let pendingCommitDots = null;

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
    title.style.margin = "0px";

    const toggleButtonContainer = document.createElement("div");
    toggleButtonContainer.style.display = "flex";

    const cumulativeGraphButton = document.createElement("div");
    cumulativeGraphButton.innerText = "Cumulative Graph";

    const timelineGraphButton = document.createElement("div");
    timelineGraphButton.innerText = "Timeline Graph";

    const mainGraphArea = document.createElement("div");
    mainGraphArea.id = "carbon-usage-graph-main-area";
    mainGraphArea.style.width = "100%";
    mainGraphArea.style.height = "240px";
    mainGraphArea.style.position = "relative";

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
        drawCommitDots();
    }

    if(message.command === "workspaceBranches"){
        const branches = message.data;

        const mainGraphArea = document.getElementById("carbon-usage-graph-main-area");
        mainGraphArea.innerHTML = "";

        const horizontalLineWrapper = document.createElement("div");
        horizontalLineWrapper.style.display = "flex";
        horizontalLineWrapper.style.flexDirection = "column";
        horizontalLineWrapper.style.height = "100%";
        horizontalLineWrapper.style.justifyContent = "space-evenly";

        branches.forEach(branch => {

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
            horizontalLine.style.flex = "1";
            horizontalLine.style.height = "2px";
            horizontalLine.style.background = "var(--secondary-text)";
            horizontalLine.style.marginLeft = "10px";

            horizontalPath.appendChild(graphHeading);
            horizontalPath.appendChild(horizontalLine);
            horizontalLineWrapper.appendChild(horizontalPath);
        });

        mainGraphArea.appendChild(horizontalLineWrapper);

        drawCommitDots();
    }
});

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

                horizontalLine.style.position = "relative";
                horizontalLine.appendChild(commitDot);
                
            });
        }
    });
}

