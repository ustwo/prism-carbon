const ref = document.getElementById("branchGraph");

if(ref){
    const container = document.createElement("div");
    container.id = "carbon-graph-wrapper";
    container.style.width = "100%";
    container.style.height = "300px";
    container.style.position = "relative";
    container.style.border = "1px solid #ccc";
    container.style.borderRadius = "8px";
    container.style.background = "#f9f9f9";

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

        const graphHeading = document.createElement("span");
        graphHeading.innerText = branch;
        graphHeading.style.width = "150px";
        graphHeading.style.color = "var(--text-color)";
        graphHeading.style.fontSize = "12px";

        horizontalPath.appendChild(graphHeading);
        horizontalLineWrapper.appendChild(horizontalPath);
    });

    mainGraphArea.appendChild(horizontalLineWrapper);
    ref.appendChild(container);
}

