const stampBasePath = "assets/stamps";

const stampCategories = [
  { folder: "01", count: 20 },
  { folder: "02", count: 20 },
  { folder: "03", count: 32 }
];

const chatStorageKey = "baChatSave";
const settingsStorageKey = "baSettings";
const storageVersion = 1;

let chatHistory = [];
let isRestoringChat = false;

const chatTab = document.getElementById("chatTab");
const settingTab = document.getElementById("settingTab");
const chatView = document.getElementById("chatView");
const settingView = document.getElementById("settingView");

const chatLog = document.getElementById("chatLog");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const faceButton = document.querySelector(".face-button");
const currentSenderSelect = document.getElementById("currentSenderSelect");
const circleNameTitle = document.getElementById("circleNameTitle");
const circleNameInput = document.getElementById("circleNameInput");

const senderNameInput = document.getElementById("senderNameInput");
const senderNameSettingRow = document.getElementById("senderNameSettingRow");
const senderTitleInput = document.getElementById("senderTitleInput");
const senderTitleSettingRow = document.getElementById("senderTitleSettingRow");
const mainStudentSelect = document.getElementById("mainStudentSelect");
const mainStudentSettingRow = document.getElementById("mainStudentSettingRow");
const clearChatButton = document.getElementById("clearChatButton");
const createShareUrlButton = document.getElementById("createShareUrlButton");
const shareUrlStatus = document.getElementById("shareUrlStatus");
const senderSelectorToggle = document.getElementById("senderSelectorToggle");
const ngResponseToggle = document.getElementById("ngResponseToggle");
const editModeToggle = document.getElementById("editModeToggle");
const storageModeToggle = document.getElementById("storageModeToggle");

const stampModal = document.getElementById("stampModal");
const closeStampButton = document.getElementById("closeStampButton");
const stampGrid = document.getElementById("stampGrid");
let editingStampIndex = -1;
let insertingStampAfterIndex = -1;

const openNgWordModalButton = document.getElementById("openNgWordModalButton");
const ngWordModal = document.getElementById("ngWordModal");
const closeNgWordModalButton = document.getElementById("closeNgWordModalButton");
const ngWordList = document.getElementById("ngWordList");
const ngWordConfirmModal = document.getElementById("ngWordConfirmModal");
const closeNgWordConfirmButton = document.getElementById("closeNgWordConfirmButton");
const cancelNgWordConfirmButton = document.getElementById("cancelNgWordConfirmButton");
const showNgWordConfirmButton = document.getElementById("showNgWordConfirmButton");

const openAllowWordModalButton = document.getElementById("openAllowWordModalButton");
const allowWordModal = document.getElementById("allowWordModal");
const closeAllowWordModalButton = document.getElementById("closeAllowWordModalButton");
const allowWordList = document.getElementById("allowWordList");

const captureChatButton = document.getElementById("captureChatButton");
const openSiteInfoButton = document.getElementById("openSiteInfoButton");
const siteInfoModal = document.getElementById("siteInfoModal");
const closeSiteInfoButton = document.getElementById("closeSiteInfoButton");

const appMessageModal = document.getElementById("appMessageModal");
const appMessageTitle = document.getElementById("appMessageTitle");
const appMessageText = document.getElementById("appMessageText");
const closeAppMessageButton = document.getElementById("closeAppMessageButton");
const okAppMessageButton = document.getElementById("okAppMessageButton");

const appConfirmModal = document.getElementById("appConfirmModal");
const appConfirmTitle = document.getElementById("appConfirmTitle");
const appConfirmText = document.getElementById("appConfirmText");
const closeAppConfirmButton = document.getElementById("closeAppConfirmButton");
const cancelAppConfirmButton = document.getElementById("cancelAppConfirmButton");
const okAppConfirmButton = document.getElementById("okAppConfirmButton");
let appConfirmOkHandler = null;

const defaultCircleName = "テストサークル";
let circleName = defaultCircleName;
let senderName = "先生";
let senderTitle = "新任の先生";
let mainSenderMode = "sensei";
let mainStudentId = "yuuka";
let currentSenderId = "sensei";


function setRadioChecked(name, value) {
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) {
    radio.checked = true;
  }
}

function syncSettingToggles() {
  senderSelectorVisible = true;
  if (ngResponseToggle) {
    ngResponseToggle.checked = ngResponseEnabled;
  }
  if (editModeToggle) {
    editModeToggle.checked = editMode;
  }
  if (storageModeToggle) {
    storageModeToggle.checked = storageEnabled;
  }

  setRadioChecked("ngResponseMode", ngResponseEnabled ? "on" : "off");
  setRadioChecked("editMode", editMode ? "on" : "off");
  setRadioChecked("storageMode", storageEnabled ? "on" : "off");
}

function resizeMessageInput() {
  // 入力欄は見た目を1行固定にするため、自動拡張は行いません。
  // textarea自体は維持しているので、Shift + Enter の改行データは保持できます。
  if (!messageInput) {
    return;
  }

  messageInput.scrollTop = messageInput.scrollHeight;
}
let senderSelectorVisible = true;
let censorMode = "highlight";
let lastUserMessageSenderName = "";
let compactMode = true;
let deleteMode = false;
let editMode = false;
let ngResponseEnabled = false;
let storageEnabled = false;

const shareLogParamName = "log";
let isLoadingSharedLog = false;

