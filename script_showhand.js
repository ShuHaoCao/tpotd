const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = [
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
  "A",
];

// 爆笑 AI 名稱池
const AI_NAMES = [
  "隔壁張叔叔",
  "輸到只剩內褲",
  "三峽小賭聖",
  "我的牌沒救了",
  "發牌的搞我",
  "剛領薪水的韭菜",
  "只會梭哈的草泥馬",
  "路過的清潔阿伯",
  "這手牌一定贏",
  "賭場地下工作者",
  "東湖高進",
  "我老婆在後面",
  "再賭就剁手",
  "全場最肥的羊",
  "超級馬拉松選手",
  "只想回家的阿明",
];

let state = {
  players: [],
  deck: [],
  pot: 0,
  currentBet: 0,
  turn: 0,
  round: 0,
  isGameOver: false,
  playerName: "",
};

window.onload = () => {
  const savedName = localStorage.getItem("stud_playerName");
  if (savedName) {
    document.getElementById("p-name").value = savedName;
    const savedChips = localStorage.getItem(`stud_chips_${savedName}`) || 10000;
    document.getElementById("welcome-back").innerText =
      `好久不見，${savedName}！錢包還有：$${savedChips}`;
  }
};

function handleStartGame() {
  const name = document.getElementById("p-name").value.trim();
  if (!name) return alert("請輸入暱稱");

  state.playerName = name;
  localStorage.setItem("stud_playerName", name);

  let chips = parseInt(localStorage.getItem(`stud_chips_${name}`)) || 10000;
  document.getElementById("display-name").innerText = name;
  document.getElementById("login-screen").style.display = "none";

  // 初始化玩家與電腦 (電腦名稱隨機抽取)
  const shuffeledNames = AI_NAMES.sort(() => Math.random() - 0.5);
  state.players = [
    {
      name: name,
      chips: chips,
      hand: [],
      isFolded: false,
      currentBet: 0,
      isAI: false,
    },
    {
      name: shuffeledNames[0],
      chips: 10000,
      hand: [],
      isFolded: false,
      currentBet: 0,
      isAI: true,
    },
    {
      name: shuffeledNames[1],
      chips: 10000,
      hand: [],
      isFolded: false,
      currentBet: 0,
      isAI: true,
    },
    {
      name: shuffeledNames[2],
      chips: 10000,
      hand: [],
      isFolded: false,
      currentBet: 0,
      isAI: true,
    },
  ];

  // 更新介面上的 AI 名稱
  for (let i = 1; i <= 3; i++)
    document.getElementById(`name-${i}`).innerText = state.players[i].name;

  newGame();
}

function syncProgress() {
  const user = state.players[0];
  localStorage.setItem(`stud_chips_${state.playerName}`, user.chips);

  let lb = JSON.parse(localStorage.getItem("stud_global_lb") || "[]");
  let entry = lb.find((x) => x.name === state.playerName);
  if (entry) entry.score = user.chips;
  else lb.push({ name: state.playerName, score: user.chips });
  lb.sort((a, b) => b.score - a.score);
  localStorage.setItem("stud_global_lb", JSON.stringify(lb.slice(0, 10)));

  if (user.chips <= 0 && state.isGameOver)
    document.getElementById("btn-reset").style.display = "inline-block";
  else document.getElementById("btn-reset").style.display = "none";
}

function resetMoney() {
  state.players[0].chips = 1000;
  syncProgress();
  newGame();
}

function newGame() {
  if (state.players[0].chips <= 0) return log("您沒錢了，請重生！");

  state.deck = [];
  SUITS.forEach((s) =>
    RANKS.forEach((r) => state.deck.push({ s, r, v: RANKS.indexOf(r) })),
  );
  state.deck.sort(() => Math.random() - 0.5);

  state.pot = 0;
  state.currentBet = 100;
  state.round = 0;
  state.isGameOver = false;

  state.players.forEach((p) => {
    p.hand = [];
    p.currentBet = 0;
    if (p.isAI && p.chips < 100) p.chips = 5000; // AI 自動補款確保對手存在

    if (p.chips >= 100) {
      p.isFolded = false;
      p.chips -= 100;
      state.pot += 100;
    } else {
      p.isFolded = true;
    }
  });

  document.getElementById("btn-next").style.display = "none";
  syncProgress();
  dealCards(2);
}

async function dealCards(count) {
  for (let c = 0; c < count; c++) {
    for (let i = 0; i < 4; i++) {
      if (!state.players[i].isFolded)
        state.players[i].hand.push(state.deck.pop());
    }
  }
  state.round += count;
  updateUI();
  if (state.round < 5) startBetting();
  else showdown();
}

