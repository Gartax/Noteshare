// Importar las funciones necesarias de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// Importar la configuración de Firebase
import { firebaseConfig } from "./config.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Botones
const loginBtn = document.getElementById("login-btn");
const anonLoginBtn = document.getElementById("anon-login-btn");

// Función para mostrar feedback
function setLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.textContent = isLoading ? "Cargando..." : btn.dataset.originalText;
}

// Guardar texto original
if (loginBtn) loginBtn.dataset.originalText = loginBtn.textContent;
if (anonLoginBtn) anonLoginBtn.dataset.originalText = anonLoginBtn.textContent;

// Login con Google
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    setLoading(loginBtn, true);
    try {
      const result = await signInWithPopup(auth, provider);
      window.location.href = "menu.html";
    } catch (e) {
      alert("Error al iniciar sesión: " + e.message);
    } finally {
      setLoading(loginBtn, false);
    }
  });
}

// Login anónimo
if (anonLoginBtn) {
  anonLoginBtn.addEventListener("click", async () => {
    setLoading(anonLoginBtn, true);
    try {
      const result = await signInAnonymously(auth);
      window.location.href = "menu.html";
    } catch (e) {
      alert("Error al iniciar sesión de manera anónima: " + e.message);
    } finally {
      setLoading(anonLoginBtn, false);
    }
  });
}

// Registro del Service Worker (ajuste en ruta, ver siguiente paso)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log("✅ Service Worker registrado"))
    .catch(err => console.error("❌ Error al registrar Service Worker:", err));
}