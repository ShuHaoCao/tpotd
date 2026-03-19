/** * 遊戲邏輯與 AI 核心
 * 棋盤表示：10x9 陣列
 * 棋子代號：紅方(正數), 黑方(負數)
 * 1:帥/將, 2:仕, 3:相, 4:馬, 5:車, 6:炮, 7:兵/卒
 */

const canvas = document.getElementById("chessBoard");
const ctx = canvas.getContext("2d");
let playerName = "";
let selectedSq = null;
let board = [];
let turn = 1; // 1: 紅, -1: 黑
let isGameOver = false;

const PIECE_NAMES = {
  1: "帥",
  2: "仕",
  3: "相",
  4: "馬",
  5: "車",
  6: "炮",
  7: "兵",
  "-1": "將",
  "-2": "士",
  "-3": "象",
  "-4": "馬",
  "-5": "車",
  "-6": "砲",
  "-7": "卒",
};

// 初始化棋盤
function initBoard() {
  board = [
    [-5, -4, -3, -2, -1, -2, -3, -4, -5],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, -6, 0, 0, 0, 0, 0, -6, 0],
    [-7, 0, -7, 0, -7, 0, -7, 0, -7],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    // -------------------------
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [7, 0, 7, 0, 7, 0, 7, 0, 7],
    [0, 6, 0, 0, 0, 0, 0, 6, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [5, 4, 3, 2, 1, 2, 3, 4, 5],
  ];
}

