import express from "express";
import { readFileSync } from "fs";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const data = JSON.parse(readFileSync("games.data.json", "utf-8"));

const app = express();
app.listen(8000, () => console.log("localhost:8000"));
app.use(express.json());
app.use(express.static(path.join(__dirname, ".." ,"client")));

app.get("/api/games/all", (req, res) => {
    res.json(data.map(game => game.title));
});

app.get("/api/games/title/:title", (req, res) =>{
    const title = decodeURIComponent(req.params.title);
    res.json(data.find(game => game.title === title));
});

app.get(/^\/games(\/.*)?$/, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "games.html"))
});

app.get(/^\/studios(\/.*)?$/, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "studios.html"))
});

app.get("/api/studios/all", (req, res) =>{
    res.json(data.reduce((studios, game) => {
        const studioData = getStudioFromRaw(game.studio_raw)
        const studioIndex = studios.findIndex(studio => studio.studioName === studioData.studioName);
        if (studioIndex === -1) studios.push({studioName:studioData.studioName, location:studioData.location, games:[{title:game.title, roles:game.role.split(" & ")}]});
        else studios[studioIndex].games.push({title:game.title, roles:game.role.split(" & ")});
        return studios
    }, []))
})

function getStudioFromRaw(studioRaw){
    const studioSplit = studioRaw.split(" (");
    const locationSplit = studioSplit[1].split(", ");
    return {studioName:studioSplit[0], location: { country:locationSplit[1].substring(0,locationSplit[1].length - 1), city:locationSplit[0]}};
}