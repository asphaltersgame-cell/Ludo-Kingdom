const board = document.getElementById("board");
const dice = document.getElementById("dice");
const statusText = document.getElementById("status");
const turnText = document.getElementById("turn");

const players = ["red", "green", "yellow", "blue"];
const names = ["Red", "Green", "Yellow", "Blue"];
const startPoints = [0, 13, 26, 39];

const path = [
 [6,1],[6,2],[6,3],[6,4],[6,5],
 [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
 [0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
 [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
 [7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
 [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
 [14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
 [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
 [7,0],[6,0]
];

const homeLanes = [
 [[7,1],[7,2],[7,3],[7,4],[7,5]],
 [[1,7],[2,7],[3,7],[4,7],[5,7]],
 [[7,13],[7,12],[7,11],[7,10],[7,9]],
 [[13,7],[12,7],[11,7],[10,7],[9,7]]
];

const homes = [
 {r:0,c:0,color:"red"},
 {r:0,c:9,color:"green"},
 {r:9,c:9,color:"yellow"},
 {r:9,c:0,color:"blue"}
];

const safeSquares = [0,8,13,21,26,34,39,47];

let currentPlayer = 0;
let diceValue = 0;
let waitingForMove = false;
let moving = false;
let gameOver = false;

const tokens = players.map(() =>
    Array.from({length:4}, () => ({position:-1}))
);

// Create board
function createBoard() {
    board.innerHTML = "";

    homes.forEach(home => {
        const zone = document.createElement("div");
        zone.className = home.color + "-home";
        zone.style.gridRow = `${home.r + 1} / span 6`;
        zone.style.gridColumn = `${home.c + 1} / span 6`;
        zone.style.display = "flex";
        zone.style.alignItems = "center";
        zone.style.justifyContent = "center";
        zone.style.border = "2px solid #222";

        const inner = document.createElement("div");
        inner.className = "home-inner";
        inner.id = home.color + "-home-inner";

        zone.appendChild(inner);
        board.appendChild(zone);
    });

    path.forEach((point,index) => {
        const cell = makeCell(point[0],point[1],"path");
        cell.id = "path-" + index;

        if (safeSquares.includes(index)) {
            cell.classList.add("safe");
            cell.textContent = "★";
        }

        if ([0,13,26,39].includes(index)) {
            cell.textContent = "➤";
        }
    });

    homeLanes.forEach((lane,p) => {
        lane.forEach((point,i) => {
            const cell = makeCell(
                point[0],point[1],players[p] + "-path"
            );
            cell.id = `lane-${p}-${i}`;
        });
    });

    const center = document.createElement("div");
    center.className = "center-home";
    center.style.gridRow = "7 / span 3";
    center.style.gridColumn = "7 / span 3";
    center.textContent = "👑";
    center.style.border = "2px solid #222";
    board.appendChild(center);

    renderTokens();
}

function makeCell(r,c,classes) {
    const cell = document.createElement("div");
    cell.className = "cell " + classes;
    cell.style.gridRow = r + 1;
    cell.style.gridColumn = c + 1;
    board.appendChild(cell);
    return cell;
}

// Put dice beside active player
function updatePlayerTurn() {
    players.forEach((color,p) => {
        const card = document.getElementById("player-" + color);
        const holder = document.getElementById("dice-holder-" + color);

        card.classList.toggle("active",p === currentPlayer);

        if (p === currentPlayer) {
            holder.appendChild(dice);
        }
    });

    statusText.textContent = names[currentPlayer] + " Player's Turn";
    turnText.textContent = "Roll the dice to play";
}

// Token creation
function makeToken(p,t) {
    const piece = document.createElement("button");
    piece.className = "token " + players[p];
    piece.dataset.player = p;
    piece.dataset.token = t;
    piece.type = "button";
    piece.setAttribute("aria-label",names[p] + " token " + (t+1));
    piece.onclick = selectToken;
    return piece;
}

function getTokenCell(p,token) {
    const pos = token.position;

    if (pos < 0) return null;

    if (pos < 52) {
        const index = (startPoints[p] + pos) % 52;
        return document.getElementById("path-" + index);
    }

    if (pos < 57) {
        return document.getElementById(`lane-${p}-${pos-52}`);
    }

    return document.querySelector(".center-home");
}

function renderTokens() {
    document.querySelectorAll(".moving-token").forEach(el => el.remove());

    players.forEach((color,p) => {
        const inner = document.getElementById(color + "-home-inner");
        inner.innerHTML = "";

        tokens[p].forEach((token,t) => {
            if (token.position === -1) {
                inner.appendChild(makeToken(p,t));
            } else {
                const slot = document.createElement("div");
                slot.className = "token-slot";
                inner.appendChild(slot);
            }
        });
    });

    players.forEach((color,p) => {
        tokens[p].forEach((token,t) => {
            if (token.position === -1) return;

            const cell = getTokenCell(p,token);
            if (!cell) return;

            const piece = makeToken(p,t);
            piece.classList.add("moving-token");
            piece.style.width = "88%";
            piece.style.height = "88%";
            cell.appendChild(piece);
        });
    });
}

// Dice
function rollDice() {
    if (waitingForMove || moving || gameOver) return;

    diceValue = Math.floor(Math.random()*6)+1;
    dice.textContent = ["⚀","⚁","⚂","⚃","⚄","⚅"][diceValue-1];

    waitingForMove = true;

    const possible = tokens[currentPlayer].some(token => {
        if (token.position === -1) return diceValue === 6;
        return token.position + diceValue <= 57;
    });

    if (!possible) {
        statusText.textContent = names[currentPlayer] +
            " cannot move!";
        waitingForMove = false;
        setTimeout(nextTurn,1200);
        return;
    }

    statusText.textContent = names[currentPlayer] +
        " rolled " + diceValue;
    turnText.textContent = "Select your token";
}

// Move one square at a time
async function selectToken(event) {
    if (!waitingForMove || moving || gameOver) return;

    const p = Number(event.currentTarget.dataset.player);
    const t = Number(event.currentTarget.dataset.token);

    if (p !== currentPlayer) return;

    const token = tokens[p][t];

    if (token.position === -1 && diceValue !== 6) return;
    if (token.position >= 0 && token.position + diceValue > 57) return;

    waitingForMove = false;
    moving = true;

    if (token.position === -1) {
        token.position = 0;
        renderTokens();
        await pause(300);
    } else {
        for (let i=0; i<diceValue; i++) {
            token.position++;
            renderTokens();

            const cell = getTokenCell(p,token);
            if (cell && token.position < 57) {
                cell.classList.add("move-trail");
                setTimeout(() => {
                    cell.classList.remove("move-trail");
                },900);
            }

            await pause(280);
        }
    }

    captureOpponents(p,token.position);
    renderTokens();

    moving = false;

    if (tokens[p].every(item => item.position === 57)) {
        gameOver = true;
        statusText.textContent = "🏆 " + names[p] + " WINS!";
        turnText.textContent = "Game Over";
        return;
    }

    if (diceValue === 6) {
        statusText.textContent = names[p] + " gets another turn!";
        turnText.textContent = "Roll the dice again";
        diceValue = 0;
        return;
    }

    nextTurn();
}

function captureOpponents(p,position) {
    if (position < 0 || position >= 52) return;

    const globalPosition = (startPoints[p] + position) % 52;
    if (safeSquares.includes(globalPosition)) return;

    players.forEach((color,other) => {
        if (other === p) return;

        tokens[other].forEach(token => {
            if (token.position < 0 || token.position >= 52) return;

            const otherPosition =
                (startPoints[other] + token.position) % 52;

            if (otherPosition === globalPosition) {
                token.position = -1;
            }
        });
    });
}

function pause(ms) {
    return new Promise(resolve => setTimeout(resolve,ms));
}

function nextTurn() {
    currentPlayer = (currentPlayer + 1) % 4;
    diceValue = 0;
    waitingForMove = false;

    dice.textContent = "🎲";
    updatePlayerTurn();
}

createBoard();
updatePlayerTurn();
