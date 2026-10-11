// Aceita os nomes com ou sem prefixo (KV_REST_API_URL, STORAGE_REST_API_URL, UPSTASH_REDIS_REST_URL...)
const env=process.env,
pick=re=>{const k=Object.keys(env).find(n=>re.test(n));return k?env[k]:undefined},
U=pick(/(REST_API_URL|REDIS_REST_URL)$/),
T=pick(/(REST_API_TOKEN|REDIS_REST_TOKEN)$/);
module.exports=async c=>{
  if(!U||!T)return null;
  const r=await fetch(U+"/pipeline",{method:"POST",headers:{Authorization:"Bearer "+T},body:JSON.stringify(c)});
  if(!r.ok)throw new Error("redis http "+r.status);
  return (await r.json()).map(x=>x.result);
};
