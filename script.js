


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

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyCensor(text) {
  const protectedRanges = [];

  for (const allowWord of allowWords) {
    const normalizedAllowWord = normalizeText(allowWord);

    for (let i = 0; i < text.length; i++) {
      const target = text.slice(i, i + allowWord.length);

      if (normalizeText(target) === normalizedAllowWord) {
        protectedRanges.push({
          start: i,
          end: i + allowWord.length
        });
      }
    }
  }

  function isProtected(index) {
    return protectedRanges.some((range) => {
      return index >= range.start && index < range.end;
    });
  }

  let result = "";
  let index = 0;

  while (index < text.length) {
    let matched = false;

    const halfKanaMatch = text.slice(index).match(/^[ｦ-ﾟ]+/);

    if (halfKanaMatch) {
      const target = halfKanaMatch[0];

      if (censorMode === "highlight") {
        result += `<span class="ng-word">${escapeHtml(target)}</span>`;
      } else {
        result += "*".repeat(target.length);
      }

      index += target.length;
      continue;
    }

    for (const word of ngWords) {
      if (!word) {
        continue;
      }

      if (isProtected(index)) {
        continue;
      }

      const target = text.slice(index, index + word.length);

      if (normalizeText(target) === normalizeText(word)) {
        if (censorMode === "highlight") {
          result += `<span class="ng-word">${escapeHtml(target)}</span>`;
        } else {
          result += "*".repeat(word.length);
        }

        index += word.length;
        matched = true;

        break;
      }
    }

    if (!matched) {
      result += escapeHtml(text[index]);
      index += 1;
    }
  }

  return result;
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

  return {
    item,
    messageArea
  };
}

function scrollToBottom() {
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addMessage(text) {
  const { item, messageArea } = createChatItem();

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = applyCensor(text);

  messageArea.appendChild(bubble);
  chatLog.prepend(item);
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

  chatLog.prepend(item);
}

function showChatView() {
  chatTab.classList.add("active");
  settingTab.classList.remove("active");

  chatView.classList.remove("hidden");
  settingView.classList.add("hidden");
}

function showSettingView() {
  settingTab.classList.add("active");
  chatTab.classList.remove("active");

  settingView.classList.remove("hidden");
  chatView.classList.add("hidden");
}

chatTab.addEventListener("click", showChatView);
settingTab.addEventListener("click", showSettingView);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();

  if (!text) {
    return;
  }

  addMessage(text);

  messageInput.value = "";
  messageInput.focus();
});



function updateSenderName() {
  senderName = senderNameInput.value.trim() || "先生";
}

function updateCensorMode() {
  const selectedMode = document.querySelector(
    'input[name="censorMode"]:checked'
  );

  if (selectedMode) {
    censorMode = selectedMode.value;
  }
}

senderNameInput.addEventListener("input", updateSenderName);

document.querySelectorAll('input[name="censorMode"]').forEach((radio) => {
  radio.addEventListener("change", updateCensorMode);
});

clearChatButton.addEventListener("click", () => {
  chatLog.innerHTML = "";
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


function renderAllowWordList() {
  allowWordList.innerHTML = "";

  for (const word of allowWords) {
    const item = document.createElement("div");
    item.className = "allowword-list-item";
    item.textContent = word;

    allowWordList.appendChild(item);
  }
}

openAllowWordModalButton.addEventListener("click", () => {
  renderAllowWordList();
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
