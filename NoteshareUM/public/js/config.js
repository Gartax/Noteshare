import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";

// Archivo config.js
export const firebaseConfig = {
    apiKey: "AIzaSyC0GvkdgFwGsEWpwUUmMLn_pkautb54jt0",
    authDomain: "noteshareum.firebaseapp.com",
    projectId: "noteshareum",
    storageBucket: "noteshareum.firebasestorage.app",
    messagingSenderId: "1001610602390",
    appId: "1:1001610602390:web:c2089a139b527730829fb7"
  };

export const app = initializeApp(firebaseConfig);