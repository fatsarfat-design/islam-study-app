/* =========================
   namaz/namazView.js
   - Accurate prayer times using Adhan (batoulapps/adhan)
   - Uses device geolocation (with manual fallback)
   - Countdown to next prayer
   - Optional cross-check via AlAdhan API
========================= */

const ADHAN_ESM_URL = "https://cdn.jsdelivr.net/npm/adhan@4.4.3/lib/bundles/adhan.esm.min.js";

// Lazy-loaded module cache
let _adhan = null;

async function loadAdhan() {
  if (_adhan) return _adhan;
  _adhan = await import(ADHAN_ESM_URL);
  return _adhan;
}

const METHODS = [
  { id: "MuslimWorldLeague", label: "Muslim World League (MWL)" },
  { id: "Egyptian", label: "Egyptian General Authority" },
  { id: "Karachi", label: "University of Islamic Sciences, Karachi" },
  { id: "UmmAlQura", label: "Umm al-Qura (Makkah)" },
  { id: "Dubai", label: "Dubai" },
  { id: "MoonsightingCommittee", label: "Moonsighting Committee" },
  { id: "NorthAmerica", label: "ISNA (North America)" },
  { id: "Kuwait", label: "Kuwait" },
  { id: "Qatar", label: "Qatar" },
  { id: "Singapore", label: "Singapore" },
  { id: "Tehran", label: "Tehran" },
  { id: "Turkey", label: "Turkey (Diyanet)" }
];

// AlAdhan method IDs (rough mapping to the closest)
const ALADHAN_METHOD_MAP = {
  MuslimWorldLeague: 3,
  Egyptian: 5,
  Karachi: 1,
  UmmAlQura: 4,
  Dubai: 16, // not always available; fallback handled
  MoonsightingCommittee: 15,
  NorthAmerica: 2,
  Kuwait: 9,
  Qatar: 10,
  Singapore: 11,
  Tehran: 7,
  Turkey: 13
};

export async function renderNamaz(root) {
  root.innerHTML = `
    <h1>Намаз</h1>

    <div class="card mushaf-surface">
      <div style="display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap;">
        <div>
          <div class="muted">Локация</div>
          <div id="loc-label" style="font-weight:800;margin-top:2px;">Определяем…</div>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="button secondary small" id="btn-geo">📍 Обновить</button>
          <button class="button secondary small" id="btn-manual">✍️ Вручную</button>
        </div>
      </div>

      <hr/>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <div style="flex:1 1 48%; min-width:160px;">
          <div class="muted">Метод расчёта</div>
          <select id="method" style="width:100%;margin-top:6px;padding:10px;border-radius:12px;border:1px solid rgba(15,23,42,.15)"></select>
        </div>
        <div style="flex:1 1 48%; min-width:160px;">
          <div class="muted">Аср</div>
          <select id="madhab" style="width:100%;margin-top:6px;padding:10px;border-radius:12px;border:1px solid rgba(15,23,42,.15)">
            <option value="Shafi">Шафи (стандарт)</option>
            <option value="Hanafi">Ханафи</option>
          </select>
        </div>
      </div>

      <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
        <div style="flex:1 1 48%; min-width:160px;">
          <div class="muted">Коррекция высоких широт</div>
          <select id="hlr" style="width:100%;margin-top:6px;padding:10px;border-radius:12px;border:1px solid rgba(15,23,42,.15)">
            <option value="MiddleOfTheNight">Середина ночи</option>
            <option value="SeventhOfTheNight">Одна седьмая</option>
            <option value="TwilightAngle">Угловая</option>
          </select>
        </div>
        <div style="flex:1 1 48%; min-width:160px;">
          <div class="muted">Проверка правильности</div>
          <button class="button small" id="btn-check" style="width:100%;">🔎 Сверить с AlAdhan API</button>
          <div id="check-note" class="muted" style="margin-top:6px;"></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="muted">Следующий намаз через</div>
      <div id="countdown" style="font-weight:900;font-size:22px;margin-top:4px;">—</div>
      <div id="next-name" class="muted" style="margin-top:6px;">—</div>
    </div>

    <div id="times"></div>
  `;

  const $ = (sel) => root.querySelector(sel);

  // Fill dropdown
  const methodSel = $("#method");
  METHODS.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.label;
    methodSel.appendChild(opt);
  });

  // Load settings
  const saved = loadSettings();
  methodSel.value = saved.method;
  $("#madhab").value = saved.madhab;
  $("#hlr").value = saved.hlr;

  // Actions
  $("#btn-geo").addEventListener("click", async () => {
    await ensureLocation(true);
    await recompute();
  });

  $("#btn-manual").addEventListener("click", async () => {
    await openManualLocationDialog(root);
    await recompute();
  });

  methodSel.addEventListener("change", () => { saveSettings(); recompute(); });
  $("#madhab").addEventListener("change", () => { saveSettings(); recompute(); });
  $("#hlr").addEventListener("change", () => { saveSettings(); recompute(); });

  $("#btn-check").addEventListener("click", async () => {
    $("#check-note").textContent = "Проверяем…";
    try {
      const loc = await ensureLocation(false);
      const report = await checkWithAlAdhan(loc, getSettings());
      $("#check-note").textContent = report;
    } catch (e) {
      console.error(e);
      $("#check-note").textContent = "Не удалось сверить (нет доступа к сети или локации).";
    }
  });

  // Make sure we have location, then compute
  await ensureLocation(false);
  await recompute();

  // live countdown
  startTicker(root);
}

