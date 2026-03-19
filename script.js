
      const SIZE = 15;
      let board = [];
      let isGameOver = false;
      let playerName = "";
      let playerSteps = 0;
      let history = [];

      window.onload = () => {
        const savedName = localStorage.getItem("gomoku_user");
        if (savedName) {
          playerName = savedName;
          document.getElementById("overlay").classList.add("hidden");
          initGame();
        }
        updateLeaderboard();
      };

      function saveNameAndStart() {
        const val = document.getElementById("nameInput").value.trim();
        playerName = val || "無名大師";
        localStorage.setItem("gomoku_user", playerName);
        document.getElementById("overlay").classList.add("hidden");
        initGame();
      }

      function initGame() {
        board = Array(SIZE)
          .fill(0)
          .map(() => Array(SIZE).fill(0));
        isGameOver = false;
        playerSteps = 0;
        history = [];
        document.getElementById("status").innerText = "您的回合 (黑子)";
        document.getElementById("undoBtn").disabled = false;
        renderBoard();
        updateLeaderboard();
      }

      function renderBoard() {
        const boardEl = document.getElementById("board");
        const linesEl = document.getElementById("gridLines");
        boardEl.innerHTML = "";
        linesEl.innerHTML = "";

        for (let i = 0; i < SIZE; i++) {
          const pos = (i + 0.5) * (100 / SIZE);
          const lineLen = 100 - 100 / SIZE;
          const lineStart = 0.5 * (100 / SIZE);

          const hLine = document.createElement("div");
          hLine.className = "line-h";
          hLine.style.top = `${pos}%`;
          hLine.style.left = `${lineStart}%`;
          hLine.style.width = `${lineLen}%`;
          hLine.style.height = "1px";
          linesEl.appendChild(hLine);

          const vLine = document.createElement("div");
          vLine.className = "line-v";
          vLine.style.left = `${pos}%`;
          vLine.style.top = `${lineStart}%`;
          vLine.style.height = `${lineLen}%`;
          vLine.style.width = "1px";
          linesEl.appendChild(vLine);
        }

        const stars = [
          [3, 3],
          [3, 11],
          [7, 7],
          [11, 3],
          [11, 11],
        ];
        stars.forEach(([r, c]) => {
          const dot = document.createElement("div");
          dot.className = "dot";
          dot.style.top = `${(r + 0.5) * (100 / SIZE)}%`;
          dot.style.left = `${(c + 0.5) * (100 / SIZE)}%`;
          linesEl.appendChild(dot);
        });

        for (let r = 0; r < SIZE; r++) {
          for (let c = 0; c < SIZE; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.id = `cell-${r}-${c}`;
            cell.onclick = () => playerMove(r, c);
            boardEl.appendChild(cell);
          }
        }
      }

      function playAudio(id) {
        const audio = document.getElementById(id);
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      }

      function playerMove(r, c) {
        if (isGameOver || board[r][c] !== 0) return;

        placePiece(r, c, 1);
        playerSteps++;
        history.push({ r, c, type: 1 });
        playAudio("soundPlayer"); // 播放玩家專屬音效

        if (checkWin(r, c, 1)) {
          endGame(`${playerName} 獲勝！`);
          playAudio("soundWin");
          saveResult(playerName, playerSteps);
          return;
        }

        document.getElementById("status").innerText = "電腦思考中...";
        setTimeout(aiMove, 300);
      }

      function placePiece(r, c, type) {
        board[r][c] = type;
        const cell = document.getElementById(`cell-${r}-${c}`);

        const last = document.querySelector(".last-move");
        if (last) last.classList.remove("last-move");

        const p = document.createElement("div");
        p.className = `piece ${type === 1 ? "black" : "white"} last-move`;
        cell.appendChild(p);
      }

      function aiMove() {
        if (isGameOver) return;
        let bestScore = -1;
        let move = { r: 7, c: 7 };
        const diffWeight = parseFloat(
          document.getElementById("difficulty").value,
        );

        for (let r = 0; r < SIZE; r++) {
          for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === 0) {
              let score = evaluate(r, c, 2) + evaluate(r, c, 1) * diffWeight;
              if (score > bestScore) {
                bestScore = score;
                move = { r, c };
              }
            }
          }
        }

        placePiece(move.r, move.c, 2);
        history.push({ r: move.r, c: move.c, type: 2 });
        playAudio("soundAI"); // 播放電腦專屬音效

        if (checkWin(move.r, move.c, 2)) {
          endGame("電腦獲勝！");
        } else {
          document.getElementById("status").innerText = "您的回合 (黑子)";
        }
      }

      function undoMove() {
        if (isGameOver || history.length < 2) return;

        for (let i = 0; i < 2; i++) {
          const last = history.pop();
          board[last.r][last.c] = 0;
          const cell = document.getElementById(`cell-${last.r}-${last.c}`);
          cell.innerHTML = "";
        }

        playerSteps--;

        if (history.length > 0) {
          const prev = history[history.length - 1];
          const prevCell = document.getElementById(`cell-${prev.r}-${prev.c}`);
          if (prevCell.firstChild)
            prevCell.firstChild.classList.add("last-move");
        }

        document.getElementById("status").innerText = "已悔棋，您的回合";
      }

      function evaluate(r, c, type) {
        let total = 0;
        const dirs = [
          [1, 0],
          [0, 1],
          [1, 1],
          [1, -1],
        ];
        for (let [dr, dc] of dirs) {
          let count = 1,
            block = 0;
          for (let i = 1; i < 5; i++) {
            let nr = r + dr * i,
              nc = c + dc * i;
            if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) {
              block++;
              break;
            }
            if (board[nr][nc] === type) count++;
            else if (board[nr][nc] === 0) break;
            else {
              block++;
              break;
            }
          }
          for (let i = 1; i < 5; i++) {
            let nr = r - dr * i,
              nc = c - dc * i;
            if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) {
              block++;
              break;
            }
            if (board[nr][nc] === type) count++;
            else if (board[nr][nc] === 0) break;
            else {
              block++;
              break;
            }
          }
          if (count >= 5) total += 100000;
          else if (count === 4) total += block === 0 ? 10000 : 1000;
          else if (count === 3) total += block === 0 ? 1000 : 100;
          else if (count === 2) total += block === 0 ? 100 : 10;
        }
        return total;
      }

      function checkWin(r, c, type) {
        const dirs = [
          [1, 0],
          [0, 1],
          [1, 1],
          [1, -1],
        ];
        for (let [dr, dc] of dirs) {
          let cnt = 1;
          for (let i = 1; i < 5; i++) {
            let nr = r + dr * i,
              nc = c + dc * i;
            if (
              nr >= 0 &&
              nr < SIZE &&
              nc >= 0 &&
              nc < SIZE &&
              board[nr][nc] === type
            )
              cnt++;
            else break;
          }
          for (let i = 1; i < 5; i++) {
            let nr = r - dr * i,
              nc = c - dc * i;
            if (
              nr >= 0 &&
              nr < SIZE &&
              nc >= 0 &&
              nc < SIZE &&
              board[nr][nc] === type
            )
              cnt++;
            else break;
          }
          if (cnt >= 5) return true;
        }
        return false;
      }

      function endGame(msg) {
        isGameOver = true;
        document.getElementById("status").innerText = msg;
        document.getElementById("undoBtn").disabled = true;
      }

      function getDiffKey() {
        const sel = document.getElementById("difficulty");
        return "gomoku_ranks_" + sel.value;
      }

      function saveResult(name, steps) {
        const key = getDiffKey();
        let list = JSON.parse(localStorage.getItem(key) || "[]");
        list.push({ name, steps, date: new Date().toLocaleDateString() });
        list.sort((a, b) => a.steps - b.steps);
        localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
        updateLeaderboard();
      }

      function updateLeaderboard() {
        const key = getDiffKey();
        const sel = document.getElementById("difficulty");
        document.getElementById("rankTitle").innerText =
          sel.options[sel.selectedIndex].text.split(" ")[0];

        const list = JSON.parse(localStorage.getItem(key) || "[]");
        document.getElementById("rankBody").innerHTML = list
          .map(
            (item, i) =>
              `<tr><td>${i + 1}</td><td>${item.name}</td><td>${item.steps}</td><td>${item.date}</td></tr>`,
          )
          .join("");
      }

      function resetGame() {
        initGame();
      }

      function clearRecord() {
        localStorage.removeItem(getDiffKey());
        updateLeaderboard();
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