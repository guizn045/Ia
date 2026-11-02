export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body;
    const prompt = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n") + "\nAssistant:";

    const response = await fetch("https://stablehorde.net/api/v2/generate/text/async", {
      method: "POST",
      headers: {
        "apikey": process.env.HORDE_API_KEY || "0000000000",
        "Content-Type": "application/json",
        "Client-Agent": "VercelMobileChat:1.0"
      },
      body: JSON.stringify({
        prompt: prompt,
        params: {
          max_context_length: 1000,
          max_length: 250,
          temperature: 0.8
        },
        models: ["llama_3_70b_instruct", "dolphin-2.9.3-llama-3-8b"]
      })
    });

    const data = await response.json();
    const requestId = data.id;

    if (!requestId) {
      return res.status(200).json({ reply: "Erro: A Horde rejeitou o pedido." });
    }

    let reply = "";
    // 8 tentativas com intervalos curtos para encaixar no limite da Vercel
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/text/status/${requestId}`);
      const checkData = await checkRes.json();

      if (checkData.finished && checkData.generations && checkData.generations.length > 0) {
        reply = checkData.generations[0].text.trim();
        break;
      }
      if (checkData.faulted) {
        reply = "Erro no worker da rede.";
        break;
      }
    }

    if (!reply) {
      reply = "A resposta demorou muito a chegar da rede descentralizada. Tenta enviar novamente!";
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(200).json({ reply: "Erro de comunicação: " + error.message });
  }
}