/* =========================
   Settings
========================= */
function getSettings() {
  const method = document.getElementById("method")?.value || "MoonsightingCommittee";
  const madhab = document.getElementById("madhab")?.value || "Shafi";
  const hlr = document.getElementById("hlr")?.value || "TwilightAngle";
  return { method, madhab, hlr };
}

function saveSettings() {
  const s = getSettings();
  localStorage.setItem("namaz_settings", JSON.stringify(s));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem("namaz_settings");
    if (!raw) return { method: "MoonsightingCommittee", madhab: "Shafi", hlr: "TwilightAngle" };
    const s = JSON.parse(raw);
    return {
      method: s.method || "MoonsightingCommittee",
      madhab: s.madhab || "Shafi",
      hlr: s.hlr || "TwilightAngle"
    };
  } catch {
    return { method: "MoonsightingCommittee", madhab: "Shafi", hlr: "TwilightAngle" };
  }
}

/* =========================
   Location
========================= */
async function ensureLocation(forceRefresh) {
  const saved = loadLocation();
  if (saved && !forceRefresh) {
    setLocLabel(saved);
    return saved;
  }

  // Try geolocation
  try {
    const pos = await getGeoPosition();
    const loc = {
      lat: round6(pos.coords.latitude),
      lon: round6(pos.coords.longitude),
      name: "Текущее местоположение"
    };
    saveLocation(loc);
    setLocLabel(loc);
    return loc;
  } catch (e) {
    console.warn("Geolocation failed:", e);
    if (saved) {
      setLocLabel(saved);
      return saved;
    }
    // fallback to default: Makkah (safe), user can change manually
    const loc = { lat: 21.4225, lon: 39.8262, name: "По умолчанию: Мекка (измени вручную)" };
    saveLocation(loc);
    setLocLabel(loc);
    return loc;
  }
}

function setLocLabel(loc) {
  const el = document.getElementById("loc-label");
  if (!el) return;
  el.textContent = `${loc.name} • ${loc.lat}, ${loc.lon}`;
}

function saveLocation(loc) {
  localStorage.setItem("namaz_location", JSON.stringify(loc));
}

