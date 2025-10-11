// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let score = 0;
let timer = 30;
let timerInterval;
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const gameContainer = document.getElementById("game-container");

// Winning and losing messages
const winMessages = [
  "Amazing! You brought clean water to a village!",
  "Great job! You're a water hero!",
  "You win! Every drop counts!",
  "Fantastic! You made a big splash for charity!"
];
const loseMessages = [
  "Try again! Every drop helps.",
  "Keep going! You can do it.",
  "Almost there! Give it another shot.",
  "Don't give up! Water is life."
];

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;
  score = 0;
  timer = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timer;
  clearMessages();
  clearDrops();

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);
  timerInterval = setInterval(updateTimer, 1000);
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";
  drop.style.animationDuration = "4s";

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    drop.remove();
  });

  drop.addEventListener("click", () => {
    if (!gameRunning) return;
    score++;
    scoreDisplay.textContent = score;
    drop.remove();
  });
}

function updateTimer() {
  timer--;
  timeDisplay.textContent = timer;
  if (timer <= 0) {
    endGame();
  }
}

function endGame() {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  showEndMessage();
}

function showEndMessage() {
  // Remove remaining drops
  clearDrops();
  // Create message element
  let message = document.createElement("div");
  message.className = "end-message";
  message.style.position = "absolute";
  message.style.top = "50%";
  message.style.left = "50%";
  message.style.transform = "translate(-50%, -50%)";
  message.style.background = "#fff";
  message.style.border = "2px solid #FFC907";
  message.style.borderRadius = "12px";
  message.style.padding = "32px 40px";
  message.style.fontSize = "2rem";
  message.style.fontWeight = "bold";
  message.style.color = "#1A1A1A";
  message.style.textAlign = "center";
  message.style.boxShadow = "0 4px 24px rgba(0,0,0,0.10)";
  message.style.zIndex = "10";

  if (score >= 20) {
    message.textContent = winMessages[Math.floor(Math.random() * winMessages.length)];
  } else {
    message.textContent = loseMessages[Math.floor(Math.random() * loseMessages.length)];
  }
  gameContainer.appendChild(message);
}

function clearMessages() {
  const msg = gameContainer.querySelector(".end-message");
  if (msg) msg.remove();
}

function clearDrops() {
  const drops = gameContainer.querySelectorAll(".water-drop, .bad-drop");
  drops.forEach(drop => drop.remove());
}