function encodeBase64UrlFromText(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function decodeTextFromBase64Url(base64Url) {
  const base64 = base64Url
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}

function createSharePayload() {
  return {
    v: storageVersion,
    settings: {
      circleName,
      senderName,
      senderTitle,
      mainSenderMode,
      mainStudentId,
      currentSenderId,
      senderSelectorVisible,
      censorMode,
      compactMode,
      ngResponseEnabled
    },
    messages: chatHistory
  };
}

function applySharedSettings(settings = {}) {
  circleName = Object.prototype.hasOwnProperty.call(settings, "circleName") ? String(settings.circleName) : defaultCircleName;
  senderName = settings.senderName || "先生";
  senderTitle = settings.senderTitle || "新任の先生";
  mainSenderMode = settings.mainSenderMode === "student" ? "student" : "sensei";
  mainStudentId = isKnownSenderId(settings.mainStudentId) && settings.mainStudentId !== "sensei" ? settings.mainStudentId : "yuuka";
  senderSelectorVisible = true;
  censorMode = settings.censorMode === "mask" ? "mask" : "highlight";
  compactMode = settings.compactMode !== false;
  ngResponseEnabled = settings.ngResponseEnabled === true;
  currentSenderId = isKnownSenderId(settings.currentSenderId) ? settings.currentSenderId : getMainSenderId();

  circleNameInput.value = circleName;
  senderNameInput.value = senderName;
  mainStudentSelect.value = getMainSenderId();
  currentSenderSelect.value = currentSenderId;
  updateCircleNameDisplay();

  const mainSenderModeRadio = document.querySelector(`input[name="mainSenderMode"][value="${mainSenderMode}"]`);
  if (mainSenderModeRadio) {
    mainSenderModeRadio.checked = true;
  }

  const senderSelectorRadioValue = senderSelectorVisible ? "on" : "off";
  const senderSelectorRadio = document.querySelector(`input[name="senderSelectorMode"][value="${senderSelectorRadioValue}"]`);
  if (senderSelectorRadio) {
    senderSelectorRadio.checked = true;
  }

  const censorRadio = document.querySelector(`input[name="censorMode"][value="${censorMode}"]`);
  if (censorRadio) {
    censorRadio.checked = true;
  }

  const compactRadioValue = compactMode ? "on" : "off";
  const compactRadio = document.querySelector(`input[name="compactMode"][value="${compactRadioValue}"]`);
  if (compactRadio) {
    compactRadio.checked = true;
  }

  const ngResponseRadioValue = ngResponseEnabled ? "on" : "off";
  const ngResponseRadio = document.querySelector(`input[name="ngResponseMode"][value="${ngResponseRadioValue}"]`);
  if (ngResponseRadio) {
    ngResponseRadio.checked = true;
  }

  updateMainSenderSettingsDisplay();
  updateSenderSelectorDisplay();
  syncSettingToggles();
}

function getSharedPayloadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get(shareLogParamName);

  if (!encoded) {
    return null;
  }

  try {
    const jsonText = decodeTextFromBase64Url(encoded);
    const payload = JSON.parse(jsonText);

    if (!payload || !Array.isArray(payload.messages)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.warn("共有ログの読み込みに失敗しました。", error);
    return null;
  }
}

function showAppMessage(title, message) {
  if (!appMessageModal) {
    return;
  }

  appMessageTitle.textContent = title || "通知";
  appMessageText.textContent = message || "";
  appMessageModal.classList.remove("hidden");
}

function closeAppMessage() {
  if (appMessageModal) {
    appMessageModal.classList.add("hidden");
  }
}

function showAppConfirm(title, message, onOk) {
  if (!appConfirmModal) {
    if (typeof onOk === "function") {
      onOk();
    }
    return;
  }

  appConfirmTitle.textContent = title || "確認";
  appConfirmText.textContent = message || "";
  appConfirmOkHandler = typeof onOk === "function" ? onOk : null;
  appConfirmModal.classList.remove("hidden");
}

function closeAppConfirm() {
  if (appConfirmModal) {
    appConfirmModal.classList.add("hidden");
  }
  appConfirmOkHandler = null;
}

function runAppConfirmOk() {
  const handler = appConfirmOkHandler;
  closeAppConfirm();

  if (handler) {
    handler();
  }
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}


function getCaptureFileName() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const stamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join("") + "_" + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("");

  return `circle-chat_${stamp}.png`;
}

function waitForImagesLoaded(root) {
  const images = Array.from(root.querySelectorAll("img"));

  if (!images.length) {
    return Promise.resolve();
  }

  const waitTasks = images.map((img) => {
    if (img.complete && img.naturalWidth > 0) {
      if (typeof img.decode === "function") {
        return img.decode().catch(() => {});
      }
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const done = () => resolve();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    }).then(() => {
      if (typeof img.decode === "function") {
        return img.decode().catch(() => {});
      }
    });
  });

  return Promise.race([
    Promise.all(waitTasks),
    new Promise((resolve) => setTimeout(resolve, 1500))
  ]);
}

function createCaptureNameLine(senderId = "sensei", savedName = "") {
  const profile = getSenderProfile(senderId);
  const displayName = getSenderDisplayName(senderId, savedName);

  const nameLine = document.createElement("div");
  nameLine.className = "capture-name-line";

  const plate = document.createElement("span");
  plate.className = `capture-plate ${profile.plateClass || "gold"}`;
  plate.textContent = profile.title || "新任の先生";

  const name = document.createElement("strong");
  name.textContent = displayName;

  nameLine.appendChild(plate);
  nameLine.appendChild(name);

  return nameLine;
}

function createCaptureAvatar(senderId = "sensei") {
  const profile = getSenderProfile(senderId);
  const avatar = document.createElement("div");

  if (profile.icon) {
    avatar.className = "capture-avatar capture-image-avatar";

    const avatarImage = document.createElement("img");
    avatarImage.className = "capture-avatar-image";
    avatarImage.src = profile.icon;
    avatarImage.alt = profile.name || "icon";

    avatar.appendChild(avatarImage);
    return avatar;
  }

  avatar.className = "capture-avatar";
  avatar.textContent = profile.avatarText || "S";

  return avatar;
}

function createCaptureChatItem(message, index, lastSenderKeyRef) {
  const senderId = message.senderId || "sensei";
  const savedName = message.name || "";
  const displayName = getSenderDisplayName(senderId, savedName);
  const senderKey = `${senderId}:${displayName}`;
  const mainSenderId = getMainSenderId();
  const isStudentMessage = senderId !== mainSenderId;
  const isCompact = compactMode && lastSenderKeyRef.value === senderKey;

  const item = document.createElement("article");
  item.className = "capture-chat-item";
  item.classList.add(`sender-${senderId}`);

  if (isStudentMessage) {
    item.classList.add("student-message");
  }

  if (isCompact) {
    item.classList.add("compact");
  }

  const avatar = createCaptureAvatar(senderId);

  const messageArea = document.createElement("div");
  messageArea.className = "capture-message-area";
  messageArea.appendChild(createCaptureNameLine(senderId, savedName));

  if (message.type === "text") {
    const bubble = document.createElement("div");
    bubble.className = "capture-bubble";
    bubble.innerHTML = applyCensor(message.text || "");
    messageArea.appendChild(bubble);
  } else {
    const bubble = document.createElement("div");
    bubble.className = "capture-bubble capture-stamp-bubble";

    const image = document.createElement("img");
    image.className = "capture-stamp-image";
    image.alt = "stamp";

    if (message.type === "systemWarning") {
      image.src = "assets/stamps/01/11.png";
      item.classList.add("system-warning-item");
    } else if (message.type === "shirokoReply") {
      image.src = "assets/stamps/03/26.png";
      item.classList.add("shiroko-reply-item");
    } else {
      image.src = message.imagePath || "";
    }

    bubble.appendChild(image);
    messageArea.appendChild(bubble);
  }

  item.appendChild(avatar);
  item.appendChild(messageArea);

  lastSenderKeyRef.value = senderKey;
  return item;
}


function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, width, height, radius, color, lineWidth = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.stroke();
}

function drawTextWithLetterSpacing(ctx, text, x, y, letterSpacing = 0) {
  if (!letterSpacing) {
    ctx.fillText(text, x, y);
    return ctx.measureText(text).width;
  }

  let cursor = x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + letterSpacing;
  }
  return cursor - x;
}