// 繪製棋盤與棋子
function draw() {
  const w = canvas.width;
  const h = canvas.height;
  const cellSize = w / 9;
  ctx.clearRect(0, 0, w, h);

  // 繪製格線
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(cellSize / 2, cellSize / 2 + i * cellSize);
    ctx.lineTo(w - cellSize / 2, cellSize / 2 + i * cellSize);
    ctx.stroke();
  }
  for (let j = 0; j < 9; j++) {
    ctx.beginPath();
    ctx.moveTo(cellSize / 2 + j * cellSize, cellSize / 2);
    ctx.lineTo(cellSize / 2 + j * cellSize, cellSize / 2 + 4 * cellSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cellSize / 2 + j * cellSize, cellSize / 2 + 5 * cellSize);
    ctx.lineTo(cellSize / 2 + j * cellSize, h - cellSize / 2);
    ctx.stroke();
  }
  // 外框
  ctx.strokeRect(cellSize / 2, cellSize / 2, w - cellSize, h - cellSize);

  // 繪製棋子
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p !== 0) {
        const x = cellSize / 2 + c * cellSize;
        const y = cellSize / 2 + r * cellSize;

        // 選中高亮
        if (selectedSq && selectedSq.r === r && selectedSq.c === c) {
          ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
          ctx.beginPath();
          ctx.arc(x, y, cellSize * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.stroke();

        ctx.fillStyle = p > 0 ? "red" : "black";
        ctx.font = `bold ${cellSize * 0.6}px "Microsoft JhengHei"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(PIECE_NAMES[p], x, y);
      }
    }
  }
}

// 判斷走法是否合法 (核心邏輯簡化版)
function isLegalMove(fR, fC, tR, tC, b) {
  const p = b[fR][fC];
  const target = b[tR][tC];
  if (target !== 0 && p * target > 0) return false; // 不能吃自己人

  const dr = tR - fR;
  const dc = tC - fC;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  switch (Math.abs(p)) {
    case 1: // 將帥
      if (tC < 3 || tC > 5) return false;
      if (p > 0 && tR < 7) return false;
      if (p < 0 && tR > 2) return false;
      return absDr + absDc === 1;
    case 2: // 仕
      if (tC < 3 || tC > 5) return false;
      if (p > 0 && tR < 7) return false;
      if (p < 0 && tR > 2) return false;
      return absDr === 1 && absDc === 1;
    case 3: // 象
      if (p > 0 && tR < 5) return false;
      if (p < 0 && tR > 4) return false;
      if (absDr === 2 && absDc === 2) {
        if (b[fR + dr / 2][fC + dc / 2] !== 0) return false; // 塞象眼
        return true;
      }
      return false;
    case 4: // 馬
      if ((absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2)) {
        if (absDr === 2 && b[fR + dr / 2][fC] !== 0) return false; // 蹩馬腿
        if (absDc === 2 && b[fR][fC + dc / 2] !== 0) return false;
        return true;
      }
      return false;
    case 5: // 車
      if (fR !== tR && fC !== tC) return false;
      return countPiecesBetween(fR, fC, tR, tC, b) === 0;
    case 6: // 炮
      if (fR !== tR && fC !== tC) return false;
      const count = countPiecesBetween(fR, fC, tR, tC, b);
      if (target === 0) return count === 0;
      return count === 1;
    case 7: // 兵卒
      const dir = p > 0 ? -1 : 1;
      if (dr === dir && dc === 0) return true;
      const crossedRiver = p > 0 ? fR <= 4 : fR >= 5;
      if (crossedRiver && dr === 0 && absDc === 1) return true;
      return false;
  }
  return false;
}

function countPiecesBetween(r1, c1, r2, c2, b) {
  let count = 0;
  if (r1 === r2) {
    for (let c = Math.min(c1, c2) + 1; c < Math.max(c1, c2); c++)
      if (b[r1][c] !== 0) count++;
  } else {
    for (let r = Math.min(r1, r2) + 1; r < Math.max(r1, r2); r++)
      if (b[r][c1] !== 0) count++;
  }
  return count;
}

// 點擊事件處理
canvas.addEventListener("mousedown", (e) => {
  if (isGameOver || turn === -1) return;
  const rect = canvas.getBoundingClientRect();
  const cellSize = canvas.width / 9;
  const c = Math.floor((e.clientX - rect.left) / (rect.width / 9));
  const r = Math.floor((e.clientY - rect.top) / (rect.height / 10));

  if (selectedSq) {
    if (isLegalMove(selectedSq.r, selectedSq.c, r, c, board)) {
      makeMove(selectedSq.r, selectedSq.c, r, c);
      if (!isGameOver) setTimeout(aiMove, 500);
    }
    selectedSq = null;
  } else {
    if (board[r][c] > 0) selectedSq = { r, c };
  }
  draw();
});

function makeMove(fR, fC, tR, tC) {
  const eaten = board[tR][tC];
  board[tR][tC] = board[fR][fC];
  board[fR][fC] = 0;

  if (Math.abs(eaten) === 1) {
    endGame(board[tR][tC] > 0 ? "你贏了！" : "電腦贏了！");
  }
  turn = -turn;
  document.getElementById("status-display").innerText =
    turn === 1 ? "輪到你 (紅方)" : "電腦思考中...";
}

// 簡易 AI (隨機合法步子中的子力最大評估)
function aiMove() {
  let moves = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] < 0) {
        for (let tr = 0; tr < 10; tr++) {
          for (let tc = 0; tc < 9; tc++) {
            if (isLegalMove(r, c, tr, tc, board)) {
              moves.push({
                fR: r,
                fC: c,
                tR: tr,
                tC: tc,
                score: evaluateMove(r, c, tr, tc),
              });
            }
          }
        }
      }
    }
  }
  if (moves.length > 0) {
    moves.sort((a, b) => b.score - a.score);
    const best = moves[0];
    makeMove(best.fR, best.fC, best.tR, best.tC);
    draw();
  }
}

function evaluateMove(fR, fC, tR, tC) {
  const pieceValues = [0, 1000, 20, 20, 40, 90, 45, 10];
  const target = board[tR][tC];
  return target !== 0 ? pieceValues[Math.abs(target)] : 0;
}

// --- 排行榜與名稱處理 ---
function startGame() {
  const input = document.getElementById("name-input").value.trim();
  if (!input) return alert("請輸入名稱");
  playerName = input;
  localStorage.setItem("xiangqi_player", playerName);
  document.getElementById("player-display").innerText = "玩家: " + playerName;
  document.getElementById("overlay").style.display = "none";
  resetGame();
}

function endGame(msg) {
  isGameOver = true;
  alert(msg);
  if (msg.includes("你贏了")) {
    updateLeaderboard(playerName);
  }
}

function updateLeaderboard(name) {
  let scores = JSON.parse(localStorage.getItem("xiangqi_scores") || "{}");
  scores[name] = (scores[name] || 0) + 1;
  localStorage.setItem("xiangqi_scores", JSON.stringify(scores));
  renderLeaderboard();
}

function renderLeaderboard() {
  const scores = JSON.parse(localStorage.getItem("xiangqi_scores") || "{}");
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const body = document.getElementById("rank-body");
  body.innerHTML = sorted
    .map(
      (item, idx) => `
        <tr><td>${idx + 1}</td><td>${item[0]}</td><td>${item[1]}</td></tr>
    `,
    )
    .join("");
}

function resetGame() {
  initBoard();
  turn = 1;
  isGameOver = false;
  selectedSq = null;
  document.getElementById("status-display").innerText = "輪到你 (紅方)";
  resize();
  draw();
}

// 響應式調整
function resize() {
  const wrapper = document.getElementById("board-wrapper");
  canvas.width = wrapper.clientWidth * 2; // 高清
  canvas.height = wrapper.clientHeight * 2;
  draw();
}

window.addEventListener("resize", resize);

// 初始化
window.onload = () => {
  const savedName = localStorage.getItem("xiangqi_player");
  if (savedName) {
    document.getElementById("name-input").value = savedName;
  }
  renderLeaderboard();
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
