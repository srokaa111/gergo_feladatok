import { Chart, registerables } from "https://esm.sh/chart.js";
Chart.register(...registerables);

window.addEventListener("DOMContentLoaded", loadEvent);

async function loadEvent(){
    const rootElement = document.getElementById("root");
    createInputArea(rootElement);
    createChart(rootElement);
}

function addNewElementToParent(parentDiv, tag, innerText, id = null, newClass = null, position = "beforeend"){
    const newElement = document.createElement(tag);
    if (id) newElement.id = id;
    if (innerText) newElement.innerText = innerText;
    if (newClass) newElement.classList.add(newClass);
    if (parentDiv) parentDiv.insertAdjacentElement(position, newElement);
    return newElement;
}

function createInputArea(rootElement){
    const inputArea = addNewElementToParent(rootElement, "div", null, "input-area", "input-area");
    const inputHeader = addNewElementToParent(inputArea, "h2", "Add new device", "input-header", "input-header")
    const nameInput = addNewElementToParent(inputArea, "input", null, "name-input", "name-input");
    nameInput.placeholder = "Device name";
    const basePowerInput = addNewElementToParent(inputArea, "input", null, "base-power-input", "base-power-input");
    basePowerInput.placeholder = "Power usage";
    addNewElementToParent(inputArea, "span", "Initial state", "starting-state-label", "starting-state-label");
    const isOnTrueArea = addNewElementToParent(inputArea, "div", null, "starting-state-input-on", "starting-state-input")
    const isOnTrue = addNewElementToParent(isOnTrueArea, "input", null);
    isOnTrue.type = "radio";
    isOnTrue.value = "true";
    isOnTrue.name = "isOn";
    const trueLabel = addNewElementToParent(isOnTrueArea, "label", "On", "starting-state-label-on", "starting-state-label-on");
    trueLabel.for = "starting-state-input-on"
    const isOnFalseArea = addNewElementToParent(inputArea, "div", null, "starting-state-input-off", "starting-state-input")
    const isOnFalse = addNewElementToParent(isOnFalseArea, "input", null);
    isOnFalse.type = "radio"
    isOnFalse.value = "false";
    isOnFalse.name = "isOn";
    isOnFalse.checked = false;
    const falseLabel = addNewElementToParent(isOnFalseArea, "label", "Off", "starting-state-label-off", "starting-state-label-off");
    falseLabel.for = "starting-state-input-off"
    const priorityInput = addNewElementToParent(inputArea, "input", null, "priority-input", "priority-input");
    priorityInput.placeholder = "Priority"
    const addButton = addNewElementToParent(inputArea, "button", "Add device", "add-button", "add-button");
    addButton.addEventListener("click", () => addDevice(nameInput.value, Number(basePowerInput.value), isOnTrue.checked, Number(priorityInput.value)));
}

function addDevice(name, basePower, isOn, priority){
    fetch("/api/devices", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            basePower: basePower,
            isOn: isOn,
            priority: priority
        })
    });
}

async function createChart(rootElement) {
    const canvas = addNewElementToParent(rootElement, "canvas", null, "chart", "chart");
    const dataLog = await readLog();
    const chart = new Chart(
        canvas,
        {
            type: 'line',
            data: {
                labels: dataLog.map(entry => entry.timestamp),
                datasets: [
                    {
                        label: "Power usage",
                        data: dataLog.map(entry => entry.netUsage)
                    }/*,
                    {
                        label: "Number of devices",
                        data: dataLog.map(entry => entry.numOfUsedDevices * 100)
                    }*/
                ]
            }
        }
    );
    setInterval(() => updateChart(chart), 1000);
}

async function fetchData(url){
    try{
    const response = await fetch(url);
    const data = await response.text();
    return data;
    }
    catch (error){
        console.error("Failed to fetch data", error.message);
        return null
    }
}


async function readLog(){
    return JSON.parse(await fetchData("/api/history")).slice(-100);
}

async function getNewestState(){
    return JSON.parse(await fetchData("/api/current"));
}

async function updateChart(chart){
    const newState = await getNewestState();
    if (!newState) return;
    chart.data.labels.push(newState.timestamp);
    chart.data.datasets[0].data.push(newState.netUsage);
    //chart.data.datasets[1].data.push(newState.numOfUsedDevices * 100);
    
    if (chart.data.labels.length > 100) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        //chart.data.datasets[1].data.shift();
    }
    chart.update();
}