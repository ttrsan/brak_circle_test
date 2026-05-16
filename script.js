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

const openSiteInfoButton = document.getElementById("openSiteInfoButton");
const siteInfoModal = document.getElementById("siteInfoModal");
const closeSiteInfoButton = document.getElementById("closeSiteInfoButton");

const defaultCircleName = "テストサークル";
let circleName = defaultCircleName;
let senderName = "先生";
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
  if (senderSelectorToggle) {
    senderSelectorToggle.checked = senderSelectorVisible;
  }
  if (ngResponseToggle) {
    ngResponseToggle.checked = ngResponseEnabled;
  }
  if (editModeToggle) {
    editModeToggle.checked = editMode;
  }
  if (storageModeToggle) {
    storageModeToggle.checked = storageEnabled;
  }

  setRadioChecked("senderSelectorMode", senderSelectorVisible ? "on" : "off");
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
let senderSelectorVisible = false;
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
  mainSenderMode = settings.mainSenderMode === "student" ? "student" : "sensei";
  mainStudentId = isKnownSenderId(settings.mainStudentId) && settings.mainStudentId !== "sensei" ? settings.mainStudentId : "yuuka";
  senderSelectorVisible = settings.senderSelectorVisible === true;
  censorMode = settings.censorMode === "mask" ? "mask" : "highlight";
  compactMode = settings.compactMode !== false;
  ngResponseEnabled = settings.ngResponseEnabled === true;
  currentSenderId = isKnownSenderId(settings.currentSenderId) ? settings.currentSenderId : getMainSenderId();

  circleNameInput.value = circleName;
  senderNameInput.value = senderName;
  mainStudentSelect.value = mainStudentId;
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
    window.alert("コピーしました。");
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
  if (typeof senderProfiles === "undefined") {
    return {
      name: "先生",
      title: "新任の先生",
      plateClass: "gold",
      icon: null,
      avatarText: "S",
      useCustomName: true
    };
  }

  return senderProfiles[senderId] || senderProfiles.sensei;
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
    mainSenderMode = settings.mainSenderMode === "student" ? "student" : "sensei";
    mainStudentId = isKnownSenderId(settings.mainStudentId) && settings.mainStudentId !== "sensei" ? settings.mainStudentId : "yuuka";
    currentSenderId = isKnownSenderId(settings.currentSenderId) ? settings.currentSenderId : getMainSenderId();
    senderSelectorVisible = settings.senderSelectorVisible === true;
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
  currentSenderSelect.classList.toggle("hidden", !senderSelectorVisible);
  chatForm.classList.toggle("sender-select-visible", senderSelectorVisible);

  if (!senderSelectorVisible) {
    currentSenderId = getMainSenderId();
    currentSenderSelect.value = currentSenderId;
  }
}

function updateMainSenderSettingsDisplay() {
  const isSenseiMode = mainSenderMode !== "student";

  if (senderNameSettingRow) {
    senderNameSettingRow.classList.toggle("hidden", !isSenseiMode);
  }

  if (mainStudentSettingRow) {
    mainStudentSettingRow.classList.toggle("hidden", isSenseiMode);
  }

  senderNameInput.disabled = !isSenseiMode;
  mainStudentSelect.disabled = isSenseiMode;

  if (!senderSelectorVisible) {
    currentSenderId = getMainSenderId();
    currentSenderSelect.value = currentSenderId;
  }
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

document.querySelectorAll('input[name="mainSenderMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    mainSenderMode = radio.value === "student" ? "student" : "sensei";
    updateMainSenderSettingsDisplay();
    renderChatHistory();
    saveSettings();
  });
});

mainStudentSelect.addEventListener("change", () => {
  mainStudentId = isKnownSenderId(mainStudentSelect.value) && mainStudentSelect.value !== "sensei" ? mainStudentSelect.value : "yuuka";
  mainStudentSelect.value = mainStudentId;
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
  const shouldClear = window.confirm("チャットをすべて削除しますか？");

  if (!shouldClear) {
    return;
  }

  chatLog.innerHTML = "";
  lastUserMessageSenderName = "";
  chatHistory = [];
  localStorage.removeItem(chatStorageKey);
  updateDeleteModeDisplay();

  if (shareUrlStatus) {
    shareUrlStatus.textContent = "";
  }
});

createShareUrlButton.addEventListener("click", createShareUrl);

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
