import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { firebaseConfig } from "./config.js";
import { v4 as uuidv4 } from "https://jspm.dev/uuid";
import { showToast } from "./ui.js";

// Inicializa Firebase y Auth primero
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// 🔒 Protección: Redirige a menú si NO es usuario Google (anónimo o no logeado)
onAuthStateChanged(auth, (user) => {
  if (!user || user.isAnonymous) {
    window.location.href = "menu.html";
  }
});

// --- El resto del código se ejecuta SOLO si pasa la validación anterior ---

const careerSelect = document.getElementById('career');
const semesterSelect = document.getElementById('semester');
const subjectSelect = document.getElementById('subject');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const backBtn = document.getElementById('back-btn');
const typeSelect = document.getElementById('type');
const titleInput = document.getElementById('title');
const fileNameLabel = document.getElementById('file-name');
const dropArea = document.getElementById('drop-area');
const form = document.getElementById('upload-form');
const filePreview = document.getElementById('file-preview');
const loaderBarContainer = document.getElementById('loader-bar-container');
const progressBar = document.getElementById('progress-bar');

let carrerasData = {};

// Advierte al salir si hay un archivo seleccionado y no subido
window.onbeforeunload = function () {
  if (fileInput.files.length > 0) {
    return "¿Estás seguro que deseas salir? Tu archivo no se ha subido aún.";
  }
};

// Cargar carreras/semestres/materias dinámicamente
async function loadCarreras() {
  showLoaderBar();
  try {
    carrerasData = await fetch("./js/carreras.json").then(res => res.json());
    careerSelect.innerHTML = '<option value="">Selecciona carrera</option>';
    Object.entries(carrerasData).forEach(([key, val]) => {
      careerSelect.innerHTML += `<option value="${key}">${val.nombre}</option>`;
    });
    updateSemesters();
  } catch (error) {
    showToast(`⚠️ Error al cargar datos: ${error.message}`, "error");
  } finally {
    hideLoaderBar();
  }
}

function updateSemesters() {
  const selectedCareer = careerSelect.value;
  semesterSelect.innerHTML = Object.keys(carrerasData[selectedCareer]?.semestres || {}).map(sem =>
    `<option value="${sem}">Semestre ${sem}</option>`
  ).join('');
  updateSubjects();
}

function updateSubjects() {
  const selectedCareer = careerSelect.value;
  const selectedSemester = semesterSelect.value;
  subjectSelect.innerHTML = (carrerasData[selectedCareer]?.semestres?.[selectedSemester] || []).map(sub =>
    `<option value="${sub}">${sub}</option>`
  ).join('');
}

careerSelect.addEventListener('change', updateSemesters);
semesterSelect.addEventListener('change', updateSubjects);

dropArea.addEventListener("click", () => fileInput.click());
dropArea.addEventListener("dragover", e => e.preventDefault());
dropArea.addEventListener("drop", e => {
  e.preventDefault();
  fileInput.files = e.dataTransfer.files;
  showSelectedFile();
});

fileInput.addEventListener("change", showSelectedFile);

function showSelectedFile() {
  const file = fileInput.files[0];
  if (!file) {
    fileNameLabel.textContent = "Ningún archivo seleccionado";
    filePreview.innerHTML = "";
    return;
  }
  fileNameLabel.textContent = file.name;
  // Preview solo para imágenes
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = e => {
      filePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 120px; max-height: 120px; border-radius: 10px; margin-top: 10px;" />`;
    };
    reader.readAsDataURL(file);
  } else {
    filePreview.innerHTML = "";
  }
}

// Loader no invasivo
function showLoaderBar() {
  loaderBarContainer.classList.remove("hidden");
  progressBar.style.width = "0%";
}
function hideLoaderBar() {
  loaderBarContainer.classList.add("hidden");
}

// Lógica de subida con barra y spinner
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  uploadBtn.disabled = true;
  showLoaderBar();

  const file = fileInput.files[0];
  const title = titleInput.value.trim();
  const type = typeSelect.value;
  const career = careerSelect.value;
  const semester = semesterSelect.value;
  const subject = subjectSelect.value;
  const user = auth.currentUser;

  if (!file || !title || !type || !career || !semester || !subject) {
    showToast("⚠️ Completa todos los campos.", "error");
    endUploadUI();
    return;
  }
  const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  if (!validTypes.includes(file.type)) {
    showToast("🚫 Solo se permite PDF, JPG o PNG.", "error");
    endUploadUI();
    return;
  }
  const maxSizeMB = 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    showToast(`🚫 Tamaño máximo permitido: ${maxSizeMB}MB.`, "error");
    endUploadUI();
    return;
  }

  try {
    const fileId = uuidv4();
    const extension = file.name.split('.').pop();
    const filePath = `documents/${career}/${fileId}.${extension}`;

    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on("state_changed",
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        progressBar.style.width = `${percent}%`;
      },
      (err) => {
        showToast(`⚠️ Error: ${err.message}`, "error");
        endUploadUI();
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, "documents"), {
          title, type, career, semester, subject,
          fileUrl: downloadURL, timestamp: serverTimestamp(),
          userId: user?.uid || null, userName: user?.displayName || "Usuario", views: 0,
          storagePath: filePath
        });
        showToast("✅ Archivo subido correctamente.", "success");
        resetForm();
        endUploadUI();
      }
    );
  } catch (err) {
    showToast(`⚠️ Error: ${err.message}`, "error");
    endUploadUI();
  }
});

function endUploadUI() {
  hideLoaderBar();
  uploadBtn.disabled = false;
}

function resetForm() {
  form.reset();
  fileNameLabel.textContent = "Ningún archivo seleccionado";
  filePreview.innerHTML = "";
}

backBtn.addEventListener("click", () => location.href = "menu.html");

// Inicializa carreras al cargar
loadCarreras();
