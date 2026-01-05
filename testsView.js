/* =========================
   tests/testsView.js
   Mini-tests (quick drills) — localStorage
   - Categories
   - 5-question quick session
   - Stores best score per category
========================= */

const CATEGORIES = [
  {
    id: "nun_sakin_tanwin",
    title: "Нун сакина и танвин",
    items: [
      q("Какое правило при نْ + ب ?", ["Ихфа", "Икляб", "Изхар"], 1, "Икляб: نْ превращается в мим с гунной перед ب."),
      q("Сколько букв ихфа?", ["15", "6", "4"], 0, "Ихфа имеет 15 букв."),
      q("Какие буквы идгама без гунны?", ["ل ر", "ي ن م و", "ب م"], 0, "Идгам без гунны: ل и ر."),
      q("Какое правило при tanwin + ء ?", ["Изхар", "Идгам", "Ихфа"], 0, "Изхар (горловой) перед ء، ه، ع، ح، غ، خ."),
      q("Сколько букв изхара (горлового)?", ["6", "4", "2"], 0, "Горловых букв 6: ء ه ع ح غ خ.")
    ]
  },
  {
    id: "madd",
    title: "Мадды",
    items: [
      q("Базовая длительность мадда табии?", ["1", "2", "4–5"], 1, "Мадд табии читается 2 хараката."),
      q("Мадд, связанный с хамзой в том же слове:", ["Мадд муттасыль", "Мадд мунфасыль", "Мадд лязим"], 0, "Хамза в том же слове → муттасыль."),
      q("Мадд, где хамза в следующем слове:", ["Муттасыль", "Мунфасыль", "Лязим"], 1, "Хамза в следующем слове → мунфасыль.")
    ]
  },
  {
    id: "qalqalah",
    title: "Калькаля",
    items: [
      q("Буквы калькаля:", ["قطب جد", "يرملون", "ءهعحغخ"], 0, "Калькаля: ق ط ب ج د."),
      q("Сильная калькаля бывает при:", ["шадда/суккун в конце", "танвин", "мадд"], 0, "Сильная: буква калькаля с суккуном/в остановке.")
    ]
  }
];

function q(question, options, answer, explain) {
  return { question, options, answer, explain };
}

export function renderTests(root) {
  root.innerHTML = `
    <h1>Мини-тесты</h1>
    <div class="card">
      <div class="muted">Быстрые тесты на 5 вопросов. Результаты сохраняются локально.</div>
    </div>
    <div id="cats"></div>
    <div id="run"></div>
  `;

  const cats = root.querySelector("#cats");
  CATEGORIES.forEach((c) => {
    const best = getBest(c.id);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
        <div>
          <b>${c.title}</b>
          <div class="muted">Лучший результат: <b>${best ?? "—"}</b></div>
        </div>
        <button class="button small">Старт</button>
      </div>
    `;
    card.querySelector("button").onclick = () => startMiniTest(root, c);
    cats.appendChild(card);
  });
}

function startMiniTest(root, cat) {
  const run = root.querySelector("#run");
  const pool = shuffle([...cat.items]);
  const questions = pool.slice(0, Math.min(5, pool.length));

  let idx = 0;
  let score = 0;
  const mistakes = [];

  const renderQ = () => {
    const cur = questions[idx];
    run.innerHTML = `
      <div class="card mushaf-surface">
        <div class="muted">Категория: <b>${cat.title}</b></div>
        <div class="muted" style="margin-top:6px;">Вопрос ${idx + 1} из ${questions.length}</div>
        <div style="font-weight:900;font-size:16px;margin-top:10px;">${cur.question}</div>
        <div id="opts" style="margin-top:12px;"></div>
      </div>
    `;
    const opts = run.querySelector("#opts");
    cur.options.forEach((text, i) => {
      const btn = document.createElement("button");
      btn.className = "button secondary";
      btn.style.cssText = "width:100%;margin:6px 0;justify-content:flex-start;";
      btn.textContent = text;
      btn.onclick = () => {
        const ok = i === cur.answer;
        if (ok) score++;
        else mistakes.push({ q: cur.question, explain: cur.explain, correct: cur.options[cur.answer] });

        idx++;
        if (idx < questions.length) renderQ();
        else finish();
      };
      opts.appendChild(btn);
    });
  };

  const finish = () => {
    const pct = Math.round((score / questions.length) * 100);
    setBest(cat.id, Math.max(getBest(cat.id) ?? 0, pct));

    run.innerHTML = `
      <div class="card mushaf-surface">
        <h3 style="margin:0 0 8px;">Результат</h3>
        <div style="font-weight:900;font-size:24px;">${score} / ${questions.length} (${pct}%)</div>
        <div class="muted" style="margin-top:6px;">Лучший результат сохранён в этой категории.</div>
        <div style="display:flex;gap:10px;margin-top:12px;">
          <button class="button secondary" id="btn-again" style="flex:1;">Ещё раз</button>
          <button class="button" id="btn-back" style="flex:1;">К категориям</button>
        </div>
      </div>

      ${mistakes.length ? `
        <div class="card">
          <h3 style="margin:0 0 8px;">Ошибки</h3>
          ${mistakes.map(m => `
            <div style="padding:10px 0;border-top:1px solid rgba(15,23,42,.06)">
              <b>${escapeHtml(m.q)}</b>
              <div class="muted" style="margin-top:4px;">Правильно: <b>${escapeHtml(m.correct)}</b></div>
              <div class="muted" style="margin-top:4px;">${escapeHtml(m.explain)}</div>
            </div>
          `).join("")}
        </div>
      ` : ""}
    `;

    run.querySelector("#btn-again").onclick = () => startMiniTest(root, cat);
    run.querySelector("#btn-back").onclick = () => renderTests(root);
  };

  renderQ();
}

function getBest(id) {
  const raw = localStorage.getItem("mini_test_best");
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return obj?.[id] ?? null;
  } catch {
    return null;
  }
}

function setBest(id, value) {
  let obj = {};
  try {
    obj = JSON.parse(localStorage.getItem("mini_test_best") || "{}") || {};
  } catch {
    obj = {};
  }
  obj[id] = value;
  localStorage.setItem("mini_test_best", JSON.stringify(obj));
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
