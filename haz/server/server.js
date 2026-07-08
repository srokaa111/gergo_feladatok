import express from "express";
import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import url from "url";

const devices = [
  { id: 1, name: "Fridge", basePowerUse: 150, currentPowerUse: 150, isOn: true, priority: 1 },
  { id: 2, name: "Insulin refrigerator (medicinal)", basePowerUse: 50, currentPowerUse: 50, isOn: true, priority: 1 },
  { id: 3, name: "Alarm system", basePowerUse: 30, currentPowerUse: 30, isOn: true, priority: 1 },
  
  { id: 4, name: "Boiler", basePowerUse: 2000, currentPowerUse: 2000, isOn: true, priority: 2 },
  { id: 5, name: "Boiler pump", basePowerUse: 120, currentPowerUse: 120, isOn: true, priority: 2 },
  { id: 6, name: "Home Server (NAS)", basePowerUse: 80, currentPowerUse: 80, isOn: true, priority: 2 },
  
  { id: 7, name: "Computer (Workstation)", basePowerUse: 500, currentPowerUse: 500, isOn: true, priority: 3 },
  { id: 8, name: "Washing machine", basePowerUse: 800, currentPowerUse: 800, isOn: false, priority: 3 },
  { id: 9, name: "Dishwasher", basePowerUse: 1200, currentPowerUse: 1200, isOn: false, priority: 3 },
  { id: 10, name: "Microwave", basePowerUse: 1000, currentPowerUse: 1000, isOn: false, priority: 3 },
  
  { id: 11, name: "Living room AC", isAC:true, basePowerUse: 1800, currentPowerUse: 1800, isOn: true, priority: 4 },
  { id: 12, name: "Bedroom AC", isAC:true, basePowerUse: 1400, currentPowerUse: 1400, isOn: false, priority: 4 },
  { id: 13, name: "Living room TV", basePowerUse: 200, currentPowerUse: 200, isOn: true, priority: 4 },
  { id: 14, name: "PlayStation 5", basePowerUse: 210, currentPowerUse: 210, isOn: true, priority: 4 },
  { id: 15, name: "Garden Lights", basePowerUse: 150, currentPowerUse: 150, isOn: true, priority: 4 },

  { id: 16, name: "Jacuzzi", basePowerUse: 3000, currentPowerUse: 3000, isOn: true, priority: 5 },
  { id: 17, name: "Electric car charger", basePowerUse: 3600, currentPowerUse: 3600, isOn: true, priority: 5 },
  { id: 18, name: "Finn sauna", basePowerUse: 4500, currentPowerUse: 4500, isOn: false, priority: 5 },
  { id: 19, name: "Pool water pump", basePowerUse: 600, currentPowerUse: 600, isOn: true, priority: 5 },
  { id: 20, name: "Roomba charging port", basePowerUse: 40, currentPowerUse: 40, isOn: true, priority: 5 }
];

const GRID_LIMIT = 4000;
const COOLDOWN_TIME = 3;
const SOLAR_CHANGE = 100;
const MINIMUM_PRIORITY_FOR_PEAK_SHAVING = 4
const AC_CHANGE_PERCENT = 20;
const SIMULATION_INTERVAL = 1000 //In milliseconds
//const SIMULATION_LIMIT = 10; //In seconds
let solarOutput = 1200;
devices.sort((a, b) => b.priority - a.priority ? b.priority - a.priority : b.basePowerUse - a.basePowerUse);
if (!existsSync("dataLog.txt")) writeFile("dataLog.txt", "", {flag:"w"});
const app = express();
app.listen(8000, console.log("localhost:8000/home"));
app.use(express.json());
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, ".." ,"client")));

app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "index.html"))
});

app.get("/api/history", async (req, res) => {
    res.json(await readLog());
});

app.get("/api/current", async (req, res) => {
    res.json((await readLog()).at(-1));
});

app.post("/api/devices", (req, res) =>{
    const requestBody = req.body;
    devices.push({
        id:Math.max(devices.map(device => device.id)) + 1,
        name:requestBody.name,
        basePowerUse:requestBody.basePower,
        currentPowerUse:requestBody.basePower,
        isOn:requestBody.isOn,
        priority:requestBody.priority
    })
    devices.sort((a, b) => b.priority - a.priority ? b.priority - a.priority : b.basePowerUse - a.basePowerUse);
    res.status(201).send("Added device")
})

function getNetUsage(){
    return devices.reduce((sum, device) => device.isOn ? sum + device.currentPowerUse : sum, 0) - solarOutput;
}