function splitCanvasText(ctx, text, maxWidth) {
  const lines = [];
  const paragraphs = String(text || "").split(/\r?\n/);

  paragraphs.forEach((paragraph) => {
    if (paragraph === "") {
      lines.push("");
      return;
    }

    let line = "";
    for (const char of paragraph) {
      const testLine = line + char;
      if (line && ctx.measureText(testLine).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    }
    lines.push(line);
  });

  return lines.length ? lines : [""];
}

function getCensoredPlainText(text) {
  const protectedRanges = createProtectedRanges(text);
  let result = "";
  let index = 0;

  while (index < text.length) {
    const target = detectNgAt(text, index, protectedRanges);

    if (target) {
      result += censorMode === "highlight" ? target : "*".repeat(target.length);
      index += target.length;
      continue;
    }

    result += text[index];
    index += 1;
  }

  return result;
}

function createCensoredSegments(text) {
  const protectedRanges = createProtectedRanges(text);
  const segments = [];
  let index = 0;

  while (index < text.length) {
    const target = detectNgAt(text, index, protectedRanges);

    if (target) {
      segments.push({
        text: censorMode === "highlight" ? target : "*".repeat(target.length),
        ng: censorMode === "highlight"
      });
      index += target.length;
      continue;
    }

    segments.push({ text: text[index], ng: false });
    index += 1;
  }

  return segments;
}

function wrapSegments(ctx, segments, maxWidth) {
  const lines = [];
  let current = [];
  let currentWidth = 0;

  const pushLine = () => {
    lines.push(current);
    current = [];
    currentWidth = 0;
  };

  segments.forEach((segment) => {
    const parts = String(segment.text || "").split(/(\r?\n)/);

    parts.forEach((part) => {
      if (part === "\n" || part === "\r\n") {
        pushLine();
        return;
      }

      for (const char of part) {
        const width = ctx.measureText(char).width;
        if (current.length && currentWidth + width > maxWidth) {
          pushLine();
        }
        current.push({ text: char, ng: segment.ng, width });
        currentWidth += width;
      }
    });
  });

  if (current.length || lines.length === 0) {
    pushLine();
  }

  return lines;
}

function drawSegmentLines(ctx, lines, x, y, lineHeight, normalColor, ngColor) {
  lines.forEach((line, lineIndex) => {
    let cursor = x;
    line.forEach((part) => {
      ctx.fillStyle = part.ng ? ngColor : normalColor;
      ctx.fillText(part.text, cursor, y + lineIndex * lineHeight);
      cursor += part.width;
    });
  });
}

function loadCanvasImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const candidates = [];
    try {
      candidates.push(new URL(src, window.location.href).href);
    } catch (error) {
      candidates.push(src);
    }
    candidates.push(src);

    let index = 0;

    const tryNext = () => {
      if (index >= candidates.length) {
        resolve(null);
        return;
      }

      const image = new Image();

      image.onload = () => {
        if (image.naturalWidth > 0 && image.naturalHeight > 0) {
          resolve(image);
        } else {
          index += 1;
          tryNext();
        }
      };

      image.onerror = () => {
        index += 1;
        tryNext();
      };

      image.src = candidates[index];
    };

    tryNext();
  });
}

function drawImageCover(ctx, image, x, y, width, height) {
  if (!image) {
    return;
  }

  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;

  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / targetRatio;
    sy = (image.height - sh) / 2;
  }

  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function drawImageContain(ctx, image, x, y, width, height) {
  if (!image) {
    return false;
  }

  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  return true;
}

function drawCameraIcon(ctx, x, y, size) {
  ctx.save();
  ctx.strokeStyle = "#4a6072";
  ctx.fillStyle = "#4a6072";
  ctx.lineWidth = 2;
  roundRectPath(ctx, x + size * 0.18, y + size * 0.32, size * 0.64, size * 0.44, size * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + size * 0.35, y + size * 0.32);
  ctx.lineTo(x + size * 0.43, y + size * 0.22);
  ctx.lineTo(x + size * 0.57, y + size * 0.22);
  ctx.lineTo(x + size * 0.65, y + size * 0.32);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + size * 0.5, y + size * 0.54, size * 0.13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFaceIcon(ctx, x, y, size) {
  ctx.save();
  ctx.strokeStyle = "#4a6072";
  ctx.fillStyle = "#4a6072";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * 0.36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + size * 0.38, y + size * 0.43, size * 0.045, 0, Math.PI * 2);
  ctx.arc(x + size * 0.62, y + size * 0.43, size * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + size * 0.5, y + size * 0.54, size * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function resolveMessageStampPath(message) {
  if (message.type === "stamp") {
    return message.imagePath || "";
  }
  if (message.type === "systemWarning") {
    return "assets/stamps/01/11.png";
  }
  if (message.type === "shirokoReply") {
    return "assets/stamps/03/26.png";
  }
  return "";
}

function getCanvasCaptureMessages() {
  return chatHistory.map((message) => {
    const senderId = message.senderId || (message.type === "shirokoReply" ? "shiroko" : "sensei");
    const profile = getSenderProfile(senderId);
    const displayName = profile.useCustomName
      ? (message.name || senderName || profile.name || "先生")
      : (profile.name || message.name || "先生");

    return {
      ...message,
      senderId,
      profile,
      displayName,
      stampPath: resolveMessageStampPath(message)
    };
  });
}

function makeCanvasCaptureLayout(ctx, messages, width) {
  const margin = 14;
  const innerWidth = width - margin * 2;
  const avatarSize = 42;
  const gap = 9;
  const lineHeight = 25;
  const nameLineHeight = 24;
  const maxBubbleWidth = Math.min(520, innerWidth - avatarSize - gap - 20);
  const rows = [];
  let lastSenderKey = "";

  ctx.font = "700 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  messages.forEach((message) => {
    const senderKey = `${message.senderId}:${message.displayName}`;
    const compact = compactMode && lastSenderKey === senderKey;
    const isStamp = message.type === "stamp" || message.type === "systemWarning" || message.type === "shirokoReply";
    const showMeta = !compact;
    let bubbleWidth = 0;
    let bubbleHeight = 0;
    let lines = [];

    if (isStamp) {
      bubbleWidth = message.type === "systemWarning" ? 112 : 112;
      bubbleHeight = message.type === "systemWarning" ? 112 : 112;
    } else {
      ctx.font = "700 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      const segments = createCensoredSegments(message.text || "");
      lines = wrapSegments(ctx, segments, maxBubbleWidth - 28);
      const widest = Math.max(40, ...lines.map((line) => line.reduce((sum, part) => sum + part.width, 0)));
      bubbleWidth = Math.min(maxBubbleWidth, Math.ceil(widest + 22));
      bubbleHeight = Math.max(38, lines.length * lineHeight + 14);
    }

    const contentHeight = bubbleHeight + (showMeta ? nameLineHeight : 0);
    const rowHeight = Math.max(showMeta ? avatarSize : 0, contentHeight) + 13;

    rows.push({
      message,
      compact,
      showMeta,
      isStamp,
      lines,
      bubbleWidth,
      bubbleHeight,
      rowHeight,
      avatarSize,
      maxBubbleWidth
    });

    lastSenderKey = senderKey;
  });

  return { rows, margin, innerWidth, avatarSize, gap, lineHeight, nameLineHeight };
}


