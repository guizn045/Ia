(function () {
  var GAMES = window.GAMES || [];
  var grade = document.getElementById("grade");
  var busca = document.getElementById("busca");
  var limpar = document.getElementById("limpar");
  var vazio = document.getElementById("vazio");
  var contador = document.getElementById("contador");
  var chipsEl = document.getElementById("chips");
  var toast = document.getElementById("toast");
  var categoriaAtual = "Todos";

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

  function criarCard(g) {
    var card = document.createElement("article");
    card.className = "card";

    var tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = g.categoria || "Web";

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
    a.textContent = "JOGAR ▶";

    var c = document.createElement("button");
    c.className = "copy";
    c.type = "button";
    c.setAttribute("aria-label", "Copiar link de " + g.nome);
    c.textContent = "🔗";
    c.addEventListener("click", function () { copiar(g.url); });

    actions.append(a, c);
    card.append(tag, h2, p, actions);
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
      b.textContent = cat;
      b.addEventListener("click", function () {
        categoriaAtual = cat;
        Array.prototype.forEach.call(chipsEl.children, function (el) {
          el.classList.toggle("active", el.textContent === cat);
        });
        render();
      });
      return b;
    }));
  }

  function render() {
    var q = normalizar(busca.value.trim());
    var lista = GAMES.filter(function (g) {
      var okCat = categoriaAtual === "Todos" || g.categoria === categoriaAtual;
      var texto = normalizar(g.nome + " " + (g.desc || "") + " " + (g.categoria || ""));
      return okCat && texto.indexOf(q) !== -1;
    });

    grade.replaceChildren.apply(grade, lista.map(criarCard));
    vazio.classList.toggle("show", lista.length === 0);
    limpar.classList.toggle("show", busca.value.length > 0);
    contador.textContent = lista.length + (lista.length === 1 ? " jogo" : " jogos");
  }

  busca.addEventListener("input", render);
  limpar.addEventListener("click", function () {
    busca.value = "";
    busca.focus();
    render();
  });

  criarChips();
  render();
})();
