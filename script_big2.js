const SUITS = ["♦", "♣", "♥", "♠"];
const VALUES = [
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
  "2",
];
const NPC_NAMES = ["賭神高進", "少年賭聖", "陳小刀", "龍五", "海棠", "賭俠"];
const TRASH_TALK = [
  "這張你接得住嗎？",
  "我看你是在等方塊三吧？",
  "沒牌了吧？",
  "別想跑！",
  "我要梭哈了！(才怪)",
];

let deck = [],
  hands = [[], [], [], []],
  names = [];
let currentTurn = 0,
  lastPlay = null,
  passCount = 0,
  isFirstTurn = true;
let currentPlayerName = "",
  sortMode = "value"; // value or suit
let isSliding = false,
  slideSelected = new Set();

window.onload = () => {
  const savedName = localStorage.getItem("bigTwo_playerName");
  if (savedName) {
    currentPlayerName = savedName;
    document.getElementById("login-modal").classList.remove("show");
    initGame();
  }
};

function savePlayerName() {
  const input = document.getElementById("player-name-input").value.trim();
  if (!input) return alert("請輸入名稱！");
  currentPlayerName = input;
  localStorage.setItem("bigTwo_playerName", input);
  document.getElementById("login-modal").classList.remove("show");
  initGame();
}

function initGame() {
  names = [
    currentPlayerName,
    ...[...NPC_NAMES].sort(() => Math.random() - 0.5).slice(0, 3),
  ];
  deck = [];
  for (let v = 0; v < 13; v++)
    for (let s = 0; s < 4; s++)
      deck.push({ v, s, label: VALUES[v], suit: SUITS[s] });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  for (let i = 0; i < 4; i++) {
    hands[i] = deck.splice(0, 13);
    sortHand(i);
  }

  currentTurn = hands.findIndex((h) => h.some((c) => c.v === 0 && c.s === 0));
  lastPlay = null;
  passCount = 0;
  isFirstTurn = true;
  updateUI();
  log(`${names[currentTurn]} 握有方塊三，首攻！`);
  if (currentTurn !== 0) setTimeout(npcTurn, 1000);
}

function sortHand(idx) {
  hands[idx].sort((a, b) => {
    if (sortMode === "value") return a.v * 4 + a.s - (b.v * 4 + b.s);
    return a.s * 13 + a.v - (b.s * 13 + b.v);
  });
}

function toggleSort() {
  sortMode = sortMode === "value" ? "suit" : "value";
  document.getElementById("btn-sort").innerText =
    sortMode === "value" ? "大小" : "花色";
  sortHand(0);
  updateUI();
}

function getPattern(cards) {
  if (cards.length === 0) return null;
  cards.sort((a, b) => a.v * 4 + a.s - (b.v * 4 + b.s));
  const len = cards.length;
  const maxW = cards[len - 1].v * 4 + cards[len - 1].s;

  if (len === 1) return { type: 1, weight: maxW };
  if (len === 2 && cards[0].v === cards[1].v) return { type: 2, weight: maxW };
  if (len === 5) {
    const counts = {};
    cards.forEach((c) => (counts[c.v] = (counts[c.v] || 0) + 1));
    const v = Object.values(counts);
    const isFlush = cards.every((c) => c.s === cards[0].s);
    const isStraight = cards.every(
      (c, i) => i === 0 || c.v === cards[i - 1].v + 1,
    );

    let rank = 0;
    if (isStraight && isFlush) rank = 5;
    else if (v.includes(4)) rank = 4;
    else if (v.includes(3) && v.includes(2)) rank = 3;
    else if (isFlush) rank = 2;
    else if (isStraight) rank = 1;
    if (rank > 0) return { type: 5, rank, weight: maxW };
  }
  return null;
}

