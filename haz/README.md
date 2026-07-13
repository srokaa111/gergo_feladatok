# Home energy simulator

## What this project is

This project is a small home energy management simulator. Its purpose is to model a household power system, track how much electricity is being used, and automatically respond when the net consumption exceeds a safe grid limit. Instead of being a normal web app for static information, it behaves more like a lightweight simulation engine with a live dashboard.

The app combines three different pieces:
- a server that maintains the device list, simulates the electrical load, and logs the system state
- a client that lets the user add new devices and visualize power usage over time
- a set of saved log files that preserve the simulation history between runs

## How the project is organized

### Server-side structure

The server is the real engine of the project. It is responsible for the simulation logic and for serving the frontend files.

#### server.js

The server file is much more than a simple HTTP endpoint handler. It defines the entire simulation environment.

##### Device model

The application starts with a predefined list of household devices, each represented as an object with fields such as:
- id
- name
- basePowerUse
- currentPowerUse
- isOn
- priority
- optional flags such as isAC

These devices represent a mix of essential, optional, and high-consumption equipment. The initial setup includes refrigeration, heating, appliances, entertainment devices, air conditioning, and luxury/high-power devices such as a jacuzzi or electric car charger.

The device array is sorted by priority so that the simulation logic can reason about which devices are more important than others. Higher-priority devices are treated as more essential and are less likely to be shut down during emergencies.

##### Simulation constants

The server uses several constants to define the behavior of the simulation:
- GRID_LIMIT = 4000: the maximum safe total usage before intervention is required
- COOLDOWN_TIME = 3: the number of simulation steps a device stays temporarily unavailable after being turned on or off
- SOLAR_CHANGE = 100: the amount by which solar output can randomly rise or fall each step
- MINIMUM_PRIORITY_FOR_PEAK_SHAVING = 4: the threshold for applying demand reduction to less critical devices
- AC_CHANGE_PERCENT = 20: the amount of random variation allowed for air conditioning power draw
- SIMULATION_INTERVAL = 1000: the time between simulation steps in milliseconds

These constants make the simulation feel dynamic instead of purely deterministic.

##### Solar output

The system tracks a variable named solarOutput, which starts at 1200. Every tick, solar output changes by a random amount within a bounded range. That means the app is not just simulating device power usage; it is also simulating changing environmental conditions that affect the net load.

##### Emergency logic

The simulation has two primary mitigation strategies when the net power usage rises above the grid limit.

1. Peak shaving
   - If a device has a sufficiently high priority and is currently using more than its base demand, the server reduces it to 50% power.
   - This is a softer intervention that tries to reduce strain without fully turning things off.

2. Emergency shutdowns
   - If the power is still too high, the server begins shutting down low-priority devices.
   - These shutdowns are not permanent; each device gets a cooldown period so it is not immediately reactivated.

This is a practical simulation of demand-side energy management in a home or small facility.

##### Load recovery

After the system has gone over the limit and the server has taken action, it tries to restore devices where possible. The logic checks devices in reverse order and reactivates them if the grid limit can support them. Some devices are restored at full power, while others are restored at half power if that is the best safe compromise.

##### Air conditioning behavior

Air conditioning devices are treated specially. Their power draw is modified randomly by a percentage each tick. That makes the simulation reflect the fact that HVAC systems are variable loads rather than fixed ones.

##### Random TV activation

There is also a small random event that turns the living room TV on with a probability of 20%. This adds a bit of unpredictability and demonstrates how quickly a household load can change.

##### Logging

The server writes two different log files:
- dataLog.txt stores structured JSON entries per simulation step
- log.txt stores human-readable narrative events such as shutdowns, recoveries, and peak reductions

Each simulation step writes a new JSON entry containing:
- timestamp
- netUsage
- numOfUsedDevices
- performedShutdown

This makes the system easy to inspect and also makes the frontend chart possible.

## HTTP API routes

The server exposes a few endpoints:

### GET /home
Serves the main page from the client folder.

### GET /api/history
Returns the full history of simulation states by reading the log file.

### GET /api/current
Returns the latest simulation state from the most recent log entry.

### POST /api/devices
Accepts a JSON body describing a new device. The server adds it to the runtime device list, re-sorts the list by priority, and returns a success response.

This is how the frontend can add custom devices without changing the source code.

## Client-side structure

The frontend is very compact, but it still performs several important tasks.

### main.js

The client script is the main entry point for the UI.

#### Initial page load

When the page loads, the app creates:
- an input area for adding devices
- a canvas element for the chart

The loadEvent function is the startup sequence. It invokes the DOM-building functions and prepares the page.

#### Creating the input area

The createInputArea function builds the form that allows a user to add a new device. It includes:
- a device name field
- a base power field
- a radio selector for whether the device starts on or off
- a priority field
- an Add device button

The form is a practical bridge between the user and the server-side simulation engine.

#### Adding a device

The addDevice function sends the device information to the server through a POST request. This is important because the simulation does not only operate on hard-coded devices; it also evolves based on user input.

#### Creating the chart

The createChart function creates a Chart.js line chart. The chart is fed with the historical power usage values from the server. It uses the timestamps as labels and the net power usage as the plotted value.

The chart is meant to serve as a live visual summary of the grid’s behavior over time.

#### Reading and updating the chart

The app uses two helper functions:
- readLog reads the history from the server
- getNewestState fetches the latest state

The updateChart function appends each new simulation state to the chart and removes older points when the list grows beyond 100 entries. This keeps the visualization readable while still showing recent trends.

## How the simulation behaves in practice

The app is designed to show that power networks are not static. The simulation can react to:
- high demand from turning on multiple devices
- solar variability
- random AC behavior
- occasional TV activation
- automatic demand reduction and shutdown logic

As a result, the chart will often show fluctuating power usage rather than a flat or predictable line. The server is constantly changing the system state in the background.

## Data flow

The general flow of the app is:
1. the server initializes the device list and simulation variables
2. the simulation loop starts and updates the system every second
3. each update writes new data to the log files
4. the client fetches the latest history and renders a live chart
5. the user can add devices, which changes the simulation state immediately

This creates a small interactive feedback loop between user input and system behavior.

## Practical notes

- The project is a simulation rather than a real power-management product.
- The data is stored in local files rather than a database.
- The frontend uses a chart library to visualize the server’s output.
- The logic focuses on operational behavior, not on styling or visual polish.

## How to run it

From the server folder:

```bash
npm install
npm run dev
```

Then open the app in the browser at the local server address, usually the home route.
