(function () {
  var GAMES = window.GAMES || [];
  var ICONES = { "FPS": "🎯", "Skate": "🛹", "Aventura": "🗺️", "Esporte": "⚽", "RPG": "⚔️", "Estratégia": "🧠" };
  var TEXTO = { check: "Verificando", on: "Online", off: "Fora do ar" };
  var TIMEOUT_MS = 8000;

  var grade = document.getElementById("grade");
  var busca = document.getElementById("busca");
  var limpar = document.getElementById("limpar");
  var vazio = document.getElementById("vazio");
  var contador = document.getElementById("contador");
  var chipsEl = document.getElementById("chips");
  var toast = document.getElementById("toast");
  var botaoVerificar = document.getElementById("verificar");

  var categoriaAtual = "Todos";
  var status = {}; // índice do jogo -> "check" | "on" | "off"

  function normalizar(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function mostrarToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(mostrarToast.t);
    mostrarToast.t = setTimeout(function () { toast.classList.remove("show"); }, 1600);
  }

  function copiar(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { mostrarToast("Link copiado!"); },
        function () { mostrarToast("Não foi possível copiar"); }
      );
    } else {
      mostrarToast("Não foi possível copiar");
    }
  }

  /* ---------- Status ---------- */

  // Usa no-cors: o navegador não deixa ler o conteúdo, mas se o servidor
  // responder (qualquer resposta) a promessa resolve; se o site estiver fora
  // do ar, sem DNS ou demorar demais, ela falha.
  function checar(url) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    var opcoes = { mode: "no-cors", cache: "no-store" };
    if (ctrl) opcoes.signal = ctrl.signal;
    return fetch(url, opcoes).then(
      function () { clearTimeout(timer); return true; },
      function () { clearTimeout(timer); return false; }
    );
  }

  function aplicarStatus(i) {
    var st = status[i] || "check";
    var card = grade.querySelector('[data-i="' + i + '"]');
    if (card) {
      card.dataset.status = st;
      var badge = card.querySelector(".badge");
      badge.className = "badge " + st;
      badge.querySelector(".txt").textContent = TEXTO[st];
      card.querySelector(".btn").textContent = st === "off" ? "TENTAR MESMO" : "JOGAR ▶";
    }
    atualizarContador();
  }

  function verificarTodos() {
    botaoVerificar.disabled = true;
    GAMES.forEach(function (g, i) { status[i] = "check"; aplicarStatus(i); });
    var tarefas = GAMES.map(function (g, i) {
      return checar(g.url).then(function (ok) {
        status[i] = ok ? "on" : "off";
        aplicarStatus(i);
      });
    });
    return Promise.all(tarefas).then(function () { botaoVerificar.disabled = false; });
  }

  function atualizarContador() {
    var on = 0, off = 0, wait = 0;
    GAMES.forEach(function (g, i) {
      var st = status[i] || "check";
      if (st === "on") on++; else if (st === "off") off++; else wait++;
    });
    var total = grade.children.length;
    var partes = ["<b>" + total + (total === 1 ? " jogo</b>" : " jogos</b>")];
    if (on) partes.push('<span class="on">' + on + " online</span>");
    if (off) partes.push('<span class="off">' + off + " fora do ar</span>");
    if (wait) partes.push(wait + " verificando");
    contador.innerHTML = partes.join(" · ");
  }

  /* ---------- Cards ---------- */

  function criarCard(g, i) {
    var st = status[i] || "check";
    var card = document.createElement("article");
    card.className = "card";
    card.dataset.i = i;
    card.dataset.status = st;

    var top = document.createElement("div");
    top.className = "card-top";

    var tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = (ICONES[g.categoria] ? ICONES[g.categoria] + " " : "") + (g.categoria || "Web");

    var badge = document.createElement("span");
    badge.className = "badge " + st;
    var dot = document.createElement("span");
    dot.className = "dot";
    var txt = document.createElement("span");
    txt.className = "txt";
    txt.textContent = TEXTO[st];
    badge.append(dot, txt);

    top.append(tag, badge);

    var h2 = document.createElement("h2");
    h2.textContent = g.nome;

    var p = document.createElement("p");
    p.textContent = g.desc || "";

    var actions = document.createElement("div");
    actions.className = "actions";

    var a = document.createElement("a");
    a.className = "btn";
    a.href = g.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = st === "off" ? "TENTAR MESMO" : "JOGAR ▶";

    var c = document.createElement("button");
    c.className = "copy";
    c.type = "button";
    c.setAttribute("aria-label", "Copiar link de " + g.nome);
    c.textContent = "🔗";
    c.addEventListener("click", function () { copiar(g.url); });

    actions.append(a, c);
    card.append(top, h2, p, actions);
    return card;
  }

  function criarChips() {
    var cats = ["Todos"];
    GAMES.forEach(function (g) {
      if (g.categoria && cats.indexOf(g.categoria) === -1) cats.push(g.categoria);
    });
    chipsEl.replaceChildren.apply(chipsEl, cats.map(function (cat) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (cat === categoriaAtual ? " active" : "");
      b.textContent = cat === "Todos" ? "Todos" : (ICONES[cat] ? ICONES[cat] + " " : "") + cat;
      b.dataset.cat = cat;
      b.addEventListener("click", function () {
        categoriaAtual = cat;
        Array.prototype.forEach.call(chipsEl.children, function (el) {
          el.classList.toggle("active", el.dataset.cat === cat);
        });
        render();
      });
      return b;
    }));
  }

  function render() {
    var q = normalizar(busca.value.trim());
    var cards = [];
    GAMES.forEach(function (g, i) {
      var okCat = categoriaAtual === "Todos" || g.categoria === categoriaAtual;
      var texto = normalizar(g.nome + " " + (g.desc || "") + " " + (g.categoria || ""));
      if (okCat && texto.indexOf(q) !== -1) cards.push(criarCard(g, i));
    });

    grade.replaceChildren.apply(grade, cards);
    vazio.classList.toggle("show", cards.length === 0);
    limpar.classList.toggle("show", busca.value.length > 0);
    atualizarContador();
  }

  /* ---------- Eventos ---------- */

  busca.addEventListener("input", render);
  limpar.addEventListener("click", function () {
    busca.value = "";
    busca.focus();
    render();
  });
  botaoVerificar.addEventListener("click", verificarTodos);

  // No PC: "/" foca na busca, Esc limpa
  document.addEventListener("keydown", function (e) {
    var digitando = /^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || "");
    if (e.key === "/" && !digitando) {
      e.preventDefault();
      busca.focus();
    } else if (e.key === "Escape" && document.activeElement === busca) {
      busca.value = "";
      render();
      busca.blur();
    }
  });

  criarChips();
  render();
  verificarTodos();
})();
