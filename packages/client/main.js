window.addEventListener("DOMContentLoaded", loadEvent);

let flights = [];
let packages = [];

async function loadEvent(){
    const root = document.getElementById("root");
    await getData();

    const layout = addNewElementToParent(root, "div", null, "dashboard-layout", "dashboard-layout");
    const formsColumn = addNewElementToParent(layout, "div", null, "forms-column", "forms-column");
    const tablesColumn = addNewElementToParent(layout, "div", null, "tables-column", "tables-column");

    renderInputForm(formsColumn);
    renderSearchForm(formsColumn);
    renderTables(tablesColumn);
}

function renderTables(tablesElement) {
    tablesElement.textContent = "";
    renderFlights(tablesElement);
    renderPackages(tablesElement);
}

function addNewElementToParent(parentDiv, tag, innerText, id = null, newClass = null, position = "beforeend") {
    const newElement = document.createElement(tag);
    if (id) newElement.id = id;
    if (innerText) newElement.innerText = innerText;
    if (newClass) newElement.classList.add(newClass);
    if (parentDiv) parentDiv.insertAdjacentElement(position, newElement);
    return newElement;
}

function renderInputForm(tablesElement) {
    const section = addNewElementToParent(tablesElement, "div", null, "send-package-section", "section");
    addNewElementToParent(section, "h2", "Send package");
    const form = addNewElementToParent(section, "form", null, "sendPackageForm", "form");

    createField(form, "Label", "cargo-label", "text", "Package label");
    createField(form, "Source", "cargo-source", "text", "Source airport code");
    createField(form, "Destination", "cargo-destination", "text", "Destination airport code");
    createField(form, "Weight", "cargo-weight", "number", "Weight in kg", { min: 0 });
    createField(form, "Category", "cargo-category", "text", "Category");

    const dangerousField = addNewElementToParent(form, "label", "Dangerous", "cargo-dangerous-label");
    dangerousField.for = "cargo-dangerous";
    const dangerousInput = addNewElementToParent(form, "input", null, "cargo-dangerous", "input-checkbox");
    dangerousInput.type = "checkbox";

    const sendButton = addNewElementToParent(form, "button", "Send package", "send-package-button", "primary-button");
    sendButton.type = "button";
    sendButton.addEventListener("click", handleSendPackage);

    const messageDiv = addNewElementToParent(section, "div", null, "sendMessage", "message");
    messageDiv.style.display = "none";
}

function createField(parent, labelText, id, type, placeholder, attributes = {}) {
    const label = addNewElementToParent(parent, "label", labelText, `${id}-label`);
    label.for = id;
    const input = addNewElementToParent(parent, "input", null, id, "input-field");
    input.type = type;
    input.placeholder = placeholder;
    Object.entries(attributes).forEach(([key, value]) => {
        input[key] = value;
    });
    return input;
}

function renderSearchForm(root) {
    const section = addNewElementToParent(root, "div", null, "search-package-section", "section");
    addNewElementToParent(section, "h2", "Track packages");
    const form = addNewElementToParent(section, "form", null, "searchPackageForm", "form");

    createField(form, "Tracking ID", "tracking-id", "text", "Tracking code");
    const statusLabel = addNewElementToParent(form, "label", "Status", "tracking-status-label");
    statusLabel.for = "tracking-status";
    const statusSelect = addNewElementToParent(form, "select", null, "tracking-status", "select");
    ["", "Loading", "In transit"].forEach(status => {
        const option = addNewElementToParent(statusSelect, "option", status || "All statuses");
        option.value = status;
    });

    createField(form, "Minimum weight", "tracking-min-weight", "number", "Minimum weight in kg", { min: 0 });

    const searchButton = addNewElementToParent(form, "button", "Search", "search-package-button", "primary-button");
    searchButton.type = "button";
    searchButton.addEventListener("click", searchPackage);
}

function renderFlights(root) {
    const section = addNewElementToParent(root, "div", null, "flights-section", "section");
    addNewElementToParent(section, "h2", "Flights");
    const tableWrapper = addNewElementToParent(section, "div", null, "table-wrapper", "table-wrapper");
    const table = addNewElementToParent(tableWrapper, "table", null, "flights-table", "table");

    const headerRow = addNewElementToParent(table, "tr");
    ["Flight", "From", "To", "Status", "Weight", "Capacity", "Action"].forEach(text => {
        addNewElementToParent(headerRow, "th", text);
    });

    if (!flights.length) {
        const emptyRow = addNewElementToParent(table, "tr");
        const emptyCell = addNewElementToParent(emptyRow, "td", "No flights available");
        emptyCell.colSpan = 7;
        return;
    }

    flights.forEach(flight => {
        const row = addNewElementToParent(table, "tr");
        addNewElementToParent(row, "td", flight.flightNumber);
        addNewElementToParent(row, "td", flight.departure);
        addNewElementToParent(row, "td", flight.arrival);
        addNewElementToParent(row, "td", flight.status);
        addNewElementToParent(row, "td", `${flight.currentWeight} kg`);
        addNewElementToParent(row, "td", `${flight.maxWeightCapacity} kg`);
        const actionCell = addNewElementToParent(row, "td");
        if (flight.status === "Loading") {
            const departButton = addNewElementToParent(actionCell, "button", "Depart", null, "secondary-button");
            departButton.type = "button";
            departButton.addEventListener("click", () => handleFlightDepart(flight.flightNumber));
        } else {
            addNewElementToParent(actionCell, "span", "-");
        }
    });
}

