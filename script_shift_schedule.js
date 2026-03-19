let currentScheduleData = {};
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
    "大夜班 1",
    "大夜班 2",
    "大夜班 3",
    "大夜班 4",
    "127/128車次",
    "夜1(六日)",
    "進口接送",
    "出口接送",
  ],
  other: ["支　援 1", "支　援 2", "支　援 3", "支　援 4", "見 習 1", "見 習 2"],
};

const shiftListLeft = [
  { label: "股　長", color: "red" },
  { label: "早班專員", color: "green" },
  { label: "內檯經辦", color: "blue" },
  { label: "空袋櫃", color: "green" },
  { label: "早　班 1", color: "green" },
  { label: "早　班 2", color: "green" },
  { label: "早　班 3", color: "green" },
  { label: "早　班 4", color: "blue-green" },
  { label: "新　營 1", color: "blue-green" },
  { label: "新　營 2", color: "blue-green" },
  { label: "早1(六日)", color: "green" },
  { label: "早3(六)", color: "green" },
  { label: "中班專員", color: "red" },
  { label: "771/772車次", color: "light-blue" },
  { label: "中　班 1", color: "light-blue" },
  { label: "中1(六日)", color: "light-blue" },
  { label: "中　班 2", color: "middle-blue" },
  { label: "中　班 3", color: "middle-blue" },
  { label: "中　班 4", color: "middle-blue" },
  { label: "中　班 5", color: "middle-blue" },
  { label: "中　班 6", color: "middle-blue" },
  { label: "中　班 7", color: "blue" },
  { label: "中　班 8", color: "light-blue" },
  { label: "中　班 9", color: "middle-blue" },
  { label: "中　班10", color: "light-blue" },
  { label: "中　班11", color: "light-blue" },
  { label: "中　班12", color: "light-blue" },
  { label: "中　班13", color: "light-blue" },
  { label: "自運甲線", color: "purple" },
  { label: "自運乙線", color: "purple" },
  { label: "嘉　義 B", color: "blue" },
  { label: "嘉　義 2", color: "blue" },
  { label: "嘉　義 4", color: "blue" },
  { label: "夜班專員", color: "red" },
  { label: "大夜班 1", color: "gray" },
  { label: "夜1(六日)", color: "gray" },
  { label: "大夜班 2", color: "gray" },
  { label: "大夜班 3", color: "gray" },
  { label: "大夜班 4", color: "gray" },
  { label: "大夜班 5", color: "gray" },
  { label: "127/128車次", color: "gray" },
  { label: "進口接送", color: "gray" },
  { label: "出口接送", color: "gray" },
];

const shiftListRight = [
  { label: "支　援 1", color: "orange" },
  { label: "支　援 2", color: "orange" },
  { label: "支　援 3", color: "orange" },
  { label: "支　援 4", color: "orange" },
  { label: "見 習 1", color: "coffee" },
  { label: "見 習 2", color: "coffee" },
];

function createRow(shift, name) {
  const hasStaff =
    name && name.trim() !== "" && name.trim() !== "-" && name.trim() !== "－";
  if (currentFilterGroup !== "all") {
    if (!filterGroups[currentFilterGroup].includes(shift.label)) return "";
    if (!hasStaff) return "";
  } else if (showOnlyAssigned && !hasStaff) {
    return "";
  }
  const displayName = hasStaff ? name : "－";
  return `<div class="shift-row"><div class="shift-label ${shift.color}">${shift.label}</div><div class="staff-name">${displayName}</div></div>`;
}

function renderSchedule() {
  document.getElementById("left-column").innerHTML = shiftListLeft
    .map((s) => createRow(s, currentScheduleData[s.label]))
    .join("");
  document.getElementById("right-column").innerHTML = shiftListRight
    .map((s) => createRow(s, currentScheduleData[s.label]))
    .join("");
}

function fetchSchedule(date) {
  fetch("schedule_data.json?t=" + new Date().getTime())
    .then((res) => res.json())
    .then((allData) => {
      currentScheduleData = allData[date] || {};
      renderSchedule();
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const dateInput = document.getElementById("date");
  const btnAll = document.getElementById("show-all");
  const btnAssigned = document.getElementById("show-assigned");
  const groupBtns = document.querySelectorAll(".group-btn");

  dateInput.value = new Date().toISOString().split("T")[0];
  fetchSchedule(dateInput.value);

  const clearActive = () =>
    [btnAll, btnAssigned, ...groupBtns].forEach((b) =>
      b.classList.remove("active"),
    );

  btnAll.addEventListener("click", function () {
    clearActive();
    this.classList.add("active");
    showOnlyAssigned = false;
    currentFilterGroup = "all";
    renderSchedule();
  });
  btnAssigned.addEventListener("click", function () {
    clearActive();
    this.classList.add("active");
    showOnlyAssigned = true;
    currentFilterGroup = "all";
    renderSchedule();
  });
  groupBtns.forEach((btn) =>
    btn.addEventListener("click", function () {
      clearActive();
      this.classList.add("active");
      currentFilterGroup = this.dataset.group;
      renderSchedule();
    }),
  );

  dateInput.addEventListener("change", function () {
    const days = [
      "星期日",
      "星期一",
      "星期二",
      "星期三",
      "星期四",
      "星期五",
      "星期六",
    ];
    document.getElementById("weekday").textContent =
      days[new Date(this.value).getDay()];
    fetchSchedule(this.value);
  });
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
