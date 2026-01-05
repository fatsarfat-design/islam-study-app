export function applyTajweed(text){
  return text.replace(/([\u0621-\u064A]+)/g, '<span class="tajweed-word">$1</span>');
}