function renderPackages(tablesElement) {
    const section = addNewElementToParent(tablesElement, "div", null, "packages-section", "section");
    addNewElementToParent(section, "h2", "Packages");
    renderPackagesTable(section);
}

function renderPackagesTable(parent) {
    const existingTable = document.getElementById("packages-table");
    if (existingTable) existingTable.remove();
    const existingMessage = document.getElementById("packages-empty-message");
    if (existingMessage) existingMessage.remove();

    const tableWrapper = addNewElementToParent(parent, "div", null, "table-wrapper", "table-wrapper");
    const table = addNewElementToParent(tableWrapper, "table", null, "packages-table", "table");
    const headerRow = addNewElementToParent(table, "tr");
    ["Tracking", "Label", "Source", "Destination", "Weight", "Price", "Category", "Status", "Flights"].forEach(text => {
        addNewElementToParent(headerRow, "th", text);
    });

    if (!packages.length) {
        table.remove();
        addNewElementToParent(parent, "div", "No packages found", "packages-empty-message", "message");
        return;
    }

    packages.forEach(targetPackage => {
        const row = addNewElementToParent(table, "tr");
        addNewElementToParent(row, "td", targetPackage.trackingNumber);
        addNewElementToParent(row, "td", targetPackage.label);
        addNewElementToParent(row, "td", targetPackage.source);
        addNewElementToParent(row, "td", targetPackage.destination);
        addNewElementToParent(row, "td", `${targetPackage.weight} kg`);
        addNewElementToParent(row, "td", targetPackage.price);
        addNewElementToParent(row, "td", targetPackage.category);
        addNewElementToParent(row, "td", getPackageStatus(targetPackage));
        addNewElementToParent(row, "td", targetPackage.flights.join(", "));
    });
}

async function getData() {
    const data = JSON.parse(await fetchData("/api/data/all"));
    flights = data.active_flights;
    packages = data.packages;
}

async function fetchData(url){
    try{
    const response = await fetch(url);
    const data = await response.text();
    return data;
    }
    catch (error){
        console.error("Failed to fetch data", error.message);
        return null;
    }
}

async function handleSendPackage(){    
    const cargoData = {
        label: document.getElementById("cargo-label").value,
        source: document.getElementById("cargo-source").value,
        destination: document.getElementById("cargo-destination").value,
        weight: Number(document.getElementById("cargo-weight").value),
        category: document.getElementById("cargo-category").value,
        dangerous: document.getElementById("cargo-dangerous").checked
    };

    try {
        const response = await fetch("/api/packages/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cargoData })
        });

        const message = await response.text();
        const messageDiv = document.getElementById("sendMessage");
        messageDiv.textContent = message;
        messageDiv.style.display = "block";
        messageDiv.style.backgroundColor = response.ok ? "#d4edda" : "#f8d7da";
        messageDiv.style.color = response.ok ? "#155724" : "#721c24";

        if (response.ok) {
            document.getElementById("sendPackageForm").reset();
            await getData();
            renderTables(document.getElementById("tables-column"));
        }
    } catch (error) {
        console.error("Error sending package:", error);
    }
}

async function searchPackage(event){
    const trackingId = document.getElementById("tracking-id").value;
    const trackingStatus = document.getElementById("tracking-status").value;
    const trackingMinWeight = document.getElementById("tracking-min-weight").value;

    const searchParams = new URLSearchParams({
        id: trackingId,
        status: trackingStatus,
        minWeight: trackingMinWeight
    });

    packages = JSON.parse(await fetchData(`/api/packages/search?${searchParams}`));
    renderPackagesTable(document.getElementById("packages-section"));
}

async function handleFlightDepart(flightNumber) {
    try {
        const response = await fetch(`/api/flights/${flightNumber}/depart`, {
            method: "PATCH"
        });
        const message = await response.text();
        alert(message);

        if (response.ok) {
            await getData();
            renderTables(document.getElementById("tables-column"));
        }
    } catch (error) {
        console.error("Error departing flight:", error);
    }
}

function getPackageStatus(targetPackage) {
    const packageFlights = flights.filter(flight => targetPackage.flights.includes(flight.flightNumber));
    if (packageFlights.map(flight => flight.status).includes("In transit")) return "In transit";
    return "Loading";
}


