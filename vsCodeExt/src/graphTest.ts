export function getCColor(carbon : number) : string{
    if(carbon < 15){
        return "#4CAF50";
    }
    if(carbon < 40){
        return "#FFC107";
    }
    return "#F44336";
}

export const carbonEmissionReferenceStrip = [
    {label : "Low Emission" , max: 15 , color: "#4CAF50"},
    {label : "Average Emission" , max: 40 , color: "#FFC107"},
    {label : "High Emission" , max: Infinity , color: "#F44336"},
];