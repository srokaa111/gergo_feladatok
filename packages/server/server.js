import express from "express";
import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const data = JSON.parse(readFileSync("cargo.json", "utf-8"));
const DANGEROUS_CARGO_SURCHARGE = 0.5;
const app = express();
app.listen(8000);
app.use(express.json());
app.use(express.static(path.join(__dirname, ".." ,"client")));

function addCargoToFlights(cargoData, flights){
    cargoData.price = flights.reduce((totalPrice, flight) => flight.pricePerKg * cargoData.weight, 0);
    console.log(data.packages.at(-1))
    cargoData.trackingNumber = data.packages.length ? `TRK-${String(Number(data.packages.at(-1).trackingNumber.split('-')[1]) + 1).padStart(4,'0')}` : "TRK-0001";
    if (cargoData.dangerous) cargoData.price *= 1 + DANGEROUS_CARGO_SURCHARGE;
    data.packages.push({...cargoData, flights:flights.map(flight => flight.flightNumber)});
    data.active_flights.forEach(flight => flights.includes(flight) ? flight.currentWeight += cargoData.weight : {});
    writeFile("cargo.json", JSON.stringify(data), "utf-8");
    return cargoData.trackingNumber;
}

function logSecurityBreach(clientIP){
    const logEntry = `Illegal attempt from: ${clientIP} at: ${(new Date).toISOString()}\n`;
    writeFile("security_breach.log", logEntry, {flag :"a", encoding: "utf-8"});
}

function isProhibited(cargoData){
    return data.airports_and_zones.find(airport => airport.code === cargoData.destination).prohibited_items.includes(cargoData.category) ||
    data.airports_and_zones.find(airport => airport.code === cargoData.source).prohibited_items.includes(cargoData.category);
}

function findCargoFlights(cargoData, clientIP){
    if (isProhibited(cargoData)){
        logSecurityBreach(clientIP)
        return {code: 400}
    }
    const directFlight = data.active_flights.find(flight => flight.departure === cargoData.source && flight.arrival === cargoData.destination && flight.status === "Loading");
    if (directFlight && directFlight.maxWeightCapacity - directFlight.currentWeight >= cargoData.weight){
        const trackingNumber = addCargoToFlights(cargoData, [directFlight]);
        return {code: 200, trackingNumber:trackingNumber};
    }
    else{
        const flights = findShortestPath(cargoData);
        if (flights){
            const trackingNumber = addCargoToFlights(cargoData, flights);
            return {code: 200, trackingNumber:trackingNumber};
        }
    }
        return {code: 422}
}

