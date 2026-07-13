# Cargo logistics dashboard

## What this project is

This project is a small cargo-routing and tracking application for a fictional logistics network. It simulates a system where users can send packages between airports, the server tries to find a valid flight path, and the frontend shows flights and packages in a simple dashboard. The core idea is not just to store cargo data, but to model the logic of how packages are assigned to flights under practical constraints such as airport restrictions, capacity, and price.

The app is split into two layers:
- a server that stores the airline data and applies the routing and security logic
- a client that lets users register packages, search for them, and depart flights from the dashboard

## How the project is organized

### Server-side structure

The server is the most important part of the project because it contains the data model, the routing algorithm, and the business rules.

#### server.js

The server file is responsible for several distinct functions.

##### Data loading

At startup, the server reads the cargo.json file and stores its contents in memory. That file contains the complete state of the system:
- packages: all packages that have been registered so far
- active_flights: all flights currently available to carry cargo
- airports_and_zones: airport restrictions and prohibited items

Because the application is small, it uses this JSON file as a lightweight pseudo-database rather than a real database engine.

##### Cargo price calculation

When a package is registered, the server calculates its price based on the selected flight path. The price is derived from the total cost per kilogram over each flight in the route. The app also adds a surcharge for dangerous cargo.

The code uses a constant named DANGEROUS_CARGO_SURCHARGE set to 0.5, which means dangerous cargo receives a 50% price increase.

##### Tracking number generation

Every successfully registered package receives a tracking number. The server creates it in a predictable format such as TRK-0001, TRK-0002, and so on. If there are existing packages, the next tracking number is derived from the last one.

This means the application has a simple but complete package-tracking identity system.

##### Security checks

The server contains a security mechanism for prohibited cargo. Before assigning a package to a route, it checks whether the cargo category is prohibited at the source or destination airport.

If the package is prohibited, the server:
- records a security breach in a log file
- returns a 400 response
- prevents the package from being sent

This is an important example of server-side validation rather than trusting the client input.

##### Flight matching and routing

The core of the logistics logic is the pathfinding behavior.

The server has a function named findCargoFlights that tries to send the cargo in the easiest and most practical way:
- if there is a direct flight from the source to the destination and it has enough capacity, it uses that flight
- otherwise it searches for the cheapest valid path through multiple flights

This is where the application becomes more interesting than a simple form submission system.

##### Cheapest path search

The function findCheapestPath uses a Dijkstra-style approach to find the least expensive route between airports. In this implementation, the airline network is treated as a weighted graph where each airport is a node and each available flight is a directed edge with the flight price per kilogram as its weight.

The algorithm is deliberately simple, but it follows the same logic as classic shortest-path search:

1. Build the graph from the currently active flights.
   - The server first filters the flight list down to flights that are still loading, have enough free capacity for the package, and do not arrive at an airport where the cargo category is prohibited.
   - From that filtered list, it creates a map of adjacency where each departure airport points to a set of possible arrival airports and their cheapest known cost.

2. Initialize the distance table.
   - The code creates an array called totalPricePerKgToNode that stores the best known price to reach every airport.
   - The starting airport receives a cost of 0, while every other airport starts with Infinity because it has not been reached yet.
   - A separate object named previousNode is created to remember which airport led to the current one, so the route can be reconstructed later.

3. Explore the network one airport at a time.
   - The variable node starts at the source airport.
   - The loop repeats until the destination airport is reached.
   - On each iteration, the algorithm takes the current node, looks at all outgoing edges from that node, and checks whether the route through the current node is cheaper than the best route discovered so far for the destination airport.
   - If a cheaper route is found, the cost is updated and the previousNode mapping stores the current airport as the predecessor of the destination airport.
   - After checking all outgoing edges, the list of unprocessed airports is sorted by their current best-known price. The next airport to process is the cheapest one.

4. Reconstruct the route.
   - Once the destination is reached, the code walks backward from the destination using the previousNode object.
   - It collects the airports in reverse order, then reverses them to form the path from source to destination.
   - Finally, it translates that airport sequence into an actual list of flight objects by matching each consecutive airport pair to the cheapest available flight between them.

In other words, the algorithm is not just asking “is there a route?” It is asking “what is the cheapest valid route?” and then turning that route into the actual flight plan that the package will follow.

The implementation is also careful about the data it considers:
- it ignores flights that are no longer loading
- it ignores flights that cannot carry the package’s weight
- it ignores routes that would arrive at a destination where the cargo type is prohibited

