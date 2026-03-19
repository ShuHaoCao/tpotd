let triviaData = []; // 原始資料
let shuffledData = []; // 洗牌後的資料
let currentIndex = -1; // 當前播放到的位置

const card = document.getElementById("trivia-card");
const frontFace = document.getElementById("front-face");
const backFace = document.getElementById("back-face");

async function init() {
  try {
    const response = await fetch("trivia_data.json");
    triviaData = await response.json();

    if (triviaData.length > 0) {
      resetAndShuffle(); // 初始載入時進行洗牌
      nextTrivia(); // 顯示第一個
    }
  } catch (err) {
    frontFace.innerHTML = `<div class="icon-text">❌</div><h2>載入失敗</h2><p>請檢查 JSON 檔案</p>`;
  }
}

/**
 * 洗牌函式：將原始資料隨機打亂並存入 shuffledData
 */
function resetAndShuffle() {
  shuffledData = [...triviaData];
  for (let i = shuffledData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
  }
  currentIndex = -1; // 重置索引，以便 nextTrivia 從 0 開始
}

function nextTrivia() {
  if (triviaData.length === 0) return;

  currentIndex++;

  // 如果索引超過總數，代表看完了
  if (currentIndex >= shuffledData.length) {
    alert("所有的生活小知識都看過一遍囉！即將重新隨機排序內容。");
    resetAndShuffle();
    currentIndex = 0;
  }

  renderCard(shuffledData[currentIndex]);
}

function renderCard(item) {
  // 先翻回正面並移除動畫類
  card.classList.remove("flipped");
  frontFace.classList.remove("fade-in");

  // 強制瀏覽器重繪 (reflow)，確保動畫能重複觸發
  void frontFace.offsetWidth;

  const isImage = item.icon.includes(".") || item.icon.startsWith("http");
  const iconHTML = isImage
    ? `<img src="${item.icon}" alt="icon">`
    : `<span class="icon-text">${item.icon}</span>`;

  frontFace.innerHTML = `
                <div class="icon-container">${iconHTML}</div>
                <h2 class="question-text">${item.question}</h2>
                <div class="hint">點擊卡片揭曉答案</div>
            `;
  frontFace.classList.add("fade-in");

  backFace.innerHTML = `
                <h3 style="font-size:1.5rem; margin-bottom:15px;">${item.answer}</h3>
                <p style="line-height: 1.6; font-size:1.1rem;">${item.description}</p>
                <hr style="width: 40%; border: 0.5px solid rgba(255,255,255,0.3); margin: 20px 0;">
                <p style="font-size: 0.9rem; font-style: italic; opacity: 0.9;">${item.tip}</p>
            `;
  backFace.style.backgroundColor = item.theme_color || "#3498db";
}

card.addEventListener("click", () => {
  card.classList.toggle("flipped");
});

init();
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