function findShortestPath(cargoData){
    const startNode = cargoData.source;
    const endNode = cargoData.destination;
    const possibleFlights = data.active_flights.filter(flight => flight.status === "Loading" && 
        flight.maxWeightCapacity - flight.currentWeight >= cargoData.weight &&
        !data.airports_and_zones.find(airport => airport.code === flight.arrival).prohibited_items.includes(cargoData.category)
    )
    const pathWeights = possibleFlights.reduce((accumulator, flight) => {
        if (!accumulator[flight.departure]) accumulator[flight.departure] = {};
        if (!accumulator[flight.departure][flight.arrival] || accumulator[flight.departure][flight.arrival] > flight.pricePerKg){
            accumulator[flight.departure][flight.arrival] = flight.pricePerKg;
        }
        return accumulator
    },  
    {});
    /*
    {
        BUD = {FRA: 10, JFK: 5, LHR: 3},
        JFK = {FRA: 4, BUD: 6},
        stb...
        honnan = {hova:mennyi(legolcsóbb)}
    }
    */
    if (!pathWeights[startNode]) return false;
    const totalPricePerKgToNode = [];
    const previousNode = {};
    for (let node in pathWeights) node === startNode ? totalPricePerKgToNode.push({node: node, totalPrice: 0}) : totalPricePerKgToNode.push({node: node, totalPrice: Infinity});
    if (!totalPricePerKgToNode.map(element => element.node).includes(endNode)) totalPricePerKgToNode.push({node: endNode, totalPrice: Infinity})
    let node = startNode;
    while (node !== endNode){
        const priceToNode = totalPricePerKgToNode.splice(totalPricePerKgToNode.findIndex(element => element.node === node), 1)[0].totalPrice;
        for (let destination in pathWeights[node]){
            const nodeInTotalPrice = totalPricePerKgToNode.find(element => element.node === destination);
            if (nodeInTotalPrice && nodeInTotalPrice.totalPrice > priceToNode + pathWeights[node][destination]){
                nodeInTotalPrice.totalPrice = priceToNode + pathWeights[node][destination];
                previousNode[destination] = node
            }
        }
        totalPricePerKgToNode.sort((a,b) => a.totalPrice - b.totalPrice);
        node = totalPricePerKgToNode[0].node;
    }
    if (totalPricePerKgToNode[0].totalPrice === Infinity) return false;
    const path = [endNode];
    while (node !== startNode){
        node = previousNode[node];
        path.unshift(node);
    }
    const flights = []
    for (let i = 0; i < path.length - 1; i++){
        flights.push(possibleFlights.reduce((cheapestFlight, flight) => flight.departure === path[i] && flight.arrival === path[i + 1] && flight.pricePerKg < cheapestFlight.pricePerKg ? flight : cheapestFlight, {pricePerKg: Infinity}))
    }
    return flights;
}

function getPackageStatus(targetPackage){
    const packageFlights = data.active_flights.filter(flight => targetPackage.flights.includes(flight.flightNumber));
    if (packageFlights.map(flight => flight.status).includes("In transit")) return "In transit";
    return "Loading";
}

app.post("/api/packages/register", (req, res) =>{
    const cargoData = req.body.cargoData;
    const pathingResult = findCargoFlights(cargoData, req.ip);
    switch (pathingResult.code){
        case 400:
            res.status(pathingResult.code).send("Security breach: Attempting to send prohibited item. Your attempt has been logged.");
            break;
        case 200:
            res.status(pathingResult.code).send(`Package sent successfully. You can track it by its tracking code: ${pathingResult.trackingNumber}`);
            break;
        case 422:
            res.status(pathingResult.code).send("Package could not be sent. No flights available. Please check back at a later time.");
            break;
    }
})

app.patch("/api/flights/:flightId/depart", (req, res) =>{
    const flightId = req.params.flightId;
    const targetFlight = data.active_flights.find(flight => flight.flightNumber === flightId);
    if (!targetFlight) return res.status(404).send("Flight not found");
    if (targetFlight.status === "In transit") return res.status(400).send("Flight already in transit");
    targetFlight.status = "In transit";
    writeFile("cargo.json", JSON.stringify(data), "utf-8");
    res.status(200).send("Flight departed successfully");
})

app.get("/api/data/all", (req, res) =>{
    res.json(data);
})

app.get("/api/data/packages", (req, res) =>{
    res.json(data.packages);
})

app.get("/api/data/flights", (req, res) =>{
    res.json(data.active_flights);
})

app.get("/api/packages/search", (req, res) =>{
    const trackingId = req.query.id ? req.query.id : null;
    const trackingStatus = req.query.status ? req.query.status : null;
    const trackingMinWeight = req.query.minWeight ? Number(req.query.minWeight) : null;
    res.json(data.packages.filter(targetPackage =>
        (!trackingId || targetPackage.trackingNumber.toLowerCase().includes(trackingId.toLowerCase())) &&
        (!trackingStatus || trackingStatus === getPackageStatus(targetPackage)) &&
        (!trackingMinWeight || targetPackage.weight >= trackingMinWeight)
    ))
})

app.get("/home", (req, res) =>{
    res.sendFile(path.join(__dirname, "..", "client", "index.html"));
})