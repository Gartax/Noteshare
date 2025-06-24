import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { 
  getFirestore, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { firebaseConfig } from "./config.js";
import { showToast } from "./ui.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Obtener ID de archivo de la URL
const params = new URLSearchParams(window.location.search);
const fileId = params.get("id");

// Elementos del DOM
const commentForm = document.getElementById("comment-form");
const commentText = document.getElementById("comment-text");
const commentsList = document.getElementById("comments-list");

// Enviar nuevo comentario
commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Asegúrate de que ratingHidden existe siempre:
  let ratingHidden = document.getElementById("rating-hidden");
  const rating = parseInt(ratingHidden ? ratingHidden.value : 5, 10);
  const text = commentText.value.trim();
  const user = auth.currentUser;

  if (!user) {
    showToast("Debes iniciar sesión para comentar.", "error");
    return;
  }

  if (!text) {
    showToast("El comentario no puede estar vacío.", "error");
    return;
  }

  try {
    // Añadir el documento a la colección "comments"
    await addDoc(
      collection(db, "comments"),
      {
        fileId,                             // ID del archivo
        userId: user.uid,                   // ID del usuario
        userName: user.displayName || "Invitado",
        commentText: text,
        rating,                             // valor de 1 a 5
        timestamp: serverTimestamp()
      }
    );
    commentForm.reset();
    // Resetear a 5 estrellas visualmente y en el input hidden
    const starRatingEl = document.getElementById("star-rating");
    if (starRatingEl) {
      // Asegura que el input hidden existe:
      if (!ratingHidden) {
        ratingHidden = document.createElement("input");
        ratingHidden.type = "hidden";
        ratingHidden.id = "rating-hidden";
        ratingHidden.name = "rating";
        ratingHidden.value = 5;
        starRatingEl.parentNode.appendChild(ratingHidden);
      } else {
        ratingHidden.value = 5;
      }
      // Actualizar visual
      [...starRatingEl.children].forEach((star, i) => {
        star.classList.toggle('selected', i < 5);
      });
    }
    loadComments();
    showToast("Comentario enviado correctamente.", "success");
  } catch (err) {
    console.error(err);
    showToast("Error al enviar comentario.", "error");
  }
});

// Cargar y mostrar comentarios existentes
async function loadComments() {
  commentsList.innerHTML = "";
  const q = query(
    collection(db, "comments"),
    where("fileId", "==", fileId),
    orderBy("timestamp", "desc")
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    commentsList.innerHTML = "<p>No hay comentarios aún.</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const c = docSnap.data();
    const date = c.timestamp?.toDate().toLocaleString("es-CL") || "";
    // Mejorar visual de los comentarios con estrellas y clases de diseño
    const commentEl = document.createElement("div");
    commentEl.classList.add("comment-card");
    commentEl.innerHTML = `
      <div class="meta">
        <strong>${c.userName}</strong>
        <span> (${date})</span>
        <span class="rating">${'★'.repeat(c.rating)}${'☆'.repeat(5-c.rating)}</span>
      </div>
      <div class="text">${c.commentText}</div>
    `;
    commentsList.appendChild(commentEl);
  });
}

// Inicializar carga de comentarios al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, () => loadComments());
});
