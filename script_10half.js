const AI_NAMES = [
  "剛看完教學的隔壁老王",
  "輸到脫褲子的賭神",
  "只想下班的阿明",
  "自以為會算牌的小明",
  "連輸 10 把的邊緣人",
  "數學老師在哭泣",
  "拿 A 以為是 10 的路人",
  "不想努力的阿姨",
  "亂出牌的隔壁大嬸",
  "賭場派來送分的",
  "不抽牌會死的強迫症",
  "永遠在爆煲的衰鬼",
  "隔壁村的老司機",
  "靠直覺在玩的小朋友",
  "以為自己在玩 21 點",
];

const QUOTES = {
  hit: [
    "再一張，一定可以！",
    "搏一把大的！",
    "這張牌一定很正。",
    "我有預感...",
  ],
  bust: ["靠！爆了啦！", "這運氣也太背...", "我不玩了啦 (嗚嗚)", "計算錯誤..."],
  stand: ["我覺得這樣就夠了。", "見好就收。", "莊家死定了。", "穩紮穩打。"],
  win: [
    "哈哈！我就知道！",
    "運氣也是實力的一種。",
    "承讓承讓。",
    "今天的運氣全在這了！",
  ],
};

let playerName = "";
let playerChips = 100;
let currentRound = 0;
let aiNamesInGame = [];
let currentBet = 10;
const MAX_ROUNDS = 10;
let deck = [];
let players = [];
const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

window.onload = () => {
  const savedName = localStorage.getItem("poker_105_name");
  if (savedName) document.getElementById("player-name-input").value = savedName;
  updateLeaderboard();
};

function startGame() {
  const input = document.getElementById("player-name-input").value.trim();
  if (!input) return alert("請輸入暱稱，不然莊家會生氣");
  playerName = input;
  localStorage.setItem("poker_105_name", playerName);
  document.getElementById("display-name").innerText = `玩家：${playerName}`;
  document.getElementById("login-screen").style.display = "none";
  pickRandomAIs();
  resetGameSeries();
}

function showBubble(playerId, type) {
  const el = document.getElementById(`bubble-${playerId}`);
  if (!el) return;
  const list = QUOTES[type];
  el.innerText = list[Math.floor(Math.random() * list.length)];
  el.style.opacity = "1";
  setTimeout(() => (el.style.opacity = "0"), 2000);
}

function pickRandomAIs() {
  const shuffled = [...AI_NAMES].sort(() => 0.5 - Math.random());
  aiNamesInGame = [shuffled[0], shuffled[1]];
  document.getElementById("name-p1").innerText = "👤 " + aiNamesInGame[0];
  document.getElementById("name-p2").innerText = "👤 " + aiNamesInGame[1];
}

function resetGameSeries() {
  playerChips = 100;
  currentRound = 0;
  document.getElementById("btn-next").innerText = "挑戰第 1 回合";
  document.getElementById("btn-next").disabled = false;
  updateUI();
}

function createDeck() {
  deck = [];
  for (let s of SUITS) {
    for (let v of VALUES) {
      let pts = ["J", "Q", "K"].includes(v) ? 0.5 : v === "A" ? 1 : parseInt(v);
      deck.push({
        suit: s,
        val: v,
        points: pts,
        color: s === "♥" || s === "♦" ? "red" : "",
      });
    }
  }
  deck.sort(() => Math.random() - 0.5);
}

function initRound() {
  const betInput = document.getElementById("bet-amount");
  currentBet = parseInt(betInput.value);
  if (currentBet > playerChips) {
    alert("積分不足，別想賒帳！");
    betInput.value = playerChips;
    return;
  }

  currentRound++;
  if (currentRound > MAX_ROUNDS) {
    pickRandomAIs();
    resetGameSeries();
    currentRound = 1;
  }

  document.body.classList.remove("bg-bust");
  createDeck();
  document.getElementById("btn-next").disabled = true;
  betInput.disabled = true;
  document.getElementById("round-counter").innerText =
    `回合: ${currentRound} / ${MAX_ROUNDS}`;
  document.getElementById("status-msg").innerText = "洗牌中，別想偷看...";

  players = [
    {
      id: "dealer",
      name: "莊家",
      cards: [],
      score: 0,
      isDone: false,
      isBust: false,
    },
    {
      id: "p1",
      name: aiNamesInGame[0],
      cards: [],
      score: 0,
      isDone: false,
      isBust: false,
    },
    {
      id: "p2",
      name: aiNamesInGame[1],
      cards: [],
      score: 0,
      isDone: false,
      isBust: false,
    },
    {
      id: "user",
      name: playerName,
      cards: [],
      score: 0,
      isDone: false,
      isBust: false,
    },
  ];

  players.forEach((p) => hit(p));
  updateUI();
  processAI(1);
}

function hit(player) {
  const card = deck.pop();
  player.cards.push(card);
  player.score = player.cards.reduce((sum, c) => sum + c.points, 0);
  if (player.score > 10.5) {
    player.isBust = true;
    if (player.id !== "user" && player.id !== "dealer")
      showBubble(player.id, "bust");
    if (player.id === "user") document.body.classList.add("bg-bust");
  }
  if (player.cards.length >= 5 && player.score <= 10.5) player.isDone = true;
}

