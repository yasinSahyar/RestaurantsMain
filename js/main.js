window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }
}
const checkbox = document.getElementById("checkbox")
checkbox.addEventListener("change", () => {
    toogleDark();
});

function toogleDark() {
    document.body.classList.toggle("dark");
    document.documentElement.classList.toggle('dark');
    let resarea = document.querySelector('.restaurant');
    resarea.forEach(function(elem){
        elem.classList

    });
}
