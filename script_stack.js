const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const overlay = document.getElementById("overlay");
const mainBtn = document.getElementById("mainBtn");
const nameInput = document.getElementById("playerName");
const rankListEl = document.getElementById("rank-list");

let blocks = [],
  debris = [];
let gameState = "START";
let currentSpeed = 2.5; // 當前移動速度
let cameraY = 0;
let currentBlock = {};
let audioCtx = null;

// 排行榜資料
let playerName = localStorage.getItem("stack_game_name") || "";
let highScores = JSON.parse(localStorage.getItem("stack_game_ranks")) || [];

nameInput.value = playerName;
updateRankDisplay();

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

function start() {
  playerName = nameInput.value.trim() || "匿名同事";
  localStorage.setItem("stack_game_name", playerName);

  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();

  blocks = [
    {
      x: (canvas.width - 200) / 2,
      y: canvas.height - 150,
      width: 200,
      color: 200,
    },
  ];
  debris = [];
  scoreEl.innerText = "0";
  currentSpeed = 2.5;
  cameraY = 0;
  newBlock();
  gameState = "PLAYING";
  overlay.style.display = "none";
  requestAnimationFrame(animate);
}

function newBlock() {
  const last = blocks[blocks.length - 1];
  const level = blocks.length;

  // --- 隨機速度邏輯 ---
  // 1. 基礎速度隨層數提升
  let baseSpeed = 2.5 + level * 0.05;

  // 2. 隨機性判定
  const rand = Math.random();
  if (rand > 0.8) {
    // 20% 機率：突然加速 (1.5 ~ 2.0 倍基礎速度)
    currentSpeed = baseSpeed * (1.5 + Math.random() * 0.5);
  } else if (rand < 0.15) {
    // 15% 機率：突然減速 (0.6 ~ 0.8 倍基礎速度)
    currentSpeed = baseSpeed * (0.6 + Math.random() * 0.2);
  } else {
    // 正常速度
    currentSpeed = baseSpeed;
  }

  // 限制最高速度不要超過畫面寬度的 2%，避免完全無法反應
  const maxLimit = canvas.width * 0.025;
  if (currentSpeed > maxLimit) currentSpeed = maxLimit;

  currentBlock = {
    x: 0,
    y: last.y - 45,
    width: last.width,
    direction: 1,
    color: 200 + ((level * 15) % 360),
  };
}

function animate() {
  if (gameState !== "PLAYING" && gameState !== "OVER") return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const targetCam = (blocks.length - 4) * 45;
  cameraY += (targetCam - cameraY) * 0.1;

  ctx.save();
  ctx.translate(0, cameraY);

  debris.forEach((d, i) => {
    d.y += d.vy;
    d.vy += 0.6;
    d.opacity -= 0.03;
    ctx.fillStyle = `hsla(${d.color}, 70%, 50%, ${d.opacity})`;
    ctx.fillRect(d.x, d.y, d.width, 43);
    if (d.opacity <= 0) debris.splice(i, 1);
  });

  blocks.forEach((b) => {
    ctx.fillStyle = `hsl(${b.color}, 70%, 60%)`;
    ctx.fillRect(b.x, b.y, b.width, 43);
  });

  if (gameState === "PLAYING") {
    // 使用隨機計算出的 currentSpeed
    currentBlock.x += currentSpeed * currentBlock.direction;
    if (
      currentBlock.x + currentBlock.width > canvas.width ||
      currentBlock.x <= 0
    )
      currentBlock.direction *= -1;
    ctx.fillStyle = `hsl(${currentBlock.color}, 70%, 60%)`;
    ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.width, 43);
  }

  ctx.restore();
  requestAnimationFrame(animate);
}

// 輸入監聽
const filterTags = ["BUTTON", "INPUT"];
window.addEventListener("mousedown", (e) => {
  if (filterTags.includes(e.target.tagName)) return;
  handleInput();
});

window.addEventListener(
  "touchstart",
  (e) => {
    if (filterTags.includes(e.target.tagName)) return;
    e.preventDefault();
    handleInput();
  },
  { passive: false },
);

