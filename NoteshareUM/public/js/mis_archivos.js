// Importaciones Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs, deleteDoc, doc, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import {
  getStorage, ref, deleteObject, getMetadata
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js";
import { firebaseConfig } from "./config.js";
import { showToast, showConfirmToast } from "./ui.js";

// Inicialización Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Elementos del DOM
const fileList = document.getElementById("user-file-list");
const backBtn = document.getElementById("back-btn");
const emptyMsg = document.getElementById("empty-msg");

// Loader functions (reutilizadas de upload.js)
function showLoaderBar() {
  document.getElementById('loader-bar-container').classList.remove("hidden");
  document.getElementById('progress-bar').style.width = "100%";
}
function hideLoaderBar() {
  document.getElementById('loader-bar-container').classList.add("hidden");
  document.getElementById('progress-bar').style.width = "0%";
}

// Ir al menú
backBtn.addEventListener("click", () => {
  window.location.href = "menu.html";
});

// Verificar sesión y cargar archivos del usuario
onAuthStateChanged(auth, async user => {
  // Validación de sesión solo Google: si no es usuario autenticado o es anónimo, redirige.
  if (!user || user.isAnonymous || !user.providerData.some(p => p.providerId === "google.com")) {
    alert("Debes iniciar sesión con Google para ver tus archivos.");
    window.location.href = "menu.html";
    return;
  }

  const userId = user.uid;

  const q = query(
    collection(db, "documents"),
    where("userId", "==", userId),
    orderBy("views", "desc")
  );

  const snapshot = await getDocs(q);

  // Limpiar lista antes de mostrar
  fileList.innerHTML = "";

  if (snapshot.empty) {
    emptyMsg.style.display = "";
    return;
  } else {
    emptyMsg.style.display = "none";
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");

    // Estructura visual y accesible
    const fileName = data.fileUrl.split("?")[0].split("/").pop();
    const isImage = fileName.match(/\.(jpg|jpeg|png)$/i);
    const thumbnail = isImage ? data.fileUrl : "./apunte.png";

    li.innerHTML = `
      <img src="${thumbnail}" alt="${data.title}" />
      <h4 class="ma-title">${data.title}</h4>
      <p class="ma-materia"><strong>Materia:</strong> ${data.subject}</p>
      <p class="vistas"><span>👁️</span> ${data.views || 0} vistas</p>
      <div class="ma-card-actions">
        <button class="ma-btn ma-edit-btn" type="button" tabindex="0" aria-label="Editar ${data.title}">✏️ Editar</button>
        <button class="ma-btn ma-delete-btn" type="button" tabindex="0" aria-label="Eliminar ${data.title}">🗑️ Eliminar</button>
      </div>
    `;

    // Botón de eliminar
    li.querySelector(".ma-delete-btn").addEventListener("click", () => {
      showConfirmToast("¿Deseas eliminar este archivo?", async () => {
        showLoaderBar(); // ← Mostrar loader al iniciar
        try {
          const fallbackPath = decodeURIComponent(data.fileUrl.split("/o/")[1].split("?")[0]);
          const path = data.storagePath || fallbackPath;
          const fileRef = ref(storage, path);

          await getMetadata(fileRef);
          await deleteObject(fileRef);
          await deleteDoc(doc(db, "documents", docSnap.id));

          showToast("✅ Archivo eliminado correctamente.", "success");
          li.remove();
          updateEmptyMsg();
        } catch (err) {
          if (err.code === "storage/object-not-found") {
            await deleteDoc(doc(db, "documents", docSnap.id));
            showToast("✅ Archivo eliminado correctamente.", "success");
            li.remove();
            updateEmptyMsg();
          } else {
            console.error("Error eliminando archivo:", err);
            showToast("❌ Error al eliminar archivo.", "error");
          }
        } finally {
          hideLoaderBar(); // ← Ocultar loader al terminar (éxito o error)
        }
      });
    });

    // Botón de editar
    li.querySelector(".ma-edit-btn").addEventListener("click", () => {
      window.location.href = `editar_archivo.html?id=${docSnap.id}`;
    });

    fileList.appendChild(li);
  });

  updateEmptyMsg();
});

// Función para mostrar u ocultar el mensaje de lista vacía
function updateEmptyMsg() {
  const archivos = Array.from(fileList.querySelectorAll("li")).filter(li => !li.classList.contains("ma-empty-msg"));
  if (archivos.length === 0) {
    emptyMsg.style.display = "";
  } else {
    emptyMsg.style.display = "none";
  }
}
