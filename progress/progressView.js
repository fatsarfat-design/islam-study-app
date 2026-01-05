/* =========================
   progress/progressView.js
   Premium Progress dashboard (localStorage)
   - Streak (days in a row)
   - Activity counts
   - Last opened
   - Read Juz set (tracked when user opens a juz)
========================= */

export function renderProgress(root) {
  const stats = computeStats();

  root.innerHTML = `
    <h1>Прогресс</h1>

    <div class="card mushaf-surface">
      <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; justify-content:space-between;">
        <div style="flex:1 1 180px; min-width:160px;">
          <div class="muted">Streak</div>
          <div style="font-weight:900;font-size:28px; margin-top:2px;">${stats.streak} 🔥</div>
          <div class="muted" style="margin-top:4px;">дней подряд</div>
        </div>

        <div style="flex:1 1 180px; min-width:160px;">
          <div class="muted">Последняя активность</div>
          <div style="font-weight:900;font-size:16px; margin-top:2px;">${stats.lastLabel}</div>
          <div class="muted" style="margin-top:4px;">${stats.lastWhen}</div>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="button secondary small" id="btn-export">Экспорт</button>
          <button class="button secondary small" id="btn-reset">Сброс</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;">
        <div><b>Коран</b></div>
        <div style="font-weight:900;">${stats.quranOpens}</div>
      </div>
      <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid rgba(15,23,42,.06)">
        <div><b>Азкары</b></div>
        <div style="font-weight:900;">${stats.azkarOpens}</div>
      </div>
      <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid rgba(15,23,42,.06)">
        <div><b>Таджвид (Теория)</b></div>
        <div style="font-weight:900;">${stats.theoryOpens}</div>
      </div>
      <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid rgba(15,23,42,.06)">
        <div><b>Намаз</b></div>
        <div style="font-weight:900;">${stats.namazOpens}</div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin:0 0 8px;">Прочитанные джузы</h3>
      <div class="muted" style="margin-bottom:10px;">
        Отмечаются автоматически, когда ты открываешь конкретный джуз.
      </div>
      <div id="juz-grid" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
    </div>

    <div class="card">
      <h3 style="margin:0 0 8px;">История (последние 20)</h3>
      <div id="hist" class="muted"></div>
    </div>
  `;

  // Render juz grid
  const grid = root.querySelector("#juz-grid");
  for (let i = 1; i <= 30; i++) {
    const active = stats.readJuz.has(i);
    const pill = document.createElement("div");
    pill.textContent = String(i);
    pill.style.cssText = `
      min-width: 34px;
      text-align:center;
      padding: 8px 10px;
      border-radius: 999px;
      border: 1px solid ${active ? "rgba(21,128,61,.55)" : "rgba(15,23,42,.12)"};
      background: ${active ? "rgba(21,128,61,.12)" : "rgba(255,255,255,.85)"};
      font-weight: ${active ? "900" : "700"};
      color: ${active ? "#0b3d1f" : "rgba(15,23,42,.72)"};
    `;
    grid.appendChild(pill);
  }

  // Render history
  const hist = root.querySelector("#hist");
  if (!stats.history.length) {
    hist.textContent = "Пока нет записей. Открой Коран/Азкары/Теорию — и прогресс начнёт собираться.";
  } else {
    hist.innerHTML = stats.history
      .slice(0, 20)
      .map((e) => `<div style="padding:6px 0;border-top:1px solid rgba(15,23,42,.06)">${escapeHtml(e.label)} • ${escapeHtml(fmtDateTime(e.ts))}</div>`)
      .join("");
  }

  // Export
  root.querySelector("#btn-export").addEventListener("click", () => {
    const payload = exportData();
    downloadJson(payload, "progress-export.json");
  });

  // Reset
  root.querySelector("#btn-reset").addEventListener("click", () => {
    if (!confirm("Сбросить прогресс? Это удалит локальную историю и отметки.")) return;
    localStorage.removeItem("app_activity");
    localStorage.removeItem("quran_read_juz");
    localStorage.removeItem("last_tab");
    alert("Готово. Прогресс сброшен.");
    renderProgress(root);
  });
}

/* =========================
   Stats + storage
========================= */
export function trackEvent(type, meta = {}) {
  const ts = Date.now();
  const label = labelFor(type, meta);

  const history = loadHistory();
  history.unshift({ ts, type, meta, label });
  localStorage.setItem("app_activity", JSON.stringify(history.slice(0, 200))); // cap

  // Track last tab
  if (meta?.tab) localStorage.setItem("last_tab", meta.tab);

  // Track read juz
  if (type === "quran_open_juz" && meta?.juz) {
    const set = loadReadJuz();
    set.add(Number(meta.juz));
    localStorage.setItem("quran_read_juz", JSON.stringify([...set].sort((a,b)=>a-b)));
  }
}

function computeStats() {
  const history = loadHistory();
  const readJuz = loadReadJuz();

  // counts
  const count = (t) => history.filter((e) => e.type === t).length;

  const last = history[0];
  const lastLabel = last ? last.label : "—";
  const lastWhen = last ? humanWhen(last.ts) : "—";

  const streak = computeStreak(history);

  return {
    streak,
    lastLabel,
    lastWhen,
    quranOpens: count("quran_open"),
    azkarOpens: count("azkar_open"),
    theoryOpens: count("theory_open"),
    namazOpens: count("namaz_open"),
    readJuz,
    history
  };
}

function loadHistory() {
  try {
    const raw = localStorage.getItem("app_activity");
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function loadReadJuz() {
  try {
    const raw = localStorage.getItem("quran_read_juz");
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map((x) => Number(x)).filter((x) => isFinite(x)));
  } catch {
    return new Set();
  }
}

function computeStreak(history) {
  // streak = consecutive days with any activity, counting today if present
  if (!history.length) return 0;

  const days = new Set(history.map((e) => dayKey(e.ts)));
  const today = dayKey(Date.now());

  // If no activity today, streak counts up to yesterday only
  let cursor = today;
  let streak = 0;

  // If today is not present, start from yesterday
  if (!days.has(cursor)) cursor = dayKey(Date.now() - 86400000);

  while (days.has(cursor)) {
    streak += 1;
    cursor = prevDayKey(cursor);
  }
  return streak;
}

function dayKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function prevDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return dayKey(dt.getTime());
}

/* =========================
   Labels + formatting
========================= */
function labelFor(type, meta) {
  switch (type) {
    case "quran_open": return "Открыт Коран";
    case "quran_open_juz": return `Открыт джуз ${meta?.juz ?? "?"}`;
    case "azkar_open": return "Открыты Азкары";
    case "theory_open": return "Открыта Теория таджвида";
    case "namaz_open": return "Открыт Намаз";
    default: return "Активность";
  }
}

function fmtDateTime(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dd}.${m}.${y} ${hh}:${mm}`;
}

function humanWhen(ts) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "только что";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} дн назад`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   Export
========================= */
function exportData() {
  return {
    exportedAt: new Date().toISOString(),
    history: loadHistory(),
    quran_read_juz: [...loadReadJuz()].sort((a,b)=>a-b),
    last_tab: localStorage.getItem("last_tab") || null
  };
}

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
