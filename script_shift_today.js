let showOnlyAssigned = false;
let currentFilterGroup = "all";

const filterGroups = {
  morning: [
    "股　長",
    "內檯經辦",
    "空袋櫃",
    "早　班 1",
    "早　班 2",
    "早　班 3",
    "早　班 4",
    "新　營 1",
    "新　營 2",
    "早1(六日)",
    "早3(六)",
  ],
  afternoon: [
    "中班專員",
    "771/772車次",
    "中　班 1",
    "中　班 2",
    "中　班 3",
    "中　班 4",
    "中　班 5",
    "中　班 6",
    "中　班 7",
    "中　班 8",
    "中　班 9",
    "中　班10",
    "中　班11",
    "中　班12",
    "嘉　義 2",
    "自運甲線",
    "自運乙線",
  ],
  night: [
    "夜班專員",
    "夜1(六日)",
    "大夜班 1",
    "大夜班 2",
    "大夜班 3",
    "大夜班 4",
    "127/128車次",
    "進口接送",
    "出口接送",
  ],
  other: ["支　援 1", "支　援 2", "支　援 3", "支　援 4", "見 習 1", "見 習 2"],
};

function applyFilter() {
  document.querySelectorAll(".shift-row").forEach((row) => {
    const label = row.querySelector(".shift-label").textContent.trim();
    const name = row.querySelector(".staff-name").textContent.trim();
    const hasStaff = name !== "" && name !== "-" && name !== "－";

    if (currentFilterGroup !== "all") {
      if (filterGroups[currentFilterGroup].includes(label) && hasStaff) {
        row.classList.remove("hidden");
      } else {
        row.classList.add("hidden");
      }
    } else {
      if (showOnlyAssigned && !hasStaff) {
        row.classList.add("hidden");
      } else {
        row.classList.remove("hidden");
      }
    }
  });
}

async function loadSchedule() {
  const today = new Date();
  const todayStr =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");
  document.getElementById("todayTitle").textContent =
    `【本日班表】${todayStr.replace(/-/g, "/")} (${["日", "一", "二", "三", "四", "五", "六"][today.getDay()]})`;

  try {
    const response = await fetch(
      "schedule_data.json?t=" + new Date().getTime(),
    );
    const data = await response.json();
    const todayData = data[todayStr] || {};

    document.querySelectorAll(".shift-row").forEach((row) => {
      const label = row.querySelector(".shift-label")?.textContent?.trim();
      const staffName = todayData[label]?.trim() || "";
      row.querySelector(".staff-name").textContent =
        staffName === "" ? "－" : staffName;
    });

    applyFilter();
  } catch (err) {
    console.error("載入失敗", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btnAll = document.getElementById("show-all");
  const btnAssigned = document.getElementById("show-assigned");
  const groupBtns = document.querySelectorAll(".group-btn");

  const clearActive = () =>
    [btnAll, btnAssigned, ...groupBtns].forEach((b) =>
      b.classList.remove("active"),
    );

  btnAll.addEventListener("click", () => {
    clearActive();
    btnAll.classList.add("active");
    showOnlyAssigned = false;
    currentFilterGroup = "all";
    applyFilter();
  });

  btnAssigned.addEventListener("click", () => {
    clearActive();
    btnAssigned.classList.add("active");
    showOnlyAssigned = true;
    currentFilterGroup = "all";
    applyFilter();
  });

  groupBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      clearActive();
      btn.classList.add("active");
      currentFilterGroup = btn.dataset.group;
      applyFilter();
    });
  });

  loadSchedule();
});
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
