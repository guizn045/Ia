const G=require("../games.js");
module.exports=async(req,res)=>{
  const out={};
  await Promise.all(G.map(async g=>{
    const c=new AbortController(),t=setTimeout(()=>c.abort(),7000);
    try{
      const r=await fetch(g.url,{signal:c.signal,redirect:"follow",headers:{"User-Agent":"Mozilla/5.0"}});
      out[g.url]=r.status<500;
    }catch(e){out[g.url]=false}
    clearTimeout(t);
  }));
  res.setHeader("Cache-Control","s-maxage=120, stale-while-revalidate=600");
  res.json(out);
};
