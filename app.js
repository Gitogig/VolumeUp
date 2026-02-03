const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const distanceEl = document.getElementById("distance");
const progressEl = document.getElementById("progress");
const pulseRing = document.getElementById("pulse-ring");
const pulseFill = document.getElementById("pulse-fill");
const startButton = document.getElementById("start");

const lanes = 3;
const laneHeights = [];
const player = {
  lane: 1,
  y: 0,
  x: 120,
  radius: 18,
  glow: 0,
};

const enemies = [];
const hazards = [];
const collectibles = [];

let lastTime = 0;
let running = false;
let score = 0;
let combo = 1;
let distance = 0;
let pulseActive = false;
let pulseTimer = 0;
let pulseCooldown = 7;

const colors = {
  lane: "#ffffff",
  tunnel: "#dfe7ff",
  enemy: "#ff6b6b",
  hazard: "#ffc043",
  collectible: "#7cfb7a",
  player: "#3b3f55",
};

function resize() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const laneHeight = canvas.clientHeight / lanes;
  laneHeights.length = 0;
  for (let i = 0; i < lanes; i += 1) {
    laneHeights.push(laneHeight * i + laneHeight / 2);
  }
}

function reset() {
  enemies.length = 0;
  hazards.length = 0;
  collectibles.length = 0;
  score = 0;
  combo = 1;
  distance = 0;
  pulseActive = false;
  pulseTimer = 0;
  pulseCooldown = 4;
  player.lane = 1;
}

function spawnEnemy() {
  enemies.push({
    lane: Math.floor(Math.random() * lanes),
    x: canvas.clientWidth + 40,
    size: 28 + Math.random() * 10,
  });
}

function spawnHazard() {
  hazards.push({
    lane: Math.floor(Math.random() * lanes),
    x: canvas.clientWidth + 40,
    width: 32,
    height: 26,
  });
}

function spawnCollectible() {
  collectibles.push({
    lane: Math.floor(Math.random() * lanes),
    x: canvas.clientWidth + 40,
    size: 16,
  });
}

function activatePulse() {
  pulseActive = true;
  pulseTimer = 4.5;
  pulseRing.classList.add("active");
}

function deactivatePulse() {
  pulseActive = false;
  pulseRing.classList.remove("active");
  pulseCooldown = 6 + Math.random() * 3;
}

function updatePulse(dt) {
  if (pulseActive) {
    pulseTimer -= dt;
    pulseFill.style.width = `${Math.max(pulseTimer / 4.5, 0) * 100}%`;
    if (pulseTimer <= 0) {
      deactivatePulse();
      pulseFill.style.width = "0%";
    }
  } else {
    pulseCooldown -= dt;
    if (pulseCooldown <= 0) {
      activatePulse();
    }
  }
}

function update(dt) {
  distance += dt * 12;
  score += dt * 45 * combo;

  if (Math.random() < 0.02) {
    spawnEnemy();
  }
  if (Math.random() < 0.015) {
    spawnHazard();
  }
  if (Math.random() < 0.01) {
    spawnCollectible();
  }

  const speed = 140;
  enemies.forEach((enemy) => {
    enemy.x -= dt * speed;
  });
  hazards.forEach((hazard) => {
    hazard.x -= dt * speed * 1.1;
  });
  collectibles.forEach((coin) => {
    coin.x -= dt * speed * 0.9;
  });

  [enemies, hazards, collectibles].forEach((items) => {
    while (items.length && items[0].x < -60) {
      items.shift();
    }
  });

  updatePulse(dt);
  player.y = laneHeights[player.lane];
}

function drawLanes() {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 2;
  for (let i = 1; i < lanes; i += 1) {
    const y = (canvas.clientHeight / lanes) * i;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(canvas.clientWidth - 20, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  const centerY = player.y;
  ctx.fillStyle = colors.player;
  ctx.shadowColor = pulseActive ? "rgba(255, 157, 46, 0.8)" : "rgba(0,0,0,0.15)";
  ctx.shadowBlur = pulseActive ? 18 : 8;
  ctx.beginPath();
  ctx.arc(player.x, centerY, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(player.x + 6, centerY - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemies() {
  enemies.forEach((enemy) => {
    ctx.save();
    ctx.fillStyle = colors.enemy;
    ctx.beginPath();
    ctx.roundRect(enemy.x, laneHeights[enemy.lane] - enemy.size / 2, enemy.size, enemy.size, 8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(enemy.x + 8, laneHeights[enemy.lane] - 4, 10, 4);
    ctx.restore();
  });
}

function drawHazards() {
  hazards.forEach((hazard) => {
    ctx.save();
    ctx.fillStyle = colors.hazard;
    ctx.beginPath();
    ctx.moveTo(hazard.x, laneHeights[hazard.lane]);
    ctx.lineTo(hazard.x + hazard.width / 2, laneHeights[hazard.lane] - hazard.height);
    ctx.lineTo(hazard.x + hazard.width, laneHeights[hazard.lane]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawCollectibles() {
  collectibles.forEach((coin) => {
    ctx.save();
    ctx.fillStyle = colors.collectible;
    ctx.beginPath();
    ctx.arc(coin.x, laneHeights[coin.lane], coin.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawTunnel() {
  ctx.save();
  ctx.fillStyle = colors.tunnel;
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < lanes; i += 1) {
    ctx.fillRect(20, (canvas.clientHeight / lanes) * i + 8, canvas.clientWidth - 40, canvas.clientHeight / lanes - 16);
  }
  ctx.restore();
}

function drawHud() {
  scoreEl.textContent = score.toLocaleString(undefined, { maximumFractionDigits: 0 });
  comboEl.textContent = `Combo x${combo}`;
  distanceEl.textContent = `${Math.floor(distance)} m`;
  progressEl.style.width = `${Math.min(distance / 1000, 1) * 100}%`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  drawTunnel();
  drawLanes();
  drawCollectibles();
  drawHazards();
  drawEnemies();
  drawPlayer();
  drawHud();
}

function loop(timestamp) {
  if (!running) {
    return;
  }
  const seconds = timestamp / 1000;
  const dt = Math.min(seconds - lastTime, 0.05);
  lastTime = seconds;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function moveLane(direction) {
  player.lane = Math.max(0, Math.min(lanes - 1, player.lane + direction));
  combo = Math.min(combo + 0.1, 5);
}

function handleAttack() {
  if (!pulseActive) {
    return;
  }
  const before = enemies.length;
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    if (enemies[i].lane === player.lane) {
      enemies.splice(i, 1);
    }
  }
  if (enemies.length < before) {
    score += 250;
  }
}

function start() {
  reset();
  resize();
  running = true;
  lastTime = performance.now() / 1000;
  startButton.textContent = "Tap to Attack ▶";
  requestAnimationFrame(loop);
}

startButton.addEventListener("click", start);
canvas.addEventListener("click", handleAttack);

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    moveLane(-1);
  }
  if (event.key === "ArrowDown") {
    moveLane(1);
  }
  if (event.key === " ") {
    handleAttack();
  }
});

window.addEventListener("resize", resize);
resize();
