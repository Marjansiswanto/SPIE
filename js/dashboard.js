// ======================================================
// KONFIGURASI PASSWORD
// Password disimpan sebagai hash SHA-256, bukan teks biasa,
// supaya tidak langsung terbaca lewat "View Source".
// CATATAN JUJUR: ini mencegah orang iseng, bukan proteksi
// tingkat tinggi. Situs statis (GitHub Pages) tidak bisa
// benar-benar mencegah orang yang paham teknis (DevTools)
// mengambil file. Untuk kerahasiaan penuh, perlu hosting
// dengan autentikasi server sungguhan.
//
// Cara ganti password:
// 1. Buka https://emn178.github.io/online-tools/sha256.html
// 2. Ketik password baru, salin hasil hash-nya
// 3. Tempel ke PASSWORD_HASH (masuk portal) atau
//    DOWNLOAD_PASSWORD_HASH (unduh file) di bawah ini
// ======================================================

const PASSWORD_HASH = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d";
// Hash di atas = "password" — GANTI SEBELUM DI-DEPLOY!

const DOWNLOAD_PASSWORD_HASH = "0d6f64dcab19cf5f184284105a0e6544244222c413df4855adaf1d7def1f0c08";
// Hash di atas = "ubahpasswordini" — GANTI SEBELUM DI-DEPLOY! Harus BEDA dari password portal.

const SESSION_KEY = "fidi_portal_unlocked";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ------------ ELEMENTS ------------
const gate = document.getElementById("gate");
const dashboard = document.getElementById("dashboard");
const viewer = document.getElementById("viewer");

const form = document.getElementById("loginForm");
const input = document.getElementById("passwordInput");
const errorMsg = document.getElementById("errorMsg");

const catalogContainer = document.getElementById("catalogContainer");
const searchBox = document.getElementById("searchBox");
const logoutBtnDash = document.getElementById("logoutBtnDash");

const backToDashboard = document.getElementById("backToDashboard");
const viewerTitle = document.getElementById("viewerTitle");
const downloadBtn = document.getElementById("downloadBtn");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageIndicator = document.getElementById("pageIndicator");
const pdfCanvas = document.getElementById("pdfCanvas");

const downloadModal = document.getElementById("downloadModal");
const downloadPasswordInput = document.getElementById("downloadPasswordInput");
const downloadErrorMsg = document.getElementById("downloadErrorMsg");
const cancelDownload = document.getElementById("cancelDownload");
const confirmDownload = document.getElementById("confirmDownload");

// ------------ STATE ------------
let currentPdfDoc = null;
let currentPageNum = 1;
let currentPath = "";
let currentTitle = "";

// ------------ UTIL ------------
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function showScreen(el) {
  [gate, dashboard, viewer].forEach(s => s.classList.add("hidden"));
  el.classList.remove("hidden");
}

// ------------ LOGIN ------------
function goToDashboard() {
  sessionStorage.setItem(SESSION_KEY, "true");
  renderCatalog(PDF_CATALOG);
  showScreen(dashboard);
}

if (sessionStorage.getItem(SESSION_KEY) === "true") {
  goToDashboard();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const hash = await sha256(input.value);
  if (hash === PASSWORD_HASH) {
    errorMsg.textContent = "";
    goToDashboard();
  } else {
    errorMsg.textContent = "Password salah. Silakan coba lagi.";
    input.value = "";
    input.focus();
  }
});

logoutBtnDash.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  input.value = "";
  showScreen(gate);
});

// ------------ DASHBOARD / KATALOG ------------
function renderCatalog(catalog) {
  catalogContainer.innerHTML = "";

  catalog.forEach(category => {
    const block = document.createElement("div");
    block.className = "category-block";

    const title = document.createElement("div");
    title.className = "category-title";
    title.textContent = category.category;
    block.appendChild(title);

    if (!category.files || category.files.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-note";
      empty.textContent = "Belum ada file di kategori ini.";
      block.appendChild(empty);
    } else {
      const grid = document.createElement("div");
      grid.className = "file-grid";

      category.files.forEach(file => {
        const card = document.createElement("div");
        card.className = "file-card";
        card.innerHTML = `<div class="icon">📄</div><div class="title">${file.title}</div>`;
        card.addEventListener("click", () => openViewer(file.path, file.title));
        grid.appendChild(card);
      });

      block.appendChild(grid);
    }

    catalogContainer.appendChild(block);
  });
}

searchBox.addEventListener("input", () => {
  const q = searchBox.value.trim().toLowerCase();
  if (!q) {
    renderCatalog(PDF_CATALOG);
    return;
  }
  const filtered = PDF_CATALOG
    .map(category => ({
      category: category.category,
      files: category.files.filter(f => f.title.toLowerCase().includes(q))
    }))
    .filter(category => category.files.length > 0);
  renderCatalog(filtered);
});

// ------------ VIEWER (render manual pakai canvas, tanpa toolbar bawaan) ------------
async function openViewer(path, title) {
  currentPath = path;
  currentTitle = title;
  currentPageNum = 1;
  viewerTitle.textContent = title;
  showScreen(viewer);

  try {
    const loadingTask = pdfjsLib.getDocument(path);
    currentPdfDoc = await loadingTask.promise;
    renderPage(currentPageNum);
  } catch (err) {
    viewerTitle.textContent = "Gagal memuat file: " + title;
    console.error(err);
  }
}

async function renderPage(num) {
  const page = await currentPdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: 1.4 });
  const context = pdfCanvas.getContext("2d");
  pdfCanvas.height = viewport.height;
  pdfCanvas.width = viewport.width;

  await page.render({ canvasContext: context, viewport: viewport }).promise;

  pageIndicator.textContent = `Halaman ${num} / ${currentPdfDoc.numPages}`;
  prevPageBtn.disabled = num <= 1;
  nextPageBtn.disabled = num >= currentPdfDoc.numPages;
}

prevPageBtn.addEventListener("click", () => {
  if (currentPageNum > 1) {
    currentPageNum--;
    renderPage(currentPageNum);
  }
});

nextPageBtn.addEventListener("click", () => {
  if (currentPdfDoc && currentPageNum < currentPdfDoc.numPages) {
    currentPageNum++;
    renderPage(currentPageNum);
  }
});

backToDashboard.addEventListener("click", () => {
  currentPdfDoc = null;
  showScreen(dashboard);
});

// Cegah klik kanan & seret gambar di area viewer (deteren dasar, bukan proteksi mutlak)
document.getElementById("pdfCanvasWrap").addEventListener("contextmenu", e => e.preventDefault());
pdfCanvas.addEventListener("dragstart", e => e.preventDefault());

// ------------ DOWNLOAD DENGAN PASSWORD KEDUA ------------
downloadBtn.addEventListener("click", () => {
  downloadPasswordInput.value = "";
  downloadErrorMsg.textContent = "";
  downloadModal.classList.remove("hidden");
  downloadPasswordInput.focus();
});

cancelDownload.addEventListener("click", () => {
  downloadModal.classList.add("hidden");
});

confirmDownload.addEventListener("click", async () => {
  const hash = await sha256(downloadPasswordInput.value);
  if (hash !== DOWNLOAD_PASSWORD_HASH) {
    downloadErrorMsg.textContent = "Password download salah.";
    downloadPasswordInput.value = "";
    return;
  }

  downloadModal.classList.add("hidden");

  // Ambil file asli lalu picu unduhan dengan nama file aslinya
  try {
    const response = await fetch(currentPath);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = currentPath.split("/").pop();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    alert("Gagal mengunduh file. Coba lagi.");
    console.error(err);
  }
});
