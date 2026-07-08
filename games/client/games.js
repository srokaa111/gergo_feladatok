document.addEventListener("DOMContentLoaded", loadEvent);
import {createGamesList, loadOpenGame, data, createModal, fetchData, handleClick} from "/shared.js"

async function loadEvent(){    
    const root = document.getElementById("root")
    createModal(root);
    data.games = await fetchData("/api/games/all");
    root.insertAdjacentElement("beforeend",createGamesList("h2"));
    window.addEventListener("click", handleClick);
    if (location.pathname.split('/').length > 2) loadOpenGame();
}