function isValidMove(cards, p) {
  if (!p) return false;
  if (isFirstTurn && !cards.some((c) => c.v === 0 && c.s === 0)) return false;
  if (!lastPlay) return true;
  if (cards.length !== lastPlay.cards.length) return false;
  if (p.type === 5) {
    if (p.rank > lastPlay.pattern.rank) return true;
    if (p.rank === lastPlay.pattern.rank && p.weight > lastPlay.pattern.weight)
      return true;
    return false;
  }
  return p.weight > lastPlay.pattern.weight;
}

// --- 滑動選牌邏輯 ---
function startSlide(e) {
  if (currentTurn !== 0) return;
  isSliding = true;
  slideSelected.clear();
  toggleCardByElement(e.target.closest(".card"));
}
function moveSlide(e) {
  if (!isSliding) return;
  let el = document.elementFromPoint(e.clientX, e.clientY);
  let cardEl = el ? el.closest(".card") : null;
  if (cardEl && !slideSelected.has(cardEl)) {
    toggleCardByElement(cardEl);
    slideSelected.add(cardEl);
  }
}
function endSlide() {
  isSliding = false;
}
function toggleCardByElement(el) {
  if (el) {
    el.classList.toggle("selected");
    if (window.navigator.vibrate) window.navigator.vibrate(5);
  }
}

function playerAction() {
  if (currentTurn !== 0) return;
  const selectedNodes = document.querySelectorAll("#hand-0 .selected");
  const selectedCards = Array.from(selectedNodes).map(
    (n) => hands[0][n.dataset.idx],
  );
  const p = getPattern(selectedCards);

  if (isValidMove(selectedCards, p)) executeMove(0, selectedCards, p);
  else log("出牌無效，請檢查規則或張數");
}

function npcTurn() {
  let hand = hands[currentTurn];
  let move = null;
  let targetLen = lastPlay ? lastPlay.cards.length : 0;
  let checkSizes = targetLen ? [targetLen] : [1, 2, 5];

  for (let size of checkSizes) {
    let combos = findCombos(hand, size);
    for (let c of combos) {
      let p = getPattern(c);
      if (isValidMove(c, p)) {
        move = { c, p };
        break;
      }
    }
    if (move) break;
  }

  if (move) {
    if (Math.random() > 0.7)
      log(
        `${names[currentTurn]}：${TRASH_TALK[Math.floor(Math.random() * TRASH_TALK.length)]}`,
      );
    executeMove(currentTurn, move.c, move.p);
  } else {
    log(`${names[currentTurn]}：過 (Pass)`);
    proceedTurn(true);
  }
}

function findCombos(hand, size) {
  let res = [];
  let sorted = [...hand].sort((a, b) => a.v - b.v);
  if (size === 1) return hand.map((c) => [c]);
  if (size === 2) {
    for (let i = 0; i < hand.length; i++)
      for (let j = i + 1; j < hand.length; j++)
        if (hand[i].v === hand[j].v) res.push([hand[i], hand[j]]);
  }
  if (size === 5) {
    // 隨機尋找組合的簡易模擬
    for (let k = 0; k < 50; k++) {
      let s = [...hand].sort(() => Math.random() - 0.5).slice(0, 5);
      if (getPattern(s)) res.push(s);
    }
  }
  return res;
}

function executeMove(idx, cards, p) {
  lastPlay = { cards, pattern: p };
  passCount = 0;
  isFirstTurn = false;
  cards.forEach((c) => {
    let i = hands[idx].findIndex((hc) => hc.v === c.v && hc.s === c.s);
    hands[idx].splice(i, 1);
  });

  if (hands[idx].length === 0) {
    showFinalResult(idx);
    return;
  }
  proceedTurn(false);
}

function proceedTurn(isPass) {
  if (isPass) passCount++;
  currentTurn = (currentTurn + 1) % 4;
  if (passCount >= 3) {
    lastPlay = null;
    passCount = 0;
  }
  updateUI();
  if (currentTurn !== 0) setTimeout(npcTurn, 1000);
}

