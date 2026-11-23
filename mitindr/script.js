const message = "В этот замечательный день 24.11.2004 появилась на свет Саарян Ангелина Арайковна и озарила мир своим озаряющим каждый уголок мира сиянием. Поздравляю тебя с днем рождения и желаю тебе исполнения твоих истинных желаний и хороших людей на жизненном пути. Ниже можешь скачать свою праздничную, поздравительную грамоту. Ещё раз с праздником!";

const birthdayMusic = document.getElementById("birthday-music");

function startMusic() {
  birthdayMusic.play().catch(() => {});
}

birthdayMusic.volume = 0.55;
birthdayMusic.preload = "auto";

function tryPlay() {
  const p = birthdayMusic.play();
  if (p && typeof p.catch === "function") p.catch(() => {});
}

// 1) Пытаемся запустить сразу со звуком
tryPlay();

// 2) Если браузер запретил — пробуем тихий автоплей,
//    чтобы элемент уже играл и был готов включить звук по клику
function tryMutedAutoplay() {
  birthdayMusic.muted = true;
  tryPlay();
}

// 3) Как только пользователь хоть как-то взаимодействует —
//    снимаем mute и запускаем со звуком
function unlockAudio() {
  birthdayMusic.muted = false;
  birthdayMusic.volume = 0.55;
  tryPlay();
  ["pointerdown", "keydown", "touchstart", "scroll"].forEach((ev) =>
    window.removeEventListener(ev, unlockAudio)
  );
}

["pointerdown", "keydown", "touchstart", "scroll"].forEach((ev) =>
  window.addEventListener(ev, unlockAudio, { passive: true })
);

// 4) Пробуем перезапустить, когда вкладка снова становится видимой
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && birthdayMusic.paused) tryPlay();
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
let confetti = [];
let balloons = [];

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

function createConfettiPiece(initial = false) {
  const palette = ["#ff75a8", "#ffd166", "#79d6ff", "#b5a2ff", "#74efba", "#ff9f68"];
  confetti.push({
    x: Math.random() * width,
    y: initial ? Math.random() * height : -20,
    vx: (Math.random() - .5) * .35,
    vy: .35 + Math.random() * .75,
    width: 3 + Math.random() * 4,
    height: 2 + Math.random() * 3,
    rotation: Math.random() * Math.PI,
    rotationSpeed: (Math.random() - .5) * .08,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: .015 + Math.random() * .025,
    color: palette[Math.floor(Math.random() * palette.length)],
    opacity: .35 + Math.random() * .55
  });
}

function drawConfetti() {
  for (let i = confetti.length - 1; i >= 0; i--) {
    const piece = confetti[i];
    piece.sway += piece.swaySpeed;
    piece.x += piece.vx + Math.sin(piece.sway) * .18;
    piece.y += piece.vy;
    piece.rotation += piece.rotationSpeed;

    ctx.save();
    ctx.globalAlpha = piece.opacity;
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);
    ctx.fillStyle = piece.color;
    ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
    ctx.restore();

    if (piece.y > height + 24) confetti.splice(i, 1);
  }
  ctx.globalAlpha = 1;
}

function createBalloon(initial = false) {
  const palette = ["#ff719d", "#ffd166", "#78d6ff", "#b39ddb", "#76e6bd", "#ff9a70"];
  const radius = 16 + Math.random() * 12;
  balloons.push({
    x: Math.random() * (width - 80) + 40,
    y: initial ? Math.random() * (height + 80) : height + radius + 30,
    radius,
    speed: .28 + Math.random() * .42,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: .008 + Math.random() * .012,
    color: palette[Math.floor(Math.random() * palette.length)],
    opacity: .48 + Math.random() * .32,
    stringLength: 28 + Math.random() * 34
  });
}

function drawBalloons() {
  for (let i = balloons.length - 1; i >= 0; i--) {
    const balloon = balloons[i];
    balloon.sway += balloon.swaySpeed;
    balloon.y -= balloon.speed;
    balloon.x += Math.sin(balloon.sway) * .24;

    ctx.save();
    ctx.globalAlpha = balloon.opacity;
    ctx.translate(balloon.x, balloon.y);

    const gradient = ctx.createRadialGradient(
      -balloon.radius * .35,
      -balloon.radius * .45,
      2,
      0,
      0,
      balloon.radius
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(.18, balloon.color);
    gradient.addColorStop(1, balloon.color);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, balloon.radius * .78, balloon.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = balloon.color;
    ctx.beginPath();
    ctx.moveTo(-5, balloon.radius * .82);
    ctx.lineTo(5, balloon.radius * .82);
    ctx.lineTo(0, balloon.radius * 1.12);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,.48)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, balloon.radius * 1.1);
    ctx.bezierCurveTo(
      -8,
      balloon.radius * 1.1 + balloon.stringLength * .35,
      9,
      balloon.radius * 1.1 + balloon.stringLength * .65,
      0,
      balloon.radius * 1.1 + balloon.stringLength
    );
    ctx.stroke();
    ctx.restore();

    if (balloon.y + balloon.radius + balloon.stringLength < -20) balloons.splice(i, 1);
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
  drawBalloons();
  drawConfetti();
  drawParticles(fireworks);
  drawParticles(cursorParticles, true);
  requestAnimationFrame(animate);
}

resize();
window.addEventListener("resize", resize);

setInterval(() => {
  if (!document.hidden) createFirework();
}, 1100);

for (let i = 0; i < 42; i++) createConfettiPiece(true);
setInterval(() => {
  if (!document.hidden && confetti.length < 70) createConfettiPiece();
}, 280);

for (let i = 0; i < 7; i++) createBalloon(true);
setInterval(() => {
  if (!document.hidden && balloons.length < 14) createBalloon();
}, 2200);

createFirework(width * .25, height * .28);
createFirework(width * .75, height * .22);
animate();
