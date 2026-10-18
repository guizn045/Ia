(function () {
  "use strict";

  var G = window.GAMES || [];
  var root = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- armazenamento (pode estar bloqueado, então tudo com try/catch) ---------- */
  function ler(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function novoId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
  // mesma pessoa = mesmo id, para atualizar a página não somar de novo no "jogando agora"
  var id = (function () {
    try { var v = localStorage.getItem("jid"); if (!v) { v = novoId(); localStorage.setItem("jid", v); } return v; }
    catch (e) { return novoId(); }
  })();

  /* ---------- estado ---------- */
  var byName = {}, cats = [];
  G.forEach(function (g) {
    byName[g.nome] = g;
    if (cats.indexOf(g.categoria) < 0) cats.push(g.categoria);
  });
  var st = {}, plays = {}, online = null, hasStats = false, busy = false;
  var favLista = ler("fav", []);
  var favs = new Set(Array.isArray(favLista) ? favLista : []);
  var last = ler("last", null);
  var cat = "Todos", q = "", sel = -1, list = [], sort = "plays", soNoAr = ler("so", false) === true;
  var semArte = {}; // jogos cuja imagem de capa não carregou (voltam para a capa gerada)

  // filtros na URL: #c=Terror&q=quake&o=az (dá para mandar o link já filtrado)
  function lerHash() {
    var p = new URLSearchParams(location.hash.slice(1)), c = p.get("c"), o = p.get("o");
    cat = (c === "fav" || cats.indexOf(c) > -1) ? c : "Todos";
    q = p.get("q") || "";
    sort = (o === "az" || o === "plays") ? o : (ler("ord", "plays") === "az" ? "az" : "plays");
    sel = -1;
  }
  lerHash();
  function salvarHash() {
    var p = new URLSearchParams();
    if (cat !== "Todos") p.set("c", cat);
    if (q) p.set("q", q);
    if (sort !== "plays") p.set("o", sort);
    var h = p.toString();
    try { history.replaceState(null, "", h ? "#" + h : location.pathname + location.search); } catch (e) {}
  }

  /* ---------- utilidades ---------- */
  function norm(t) { return String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtPlays(p) {
    if (!hasStats) return ""; // contador fora do ar: não mostra "Sem partidas" falso
    return p ? p.toLocaleString("pt-BR") + (p === 1 ? " partida" : " partidas") : "Sem partidas";
  }
  function statusDe(g) {
    var s = st[g.url];
    return s === undefined ? ["chk", "Verificando"] : s === null ? ["chk", "Sem verificação"] : s ? ["ok", "No ar"] : ["bad", "Fora do ar"];
  }
  function toast(t) {
    var e = $("#toast");
    e.textContent = t;
    e.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { e.classList.remove("show"); }, 1800);
  }
  var ESTRELA = function (cheia) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8z" fill="' +
      (cheia ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  };

  var ICONE_LINK = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';

  /* capa de cada jogo: cor pela categoria, com uma pequena variação pelo nome */
  var MATIZ = { "FPS": 8, "Terror": 350, "Skate": 195, "Aventura": 32, "Esporte": 150, "RPG": 22, "Estratégia": 262, "Plataforma": 330, "Corrida": 48 };
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function capa(g) {
    var n = hash(g.nome), h = MATIZ[g.categoria];
    if (h === undefined) h = hash(g.categoria || "") % 360;
    h = (h + (n % 17) - 8 + 360) % 360;
    return "--h:" + h + ";--a:" + (110 + n % 100) + "deg;--ox:" + (10 + n % 70) + "%";
  }
  function inicial(g) { var m = g.nome.match(/[A-Za-z0-9]/); return m ? m[0].toUpperCase() : "?"; }

  /* ---------- desenho ---------- */
  function favCount() { return G.filter(function (g) { return favs.has(g.nome); }).length; }

  function tabs() {
    var items = [["Todos", "Todos", G.length], ["fav", "Favoritos", favCount()]];
    cats.forEach(function (c) {
      items.push([c, c, G.filter(function (g) { return g.categoria === c; }).length]);
    });
    $("#tabs").innerHTML = items.map(function (i) {
      var on = cat === i[0];
      return '<button type="button" data-k="' + esc(i[0]) + '"' + (on ? ' class="on" aria-current="true"' : "") + ">" +
        esc(i[1]) + "<small>" + i[2] + "</small></button>";
    }).join("");
  }

  function visiveis() {
    var nq = norm(q.trim());
    var f = G.filter(function (g) {
      if (cat === "fav" && !favs.has(g.nome)) return false;
      if (cat !== "Todos" && cat !== "fav" && g.categoria !== cat) return false;
      if (soNoAr && st[g.url] === false) return false;
      return !nq || norm(g.nome + " " + g.categoria + " " + (g.desc || "")).indexOf(nq) > -1;
    });
    f.sort(function (a, b) {
      if (sort === "plays") { var d = (plays[b.nome] || 0) - (plays[a.nome] || 0); if (d) return d; }
      return a.nome.localeCompare(b.nome, "pt");
    });
    return f;
  }

  function render() {
    // mantém o foco no mesmo botão depois de redesenhar a lista
    var ae = document.activeElement, fk = null;
    if (ae && ae.dataset && ae.dataset.a && ae.closest) {
      var rr = ae.closest(".row");
      if (rr) fk = [rr.dataset.nome, ae.dataset.a];
    }
    list = visiveis();
    if (sel >= list.length) sel = list.length - 1;
    $("#count").textContent = list.length + (list.length === 1 ? " jogo" : " jogos");
    $("#ord").textContent = sort === "plays" ? "Mais jogados" : "A a Z";
    $("#ord").title = "Trocar a ordem da lista";

    var h = "";
    list.forEach(function (g, i) {
      var s = statusDe(g), off = st[g.url] === false, fav = favs.has(g.nome), img = g.img && !semArte[g.nome];
      h += '<li class="row' + (off ? " off" : "") + (i === sel ? " sel" : "") + '" data-nome="' + esc(g.nome) + '">' +
        '<div class="cover' + (img ? " has-img" : "") + '" style="' + capa(g) + '">' +
        (img ? '<img class="art" src="' + esc(g.img) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"' + (g.pos ? ' style="object-position:' + esc(g.pos) + '"' : "") + ">" : "") +
        '<span class="mono" aria-hidden="true">' + inicial(g) + "</span>" +
        '<span class="cat">' + esc(g.categoria) + "</span>" +
        '<button type="button" class="fav" data-a="fav" aria-pressed="' + fav + '" aria-label="' + (fav ? "Tirar dos favoritos: " : "Favoritar: ") + esc(g.nome) + '">' + ESTRELA(fav) + "</button>" +
        "</div>" +
        '<div class="body"><h2>' + esc(g.nome) + "</h2><p>" + esc(g.desc || "") + "</p>" +
        '<div class="meta"><span class="st ' + s[0] + '"><i></i>' + s[1] + "</span>" +
        '<span class="pl">' + fmtPlays(plays[g.nome] || 0) + "</span></div>" +
        '<div class="acts">' +
        '<a class="go" data-a="go" href="' + esc(g.url) + '" target="_blank" rel="noopener">' + (off ? "Tentar" : "Jogar") + "</a>" +
        '<button type="button" class="cp" data-a="cp" title="Copiar link" aria-label="Copiar link de ' + esc(g.nome) + '">' + ICONE_LINK + "</button>" +
        "</div></div></li>";
    });
    $("#list").innerHTML = h || '<li class="none">' +
      (cat === "fav" ? "Nenhum favorito ainda. Toque na estrela de um jogo para guardá-lo aqui." : "Nenhum jogo encontrado. Tente outra palavra ou outra categoria.") + "</li>";

    if (fk) {
      var rows = $("#list").children;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].dataset.nome === fk[0]) {
          var el = rows[i].querySelector('[data-a="' + fk[1] + '"]');
          if (el) el.focus({ preventScroll: true });
        }
      }
    }
  }

  // atualiza status e partidas sem reordenar (as linhas não pulam debaixo do dedo)
  function meta() {
    var rows = $("#list").children;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], g = byName[r.dataset.nome];
      if (!g) continue;
      var s = statusDe(g), off = st[g.url] === false;
      r.classList.toggle("off", off);
      var e = r.querySelector(".st");
      e.className = "st " + s[0];
      e.innerHTML = "<i></i>" + s[1];
      r.querySelector(".pl").textContent = fmtPlays(plays[g.nome] || 0);
      r.querySelector(".go").textContent = off ? "Tentar" : "Jogar";
    }
  }

  function live() {
    var p = [];
    if (online !== null) p.push(online + (online === 1 ? " pessoa jogando agora" : " pessoas jogando agora"));
    if (hasStats) {
      var tot = Object.keys(plays).reduce(function (a, k) { return a + plays[k]; }, 0);
      p.push(tot.toLocaleString("pt-BR") + (tot === 1 ? " partida no total" : " partidas no total"));
    }
    if (Object.keys(st).length) {
      p.push(G.filter(function (g) { return st[g.url]; }).length + " de " + G.length + " no ar");
    }
    $("#live").innerHTML = (p.length ? p : ["Carregando…"]).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
    var primeiro = $("#live").firstElementChild;
    if (primeiro && online !== null) primeiro.classList.add("on"); // bolinha verde no "jogando agora"
  }

  function mostrarUltimo() {
    var a = $("#last");
    if (last && byName[last.nome]) {
      a.hidden = false;
      a.href = byName[last.nome].url;
      a.textContent = "Continuar: " + last.nome;
    } else a.hidden = true;
  }

  /* ---------- rede ---------- */
  function ping(game) {
    return fetch("/api/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, game: game }), keepalive: true })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) { // Redis fora do ar ou limite: esconde o contador em vez de mostrar zero
          if (d && d.why === "limite") return;
          if (hasStats || online !== null) { hasStats = false; online = null; meta(); live(); }
          return;
        }
        plays = d.plays || {}; online = d.online; hasStats = true;
        if (!ping.f) { ping.f = 1; render(); } else meta(); // só reordena na primeira vez
        live();
      })
      .catch(function () {});
  }

  function check(fresh) {
    if (busy) return Promise.resolve();
    busy = true; $("#ref").disabled = true;
    return fetch("/api/status" + (fresh ? "?t=" + Date.now() : ""))
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { st = d; })
      .catch(function () { // sem servidor (ex.: GitHub Pages): cada navegador testa por conta própria
        return Promise.all(G.map(function (g) {
          var c = new AbortController(), t = setTimeout(function () { c.abort(); }, 8000);
          return fetch(g.url, { mode: "no-cors", signal: c.signal })
            .then(function () { st[g.url] = true; }, function () { st[g.url] = false; })
            .then(function () { clearTimeout(t); });
        }));
      })
      .then(function () { busy = false; $("#ref").disabled = false; meta(); live(); if (soNoAr) render(); });
  }

  /* ---------- ações ---------- */
  function copiar(url) {
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
      .then(function () { toast("Link copiado"); })
      .catch(function () { prompt("Copie o link:", url); });
  }
  function jogou(g) {
    ping(g.nome);
    last = { nome: g.nome };
    gravar("last", last);
    mostrarUltimo();
  }
  function favoritar(nome) {
    if (favs.has(nome)) { favs.delete(nome); toast("Removido dos favoritos"); }
    else { favs.add(nome); toast("Adicionado aos favoritos"); }
    gravar("fav", Array.from(favs));
    tabs(); render();
  }
  function marcar(i) {
    sel = i;
    var rows = $("#list").children;
    for (var k = 0; k < rows.length; k++) rows[k].classList.toggle("sel", k === i);
    if (rows[i]) rows[i].scrollIntoView({ block: "nearest" });
  }
  function sortear() {
    var pool = list.filter(function (g) { return st[g.url] !== false; });
    if (!pool.length) pool = list;
    if (!pool.length) { toast("Não há jogos para sortear aqui"); return; }
    var g = pool[Math.floor(Math.random() * pool.length)];
    sel = list.indexOf(g);
    render();
    var r = $("#list").children[sel];
    r.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    var go = r.querySelector(".go");
    if (go) go.focus({ preventScroll: true });
    toast("Sorteado: " + g.nome);
  }

  /* ---------- cor da barra do navegador ---------- */
  function corDaBarra() { return "#0a0c0f"; }
  function definirCorDaBarra(c) {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", c);
  }

  /* ---------- modo privacidade ("boss key") ----------
     Esc ou o botão do canto escondem tudo e mostram uma tela em branco com um indicador estático.
     Para voltar: Esc de novo, ou dois toques/cliques seguidos no canto inferior direito da tela. */
  var oculta = false, yGuardado = 0, tituloGuardado = document.title, toqueAnterior = 0;
  function ocultar(ligar) {
    if (ligar === undefined) ligar = !oculta;
    if (ligar === oculta) return;
    oculta = ligar;
    if (ligar) {
      yGuardado = window.scrollY;
      tituloGuardado = document.title;
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      root.classList.add("boss-on");
      document.title = "Documento sem título";
      definirCorDaBarra("#ffffff");
    } else {
      root.classList.remove("boss-on");
      document.title = tituloGuardado;
      definirCorDaBarra(corDaBarra());
      window.scrollTo(0, yGuardado);
    }
  }

  /* ---------- eventos ---------- */
  $("#list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-a]");
    if (!b) return;
    var g = byName[b.closest(".row").dataset.nome], a = b.dataset.a;
    if (a === "go") jogou(g);
    else if (a === "fav") favoritar(g.nome);
    else if (a === "cp") copiar(g.url);
  });
  // se a imagem de capa não carregar, volta para a capa gerada (o evento "error" não sobe, por isso a captura)
  $("#list").addEventListener("error", function (e) {
    var im = e.target;
    if (!im || im.className !== "art") return;
    var r = im.closest(".row");
    if (r) { semArte[r.dataset.nome] = true; r.querySelector(".cover").classList.remove("has-img"); }
    im.remove();
  }, true);
  $("#tabs").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    cat = b.dataset.k; sel = -1;
    tabs(); render(); salvarHash();
  });
  $("#q").addEventListener("input", function (e) { q = e.target.value; sel = -1; render(); salvarHash(); });
  $("#ord").addEventListener("click", function () {
    sort = sort === "plays" ? "az" : "plays";
    gravar("ord", sort); render(); salvarHash();
  });
  $("#ref").addEventListener("click", function () { toast("Verificando os jogos"); check(true); });
  $("#sorteio").addEventListener("click", sortear);
  function marcarSo() { var b = $("#so"); b.setAttribute("aria-pressed", soNoAr ? "true" : "false"); }
  marcarSo();
  $("#so").addEventListener("click", function () { soNoAr = !soNoAr; gravar("so", soNoAr); marcarSo(); sel = -1; render(); });
  $("#share").addEventListener("click", function () {
    var url = location.href;
    if (navigator.share) navigator.share({ title: document.title, url: url }).catch(function () {});
    else copiar(url);
  });
  $("#last").addEventListener("click", function () { if (last) ping(last.nome); });
  $("#avisoX").addEventListener("click", function () {
    root.setAttribute("data-aviso", "off");
    try { sessionStorage.setItem("aviso", "off"); } catch (e) {}
  });
  window.addEventListener("hashchange", function () { lerHash(); $("#q").value = q; tabs(); render(); });
  $("#boss").addEventListener("click", function () { ocultar(true); });
  $("#hot").addEventListener("click", function () {
    var agora = Date.now();
    if (agora - toqueAnterior < 450) { toqueAnterior = 0; ocultar(false); }
    else toqueAnterior = agora;
  });

  document.addEventListener("keydown", function (e) {
    // Esc vale em qualquer lugar, até dentro da busca
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      if (!e.repeat) ocultar();
      return;
    }
    if (oculta || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, digitando = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    if (digitando) { if (e.key === "Enter") t.blur(); return; }
    var k = e.key;
    if (k === "/") { e.preventDefault(); $("#q").focus(); }
    else if (k === "j" || k === "ArrowDown") { if (list.length) { e.preventDefault(); marcar(sel < 0 ? 0 : Math.min(list.length - 1, sel + 1)); } }
    else if (k === "k" || k === "ArrowUp") { if (list.length) { e.preventDefault(); marcar(sel < 0 ? list.length - 1 : Math.max(0, sel - 1)); } }
    else if (k === "Enter") {
      if (sel >= 0 && document.activeElement === document.body) { var go = $("#list").children[sel].querySelector(".go"); if (go) go.click(); }
    }
    else if (k === "f") { if (sel >= 0 && list[sel]) favoritar(list[sel].nome); else toast("Escolha um jogo com j ou k antes"); }
    else if (k === "r") sortear();
  });

  /* ---------- início ---------- */
  $("#q").value = q;
  tabs(); render(); mostrarUltimo(); live();
  check(); ping();
  setInterval(function () { ping(); }, 30000);
  setInterval(function () { check(); }, 300000);
})();