function updateUI() {
  state.players.forEach((p, i) => {
    const container = document.getElementById(`cards-${i}`);
    container.innerHTML = "";
    p.hand.forEach((card, idx) => {
      const div = document.createElement("div");
      div.className = "card" + (card.s === "♥" || card.s === "♦" ? " red" : "");
      if (idx === 0 && i !== 0 && !state.isGameOver) div.classList.add("back");
      else div.innerText = card.s + card.r;
      container.appendChild(div);
    });
    document.getElementById(`chips-${i}`).innerText = `$${p.chips}`;
    document.getElementById(`player-${i}`).className =
      "hand-area" +
      (state.turn === i && !state.isGameOver ? " active-turn" : "");
    document.getElementById(`player-${i}`).style.opacity = p.isFolded
      ? "0.4"
      : "1";
  });
  document.getElementById("main-pot").innerText = `$${state.pot}`;
}

function startBetting() {
  state.turn = 0;
  processTurn();
}

async function processTurn() {
  if (state.isGameOver) return;
  const active = state.players.filter((p) => !p.isFolded);
  if (active.length === 1) return endGame(active[0]);

  if (state.turn === 0) {
    if (state.players[0].isFolded) {
      nextTurn();
      return;
    }
    log("請下注");
    toggleControls(true);
  } else {
    toggleControls(false);
    if (state.players[state.turn].isFolded) {
      nextTurn();
      return;
    }
    log(`【${state.players[state.turn].name}】思考中...`);
    await new Promise((r) => setTimeout(r, 800));
    aiAction();
  }
}

function handleAction(type) {
  const p = state.players[0];
  let need = state.currentBet - p.currentBet;
  if (type === "fold") p.isFolded = true;
  else if (type === "call") {
    if (p.chips < need) return handleAction("allin");
    p.chips -= need;
    state.pot += need;
    p.currentBet = state.currentBet;
  } else if (type === "raise") {
    state.currentBet += 200;
    need = state.currentBet - p.currentBet;
    if (p.chips < need) return handleAction("allin");
    p.chips -= need;
    state.pot += need;
    p.currentBet = state.currentBet;
  } else if (type === "allin") {
    state.pot += p.chips;
    p.currentBet += p.chips;
    if (p.currentBet > state.currentBet) state.currentBet = p.currentBet;
    p.chips = 0;
  }
  syncProgress();
  nextTurn();
}

function aiAction() {
  const p = state.players[state.turn];
  const rand = Math.random();
  let need = state.currentBet - p.currentBet;

  if (rand < 0.1 && state.round > 2) {
    p.isFolded = true;
    log(`${p.name} 覺得沒戲，蓋牌了！`);
  } else if (rand < 0.8 || p.chips < need) {
    if (p.chips <= need) {
      state.pot += p.chips;
      p.currentBet += p.chips;
      p.chips = 0;
      log(`${p.name} 氣勢磅礡：All-in！`);
    } else {
      p.chips -= need;
      state.pot += need;
      p.currentBet = state.currentBet;
      log(`${p.name} 跟了。`);
    }
  } else {
    state.currentBet += 300;
    need = state.currentBet - p.currentBet;
    p.chips -= need;
    state.pot += need;
    p.currentBet = state.currentBet;
    log(`${p.name} 嘿嘿一笑：加注！`);
  }
  nextTurn();
}

function nextTurn() {
  state.turn++;
  if (state.turn >= 4) {
    if (state.round < 5) dealCards(1);
    else showdown();
  } else {
    processTurn();
  }
  updateUI();
}

function evaluateHand(hand) {
  const values = hand.map((c) => c.v).sort((a, b) => b - a);
  let score = values[0];
  const counts = {};
  values.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  const cList = Object.values(counts);
  if (cList.includes(4)) score += 8000;
  else if (cList.includes(3) && cList.includes(2)) score += 7000;
  else if (cList.includes(3)) score += 3000;
  else if (cList.filter((x) => x === 2).length === 2) score += 2000;
  else if (cList.includes(2)) score += 1000;
  return score;
}

function showdown() {
  state.isGameOver = true;
  updateUI();
  let winner = state.players
    .filter((p) => !p.isFolded)
    .sort((a, b) => evaluateHand(b.hand) - evaluateHand(a.hand))[0];
  endGame(winner);
}

function endGame(winner) {
  log(`恭喜！贏家是 【${winner.name}】！`);
  winner.chips += state.pot;
  state.pot = 0;
  state.isGameOver = true;
  updateUI();
  syncProgress();
  document.getElementById("btn-next").style.display = "inline-block";
  toggleControls(false);
}

function log(m) {
  document.getElementById("status-bar").innerText = m;
}
function toggleControls(s) {
  ["btn-fold", "btn-call", "btn-raise", "btn-allin"].forEach(
    (id) => (document.getElementById(id).disabled = !s),
  );
}

function toggleLB(show) {
  if (show) {
    const lb = JSON.parse(localStorage.getItem("stud_global_lb") || "[]");
    const tbody = document.querySelector("#lb-table tbody");
    tbody.innerHTML = lb
      .map(
        (x, i) =>
          `<tr><td>${i + 1}</td><td>${x.name}</td><td>$${x.score}</td></tr>`,
      )
      .join("");
    document.getElementById("leaderboard-screen").style.display = "flex";
  } else {
    document.getElementById("leaderboard-screen").style.display = "none";
  }
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
