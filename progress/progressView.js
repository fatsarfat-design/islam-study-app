export function renderProgress(root){
  root.innerHTML = `
    <h1>Прогресс</h1>
    <div class="card">
      <p>Ваш прогресс обучения.</p>
    </div>
  `;
}

export function trackEvent(type, meta){
  console.log("TRACK:", type, meta);
}
