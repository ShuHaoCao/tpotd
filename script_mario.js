let playerName = "";
const sounds = {
  bet: new Audio("bet.mp3"),
  reset: new Audio("reset.mp3"),
  start: new Audio("start.mp3"),
  tick: new Audio("tick.mp3"),
  winSmall: new Audio("win.mp3"),
  winBig: new Audio("big_win.mp3"),
  onceMore: new Audio("bonus.mp3"),
};

const items = [
  {
    icon: "💰",
    img: "bonus.png",
    label: "年終獎金",
    type: "bonus",
    rate: 100,
  },
  {
    icon: "🌙",
    img: "overtimepay.png",
    label: "加班費",
    type: "ot",
    rate: 50,
  },
  {
    icon: "🏖️",
    img: "vacation.png",
    label: "公特休假",
    type: "leave",
    rate: 40,
  },
  {
    icon: "🍐",
    img: "wendan.png",
    label: "麻豆文旦",
    type: "pomelo",
    rate: 30,
  },
  {
    icon: "📦",
    img: "momo.png",
    label: "MOMO包裹",
    type: "momo",
    rate: 20,
  },
  {
    icon: "🧳",
    img: "wanguo.png",
    label: "萬國行李箱",
    type: "box",
    rate: 15,
  },
  {
    icon: "🚛",
    img: "17toncar.png",
    label: "17噸郵車",
    type: "truck",
    rate: 10,
  },
  {
    icon: "🛒",
    img: "parcelcart.png",
    label: "包裹籃車",
    type: "cart_f",
    rate: 5,
  },
  {
    icon: "🗑️",
    img: "blankcart.png",
    label: "空籃車",
    type: "cart_e",
    rate: 2,
  },
];

// 關鍵修正 1：重新對齊內容與座標 (順時針順序)
const pathData = [
  { type: "item", id: 0 },
  { type: "item", id: 8 },
  { type: "item", id: 7 },
  { type: "item", id: 6 },
  { type: "special", label: "ONCE MORE" },
  { type: "item", id: 5 },
  { type: "item", id: 4 },
  { type: "item", id: 3 },
  { type: "item", id: 1 },
  { type: "item", id: 8 },
  { type: "item", id: 7 },
  { type: "item", id: 2 },
  { type: "item", id: 6 },
  { type: "special", label: "ONCE MORE" },
  { type: "item", id: 5 },
  { type: "item", id: 4 },
  { type: "item", id: 3 },
  { type: "item", id: 0 },
  { type: "item", id: 8 },
  { type: "item", id: 7 },
  { type: "item", id: 6 },
  { type: "item", id: 5 },
  { type: "item", id: 4 },
  { type: "item", id: 2 },
];

const coords = [
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [1, 5],
  [1, 6],
  [1, 7],
  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],
  [6, 8],
  [6, 7],
  [6, 6],
  [6, 5],
  [6, 4],
  [6, 3],
  [6, 2],
  [6, 1],
  [5, 1],
  [4, 1],
  [3, 1],
  [2, 1],
];

let credit = 1000,
  win = 0,
  isPlaying = false,
  currentIndex = 0;
let currentBets = {};
items.forEach((i) => (currentBets[i.type] = 0));

async function preloadResources() {
  const imgSources = [
    ...new Set(items.map((i) => i.img)),
    "titlename.png",
    "bonus.png",
  ];
  const loadImg = (src) =>
    new Promise((res) => {
      const img = new Image();
      img.src = src;
      img.onload = res;
      img.onerror = res;
    });
  const loadAudio = (audio) =>
    new Promise((res) => {
      audio.addEventListener("canplaythrough", res, { once: true });
      setTimeout(res, 2000);
    });
  try {
    await Promise.all([
      ...imgSources.map(loadImg),
      ...Object.values(sounds).map(loadAudio),
    ]);
  } finally {
    document.getElementById("loader").style.display = "none";
    initPlayer();
  }
}

function initPlayer() {
  let savedName = localStorage.getItem("post_player_name");
  if (!savedName) {
    savedName = prompt("歡迎來到小瑪莉：黃金傳說！請輸入您的暱稱：", "阿嘉");
    if (!savedName) savedName = "無名小卒";
    localStorage.setItem("post_player_name", savedName);
  }
  playerName = savedName;
  document.getElementById("player-name-display").innerText =
    `玩家：${playerName}`;
}

function updateLeaderboard(finalWin) {
  let board = JSON.parse(localStorage.getItem("post_leaderboard") || "[]");
  board.push({
    name: playerName,
    score: finalWin,
    date: new Date().toLocaleDateString(),
  });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem("post_leaderboard", JSON.stringify(board.slice(0, 10)));
}

function showLeaderboard() {
  const board = JSON.parse(localStorage.getItem("post_leaderboard") || "[]");
  let msg = "🏆 排行榜TOP 10 🏆\n\n";
  if (board.length === 0) msg += "尚無紀錄";
  else
    board.forEach((record, idx) => {
      msg += `${idx + 1}. ${record.name} - ${record.score} 分 (${record.date})\n`;
    });
  alert(msg);
}

function playSound(name) {
  if (sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play().catch(() => {});
  }
}

