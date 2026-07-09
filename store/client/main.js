import { Chart, registerables } from "https://esm.sh/chart.js";
Chart.register(...registerables);

window.addEventListener("DOMContentLoaded", loadEvent)
let products, priceHistory, userInventory;

async function loadEvent(){
    const rootElement = document.getElementById("root");
    [products, priceHistory, userInventory] = (await getData()).map(response => JSON.parse(response));
    createHeader(rootElement);
    createProductGrid(rootElement);
    createModal(rootElement);
    window.addEventListener("click", handleClick);
    setInterval(async () => updateData(JSON.parse(await fetchData("/api/prices/last"))), 2000);
}

function getData(){
    const products = fetchData("/api/products");
    const priceHistory = fetchData("/api/prices/all");
    const userInventory = fetchData("/api/user");
    return Promise.all([products, priceHistory, userInventory])
}

async function fetchData(url, request = null){
    try{
    const response = await fetch(url, request);
    const data = await response.text();
    return data;
    }
    catch (error){
        console.error("Failed to fetch data", error.message);
        return null
    }
}

function addNewElementToParent(parentDiv, tag, innerText, id = null, newClass = null, position = "beforeend"){
    const newElement = document.createElement(tag);
    if (id) newElement.id = id;
    if (innerText) newElement.innerText = innerText;
    if (newClass) newElement.classList.add(newClass);
    if (parentDiv) parentDiv.insertAdjacentElement(position, newElement);
    return newElement;
}


function createHeader(rootElement){
    const header = addNewElementToParent(rootElement, "div", null, "header", "header");
    const searchBar = addNewElementToParent(header, "input", null, "search-bar", "search-bar");
    searchBar.addEventListener("input", searchByName);
    const categorySelector = addNewElementToParent(header, "select", null, "category-select", "category-select");
    populateSelect(categorySelector);
    categorySelector.addEventListener("change",filterByCategory);
    const inventoryButton = addNewElementToParent(header, "button", "Inventory", "inventory-button", "inventory-button");
    inventoryButton.addEventListener("click", showInventory);
}

function searchByName(event){
    const searchTerm = event.target.value;
    showAllProducts();
    document.querySelectorAll(".product-card").forEach(productCard => {
        if (!productCard.querySelector("h2").innerText.toLowerCase().includes(searchTerm.toLowerCase())) productCard.classList.add("hidden-card");
    })
}

function showAllProducts(){
    document.querySelectorAll(".product-card").forEach(productCard => {
        productCard.classList.remove("hidden-card");
    })
}

function populateSelect(selector){
    const nullOption = document.createElement("option");
    nullOption.value = "";
    nullOption.innerText = "All categories";
    selector.insertAdjacentElement("beforeend", nullOption);
    Array(...new Set(products.map(product => product.category))).forEach(category =>{
        const option = document.createElement("option");
        option.value = category;
        option.innerText = category;
        selector.insertAdjacentElement("beforeend", option);        
    })
}

function filterByCategory(event){
    const category = event.target.value;
    showAllProducts();
    if (category) document.querySelectorAll(".product-card").forEach(productCard => {
        if (productCard.querySelector("h4").innerText.toLowerCase() !== category.toLowerCase()) productCard.classList.add("hidden-card");
    })
}

function createProductGrid(rootElement){
    const productsGrid = addNewElementToParent(rootElement, "div", null, "products-grid", "products-grid");
    products.forEach(product =>{
        createProductCard(productsGrid, product);
    });
}

function createProductCard(productsGrid, product){
    const productCard = addNewElementToParent(productsGrid, "span", null, null, "product-card");
    productCard.dataset.cardProductId = product.id;
    addNewElementToParent(productCard, "h2", product.name);
    addNewElementToParent(productCard, "h4", product.category);
    addNewElementToParent(productCard, "div", `Price: ${product.currentPrice}`, null, "product-price");
    addNewElementToParent(productCard, "div", `Remaining stock: ${product.stock}`, null, "product-stock");
    const buyButton = addNewElementToParent(productCard, "button", "BUY", null, "buy-button");
    const sellButton = addNewElementToParent(productCard, "button", "SELL", null, "sell-button");
    buyButton.dataset.tradeProductId = product.id;
    sellButton.dataset.tradeProductId = product.id;
}

function handleClick(event){
    if (event.target.dataset.tradeProductId){
        if ([...event.target.classList].includes("buy-button")) handleBuy(Number(event.target.dataset.tradeProductId));
        else handleSell(Number(event.target.dataset.tradeProductId));
    }
    else{
        const productCard = event.target.closest(".product-card");
        if (productCard && productCard.dataset.cardProductId){
            document.getElementById("modal").style.display = "flex";
            const popup = document.getElementById("popup");
            popup.textContent = '';
            const header = addNewElementToParent(popup, "span", null, null, "header", "afterbegin");
            const closeButton = addNewElementToParent(header, "span", null, null, "close-button");
            closeButton.innerHTML = "&times;"
            closeButton.addEventListener("click", closeModal); 
            createChart(popup, Number(productCard.dataset.cardProductId));
        }
    }
}

