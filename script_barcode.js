// ================= 資料設定區 (方便日後新增/刪除) =================
const mailTypesData = [
  { name: "郵政公事普通掛號函件", code: "00" },
  { name: "普通掛號函件", code: "10" },
  { name: "限時掛號函件", code: "20" },
  { name: "普通包裹", code: "30" },
  { name: "快捷包裹", code: "40" },
];

const postOfficesData = [
  { name: "臺南成功路郵局營收股", code: "704451" },
  { name: "臺南郵局郵務科運輸股", code: "704000" },
  { name: "臺南鹽埕郵局", code: "702001" },
  { name: "民雄頭橋郵局", code: "621001" },
];

// 初始化下拉選單
window.onload = function () {
  const typeSelect = document.getElementById("stickerMailType");
  mailTypesData.forEach((item) => {
    let opt = document.createElement("option");
    opt.value = item.code;
    opt.text = item.name;
    typeSelect.appendChild(opt);
  });

  const officeSelect = document.getElementById("stickerOffice");
  postOfficesData.forEach((item) => {
    let opt = document.createElement("option");
    opt.value = item.code;
    opt.text = item.name;
    officeSelect.appendChild(opt);
  });
};
// ===================================================================

let currentMode = "standard";
const printSection = document.getElementById("printSection");

function switchTab(mode) {
  currentMode = mode;
  ["standard", "cart", "qrcode", "sticker"].forEach((m) => {
    document.getElementById(`tab-${m}`).className =
      "tab" + (mode === m ? " active" : "");
    document.getElementById(`config-${m}`).style.display =
      mode === m ? "block" : "none";
  });

  // 隱藏/顯示共用輸入框 (郵政條碼貼紙不使用此輸入框)
  document.getElementById("common-input-group").style.display =
    mode === "sticker" ? "none" : "block";
}

function generateSpecialSerial() {
  const start = parseInt(document.getElementById("serialStart").value);
  const mid = document
    .getElementById("midFix")
    .value.toString()
    .padStart(6, "0");
  const end = document
    .getElementById("endFix")
    .value.toString()
    .padStart(2, "0");
  const count = parseInt(document.getElementById("serialCount").value);
  let res = [];
  for (let i = 0; i < count; i++) {
    let first = (start + i).toString().padStart(6, "0");
    res.push(first + mid + end);
  }
  const input = document.getElementById("userInput");
  if (input.value.trim() && !confirm("確定要覆蓋輸入框現有內容嗎？")) return;
  input.value = res.join("\n");
}

function generateBatchBarcodes() {
  printSection.innerHTML = "";
  printSection.className = ""; // 重置排版 class

  // 如果是郵政貼紙模式，走專屬邏輯
  if (currentMode === "sticker") {
    generateStickers();
    return;
  }

  // 其他模式邏輯
  const codes = document
    .getElementById("userInput")
    .value.split("\n")
    .filter((c) => c.trim());
  if (!codes.length) return alert("請輸入內容");

  codes.forEach((code, i) => {
    if (currentMode === "standard") renderStandard(code, i);
    else if (currentMode === "cart") renderCart(code, i);
    else if (currentMode === "qrcode") renderQRCode(code, i);
  });
}

function generateStickers() {
  const startSerial = parseInt(
    document.getElementById("stickerSerialStart").value,
  );
  const count = parseInt(document.getElementById("stickerCount").value);
  const hasBorder = document.getElementById("stickerBorder").value === "dashed";
  const officeCode = document.getElementById("stickerOffice").value;
  const mailTypeCode = document.getElementById("stickerMailType").value;
  const mailTypeName =
    document.getElementById("stickerMailType").options[
      document.getElementById("stickerMailType").selectedIndex
    ].text;
  const officeName =
    document.getElementById("stickerOffice").options[
      document.getElementById("stickerOffice").selectedIndex
    ].text;

  printSection.innerHTML = "";
  printSection.className = ""; // 移除外層 class，由內部頁面控制

  let currentPage = null;

  for (let i = 0; i < count; i++) {
    // 1. 每 18 張建立一個新的 A4 頁面容器 (這部分保留)
    if (i % 18 === 0) {
      currentPage = document.createElement("div");
      currentPage.className = "layout-grid-18";
      printSection.appendChild(currentPage);
    }

    let currentSerialStr = (startSerial + i).toString().padStart(6, "0");
    let fullCode = `${currentSerialStr}${officeCode}${mailTypeCode}`;
    let displayNum = `${currentSerialStr} ${officeCode} ${mailTypeCode}`;

    const cell = document.createElement("div");
    cell.className = "cell-18";

    const stickerDiv = document.createElement("div");
    stickerDiv.className = "sticker-wrapper" + (hasBorder ? " has-border" : "");
    stickerDiv.innerHTML = `
      <div class="sticker-line1">${mailTypeName}</div>
      <div class="sticker-line2">${officeName}</div>
      <div class="sticker-line3">第 &nbsp;${currentSerialStr}&nbsp; 號</div>
      <div class="sticker-line4-barcode"><svg id="sticker-bc-${i}"></svg></div>
      <div class="sticker-line5">${displayNum}</div>
    `;

    cell.appendChild(stickerDiv);
    currentPage.appendChild(cell); // 確保塞入「當前頁面」容器

    JsBarcode(`#sticker-bc-${i}`, fullCode, {
      format: "CODE128",
      width: 2,
      height: 60,
      margin: 0,
      displayValue: false,
    });
  }
}