function playerPass() {
  if (lastPlay && currentTurn === 0) proceedTurn(true);
}

function updateUI() {
  for (let i = 0; i < 4; i++) {
    const container = document.getElementById(`hand-${i}`);
    container.innerHTML = "";
    hands[i].forEach((card, idx) => {
      const div = document.createElement("div");
      div.className = `card ${i === 0 ? "" : "npc-card"} ${card.s === 0 || card.s === 2 ? "red" : ""}`;
      div.innerHTML = `<span>${card.label}</span><small>${card.suit}</small>`;
      if (i === 0) {
        div.dataset.idx = idx;
        div.onclick = (e) => {
          if (!isSliding) toggleCardByElement(e.currentTarget);
        };
      }
      container.appendChild(div);
    });
    document.getElementById(`name-${i}`).innerText =
      `${names[i]} (${hands[i].length})`;
    document.getElementById(`name-${i}`).className =
      `name-tag ${currentTurn === i ? "active" : ""}`;
  }
  const lastArea = document.getElementById("last-play-area");
  lastArea.innerHTML = "";
  if (lastPlay) {
    lastPlay.cards.forEach((c) => {
      lastArea.innerHTML += `<div class="card ${c.s === 0 || c.s === 2 ? "red" : ""}"><span>${c.label}</span><small>${c.suit}</small></div>`;
    });
  }
  document.getElementById("btn-play").disabled = currentTurn !== 0;
  document.getElementById("btn-pass").disabled = currentTurn !== 0 || !lastPlay;
}

function log(m) {
  document.getElementById("game-msg").innerText = m;
}

// --- 結算與排行榜功能 ---
function showFinalResult(winnerIdx) {
  const modal = document.getElementById("result-modal");
  const list = document.getElementById("result-list");
  const title = document.getElementById("result-title");
  list.innerHTML = "";

  if (winnerIdx === 0) {
    title.innerText = "🏆 恭喜獲勝！";
    updateRank(currentPlayerName);
  } else {
    title.innerText = "💀 惜敗！";
  }

  names.forEach((name, i) => {
    let count = hands[i].length;
    let penalty = count >= 10 ? " (雙倍!)" : "";
    list.innerHTML += `
            <div class="result-item ${i === winnerIdx ? "winner" : "loser"}">
              <span>${name}</span>
              <span>${i === winnerIdx ? "贏家" : "剩 " + count + " 張" + penalty}</span>
            </div>`;
  });
  modal.classList.add("show");
}

function closeResult() {
  document.getElementById("result-modal").classList.remove("show");
  initGame();
}

function confirmReset() {
  if (confirm("確定要放棄目前的牌局重開嗎？")) initGame();
}

function updateRank(winnerName) {
  let ranks = JSON.parse(localStorage.getItem("bigTwo_ranks") || "[]");
  let player = ranks.find((r) => r.name === winnerName);
  if (player) player.wins += 1;
  else ranks.push({ name: winnerName, wins: 1 });
  ranks.sort((a, b) => b.wins - a.wins);
  localStorage.setItem("bigTwo_ranks", JSON.stringify(ranks.slice(0, 10)));
}

function toggleRank(show) {
  const modal = document.getElementById("rank-modal");
  if (show) {
    const ranks = JSON.parse(localStorage.getItem("bigTwo_ranks") || "[]");
    const display = document.getElementById("rank-display");
    display.innerHTML = ranks.length
      ? ""
      : '<p style="text-align:center">尚無獲勝紀錄</p>';
    ranks.forEach((r, i) => {
      display.innerHTML += `<div style="display:flex; justify-content:space-between; padding:5px; border-bottom:1px solid #eee;">
              <span>${i + 1}. ${r.name}</span><b>${r.wins} 勝</b></div>`;
    });
    modal.classList.add("show");
  } else {
    modal.classList.remove("show");
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
