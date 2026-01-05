/* =========================
   exams/examView.js
   Tajweed Exams (local)
   - Levels
   - Questions
   - Score + mistakes
========================= */

const EXAMS = [
  {
    level: 1,
    title: "Базовый таджвид",
    questions: [
      {
        q: "Как называется правило, когда نْ встречается с ب?",
        options: ["Ихфа", "Икляб", "Идгам"],
        answer: 1,
        rule: "Икляб — превращение نْ в мим с гунной перед ب."
      },
      {
        q: "Сколько букв идгама с гунной?",
        options: ["2", "4", "6"],
        answer: 1,
        rule: "Йа, Нун, Мим, Вау — 4 буквы идгама с гунной."
      }
    ]
  },
  {
    level: 2,
    title: "Средний уровень",
    questions: [
      {
        q: "Какие буквы относятся к ихфа?",
        options: ["15 букв", "6 букв", "4 буквы"],
        answer: 0,
        rule: "Ихфа имеет 15 букв."
      }
    ]
  }
];

export function renderExams(root) {
  root.innerHTML = `
    <h1>Экзамены</h1>
    <div id="exam-list"></div>
    <div id="exam-area"></div>
  `;

  const list = root.querySelector("#exam-list");
  EXAMS.forEach((e, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <b>${e.title}</b>
      <div class="muted">Уровень ${e.level}</div>
      <button class="button small" style="margin-top:8px">Начать</button>
    `;
    card.querySelector("button").onclick = () => startExam(root, idx);
    list.appendChild(card);
  });
}

function startExam(root, idx) {
  const exam = EXAMS[idx];
  let current = 0;
  let correct = 0;
  const mistakes = [];

  const area = root.querySelector("#exam-area");
  area.innerHTML = `<div class="card"><b>${exam.title}</b></div>`;

  const renderQ = () => {
    const q = exam.questions[current];
    area.innerHTML = `
      <div class="card">
        <div style="font-weight:800">${q.q}</div>
        <div id="opts" style="margin-top:10px"></div>
      </div>
    `;
    const opts = area.querySelector("#opts");
    q.options.forEach((o, i) => {
      const btn = document.createElement("button");
      btn.className = "button secondary small";
      btn.style.margin = "6px 0";
      btn.textContent = o;
      btn.onclick = () => {
        if (i === q.answer) correct++;
        else mistakes.push({ q: q.q, rule: q.rule });
        current++;
        if (current < exam.questions.length) renderQ();
        else finish();
      };
      opts.appendChild(btn);
    });
  };

  const finish = () => {
    area.innerHTML = `
      <div class="card mushaf-surface">
        <h3>Результат</h3>
        <div style="font-weight:900;font-size:22px">${correct} / ${exam.questions.length}</div>
      </div>
      ${mistakes.map(m => `
        <div class="card">
          <b>${m.q}</b>
          <div class="muted">${m.rule}</div>
        </div>
      `).join("")}
    `;
  };

  renderQ();
}
