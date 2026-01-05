// connectors.js (FINAL)
// ЕДИНЫЙ файл подключения вкладок. Должен лежать ТОЛЬКО в корне проекта.
//
// Подключает:
// - Коран (30 джузов) + подсветка таджвида
// - Азкары
// - Намаз
// - Прогресс
// - Экзамены
// - Мини‑тесты
//
// ВАЖНО: после установки оставь один connectors.js в корне, а connectors-*.js удаляй.

import { renderAzkar } from "./azkar/azkarView.js";
import { applyTajweed } from "./tajweed/tajweedHighlighter.js";
import { renderNamaz } from "./namaz/namazView.js";
import { renderProgress, trackEvent } from "./progress/progressView.js";
import { renderExams } from "./exams/examView.js";
import { renderTests } from "./tests/testsView.js";

/* =========================
   PUBLIC API
========================= */
export function connectModules(tabs) {
  // Азкары
  tabs.azkar = (root) => {
    safeTrack("azkar_open", { tab: "azkar" });
    return renderAzkar(root);
  };

  // Коран
  tabs.quran = (root) => {
    safeTrack("quran_open", { tab: "quran" });
    return renderQuran(root);
  };

  // Намаз
  tabs.namaz = (root) => {
    safeTrack("namaz_open", { tab: "namaz" });
    return renderNamaz(root);
  };

  // Прогресс
  tabs.progress = (root) => renderProgress(root);

  // Экзамены
  tabs.exams = (root) => renderExams(root);

  // Мини‑тесты (делаем алиасы на случай разных ключей вкладки)
  tabs.tests = (root) => renderTests(root);
  tabs.miniTest = (root) => renderTests(root);
  tabs.minitest = (root) => renderTests(root);

  // Хук для вкладки "Теория" (если захочешь учитывать в прогрессе)
  // В renderTheory() можно вызвать: window.__trackTheoryOpen && window.__trackTheoryOpen();
  window.__trackTheoryOpen = () => safeTrack("theory_open", { tab: "theory" });
}

/* =========================
   QURAN RENDERER (30 Juz)
   expects files:
   quran/juz/juz-01.json ... quran/juz/juz-30.json
   JSON format:
   { "ayahs": [ { "arabic": "...", "translit": "...", "translation": "..." }, ... ] }
========================= */
async function renderQuran(root) {
  root.innerHTML = `
    <h1>Коран — 30 джузов</h1>

    <div class="card">
      <label class="muted">Выберите джуз</label>
      <select id="juz-select" style="width:100%;margin-top:6px;padding:10px;border-radius:12px;border:1px solid rgba(15,23,42,.15)"></select>
    </div>

    <div class="card">
      <input
        id="quran-search"
        type="search"
        placeholder="Поиск (арабский / русский / транскрипция)"
        style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(15,23,42,.15)"
      />
      <div class="muted" style="margin-top:8px;">
        Подсветка правил идёт из раздела «Таджвид».
      </div>
    </div>

    <div id="quran-content"></div>
  `;

  const select = root.querySelector("#juz-select");
  const content = root.querySelector("#quran-content");
  const search = root.querySelector("#quran-search");

  // список 1..30
  for (let i = 1; i <= 30; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Джуз ${i}`;
    select.appendChild(opt);
  }

  // восстановим последний джуз
  const lastJuz = Number(localStorage.getItem("quran_last_juz") || "1");
  select.value = (lastJuz >= 1 && lastJuz <= 30) ? String(lastJuz) : "1";

  await loadJuz(select.value, content, "");

  select.addEventListener("change", async () => {
    localStorage.setItem("quran_last_juz", String(select.value));
    await loadJuz(select.value, content, search.value);
  });

  search.addEventListener("input", async () => {
    await loadJuz(select.value, content, search.value);
  });
}

async function loadJuz(juzNumber, container, query) {
  container.innerHTML = `<p class="muted">Загрузка…</p>`;

  try {
    const res = await fetch(`quran/juz/juz-${String(juzNumber).padStart(2, "0")}.json`);
    if (!res.ok) throw new Error("Файл не найден");

    const data = await res.json();
    if (!data?.ayahs || !Array.isArray(data.ayahs)) throw new Error("Неверный формат данных");

    container.innerHTML = "";

    // отметим как открытый джуз (для прогресса)
    safeTrack("quran_open_juz", { tab: "quran", juz: Number(juzNumber) });

    const q = (query || "").toLowerCase();

    data.ayahs.forEach((a) => {
      const arabic = String(a.arabic || "");
      const translit = String(a.translit || "");
      const translation = String(a.translation || "");

      if (q) {
        if (
          !arabic.includes(query) &&
          !translit.toLowerCase().includes(q) &&
          !translation.toLowerCase().includes(q)
        ) {
          return;
        }
      }

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="arabic">${applyTajweed(arabic)}</div>
        <div class="translit">${escapeHtml(translit)}</div>
        <div class="translation">${escapeHtml(translation)}</div>
      `;
      container.appendChild(card);
    });

    if (!container.innerHTML) {
      container.innerHTML = `<p class="muted">Ничего не найдено</p>`;
    }
  } catch (e) {
    console.error(e);
    container.innerHTML = `
      <div class="card">
        <p class="muted">Не удалось загрузить джуз ${escapeHtml(String(juzNumber))}</p>
        <div class="muted" style="margin-top:6px;">
          Проверь, что файлы лежат так: <b>quran/juz/juz-01.json … juz-30.json</b>
        </div>
      </div>
    `;
  }
}

/* =========================
   Helpers
========================= */
function safeTrack(type, meta) {
  try {
    if (typeof trackEvent === "function") trackEvent(type, meta);
  } catch {}
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
