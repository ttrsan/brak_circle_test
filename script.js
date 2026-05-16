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
const mainStudentSelect = document.getElementById("mainStudentSelect");
const clearChatButton = document.getElementById("clearChatButton");

const stampModal = document.getElementById("stampModal");
const closeStampButton = document.getElementById("closeStampButton");
const stampGrid = document.getElementById("stampGrid");

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
let ngResponseEnabled = false;
let storageEnabled = false;

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
    return savedName || senderName || profile.name || "先生";
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
    deleteMode = settings.deleteMode === true;
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

    const deleteRadioValue = deleteMode ? "on" : "off";
    const deleteRadio = document.querySelector(`input[name="deleteMode"][value="${deleteRadioValue}"]`);
    if (deleteRadio) {
      deleteRadio.checked = true;
    }
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

  senderNameInput.disabled = !isSenseiMode;
  senderNameInput.classList.toggle("setting-input-disabled", !isSenseiMode);

  mainStudentSelect.disabled = isSenseiMode;
  mainStudentSelect.classList.toggle("setting-input-disabled", isSenseiMode);

  if (!senderSelectorVisible) {
    currentSenderId = getMainSenderId();
    currentSenderSelect.value = currentSenderId;
  }
}

function updateDeleteModeDisplay() {
  chatLog.classList.toggle("delete-mode", deleteMode);
}

function renderChatHistory() {
  isRestoringChat = true;
  chatLog.innerHTML = "";
  lastUserMessageSenderName = "";

  for (const message of chatHistory) {
    if (message.type === "text") {
      addMessage(message.text || "", message.senderId || "sensei", message.name || "");
    } else if (message.type === "stamp") {
      addImageStampMessage(message.imagePath || "", message.senderId || "sensei", message.name || "");
    } else if (message.type === "systemWarning") {
      addSystemWarningStampMessage();
    } else if (message.type === "shirokoReply") {
      addShirokoReplyStampMessage();
    }
  }

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

function addMessage(text, senderId = currentSenderId, savedName = "") {
  const nameForHistory = getSenderProfile(senderId).useCustomName ? (savedName || senderName) : "";
  const { item, messageArea } = createChatItem(senderId, nameForHistory);

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = applyCensor(text);

  messageArea.appendChild(bubble);
  chatLog.appendChild(item);

  scrollToBottom();

  pushChatHistory({
    type: "text",
    senderId,
    name: nameForHistory,
    text
  });
}

function addImageStampMessage(imagePath, senderId = currentSenderId, savedName = "") {
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

  chatLog.appendChild(item);

  scrollToBottom();

  pushChatHistory({
    type: "stamp",
    senderId,
    name: nameForHistory,
    imagePath
  });
}

function addSystemWarningStampMessage() {
  lastUserMessageSenderName = "__system__";

  const item = document.createElement("article");
  item.className = "chat-item system-warning-item";

  const avatar = document.createElement("div");
  avatar.className = "avatar image-avatar yuuka-avatar";

  const avatarImage = document.createElement("img");
  avatarImage.className = "avatar-image";
  avatarImage.src = getSenderProfile("yuuka").icon || "assets/icons/seminar/yuuka.png";
  avatarImage.alt = "ユウカ";

  avatar.appendChild(avatarImage);

  const messageArea = document.createElement("div");
  messageArea.className = "message-area";

  const nameLine = document.createElement("div");
  nameLine.className = "name-line";

  const plate = document.createElement("span");
  plate.className = "plate blue";
  plate.textContent = "セミナー";

  const name = document.createElement("strong");
  name.textContent = "ユウカ";

  nameLine.appendChild(plate);
  nameLine.appendChild(name);

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

  messageArea.appendChild(nameLine);
  messageArea.appendChild(warningStampCard);

  item.appendChild(avatar);
  item.appendChild(messageArea);

  chatLog.appendChild(item);

  scrollToBottom();

  pushChatHistory({
    type: "systemWarning"
  });
}


function addShirokoReplyStampMessage() {
  lastUserMessageSenderName = "__shiroko__";

  const item = document.createElement("article");
  item.className = "chat-item shiroko-reply-item";

  const avatar = document.createElement("div");
  avatar.className = "avatar image-avatar shiroko-avatar";

  const avatarImage = document.createElement("img");
  avatarImage.className = "avatar-image";
  avatarImage.src = getSenderProfile("shiroko").icon || "assets/icons/abydos/shiroko.png";
  avatarImage.alt = "シロコ";

  avatar.appendChild(avatarImage);

  const messageArea = document.createElement("div");
  messageArea.className = "message-area";

  const nameLine = document.createElement("div");
  nameLine.className = "name-line";

  const plate = document.createElement("span");
  plate.className = "plate blue";
  plate.textContent = "対策委員会";

  const name = document.createElement("strong");
  name.textContent = "シロコ";

  nameLine.appendChild(plate);
  nameLine.appendChild(name);

  const bubble = document.createElement("div");
  bubble.className = "bubble stamp-bubble system-reply-stamp-bubble";

  const image = document.createElement("img");
  image.className = "chat-stamp-image";
  image.src = "assets/stamps/03/26.png";
  image.alt = "stamp";

  bubble.appendChild(image);

  messageArea.appendChild(nameLine);
  messageArea.appendChild(bubble);

  item.appendChild(avatar);
  item.appendChild(messageArea);

  chatLog.appendChild(item);

  scrollToBottom();

  pushChatHistory({
    type: "shirokoReply"
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
  saveSettings();
});

document.querySelectorAll('input[name="mainSenderMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    mainSenderMode = radio.value === "student" ? "student" : "sensei";
    updateMainSenderSettingsDisplay();
    saveSettings();
  });
});

