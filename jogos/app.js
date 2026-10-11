const $=s=>document.querySelector(s),G=window.GAMES;
const C={FPS:["#ff3d9a","🎯"],Skate:["#27e1ff","🛹"],Aventura:["#ffb52e","🧭"],Esporte:["#3dff8b","⚽"],RPG:["#b987ff","⚔️"],"Estratégia":["#ff7a45","♟️"]};
const col=g=>(C[g.categoria]||["#27e1ff"])[0];
const norm=t=>t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const novoId=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const id=(()=>{try{let v=localStorage.getItem("jid");if(!v){v=novoId();localStorage.setItem("jid",v)}return v}catch(e){return novoId()}})();
let cat="Todos",sort="plays",q="",st={},plays={},busy=false;

function chips(){
  const cats=["Todos",...new Set(G.map(g=>g.categoria))];
  $("#chips").innerHTML=cats.map(c=>{
    const n=c=="Todos"?G.length:G.filter(g=>g.categoria==c).length;
    const i=c=="Todos"?"🎮":(C[c]||[0,"🎮"])[1],k=(C[c]||[])[0]||"#27e1ff";
    return `<button data-k="${c}" style="--c:${k}" class="${c==cat?"on":""}">${i} ${c} ${n}</button>`;
  }).join("");
}

function render(){
  const f=G.filter(g=>(cat=="Todos"||g.categoria==cat)&&norm(g.nome+" "+g.categoria+" "+g.desc).includes(norm(q)));
  f.sort((a,b)=>sort=="az"?a.nome.localeCompare(b.nome):(plays[b.nome]||0)-(plays[a.nome]||0)||a.nome.localeCompare(b.nome));
  $("#n").textContent=f.length+(f.length==1?" jogo":" jogos");
  $("#grid").innerHTML=f.length?f.map(g=>{
    const s=st[g.url],off=s===false,p=plays[g.nome]||0;
    const stt=s===undefined?["","Verificando"]:s?["ok","Online"]:["no","Fora do ar"];
    return `<article class="card${off?" off":""}" style="--c:${col(g)}">
<div class="top"><span>${(C[g.categoria]||[0,""])[1]} ${g.categoria}</span><span class="st ${stt[0]}"><i></i>${stt[1]}</span></div>
<h2>${g.nome}</h2><p>${g.desc}</p>
<div class="meta">${p?`<b>${p.toLocaleString("pt-BR")}</b> ${p==1?"partida":"partidas"}`:"Ninguém jogou ainda"}</div>
<div class="act"><a class="go" href="${g.url}" target="_blank" rel="noopener" data-p="${g.nome}">${off?"TENTAR MESMO":"JOGAR"}</a><button class="cp" data-c="${g.url}" aria-label="Copiar link de ${g.nome}">Copiar</button></div></article>`;
  }).join(""):`<div class="empty">Nenhum jogo encontrado. Tente outro nome ou categoria.</div>`;
  const up=G.filter(g=>st[g.url]).length,known=Object.keys(st).length;
  $("#up").textContent=known?up+"/"+G.length:"–";
  $("#cnt").textContent=G.length;
}

function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),1800)}

async function ping(game){
  try{
    const r=await fetch("/api/stats",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,game}),keepalive:true});
    const d=await r.json();
    if(!d.ok)return;
    plays=d.plays;
    $("#on").textContent=d.online;
    $("#live").classList.remove("off");
    $("#tot").textContent=Object.values(plays).reduce((a,b)=>a+b,0).toLocaleString("pt-BR");
    if(game||!ping.f){ping.f=1;render()}
  }catch(e){}
}

async function check(fresh){
  if(busy)return;busy=true;$("#ref").disabled=true;
  try{
    const r=await fetch("/api/status"+(fresh?"?t="+Date.now():""));
    if(!r.ok)throw 0;st=await r.json();
  }catch(e){
    await Promise.all(G.map(async g=>{
      const c=new AbortController(),t=setTimeout(()=>c.abort(),8000);
      try{await fetch(g.url,{mode:"no-cors",signal:c.signal});st[g.url]=true}catch(x){st[g.url]=false}
      clearTimeout(t);
    }));
  }
  busy=false;$("#ref").disabled=false;render();
}

$("#chips").onclick=e=>{const b=e.target.closest("button");if(!b)return;cat=b.dataset.k;chips();render()};
$("#q").oninput=e=>{q=e.target.value;render()};
$("#sort").onchange=e=>{sort=e.target.value;render()};
$("#ref").onclick=()=>{toast("Verificando os jogos…");check(true)};
$("#grid").onclick=e=>{
  const a=e.target.closest("[data-p]");
  if(a){ping(a.dataset.p);return}
  const b=e.target.closest("[data-c]");
  if(b){
    const u=b.dataset.c;
    (navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast("Link copiado")).catch(()=>{prompt("Copie o link:",u)});
  }
};
document.addEventListener("keydown",e=>{
  if(e.key=="/"&&document.activeElement!=$("#q")){e.preventDefault();$("#q").focus()}
  else if(e.key=="Escape"){$("#q").value="";q="";$("#q").blur();render()}
});

$("#live").classList.add("off");
chips();render();check();ping();
setInterval(()=>ping(),30000);
setInterval(()=>check(),300000);
