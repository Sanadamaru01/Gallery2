console.log("[TRACE] portal.js loaded");

// -------------------- Firebase 接続 --------------------
import { app } from './firebaseInit.js';
import {
  getFirestore, collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage, ref, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const db = getFirestore(app);
const storage = getStorage(app);

// -------------------- DOM --------------------
const roomList = document.getElementById("roomList");
const noImagePath = "./noimage.jpg";

// -------------------- 初期処理 --------------------
window.addEventListener("DOMContentLoaded", () => {
  console.log("[TRACE] DOMContentLoaded");
  renderAllRooms();
});

// -------------------- Firestore rooms 読み込み --------------------
async function renderAllRooms() {
  roomList.textContent = "読み込み中...";

  try {
    const snap = await getDocs(collection(db, "rooms"));
    roomList.textContent = "";

    snap.forEach(async (roomDoc) => {
      const roomId = roomDoc.id;
      const data = roomDoc.data();

      const config = {
        roomTitle: data.roomTitle ?? "(no title)",
        startDate: data.startDate ? toDateString(data.startDate) : "",
        endDate: data.endDate ? toDateString(data.endDate) : ""
      };

      const isOpen = checkOpen(config.startDate, config.endDate);
      const card = await createRoomCard(roomId, config, isOpen);

      roomList.appendChild(card);
    });
  } catch (e) {
    roomList.textContent = "ルーム一覧の読み込みに失敗しました。";
    console.error(e);
  }
}

// -------------------- Firestore Timestamp → YYYY/MM/DD --------------------
function toDateString(ts) {
  if (!ts) return "";
  const d = ts.toDate();
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// -------------------- 公開期間チェック --------------------
function checkOpen(startStr, endStr) {
  if (!startStr || !endStr) return false;
  const now = new Date();
  const start = new Date(startStr);
  const end = new Date(endStr);
  return now >= start && now <= end;
}

// -------------------- UI カード生成 --------------------
async function createRoomCard(roomId, config, isOpen) {

  const container = document.createElement('div');
  container.className = 'room-card';

  // --- <a> リンク ---
  const link = document.createElement('a');
  link.href = `./room.html?roomId=${roomId}`; // トップ直下に変更
  if (!isOpen) link.classList.add('closed');

  // --- サムネイル画像（Storage 参照） ---
  const thumb = document.createElement('img');
  thumb.alt = config.roomTitle;

  let imgURL = noImagePath;
  try {
    const thumbRef = ref(storage, `rooms/${roomId}/thumbnail.webp`);
    imgURL = await getDownloadURL(thumbRef);
  } catch (e) {
    console.warn(`[WARN] no thumbnail for ${roomId}`);
  }

  thumb.src = imgURL;
  thumb.onerror = () => { thumb.src = noImagePath; };

  // --- 情報ブロック ---
  const info = document.createElement('div');
  info.className = 'room-info';

  const title = document.createElement('h3');
  title.textContent = config.roomTitle;

  const dates = document.createElement('p');
  dates.textContent = `${config.startDate} ～ ${config.endDate}`;

  const status = document.createElement('p');
  status.textContent = isOpen ? '🔓 公開中' : '🔒 非公開';

  // --- DOM 組み立て ---
  info.append(title, dates, status);
  link.append(thumb, info);
  container.appendChild(link);

  return container;
}
