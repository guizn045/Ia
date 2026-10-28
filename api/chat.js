export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body;
    const colabUrl = process.env.COLAB_URL; 

    if (!colabUrl) {
      return res.status(200).json({ reply: "Erro: Falta configurar a variável COLAB_URL na Vercel." });
    }

    // O fetch agora inclui o cabeçalho para ignorar a página de aviso do LocalTunnel
    const response = await fetch(`${colabUrl}/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "bypass-tunnel-reminder": "true" 
      },
      body: JSON.stringify({ messages })
    });

    const responseText = await response.text();
    
    // Tenta converter para JSON de forma segura
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return res.status(200).json({ 
        reply: "Erro: O Google Colab ou o túnel devolveram uma resposta inválida. Verifica se a aba do Colab continua aberta." 
      });
    }

    return res.status(200).json({ reply: data.reply || "Resposta vazia do servidor." });
  } catch (error) {
    return res.status(200).json({ reply: "Erro ao comunicar com o servidor Colab: " + error.message });
  }
}
