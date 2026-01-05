/* =========================
   Tajweed Highlighter
   Оборачивает совпадения
========================= */

import { TAJWEED_MAP } from "./tajweedMap.js";

export function applyTajweed(text) {
  let result = text;

  TAJWEED_MAP.forEach(rule => {
    result = result.replace(rule.match, match => {
      return `<span class="tajweed-word" data-rule="${rule.rule}">${match}</span>`;
    });
  });

  return result;
}
