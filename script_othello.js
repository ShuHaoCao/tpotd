let board = [];
let currentPlayer = 1;
let playerName = "";
let history = []; // 用於悔棋
let lastMove = null; // 標記上一步位置
const BOARD_SIZE = 8;

const weights = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10, -2, 5, 1, 1, 5, -2, 10],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [10, -2, 5, 1, 1, 5, -2, 10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10, 5, 5, 10, -20, 100],
];

window.onload = () => {
  const savedName = sessionStorage.getItem("reversi_playerName");
  if (savedName) document.getElementById("playerNameInput").value = savedName;

  // 嘗試讀取自動存檔
  const savedGame = localStorage.getItem("reversi_autosave");
  if (savedGame) {
    const data = JSON.parse(savedGame);
    if (confirm("偵測到未完成的棋局，是否繼續？")) {
      playerName = sessionStorage.getItem("reversi_playerName") || "匿名玩家";
      document.getElementById("pName").innerText = playerName;
      document.getElementById("overlay").style.display = "none";
      board = data.board;
      currentPlayer = data.currentPlayer;
      history = data.history || [];
      lastMove = data.lastMove || null;
      renderBoard();
      updateScore();
    }
  }
  updateLeaderboardDisplay();
};

function startGame() {
  const input = document.getElementById("playerNameInput").value.trim();
  playerName = input || "匿名玩家";
  sessionStorage.setItem("reversi_playerName", playerName);
  document.getElementById("pName").innerText = playerName;
  document.getElementById("overlay").style.display = "none";
  initBoard();
}

function initBoard() {
  board = Array(BOARD_SIZE)
    .fill()
    .map(() => Array(BOARD_SIZE).fill(0));
  board[3][3] = 2;
  board[3][4] = 1;
  board[4][3] = 1;
  board[4][4] = 2;
  currentPlayer = 1;
  history = [];
  lastMove = null;
  saveGameState();
  renderBoard();
  updateScore();
}

function renderBoard() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  const validMoves = getValidMoves(currentPlayer);

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (board[r][c] !== 0) {
        const piece = document.createElement("div");
        piece.className = `piece ${board[r][c] === 1 ? "black" : "white"}`;
        cell.appendChild(piece);
        // 如果是最後一步，加入標記
        if (lastMove && lastMove.r === r && lastMove.c === c) {
          const marker = document.createElement("div");
          marker.className = "last-move-marker";
          cell.appendChild(marker);
        }
      } else if (
        currentPlayer === 1 &&
        validMoves.some((m) => m.r === r && m.c === c)
      ) {
        cell.classList.add("hint");
        cell.onclick = () => handleMove(r, c);
      }
      boardEl.appendChild(cell);
    }
  }
  document.getElementById("turn-display").innerText =
    currentPlayer === 1 ? "黑棋 (你)" : "白棋 (AI)";
  document.getElementById("undoBtn").disabled = history.length === 0;
}

function handleMove(r, c) {
  if (currentPlayer !== 1) return;
  saveHistory();
  makeMove(r, c, 1);
  lastMove = { r, c };
  currentPlayer = 2;
  renderBoard();
  updateScore();
  saveGameState();

  setTimeout(aiTurn, 800);
}

function aiTurn() {
  const moves = getValidMoves(2);
  if (moves.length > 0) {
    const difficulty = document.getElementById("difficulty").value;
    if (difficulty === "easy") {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      makeMove(randomMove.r, randomMove.c, 2);
      lastMove = randomMove;
    } else {
      moves.sort((a, b) => weights[b.r][b.c] - weights[a.r][a.c]);
      const bestMove = moves[0];
      makeMove(bestMove.r, bestMove.c, 2);
      lastMove = bestMove;
    }
  }

  currentPlayer = 1;
  if (getValidMoves(1).length === 0) {
    if (getValidMoves(2).length === 0) {
      endGame();
    } else {
      alert("你無處落子，換電腦繼續。");
      currentPlayer = 2;
      setTimeout(aiTurn, 800);
    }
  }
  renderBoard();
  updateScore();
  saveGameState();
}

function saveHistory() {
  history.push(JSON.stringify({ board, lastMove }));
  if (history.length > 10) history.shift(); // 最多存10步
}

function undoMove() {
  if (history.length > 0) {
    const prev = JSON.parse(history.pop());
    board = prev.board;
    lastMove = prev.lastMove;
    currentPlayer = 1;
    renderBoard();
    updateScore();
    saveGameState();
  }
}

function saveGameState() {
  localStorage.setItem(
    "reversi_autosave",
    JSON.stringify({
      board,
      currentPlayer,
      history,
      lastMove,
    }),
  );
}

function makeMove(r, c, color) {
  const flips = getFlips(r, c, color);
  board[r][c] = color;
  flips.forEach((pos) => {
    board[pos.r][pos.c] = color;
  });
}

function getValidMoves(color) {
  let moves = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0 && getFlips(r, c, color).length > 0)
        moves.push({ r, c });
    }
  }
  return moves;
}

function getFlips(r, c, color) {
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  let totalFlips = [];
  const opponent = color === 1 ? 2 : 1;

  directions.forEach(([dr, dc]) => {
    let tempFlips = [];
    let currR = r + dr,
      currC = c + dc;
    while (
      currR >= 0 &&
      currR < BOARD_SIZE &&
      currC >= 0 &&
      currC < BOARD_SIZE
    ) {
      if (board[currR][currC] === opponent)
        tempFlips.push({ r: currR, c: currC });
      else if (board[currR][currC] === color) {
        totalFlips = totalFlips.concat(tempFlips);
        break;
      } else break;
      currR += dr;
      currC += dc;
    }
  });
  return totalFlips;
}

function updateScore() {
  let b = 0,
    w = 0;
  board.forEach((row) =>
    row.forEach((cell) => {
      if (cell === 1) b++;
      if (cell === 2) w++;
    }),
  );
  document.getElementById("black-score").innerText = b;
  document.getElementById("white-score").innerText = w;
  return { b, w };
}

function endGame() {
  localStorage.removeItem("reversi_autosave");
  const score = updateScore();
  let resultMsg =
    score.b > score.w
      ? `恭喜！你以 ${score.b}:${score.w} 獲勝！`
      : score.w > score.b
        ? `AI 以 ${score.w}:${score.b} 獲勝。`
        : "平手！";
  if (score.b > score.w) saveWin(playerName);
  setTimeout(() => {
    alert("遊戲結束！\n" + resultMsg);
    updateLeaderboardDisplay();
  }, 300);
}

function saveWin(name) {
  let scores = JSON.parse(localStorage.getItem("reversi_scores") || "{}");
  scores[name] = (scores[name] || 0) + 1;
  localStorage.setItem("reversi_scores", JSON.stringify(scores));
}

function updateLeaderboardDisplay() {
  const scores = JSON.parse(localStorage.getItem("reversi_scores") || "{}");
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  document.querySelector("#rankTable tbody").innerHTML = sorted
    .map(
      (item, index) =>
        `<tr><td>${index + 1}</td><td>${item[0]}</td><td>${item[1]}</td></tr>`,
    )
    .join("");
}

function toggleLeaderboard() {
  const lb = document.getElementById("leaderboard");
  lb.style.display = lb.style.display === "none" ? "block" : "none";
  updateLeaderboardDisplay();
}

function resetGame() {
  if (confirm("確定要放棄目前進度並重開一局嗎？")) {
    localStorage.removeItem("reversi_autosave");
    initBoard();
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
