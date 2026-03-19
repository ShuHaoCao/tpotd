function updateDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  document.getElementById("datetime").textContent =
    `${year}年${month}月${date}日　${hours}:${minutes}:${seconds}`;
}

updateDateTime();
setInterval(updateDateTime, 1000);

function openRoster() {
  document.getElementById("rosterModal").style.display = "flex";
}
function closeRoster() {
  document.getElementById("rosterModal").style.display = "none";
}

function overtime() {
  document.getElementById("overtimeModal").style.display = "flex";
}
function closeOvertime() {
  document.getElementById("overtimeModal").style.display = "none";
}

function holidayWork() {
  document.getElementById("holidayWorkModal").style.display = "flex";
}
function closeHolidayWork() {
  document.getElementById("holidayWorkModal").style.display = "none";
}

function openLeaveStats() {
  document.getElementById("leaveStatsModal").style.display = "flex";
}
function closeLeaveStats() {
  document.getElementById("leaveStatsModal").style.display = "none";
}

function openNorthbound() {
  document.getElementById("northboundModal").style.display = "flex";
}
function closeNorthbound() {
  document.getElementById("northboundModal").style.display = "none";
}

function openSouthbound() {
  document.getElementById("southboundModal").style.display = "flex";
}
function closeSouthbound() {
  document.getElementById("southboundModal").style.display = "none";
}

function openExpress() {
  document.getElementById("expressModal").style.display = "flex";
}
function closeExpress() {
  document.getElementById("expressModal").style.display = "none";
}

function openShift() {
  document.getElementById("shiftModal").style.display = "flex";
}
function closeShift() {
  document.getElementById("shiftModal").style.display = "none";
}

function checkPassword() {
  const input = prompt("請輸入密碼：");
  if (input === null) return;
  fetch("password.json?t=" + new Date().getTime())
    .then((res) => {
      if (!res.ok) throw new Error("無法載入密碼資料");
      return res.json();
    })
    .then((data) => {
      if (input === data.toolboxPassword) {
        document.getElementById("toolboxModal").style.display = "flex";
      } else {
        alert("密碼錯誤，請再試一次！");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("驗證失敗，請稍後再試！");
    });
}

function goToToolbox() {
  window.location.href = "phone_book.html";
}
function closeToolboxModal() {
  document.getElementById("toolboxModal").style.display = "none";
}
function goToBarcode() {
  window.location.href = "Barcode.html";
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
