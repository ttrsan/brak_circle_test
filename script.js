const stampBasePath = "assets/stamps";

const stampCategories = [
  { folder: "01", count: 20 },
  { folder: "02", count: 20 },
  { folder: "03", count: 32 }
];

const chatTab = document.getElementById("chatTab");
const settingTab = document.getElementById("settingTab");
const chatView = document.getElementById("chatView");
const settingView = document.getElementById("settingView");

const chatLog = document.getElementById("chatLog");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const faceButton = document.querySelector(".face-button");

const senderNameInput = document.getElementById("senderNameInput");
const clearChatButton = document.getElementById("clearChatButton");

const stampModal = document.getElementById("stampModal");
const closeStampButton = document.getElementById("closeStampButton");
const stampGrid = document.getElementById("stampGrid");

const openNgWordModalButton = document.getElementById("openNgWordModalButton");
const ngWordModal = document.getElementById("ngWordModal");
const closeNgWordModalButton = document.getElementById("closeNgWordModalButton");
const ngWordList = document.getElementById("ngWordList");

const openAllowWordModalButton = document.getElementById("openAllowWordModalButton");
const allowWordModal = document.getElementById("allowWordModal");
const closeAllowWordModalButton = document.getElementById("closeAllowWordModalButton");
const allowWordList = document.getElementById("allowWordList");

const openSiteInfoButton = document.getElementById("openSiteInfoButton");
const siteInfoModal = document.getElementById("siteInfoModal");
const closeSiteInfoButton = document.getElementById("closeSiteInfoButton");

let senderName = "先生";
let censorMode = "highlight";
let lastUserMessageSenderName = "";

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

function createNameLine() {
  const nameLine = document.createElement("div");
  nameLine.className = "name-line";

  const plate = document.createElement("span");
  plate.className = "plate gold";
  plate.textContent = "新任の先生";

  const name = document.createElement("strong");
  name.textContent = senderName;

  nameLine.appendChild(plate);
  nameLine.appendChild(name);

  return nameLine;
}

function createChatItem() {
  const item = document.createElement("article");
  item.className = "chat-item";

  if (lastUserMessageSenderName === senderName) {
    item.classList.add("compact");
  }

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "S";

  const messageArea = document.createElement("div");
  messageArea.className = "message-area";
  messageArea.appendChild(createNameLine());

  item.appendChild(avatar);
  item.appendChild(messageArea);

  lastUserMessageSenderName = senderName;

  return {
    item,
    messageArea
  };
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatLog.scrollTop = chatLog.scrollHeight;
  });
}

function addMessage(text) {
  const { item, messageArea } = createChatItem();

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = applyCensor(text);

  messageArea.appendChild(bubble);
  chatLog.appendChild(item);

  scrollToBottom();
}

function addImageStampMessage(imagePath) {
  const { item, messageArea } = createChatItem();

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
}

function addSystemWarningStampMessage() {
  lastUserMessageSenderName = "__system__";

  const item = document.createElement("article");
  item.className = "chat-item system-warning-item";

  const avatar = document.createElement("div");
  avatar.className = "avatar system-avatar";
  avatar.textContent = "Y";

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
}


function addShirokoReplyStampMessage() {
  lastUserMessageSenderName = "__shiroko__";

  const item = document.createElement("article");
  item.className = "chat-item shiroko-reply-item";

  const avatar = document.createElement("div");
  avatar.className = "avatar image-avatar shiroko-avatar";

  const avatarImage = document.createElement("img");
  avatarImage.className = "avatar-image";
  avatarImage.src = "assets/icons/shiroko.png";
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

  if (hasNgWord) {
    addSystemWarningStampMessage();
  }

  messageInput.value = "";
  messageInput.focus();
});

senderNameInput.addEventListener("input", () => {
  senderName = senderNameInput.value.trim() || "先生";
});

document.querySelectorAll('input[name="censorMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    censorMode = radio.value;
  });
});

clearChatButton.addEventListener("click", () => {
  chatLog.innerHTML = "";
  lastUserMessageSenderName = "";
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

        if (imagePath === "assets/stamps/01/18.png") {
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

openNgWordModalButton.addEventListener("click", () => {
  renderWordList(ngWordList, ngWords);
  ngWordModal.classList.remove("hidden");
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

createStampList();
showChatView();
