/* Modo discreto: tecla D. Escurece, embaça e distorce as cores da tela inteira,
   deixando só um círculo nítido em volta do mouse (ou do dedo). */
(function () {
  var v = document.getElementById("veu"); if (!v) return;
  var h = document.documentElement, x = innerWidth / 2, y = innerHeight / 3, quadro = 0;
  function pos() {
    quadro = 0;
    v.style.setProperty("--x", x + "px");
    v.style.setProperty("--y", y + "px");
  }
  function mover(px, py) { x = px; y = py; if (!quadro) quadro = requestAnimationFrame(pos); }
  function ligar(on) {
    h.classList.toggle("discreto", on);
    var b = document.getElementById("disc"); if (b) b.setAttribute("aria-pressed", on ? "true" : "false");
    pos();
    var t = document.getElementById("toast");
    if (t) { t.textContent = on ? "Modo discreto ligado (D para sair)" : "Modo discreto desligado"; t.classList.add("show"); clearTimeout(ligar.t); ligar.t = setTimeout(function () { t.classList.remove("show"); }, 1500); }
  }
  var tt = 0;
  addEventListener("mousemove", function (e) { if (Date.now() - tt < 800) return; mover(e.clientX, e.clientY); }, { passive: true });
  addEventListener("touchstart", function (e) { tt = Date.now(); var p = e.touches[0]; mover(p.clientX, p.clientY - 80); }, { passive: true });
  addEventListener("touchmove", function (e) { tt = Date.now(); var p = e.touches[0]; mover(p.clientX, p.clientY - 80); }, { passive: true });
  var bt = document.getElementById("disc");
  if (bt) bt.addEventListener("click", function () { ligar(!h.classList.contains("discreto")); });
  document.addEventListener("keydown", function (e) {
    if ((e.key !== "d" && e.key !== "D") || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (h.classList.contains("boss-on")) return;
    ligar(!h.classList.contains("discreto"));
  });
})();
