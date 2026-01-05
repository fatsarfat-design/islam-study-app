/* =========================
   Tajweed popup
========================= */

import { TAJWEED_RULES } from "./tajweedRules.js";

export function initTajweedPopup() {
  document.addEventListener("click", e => {
    const target = e.target;

    if (!target.classList.contains("tajweed-word")) return;

    const ruleId = target.dataset.rule;
    const rule = TAJWEED_RULES[ruleId];

    if (!rule) return;

    showPopup(rule);
  });
}

function showPopup(rule) {
  closePopup();

  const overlay = document.createElement("div");
  overlay.className = "tajweed-overlay";

  const popup = document.createElement("div");
  popup.className = "tajweed-popup";

  popup.innerHTML = `
    <h3>${rule.title}</h3>
    <p>${rule.description}</p>
    <button class="button small close-popup">Закрыть</button>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", e => {
    if (e.target === overlay || e.target.classList.contains("close-popup")) {
      closePopup();
    }
  });
}

function closePopup() {
  const existing = document.querySelector(".tajweed-overlay");
  if (existing) existing.remove();
}
