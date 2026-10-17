/* Entrada do site: fundo interativo (partículas que reagem ao mouse/dedo),
   tela de abertura e duas perguntas rápidas que já filtram o catálogo.
   Aparece uma vez por sessão. Para desligar: apague a linha <script src="intro.js"> do index.html. */
(function () {
  "use strict";
  var G = window.GAMES || [];
  var h = document.documentElement;
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- fundo interativo ---------- */
  var cv = document.getElementById("fx");
  if (cv && cv.getContext) {
    var cx = cv.getContext("2d"), W = 0, H = 0, dpr = 1, P = [], mx = -9999, my = -9999, rodando = false;
    var N = function () { return Math.min(70, Math.round(W * H / 22000)); };
    var start = function () {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = N(); P = [];
      for (var i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 });
    };
    var quadro = function () {
      rodando = false;
      if (document.hidden || h.classList.contains("boss-on")) return;
      cx.clearRect(0, 0, W, H);
      for (var i = 0; i < P.length; i++) {
        var a = P[i], dx = a.x - mx, dy = a.y - my, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 140 && d > 0) { a.vx += dx / d * .06; a.vy += dy / d * .06; }
        a.vx *= .985; a.vy *= .985;
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0) a.x = W; else if (a.x > W) a.x = 0;
        if (a.y < 0) a.y = H; else if (a.y > H) a.y = 0;
        for (var j = i + 1; j < P.length; j++) {
          var b = P[j], ex = a.x - b.x, ey = a.y - b.y, dd = ex * ex + ey * ey;
          if (dd < 11000) {
            cx.strokeStyle = "rgba(61,242,166," + (0.16 * (1 - dd / 11000)) + ")";
            cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
          }
        }
        cx.fillStyle = d < 140 ? "rgba(61,242,166,.85)" : "rgba(143,154,167,.5)";
        cx.beginPath(); cx.arc(a.x, a.y, d < 140 ? 2.2 : 1.4, 0, 6.3); cx.fill();
      }
      if (!reduce) pedir();
    };
    var pedir = function () { if (!rodando) { rodando = true; requestAnimationFrame(quadro); } };
    start(); pedir();
    var rt = 0;
    addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { start(); pedir(); }, 150); });
    addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    addEventListener("touchstart", function (e) { var p = e.touches[0]; mx = p.clientX; my = p.clientY - 60; }, { passive: true });
    addEventListener("touchmove", function (e) { var p = e.touches[0]; mx = p.clientX; my = p.clientY - 60; }, { passive: true });
    addEventListener("touchend", function () { mx = my = -9999; }, { passive: true });
    document.addEventListener("visibilitychange", pedir);
    new MutationObserver(pedir).observe(h, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- tela de abertura ---------- */
  var visto = false;
  try { visto = sessionStorage.getItem("intro") === "1"; } catch (e) {}
  if (visto || location.hash.length > 1 || !G.length) return; // link já filtrado: vai direto ao catálogo
  var app = document.getElementById("app");
  var el = document.createElement("div");
  el.id = "intro"; el.className = "intro";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Boas-vindas");
  document.body.appendChild(el);
  if (app) app.setAttribute("inert", "");

  var cats = [], cont = {};
  G.forEach(function (g) { if (cont[g.categoria] === undefined) { cats.push(g.categoria); cont[g.categoria] = 0; } cont[g.categoria]++; });
  var escolha = null, passo = 0;

  function sair(filtro) {
    try { sessionStorage.setItem("intro", "1"); } catch (e) {}
    el.classList.add("fim");
    if (app) app.removeAttribute("inert");
    setTimeout(function () { el.remove(); }, 400);
    if (filtro) {
      location.hash = "c=" + encodeURIComponent(filtro); // o catálogo já escuta a mudança do hash
    }
    setTimeout(function () { dica(filtro); }, 60);
  }
  function dica(filtro) {
    var rows = [].slice.call(document.querySelectorAll("#list .row:not(.off)"));
    if (!rows.length) return;
    var r = rows[Math.floor(Math.random() * rows.length)];
    r.classList.add("dica");
    try { r.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); } catch (e) {}
    var t = document.getElementById("toast");
    if (t) { t.textContent = "Sugestão: " + r.dataset.nome; t.classList.add("show"); setTimeout(function () { t.classList.remove("show"); }, 2600); }
    setTimeout(function () { r.classList.remove("dica"); }, 4000);
  }

  function pontos() {
    return '<div class="dots" aria-hidden="true">' + [0, 1, 2].map(function (i) { return '<i' + (i === passo ? ' class="on"' : "") + "></i>"; }).join("") + "</div>";
  }
  function desenhar() {
    var html = '<button class="pular" type="button" data-a="pular">Pular</button><div class="box">';
    if (passo === 0) {
      var t = "Jogos no navegador";
      html += '<p class="ola">Bem-vindo</p><h2 class="grande" aria-label="' + t + '">' +
        t.split("").map(function (c, i) { return '<span style="--i:' + i + '" aria-hidden="true">' + (c === " " ? "&nbsp;" : c) + "</span>"; }).join("") +
        '</h2><p class="sub2">Clássicos direto na aba, sem instalar nada.</p>' +
        '<button class="bt" type="button" data-a="entrar">Entrar</button>';
    } else if (passo === 1) {
      html += '<p class="ola">Pergunta 1 de 2</p><h2>O que você quer jogar hoje?</h2><div class="chips">' +
        cats.map(function (c) { return '<button type="button" data-a="cat" data-v="' + c.replace(/"/g, "&quot;") + '">' + c + "<small>" + cont[c] + "</small></button>"; }).join("") +
        '<button type="button" data-a="cat" data-v="">Qualquer um</button></div>';
    } else {
      html += '<p class="ola">Pergunta 2 de 2</p><h2>Quer música enquanto joga?</h2><div class="chips duas">' +
        '<button type="button" data-a="musica" data-v="1">Sim, funk</button>' +
        '<button type="button" data-a="musica" data-v="0">Não, só jogar</button></div>';
    }
    html += pontos() + "</div>";
    el.innerHTML = html;
    var b = el.querySelector(".bt, .chips button");
    if (b) b.focus({ preventScroll: true });
  }
  el.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var a = b.dataset.a;
    if (a === "pular") sair(null);
    else if (a === "entrar") { passo = 1; desenhar(); }
    else if (a === "cat") { escolha = b.dataset.v || null; passo = 2; desenhar(); }
    else if (a === "musica") {
      if (b.dataset.v === "1") window.dispatchEvent(new Event("mp:abrir"));
      sair(escolha);
    }
  });
  desenhar();
})();