function handleInput() {
  if (gameState === "PLAYING") {
    const last = blocks[blocks.length - 1];
    const diff = currentBlock.x - last.x;

    if (Math.abs(diff) >= currentBlock.width) {
      gameState = "OVER";
      saveScore(blocks.length - 1);
      showGameOver();
    } else {
      if (Math.abs(diff) > 8) {
        let dWidth = Math.abs(diff);
        let dX =
          diff > 0
            ? currentBlock.x + (currentBlock.width - diff)
            : currentBlock.x;
        debris.push({
          x: dX,
          y: currentBlock.y,
          width: dWidth,
          color: currentBlock.color,
          vy: 2,
          opacity: 1,
        });
        currentBlock.width -= dWidth;
        if (diff < 0) currentBlock.x = last.x;
      } else {
        currentBlock.x = last.x; // Perfect!
      }
      blocks.push({ ...currentBlock });
      scoreEl.innerText = blocks.length - 1;
      newBlock(); // 每一層都會觸發隨機速度檢查
    }
  }
}

function saveScore(score) {
  highScores.push({
    name: playerName,
    score: score,
    date: new Date().getTime(),
  });
  highScores.sort((a, b) => b.score - a.score || b.date - a.date);
  highScores = highScores.slice(0, 10);
  localStorage.setItem("stack_game_ranks", JSON.stringify(highScores));
  updateRankDisplay();
}

function updateRankDisplay() {
  if (highScores.length === 0) {
    rankListEl.innerHTML = `<div style="text-align:center; opacity:0.5;">尚無紀錄</div>`;
    return;
  }
  rankListEl.innerHTML = highScores
    .map(
      (item, index) => `
          <div class="rank-item">
            <span>${index + 1}. <span class="rank-name">${item.name}</span></span>
            <span><b>${item.score}</b> 層</span>
          </div>
        `,
    )
    .join("");
}

function showGameOver() {
  const score = blocks.length - 1;
  document.getElementById("title").innerText = "遊戲結束: " + score + " 層";
  mainBtn.innerText = "再蓋一棟";
  overlay.style.display = "flex";
}

mainBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  start();
});
// 1. 禁用滑鼠右鍵選單
document.oncontextmenu = function () {
  console.warn("系統提示：為了保護排版參數，已禁用右鍵功能。");
  return false;
};

// 2. 禁用常用開發者工具快捷鍵
document.onkeydown = function (e) {
  // 禁用 F12 (keyCode 123)
  // 禁用 Ctrl+Shift+I (i = 73)
  // 禁用 Ctrl+Shift+J (j = 74)
  // 禁用 Ctrl+U (檢視原始碼, u = 85)
  if (
    e.keyCode === 123 ||
    (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
    (e.ctrlKey && e.keyCode === 85)
  ) {
    console.warn("系統提示：禁止開啟開發者工具或檢視原始碼。");
    return false;
  }
};

// 3. Console 警告 (當有人強行開啟開發者工具時顯示)
(function () {
  const warningStyle =
    "font-size: 20px; color: red; font-weight: bold; background: yellow; padding: 10px;";
  const infoStyle = "font-size: 14px; color: #333;";

  console.log("%c⚠️ 警告：版權所有 ⚠️", warningStyle);
  console.log(
    "%c本程式由 CaoShuHao 開發，專供台南郵局運輸股內部使用。",
    infoStyle,
  );
  console.log(
    "%c未經授權嚴禁複製、修改或轉載原始碼。所有排版參數均受保護。",
    infoStyle,
  );
})();
// 監測視窗調整，若開發者工具側邊開啟則觸發
window.onresize = function () {
  if (
    window.outerHeight - window.innerHeight > 200 ||
    window.outerWidth - window.innerWidth > 200
  ) {
    document.body.innerHTML =
      "<h1 style='text-align:center; margin-top:100px;'>偵測到非正常操作，請關閉開發者工具後重整頁面。</h1>";
  }
};
if (window.location.hostname !== "shuhaocao.github.io") {
  document.documentElement.innerHTML =
    "<h1>授權無效：此工具僅限官方網址使用。</h1>";
  window.stop();
}
async function validateAccess() {
  try {
    const resp = await fetch("access.json");
    const config = await resp.json();
    if (config.status !== "active") {
      throw new Error("系統已停用");
    }
  } catch (e) {
    document.body.innerHTML = "<h1>驗證失敗，請聯繫管理員</h1>";
  }
}
validateAccess();
