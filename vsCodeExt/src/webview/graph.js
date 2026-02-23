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

    const exampleMockBranches = ["main", "customer/sign-up", "customer/favourites", "component/footer"];

    const horizontalLineWrapper = document.createElement("div");
    horizontalLineWrapper.style.display = "flex";
    horizontalLineWrapper.style.flexDirection = "column";
    horizontalLineWrapper.style.height = "100%";
    horizontalLineWrapper.style.justifyContent = "space-evenly";

    exampleMockBranches.forEach(branch => {

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
    ref.appendChild(container);
}


window.addEventListener("message", event => {
    const message = event.data;
    if(message.command === "commitDots"){
        const commitData = message.data;
        const horizontalPaths = document.querySelectorAll("#carbon-usage-graph-main-area > div > div");

        horizontalPaths.forEach(horizontalPath => {
            const branchName = horizontalPath.querySelector("span").innerText;
            const horizontalLine = horizontalPath.querySelector("div");

            const commitDots = commitData[branchName];

            if(commitDots){
                commitDots.forEach(commit => {
                    const commitDot = document.createElement("div");
                    commitDot.style.width = "10px";
                    commitDot.style.height = "10px";
                    commitDot.style.borderRadius = "50%";
                    commitDot.style.background = "var(--primary-color)";
                    commitDot.style.position = "absolute";
                    commitDot.style.left = commit + "px";
                    commitDot.style.transform = "translateY(-4px)";

                    horizontalLine.style.position = "relative";
                    horizontalLine.appendChild(commitDot);
                    
                })
            }
        })
    }
});

