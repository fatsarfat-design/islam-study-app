// tajweed/tajweedPopup.js
// Окно подсказки по правилам таджвида.
// app.js ожидает: export function initTajweedPopup(...)

let _popupEl = null;
let _onWordClick = null;

/**
 * Инициализация попапа.
 * @param {Object} opts
 * @param {(payload:{title?:string, body?:string, ruleId?:string}) => void} [opts.onOpen] - коллбек при открытии
 */
export function initTajweedPopup(opts = {}) {
  // Ничего тяжелого не делаем — просто готовим делегирование кликов
  const { onOpen } = opts;

  // Снимаем старый обработчик, если переинициализация
  if (_onWordClick) {
    document.removeEventListener("click", _onWordClick, true);
  }

  _onWordClick = (e) => {
    const el = e.target.closest?.("[data-tajweed-rule]");
    if (!el) return;

    const ruleId = el.getAttribute("data-tajweed-rule") || "";
    const title = el.getAttribute("data-tajweed-title") || "Правило таджвида";
    const body = el.getAttribute("data-tajweed-body") || "";

    showTajweedPopup({ title, body, ruleId });
    if (typeof onOpen === "function") onOpen({ title, body, ruleId });
  };

  // capture=true чтобы ловить клики даже если внутри shadow/сложно
  document.addEventListener("click", _onWordClick, true);
}

/**
 * Ручное открытие попапа
 */
export function showTajweedPopup({ title = "Правило таджвида", body = "" } = {}) {
  closeTajweedPopup();

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
  _popupEl = overlay;

  const close = () => closeTajweedPopup();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector(".tajweed-popup-close").addEventListener("click", close);
  overlay.querySelector(".tajweed-popup-btn").addEventListener("click", close);

  const onKey = (e) => {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);
}

export function closeTajweedPopup() {
  if (_popupEl) {
    _popupEl.remove();
    _popupEl = null;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
