export function showToast(message, type="info") {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.error("No existe toast-container en el DOM");
    return;
  }
  const toast = document.createElement('div');
  toast.classList.add('toast', type);
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
export function showConfirmToast(message, onConfirm) {
  const container = document.getElementById("toast-container");
  if (!container) return console.error("No existe toast-container en el DOM");

  const toast = document.createElement("div");
  toast.classList.add("toast", "confirm");

  const msg = document.createElement("span");
  msg.textContent = message;

  const buttons = document.createElement("div");
  buttons.className = "toast-buttons";

  const yesBtn = document.createElement("button");
  yesBtn.textContent = "✅ Sí";
  yesBtn.onclick = () => {
    container.removeChild(toast);
    onConfirm();
  };

  const noBtn = document.createElement("button");
  noBtn.textContent = "❌ No";
  noBtn.onclick = () => container.removeChild(toast);

  buttons.appendChild(yesBtn);
  buttons.appendChild(noBtn);
  toast.appendChild(msg);
  toast.appendChild(buttons);
  container.appendChild(toast);
}
