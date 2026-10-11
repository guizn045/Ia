const U=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL,
T=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
module.exports=async c=>{
  if(!U||!T)return null;
  const r=await fetch(U+"/pipeline",{method:"POST",headers:{Authorization:"Bearer "+T},body:JSON.stringify(c)});
  return (await r.json()).map(x=>x.result);
};