function openCaptureImageInTab(openedWindow, canvas) {
  const url = canvas.toDataURL("image/png");

  if (!openedWindow || openedWindow.closed) {
    showAppMessage("画像表示", "画像を開けませんでした。ポップアップブロックを解除して、もう一度お試しください。");
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>チャット画像</title>
  <style>
    body {
      margin: 0;
      padding: 16px;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #263f55;
      text-align: center;
    }
    .note {
      margin: 0 0 12px;
      font-size: 14px;
      line-height: 1.6;
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
      background: #dbeaf1;
    }
  </style>
</head>
<body>
  <p class="note">画像を長押しすると、写真に保存できます。</p>
  <img src="${url}" alt="チャット画像">
</body>
</html>`;

  openedWindow.document.open();
  openedWindow.document.write(html);
  openedWindow.document.close();
}

async function captureChatImage() {
  if (!chatHistory.length) {
    showAppMessage("スクリーンショット", "保存できるチャットがありません。");
    return;
  }

  // iPhone Safariでは、Canvas生成後にwindow.openするとブロックされやすい。
  // そのため、クリック直後に先に空タブを開き、生成後に画像を流し込む。
  const captureWindow = window.open("", "_blank");

  if (captureWindow) {
    captureWindow.document.open();
    captureWindow.document.write(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>チャット画像を生成中</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #263f55;
      background: #dbeaf1;
      text-align: center;
    }
  </style>
</head>
<body>
  <p>画像を生成しています...</p>
</body>
</html>`);
    captureWindow.document.close();
  }

  try {
    const panel = document.querySelector(".chat-panel");
    const width = 850;
    const scale = Math.min(2, window.devicePixelRatio || 1);
    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    const messages = getCanvasCaptureMessages();
    const layout = makeCanvasCaptureLayout(measureCtx, messages, width);

    const captureHeaderHeight = 66;
    const chatTopPadding = 16;
    const chatBottomPadding = 18;
    const chatHeight = layout.rows.reduce((sum, row) => sum + row.rowHeight, chatTopPadding + chatBottomPadding);
    const height = captureHeaderHeight + chatHeight;

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const imageEntries = [];
    messages.forEach((message) => {
      if (message.profile && message.profile.icon) {
        imageEntries.push(message.profile.icon);
      }
      if (message.stampPath) {
        imageEntries.push(message.stampPath);
      }
    });

    const loadedImages = new Map();
    await Promise.all([...new Set(imageEntries)].map(async (src) => {
      loadedImages.set(src, await loadCanvasImage(src));
    }));

    // 保存画像専用のヘッダー + チャット欄を描画する。通常画面のHTML/DOMは変更しない。
    ctx.fillStyle = "#dbeaf1";
    ctx.fillRect(0, 0, width, height);

    // サークル名ヘッダー。チャット画面に馴染むよう、薄い背景と下線だけの控えめな見た目にする。
    ctx.fillStyle = "#f7fcff";
    ctx.fillRect(0, 0, width, captureHeaderHeight);
    ctx.fillStyle = "#245986";
    ctx.font = "700 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(circleName || defaultCircleName || "テストサークル", 30, captureHeaderHeight / 2);
    ctx.strokeStyle = "#b8d7e5";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, captureHeaderHeight - 1);
    ctx.lineTo(width, captureHeaderHeight - 1);
    ctx.stroke();

    let y = captureHeaderHeight + chatTopPadding;
    layout.rows.forEach((row) => {
      const message = row.message;
      const profile = message.profile;
      const mainSenderId = getMainSenderId();
      const isStudent = message.senderId !== mainSenderId;
      const xAvatar = layout.margin + 18;
      const xArea = layout.margin + 18 + layout.avatarSize + layout.gap + 12;
      const top = y;
      let contentY = top;

      if (row.showMeta) {
        const iconImage = loadedImages.get(profile.icon);
        if (iconImage) {
          // 透過PNGの背景が透けないよう、先に白い下地を敷く。
          fillRoundRect(ctx, xAvatar, top, layout.avatarSize, layout.avatarSize, 7, "#ffffff");

          ctx.save();
          roundRectPath(ctx, xAvatar, top, layout.avatarSize, layout.avatarSize, 7);
          ctx.clip();
          drawImageCover(ctx, iconImage, xAvatar, top, layout.avatarSize, layout.avatarSize);
          ctx.restore();

          // アイコン枠線も白で統一する。
          strokeRoundRect(ctx, xAvatar, top, layout.avatarSize, layout.avatarSize, 7, "#ffffff", 3);
          strokeRoundRect(ctx, xAvatar - 1, top - 1, layout.avatarSize + 2, layout.avatarSize + 2, 8, "#ffffff", 1.5);
        } else {
          fillRoundRect(ctx, xAvatar, top, layout.avatarSize, layout.avatarSize, 7, "#9cc7d7");
          strokeRoundRect(ctx, xAvatar, top, layout.avatarSize, layout.avatarSize, 7, "#ffffff", 3);

          ctx.save();
          ctx.font = "700 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 1;
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillText(profile.avatarText || "S", xAvatar + layout.avatarSize / 2, top + layout.avatarSize / 2 + 1);
          ctx.restore();
        }

        const plateText = profile.title || "新任の先生";
        ctx.font = "700 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        const plateWidth = Math.max(126, Math.ceil(ctx.measureText(plateText).width + 22));
        const plateColor = profile.plateClass === "gold" ? "#e7f5fb" : "#3f85bd";
        const plateTextColor = profile.plateClass === "gold" ? "#385066" : "#ffffff";
        fillRoundRect(ctx, xArea, top, plateWidth, 22, 3, plateColor);
        strokeRoundRect(ctx, xArea, top, plateWidth, 22, 3, "#b8cbd7", 1);
        ctx.fillStyle = plateTextColor;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(plateText, xArea + plateWidth / 2, top + 11);
        ctx.textAlign = "left";

        ctx.font = "700 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillStyle = "#28547a";
        ctx.fillText(message.displayName, xArea + plateWidth + 14, top + 11);
        contentY += layout.nameLineHeight + 2;
      }

      const bubbleX = xArea;
      const bubbleY = contentY;
      const bubbleColor = isStudent ? "#ffffff" : "#245986";
      const borderColor = isStudent ? "#d7e0e8" : "#1d4f7c";
      const textColor = isStudent ? "#263f55" : "#ffffff";

      if (row.isStamp) {
        const stampImage = loadedImages.get(message.stampPath);
        fillRoundRect(ctx, bubbleX, bubbleY, row.bubbleWidth, row.bubbleHeight, 4, isStudent ? "#ffffff" : "#f7fbff");
        strokeRoundRect(ctx, bubbleX, bubbleY, row.bubbleWidth, row.bubbleHeight, 4, borderColor, 2);

        if (stampImage) {
          drawImageContain(ctx, stampImage, bubbleX + 4, bubbleY + 4, row.bubbleWidth - 8, row.bubbleHeight - 8);
        } else {
          fillRoundRect(ctx, bubbleX + 4, bubbleY + 4, row.bubbleWidth - 8, row.bubbleHeight - 8, 2, "#eef2f6");
          ctx.font = "700 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillStyle = "#7c8b99";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("画像読込失敗", bubbleX + row.bubbleWidth / 2, bubbleY + row.bubbleHeight / 2);
          ctx.textAlign = "left";
        }
      } else {
        fillRoundRect(ctx, bubbleX, bubbleY, row.bubbleWidth, row.bubbleHeight, 4, bubbleColor);
        strokeRoundRect(ctx, bubbleX, bubbleY, row.bubbleWidth, row.bubbleHeight, 4, borderColor, 1.5);

        ctx.font = "700 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.textBaseline = "alphabetic";
        drawSegmentLines(ctx, row.lines, bubbleX + 10, bubbleY + 25, 25, textColor, "#ff405f");
      }

      y += row.rowHeight;
    });

    openCaptureImageInTab(captureWindow, canvas);

  } catch (error) {
    console.warn("チャット部分のみの画像保存に失敗しました。", error);
    showAppMessage("スクリーンショット", "画像保存に失敗しました。画像やスタンプの読み込み後に、もう一度試してください。");
  } finally {
    renderChatHistory();
  }
}

async function createShareUrl() {
  if (chatHistory.length === 0) {
    shareUrlStatus.textContent = "共有できるチャットがありません。";
    return;
  }

  try {
    const encoded = encodeBase64UrlFromText(JSON.stringify(createSharePayload()));
    const url = new URL(window.location.href);
    url.searchParams.set(shareLogParamName, encoded);
    await copyText(url.toString());
    shareUrlStatus.textContent = `共有URLをコピーしました。（${chatHistory.length}件）`;
    showAppMessage("共有URL", "コピーしました。");
  } catch (error) {
    console.warn("共有URLの作成に失敗しました。", error);
    shareUrlStatus.textContent = "共有URLの作成に失敗しました。";
  }
}

