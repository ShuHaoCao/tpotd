const canvas = document.getElementById("goBoard");
const ctx = canvas.getContext("2d");
const GRID_SIZE = 9;
let cellSize = 0;
let board = [];
let currentPlayer = 1; // 1: 玩家(黑), 2: 電腦(白)
let lastMove = null;
let koPos = null;
let passCount = 0;
let playerName = "";
let isGameOver = false;
let isAiThinking = false;

window.onload = () => {
  const savedName = localStorage.getItem("go_player_name");
  if (savedName) document.getElementById("player-name").value = savedName;
  resizeCanvas();
  initBoard();
};

window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  const container = document.getElementById("board-container");
  canvas.width = container.clientWidth * 2;
  canvas.height = container.clientWidth * 2;
  cellSize = canvas.width / (GRID_SIZE + 1);
  drawBoard();
}

function initBoard() {
  board = Array(GRID_SIZE)
    .fill()
    .map(() => Array(GRID_SIZE).fill(0));
}

function startGame() {
  const nameInput = document.getElementById("player-name").value.trim();
  if (!nameInput) {
    alert("請輸入名稱！");
    return;
  }
  playerName = nameInput;
  localStorage.setItem("go_player_name", playerName);
  document.getElementById("modal-overlay").style.display = "none";
  resetGame();
}

function resetGame() {
  initBoard();
  currentPlayer = 1;
  koPos = null;
  passCount = 0;
  lastMove = null;
  isGameOver = false;
  isAiThinking = false;
  updateStatus();
  drawBoard();
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;

  for (let i = 1; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(cellSize, i * cellSize);
    ctx.lineTo(GRID_SIZE * cellSize, i * cellSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i * cellSize, cellSize);
    ctx.lineTo(i * cellSize, GRID_SIZE * cellSize);
    ctx.stroke();
  }

  // 天元
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(5 * cellSize, 5 * cellSize, 5, 0, Math.PI * 2);
  ctx.fill();

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] !== 0) drawStone(r, c, board[r][c]);
    }
  }
}

function drawStone(r, c, color) {
  const x = (c + 1) * cellSize;
  const y = (r + 1) * cellSize;
  ctx.beginPath();
  ctx.arc(x, y, cellSize * 0.45, 0, Math.PI * 2);

  const grad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, cellSize * 0.45);
  if (color === 1) {
    grad.addColorStop(0, "#666");
    grad.addColorStop(1, "#000");
  } else {
    grad.addColorStop(0, "#fff");
    grad.addColorStop(1, "#ccc");
  }

  ctx.fillStyle = grad;
  ctx.fill();

  if (lastMove && lastMove.r === r && lastMove.c === c) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

canvas.addEventListener("click", (e) => {
  if (isAiThinking || isGameOver || currentPlayer !== 1) return;

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const c = Math.round(x / cellSize) - 1;
  const r = Math.round(y / cellSize) - 1;

  if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
    if (isValidMove(r, c, 1)) {
      executeMove(r, c, 1);
      if (!isGameOver) {
        isAiThinking = true;
        setTimeout(aiMove, 600);
      }
    }
  }
});

function isValidMove(r, c, color) {
  if (board[r][c] !== 0) return false;
  if (koPos && koPos.r === r && koPos.c === c) return false;

  let tempBoard = board.map((row) => [...row]);
  tempBoard[r][c] = color;
  let opponent = color === 1 ? 2 : 1;

  // 模擬提子
  let captures = findCaptures(tempBoard, opponent);
  if (captures.length > 0) return true; // 能吃掉對方就不是自殺

  // 檢查自己是否有氣
  return hasLiberties(tempBoard, r, c);
}

function executeMove(r, c, color) {
  board[r][c] = color;
  let opponent = color === 1 ? 2 : 1;
  let captured = findCaptures(board, opponent);

  captured.forEach((p) => (board[p.r][p.c] = 0));

  // 打劫規則
  if (captured.length === 1 && !hasLiberties(board, r, c)) {
    koPos = { r: captured[0].r, c: captured[0].c };
  } else {
    koPos = null;
  }

  lastMove = { r, c };
  passCount = 0;
  currentPlayer = opponent;
  updateStatus();
  drawBoard();
}

function aiMove() {
  if (isGameOver) return;

  let possibleMoves = [];
  let captureMoves = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (isValidMove(r, c, 2)) {
        // 檢查是否能吃子
        let tempBoard = board.map((row) => [...row]);
        tempBoard[r][c] = 2;
        if (findCaptures(tempBoard, 1).length > 0) {
          captureMoves.push({ r, c });
        }
        possibleMoves.push({ r, c });
      }
    }
  }

  if (captureMoves.length > 0) {
    let move = captureMoves[Math.floor(Math.random() * captureMoves.length)];
    executeMove(move.r, move.c, 2);
  } else if (possibleMoves.length > 0) {
    // 隨機選一個點（避開填滿自己眼位的弱智行為簡化版）
    let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    executeMove(move.r, move.c, 2);
  } else {
    passTurn();
  }

  isAiThinking = false;
  updateStatus();
}