const machine = document.getElementById("machine-grid");
pathData.forEach((data, idx) => {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.id = `cell-${idx}`;
  cell.style.gridRow = coords[idx][0];
  cell.style.gridColumn = coords[idx][1];
  if (data.type === "special") {
    cell.classList.add("special");
    cell.innerHTML = `<span>ONCE<br>MORE</span>`;
  } else {
    const item = items[data.id];
    const img = document.createElement("img");
    img.src = item.img;
    const span = document.createElement("span");
    span.innerText = item.label;
    img.onload = () => cell.classList.add("has-image");
    img.onerror = () => (img.style.display = "none");
    cell.appendChild(img);
    cell.appendChild(span);
  }
  machine.appendChild(cell);
});
document.getElementById("cell-0").classList.add("active");

const betPanel = document.getElementById("bet-panel");
items.forEach((item) => {
  const btn = document.createElement("div");
  btn.className = "bet-button";
  const cost = Math.max(1, Math.ceil(item.rate / 2.5));
  btn.innerHTML = `
            <div class="bet-img-area"><img src="${item.img}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"><span style="display:none">${item.label}</span></div>
            <div class="bet-info-area"><div class="rate-display">x${item.rate} (費:${cost})</div><div class="count-display" id="bet-${item.type}">0</div></div>
        `;
  btn.onclick = () => {
    placeBet(item.type, cost);
  };
  betPanel.appendChild(btn);
});

function placeBet(type, cost) {
  if (isPlaying || currentBets[type] >= 99) return;
  if (credit < cost) {
    document.getElementById("game-msg").innerText = "籌碼不足！";
    return;
  }
  playSound("bet");
  currentBets[type]++;
  credit -= cost;
  updateDisplay();
}

function resetBets() {
  if (isPlaying) return;
  playSound("reset");
  items.forEach((i) => {
    const cost = Math.max(1, Math.ceil(i.rate / 2.5));
    credit += currentBets[i.type] * cost;
    currentBets[i.type] = 0;
  });
  updateDisplay();
}

function updateDisplay() {
  document.getElementById("credit-display").innerText = credit
    .toString()
    .padStart(4, "0");
  document.getElementById("win-display").innerText = win
    .toString()
    .padStart(4, "0");
  items.forEach(
    (i) =>
      (document.getElementById(`bet-${i.type}`).innerText =
        currentBets[i.type]),
  );
}

function fullHouseEffect() {
  const allCells = document.querySelectorAll(".cell");
  allCells.forEach((c) => c.classList.add("full-flash"));
  setTimeout(() => {
    allCells.forEach((c) => c.classList.remove("full-flash"));
  }, 3000);
}

// 關鍵修正 2：確保步數計算正確對應視覺位置
function startGame(isFree = false) {
  const totalBet = Object.values(currentBets).reduce((a, b) => a + b, 0);
  if (isPlaying || (!isFree && totalBet === 0)) return;

  isPlaying = true;
  playSound("start");
  document.querySelectorAll(".btn-main").forEach((b) => (b.disabled = true));
  document.getElementById("game-msg").innerText = isFree
    ? "FREE SPIN!"
    : "正在處理運送中...";

  const targetIndex = Math.floor(Math.random() * pathData.length);
  const totalSteps =
    pathData.length * 3 +
    ((targetIndex - currentIndex + pathData.length) % pathData.length);
  let currentStep = 0,
    speed = 150;

  function run() {
    document.getElementById(`cell-${currentIndex}`).classList.remove("active");
    currentIndex = (currentIndex + 1) % pathData.length;
    document.getElementById(`cell-${currentIndex}`).classList.add("active");
    playSound("tick");
    currentStep++;
    if (currentStep < totalSteps - 12) speed = Math.max(30, speed - 20);
    else speed += 40;
    if (currentStep < totalSteps) setTimeout(run, speed);
    else handleResult(currentIndex); // 使用最終停下的索引判定
  }
  run();
}

function handleResult(index) {
  const res = pathData[index];
  if (res.type === "special") {
    playSound("onceMore");
    document.getElementById("game-msg").innerText = "加碼再一圈！";
    setTimeout(() => {
      isPlaying = false;
      startGame(true);
    }, 1000);
    return;
  }

  const landed = items[res.id];
  const prize = currentBets[landed.type] * landed.rate;

  if (prize > 0) {
    win += prize;
    credit += prize;
    document.getElementById("game-msg").innerText = `獲得 ${prize} 分！`;
    if (landed.rate >= 100) {
      playSound("winBig");
      fullHouseEffect();
    } else playSound("winSmall");
  } else {
    document.getElementById("game-msg").innerText = "再接再厲！";
  }

  items.forEach((i) => (currentBets[i.type] = 0));
  isPlaying = false;
  document.querySelectorAll(".btn-main").forEach((b) => (b.disabled = false));
  updateDisplay();
  checkGameOver();
}

function checkGameOver() {
  if (
    credit < 1 &&
    Object.values(currentBets).reduce((a, b) => a + b, 0) === 0
  ) {
    if (win > 0) updateLeaderboard(win);
    setTimeout(() => {
      if (confirm(`點數已用光！本次結算得分：${win}\n是否重新開始新的一局？`)) {
        credit = 100;
        win = 0;
        updateDisplay();
        document.getElementById("game-msg").innerText = "重新開始！";
      } else {
        document.body.innerHTML =
          "<h1 style='color:white;text-align:center;margin-top:20%'>遊戲已結束，請關閉分頁。</h1>";
      }
    }, 500);
  }
}

window.onload = preloadResources;
updateDisplay();

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
