# Games project

## What this project is

This project is a small interactive catalog of video games and game studios. Its main goal is to let a visitor browse a large list of games, inspect game details in a modal popup, and also see which studios are associated with those games. The project is intentionally simple: the data is stored in a static JSON file on the server, and the client fetches it through a few API endpoints.

The overall structure is very straightforward:
- the server exposes the data and serves the client pages
- the client renders the page content dynamically in JavaScript
- the UI is built around a shared helper module so both the games page and the studios page can reuse the same popup, list, and navigation logic

## How the project is organized

### Server-side structure

The server lives in the server folder and is the data source for the app.

#### server.js

The server file is the core of the application. It does three important jobs:
1. starts an Express server on port 8000
2. serves static files from the client folder
3. provides API routes for reading game and studio data

The server reads the file games.data.json once when it starts, parses it into a JavaScript object, and keeps it in memory for the lifetime of the process. That means the app is a lightweight static-data application rather than a database-backed system.

The most important routes are:
- GET /api/games/all: returns only the titles of all games
- GET /api/games/title/:title: returns the full object for one specific game
- GET /api/studios/all: transforms the raw game dataset into a studio-oriented list
- GET /games and GET /studios: serve the HTML pages from the client folder

The server uses a regex-based route for /games and /studios so that nested paths such as /games/Some%20Game or /studios/Some%20Studio/Another%20Game are also handled by the same HTML entry points.

#### games.data.json

This JSON file contains the dataset that powers the application. Every record is a single game with the following shape:
- title: the name of the game
- genre: the main genre or category
- year: release year
- rating: a numeric rating value
- studio_raw: a string that combines the studio name and its location
- role: a role string such as Developer or Publisher

Because the data is already arranged as a list of games, the server has to do some transformation work to create the studio view.

## How the client works

The client side is split into a few JavaScript files.

### shared.js

This is the most important client module because it contains reusable logic shared by both pages. It acts like a small UI framework for this project.

#### Core state

The file defines a global object named data. That object is used as a shared store for the current set of games being displayed. In practice, the page scripts assign data.games to either:
- the full list of game titles
- a filtered list of titles for one studio

That design makes the modal and list rendering code work with a single consistent data structure.

#### Modal creation

The createModal function creates the general popup shell for the app. It constructs:
- a modal container that covers the page
- a popup container inside it where the game details will be rendered

This is why the UI can open a popup without rebuilding the entire page.

#### Generic DOM helpers

The addNewElementToParent function is a reusable helper for creating DOM elements. It is used everywhere in the app to create buttons, headings, containers, and other UI pieces. This is a practical abstraction because it keeps the code shorter and avoids repetitive DOM boilerplate.

#### Data fetch helper

The fetchData function wraps the browser fetch API in a small error-handling layer. It tries to load JSON from the server and returns the parsed result, or null on failure. This function is used by both pages when loading initial data.

#### Game list rendering

The createGamesList function builds an unordered list of games. It creates a list item for each game and uses data-index attributes to identify the selected item. The function supports two modes:
- normal mode: it renders just the game titles
- studio mode: it renders the title plus the related roles, such as Developer or Publisher

This is why the studios page can show the same list component but with a slightly different display.

#### Popup and detail rendering

The populateGameDetails function is responsible for displaying the selected game inside the popup. It clears the popup contents, creates a details container, adds navigation buttons, and fills the popup with:
- the game title
- the studio name extracted from the raw studio field
- a star rating visual element
- release year
- genre

It also creates a close button and wires it to the closeModal function.

#### Navigation between games

The app supports moving between games inside the popup with previous and next buttons. The functions goToNext and goToPrev update the current index, fetch the next game’s data, repaint the popup, and update the browser URL to reflect the currently opened game.

This gives the app a linkable state. A user can refresh the page or copy a URL and land directly on a specific game popup.

#### Modal closing and URL handling

The closeModal function hides the popup and adjusts the URL. It also handles studio context by toggling the active studio style when leaving a studio-specific view. This is one of the small but important parts that make the app feel coherent despite being a simple single-page experience.

#### Studio parsing

The getStudioFromRaw function strips the location part from the studio_raw field and returns only the studio name. This is used both for display and for matching studio names between the data and the route path.

#### Studio highlighting

The toggleStudioActive function finds the correct studio list item in the DOM and toggles an active-studio class. This gives the user a visual cue when they have opened a studio-specific view.

### games.js

This file is the entry script for the main games page.

On load, it waits for the DOM to finish loading and then:
1. creates the modal shell
2. fetches all game titles from the API
3. renders the game list into the page root
4. attaches the global click handler
5. checks whether the current URL points to a specific game and, if so, opens the popup for it

The loadEvent function is the page initialization sequence. Since the app uses the URL to decide whether a detail popup should open immediately, this file acts as a router-like entry point for the games listing page.

### studios.js

This file handles the studios page.

It starts by fetching all studio data from the server, then builds a list of studio sections. Each studio is rendered as a list item containing:
- the studio name
- a nested list of games for that studio

The createStudiosList function loops over the studio data and reuses createGamesList to render the games under each studio. This is a nice example of component reuse in a tiny app.

The handleStudioClick function is responsible for studio-specific interactions. When a user clicks a game inside a studio list:
- it finds the current studio
- highlights it
- updates the browser history with a URL that includes both the studio and the game
- changes the current data set to the selected studio’s games
- opens the popup for the chosen game

That behavior makes the studio page feel like a drill-down navigation system rather than just a static list.

## Data flow in the application

The application follows a simple flow:
1. the server loads the game dataset from JSON
2. the client requests either the full list of games or the studio summary list
3. the client renders the data as list items
4. when the user clicks a game, the client fetches the full game details by title
5. the popup is populated with the details
6. the browser URL is updated so the current selection is shareable

This is a classic lightweight client-server pattern with no database and no complex state management.

## Practical notes

- The project is deliberately static and educational rather than production-oriented.
- The UI is driven by the DOM and fetch requests rather than a framework.
- The HTML files mainly provide a container element such as root, while the JavaScript constructs the visible interface.
- The app uses browser history APIs to make the current view look like a real navigation experience.

## How to run it

From the server folder:

```bash
npm install
npm run dev
```

Then open the app in a browser at the local server address, usually:
- /games for the games catalog
- /studios for the studio catalog
