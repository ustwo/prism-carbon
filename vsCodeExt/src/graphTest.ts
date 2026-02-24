export function getCColor(carbon : number) : string{
    if(carbon < 15){
        return "#4CAF50";
    }
    if(carbon < 40){
        return "#FFC107";
    }
    return "#F44336";
}