mainStudentSelect.addEventListener("change", () => {
  mainStudentId = isKnownSenderId(mainStudentSelect.value) && mainStudentSelect.value !== "sensei" ? mainStudentSelect.value : "yuuka";
  mainStudentSelect.value = mainStudentId;
  updateMainSenderSettingsDisplay();
  saveSettings();
});

currentSenderSelect.addEventListener("change", () => {
  currentSenderId = isKnownSenderId(currentSenderSelect.value) ? currentSenderSelect.value : "sensei";
  saveSettings();
});

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
    censorMode = radio.value;
    saveSettings();
  });
});

document.querySelectorAll('input[name="compactMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    compactMode = radio.value === "on";
    saveSettings();
  });
});

document.querySelectorAll('input[name="ngResponseMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    ngResponseEnabled = radio.value === "on";
    saveSettings();
  });
});

document.querySelectorAll('input[name="deleteMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    deleteMode = radio.value === "on";
    updateDeleteModeDisplay();
    saveSettings();
  });
});

chatLog.addEventListener("click", (event) => {
  if (!deleteMode) {
    return;
  }

  const item = event.target.closest(".chat-item");

  if (!item || !chatLog.contains(item)) {
    return;
  }

  const items = Array.from(chatLog.querySelectorAll(".chat-item"));
  const index = items.indexOf(item);

  if (index < 0) {
    return;
  }

  chatHistory.splice(index, 1);
  renderChatHistory();
  saveChatHistory();
});

clearChatButton.addEventListener("click", () => {
  chatLog.innerHTML = "";
  lastUserMessageSenderName = "";
  chatHistory = [];
  localStorage.removeItem(chatStorageKey);
  updateDeleteModeDisplay();
});

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
  stampModal.classList.remove("hidden");
});

closeStampButton.addEventListener("click", () => {
  stampModal.classList.add("hidden");
});

stampModal.addEventListener("click", (event) => {
  if (event.target === stampModal) {
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

loadSettings();
createStampList();
restoreChatHistory();
updateMainSenderSettingsDisplay();
updateSenderSelectorDisplay();
updateDeleteModeDisplay();
showChatView();
