let cash = 100000;
let timeLeft = 86400;
let myChart = null;
let playerName = "";
const REFRESH_INTERVAL = 180; // 修改為 180 秒 (3 分鐘)

let stocks = [
  {
    id: 0,
    name: "微軟科技 (MSFT)",
    price: 350,
    hold: 0,
    history: [350],
    vol: 0.03,
  },
  {
    id: 1,
    name: "果粉實業 (AAPL)",
    price: 180,
    hold: 0,
    history: [180],
    vol: 0.03,
  },
  {
    id: 2,
    name: "台灣積體 (TSMC)",
    price: 600,
    hold: 0,
    history: [600],
    vol: 0.04,
  },
  {
    id: 3,
    name: "輝達算力 (NVDA)",
    price: 450,
    hold: 0,
    history: [450],
    vol: 0.06,
  },
  {
    id: 4,
    name: "古哥搜索 (GOOG)",
    price: 140,
    hold: 0,
    history: [140],
    vol: 0.03,
  },
  {
    id: 5,
    name: "臉書社群 (META)",
    price: 300,
    hold: 0,
    history: [300],
    vol: 0.05,
  },
  {
    id: 6,
    name: "皮卡電動車 (TSLA)",
    price: 240,
    hold: 0,
    history: [240],
    vol: 0.07,
  },
  {
    id: 7,
    name: "殼牌能源 (SHEL)",
    price: 65,
    hold: 0,
    history: [65],
    vol: 0.02,
  },
  {
    id: 8,
    name: "波音航太 (BA)",
    price: 210,
    hold: 0,
    history: [210],
    vol: 0.04,
  },
  {
    id: 9,
    name: "長榮海運 (EMC)",
    price: 155,
    hold: 0,
    history: [155],
    vol: 0.05,
  },
  {
    id: 10,
    name: "可樂飲品 (KO)",
    price: 60,
    hold: 0,
    history: [60],
    vol: 0.015,
  },
  {
    id: 11,
    name: "星星咖啡 (SBUX)",
    price: 95,
    hold: 0,
    history: [95],
    vol: 0.02,
  },
  {
    id: 12,
    name: "麥當漢堡 (MCD)",
    price: 280,
    hold: 0,
    history: [280],
    vol: 0.015,
  },
  {
    id: 13,
    name: "迪士尼影業 (DIS)",
    price: 90,
    hold: 0,
    history: [90],
    vol: 0.03,
  },
  {
    id: 14,
    name: "摩根銀行 (JPM)",
    price: 160,
    hold: 0,
    history: [160],
    vol: 0.02,
  },
  {
    id: 15,
    name: "好市倉庫 (COST)",
    price: 550,
    hold: 0,
    history: [550],
    vol: 0.02,
  },
  {
    id: 16,
    name: "再生元生技 (REGN)",
    price: 820,
    hold: 0,
    history: [820],
    vol: 0.08,
  },
  {
    id: 17,
    name: "比特礦業 (BTCM)",
    price: 12,
    hold: 0,
    history: [12],
    vol: 0.15,
  },
  {
    id: 18,
    name: "太空探索 (SPCE)",
    price: 4,
    hold: 0,
    history: [4],
    vol: 0.2,
  },
  {
    id: 19,
    name: "量子計算 (QBT)",
    price: 25,
    hold: 0,
    history: [25],
    vol: 0.12,
  },
];

window.onload = () => {
  const savedName = localStorage.getItem("stockGame_playerName");
  if (savedName) {
    document.getElementById("player-name-input").value = savedName;
  }
};

function startGame() {
  const input = document.getElementById("player-name-input").value.trim();
  if (!input) {
    alert("請輸入名稱！");
    return;
  }
  playerName = input;
  localStorage.setItem("stockGame_playerName", playerName);
  document.getElementById("display-player-name").innerText = playerName;
  document.getElementById("login-overlay").style.display = "none";
  renderStocks();
}

