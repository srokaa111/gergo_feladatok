import express from "express";
import path from "path";
import url from "url";
import { products } from "./products.js"
import { marketEvents } from "./market_events.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.listen(8000, () => console.log("localhost:8000"));
app.use(express.json());
app.use(express.static(path.join(__dirname, ".." ,"client")));

app.get("/api/prices/all", (req, res) =>{
    res.json(priceHistory);
});

app.get("/api/prices/last", (req, res) =>{
    res.json(priceHistory.at(-1));
});

app.get("/api/products", (req, res) =>{
    res.json(products);
});

app.get("/api/user", (req, res) =>{
    res.json(userInventory);
});

app.get("/store", (req, res) =>{
    res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

app.post("/api/buy", (req, res) =>{
    const productId = Number(req.body.id)
    const productInStore = products.find(product => product.id === productId);
    userInventory.cash -= productInStore.currentPrice;
    productInStore.stock--;
    let productInInventory = userInventory.items.find(product => product.id === productId);
    productInInventory ? productInInventory.quantity++ : userInventory.items.push({id:productId, quantity:1});
    res.status(200).json({
        message:"Purchase successful",
        userBalance:userInventory.cash,
        item:{
            id:productInStore.id,
            remainingStock:productInStore.stock,
            userQuantity:productInInventory ? productInInventory.quantity : 1
        }
    });
});

app.post("/api/sell", (req, res) =>{
    const productId = Number(req.body.id);
    const productInStore = products.find(product => product.id === productId);
    userInventory.cash += productInStore.currentPrice;
    productInStore.stock++;
    const productIndexInventory = userInventory.items.findIndex(product => product.id === productId);
    let soldLast = false;
    if (userInventory.items[productIndexInventory].quantity === 1){
        userInventory.items.splice(productIndexInventory, 1);
        soldLast = true;
    }
    else{
        userInventory.items[productIndexInventory].quantity--;
    }
    res.status(200).json({
        message:"Sale successful",
        userBalance:userInventory.cash,
        item:{
            id:productInStore.id,
            remainingStock:productInStore.stock,
            userQuantity:soldLast ? 0 : userInventory.items[productIndexInventory].quantity
        }
    });
});

const MAX_PRICE_DECREASE_PERCENT = 15;
const MAX_PRICE_INCREASE_PERCENT = 20;
const PRICE_HISTORY_MAX_SIZE = 10;
const MARKET_EVENT_CHANCE = 0.1;
const SIMULATION_INTERVAL = 2000;
const STARTING_CASH = 20000;
const priceHistory = [];
const userInventory = {cash:STARTING_CASH, items:[]};

function advanceSimulation(timestamp){
    products.forEach(product => changeProductPrice(product));
    let marketEvent = null;
    if (Math.random() < MARKET_EVENT_CHANCE) marketEvent = doMarketEvent()
    priceHistory.push({timestamp: timestamp, prices:products.map(product => {return {id:product.id, price:product.currentPrice}}), marketEvent:marketEvent})
    if (priceHistory.length > PRICE_HISTORY_MAX_SIZE) priceHistory.shift()
}

function changeProductPrice(product){
    const priceMultiplier = 1 + Math.floor(Math.random() * (MAX_PRICE_INCREASE_PERCENT + MAX_PRICE_DECREASE_PERCENT + 1) - MAX_PRICE_DECREASE_PERCENT) / 100;
    product.currentPrice = Math.max(Math.round(product.currentPrice * priceMultiplier), 1);
}

function doMarketEvent(){
    const eventIndex = Math.floor(Math.random() * marketEvents.length);
    const marketEvent = marketEvents[eventIndex];
    products.filter(product => product.category === marketEvent.affectedCategory).forEach(product =>{
        product.currentPrice = Math.max(Math.round(product.currentPrice * ( marketEvent.priceChange + 1 )), 1);
    })
    return marketEvent.description;
}
function main(){
    let timestamp = 0
    setInterval(() => {timestamp++; advanceSimulation(timestamp)}, SIMULATION_INTERVAL)
}

main();