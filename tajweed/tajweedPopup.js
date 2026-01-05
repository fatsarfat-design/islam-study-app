// tajweed/tajweedPopup.js
// Всплывающее окно с правилом таджвида (для клика по слову/подсветке)

export function showTajweedPopup({ title = "Правило таджвида", body = "" } = {}) {
  // Удаляем старый попап, если есть
  const prev = document.querySelector(".tajweed-popup");
  if (prev) prev.remove();

  const overlay = document.createElement("div");
  overlay.className = "tajweed-popup";
  overlay.innerHTML = `
    <div class="tajweed-popup-card" role="dialog" aria-modal="true">
      <div class="tajweed-popup-head">
        <h3>${escapeHtml(title)}</h3>
        <button class="tajweed-popup-close" aria-label="Закрыть">×</button>
      </div>
      <div class="tajweed-popup-body">${escapeHtml(body).replace(/\n/g, "<br/>")}</div>
      <div class="tajweed-popup-actions">
        <button class="tajweed-popup-btn">Закрыть</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector(".tajweed-popup-close").addEventListener("click", close);
  overlay.querySelector(".tajweed-popup-btn").addEventListener("click", close);

  // ESC закрывает
  const onKey = (e) => {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
