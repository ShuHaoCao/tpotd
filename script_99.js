const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playTone(freq, type, duration) {
  if (!audioCtx) audioCtx = new AudioCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

const sounds = {
  play: () => playTone(523, "sine", 0.2),
  special: () => playTone(880, "square", 0.1),
  danger: () => playTone(110, "sawtooth", 0.5),
  win: () => {
    playTone(523, "sine", 0.2);
    setTimeout(() => playTone(659, "sine", 0.2), 150);
  },
  shuffle: () => playTone(300, "triangle", 0.3),
};

const npcNames = ["智慧大雄", "冷酷技安", "算計阿福", "賭神老王", "策略小美"];
let gameState = {
  total: 0,
  currentPlayer: 0,
  direction: 1,
  deck: [],
  discardPile: [],
  players: [[], [], [], []],
  names: ["你"],
  isOver: false,
  selectedIndex: -1,
  aliveStatus: [true, true, true, true],
  survivedTurns: 0,
};

// 初始化與記憶功能
window.onload = () => {
  const savedName = localStorage.getItem("poker99_name");
  if (savedName) document.getElementById("player-name-input").value = savedName;
};

function toggleRules(show) {
  document.getElementById("modal-rules").style.display = show ? "flex" : "none";
}

function toggleLeaderboard(show) {
  if (show) {
    const list = document.getElementById("leaderboard-list");
    const data = JSON.parse(localStorage.getItem("poker99_board") || "[]");
    list.innerHTML = data.length
      ? ""
      : "<p style='text-align:center'>暫無紀錄</p>";
    data.forEach((item, i) => {
      list.innerHTML += `<li><span>#${i + 1} ${item.name}</span><span>${item.score} 回合</span></li>`;
    });
  }
  document.getElementById("modal-leaderboard").style.display = show
    ? "flex"
    : "none";
}

function confirmStart() {
  const name =
    document.getElementById("player-name-input").value.trim() || "無名英雄";
  gameState.names[0] = name;
  document.getElementById("name-0").innerText = name;
  localStorage.setItem("poker99_name", name);
  document.getElementById("modal-start").style.display = "none";
  init();
}

function saveScore(name, score) {
  let board = JSON.parse(localStorage.getItem("poker99_board") || "[]");
  board.push({ name, score });
  board.sort((a, b) => b.score - a.score);
  board = board.slice(0, 10);
  localStorage.setItem("poker99_board", JSON.stringify(board));
}

function resetGame() {
  gameState = {
    total: 0,
    currentPlayer: 0,
    direction: 1,
    deck: [],
    discardPile: [],
    players: [[], [], [], []],
    names: [gameState.names[0]],
    isOver: false,
    selectedIndex: -1,
    aliveStatus: [true, true, true, true],
    survivedTurns: 0,
  };
  document.getElementById("restart-btn").style.display = "none";
  document.getElementById("center-zone").classList.remove("danger-mode");
  document
    .querySelectorAll(".player-zone")
    .forEach((z) => z.classList.remove("eliminated", "active-turn"));
  init();
}

function init() {
  const shuffledNames = [...npcNames].sort(() => Math.random() - 0.5);
  for (let i = 1; i <= 3; i++) {
    gameState.names[i] = shuffledNames[i - 1];
    document.getElementById(`name-${i}`).innerText = gameState.names[i];
  }

  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = [
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
  let fullDeck = [];
  suits.forEach((s) =>
    ranks.forEach((r) =>
      fullDeck.push({ s, r, color: s === "♥" || s === "♦" ? "red" : "" }),
    ),
  );
  gameState.deck = fullDeck.sort(() => Math.random() - 0.5);

  for (let i = 0; i < 4; i++)
    gameState.players[i] = gameState.deck.splice(0, 5);

  updateUI();
  gameState.currentPlayer = 0;
  highlightTurn();
  document.getElementById("log-text").innerText = "戰局開始，活下去！";
}

function drawCard() {
  if (gameState.deck.length === 0) {
    gameState.deck = [...gameState.discardPile].sort(() => Math.random() - 0.5);
    gameState.discardPile = [];
    sounds.shuffle();
  }
  return gameState.deck.pop();
}

function updateUI() {
  const totalDisp = document.getElementById("total-display");
  totalDisp.innerText = gameState.total;

  if (gameState.total >= 90)
    document.getElementById("center-zone").classList.add("danger-mode");
  else document.getElementById("center-zone").classList.remove("danger-mode");

  for (let i = 0; i < 4; i++) {
    const handEl = document.getElementById(`hand-${i}`);
    const zoneEl = document.getElementById(`zone-${i}`);
    handEl.innerHTML = "";
    if (!gameState.aliveStatus[i]) {
      zoneEl.classList.add("eliminated");
      continue;
    }

    gameState.players[i].forEach((card, idx) => {
      const div = document.createElement("div");
      div.className = `card ${i === 0 ? card.color : "npc-card"}`;
      if (i === 0 && gameState.selectedIndex === idx)
        div.classList.add("selected");
      div.innerText = i === 0 ? `${card.s}${card.r}` : "?";
      if (i === 0)
        div.onclick = (e) => {
          e.stopPropagation();
          handlePlayerClick(idx);
        };
      handEl.appendChild(div);
    });
  }
}

async function handlePlay(pIdx, cIdx) {
  if (gameState.isOver) return;
  document
    .querySelectorAll(".player-zone")
    .forEach((z) => z.classList.remove("active-turn"));

  const card = gameState.players[pIdx][cIdx];
  if (pIdx === 0) gameState.survivedTurns++; // 玩家出牌計數

  gameState.discardPile.push(card);
  const cardEls = document.getElementById(`hand-${pIdx}`).children;
  if (cardEls[cIdx]) cardEls[cIdx].classList.add("playing");

  ["A", "10", "J", "Q", "K", "4", "5"].includes(card.r)
    ? sounds.special()
    : sounds.play();

  let effectMsg = applyRule(card, pIdx);
  document.getElementById("sub-log").innerText =
    `${gameState.names[pIdx]} 出牌: ${card.s}${card.r} (${effectMsg})`;

  if (gameState.total > 99) {
    gameState.aliveStatus[pIdx] = false;
    sounds.danger();
    document.getElementById("log-text").innerText =
      `💀 ${gameState.names[pIdx]} 出局！`;
    if (pIdx === 0) {
      gameState.isOver = true;
      saveScore(gameState.names[0], gameState.survivedTurns);
      updateUI();
      document.getElementById("restart-btn").style.display = "block";
      return;
    }
  }

  await new Promise((r) => setTimeout(r, 600));
  gameState.players[pIdx].splice(cIdx, 1);
  gameState.players[pIdx].push(drawCard());

  // 勝利判定
  if (
    gameState.aliveStatus.filter((s) => s).length === 1 &&
    gameState.aliveStatus[0]
  ) {
    gameState.isOver = true;
    sounds.win();
    saveScore(gameState.names[0], gameState.survivedTurns);
    document.getElementById("log-text").innerText =
      `🏆 冠軍！生存 ${gameState.survivedTurns} 回合`;
    document.getElementById("restart-btn").style.display = "block";
    updateUI();
    return;
  }

  if (card.r !== "5") {
    do {
      gameState.currentPlayer =
        (gameState.currentPlayer + gameState.direction + 4) % 4;
    } while (!gameState.aliveStatus[gameState.currentPlayer]);
  }

  updateUI();
  highlightTurn();
  if (gameState.currentPlayer !== 0) setTimeout(npcMove, 800);
}

function applyRule(card, pIdx) {
  const r = card.r;
  const s = card.s;
  let msg = "";
  if (r === "A") {
    if (s === "♠") {
      gameState.total = 0;
      msg = "歸零";
    } else {
      gameState.total += 1;
      msg = "+1";
    }
  } else if (r === "4") {
    gameState.direction *= -1;
    msg = "反轉";
  } else if (r === "5") {
    const others = [];
    gameState.aliveStatus.forEach((s, i) => {
      if (s && i !== pIdx) others.push(i);
    });
    gameState.currentPlayer = others[Math.floor(Math.random() * others.length)];
    msg = `指定 ${gameState.names[gameState.currentPlayer]}`;
  } else if (r === "10") {
    if (gameState.total + 10 > 99) {
      gameState.total -= 10;
      msg = "-10";
    } else {
      gameState.total += 10;
      msg = "+10";
    }
  } else if (r === "Q") {
    if (gameState.total + 20 > 99) {
      gameState.total -= 20;
      msg = "-20";
    } else {
      gameState.total += 20;
      msg = "+20";
    }
  } else if (r === "K") {
    gameState.total = 99;
    msg = "變 99";
  } else if (r === "J") {
    msg = "跳過";
  } else {
    gameState.total += parseInt(r);
    msg = `+${r}`;
  }
  return msg;
}

function npcMove() {
  if (gameState.isOver) return;
  const hand = gameState.players[gameState.currentPlayer];
  const total = gameState.total;
  let chosenIdx = -1;
  const safe = [],
    funcs = [];

  hand.forEach((c, i) => {
    if (!isNaN(c.r)) {
      if (total + parseInt(c.r) <= 99) safe.push(i);
    } else funcs.push(i);
  });

  if (total >= 85 && funcs.length > 0) chosenIdx = funcs[0];
  else if (safe.length > 0) chosenIdx = safe[0];
  else chosenIdx = funcs.length > 0 ? funcs[0] : 0;

  handlePlay(gameState.currentPlayer, chosenIdx);
}

function handlePlayerClick(idx) {
  if (gameState.isOver || gameState.currentPlayer !== 0) return;
  if (gameState.selectedIndex === idx) {
    document.getElementById("center-zone").classList.remove("show-tip");
    handlePlay(0, idx);
    gameState.selectedIndex = -1;
  } else {
    gameState.selectedIndex = idx;
    const card = gameState.players[0][idx];
    let tip = isNaN(card.r) ? "特殊牌" : `+${card.r}`;
    if (card.r === "A") tip = card.s === "♠" ? "歸零" : "+1";
    document.getElementById("tip-overlay").innerText = `效果：${tip}`;
    document.getElementById("center-zone").classList.add("show-tip");
    updateUI();
  }
}

function highlightTurn() {
  const zones = document.querySelectorAll(".player-zone");
  zones.forEach((z, i) => {
    i === gameState.currentPlayer && !gameState.isOver
      ? z.classList.add("active-turn")
      : z.classList.remove("active-turn");
  });
  document.getElementById("status-sub").innerText =
    `輪到：${gameState.names[gameState.currentPlayer]}`;
}

document.body.onclick = () => {
  if (gameState.selectedIndex !== -1) {
    gameState.selectedIndex = -1;
    document.getElementById("center-zone").classList.remove("show-tip");
    updateUI();
  }
};
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
