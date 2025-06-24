// Importar Firebase
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// Configuración de Firebase
import { firebaseConfig } from "./config.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
getStorage(app); // Inicializa el storage si es necesario más adelante

// Mensajes centralizados para fácil edición/futuras traducciones
const messages = {
  guest: "¡Hola, invitado!",
  user: name => `¡Hola, ${name || 'usuario'}!`,
  uploadDisabled: "Debes iniciar sesión con Google para subir archivos",
  myFilesDisabled: "Debes iniciar sesión con Google para ver tus archivos"
};

// Obtención de elementos DOM (una sola vez)
const greetingElement = document.getElementById("greeting");
const uploadBtn = document.getElementById("upload-btn");
const myFilesBtn = document.getElementById("myfiles-btn");
const viewBtn = document.getElementById("view-btn");
const logoutBtn = document.getElementById("logout-btn");

// Verificar que los elementos existen antes de operar sobre ellos
if (greetingElement && uploadBtn && myFilesBtn && viewBtn && logoutBtn) {

  // Gestión de estado de autenticación y actualización UI
  auth.onAuthStateChanged(user => {
    if (user) {
      if (user.isAnonymous) {
        greetingElement.innerHTML = messages.guest;

        // Deshabilitar botones para usuarios anónimos
        [uploadBtn, myFilesBtn].forEach(btn => {
          btn.disabled = true;
          btn.style.opacity = "0.6";
          btn.style.cursor = "not-allowed";
        });
        uploadBtn.title = messages.uploadDisabled;
        myFilesBtn.title = messages.myFilesDisabled;
      } else {
        greetingElement.innerHTML = messages.user(user.displayName);

        // Habilitar botones por si habían quedado deshabilitados
        [uploadBtn, myFilesBtn].forEach(btn => {
          btn.disabled = false;
          btn.style.opacity = "";
          btn.style.cursor = "";
          btn.title = "";
        });
      }
    } else {
      greetingElement.innerHTML = messages.guest;
      [uploadBtn, myFilesBtn].forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = "0.6";
        btn.style.cursor = "not-allowed";
      });
      uploadBtn.title = messages.uploadDisabled;
      myFilesBtn.title = messages.myFilesDisabled;
    }
  });

  // Navegación protegida (no permite si está deshabilitado)
  uploadBtn.addEventListener("click", () => {
    if (uploadBtn.disabled) return;
    window.location.href = "upload.html";
  });

  viewBtn.addEventListener("click", () => {
    window.location.href = "view.html";
  });

  myFilesBtn.addEventListener("click", () => {
    if (myFilesBtn.disabled) return;
    window.location.href = "mis_archivos.html";
  });

  // Cerrar sesión
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  });
}
