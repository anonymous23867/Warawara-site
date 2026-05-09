const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const downBtn = document.getElementById("downBtn");
const rotateBtn = document.getElementById("rotateBtn");

const COLS = 6;
const ROWS = 12;
const SIZE = 48;

const IMAGE_PATHS = [
  "images/IMG_6940.jpg",
  "images/IMG_6925.JPG",
  "images/IMG_6824.WEBP",
  "images/IMG_6691 2.JPG"
];

const gameOverGif = new Image();
gameOverGif.src = "images/IMG_6925.JPG";

let images = [];
let board = [];
let currentPair = null;
let score = 0;
let gameOver = false;
let dropCounter = 0;
let dropInterval = 350;
let lastTime = 0;
let animationId = null;

function loadImages() {
  let loaded = 0;

  IMAGE_PATHS.forEach((path, index) => {
    const img = new Image();
    img.src = path;

    img.onload = () => {
      loaded++;

      if (loaded === IMAGE_PATHS.length) {
        startGame();
      }
    };

    images[index] = img;
  });
}

function createBoard() {
  board = [];

  for (let y = 0; y < ROWS; y++) {
    const row = [];

    for (let x = 0; x < COLS; x++) {
      row.push(null);
    }

    board.push(row);
  }
}

function randomType() {
  return Math.floor(Math.random() * images.length);
}

function createPair() {
  return {
    x: Math.floor(COLS / 2),
    y: 1,
    rotation: 0,
    main: randomType(),
    sub: randomType()
  };
}

function getSubPosition(pair) {
  const dirs = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
  ];

  const dir = dirs[pair.rotation];

  return {
    x: pair.x + dir.x,
    y: pair.y + dir.y
  };
}

function isInside(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}

function canMove(pair, dx, dy, rotation = pair.rotation) {
  const testPair = {
    ...pair,
    x: pair.x + dx,
    y: pair.y + dy,
    rotation: rotation
  };

  const sub = getSubPosition(testPair);

  const cells = [
    { x: testPair.x, y: testPair.y },
    { x: sub.x, y: sub.y }
  ];

  for (const cell of cells) {
    if (!isInside(cell.x, cell.y)) {
      return false;
    }

    if (board[cell.y][cell.x] !== null) {
      return false;
    }
  }

  return true;
}

function move(dx, dy) {
  if (gameOver) return;

  if (canMove(currentPair, dx, dy)) {
    currentPair.x += dx;
    currentPair.y += dy;
  } else if (dy === 1) {
    lockPair();
  }
}

function rotatePair() {
  if (gameOver) return;

  const nextRotation = (currentPair.rotation + 1) % 4;

  if (canMove(currentPair, 0, 0, nextRotation)) {
    currentPair.rotation = nextRotation;
  }
}

function lockPair() {
  const sub = getSubPosition(currentPair);

  board[currentPair.y][currentPair.x] = currentPair.main;

  if (isInside(sub.x, sub.y)) {
    board[sub.y][sub.x] = currentPair.sub;
  }

  resolveBoard();

  currentPair = createPair();

  if (!canMove(currentPair, 0, 0)) {
    gameOver = true;
  }
}

function resolveBoard() {
  let chainHappened = true;

  while (chainHappened) {
    applyGravity();

    const groups = findGroups();

    if (groups.length > 0) {
      chainHappened = true;

      for (const group of groups) {
        for (const cell of group) {
          board[cell.y][cell.x] = null;
        }

        score += group.length * 10;
      }
    } else {
      chainHappened = false;
    }
  }
}

function applyGravity() {
  for (let x = 0; x < COLS; x++) {
    const stack = [];

    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y][x] !== null) {
        stack.push(board[y][x]);
      }
    }

    for (let y = ROWS - 1; y >= 0; y--) {
      board[y][x] = stack[ROWS - 1 - y] ?? null;
    }
  }
}

function findGroups() {
  const visited = Array.from(
    { length: ROWS },
    () => Array(COLS).fill(false)
  );

  const groups = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] === null || visited[y][x]) {
        continue;
      }

      const type = board[y][x];
      const group = [];
      const stack = [{ x, y }];

      visited[y][x] = true;

      while (stack.length > 0) {
        const cell = stack.pop();
        group.push(cell);

        const neighbors = [
          { x: cell.x + 1, y: cell.y },
          { x: cell.x - 1, y: cell.y },
          { x: cell.x, y: cell.y + 1 },
          { x: cell.x, y: cell.y - 1 }
        ];

        for (const n of neighbors) {
          if (
            isInside(n.x, n.y) &&
            !visited[n.y][n.x] &&
            board[n.y][n.x] === type
          ) {
            visited[n.y][n.x] = true;
            stack.push(n);
          }
        }
      }

      if (group.length >= 4) {
        groups.push(group);
      }
    }
  }

  return groups;
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      drawCell(x, y, board[y][x]);
    }
  }

  if (currentPair && !gameOver) {
    drawCell(currentPair.x, currentPair.y, currentPair.main);

    const sub = getSubPosition(currentPair);
    drawCell(sub.x, sub.y, currentPair.sub);
  }

  drawGrid();

  if (gameOver) {
    drawGameOver();
  }
}

function drawCell(x, y, type) {
  if (type === null) return;

  const img = images[type];

  ctx.drawImage(
    img,
    x * SIZE + 3,
    y * SIZE + 3,
    SIZE - 6,
    SIZE - 6
  );
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255,255,255,0.08)";

  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * SIZE, 0);
    ctx.lineTo(x * SIZE, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * SIZE);
    ctx.lineTo(canvas.width, y * SIZE);
    ctx.stroke();
  }
}

function drawGameOver() {
  ctx.drawImage(
    gameOverGif,
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "bold 42px Arial";
  ctx.lineWidth = 7;
  ctx.strokeStyle = "black";
  ctx.fillStyle = "red";

  ctx.strokeText(
    "GAME OVER",
    canvas.width / 2,
    canvas.height / 2 - 35
  );

  ctx.fillText(
    "GAME OVER",
    canvas.width / 2,
    canvas.height / 2 - 35
  );

  ctx.font = "bold 28px Arial";
  ctx.lineWidth = 6;

  ctx.strokeText(
    "SCORE: " + score,
    canvas.width / 2,
    canvas.height / 2 + 30
  );

  ctx.fillText(
    "SCORE: " + score,
    canvas.width / 2,
    canvas.height / 2 + 30
  );
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  if (!gameOver) {
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
      move(0, 1);
      dropCounter = 0;
    }
  }

  drawBoard();

  animationId = requestAnimationFrame(update);
}

function startGame() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }

  createBoard();

  score = 0;
  gameOver = false;

  currentPair = createPair();

  lastTime = 0;
  dropCounter = 0;

  animationId = requestAnimationFrame(update);
}

leftBtn.addEventListener("click", () => {
  move(-1, 0);
});

rightBtn.addEventListener("click", () => {
  move(1, 0);
});

downBtn.addEventListener("click", () => {
  move(0, 1);
});

rotateBtn.addEventListener("click", () => {
  rotatePair();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    move(-1, 0);
  }

  if (e.key === "ArrowRight") {
    move(1, 0);
  }

  if (e.key === "ArrowDown") {
    move(0, 1);
  }

  if (e.code === "Space") {
    rotatePair();
  }
});

loadImages();