function hiraToKata(text) {
  return text.replace(/[\u3041-\u3096]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) + 0x60);
  });
}

function normalizeText(text) {
  return hiraToKata(
    text.normalize("NFKC").toLowerCase()
  );
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function createProtectedRanges(text) {
  const ranges = [];

  for (const allowWord of allowWords) {
    const normalizedAllowWord = normalizeText(allowWord);

    for (let i = 0; i < text.length; i++) {
      const target = text.slice(i, i + allowWord.length);

      if (normalizeText(target) === normalizedAllowWord) {
        ranges.push({
          start: i,
          end: i + allowWord.length
        });
      }
    }
  }

  return ranges;
}

function isProtected(index, ranges) {
  return ranges.some((range) => {
    return index >= range.start && index < range.end;
  });
}

function detectNgAt(text, index, protectedRanges) {
  const halfKanaMatch = text.slice(index).match(/^[ｦ-ﾟ]+/);

  if (halfKanaMatch) {
    return halfKanaMatch[0];
  }

  if (isProtected(index, protectedRanges)) {
    return "";
  }

  for (const word of ngWords) {
    if (!word) {
      continue;
    }

    const target = text.slice(index, index + word.length);

    if (normalizeText(target) === normalizeText(word)) {
      return target;
    }
  }

  return "";
}

function containsNgWord(text) {
  const protectedRanges = createProtectedRanges(text);

  for (let index = 0; index < text.length; index++) {
    if (detectNgAt(text, index, protectedRanges)) {
      return true;
    }
  }

  return false;
}

function applyCensor(text) {
  const protectedRanges = createProtectedRanges(text);

  let result = "";
  let index = 0;

  while (index < text.length) {
    const target = detectNgAt(text, index, protectedRanges);

    if (target) {
      if (censorMode === "highlight") {
        result += `<span class="ng-word">${escapeHtml(target)}</span>`;
      } else {
        result += "*".repeat(target.length);
      }

      index += target.length;
      continue;
    }

    result += escapeHtml(text[index]);
    index += 1;
  }

  return result;
}

function isKnownSenderId(senderId) {
  return typeof senderProfiles !== "undefined" && Boolean(senderProfiles[senderId]);
}

function getSenderProfile(senderId = "sensei") {
  const customSenseiTitle = senderTitle || "新任の先生";

  if (typeof senderProfiles === "undefined") {
    return {
      name: "先生",
      title: customSenseiTitle,
      plateClass: "gold",
      icon: null,
      avatarText: "S",
      useCustomName: true
    };
  }

  const profile = senderProfiles[senderId] || senderProfiles.sensei;

  if (senderId === "sensei") {
    return {
      ...profile,
      title: customSenseiTitle
    };
  }

  return profile;
}

function getSenderDisplayName(senderId = "sensei", savedName = "") {
  const profile = getSenderProfile(senderId);

  if (profile.useCustomName) {
    return senderName || savedName || profile.name || "先生";
  }

  return profile.name || savedName || "先生";
}

function createNameLine(senderId = "sensei", savedName = "") {
  const profile = getSenderProfile(senderId);
  const displayName = getSenderDisplayName(senderId, savedName);

  const nameLine = document.createElement("div");
  nameLine.className = "name-line";

  const plate = document.createElement("span");
  plate.className = `plate ${profile.plateClass || "gold"}`;
  plate.textContent = profile.title || "新任の先生";

  const name = document.createElement("strong");
  name.textContent = displayName;

  nameLine.appendChild(plate);
  nameLine.appendChild(name);

  return nameLine;
}

function createAvatar(senderId = "sensei") {
  const profile = getSenderProfile(senderId);
  const avatar = document.createElement("div");

  if (profile.icon) {
    avatar.className = "avatar image-avatar";

    const avatarImage = document.createElement("img");
    avatarImage.className = "avatar-image";
    avatarImage.src = profile.icon;
    avatarImage.alt = profile.name || "icon";

    avatar.appendChild(avatarImage);
    return avatar;
  }

  avatar.className = "avatar";
  avatar.textContent = profile.avatarText || "S";

  return avatar;
}

function getMainSenderId() {
  if (mainSenderMode === "student" && isKnownSenderId(mainStudentId) && mainStudentId !== "sensei") {
    return mainStudentId;
  }

  return "sensei";
}

function createChatItem(senderId = "sensei", savedName = "") {
  const displayName = getSenderDisplayName(senderId, savedName);
  const senderKey = `${senderId}:${displayName}`;
  const mainSenderId = getMainSenderId();

  const item = document.createElement("article");
  item.className = "chat-item";
  item.classList.add(`sender-${senderId}`);

  if (senderId !== mainSenderId) {
    item.classList.add("student-message");
  }

  if (compactMode && lastUserMessageSenderName === senderKey) {
    item.classList.add("compact");
  }

  const avatar = createAvatar(senderId);

  const messageArea = document.createElement("div");
  messageArea.className = "message-area";
  messageArea.appendChild(createNameLine(senderId, savedName));

  item.appendChild(avatar);
  item.appendChild(messageArea);

  lastUserMessageSenderName = senderKey;

  return {
    item,
    messageArea,
    displayName
  };
}


function updateCircleNameDisplay() {
  circleNameTitle.textContent = circleName;
}

function saveSettings() {
  if (!storageEnabled) {
    localStorage.removeItem(settingsStorageKey);
    return;
  }

  const settings = {
    version: storageVersion,
    storageEnabled,
    circleName,
    senderName,
    senderTitle,
    mainSenderMode,
    mainStudentId,
    currentSenderId,
    senderSelectorVisible,
    censorMode,
    compactMode,
    deleteMode,
    editMode,
    ngResponseEnabled
  };

  localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
}

function loadSettings() {
  try {
    const rawSettings = localStorage.getItem(settingsStorageKey);

    if (!rawSettings) {
      return;
    }

    const settings = JSON.parse(rawSettings);

    if (settings.version !== storageVersion || settings.storageEnabled !== true) {
      return;
    }

    storageEnabled = true;
    circleName = Object.prototype.hasOwnProperty.call(settings, "circleName") ? String(settings.circleName) : defaultCircleName;
    senderName = settings.senderName || "先生";
    senderTitle = settings.senderTitle || "新任の先生";
    mainSenderMode = settings.mainSenderMode === "student" ? "student" : "sensei";
    mainStudentId = isKnownSenderId(settings.mainStudentId) && settings.mainStudentId !== "sensei" ? settings.mainStudentId : "yuuka";
    currentSenderId = isKnownSenderId(settings.currentSenderId) ? settings.currentSenderId : getMainSenderId();
    senderSelectorVisible = true;
    censorMode = settings.censorMode === "mask" ? "mask" : "highlight";
    compactMode = settings.compactMode !== false;
    deleteMode = false;
    editMode = settings.editMode === true;
    ngResponseEnabled = settings.ngResponseEnabled === true;

    circleNameInput.value = circleName;
    updateCircleNameDisplay();
    senderNameInput.value = senderName;
    mainStudentSelect.value = mainStudentId;
    currentSenderSelect.value = currentSenderId;

    const mainSenderModeRadio = document.querySelector(`input[name="mainSenderMode"][value="${mainSenderMode}"]`);
    if (mainSenderModeRadio) {
      mainSenderModeRadio.checked = true;
    }

    updateMainSenderSettingsDisplay();

    const senderSelectorRadioValue = senderSelectorVisible ? "on" : "off";
    const senderSelectorRadio = document.querySelector(`input[name="senderSelectorMode"][value="${senderSelectorRadioValue}"]`);
    if (senderSelectorRadio) {
      senderSelectorRadio.checked = true;
    }

    updateSenderSelectorDisplay();

    const storageRadio = document.querySelector('input[name="storageMode"][value="on"]');
    if (storageRadio) {
      storageRadio.checked = true;
    }

    const censorRadio = document.querySelector(`input[name="censorMode"][value="${censorMode}"]`);
    if (censorRadio) {
      censorRadio.checked = true;
    }

    const compactRadioValue = compactMode ? "on" : "off";
    const compactRadio = document.querySelector(`input[name="compactMode"][value="${compactRadioValue}"]`);
    if (compactRadio) {
      compactRadio.checked = true;
    }

    const ngResponseRadioValue = ngResponseEnabled ? "on" : "off";
    const ngResponseRadio = document.querySelector(`input[name="ngResponseMode"][value="${ngResponseRadioValue}"]`);
    if (ngResponseRadio) {
      ngResponseRadio.checked = true;
    }


    const editRadioValue = editMode ? "on" : "off";
    const editRadio = document.querySelector(`input[name="editMode"][value="${editRadioValue}"]`);
    if (editRadio) {
      editRadio.checked = true;
    }

    syncSettingToggles();
  } catch (error) {
    console.warn("設定の復元に失敗しました。", error);
  }
}

function updateSenderSelectorDisplay() {
  senderSelectorVisible = true;
  currentSenderSelect.classList.remove("hidden");
  chatForm.classList.add("sender-select-visible");
  currentSenderSelect.value = isKnownSenderId(currentSenderId) ? currentSenderId : getMainSenderId();
}

function updateMainSenderSettingsDisplay() {
  if (senderNameSettingRow) {
    senderNameSettingRow.classList.remove("hidden");
  }

  if (senderTitleSettingRow) {
    senderTitleSettingRow.classList.remove("hidden");
  }

  if (mainStudentSettingRow) {
    mainStudentSettingRow.classList.remove("hidden");
  }

  senderNameInput.disabled = false;
  if (senderTitleInput) {
    senderTitleInput.disabled = false;
  }
  mainStudentSelect.disabled = false;
  mainStudentSelect.value = getMainSenderId();
}

function updateDeleteModeDisplay() {
  chatLog.classList.toggle("delete-mode", deleteMode);
  chatLog.classList.toggle("edit-mode", editMode);
}

function renderChatHistory() {
  isRestoringChat = true;
  chatLog.innerHTML = "";
  lastUserMessageSenderName = "";

  chatHistory.forEach((message, index) => {
    if (message.type === "text") {
      addMessage(message.text || "", message.senderId || "sensei", message.name || "", index);
    } else if (message.type === "stamp") {
      addImageStampMessage(message.imagePath || "", message.senderId || "sensei", message.name || "", index);
    } else if (message.type === "systemWarning") {
      addSystemWarningStampMessage(message.senderId || "yuuka", index);
    } else if (message.type === "shirokoReply") {
      addShirokoReplyStampMessage(message.senderId || "shiroko", index);
    }
  });

  isRestoringChat = false;
  updateDeleteModeDisplay();
}

function saveChatHistory() {
  if (!storageEnabled) {
    return;
  }

  const saveData = {
    version: storageVersion,
    messages: chatHistory
  };

  localStorage.setItem(chatStorageKey, JSON.stringify(saveData));
}

function pushChatHistory(message) {
  if (isRestoringChat) {
    return;
  }

  chatHistory.push(message);
  saveChatHistory();
}

function restoreChatHistory() {
  if (!storageEnabled) {
    return;
  }

  try {
    const rawChat = localStorage.getItem(chatStorageKey);

    if (!rawChat) {
      return;
    }

    const saveData = JSON.parse(rawChat);

    if (saveData.version !== storageVersion || !Array.isArray(saveData.messages)) {
      return;
    }

    chatHistory = saveData.messages;
    renderChatHistory();
  } catch (error) {
    console.warn("チャット履歴の復元に失敗しました。", error);
  } finally {
    isRestoringChat = false;
  }
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatLog.scrollTop = chatLog.scrollHeight;
  });
}


