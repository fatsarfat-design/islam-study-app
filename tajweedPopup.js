
// Tajweed popup helper
export function showTajweedPopup(rule) {
  const popup = document.createElement('div');
  popup.className = 'tajweed-popup';
  popup.innerHTML = `
    <div class="tajweed-popup-card">
      <h3>Правило таджвида</h3>
      <p>${rule}</p>
      <button id="closeTajweedPopup">Закрыть</button>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById('closeTajweedPopup').onclick = () => {
    popup.remove();
  };
}