async function handleBuy(productId){
    const product = products.find(product => product.id === productId);
    if (!validateBuy(product)) return;
    const request = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: product.id
        })
    }
    updateInventory(JSON.parse(await fetchData("/api/buy", request)));
}

function validateBuy(product){
    if (product.currentPrice < userInventory.cash) {
        if (product.stock > 0) return true;
        else{
            showErrorPopup("No stock remaining");
        }
    }
    else{
        showErrorPopup("Not enough money");
    }
    return false;
}

async function handleSell(productId){
    if (!validateSell(productId)) return;
    const request = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: productId
        })
    }
    updateInventory(JSON.parse(await fetchData("/api/sell", request)));
}

function validateSell(productId){
    if (userInventory.items.find(product => product.id === productId)) return true;
    showErrorPopup("You don't have any to sell");
    return false;
}

function updateInventory(response){
    userInventory.cash = Number(response.userBalance);

    const productId = Number(response.item.id);

    const productInInventoryIndex = userInventory.items.findIndex(product => product.id === productId);
    if (productInInventoryIndex === -1) userInventory.items.push({id:productId, quantity: Number(response.item.userQuantity)});
    else if (Number(response.item.userQuantity) === 0) userInventory.items.splice(productInInventoryIndex, 1);
    else userInventory.items[productInInventoryIndex].quantity = Number(response.item.userQuantity);

    products.find(product => product.id === productId).stock = Number(response.item.remainingStock);
    updateDisplay();
}

function updateDisplay(){
    document.querySelectorAll(".product-card").forEach(productCard => {
        const product = products.find(product => product.id === Number(productCard.dataset.cardProductId))
        const priceField = productCard.querySelector(".product-price");
        if (Number(priceField.innerText.split(' ')[1]) > product.currentPrice) priceField.style.color = "red";
        else if (Number(priceField.innerText.split(' ')[1]) < product.currentPrice) priceField.style.color = "green";
        productCard.querySelector(".product-price").innerText = `Price: ${product.currentPrice}`
        productCard.querySelector(".product-stock").innerText = `Remaining stock: ${product.stock}`
    });
}

function updateData(newState){
    priceHistory.push(newState);
    if (priceHistory.length > 10) priceHistory.shift();
    products.forEach((product, index) => product.currentPrice = priceHistory.at(-1).prices[index].price);
    if (priceHistory.at(-1).marketEvent) displayMarketEvent(priceHistory.at(-1).marketEvent);
    updateDisplay();
}

async function displayMarketEvent(eventText){
    const eventBanner = addNewElementToParent(document.getElementById("products-grid"), "span", eventText, "event-banner", "event-banner");
    setTimeout(() => eventBanner.remove(), 2000);
}

function createModal(rootElement){
    const modal = addNewElementToParent(rootElement, "div", null, "modal", "modal");
    addNewElementToParent(modal, "div", null, "popup", "popup");
}

function showInventory(){
    document.getElementById("modal").style.display = "flex";
    populateInventory(document.getElementById("popup"));
}

function populateInventory(popup){
    popup.textContent = "";
    addNewElementToParent(popup, "div", `Cash: ${userInventory.cash}`);
    const inventoryGrid = addNewElementToParent(popup, "div", null, "inventory-grid", "inventory-grid");
    userInventory.items.forEach(item =>{
        createInventoryCard(inventoryGrid, item);
    });
    const header = addNewElementToParent(popup, "span", null, null, "header", "afterbegin");
    const closeButton = addNewElementToParent(header, "span", null, null, "close-button");
    closeButton.innerHTML = "&times;"
    closeButton.addEventListener("click", closeModal); 
}

function createInventoryCard(inventoryGrid, item){
    const inventoryCard = addNewElementToParent(inventoryGrid, "span", null, null, "inventory-card");
    const product = products.find(product => product.id === item.id)
    addNewElementToParent(inventoryCard, "h2", product.name);
    addNewElementToParent(inventoryCard, "h4", product.category);
    addNewElementToParent(inventoryCard, "div", `Quantity: ${item.quantity}`);
}

function closeModal(){
    document.getElementById("modal").style.display = "none"
}

function showErrorPopup(message){
    document.getElementById("modal").style.display = "flex";
    const popup = document.getElementById("popup");
    popup.textContent = '';
    addNewElementToParent(popup, "div", message, "error-message", "error-message");
    const closeButton = addNewElementToParent(popup, "span", "OK", null, "error-button");
    closeButton.addEventListener("click", closeModal); 
}

function createChart(popup, productId) {
    const canvas = addNewElementToParent(popup, "canvas", null, "chart", "chart");
    const chart = new Chart(
        canvas,
        {
            type: 'line',
            data: {
                labels: priceHistory.map(entry => entry.timestamp),
                datasets: [
                    {
                        label: "Price",
                        data: priceHistory.map(entry => entry.prices.find(product => product.id === productId).price)
                    }
                ]
            }
        }
    );
    setInterval(() => updateChart(chart, productId), 2000);
}

function updateChart(chart, productId){
    chart.data.labels = priceHistory.map(entry => entry.timestamp);
    chart.data.datasets[0].data = priceHistory.map(entry => entry.prices.find(product => product.id === productId).price);
    chart.update();
}