function createMessageEditControls(editIndex, messageType = "text") {
  const controls = document.createElement("div");
  controls.className = "message-edit-controls";

  const editButton = document.createElement("button");
  editButton.className = "message-edit-button";
  editButton.type = "button";
  editButton.textContent = messageType === "text" ? "編集" : "スタンプ変更";
  editButton.dataset.index = String(editIndex);
  editButton.dataset.action = messageType === "text" ? "editText" : "editStamp";
  controls.appendChild(editButton);

  const insertTextButton = document.createElement("button");
  insertTextButton.className = "message-insert-button";
  insertTextButton.type = "button";
  insertTextButton.textContent = "下にテキスト追加";
  insertTextButton.dataset.index = String(editIndex);
  insertTextButton.dataset.action = "insertTextBelow";
  controls.appendChild(insertTextButton);

  const insertStampButton = document.createElement("button");
  insertStampButton.className = "message-insert-button";
  insertStampButton.type = "button";
  insertStampButton.textContent = "下にスタンプ追加";
  insertStampButton.dataset.index = String(editIndex);
  insertStampButton.dataset.action = "insertStampBelow";
  controls.appendChild(insertStampButton);

  const deleteButton = document.createElement("button");
  deleteButton.className = "message-delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "削除";
  deleteButton.dataset.index = String(editIndex);
  deleteButton.dataset.action = "deleteMessage";
  controls.appendChild(deleteButton);

  return controls;
}

function addMessage(text, senderId = currentSenderId, savedName = "", editIndex = -1) {
  const nameForHistory = getSenderProfile(senderId).useCustomName ? (savedName || senderName) : "";
  const { item, messageArea } = createChatItem(senderId, nameForHistory);

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = applyCensor(text);

  messageArea.appendChild(bubble);

  if (editMode && editIndex >= 0) {
    messageArea.appendChild(createMessageEditControls(editIndex, "text"));
  }

  chatLog.appendChild(item);

  scrollToBottom();

  pushChatHistory({
    type: "text",
    senderId,
    name: nameForHistory,
    text
  });
}

function addImageStampMessage(imagePath, senderId = currentSenderId, savedName = "", editIndex = -1) {
  const nameForHistory = getSenderProfile(senderId).useCustomName ? (savedName || senderName) : "";
  const { item, messageArea } = createChatItem(senderId, nameForHistory);

  const bubble = document.createElement("div");
  bubble.className = "bubble stamp-bubble";

  const image = document.createElement("img");
  image.className = "chat-stamp-image";
  image.src = imagePath;
  image.alt = "stamp";

  bubble.appendChild(image);
  messageArea.appendChild(bubble);

  if (editMode && editIndex >= 0) {
    messageArea.appendChild(createMessageEditControls(editIndex, "stamp"));
  }

  chatLog.appendChild(item);

  scrollToBottom();

  pushChatHistory({
    type: "stamp",
    senderId,
    name: nameForHistory,
    imagePath
  });
}

