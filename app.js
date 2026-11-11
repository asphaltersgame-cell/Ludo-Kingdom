const board = document.getElementById("board");
const dice = document.getElementById("dice");
const status = document.getElementById("status");
const turnText = document.getElementById("turn");

const players = ["red", "green", "yellow", "blue"];
const playerNames = ["Red", "Green", "Yellow", "Blue"];

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

const homeAreas = [
 {r:0,c:0,color:"red"},
 {r:0,c:9,color:"green"},
 {r:9,c:9,color:"yellow"},
 {r:9,c:0,color:"blue"}
];

const safeSquares = [0,8,13,21,26,34,39,47];

let currentPlayer = 0;
let diceValue = 0;
let waitingForMove = false;
let gameOver = false;

let tokens = players.map(() => [
 {position:-1},
 {position:-1},
 {position:-1},
 {position:-1}
]);

function makeCell(r,c,classes="") {
    const cell = document.createElement("div");
    cell.className = "cell " + classes;
    cell.style.gridRow = r + 1;
    cell.style.gridColumn = c + 1;
    cell.id = `cell-${r}-${c}`;
    board.appendChild(cell);
    return cell;
}

function createBoard() {
    board.innerHTML = "";

    homeAreas.forEach(area => {
        const home = document.createElement("div");
        home.className = "home-zone " + area.color + "-home";
        home.style.gridRow = `${area.r + 1} / span 6`;
        home.style.gridColumn = `${area.c + 1} / span 6`;
        home.style.display = "flex";
        home.style.alignItems = "center";
        home.style.justifyContent = "center";
        home.style.border = "2px solid #222";

        const inner = document.createElement("div");
        inner.className = "home-inner";
        inner.id = area.color + "-home-inner";

        for (let i = 0; i < 4; i++) {
            const token = document.createElement("button");
            token.className = "token " + area.color;
            token.textContent = "";
            token.dataset.player = players.indexOf(area.color);
            token.dataset.token = i;
            token.onclick = selectToken;
            inner.appendChild(token);
        }

        home.appendChild(inner);
        board.appendChild(home);
    });

    path.forEach((point,index) => {
        let classes = "path";

        if (safeSquares.includes(index)) {
            classes += " safe";
        }

        const cell = makeCell(point[0],point[1],classes);
        cell.dataset.path = index;
    });

    homeLanes.forEach((lane,player) => {
        lane.forEach(point => {
            makeCell(point[0],point[1],players[player] + "-path");
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

function getTokenCell(player,token) {
    const position = tokens[player][token].position;

    if (position === -1) {
        return document.querySelector(
            `#${players[player]}-home-inner .token[data-token="${token}"]`
        );
    }

    if (position < 52) {
        const index = (startPoints[player] + position) % 52;
        const point = path[index];
        return document.getElementById(`cell-${point[0]}-${point[1]}`);
    }

    if (position < 57) {
        const point = homeLanes[player][position - 52];
        return document.getElementById(`cell-${point[0]}-${point[1]}`);
    }

    return null;
}

function renderTokens() {
    document.querySelectorAll(".token").forEach(token => {
        if (token.parentElement.classList.contains("home-inner")) {
            return;
        }
        token.remove();
    });

    players.forEach((player,p) => {
        tokens[p].forEach((token,t) => {
            const target = getTokenCell(p,t);
            if (!target || target.classList.contains("token")) return;

            const piece = document.createElement("button");
            piece.className = "token " + player;
            piece.dataset.player = p;
            piece.dataset.token = t;
            piece.onclick = selectToken;

            piece.style.width = "80%";
            piece.style.height = "80%";
            piece.style.padding = "0";
            piece.style.cursor = "pointer";

            target.appendChild(piece);
        });
    });
}

function rollDice() {
    if (waitingForMove || gameOver) return;

    diceValue = Math.floor(Math.random() * 6) + 1;
    dice.textContent = ["⚀","⚁","⚂","⚃","⚄","⚅"][diceValue - 1];

    waitingForMove = true;

    const movable = tokens[currentPlayer].some(token => {
        if (token.position === -1) return diceValue === 6;
        return token.position + diceValue <= 57;
    });

    if (!movable) {
        status.textContent = playerNames[currentPlayer] +
            " cannot move. Next player's turn.";
        waitingForMove = false;
        setTimeout(nextTurn, 1200);
        return;
    }

    status.textContent = playerNames[currentPlayer] +
        " rolled " + diceValue + ". Select a token.";

    turnText.textContent = "Tap one of your tokens";
}

function selectToken(event) {
    if (!waitingForMove || gameOver) return;

    const player = Number(event.currentTarget.dataset.player);
    const tokenNumber = Number(event.currentTarget.dataset.token);

    if (player !== currentPlayer) return;

    const token = tokens[player][tokenNumber];

    if (token.position === -1) {
        if (diceValue !== 6) return;
        token.position = 0;
    } else {
        if (token.position + diceValue > 57) return;
        token.position += diceValue;
    }

    captureOpponents(player,token.position);

    waitingForMove = false;
    renderTokens();

    if (token.position === 57) {
        status.textContent = playerNames[player] +
            " reached the finish!";
    }

    const won = tokens[player].every(t => t.position === 57);

    if (won) {
        gameOver = true;
        status.textContent = "🏆 " + playerNames[player] +
            " Player Wins LUDO KINGDOM!";
        turnText.textContent = "Game Over!";
        return;
    }

    if (diceValue === 6) {
        status.textContent = playerNames[player] +
            " rolled a 6! Roll again.";
        turnText.textContent = "Your extra turn";
        diceValue = 0;
        return;
    }

    nextTurn();
}

function captureOpponents(player,position) {
    if (position >= 52) return;

    const globalPosition = (startPoints[player] + position) % 52;

    if (safeSquares.includes(globalPosition)) return;

    players.forEach((otherPlayer,otherIndex) => {
        if (otherIndex === player) return;

        tokens[otherIndex].forEach(token => {
            if (token.position < 0 || token.position >= 52) return;

            const otherPosition =
                (startPoints[otherIndex] + token.position) % 52;

            if (otherPosition === globalPosition) {
                token.position = -1;
            }
        });
    });
}

function nextTurn() {
    currentPlayer = (currentPlayer + 1) % 4;
    diceValue = 0;
    waitingForMove = false;

    dice.textContent = "🎲";
    status.textContent = playerNames[currentPlayer] + " Player's Turn";
    turnText.textContent = "Roll the dice to play";
}

createBoard();
