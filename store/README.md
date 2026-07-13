# Cyberpunk market simulator

## What this project is

This project is a cyberpunk-themed market simulation. It presents a storefront of fictional products and allows the user to buy and sell them while the market prices change over time. The app combines a simulated economy with a live price chart and an inventory view, making it feel like a small trading game rather than a static shopping page.

The project has three major layers:
- a server that maintains the product catalog, inventory state, price history, and market events
- a client that renders the storefront and inventory UI
- a set of data modules that define the products and the random market events that affect them

## How the project is organized

### Server-side structure

The server is responsible for the simulation behavior and the state of the market.

#### server.js

The server file creates an Express application and exposes several API routes. It is the central runtime for the market simulation.

##### State and simulation constants

The server maintains two important in-memory structures:
- priceHistory: an array of recent market snapshots
- userInventory: the player’s cash balance and owned items

The simulation uses constants such as:
- MAX_PRICE_DECREASE_PERCENT = 15
- MAX_PRICE_INCREASE_PERCENT = 20
- PRICE_HISTORY_MAX_SIZE = 10
- MARKET_EVENT_CHANCE = 0.1
- SIMULATION_INTERVAL = 2000
- STARTING_CASH = 20000

These values define the base behavior of the economy: prices change regularly, large market events happen occasionally, and the player starts with a substantial amount of cash.

##### Price evolution

Every simulation tick, the server updates the price of every product. The change is random but bounded within a percentage window. The function changeProductPrice uses a multiplier that can either increase or decrease the current price slightly.

This means that even without an event, the market is constantly drifting. The player is always operating in a dynamic environment rather than a fixed-price store.

##### Market events

With a small probability, the server triggers a market event. A market event is selected from the list defined in market_events.js and applied to a category of products. For example:
- a data leak might reduce the price of data products
- a new implant patent might increase implant prices
- a luxury tax crackdown might reduce luxury goods prices

The doMarketEvent function changes all products in the affected category by a percentage and returns a description that can be displayed to the user.

##### Price history

The server keeps a short history of market snapshots. Each snapshot contains:
- a timestamp
- the current price of each product
- an optional market event description

The history is capped to 10 entries so the frontend can chart recent changes without storing an unlimited amount of data.

##### Buy and sell actions

The server exposes two POST endpoints:
- /api/buy: lets the user purchase a product
- /api/sell: lets the user sell a product

Both endpoints update the shared simulation state:
- buying decreases cash and stock, and increases the quantity of the purchased item in the inventory
- selling increases cash and stock, and removes the item from inventory when the last unit is sold

The responses include the updated balance and item details so the client can refresh its view without reloading the page.

## Data modules

### products.js

This file defines the entire product catalog. Every product has:
- id
- name
- category
- basePrice
- currentPrice
- stock

The catalog is organized by category, including:
- implants
- software
- data
- health items
- weapons
- vehicles
- luxury goods

The large number of products makes the storefront feel rich and varied, even though the rest of the application is still compact.

### market_events.js

This file contains the available market events. Each event has:
- an id
- a descriptive text for the user
- an affected category
- a priceChange value used to adjust prices

These events are the main mechanism that makes the market feel alive, because prices do not only move randomly; they also respond to simulated world events.

## Client-side structure

The frontend is a browser-based storefront and dashboard.

### main.js

The client script is responsible for rendering the shop, handling user interactions, and drawing charts.

#### Initial page load

When the page loads, the client fetches:
- the product list
- the price history
- the user inventory

These values are loaded once and then kept in memory as local variables for the rest of the page session.

#### Header controls

The createHeader function builds the control bar at the top of the page. It includes:
- a search box for filtering product cards by name
- a category selector for filtering by category
- an Inventory button that opens the inventory popup

This makes the storefront easier to browse, especially when many products are available.

#### Product grid

The createProductGrid function renders a card for each product. Each card shows:
- the product name
- the category
- the current price
- the remaining stock
- BUY and SELL buttons

The card also stores the product id in a data attribute so click events can map to the correct product.

#### Search and category filtering

The client supports two kinds of filtering:
- search by product name
- filter by category

These functions simply hide cards that do not match the current search or category criteria. This is lightweight and effective for a small interface.

#### Buying and selling

The client sends purchase and sale requests to the server when the buttons are clicked.

The flow is:
1. validate that the action is allowed
2. send the request to the backend
3. update the local inventory and product state based on the server response
4. refresh the visible price and stock values on the cards

This makes the shopping experience feel immediate and interactive.

#### Inventory popup

The inventory view is a modal popup. It shows the player’s current cash and a list of owned items with quantities. This is the core of the trading-game aspect of the app because it gives the player a persistent record of what they have purchased.

#### Price chart modal

When the user clicks a product card, the app opens a modal and renders a price chart for that product. The chart uses the server’s price history and updates as new market data comes in.

This is one of the most important UI elements because it turns price changes from a simple number into a visual trend that helps the player make trading decisions.

#### Market event banner

When the server reports a market event, the client displays a temporary banner above the product grid. This gives the user immediate feedback that the market has shifted and that prices may now be different from before.

## Data flow in the application

The application operates in a simple cycle:
1. the server initializes the catalog and the player inventory
2. the market simulation updates prices and may trigger events
3. the client fetches the latest price snapshot and updates the storefront
4. the user buys or sells items
5. the server updates inventory and stock values
6. the UI refreshes to reflect the new state

This creates a simple but effective simulation loop that feels like a live market rather than a static catalog.

## Practical notes

- The app is intentionally playful and themed, but the underlying mechanics are still very clear and structured.
- The backend state is in memory, so restarting the server resets the market and inventory.
- The frontend is built with direct DOM manipulation rather than a framework.
- The project is more about economic simulation and UI feedback than about real-world trading complexity.

## How to run it

From the server folder:

```bash
npm install
npm run dev
```

Then open the app in the browser through the local server address.