function addSystemWarningStampMessage(senderId = "yuuka", editIndex = -1) {
  const { item, messageArea } = createChatItem(senderId, "");
  item.classList.add("system-warning-item");

  /*
    NG警告スタンプは bubble / stamp-bubble を使わない。
    完全に専用カード warning-stamp-card だけで描画する。
  */
  const warningStampCard = document.createElement("div");
  warningStampCard.className = "warning-stamp-card";

  const image = document.createElement("img");
  image.className = "warning-stamp-image";
  image.src = "assets/stamps/01/11.png";
  image.alt = "warning";

  warningStampCard.appendChild(image);
  messageArea.appendChild(warningStampCard);

  if (editMode && editIndex >= 0) {
    messageArea.appendChild(createMessageEditControls(editIndex, "stamp"));
  }

  chatLog.appendChild(item);

  scrollToBottom();

  pushChatHistory({
    type: "systemWarning",
    senderId
  });
}


function addShirokoReplyStampMessage(senderId = "shiroko", editIndex = -1) {
  const { item, messageArea } = createChatItem(senderId, "");
  item.classList.add("shiroko-reply-item");

  const bubble = document.createElement("div");
  bubble.className = "bubble stamp-bubble system-reply-stamp-bubble";

  const image = document.createElement("img");
  image.className = "chat-stamp-image";
  image.src = "assets/stamps/03/26.png";
  image.alt = "stamp";

  bubble.appendChild(image);
  messageArea.appendChild(bubble);

  if (editMode && editIndex >= 0) {
    messageArea.appendChild(createMessageEditControls(editIndex, "stamp"));
  }

  chatLog.appendChild(item);

  scrollToBottom();

  pushChatHistory({
    type: "shirokoReply",
    senderId
  });
}


function showChatView() {
  chatTab.classList.add("active");
  settingTab.classList.remove("active");

  chatView.classList.remove("hidden");
  settingView.classList.add("hidden");

  chatView.style.display = "flex";
  settingView.style.display = "none";
}

function showSettingView() {
  settingTab.classList.add("active");
  chatTab.classList.remove("active");

  settingView.classList.remove("hidden");
  chatView.classList.add("hidden");

  settingView.style.display = "block";
  chatView.style.display = "none";
}

chatTab.addEventListener("click", showChatView);
settingTab.addEventListener("click", showSettingView);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();

  if (!text) {
    return;
  }

  const hasNgWord = containsNgWord(text);

  addMessage(text);

  if (hasNgWord && ngResponseEnabled) {
    addSystemWarningStampMessage();
  }

  messageInput.value = "";
  resizeMessageInput();
  messageInput.focus();
});

messageInput.addEventListener("input", resizeMessageInput);

messageInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  // 日本語入力の変換確定中のEnterでは送信しない
  if (event.isComposing || event.keyCode === 229) {
    return;
  }

  // Shift + Enter は改行として残す
  if (event.shiftKey) {
    return;
  }

  event.preventDefault();
  chatForm.requestSubmit();
});

circleNameInput.addEventListener("input", () => {
  circleName = circleNameInput.value;
  updateCircleNameDisplay();
  saveSettings();
});

senderNameInput.addEventListener("input", () => {
  senderName = senderNameInput.value.trim() || "先生";
  renderChatHistory();
  saveSettings();
});

if (senderTitleInput) {
  senderTitleInput.addEventListener("input", () => {
    senderTitle = senderTitleInput.value.trim() || "新任の先生";
    renderChatHistory();
    saveSettings();
  });
}

mainStudentSelect.addEventListener("change", () => {
  const selectedMainSenderId = isKnownSenderId(mainStudentSelect.value) ? mainStudentSelect.value : "sensei";

  if (selectedMainSenderId === "sensei") {
    mainSenderMode = "sensei";
  } else {
    mainSenderMode = "student";
    mainStudentId = selectedMainSenderId;
  }

  mainStudentSelect.value = getMainSenderId();
  updateMainSenderSettingsDisplay();
  renderChatHistory();
  saveSettings();
});

currentSenderSelect.addEventListener("change", () => {
  currentSenderId = isKnownSenderId(currentSenderSelect.value) ? currentSenderSelect.value : "sensei";
  saveSettings();
});


if (senderSelectorToggle) {
  senderSelectorToggle.addEventListener("change", () => {
    senderSelectorVisible = senderSelectorToggle.checked;
    setRadioChecked("senderSelectorMode", senderSelectorVisible ? "on" : "off");
    updateSenderSelectorDisplay();
    syncSettingToggles();
    saveSettings();
  });
}

if (ngResponseToggle) {
  ngResponseToggle.addEventListener("change", () => {
    ngResponseEnabled = ngResponseToggle.checked;
    setRadioChecked("ngResponseMode", ngResponseEnabled ? "on" : "off");
    saveSettings();
  });
}

if (editModeToggle) {
  editModeToggle.addEventListener("change", () => {
    editMode = editModeToggle.checked;
    setRadioChecked("editMode", editMode ? "on" : "off");
    renderChatHistory();
    saveSettings();
  });
}

if (storageModeToggle) {
  storageModeToggle.addEventListener("change", () => {
    storageEnabled = storageModeToggle.checked;
    setRadioChecked("storageMode", storageEnabled ? "on" : "off");

    if (storageEnabled) {
      saveSettings();
      saveChatHistory();
    } else {
      localStorage.removeItem(settingsStorageKey);
      localStorage.removeItem(chatStorageKey);
    }
  });
}

document.querySelectorAll('input[name="senderSelectorMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    senderSelectorVisible = radio.value === "on";
    updateSenderSelectorDisplay();
    saveSettings();
  });
});

document.querySelectorAll('input[name="storageMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    storageEnabled = radio.value === "on";
    syncSettingToggles();

    if (storageEnabled) {
      saveSettings();
      saveChatHistory();
    } else {
      localStorage.removeItem(settingsStorageKey);
      localStorage.removeItem(chatStorageKey);
    }
  });
});

document.querySelectorAll('input[name="censorMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    censorMode = radio.value === "mask" ? "mask" : "highlight";
    renderChatHistory();
    saveSettings();
  });
});

document.querySelectorAll('input[name="compactMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    compactMode = radio.value === "on";
    renderChatHistory();
    saveSettings();
  });
});

document.querySelectorAll('input[name="ngResponseMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    ngResponseEnabled = radio.value === "on";
    syncSettingToggles();
    saveSettings();
  });
});


document.querySelectorAll('input[name="editMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    editMode = radio.value === "on";
    syncSettingToggles();
    renderChatHistory();
    saveSettings();
  });
});

chatLog.addEventListener("click", (event) => {
  const actionButton = event.target.closest(".message-edit-button, .message-insert-button, .message-delete-button");

  if (actionButton && chatLog.contains(actionButton)) {
    event.stopPropagation();

    const index = Number(actionButton.dataset.index);
    const action = actionButton.dataset.action;
    const message = chatHistory[index];

    if (!message) {
      return;
    }

    if (action === "editText") {
      if (message.type !== "text") {
        return;
      }

      const editedText = window.prompt("メッセージを編集", message.text || "");

      if (editedText === null) {
        return;
      }

      message.text = editedText;
      saveChatHistory();
      renderChatHistory();
      return;
    }

    if (action === "editStamp") {
      editingStampIndex = index;
      insertingStampAfterIndex = -1;
      stampModal.classList.add("stamp-editing");
      stampModal.classList.remove("hidden");
      return;
    }

    if (action === "insertTextBelow") {
      const insertedText = window.prompt("下に追加するメッセージを入力", "");

      if (insertedText === null) {
        return;
      }

      chatHistory.splice(index + 1, 0, {
        type: "text",
        senderId: currentSenderId,
        name: getSenderProfile(currentSenderId).useCustomName ? senderName : "",
        text: insertedText
      });
      saveChatHistory();
      renderChatHistory();
      return;
    }

    if (action === "insertStampBelow") {
      insertingStampAfterIndex = index;
      editingStampIndex = -1;
      stampModal.classList.remove("stamp-editing");
      stampModal.classList.remove("hidden");
      return;
    }

    if (action === "deleteMessage") {
      const shouldDelete = window.confirm("このメッセージを削除しますか？");

      if (!shouldDelete) {
        return;
      }

      chatHistory.splice(index, 1);
      saveChatHistory();
      renderChatHistory();
      return;
    }
  }
});