function passTurn() {
  passCount++;
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateStatus();
  if (passCount >= 2) endGame();
  else if (currentPlayer === 2) {
    isAiThinking = true;
    setTimeout(aiMove, 600);
  }
}

// 氣的邏輯
function hasLiberties(b, r, c) {
  let color = b[r][c];
  let visited = new Set();
  let queue = [{ r, c }];
  visited.add(`${r},${c}`);

  while (queue.length > 0) {
    let curr = queue.shift();
    let neighbors = [
      { r: curr.r - 1, c: curr.c },
      { r: curr.r + 1, c: curr.c },
      { r: curr.r, c: curr.c - 1 },
      { r: curr.r, c: curr.c + 1 },
    ];
    for (let n of neighbors) {
      if (n.r >= 0 && n.r < GRID_SIZE && n.c >= 0 && n.c < GRID_SIZE) {
        if (b[n.r][n.c] === 0) return true;
        if (b[n.r][n.c] === color && !visited.has(`${n.r},${n.c}`)) {
          visited.add(`${n.r},${n.c}`);
          queue.push(n);
        }
      }
    }
  }
  return false;
}

function findCaptures(b, color) {
  let capturedStones = [];
  let checked = new Set();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (b[r][c] === color && !checked.has(`${r},${c}`)) {
        if (!hasLiberties(b, r, c)) {
          // 收集這一塊所有的子
          let queue = [{ r, c }];
          let block = [];
          let blockVisited = new Set();
          blockVisited.add(`${r},${c}`);
          while (queue.length > 0) {
            let curr = queue.shift();
            block.push(curr);
            checked.add(`${curr.r},${curr.c}`);
            [
              { r: curr.r - 1, c: curr.c },
              { r: curr.r + 1, c: curr.c },
              { r: curr.r, c: curr.c - 1 },
              { r: curr.r, c: curr.c + 1 },
            ].forEach((n) => {
              if (
                n.r >= 0 &&
                n.r < GRID_SIZE &&
                n.c >= 0 &&
                n.c < GRID_SIZE &&
                b[n.r][n.c] === color &&
                !blockVisited.has(`${n.r},${n.c}`)
              ) {
                blockVisited.add(`${n.r},${n.c}`);
                queue.push(n);
              }
            });
          }
          capturedStones.push(...block);
        }
      }
    }
  }
  return capturedStones;
}

function updateStatus() {
  const statusEl = document.getElementById("current-player");
  if (isGameOver) {
    statusEl.innerText = "對局結束";
    return;
  }
  statusEl.innerText = isAiThinking
    ? "電腦正在思考..."
    : `輪到：${currentPlayer === 1 ? playerName + " (黑)" : "電腦 (白)"}`;

  let bCount = 0,
    wCount = 0;
  board.forEach((row) =>
    row.forEach((cell) => {
      if (cell === 1) bCount++;
      if (cell === 2) wCount++;
    }),
  );
  document.getElementById("score-display").innerText =
    `${playerName}: ${bCount} | 電腦: ${wCount}`;
}

function endGame() {
  isGameOver = true;
  let b = 0,
    w = 0;
  board.forEach((row) =>
    row.forEach((cell) => {
      if (cell === 1) b++;
      if (cell === 2) w++;
    }),
  );

  let msg = `遊戲結束！\n${playerName} (黑): ${b} 子\n電腦 (白): ${w} 子\n\n`;
  if (b > w) {
    msg += "恭喜你獲勝了！紀錄已更新。";
    saveScore(playerName);
  } else if (w > b) {
    msg += "電腦獲勝，再接再厲！";
  } else {
    msg += "竟然是平手！";
  }
  alert(msg);
}

function saveScore(name) {
  let scores = JSON.parse(localStorage.getItem("go_leaderboard") || "[]");
  let idx = scores.findIndex((s) => s.name === name);
  if (idx > -1) scores[idx].wins += 1;
  else scores.push({ name: name, wins: 1 });
  scores.sort((a, b) => b.wins - a.wins);
  localStorage.setItem("go_leaderboard", JSON.stringify(scores.slice(0, 10)));
}

function showLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  let scores = JSON.parse(localStorage.getItem("go_leaderboard") || "[]");
  if (scores.length === 0) list.innerHTML = "<li>尚無紀錄</li>";
  else
    scores.forEach((s, i) => {
      list.innerHTML += `<li><span>${i + 1}. ${s.name}</span> <span>${s.wins} 勝</span></li>`;
    });
  document.getElementById("leaderboard-overlay").style.display = "flex";
}

function closeLeaderboard() {
  document.getElementById("leaderboard-overlay").style.display = "none";
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
