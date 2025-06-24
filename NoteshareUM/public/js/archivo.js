import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getFirestore, doc, getDoc, increment, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const params = new URLSearchParams(window.location.search);
const docId = params.get("id");

const titleEl = document.getElementById("file-title");
const previewEl = document.getElementById("file-preview");
const infoEl = document.getElementById("file-info");
const backBtn = document.getElementById("back-btn");

// --------------------  RENDER DE ARCHIVO --------------------
async function loadFile() {
  if (!docId) {
    titleEl.textContent = "Archivo no encontrado";
    return;
  }
  try {
    const docRef = doc(db, "documents", docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      titleEl.textContent = "Archivo no encontrado";
      return;
    }
    const data = docSnap.data();
    await updateDoc(docRef, { views: increment(1) });

    titleEl.textContent = data.title;

    const fileUrl = data.fileUrl;
    const fileName = fileUrl.split("?")[0].split("/").pop().toLowerCase();
    if (fileName.endsWith(".pdf")) {
      previewEl.innerHTML = `<iframe src="${fileUrl}" frameborder="0"></iframe>`;
    } else if (
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".gif")
    ) {
      previewEl.innerHTML = `<img src="${fileUrl}" alt="${data.title}" />`;
    } else {
      previewEl.innerHTML = `
        <img src="apunte.png" alt="Vista genérica" />
        <p style="margin-top: 10px;"><a href="${fileUrl}" target="_blank">📥 Descargar archivo</a></p>
      `;
    }

    const dateStr = data.timestamp?.seconds
      ? new Date(data.timestamp.seconds * 1000).toLocaleDateString("es-CL")
      : "Fecha desconocida";
    // Render info con badges
    infoEl.innerHTML = `
      <p><strong>Materia:</strong><span class="badge">${data.subject}</span></p>
      <p><strong>Carrera:</strong><span class="badge">${data.career}</span></p>
      <p><strong>Semestre:</strong><span class="badge">${data.semester}</span></p>
      <p><strong>Tipo:</strong><span class="badge">${data.type}</span></p>
      <p><strong>Subido por:</strong><span class="badge user">${data.userName || "Desconocido"}</span></p>
      <p><strong>Vistas:</strong><span class="badge">${(data.views || 0) + 1}</span></p>
      <p><strong>Fecha:</strong><span class="badge fecha">${dateStr}</span></p>
    `;
  } catch (err) {
    console.error("Error al cargar el archivo:", err);
    titleEl.textContent = "Error al cargar el archivo";
  }
}
loadFile();

backBtn.addEventListener("click", () => {
  window.history.back();
});

// --------------------  RATING ESTRELLAS --------------------
const starRatingEl = document.getElementById('star-rating');

// Crea el input hidden SIEMPRE (al cargar la página)
if (starRatingEl && !document.getElementById('rating-hidden')) {
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.id = 'rating-hidden';
  hiddenInput.name = 'rating';
  hiddenInput.value = 5;
  starRatingEl.parentNode.appendChild(hiddenInput);
}

if (starRatingEl) {
  let selected = 5; // Por defecto
  function updateStars(rating) {
    [...starRatingEl.children].forEach((star, i) => {
      star.classList.toggle('selected', i < rating);
    });
  }
  starRatingEl.addEventListener('click', (e) => {
    if (e.target.tagName === 'SPAN') {
      selected = parseInt(e.target.dataset.value, 10);
      updateStars(selected);
      // Ya existe el hiddenInput
      document.getElementById('rating-hidden').value = selected;
    }
  });
  updateStars(selected);
}