function loadLocation() {
  try {
    const raw = localStorage.getItem("namaz_location");
    if (!raw) return null;
    const loc = JSON.parse(raw);
    if (typeof loc.lat !== "number" || typeof loc.lon !== "number") return null;
    return loc;
  } catch {
    return null;
  }
}

function getGeoPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 300000
    });
  });
}

async function openManualLocationDialog(root) {
  const current = loadLocation() || { lat: "", lon: "", name: "" };

  const overlay = document.createElement("div");
  overlay.className = "tajweed-overlay";
  overlay.innerHTML = `
    <div class="tajweed-popup">
      <h3>Локация вручную</h3>
      <p>Введи координаты. Можно взять из Google Maps: долгота/широта.</p>

      <div class="muted" style="margin-bottom:6px;">Название (опционально)</div>
      <input id="ml-name" value="${escapeHtml(current.name || "")}" placeholder="Например: Пятигорск"
        style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(15,23,42,.15);margin-bottom:10px"/>

      <div style="display:flex; gap:10px;">
        <div style="flex:1;">
          <div class="muted" style="margin-bottom:6px;">Широта (lat)</div>
          <input id="ml-lat" value="${escapeHtml(String(current.lat ?? ""))}" placeholder="например 44.0486"
            style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(15,23,42,.15)"/>
        </div>
        <div style="flex:1;">
          <div class="muted" style="margin-bottom:6px;">Долгота (lon)</div>
          <input id="ml-lon" value="${escapeHtml(String(current.lon ?? ""))}" placeholder="например 43.0594"
            style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(15,23,42,.15)"/>
        </div>
      </div>

      <div style="display:flex; gap:10px; margin-top:12px;">
        <button class="button secondary" id="ml-cancel" style="flex:1;">Отмена</button>
        <button class="button" id="ml-save" style="flex:1;">Сохранить</button>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  root.appendChild(overlay);

  overlay.querySelector("#ml-cancel").addEventListener("click", () => overlay.remove());
  overlay.querySelector("#ml-save").addEventListener("click", () => {
    const name = overlay.querySelector("#ml-name").value.trim() || "Вручную";
    const lat = Number(overlay.querySelector("#ml-lat").value);
    const lon = Number(overlay.querySelector("#ml-lon").value);

    if (!isFinite(lat) || !isFinite(lon)) {
      alert("Проверь координаты: должны быть числа.");
      return;
    }
    const loc = { name, lat: round6(lat), lon: round6(lon) };
    saveLocation(loc);
    setLocLabel(loc);
    overlay.remove();
  });
}

/* =========================
   Compute prayer times
========================= */
async function recompute() {
  const timesRoot = document.getElementById("times");
  if (!timesRoot) return;

  timesRoot.innerHTML = `<p class="muted">Считаем времена…</p>`;

  const adhan = await loadAdhan();
  const loc = await ensureLocation(false);
  const settings = getSettings();

  const coordinates = new adhan.Coordinates(loc.lat, loc.lon);
  const date = new Date();

  const params = adhan.CalculationMethod[settings.method]();
  params.madhab = adhan.Madhab[settings.madhab];
  params.highLatitudeRule = adhan.HighLatitudeRule[settings.hlr];

  const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);

  const rows = [
    { key: "fajr", label: "Фаджр" },
    { key: "sunrise", label: "Восход" },
    { key: "dhuhr", label: "Зухр" },
    { key: "asr", label: "Аср" },
    { key: "maghrib", label: "Магриб" },
    { key: "isha", label: "Иша" }
  ];

  const list = document.createElement("div");
  list.className = "card";
  list.innerHTML = `<div class="muted" style="margin-bottom:10px;">Времена на сегодня</div>`;

  rows.forEach((r) => {
    const t = prayerTimes[r.key];
    list.innerHTML += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid rgba(15,23,42,.06)">
        <div style="font-weight:800;">${r.label}</div>
        <div style="font-weight:900;">${fmtTime(t)}</div>
      </div>
    `;
  });

  timesRoot.innerHTML = "";
  timesRoot.appendChild(list);

  // store computed times for ticker
  window.__namaz_times = {
    prayerTimes,
    params,
    coordinates,
    date: new Date(date.getFullYear(), date.getMonth(), date.getDate())
  };
}

