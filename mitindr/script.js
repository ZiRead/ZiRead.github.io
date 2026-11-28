const message = "Пусть Новый год откроет перед вами новые возможности и подарит вдохновение для самых смелых мечтаний. Желаю крепкого здоровья, тепла близких людей, уверенности в завтрашнем дне и радости в каждом новом событии. Пусть всё задуманное легко сбудется, а каждый день приносит повод улыбнуться. С Новым годом!";

const newYearMusic = document.getElementById("new-year-music");
const welcomeScreen = document.getElementById("welcome-screen");
const welcomeButton = document.getElementById("welcome-button");
const welcomeError = document.getElementById("welcome-error");

newYearMusic.volume = 0.55;
welcomeButton.addEventListener("click", async () => {
  welcomeButton.disabled = true;
  welcomeError.hidden = true;

  try {
    await newYearMusic.play();
    welcomeScreen.classList.add("is-closing");
    welcomeScreen.addEventListener("transitionend", () => welcomeScreen.remove(), { once: true });
  } catch (error) {
    welcomeButton.disabled = false;
    welcomeError.textContent = "Не удалось включить музыку. Нажми кнопку ещё раз.";
    welcomeError.hidden = false;
    console.error("Не удалось запустить фоновую музыку:", error);
  }
});

const messageElement = document.getElementById("message");
const fragment = document.createDocumentFragment();

let characterIndex = 0;
message.split(" ").forEach((wordText) => {
  const word = document.createElement("span");
  word.className = "word";

  [...wordText].forEach((character) => {
    const letter = document.createElement("span");
    letter.className = "letter";
    letter.textContent = character;
    letter.style.setProperty("--space", "0");
    letter.style.setProperty("--delay", `${Math.min(characterIndex * 18, 6500)}ms`);
    word.appendChild(letter);
    characterIndex++;
  });

  fragment.appendChild(word);
  characterIndex++;
});

messageElement.appendChild(fragment);

const canvas = document.getElementById("fireworks");
const ctx = canvas.getContext("2d");
let width = 0;
let height = 0;
let dpr = 1;
let fireworks = [];
let cursorParticles = [];
let snowflakes = [];

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function randomColor() {
  const palette = ["#ff6b9d", "#ffd166", "#74d7ff", "#a78bfa", "#78efad", "#ff9e64"];
  return palette[Math.floor(Math.random() * palette.length)];
}

function createFirework(x = Math.random() * width, y = Math.random() * height * .55 + 30) {
  const color = randomColor();
  const count = 28 + Math.floor(Math.random() * 24);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * .12;
    const speed = 1.2 + Math.random() * 3.2;
    fireworks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 70 + Math.random() * 25,
      maxLife: 95,
      color,
      size: 1.4 + Math.random() * 1.5,
      gravity: .018
    });
  }
}

function createCursorFirework(x, y) {
  const color = randomColor();
  for (let i = 0; i < 7; i++) {
    const angle = (Math.PI * 2 * i) / 7 + Math.random() * .25;
    const speed = .7 + Math.random() * 1.5;
    cursorParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 24 + Math.random() * 12,
      maxLife: 36,
      color,
      size: 1.2 + Math.random() * 1.2,
      gravity: .02
    });
  }
}

function createSnowflake(initial = false) {
  const radius = 1.5 + Math.random() * 3.5;
  snowflakes.push({
    x: Math.random() * width,
    y: initial ? Math.random() * height : -20,
    vx: (Math.random() - .5) * .28,
    vy: .45 + Math.random() * 1.1,
    radius,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: .012 + Math.random() * .022,
    opacity: .45 + Math.random() * .55
  });
}

function drawSnowflakes() {
  for (let i = snowflakes.length - 1; i >= 0; i--) {
    const flake = snowflakes[i];
    flake.sway += flake.swaySpeed;
    flake.x += flake.vx + Math.sin(flake.sway) * .22;
    flake.y += flake.vy;

    ctx.save();
    ctx.globalAlpha = flake.opacity;
    ctx.fillStyle = "#effcff";
    ctx.shadowColor = "rgba(190, 225, 255, .9)";
    ctx.shadowBlur = flake.radius * 2;
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (flake.y > height + 24) snowflakes.splice(i, 1);
  }
  ctx.globalAlpha = 1;
}

let lastCursorParticle = 0;
window.addEventListener("pointermove", (event) => {
  const now = performance.now();
  if (now - lastCursorParticle > 38) {
    createCursorFirework(event.clientX, event.clientY);
    lastCursorParticle = now;
  }
});

function drawParticles(particles, isCursor = false) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= .992;
    p.life--;

    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (isCursor ? 1 : alpha + .25), 0, Math.PI * 2);
    ctx.fill();

    if (p.life <= 0) particles.splice(i, 1);
  }
  ctx.globalAlpha = 1;
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  drawSnowflakes();
  drawParticles(fireworks);
  drawParticles(cursorParticles, true);
  requestAnimationFrame(animate);
}

resize();
window.addEventListener("resize", resize);

setInterval(() => {
  if (!document.hidden) createFirework();
}, 1100);

for (let i = 0; i < 110; i++) createSnowflake(true);
setInterval(() => {
  if (!document.hidden && snowflakes.length < 180) createSnowflake();
}, 120);

createFirework(width * .25, height * .28);
createFirework(width * .75, height * .22);
animate();