function performEmergencyShutdowns(readableLog, timestamp){
    for (let device of devices){
        if (device.priority !== 1 && device.isOn && !device.cooldown){
            device.isOn = false;
            device.cooldown = COOLDOWN_TIME;
            readableLog += `Timestamp ${timestamp}: Turning off ${device.name}. Current usage: ${getNetUsage()} W\n`;
            if (getNetUsage() <= GRID_LIMIT){
                return readableLog;
            }
        }
    }
    return readableLog;    
}

function performPeakShaving(readableLog, timestamp){
    for (let device of devices){
        if (device.priority >= MINIMUM_PRIORITY_FOR_PEAK_SHAVING && device.isOn && device.currentPowerUse * 2 > device.basePowerUse){
            device.currentPowerUse = device.basePowerUse / 2;
            readableLog += `Timestamp ${timestamp}: Limiting ${device.name} to 50%. Current usage: ${getNetUsage()} W\n`;
            if (getNetUsage() <= GRID_LIMIT){
                return readableLog;
            }
        }
    }
    return readableLog;
}

function advanceSimulation(timestamp){
    let performedShutdown = false;
    let readableLog = "";
    solarOutput = Math.max(solarOutput + Math.floor(Math.random()*(SOLAR_CHANGE*2+1)) - SOLAR_CHANGE, 0);
    adjustACPower();
    if (Math.random() < 0.2) turnTVOn();
    if (getNetUsage() > GRID_LIMIT) readableLog = performPeakShaving(readableLog, timestamp);
    if (getNetUsage() > GRID_LIMIT){
        readableLog += `Timestamp ${timestamp}: Over limit! Performing emergency shutdown of low priority systems.\n`;
        readableLog = performEmergencyShutdowns(readableLog, timestamp);
        performedShutdown = true;
    };
    readableLog = performLoadRecovery(readableLog, timestamp);
    devices.forEach(device => device.cooldown ? device.cooldown-- : null);
    const dataEntry = `{"timestamp": ${timestamp}, "netUsage":${getNetUsage()}, "numOfUsedDevices":${devices.filter(device => device.isOn).length}, "performedShutdown":${performedShutdown}}`;
    writeFile("dataLog.txt", dataEntry+'\n', {flag:"a"});
    writeFile("log.txt", readableLog, {flag:"a"});
}

function performLoadRecovery(readableLog, timestamp){
    for (let i = 0; i < devices.length; i++){
        const device = devices.at(-i);
        const netUsage = getNetUsage();
        if (!device.isOn && device.basePowerUse + netUsage <= GRID_LIMIT && !device.cooldown){
            device.isOn = true;
            device.cooldown = COOLDOWN_TIME;
            readableLog += `Timestamp ${timestamp}: Turning on ${device.name}. Current usage: ${getNetUsage()} W\n`;
        }
        else if (!device.isOn && device.basePowerUse / 2 + netUsage <= GRID_LIMIT && device.priority >= MINIMUM_PRIORITY_FOR_PEAK_SHAVING && !device.cooldown){
            device.isOn = true;
            device.cooldown = COOLDOWN_TIME;
            device.currentPowerUse = device.basePowerUse / 2
            readableLog += `Timestamp ${timestamp}: Turning on ${device.name} at 50%. Current usage: ${getNetUsage()} W\n`;
        }
        else if (device.isOn && device.currentPowerUse < device.basePowerUse && !device.isAC && netUsage + device.basePowerUse / 2 <= GRID_LIMIT){
            device.currentPowerUse = device.basePowerUse;
            readableLog += `Timestamp ${timestamp}: Turning ${device.name} back to 100%. Current usage: ${getNetUsage()} W\n`;
        }

    }
    return readableLog
}

function adjustACPower(){
    devices.filter(device => device.isAC).forEach(device => {
        const ACMulitplier = Math.floor(Math.random() * (2*AC_CHANGE_PERCENT+1) - AC_CHANGE_PERCENT) / 100;
        device.currentPowerUse += device.basePowerUse * ACMulitplier;
    })
}

function turnTVOn(){
    const tv = devices.find(device => device.id === 13);
    tv.isOn = true;
    tv.cooldown = COOLDOWN_TIME;
}


async function doSimulationLoop() {
    let timestamp
    try {
        timestamp = (await readLog()).at(-1).timestamp;
    } catch (error) {
        timestamp = 0;
    }    
    setInterval(() => {timestamp++; advanceSimulation(timestamp);}, SIMULATION_INTERVAL);
}

async function readLog(){
    return JSON.parse(`[${readFileSync("dataLog.txt", "utf-8").split('\n').slice(0,-1).join()}]`);
}

async function printStatistics(){
    const dataLog = await readLog();
    console.log(`Maximum power usage: ${Math.max(...dataLog.map(entry => entry.netUsage))} | Number of emergency shutdowns: ${dataLog.filter(entry => entry.performedShutdown).length}`);
}

function main(){
    doSimulationLoop();
}

main();