/* Player de música (Spotify). Usa o player oficial incorporado do Spotify. */
(function(){
  var L=window.PLAYLISTS||[];
  var root=document.getElementById("mp"); if(!root||!L.length)return;
  var btn=document.getElementById("mpBtn"), panel=document.getElementById("mpPanel"),
      list=document.getElementById("mpList"), box=document.getElementById("mpEmbed"),
      close=document.getElementById("mpX"), open_=document.getElementById("mpOpen");
  var atual=-1, frame=null;
  function get(){try{return localStorage.getItem("mp")}catch(e){return null}}
  function set(v){try{localStorage.setItem("mp",v)}catch(e){}}
  function url(p){return "https://open.spotify.com/embed/playlist/"+p.id+"?utm_source=generator&theme=0"}
  function marcar(){
    var bs=list.children;
    for(var i=0;i<bs.length;i++){var on=i===atual;bs[i].classList.toggle("on",on);bs[i].setAttribute("aria-pressed",on?"true":"false")}
    btn.classList.toggle("on",atual>=0);
  }
  function escolher(i){
    atual=i; var p=L[i]; set(p.id);
    if(!frame){
      frame=document.createElement("iframe");
      frame.title="Player do Spotify"; frame.height="152"; frame.width="100%";
      frame.setAttribute("allow","autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture");
      frame.loading="lazy"; box.appendChild(frame);
    }
    frame.src=url(p);
    open_.href="https://open.spotify.com/playlist/"+p.id; open_.hidden=false;
    marcar();
  }
  L.forEach(function(p,i){
    var b=document.createElement("button"); b.type="button";
    b.style.setProperty("--h",p.h||150);
    b.innerHTML='<i></i><span><b></b><small></small></span>';
    b.querySelector("b").textContent=p.nome; b.querySelector("small").textContent=p.desc;
    b.addEventListener("click",function(){escolher(i)});
    list.appendChild(b);
  });
  function abrir(v){
    panel.classList.toggle("open",v); btn.setAttribute("aria-expanded",v?"true":"false");
    if(v&&atual<0){var s=get(),i=0;for(var k=0;k<L.length;k++)if(L[k].id===s)i=k;escolher(i)}
  }
  btn.addEventListener("click",function(){abrir(!panel.classList.contains("open"))});
  close.addEventListener("click",function(){abrir(false)});
  // Modo de privacidade: corta o som e esconde o player; ao voltar, recarrega a playlist.
  var boss=false;
  new MutationObserver(function(){
    var on=document.documentElement.classList.contains("boss-on");
    if(on===boss)return; boss=on;
    if(on){ if(frame)frame.src="about:blank"; }
    else if(frame&&atual>=0){ frame.src=url(L[atual]); }
  }).observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
})();