function renderStocks() {
  const tbody = document.getElementById("stock-list");
  tbody.innerHTML = "";
  stocks.forEach((s) => {
    const lastPrice =
      s.history.length > 1 ? s.history[s.history.length - 2] : s.price;
    const priceClass = s.price >= lastPrice ? "price-up" : "price-down";
    const sign = s.price >= lastPrice ? "▲" : "▼";

    const tr = document.createElement("tr");
    tr.innerHTML = `
                <td data-label="公司" class="comp-name" onclick="showHistory(${s.id})">${s.name}</td>
                <td data-label="當前股價" class="${priceClass}">${sign} ${s.price.toFixed(2)}</td>
                <td data-label="持有數量">${s.hold}</td>
                <td data-label="快速交易">
                    <div class="btn-group">
                        <button class="buy" onclick="trade(${s.id}, 10)">買入</button>
                        <button class="sell" onclick="trade(${s.id}, -10)" ${s.hold <= 0 ? "disabled" : ""}>賣出</button>
                    </div>
                </td>
            `;
    tbody.appendChild(tr);
  });
  updateTotalAssets();
}

function trade(id, amt) {
  const s = stocks[id];
  if (amt > 0 && cash >= s.price * amt) {
    cash -= s.price * amt;
    s.hold += amt;
  } else if (amt < 0 && s.hold >= Math.abs(amt)) {
    cash += s.price * Math.abs(amt);
    s.hold += amt;
  }
  renderStocks();
}

function getTotalAssets() {
  const stockVal = stocks.reduce((sum, s) => sum + s.hold * s.price, 0);
  return cash + stockVal;
}

function updateTotalAssets() {
  const total = getTotalAssets();
  document.getElementById("total-assets").innerText =
    `$${Math.floor(total).toLocaleString()}`;
  document.getElementById("cash").innerText =
    `$${Math.floor(cash).toLocaleString()}`;
}

function updateMarket() {
  stocks.forEach((s) => {
    const change = (Math.random() * 2 - 1) * s.vol;
    s.price = parseFloat((s.price * (1 + change)).toFixed(2));
    if (s.price < 0.5) s.price = 0.5;
    s.history.push(s.price);
    if (s.history.length > 50) s.history.shift();
  });
  renderStocks();
}

function saveToLeaderboard() {
  const finalScore = Math.floor(getTotalAssets());
  let leaderboard =
    JSON.parse(localStorage.getItem("stockGame_leaderboard")) || [];
  leaderboard.push({
    name: playerName,
    score: finalScore,
    date: new Date().toLocaleDateString(),
  });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);
  localStorage.setItem("stockGame_leaderboard", JSON.stringify(leaderboard));
}

function showLeaderboard() {
  const leaderboard =
    JSON.parse(localStorage.getItem("stockGame_leaderboard")) || [];
  const rankList = document.getElementById("rank-list");
  rankList.innerHTML = "";
  if (leaderboard.length === 0) {
    rankList.innerHTML = '<tr><td colspan="3">尚無紀錄</td></tr>';
  } else {
    leaderboard.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${index + 1}</td><td>${item.name}</td><td style="color:var(--accent)">$${item.score.toLocaleString()}</td>`;
      rankList.appendChild(tr);
    });
  }
  document.getElementById("rank-modal").style.display = "flex";
}

function showHistory(id) {
  const s = stocks[id];
  const modal = document.getElementById("modal");
  modal.style.display = "flex";
  document.getElementById("modal-title").innerText = s.name;
  const ctx = document.getElementById("historyChart").getContext("2d");
  if (myChart) myChart.destroy();
  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: s.history.map((_, i) => `${i * 3}m`), // 標籤同步修改為 3m
      datasets: [
        {
          label: "股價 (USD)",
          data: s.history,
          borderColor: "#f0b90b",
          backgroundColor: "rgba(240, 185, 11, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: "#2b3139" }, ticks: { color: "#848e9c" } },
        x: { grid: { color: "#2b3139" }, ticks: { color: "#848e9c" } },
      },
      plugins: { legend: { display: false } },
    },
  });
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

window.onclick = function (event) {
  if (event.target.className.includes("modal")) {
    event.target.style.display = "none";
  }
};

// 計時器邏輯
setInterval(() => {
  if (playerName === "") return;

  timeLeft--;
  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  document.getElementById("timer").innerText =
    `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  // 修改更新倒數顯示：從 3:00 開始
  const nextUp = timeLeft % REFRESH_INTERVAL;
  const nm = Math.floor(nextUp / 60);
  const ns = nextUp % 60;
  document.getElementById("next-update").innerText =
    `${nm}:${ns.toString().padStart(2, "0")}`;

  if (timeLeft % REFRESH_INTERVAL === 0) updateMarket();

  if (timeLeft <= 0) {
    saveToLeaderboard();
    alert(
      `時間到！您的最終資產為: $${Math.floor(getTotalAssets()).toLocaleString()}`,
    );
    location.reload();
  }
}, 1000);
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
