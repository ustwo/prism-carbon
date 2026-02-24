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
    title.innerText = "Carbon Usage Timeline (Commits per branch)";
    title.style.margin = "10px";

    const mainGraphArea = document.createElement("div");
    mainGraphArea.id = "carbon-usage-graph-main-area";
    mainGraphArea.style.width = "100%";
    mainGraphArea.style.height = "240px";
    mainGraphArea.style.position = "relative";

    container.appendChild(title);
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
        return "#4CAF50";
    }
    if(carbon < 40){
        return "#FFC107";
    }
    return "#F44336";
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
                
            })
        }
    })
}

