const canvas = document.getElementById("fallGame");
const ctx = canvas.getContext("2d");

const gameOverScreen = document.getElementById("fallGameOverScreen");

const W = canvas.width;
const H = canvas.height;

const laneCount = 3;
const laneW = W / laneCount;

const judgeY = H - 130;
const judgeH = 70;

let notes = [];
let missCount = 0;
let gameOver = false;
let score = 0;

let lastSpawnTime = 0;
let spawnInterval = 900;
let lastTime = 0;

/* 画像設定 */
const bottomNormal = new Image();
bottomNormal.src = "images/IMG_7031.JPG";

const bottomDamaged = new Image();
bottomDamaged.src = "images/IMG_7032.jpg";

const noteImages = [];

const noteSrcList = [
  "images/IMG_7035.PNG",
  "images/IMG_7034.PNG",
  "images/IMG_7033.PNG"
];

noteSrcList.forEach((src) => {
  const img = new Image();
  img.src = src;
  noteImages.push(img);
});

const bottomImg = {
  current: bottomNormal
};

function spawnNote() {
  const lane = Math.floor(Math.random() * laneCount);
  const img = noteImages[Math.floor(Math.random() * noteImages.length)];

  notes.push({
    lane,
    x: lane * laneW + 18,
    y: -60,
    size: 60,
    speed: 230 + score * 12,
    img
  });
}

function drawBackground() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  for (let i = 1; i < laneCount; i++) {
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(i * laneW, 0);
    ctx.lineTo(i * laneW, H);
    ctx.stroke();
  }

  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, judgeY, W, judgeH);

  ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
  ctx.fillRect(0, judgeY, W, judgeH);
}

function drawBottomImage() {
  const img = bottomImg.current;

  const size = 110;
  const x = W / 2 - size / 2;
  const y = H - size - 8;

  ctx.drawImage(img, x, y, size, size);
}

function drawNotes() {
  notes.forEach((note) => {
    ctx.drawImage(note.img, note.x, note.y, note.size, note.size);
  });
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText(`SCORE: ${score}`, 12, 28);
  ctx.fillText(`MISS: ${missCount}/2`, 12, 52);
}

function miss() {
  missCount++;

  if (missCount === 1) {
    bottomImg.current = bottomDamaged;
  }

  if (missCount >= 2) {
    endGame();
  }
}

function endGame() {
  gameOver = true;

  gameOverScreen.innerHTML = `
    <img src="images/IMG_7026.GIF" alt="GAME OVER">

    <div class="fall-game-over-text">
      GAME OVER
      <br>
      <span class="fall-score-text">
        SCORE : ${score}
      </span>
    </div>
  `;

  gameOverScreen.classList.add("show");
}

function update(delta) {
  notes.forEach((note) => {
    note.y += note.speed * delta;
  });

  notes = notes.filter((note) => {
    if (note.y > H - 90) {
      miss();
      return false;
    }

    return true;
  });
}

function draw() {
  drawBackground();
  drawNotes();
  drawBottomImage();
  drawUI();
}

function gameLoop(time) {
  if (gameOver) return;

  const delta = (time - lastTime) / 1000;
  lastTime = time;

  if (time - lastSpawnTime > spawnInterval) {
    spawnNote();
    lastSpawnTime = time;
  }

  update(delta);
  draw();

  requestAnimationFrame(gameLoop);
}

function tapLane(clientX) {
  if (gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const scaleX = canvas.width / rect.width;
  const realX = x * scaleX;

  const lane = Math.floor(realX / laneW);

  const hitIndex = notes.findIndex((note) => {
    const noteCenterY = note.y + note.size / 2;

    return (
      note.lane === lane &&
      noteCenterY >= judgeY &&
      noteCenterY <= judgeY + judgeH
    );
  });

  if (hitIndex !== -1) {
    notes.splice(hitIndex, 1);
    score++;
  }
}

canvas.addEventListener("pointerdown", (e) => {
  tapLane(e.clientX);
});

gameOverScreen.addEventListener("click", () => {
  location.reload();
});

draw();
requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(gameLoop);
});