/* =========================
   Countdown ticker
========================= */
function startTicker(root) {
  const cd = root.querySelector("#countdown");
  const nextName = root.querySelector("#next-name");

  if (window.__namaz_ticker) clearInterval(window.__namaz_ticker);

  window.__namaz_ticker = setInterval(async () => {
    try {
      const ctx = window.__namaz_times;
      if (!ctx?.prayerTimes) return;

      const now = new Date();
      const schedule = [
        { name: "Фаджр", time: ctx.prayerTimes.fajr },
        { name: "Зухр", time: ctx.prayerTimes.dhuhr },
        { name: "Аср", time: ctx.prayerTimes.asr },
        { name: "Магриб", time: ctx.prayerTimes.maghrib },
        { name: "Иша", time: ctx.prayerTimes.isha }
      ];

      // find next
      let next = schedule.find((p) => p.time > now);

      // if none, next is tomorrow fajr
      if (!next) {
        const adhan = await loadAdhan();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const pt = new adhan.PrayerTimes(ctx.coordinates, tomorrow, ctx.params);
        next = { name: "Фаджр (завтра)", time: pt.fajr };
      }

      const diffMs = next.time - now;
      cd.textContent = fmtCountdown(diffMs);
      nextName.textContent = `Следующий: ${next.name} в ${fmtTime(next.time)}`;
    } catch (e) {
      console.error(e);
    }
  }, 1000);
}

/* =========================
   Optional check with AlAdhan API
   (helps confirm correctness for the user)
========================= */
async function checkWithAlAdhan(loc, settings) {
  const methodId = ALADHAN_METHOD_MAP[settings.method] ?? 3;
  const school = settings.madhab === "Hanafi" ? 1 : 0;

  const url = `https://api.aladhan.com/v1/timings?latitude=${encodeURIComponent(loc.lat)}&longitude=${encodeURIComponent(loc.lon)}&method=${encodeURIComponent(methodId)}&school=${encodeURIComponent(school)}`;

  const r = await fetch(url);
  if (!r.ok) throw new Error("AlAdhan API failed");
  const j = await r.json();

  const api = j?.data?.timings;
  if (!api) throw new Error("No timings in response");

  const local = window.__namaz_times?.prayerTimes;
  if (!local) return "Локальные времена не готовы.";

  // compare key prayers
  const compare = [
    ["Fajr", local.fajr, "Фаджр"],
    ["Dhuhr", local.dhuhr, "Зухр"],
    ["Asr", local.asr, "Аср"],
    ["Maghrib", local.maghrib, "Магриб"],
    ["Isha", local.isha, "Иша"]
  ];

  const diffs = compare.map(([key, dt, label]) => {
    const apiStr = api[key]; // "HH:MM" (may include timezone suffix)
    const apiHHMM = String(apiStr).slice(0, 5);
    const apiMin = parseHHMM(apiHHMM);
    const localMin = dt.getHours() * 60 + dt.getMinutes();
    const d = localMin - apiMin;
    return { label, d };
  });

  const maxAbs = Math.max(...diffs.map(x => Math.abs(x.d)));
  if (!isFinite(maxAbs)) return "Не удалось сравнить времена.";

  if (maxAbs <= 2) return "✅ Сходится с API (расхождение до 2 минут).";
  return "⚠️ Есть расхождения. Часто это из‑за выбранного метода/школы/высоких широт. Попробуй сменить метод и сверить снова.";
}

/* =========================
   Utils
========================= */
function fmtTime(d) {
  if (!(d instanceof Date)) return "—";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function fmtCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function parseHHMM(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  if (!isFinite(h) || !isFinite(m)) return NaN;
  return h * 60 + m;
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