clearChatButton.addEventListener("click", () => {
  showAppConfirm("チャットをクリア", "チャットをすべて削除しますか？", () => {
    chatLog.innerHTML = "";
    lastUserMessageSenderName = "";
    chatHistory = [];
    localStorage.removeItem(chatStorageKey);
    updateDeleteModeDisplay();

    if (shareUrlStatus) {
      shareUrlStatus.textContent = "";
    }
  });
});

createShareUrlButton.addEventListener("click", createShareUrl);

if (captureChatButton) {
  captureChatButton.addEventListener("click", captureChatImage);
}

if (closeAppMessageButton) {
  closeAppMessageButton.addEventListener("click", closeAppMessage);
}

if (okAppMessageButton) {
  okAppMessageButton.addEventListener("click", closeAppMessage);
}

if (appMessageModal) {
  appMessageModal.addEventListener("click", (event) => {
    if (event.target === appMessageModal) {
      closeAppMessage();
    }
  });
}

if (closeAppConfirmButton) {
  closeAppConfirmButton.addEventListener("click", closeAppConfirm);
}

if (cancelAppConfirmButton) {
  cancelAppConfirmButton.addEventListener("click", closeAppConfirm);
}

if (okAppConfirmButton) {
  okAppConfirmButton.addEventListener("click", runAppConfirmOk);
}

if (appConfirmModal) {
  appConfirmModal.addEventListener("click", (event) => {
    if (event.target === appConfirmModal) {
      closeAppConfirm();
    }
  });
}

function createStampImagePath(folder, number) {
  const fileName = String(number).padStart(2, "0");
  return `${stampBasePath}/${folder}/${fileName}.png`;
}

function createStampList() {
  stampGrid.innerHTML = "";

  for (const category of stampCategories) {
    for (let i = 1; i <= category.count; i++) {
      const imagePath = createStampImagePath(category.folder, i);

      const button = document.createElement("button");
      button.className = "stamp-item";
      button.type = "button";

      const image = document.createElement("img");
      image.className = "stamp-image";
      image.src = imagePath;
      image.alt = `${category.folder}/${String(i).padStart(2, "0")}`;

      button.appendChild(image);

      button.addEventListener("click", () => {
        if (editingStampIndex >= 0 && chatHistory[editingStampIndex]) {
          const message = chatHistory[editingStampIndex];
          const senderId = message.senderId || currentSenderId;
          const name = message.name || "";

          chatHistory[editingStampIndex] = {
            type: "stamp",
            senderId,
            name,
            imagePath
          };

          editingStampIndex = -1;
          insertingStampAfterIndex = -1;
          stampModal.classList.remove("stamp-editing");
          stampModal.classList.add("hidden");
          saveChatHistory();
          renderChatHistory();
          return;
        }

        if (insertingStampAfterIndex >= 0) {
          chatHistory.splice(insertingStampAfterIndex + 1, 0, {
            type: "stamp",
            senderId: currentSenderId,
            name: getSenderProfile(currentSenderId).useCustomName ? senderName : "",
            imagePath
          });

          insertingStampAfterIndex = -1;
          stampModal.classList.add("hidden");
          saveChatHistory();
          renderChatHistory();
          return;
        }

        addImageStampMessage(imagePath);

        if (imagePath === "assets/stamps/01/18.png" && ngResponseEnabled) {
          addShirokoReplyStampMessage();
        }

        stampModal.classList.add("hidden");
      });

      stampGrid.appendChild(button);
    }
  }
}

function renderWordList(container, words) {
  container.innerHTML = "";

  for (const word of words) {
    const item = document.createElement("div");
    item.className = "word-list-item";
    item.textContent = word;

    container.appendChild(item);
  }
}

faceButton.addEventListener("click", () => {
  editingStampIndex = -1;
  insertingStampAfterIndex = -1;
  stampModal.classList.remove("stamp-editing");
  stampModal.classList.remove("hidden");
});

closeStampButton.addEventListener("click", () => {
  editingStampIndex = -1;
  stampModal.classList.remove("stamp-editing");
  stampModal.classList.add("hidden");
});

stampModal.addEventListener("click", (event) => {
  if (event.target === stampModal) {
    editingStampIndex = -1;
    stampModal.classList.remove("stamp-editing");
    stampModal.classList.add("hidden");
  }
});

function openNgWordListModal() {
  renderWordList(ngWordList, ngWords);
  ngWordModal.classList.remove("hidden");
}

function closeNgWordConfirmModal() {
  ngWordConfirmModal.classList.add("hidden");
}

openNgWordModalButton.addEventListener("click", () => {
  ngWordConfirmModal.classList.remove("hidden");
});

closeNgWordConfirmButton.addEventListener("click", closeNgWordConfirmModal);

cancelNgWordConfirmButton.addEventListener("click", closeNgWordConfirmModal);

showNgWordConfirmButton.addEventListener("click", () => {
  closeNgWordConfirmModal();
  openNgWordListModal();
});

ngWordConfirmModal.addEventListener("click", (event) => {
  if (event.target === ngWordConfirmModal) {
    closeNgWordConfirmModal();
  }
});

closeNgWordModalButton.addEventListener("click", () => {
  ngWordModal.classList.add("hidden");
});

ngWordModal.addEventListener("click", (event) => {
  if (event.target === ngWordModal) {
    ngWordModal.classList.add("hidden");
  }
});

openAllowWordModalButton.addEventListener("click", () => {
  renderWordList(allowWordList, allowWords);
  allowWordModal.classList.remove("hidden");
});

closeAllowWordModalButton.addEventListener("click", () => {
  allowWordModal.classList.add("hidden");
});

allowWordModal.addEventListener("click", (event) => {
  if (event.target === allowWordModal) {
    allowWordModal.classList.add("hidden");
  }
});

openSiteInfoButton.addEventListener("click", () => {
  siteInfoModal.classList.remove("hidden");
});

closeSiteInfoButton.addEventListener("click", () => {
  siteInfoModal.classList.add("hidden");
});

siteInfoModal.addEventListener("click", (event) => {
  if (event.target === siteInfoModal) {
    siteInfoModal.classList.add("hidden");
  }
});

const sharedPayload = getSharedPayloadFromUrl();

loadSettings();
createStampList();

if (sharedPayload) {
  isLoadingSharedLog = true;
  applySharedSettings(sharedPayload.settings || {});
  chatHistory = sharedPayload.messages;
  renderChatHistory();
  isLoadingSharedLog = false;

  if (shareUrlStatus) {
    shareUrlStatus.textContent = "共有URLのチャットを読み込みました。";
  }
} else {
  restoreChatHistory();
}

updateMainSenderSettingsDisplay();
updateSenderSelectorDisplay();
updateDeleteModeDisplay();
showChatView();