async function processAI(idx) {
  if (idx > 2) {
    document.getElementById("status-msg").innerText = "換你了，別在那邊發呆";
    document.getElementById("area-player").classList.add("active-turn");
    document.getElementById("btn-hit").disabled = false;
    document.getElementById("btn-stand").disabled = false;
    return;
  }
  const p = players[idx];
  document.getElementById(`area-${p.id}`).classList.add("active-turn");
  let target = 7 + Math.random() * 2;
  while (!p.isBust && !p.isDone && p.score < target) {
    await new Promise((r) => setTimeout(r, 800));
    showBubble(p.id, "hit");
    hit(p);
    updateUI();
  }
  if (!p.isBust) showBubble(p.id, "stand");
  p.isDone = true;
  document.getElementById(`area-${p.id}`).classList.remove("active-turn");
  processAI(idx + 1);
}

function playerHit() {
  const p = players[3];
  hit(p);
  updateUI();
  if (p.isBust || p.isDone) playerStand();
}

function playerStand() {
  players[3].isDone = true;
  document.getElementById("btn-hit").disabled = true;
  document.getElementById("btn-stand").disabled = true;
  document.getElementById("area-player").classList.remove("active-turn");
  processDealer();
}

async function processDealer() {
  const d = players[0];
  document.getElementById("area-dealer").classList.add("active-turn");
  document.getElementById("status-msg").innerText = "莊家冷笑中...";

  let maxEnemyScore = 0;
  players.slice(1).forEach((p) => {
    if (!p.isBust && p.score > maxEnemyScore) maxEnemyScore = p.score;
  });

  // 莊家策略：平手即勝，所以只要超過最大玩家或 9 點就停
  while (!d.isBust && !d.isDone) {
    if (d.score > maxEnemyScore || d.score >= 9.5) break;
    await new Promise((r) => setTimeout(r, 800));
    hit(d);
    updateUI();
  }
  d.isDone = true;
  document.getElementById("area-dealer").classList.remove("active-turn");
  endRound();
}

function endRound() {
  const d = players[0];
  const p = players[3];
  let multiplier = 0;
  let msg = "";

  if (p.isBust) {
    msg = "你爆了，真是個好預兆";
    multiplier = -1;
  } else if (d.isBust) {
    msg = "莊家也爆了，算你走運";
    multiplier = 1;
  } else if (p.cards.length >= 5) {
    msg = "過五關！送你兩倍積分！";
    multiplier = 2;
  } else if (p.score > d.score) {
    msg = "贏了莊家，看來你有前途";
    multiplier = 1;
  } else if (p.score === d.score) {
    msg = "莊家平手通殺，殘念！";
    multiplier = -1;
  } else {
    msg = "莊家食夾棍，感謝你的捐獻";
    multiplier = -1;
  }

  playerChips += currentBet * multiplier;
  if (playerChips < 0) playerChips = 0;

  updateUI();

  if (multiplier > 0) showBubble("p1", "win");

  document.getElementById("bet-amount").disabled = false;
  if (currentRound < MAX_ROUNDS && playerChips > 0) {
    document.getElementById("status-msg").innerText = msg;
    document.getElementById("btn-next").disabled = false;
    document.getElementById("btn-next").innerText =
      `第 ${currentRound + 1} 回合`;
  } else {
    const finalMsg =
      playerChips <= 0
        ? "你破產了！送你去郵件處理中心勞改"
        : `10 回合終結！最終分數：${playerChips}`;
    document.getElementById("status-msg").innerText = finalMsg;
    document.getElementById("btn-next").disabled = false;
    document.getElementById("btn-next").innerText = "重新開始";
    saveFinalScore();
    updateLeaderboard();
  }
}

function updateUI() {
  players.forEach((p) => {
    const container = document.getElementById(
      `cards-${p.id === "user" ? "user" : p.id}`,
    );
    if (!container) return;
    container.innerHTML = "";
    p.cards.forEach((c) => {
      const div = document.createElement("div");
      div.className = `card ${c.color}`;
      div.innerHTML = `<span>${c.suit}</span><span>${c.val}</span>`;
      container.appendChild(div);
    });

    let scoreText = p.isBust ? "😂 爆煲" : p.score + " 點";
    if (p.cards.length >= 5 && !p.isBust) scoreText = "🐉 過五關";

    const scoreEl = document.getElementById(
      `score-${p.id === "user" ? "user" : p.id}`,
    );
    scoreEl.innerText = scoreText;
    if (p.score >= 9 && !p.isBust) scoreEl.style.color = "var(--accent-color)";
    else if (p.isBust) scoreEl.style.color = "var(--danger-color)";
    else scoreEl.style.color = "white";
  });
  document.getElementById("player-chips").innerText =
    `目前積分: ${playerChips}`;
}

function saveFinalScore() {
  let board = JSON.parse(localStorage.getItem("poker_105_fun_board") || "[]");
  board.push({ name: playerName, score: playerChips });
  board.sort((a, b) => b.score - a.score);
  board = board.slice(0, 10);
  localStorage.setItem("poker_105_fun_board", JSON.stringify(board));
}

function updateLeaderboard() {
  const board = JSON.parse(localStorage.getItem("poker_105_fun_board") || "[]");
  const tbody = document.querySelector("#leaderboard-table tbody");
  tbody.innerHTML = "";
  board.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx + 1}</td><td>${item.name}</td><td>${item.score}</td>`;
    tbody.appendChild(tr);
  });
}
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
