import { applyTajweed } from "../tajweed/tajweedHighlighter.js";
import data from "./azkar.json" assert { type: "json" };

export function renderAzkar(root){
  root.innerHTML="<h1>Азкары</h1>";
  Object.entries(data).forEach(([cat,list])=>{
    root.innerHTML+=`<h3>${cat}</h3>`;
    list.forEach(a=>{
      root.innerHTML+=`
        <div class='card'>
          <div class='arabic'>${applyTajweed(a.arabic)}</div>
          <div class='translit'>${a.translit}</div>
          <div class='translation'>${a.translation}</div>
        </div>`;
    });
  });
}