That makes the pathfinding logic practical rather than purely theoretical. The algorithm is solving a real logistics problem with real constraints, not just a generic shortest-path puzzle.

A useful way to think about the code is this:
- totalPricePerKgToNode is the “best known price so far” table
- previousNode is the “how did we get here?” table
- pathWeights is the graph representation of the network
- the while loop is the search process that gradually expands the cheapest known route


##### Flight capacity and active state

The system ensures that flights are only used if they have enough remaining capacity. It also only considers flights whose status is Loading. This prevents packages from being assigned to routes that are already in transit or otherwise unavailable.

##### Package status determination

The getPackageStatus function determines whether a package is currently loading or in transit based on the status of the flights assigned to it. If any of those flights are marked In transit, the package is shown as In transit; otherwise it appears as Loading.

This is how the UI can display a useful status without storing separate status fields on the package itself.

##### Flight departure endpoint

The server also exposes a PATCH endpoint for departing flights. When a flight departs:
- its status is changed to In transit
- the updated state is written back to cargo.json
- the client receives a confirmation message

This makes the system feel dynamic because flights change state over time.

## API routes

The server exposes the following endpoints:

### POST /api/packages/register
Registers a new package. The request body contains the cargo details, and the server attempts to route it. The endpoint returns either success or an error response depending on whether the package was accepted.

### PATCH /api/flights/:flightId/depart
Marks a flight as departed.

### GET /api/data/all
Returns the entire current data object.

### GET /api/data/packages
Returns all registered packages.

### GET /api/data/flights
Returns all active flights.

### GET /api/packages/search
Searches packages by tracking ID, status, or minimum weight.

### GET /home
Serves the frontend HTML page.

## Client-side structure

The frontend is a dashboard built entirely with JavaScript-generated DOM elements.

### main.js

The client script is responsible for rendering the whole interface.

#### Initial page load

When the page loads, the app:
1. fetches the current data from the server
2. creates a layout with two columns
3. renders the input form, the search form, and the tables

The layout is built from simple containers so the UI remains lightweight and easy to extend.

#### Rendering the input form

The renderInputForm function creates the package registration form. It includes fields for:
- package label
- source airport code
- destination airport code
- weight
- category
- dangerous cargo checkbox

This form is the main interaction point for the logistics simulation.

#### Rendering the search form

The renderSearchForm function creates the package lookup interface. It lets the user search by:
- tracking ID
- current status
- minimum weight

This is how the app supports tracking and filtering without needing a dedicated backend database query language.

#### Rendering the flights table

The renderFlights function builds a table of flights. Each row shows:
- flight number
- departure airport
- arrival airport
- status
- current weight
- capacity
- an action column

If a flight is still Loading, the table includes a Depart button. Clicking it sends a request to the server to mark the flight as in transit.

#### Rendering the packages table

The renderPackages function builds a table of packages. Each row shows the package’s tracking code, label, route, weight, price, category, status, and associated flights.

The rendering is not static: after a successful package registration or flight departure, the client refreshes the tables from the latest server data.

#### Sending a package

When the user submits a package, the client gathers the form values into a cargoData object and sends it to the server. The response is then shown in a message box and the tables are refreshed if the operation succeeded.

This is a practical example of form-driven interaction with a backend API.

#### Searching packages

The searchPackage function builds a query string from the current search fields and requests matching packages from the server. The response replaces the current packages array and rerenders the table.

#### Flight departure handling

The handleFlightDepart function triggers the backend flight departure endpoint and immediately refreshes the dashboard if successful.

## Data flow in the application

The app follows a simple lifecycle:
1. the server loads flight and package data from cargo.json
2. the frontend requests the data and renders it in tables
3. the user sends a package registration request
4. the server validates the request, checks restrictions, calculates a route, and updates the data store
5. the UI refreshes to show the new package and the updated flight capacities
6. the user can then depart flights and observe the package status change

## Practical notes

- The application is intentionally lightweight and uses JSON files as storage rather than a database.
- The routing logic is the most interesting part of the project because it applies a real graph-search idea in a very small codebase.
- The frontend is generated dynamically, which is appropriate for this kind of dashboard app.
- The project focuses on transport logic, validation, and status tracking rather than visual polish.

## How to run it

From the server folder:

```bash
npm install
npm run dev
```

Then open the app in the browser through the local server address.
