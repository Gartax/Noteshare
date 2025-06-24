import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js";
import { firebaseConfig } from "./config.js";
import { showToast } from "./ui.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const params = new URLSearchParams(window.location.search);
const docId = params.get("id");

const titleInput = document.getElementById('title');
const careerSelect = document.getElementById('career');
const semesterSelect = document.getElementById('semester');
const subjectSelect = document.getElementById('subject');
const fileInput = document.getElementById('file-input');
const typeSelect = document.getElementById('type');
const currentFileLabel = document.getElementById('current-file');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const loaderOverlay = document.getElementById('loader-overlay');

let carrerasData = {};
let fileData;

async function loadCarreras() {
  carrerasData = await fetch("./js/carreras.json").then(res => res.json());
  careerSelect.innerHTML = '<option value="">Selecciona carrera</option>';
  Object.entries(carrerasData).forEach(([key, val]) => {
    careerSelect.innerHTML += `<option value="${key}">${val.nombre}</option>`;
  });
}

async function loadFileData() {
  if (!docId) return;
  loaderOverlay.classList.remove('hidden');

  const docRef = doc(db, "documents", docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    showToast("⚠️ Archivo no encontrado.", "error");
    loaderOverlay.classList.add('hidden');
    return;
  }

  fileData = docSnap.data();

  titleInput.value = fileData.title;
  careerSelect.value = fileData.career;

  updateSemesters();
  semesterSelect.value = fileData.semester;

  updateSubjects();
  subjectSelect.value = fileData.subject;

  typeSelect.value = fileData.type;
  currentFileLabel.textContent = fileData.fileUrl.split("/").pop().split("?")[0];

  loaderOverlay.classList.add('hidden');
}

function updateSemesters() {
  const semesters = carrerasData[careerSelect.value]?.semestres || {};
  semesterSelect.innerHTML = Object.keys(semesters).map(sem => `<option value="${sem}">Semestre ${sem}</option>`).join('');
}

function updateSubjects() {
  const subjects = carrerasData[careerSelect.value]?.semestres[semesterSelect.value] || [];
  subjectSelect.innerHTML = subjects.map(sub => `<option value="${sub}">${sub}</option>`).join('');
}

careerSelect.addEventListener('change', () => {
  updateSemesters();
  updateSubjects();
});

semesterSelect.addEventListener('change', updateSubjects);

saveBtn.addEventListener("click", async () => {
  loaderOverlay.classList.remove('hidden');

  let updatedData = {
    title: titleInput.value,
    career: careerSelect.value,
    semester: semesterSelect.value,
    subject: subjectSelect.value,
    type: typeSelect.value,
    timestamp: serverTimestamp()
  };

  const file = fileInput.files[0];

  if (file) {
    const filePath = `documents/${careerSelect.value}/${docId}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    updatedData.fileUrl = await getDownloadURL(storageRef);
    updatedData.storagePath = filePath;
  }

  await updateDoc(doc(db, "documents", docId), updatedData);
  showToast("✅ Cambios guardados correctamente.", "success");
  loaderOverlay.classList.add('hidden');
  setTimeout(() => location.href = "mis_archivos.html", 2000);
});

cancelBtn.addEventListener("click", () => location.href = "mis_archivos.html");

loadCarreras().then(loadFileData);
