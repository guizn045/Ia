const redis=require("./_r"),nomes=new Set(require("../games.js").map(g=>g.nome));
module.exports=async(req,res)=>{
  res.setHeader("Cache-Control","no-store");
  let b=req.body||{};
  if(typeof b==="string"){try{b=JSON.parse(b)}catch(e){b={}}}
  const now=Date.now(),cmd=[];
  if(b.id)cmd.push(["ZADD","online",now,String(b.id).slice(0,40)]);
  if(nomes.has(b.game))cmd.push(["HINCRBY","plays",b.game,1]);
  cmd.push(["ZREMRANGEBYSCORE","online",0,now-70000],["ZCARD","online"],["HGETALL","plays"]);
  try{
    const o=await redis(cmd);
    if(!o)return res.json({ok:false});
    const h=o[o.length-1]||[],plays={};
    for(let i=0;i<h.length;i+=2)plays[h[i]]=+h[i+1];
    res.json({ok:true,online:o[o.length-2],plays});
  }catch(e){res.json({ok:false})}
};
