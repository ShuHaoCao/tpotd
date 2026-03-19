let scheduleData = {};
const holidays = {
  "2026-01-01": "元旦",
  "2026-02-16": "除夕",
  "2026-02-17": "初一",
  "2026-02-18": "初二",
  "2026-02-19": "初三",
  "2026-02-20": "初四",
  "2026-02-27": "補假(228紀念日)",
  "2026-02-28": "228紀念日",
  "2026-04-03": "補假(兒童節)",
  "2026-04-04": "兒童節",
  "2026-04-05": "清明節",
  "2026-04-06": "補假(清明節)",
  "2026-05-01": "勞動節",
  "2026-06-19": "端午節",
  "2026-09-25": "中秋節",
  "2026-09-28": "教師節",
  "2026-10-09": "補假(國慶日)",
  "2026-10-10": "國慶日",
  "2026-10-24": "補假(光復節)",
  "2026-10-25": "光復節",
  "2026-12-25": "行憲紀念日",
};

const yearSelect = document.getElementById("yearSelect");
const monthSelect = document.getElementById("monthSelect");
const staffSelect = document.getElementById("staffSelect");
const gridEl = document.getElementById("calendarGrid");
const now = new Date();

async function init() {
  for (let y = 2025; y <= 2027; y++)
    yearSelect.options.add(new Option(y + "年", y));
  for (let m = 0; m < 12; m++)
    monthSelect.options.add(new Option(m + 1 + "月", m));
  yearSelect.value = now.getFullYear();
  monthSelect.value = now.getMonth();

  try {
    const response = await fetch("schedule_data.json");
    scheduleData = await response.json();
    populateStaff(scheduleData);
  } catch (e) {
    console.error("JSON Error", e);
  }

  [yearSelect, monthSelect, staffSelect].forEach(
    (el) => (el.onchange = renderCalendar),
  );
  renderCalendar();
}

function populateStaff(data) {
  let names = new Set();
  Object.keys(data).forEach((k) => {
    if (k === "lastUpdated") return;
    Object.values(data[k]).forEach((v) => {
      if (v && v !== "-" && v !== "" && v !== "#溢出!" && v !== "#SPILL!") {
        names.add(v);
      }
    });
  });
  staffSelect.innerHTML = '<option value="">-- 請選擇 --</option>';
  Array.from(names)
    .sort()
    .forEach((n) => staffSelect.options.add(new Option(n, n)));
}

function renderToday() {
  yearSelect.value = now.getFullYear();
  monthSelect.value = now.getMonth();
  renderCalendar();
}

function renderCalendar() {
  const y = parseInt(yearSelect.value),
    m = parseInt(monthSelect.value);
  const selStaff = staffSelect.value;
  gridEl.innerHTML = "";
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++)
    gridEl.innerHTML += `<div class="day-cell other-month"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(y, m, d);
    const weekDay = dateObj.getDay();
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday =
      y === now.getFullYear() && m === now.getMonth() && d === now.getDate();

    const holidayName = holidays[dateStr] || "";
    const isWeekend = weekDay === 0 || weekDay === 6;
    const isHoliday = holidayName !== "" || isWeekend;

    let dutyHtml = "";
    if (selStaff && scheduleData[dateStr]) {
      const dayShifts = scheduleData[dateStr];
      const myShifts = Object.keys(dayShifts).filter(
        (s) => dayShifts[s] === selStaff,
      );
      dutyHtml = myShifts
        .map((s) => `<div class="duty-tag">${s}</div>`)
        .join("");
    }

    gridEl.innerHTML += `
                <div class="day-cell ${isToday ? "is-today" : ""} ${isHoliday ? "is-holiday" : ""}">
                    <div class="date-number">${d}</div>
                    ${holidayName ? `<div class="holiday-name">${holidayName}</div>` : ""}
                    <div class="duty-container">${dutyHtml}</div>
                </div>
            `;
  }
}
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
