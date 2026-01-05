/* =========================
   Onboarding logic
========================= */

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    text: `
      <h2>Ас-саляму алейкум 🌙</h2>
      <p>
        Это приложение поможет тебе изучать таджвид,
        читать Коран, делать азкары и отслеживать прогресс —
        от первых шагов до экзаменов.
      </p>
    `
  },
  {
    id: "tabs",
    highlight: "#tabs",
    text: `
      <h2>Навигация</h2>
      <p>
        Здесь находятся все разделы обучения.
        Ты можешь свободно переходить между ними.
      </p>
    `
  },
  {
    id: "theory",
    highlight: 'button[data-tab="theory"]',
    text: `
      <h2>Теория</h2>
      <p>
        В этом разделе собраны правила таджвида —
        основа правильного чтения Корана.
      </p>
    `
  },
  {
    id: "quran",
    highlight: 'button[data-tab="quran"]',
    text: `
      <h2>Коран (30 джузов)</h2>
      <p>
        Читай Коран по джузам.
        Нажимай на слово, чтобы увидеть правило таджвида.
      </p>
    `
  },
  {
    id: "azkar",
    highlight: 'button[data-tab="azkar"]',
    text: `
      <h2>Азкары</h2>
      <p>
        Утренние, вечерние и другие азкары
        с переводом и транскрипцией.
      </p>
    `
  },
  {
    id: "practice",
    highlight: 'button[data-tab="trainer"]',
    text: `
      <h2>Практика</h2>
      <p>
        Тренажёр, мини-тесты и экзамены
        помогут закрепить знания.
      </p>
    `
  },
  {
    id: "repeat",
    highlight: 'button[data-tab="repeat"]',
    text: `
      <h2>Повторение</h2>
      <p>
        Используй карточки и повторение,
        чтобы знания сохранялись надолго.
      </p>
    `
  },
  {
    id: "namaz",
    highlight: 'button[data-tab="namaz"]',
    text: `
      <h2>Намаз</h2>
      <p>
        Здесь ты увидишь точное время намаза
        и отсчёт до следующего.
      </p>
    `
  },
  {
    id: "finish",
    text: `
      <h2>Готово ✨</h2>
      <p>
        Ты можешь учиться в своём темпе
        и настраивать приложение под себя.
      </p>
    `
  }
];

let onboardingIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("onboardingSeen")) {
    startOnboarding();
  }
});

function startOnboarding() {
  renderOnboardingStep();
}

function renderOnboardingStep() {
  const root = document.getElementById("onboarding-root");
  root.innerHTML = "";

  const overlay = document.createElement("div");
  overlay.className = "onboarding-overlay";

  const card = document.createElement("div");
  card.className = "onboarding-card";
  card.innerHTML = ONBOARDING_STEPS[onboardingIndex].text;

  const controls = document.createElement("div");
  controls.className = "onboarding-controls";

  const nextBtn = document.createElement("button");
  nextBtn.textContent =
    onboardingIndex === ONBOARDING_STEPS.length - 1
      ? "Готово"
      : "Далее";
  nextBtn.className = "button";

  nextBtn.onclick = nextStep;

  const skipBtn = document.createElement("button");
  skipBtn.textContent = "Пропустить";
  skipBtn.className = "button secondary";
  skipBtn.onclick = finishOnboarding;

  controls.append(skipBtn, nextBtn);
  card.appendChild(controls);

  overlay.appendChild(card);
  root.appendChild(overlay);

  highlightElement();
}

function nextStep() {
  onboardingIndex++;
  if (onboardingIndex >= ONBOARDING_STEPS.length) {
    finishOnboarding();
  } else {
    renderOnboardingStep();
  }
}

function finishOnboarding() {
  localStorage.setItem("onboardingSeen", "true");
  const root = document.getElementById("onboarding-root");
  root.innerHTML = "";
}

function highlightElement() {
  document
    .querySelectorAll(".onboarding-highlight")
    .forEach(el => el.classList.remove("onboarding-highlight"));

  const step = ONBOARDING_STEPS[onboardingIndex];
  if (!step.highlight) return;

  const el = document.querySelector(step.highlight);
  if (el) {
    el.classList.add("onboarding-highlight");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
