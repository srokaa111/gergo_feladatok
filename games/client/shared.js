let currentIndex
const data = {};

function createModal(root){
    const modal = addNewElementToParent(root, "div", null, "modal", "modal");
    addNewElementToParent(modal, "div", null, "popup", "popup");
}

async function fetchData(url){
    try{
    const response = await fetch(url);
    const data = await response.json();
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

function createGamesList(tag, includeRoles = false){
    const gamesList = document.createElement("ul");
    gamesList.classList.add("game-list");
    for (let i = 0; i < data.games.length; i++){
        gamesList.insertAdjacentHTML("beforeend", 
            `<li data-index="${i}">
            <${tag}>${includeRoles ? `${data.games[i].title}<span> - ${data.games[i].roles.join(', ')}`: data.games[i]}</span></${tag}>
            </li>`);
    }
    return gamesList
}

async function handleClick(event){
    console.log(event.target)
    if (event.target.dataset.index){
        currentIndex = Number(event.target.dataset.index);
        populateGameDetails(await fetchData(`/api/games/title/${encodeURIComponent(data.games[currentIndex])}`));
        if (location.pathname === "/games") history.pushState({},"",`/games/${encodeURIComponent(data.games[currentIndex])}`);
        document.getElementById("modal").style.display = "flex";
    }
}

function populateGameDetails(gameData){
    const gamePopup = document.getElementById("popup");
    gamePopup.textContent = "";
    const gameDetails = addNewElementToParent(gamePopup, "div", null, "game-details", "game-details");
    const nextButton = addNewElementToParent(gamePopup, "img", null, null, "next-button");
    const prevButton = addNewElementToParent(gamePopup, "img", null, null, "prev-button");
    addNewElementToParent(gameDetails, "h1", gameData.title);
    addNewElementToParent(gameDetails, "h2", getStudioFromRaw(gameData.studio_raw));
    const stars = addNewElementToParent(gameDetails, "div", null, "stars", "stars");
    stars.style.width = gameData.rating * 24;
    addNewElementToParent(gameDetails, "div", null, "empty-stars", "empty-stars");
    addNewElementToParent(gameDetails, "div", `Release year: ${gameData.year}`);
    addNewElementToParent(gameDetails, "div", `Genre: ${gameData.genre}`);
    const header = addNewElementToParent(gamePopup, "span", null, null, "header", "afterbegin");
    const closeButton = addNewElementToParent(header, "span", null, null, "close-button");
    closeButton.innerHTML = "&times;"
    closeButton.addEventListener("click", closeModal);
    nextButton.addEventListener("click", goToNext);
    prevButton.addEventListener("click", goToPrev);
    nextButton.src = "https://img.icons8.com/fluency/48/next.png";
    prevButton.src = "https://img.icons8.com/fluency/48/next.png";
    handleButtons(nextButton, prevButton);
}

function handleButtons(nextButton, prevButton){
    if (currentIndex === data.games.length - 1) nextButton.style.display = "none";
    if (currentIndex === 0) prevButton.style.display = "none";
}

async function goToNext(){
    currentIndex++;
    populateGameDetails(await fetchData(`/api/games/title/${encodeURIComponent(data.games[currentIndex])}`));
    history.pushState({},"",`${location.pathname.split('/').slice(0,-1).join('/')}/${encodeURIComponent(data.games[currentIndex])}`);
}

async function goToPrev(){
    currentIndex--;
    populateGameDetails(await fetchData(`/api/games/title/${encodeURIComponent(data.games[currentIndex])}`));
    history.pushState({},"",`${location.pathname.split('/').slice(0,-1).join('/')}/${encodeURIComponent(data.games[currentIndex])}`);
}

function closeModal(){
    document.getElementById("modal").style.display = "none"
    const currentPage = location.pathname.split('/')[1];
    if (currentPage === "studios") toggleStudioActive(decodeURIComponent(location.pathname.split('/')[2]));
    if (`/${currentPage}` !== location.pathname) history.pushState({}, "", `/${currentPage}`);
}

function getStudioFromRaw(studioRaw){
    return studioRaw.split(" (")[0];
}


async function loadOpenGame(){
    const gameName = location.pathname.split('/').at(-1);
    currentIndex = data.games.findIndex(game => game === decodeURIComponent(gameName));
    populateGameDetails(await fetchData(`/api/games/title/${gameName}`))
    document.getElementById("modal").style.display = "flex"
}

function toggleStudioActive(studioName){
    const studioElement = (Array.from(document.querySelectorAll("#root>ul>li>h2"))).find(element => element.innerText === studioName).parentElement;
    studioElement.classList.toggle("active-studio")
}

export {
    data,
    createModal,
    fetchData,
    createGamesList,
    handleClick,
    populateGameDetails,
    closeModal,
    addNewElementToParent,
    goToNext,
    goToPrev,
    loadOpenGame,
    getStudioFromRaw,
    toggleStudioActive
};