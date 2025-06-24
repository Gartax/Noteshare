import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";
import { showToast } from "./ui.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const fileList = document.getElementById("file-list");
const loaderOverlay = document.getElementById("loader-overlay");
const loadMoreBtn = document.getElementById("load-more-btn");
const applyFiltersBtn = document.getElementById("apply-filters");
const backBtn = document.getElementById("back-btn");
const filterCareer = document.getElementById("filter-career");
const filterSemester = document.getElementById("filter-semester");
const filterSubject = document.getElementById("filter-subject");
const filterType = document.getElementById("filter-type");
const filterTitle = document.getElementById("filter-title");
const resultCount = document.getElementById("result-count");
const noResults = document.getElementById("no-results");

let lastVisibleDoc = null;
const FILES_TO_LOAD = 5;
let carrerasData = {};
let hasMore = true;

// ----- CARGA DE CARRERAS -----
async function loadCarreras() {
  loaderOverlay.classList.remove("hidden");
  try {
    carrerasData = await fetch("./js/carreras.json").then(res => res.json());
    filterCareer.innerHTML = '<option value="">Todas las carreras</option>';
    Object.entries(carrerasData).forEach(([key, val]) => {
      filterCareer.innerHTML += `<option value="${key}">${val.nombre}</option>`;
    });
    updateSemesters();
    await loadFiles();
  } catch (error) {
    console.error("Error al cargar carreras:", error);
    showToast(`⚠️ Error al cargar datos: ${error.message}`, "error");
  } finally {
    loaderOverlay.classList.add("hidden");
  }
}

// ----- ACTUALIZA SELECTORES -----
function updateSemesters() {
  filterSemester.innerHTML = '<option value="">Todos los semestres</option>';
  const selectedCareer = filterCareer.value;
  if (selectedCareer) {
    Object.keys(carrerasData[selectedCareer].semestres).forEach(sem => {
      filterSemester.innerHTML += `<option value="${sem}">Semestre ${sem}</option>`;
    });
  }
  updateSubjects();
}

function updateSubjects() {
  filterSubject.innerHTML = '<option value="">Todas las asignaturas</option>';
  const selectedCareer = filterCareer.value;
  const selectedSemester = filterSemester.value;
  if (selectedCareer && selectedSemester) {
    carrerasData[selectedCareer].semestres[selectedSemester].forEach(sub => {
      filterSubject.innerHTML += `<option value="${sub}">${sub}</option>`;
    });
  }
}

// ----- CARGA DE ARCHIVOS -----
async function loadFiles() {
  loaderOverlay.classList.remove("hidden");
  noResults.classList.add("hidden");

  try {
    const filters = [];
    const career = filterCareer.value.toLowerCase();
    const semester = filterSemester.value;
    const subject = filterSubject.value.trim().toLowerCase();
    const type = filterType.value.toLowerCase();
    const searchTerm = filterTitle.value.trim().toLowerCase();

    if (career) filters.push(where("career", "==", career));
    if (semester) filters.push(where("semester", "==", semester));
    if (subject) filters.push(where("subject", "==", subject));
    if (type) filters.push(where("type", "==", type));

    let queryConstraints = [
      ...filters,
      orderBy("views", "desc"),
      limit(FILES_TO_LOAD),
    ];

    if (lastVisibleDoc) {
      queryConstraints.push(startAfter(lastVisibleDoc));
    }

    const q = query(collection(db, "documents"), ...queryConstraints);
    const snapshot = await getDocs(q);

    // Si no hay resultados
    if (snapshot.empty) {
      hasMore = false;
      loadMoreBtn.style.display = "none";
      noResults.classList.remove("hidden");
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        const docId = doc.id;
        const fileName = data.fileUrl.split("?")[0].split("/").pop();
        const isImage = fileName.match(/\.(jpg|jpeg|png)$/i);
        const thumbnailUrl = isImage ? data.fileUrl : "./apunte.png";

        // ESTRUCTURA VISUAL tipo mosaico
        const li = document.createElement("li");
        li.innerHTML = `
          <a href="archivo.html?id=${docId}" class="file-link" tabindex="0">
            <img src="${thumbnailUrl}" alt="${data.title}" />
            <h4 class="file-title">${data.title}</h4>
            <p class="file-materia"><strong>Materia:</strong> ${data.subject}</p>
            <span class="file-vistas"><span>👁️</span> ${data.views || 0} vistas</span>
          </a>
        `;
        fileList.appendChild(li);
      });

      lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
      hasMore = snapshot.size === FILES_TO_LOAD;
      loadMoreBtn.style.display = hasMore ? "block" : "none";
    }

  } catch (error) {
    console.error("Error al cargar archivos:", error);
    showToast(`⚠️ Error: ${error.message}`, "error");
  } finally {
    loaderOverlay.classList.add("hidden");
  }
}

// ----- LIMPIAR FILTROS -----
const clearFiltersBtn = document.getElementById("clear-filters");
clearFiltersBtn.addEventListener("click", () => {
  filterCareer.value = "";
  filterSemester.innerHTML = '<option value="">Todos los semestres</option>';
  filterSubject.innerHTML = '<option value="">Todas las asignaturas</option>';
  filterType.value = "";
  filterTitle.value = "";
  fileList.innerHTML = "";
  lastVisibleDoc = null;
  hasMore = true;
  loadFiles();
});

// ----- EVENTOS -----
filterCareer.addEventListener("change", updateSemesters);
filterSemester.addEventListener("change", updateSubjects);
applyFiltersBtn.addEventListener("click", () => { fileList.innerHTML = ''; lastVisibleDoc = null; loadFiles(); });
backBtn.addEventListener("click", () => window.location.href = "menu.html");
loadMoreBtn.addEventListener("click", loadFiles);

// ----- INICIALIZAR -----
loadCarreras();
