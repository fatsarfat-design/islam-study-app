/* =========================
   Islam Study App — app.js (production-ready)
   - Tabs сохранены все
   - Tajweed: подсветка + popup
   - Connectors: автоматом подключает Quran/Azkar (если есть connectors.js)
========================= */

import { initTajweedPopup } from "./tajweed/tajweedPopup.js";

// Опционально: если подсветка таджвида нужна в заглушках/демо-тексте
import { applyTajweed } from "./tajweed/tajweedHighlighter.js";

/* =========================
   State
========================= */
const state = {
  activeTab: "all",
  modulesConnected: false
};

/* =========================
   Tabs map (все вкладки сохраняем!)
   Коннекторы подменят azkar/quran на реальные рендеры
========================= */
const tabs = {
  all: renderAll,
  theory: renderTheory,
  trainer: renderTrainer,
  tests: renderTests,
  exams: renderExams,
  namaz: renderNamaz,
  azkar: renderAzkarPlaceholder,
  quran: renderQuranPlaceholder,
  notes: renderNotes,
  progress: renderProgress,
  repeat: renderRepeat,
  cards: renderCards,
  settings: renderSettings
};

/* =========================
   Boot
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  // 1) Tajweed popup global handler
  initTajweedPopup();

  // 2) Tabs UI
  initTabs();

  // 3) Try connect modules (Azkar/Quran)
  await tryConnectModules();

  // 4) First tab
  switchTab(state.activeTab);
});

/* =========================
   Tabs UI
========================= */
function initTabs() {
  document.querySelectorAll("#tabs button").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll("#tabs button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  const root = document.getElementById("content");
  root.innerHTML = "";

  const render = tabs[tabId];
  if (typeof render !== "function") {
    root.innerHTML = `<p class="muted">Раздел в разработке</p>`;
    return;
  }

  try {
    render(root);
  } catch (err) {
    console.error(err);
    root.innerHTML = `
      <h1>Ошибка</h1>
      <div class="card">
        <p class="muted">Что-то пошло не так при отрисовке вкладки.</p>
        <pre class="muted" style="white-space:pre-wrap">${escapeHtml(String(err))}</pre>
      </div>
    `;
  }
}

/* =========================
   Auto-connect Quran/Azkar (если есть connectors.js)
========================= */
async function tryConnectModules() {
  try {
    // connectors.js должен лежать в корне рядом с app.js
    const mod = await import("./connectors.js");
    if (typeof mod.connectModules === "function") {
      mod.connectModules(tabs);
      state.modulesConnected = true;
      console.log("[OK] Modules connected via connectors.js");
    }
  } catch (e) {
    // Это нормально, если connectors.js ещё не распакован
    console.log("[INFO] connectors.js not found or failed to load. Using placeholders.");
  }
}

/* =========================
   Renderers
========================= */
function renderAll(root) {
  root.innerHTML = `
    <h1>Ас-саляму алейкум 🌙</h1>
    <div class="card">
      <p>Выбери раздел ниже:</p>
      <ul style="margin-left:18px; margin-top:8px">
        <li><b>Теория</b> — правила таджвида</li>
        <li><b>Коран</b> — 30 джузов (арабский/русский/транскрипция)</li>
        <li><b>Азкары</b> — утро/вечер/после намаза и др.</li>
        <li><b>Тренажёр</b>, <b>Мини-тесты</b>, <b>Экзамены</b> — практика</li>
        <li><b>Повторение</b>, <b>Карточки</b>, <b>Заметки</b>, <b>Прогресс</b></li>
      </ul>
    </div>
  `;
}

function renderTheory(root) {
  root.innerHTML = `
    <h1>Теория таджвида</h1>
    <div class="card">
      <p class="muted">
        Здесь будут собраны правила и примеры. Нажимай на подсвеченные фрагменты в Коране/Азкарах, чтобы увидеть правило.
      </p>
    </div>

    <div class="card">
      <p class="muted">Мини-проверка таджвида (демо):</p>
      <div class="arabic" style="margin-top:10px">${applyTajweed("إِنْ يَقُولُونَ قَوْلًا")}</div>
      <p class="muted" style="margin-top:10px">Кликни по подсвеченному — откроется правило.</p>
    </div>
  `;
}

function renderTrainer(root) {
  root.innerHTML = `
    <h1>Тренажёр</h1>
    <div class="card">
      <p class="muted">Скоро здесь будет адаптивная практика (ошибки → повторение).</p>
    </div>
  `;
}

function renderTests(root) {
  root.innerHTML = `
    <h1>Мини-тесты</h1>
    <div class="card">
      <p class="muted">Быстрая проверка знаний по темам таджвида.</p>
    </div>
  `;
}

function renderExams(root) {
  root.innerHTML = `
    <h1>Экзамены</h1>
    <div class="card">
      <p class="muted">Итоговые экзамены по уровням — будет.</p>
    </div>
  `;
}

function renderNamaz(root) {
  root.innerHTML = `
    <h1>Намаз</h1>
    <div class="card">
      <p class="muted">
        Здесь будет: <b>время намаза</b> и <b>отсчёт до следующего</b>.
        (Мы отдельно сделаем корректный расчёт и сверку.)
      </p>
    </div>
  `;
}

/* --- Placeholders (если connectors.js ещё не подключил реальные модули) --- */

function renderAzkarPlaceholder(root) {
  root.innerHTML = `
    <h1>Азкары</h1>
    <div class="card">
      <p class="muted">
        Модуль азкаров ещё не подключён.
        Проверь, что распакованы:
        <br><b>azkar/azkarView.js</b> и <b>azkar/azkar.json</b>,
        а также <b>connectors.js</b> в корне проекта.
      </p>
    </div>
  `;
}

function renderQuranPlaceholder(root) {
  root.innerHTML = `
    <h1>Коран (30 джузов)</h1>
    <div class="card">
      <p class="muted">
        Модуль Корана ещё не подключён.
        Проверь, что распакованы:
        <br><b>quran/quranView.js</b> и папка <b>quran/juz/</b> с файлами джузов,
        а также <b>connectors.js</b> в корне проекта.
      </p>
    </div>
  `;
}

function renderNotes(root) {
  root.innerHTML = `
    <h1>Заметки</h1>
    <div class="card">
      <p class="muted">Личные заметки. (Дальше добавим сохранение в localStorage.)</p>
    </div>
  `;
}

function renderProgress(root) {
  root.innerHTML = `
    <h1>Прогресс</h1>
    <div class="card">
      <p class="muted">Здесь будет статистика: пройдено правил, тесты, повторения, streak.</p>
    </div>
  `;
}

function renderRepeat(root) {
  root.innerHTML = `
    <h1>Повторение</h1>
    <div class="card">
      <p class="muted">Интервальное повторение (SRS) подключим дальше.</p>
    </div>
  `;
}

function renderCards(root) {
  root.innerHTML = `
    <h1>Карточки</h1>
    <div class="card">
      <p class="muted">Карточки по правилам таджвида и примерам.</p>
    </div>
  `;
}

function renderSettings(root) {
  root.innerHTML = `
    <h1>Настройки</h1>
    <div class="card">
      <p class="muted">Здесь будут настройки: язык, метод намаза, уведомления и т.д.</p>
    </div>
  `;
}

/* =========================
   Helpers
========================= */
function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
