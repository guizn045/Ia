const redis=require("./_r"),nomes=new Set(require("../games.js").map(g=>g.nome));
const ID=/^[A-Za-z0-9_-]{6,40}$/, LIMITE=10; // no máximo 10 envios por minuto por visitante
module.exports=async(req,res)=>{
  res.setHeader("Cache-Control","no-store");
  let b=req.body||{};
  if(typeof b==="string"){try{b=JSON.parse(b)}catch(e){b={}}}
  const id=typeof b.id==="string"&&ID.test(b.id)?b.id:null,game=typeof b.game==="string"?b.game:null;
  const now=Date.now(),cmd=[];
  try{
    let ok=true;
    if(id){ // limite de abuso: conta os envios do visitante neste minuto
      const k="rl:"+id+":"+Math.floor(now/60000);
      const r=await redis([["INCR",k],["EXPIRE",k,120]]);
      if(!r)return res.json({ok:false,why:"sem-variaveis"});
      if(r[0]>LIMITE)ok=false;
    }
    if(ok&&id)cmd.push(["ZADD","online",now,id]);
    if(ok&&id&&nomes.has(game))cmd.push(["HINCRBY","plays",game,1]);
    cmd.push(["ZREMRANGEBYSCORE","online",0,now-70000],["ZCARD","online"],["HGETALL","plays"]);
    const o=await redis(cmd);
    if(!o)return res.json({ok:false,why:"sem-variaveis"});
    const h=o[o.length-1]||[],plays={};
    for(let i=0;i<h.length;i+=2)plays[h[i]]=+h[i+1];
    res.json({ok:true,online:o[o.length-2],plays});
  }catch(e){
    console.error("stats: falha no Redis:",String(e.message).slice(0,80));
    res.status(503).json({ok:false,why:String(e.message).slice(0,60)});
  }
};
