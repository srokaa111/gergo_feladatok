document.addEventListener("DOMContentLoaded", loadEvent);
import {createGamesList, loadOpenGame, data, createModal, fetchData, handleClick, getStudioFromRaw, toggleStudioActive} from "/shared.js"
let studios;

async function loadEvent(){    
    const root = document.getElementById("root")
    createModal(root);
    studios = await fetchData("/api/studios/all");
    root.insertAdjacentElement("beforeend",createStudiosList());
    window.addEventListener("click", handleStudioClick);
    if (location.pathname.split('/').length > 2){
        const currentStudio = studios.find(studio => getStudioFromRaw(studio.studioName) === decodeURIComponent(location.pathname.split('/').at(-2)));
        toggleStudioActive(currentStudio.studioName);
        data.games = currentStudio.games.map(game => game.title)
        loadOpenGame();
    }
}

function createStudiosList(){
    const studiosElement = document.createElement("ul");
    studiosElement.classList.add("game-list");
    for (let studio of studios){
        data.games = studio.games;
        studiosElement.insertAdjacentHTML("beforeend", `<li><h2>${studio.studioName}</h2>${createGamesList("h4", true).outerHTML}</li>`);
    }
    return studiosElement
}

function handleStudioClick(event){
    if (event.target.dataset.index){
        const currentStudio = event.target.closest("ul").previousElementSibling.innerText;
        toggleStudioActive(currentStudio);
        history.pushState({},"",`/studios/${encodeURIComponent(currentStudio)}/${encodeURIComponent(event.target.innerText.split (" -")[0])}`);
        data.games = studios.find(studio => getStudioFromRaw(studio.studioName) === currentStudio).games.map(game => game.title);
        handleClick(event)
    }
}