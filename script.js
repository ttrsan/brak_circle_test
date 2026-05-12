const ngWords = [
  "かす",
  "カス",
  "あほ",
  "アホ",
  "にーと",
  "ニート",
  "大好き",
  "神すぎる"
];

const stampBasePath = "assets/stamps";
const stampCategories = [
  { folder: "01", count: 20 },
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
const applySettingButton = document.getElementById("applySettingButton");
const clearChatButton = document.getElementById("clearChatButton");

const stampModal = document.getElementById("stampModal");
const closeStampButton = document.getElementById("closeStampButton");
const stampGrid = document.getElementById("stampGrid");

const openNgWordModalButton = document.getElementById("openNgWordModalButton");
const ngWordModal = document.getElementById("ngWordModal");
const closeNgWordModalButton = document.getElementById("closeNgWordModalButton");
const ngWordList = document.getElementById("ngWordList");

let senderName = "先生";
let censorMode = "highlight";

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyCensor(text) {
  let safeText = escapeHtml(text);

  for (const word of ngWords) {
    if (!word) continue;

    const safeWord = escapeHtml(word);
    const pattern = new RegExp(escapeRegExp(safeWord), "g");

    if (censorMode === "highlight") {
      safeText = safeText.replace(pattern, `<span class="ng-word">${safeWord}</span>`);
    } else if (censorMode === "mask") {
      safeText = safeText.replace(pattern, "*".repeat(word.length));
    }
  }

  return safeText;
}

function createNameLine() {
  const nameLine = document.createElement("div");
  nameLine.className = "name-line";

  const plate = document.createElement("span");
  plate.className = "plate gold";
  plate.textContent = "こんにちは";

  const name = document.createElement("strong");
  name.textContent = senderName;

  nameLine.appendChild(plate);
  nameLine.appendChild(name);

  return nameLine;
}

function createChatItem() {
  const item = document.createElement("article");
  item.className = "chat-item";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "S";

  const messageArea = document.createElement("div");
  messageArea.className = "message-area";

  messageArea.appendChild(createNameLine());

  item.appendChild(avatar);
  item.appendChild(messageArea);

  return { item, messageArea };
}

function addMessage(text) {
  const { item, messageArea } = createChatItem();

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = applyCensor(text);

  messageArea.appendChild(bubble);
  chatLog.appendChild(item);
  chatLog.scrollTop = chatLog.scrollHeight;
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
  chatLog.scrollTop = chatLog.scrollHeight;
}

function showChatView() {
  chatTab.classList.add("active");
  settingTab.classList.remove("active");
  chatView.classList.remove("hidden");
  settingView.classList.add("hidden");
  messageInput.focus();
}

function showSettingView() {
  settingTab.classList.add("active");
  chatTab.classList.remove("active");
  settingView.classList.remove("hidden");
  chatView.classList.add("hidden");
  senderNameInput.focus();
}

chatTab.addEventListener("click", showChatView);
settingTab.addEventListener("click", showSettingView);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();
  if (!text) return;

  addMessage(text);
  messageInput.value = "";
  messageInput.focus();
});

applySettingButton.addEventListener("click", () => {
  senderName = senderNameInput.value.trim() || "先生";

  const selectedMode = document.querySelector('input[name="censorMode"]:checked');
  if (selectedMode) {
    censorMode = selectedMode.value;
  }
});

clearChatButton.addEventListener("click", () => {
  chatLog.innerHTML = "";
});

function createStampImagePath(folder, number) {
  return `${stampBasePath}/${folder}/${String(number).padStart(2, "0")}.png`;
}

function createStampList() {
  stampGrid.innerHTML = "";

  for (const category of stampCategories) {
    for (let i = 1; i <= category.count; i++) {
      const imagePath = createStampImagePath(category.folder, i);

      const button = document.createElement("button");
      button.className = "stamp-item";
      button.type = "button";
      button.title = `${category.folder}/${String(i).padStart(2, "0")}`;

      const image = document.createElement("img");
      image.className = "stamp-image";
      image.src = imagePath;
      image.alt = button.title;

      image.onerror = () => {
        button.classList.add("stamp-load-error");
      };

      button.appendChild(image);

      button.addEventListener("click", () => {
        addImageStampMessage(imagePath);
        stampModal.classList.add("hidden");
      });

      stampGrid.appendChild(button);
    }
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

function renderNgWordList() {
  ngWordList.innerHTML = "";

  for (const word of ngWords) {
    const item = document.createElement("div");
    item.className = "ngword-list-item";
    item.textContent = word;
    ngWordList.appendChild(item);
  }
}

openNgWordModalButton.addEventListener("click", () => {
  renderNgWordList();
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

createStampList();