function renderStickerCard(
  mailTypeName,
  officeName,
  serialStr,
  fullCode,
  displayNum,
  index,
  hasBorder,
  paperLayout,
) {
  // 建立 6.5 x 4.6 cm 的貼紙本體
  const stickerDiv = document.createElement("div");
  stickerDiv.className = "sticker-wrapper" + (hasBorder ? " has-border" : "");

  stickerDiv.innerHTML = `
          <div class="sticker-line1">${mailTypeName}</div>
          <div class="sticker-line2">${officeName}</div>
          <div class="sticker-line3">第 &nbsp;${serialStr}&nbsp; 號</div>
          <div class="sticker-line4-barcode">
            <svg id="sticker-bc-${index}"></svg>
          </div>
          <div class="sticker-line5">${displayNum}</div>
        `;

  // 如果是 18 格排版，需要包裝一層 7x4.95cm 的 cell
  if (paperLayout === "grid18") {
    const cellDiv = document.createElement("div");
    cellDiv.className = "cell-18";
    cellDiv.appendChild(stickerDiv);
    printSection.appendChild(cellDiv);
  } else {
    printSection.appendChild(stickerDiv);
  }

  // 渲染條碼 (關閉顯示文字，因為我們有自己的 Line 5 文字排版)
  JsBarcode(`#sticker-bc-${index}`, fullCode, {
    format: "CODE128",
    width: 2,
    height: 60,
    margin: 0,
    displayValue: false,
  });
}

function renderStandard(code, i) {
  const w = document.getElementById("widthCm").value,
    h = document.getElementById("heightCm").value;
  const border = document.getElementById("borderSelect").value !== "none";
  const div = document.createElement("div");
  div.className = "barcode-main-wrapper" + (border ? " has-border" : "");
  div.style.width = w + "cm";
  div.style.height = h + "cm";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  div.appendChild(svg);
  printSection.appendChild(div);
  JsBarcode(svg, code, {
    format: "CODE128",
    width: 2,
    height: 50,
    displayValue: true,
    fontSize: 16,
  });
}

function renderCart(code, i) {
  const div = document.createElement("div");
  div.className = "cart-wrapper";
  div.innerHTML = `<div class="cart-left"><span>${code}</span></div><div class="cart-right"><svg id="cs-${i}"></svg></div>`;
  printSection.appendChild(div);
  JsBarcode(`#cs-${i}`, code, {
    format: "CODE128",
    width: 1,
    height: 50,
    displayValue: true,
    fontSize: 12,
    margin: 0,
  });
}

function renderQRCode(code, i) {
  const s = document.getElementById("qrSizeCm").value;
  const txt = document.getElementById("qrTextSelect").value === "yes";
  const logoUrl = document.getElementById("qrLogoUrl").value.trim();
  const pxSize = s * 37.8;

  const div = document.createElement("div");
  div.className = "qrcode-wrapper";

  const qrContainer = document.createElement("div");
  qrContainer.id = "qrc-" + i;
  div.appendChild(qrContainer);

  if (txt) {
    const p = document.createElement("div");
    p.style.fontSize = "12px";
    p.style.marginTop = "8px";
    p.style.fontWeight = "bold";
    p.textContent = code;
    div.appendChild(p);
  }
  printSection.appendChild(div);

  const qrcode = new QRCode(qrContainer, {
    text: code,
    width: pxSize,
    height: pxSize,
    correctLevel: QRCode.CorrectLevel.H,
  });

  if (logoUrl) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = logoUrl;
    img.onload = function () {
      const qrCanvas = qrContainer.querySelector("canvas");
      if (qrCanvas) {
        const ctx = qrCanvas.getContext("2d");
        const logoSize = pxSize * 0.22;
        const x = (pxSize - logoSize) / 2;
        const y = (pxSize - logoSize) / 2;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x - 2, y - 2, logoSize + 4, logoSize + 4);
        ctx.drawImage(img, x, y, logoSize, logoSize);
      }
    };
  }
}

async function downloadAllAsImage() {
  const canvas = await html2canvas(printSection, {
    scale: 2,
    useCORS: true,
  });
  const link = document.createElement("a");
  link.download = `郵件條碼標籤.png`;
  link.href = canvas.toDataURL();
  link.click();
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
