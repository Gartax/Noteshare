import { getFirestore, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { app } from "./config.js";

const db = getFirestore(app);

// Función para incrementar vistas por ID del documento
export async function incrementViewCount(documentId) {
  try {
    const docRef = doc(db, "documents", documentId);
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error("Error al incrementar contador de vistas:", error);
  }
}
