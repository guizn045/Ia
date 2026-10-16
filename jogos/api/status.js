// Verifica cada jogo. Valores: true = no ar, false = fora do ar, null = não deu para saber.
// Só marca "fora do ar" com certeza: erro 404/5xx, página de "site não encontrado", ou página vazia.
const G=require("../games.js");
const MORTO=[/DEPLOYMENT_NOT_FOUND/i,/There isn.t a GitHub Pages site here/i,/Application failed to respond/i,/This domain (is|has been)/i,/domain (is )?for sale/i,/account (has been )?suspended/i,/Site not found/i,/no such app/i];
const TITULO_RUIM=/\b(404|not found|error|suspended|expired|unavailable|bad gateway)\b/i;

async function uma(url){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),9000);
  try{
    const r=await fetch(url,{signal:c.signal,redirect:"follow",headers:{"User-Agent":"Mozilla/5.0 (compatible; NexusJogosStatus)","Accept":"text/html,*/*"}});
    const s=r.status;
    if(s===404||s===410||s>=500&&s!==503)return false;
    if(s>=400)return null;            // 401/403/429/503: bloqueio ou limite, não dá para saber
    const tipo=r.headers.get("content-type")||"";
    if(!/html/i.test(tipo))return true; // arquivo/jogo direto
    const txt=(await r.text()).slice(0,200000);
    if(MORTO.some(re=>re.test(txt)))return false;
    const ti=(txt.match(/<title[^>]*>([^<]*)/i)||[])[1]||"";
    if(TITULO_RUIM.test(ti))return false;
    if(txt.length<400&&!/<(script|canvas|iframe|embed|object)/i.test(txt))return false;
    return true;
  }catch(e){return "erro"}finally{clearTimeout(t)}
}
async function checar(url){
  let r=await uma(url);
  if(r==="erro"){await new Promise(a=>setTimeout(a,800));r=await uma(url)}
  return r==="erro"?false:r;            // falhou duas vezes (sem resposta): fora do ar
}
module.exports=async(req,res)=>{
  const out={};
  await Promise.all(G.map(async g=>{out[g.url]=await checar(g.url)}));
  res.setHeader("Cache-Control","s-maxage=120, stale-while-revalidate=600");
  res.json(out);
};
module.exports.checar=checar;
