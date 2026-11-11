const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

let currentPlayer = 0;

const players = [
    "🔴 Red Player",
    "🟢 Green Player",
    "🟡 Yellow Player",
    "🔵 Blue Player"
];

function rollDice() {
    const number = Math.floor(Math.random() * 6) + 1;

    const dice = document.getElementById("dice");
    const status = document.getElementById("status");

    dice.textContent = diceFaces[number - 1];

    status.textContent =
        players[currentPlayer] + " rolled " + number + "!";

    if (number !== 6) {
        currentPlayer = (currentPlayer + 1) % players.length;
    }

    updatePlayerTurn();
}

function updatePlayerTurn() {
    const status = document.getElementById("status");

    const turn = document.getElementById("turn");

    if (turn) {
        turn.textContent =
            "Next Turn: " + players[currentPlayer];
    }
}

function newGame() {
    currentPlayer = 0;

    document.getElementById("dice").textContent = "🎲";

    document.getElementById("status").textContent =
        "New Game Started!";

    updatePlayerTurn();
}

document.addEventListener("DOMContentLoaded", function() {
    const button = document.querySelector("button");

    if (button) {
        button.addEventListener("click", rollDice);
    }
});
