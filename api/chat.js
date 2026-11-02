export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body;
    
    // Converte o histórico de chat num formato de prompt linear compatível com a rede
    const prompt = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n") + "\nAssistant:";

    // 1. Envia o pedido para a API pública da AI Horde
    const response = await fetch("https://stablehorde.net/api/v2/generate/text/async", {
      method: "POST",
      headers: {
        "apikey": process.env.HORDE_API_KEY || "0000000000", // "0000000000" funciona anonimamente
        "Content-Type": "application/json",
        "Client-Agent": "VercelMobileChat:1.0:github.com/user/project"
      },
      body: JSON.stringify({
        prompt: prompt,
        params: {
          max_context_length: 1500,
          max_length: 300,
          temperature: 0.8
        },
        models: ["llama_3_70b_instruct", "dolphin-2.9.3-llama-3-8b", "openchat_3.5"]
      })
    });

    const data = await response.json();
    const requestId = data.id;

    if (!requestId) {
      return res.status(200).json({ reply: "Erro: A Horde rejeitou o pedido inicial de entrada na fila." });
    }

    // 2. Ciclo de verificação otimizado para respeitar os limites de tempo da Vercel
    let reply = "";
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Intervalo de 1.5 segundos
      
      const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/text/status/${requestId}`);
      const checkData = await checkRes.json();

      if (checkData.finished && checkData.generations && checkData.generations.length > 0) {
        reply = checkData.generations[0].text.trim();
        break;
      }
      if (checkData.faulted) {
        reply = "Erro: O computador voluntário da rede falhou a geração.";
        break;
      }
    }

    if (!reply) {
      reply = "A rede está muito concorrida neste momento à procura de um voluntário livre. Tenta enviar a mensagem novamente!";
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(200).json({ reply: "Erro de comunicação com a Horde: " + error.message });
  }
}
