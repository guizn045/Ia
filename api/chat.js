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

    // Envia o histórico de mensagens para o teu servidor do Google Colab
    const response = await fetch(`${colabUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();
    return res.status(200).json({ reply: data.reply || "Resposta vazia do servidor." });
  } catch (error) {
    return res.status(500).json({ reply: "Erro ao comunicar com o teu servidor Colab: " + error.message });
  }
}
