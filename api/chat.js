export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body;
    const userMessage = messages[messages.length - 1].content;

    // Resposta de teste imediata para verificar a ligação com o telemóvel
    return res.status(200).json({ 
      reply: `Ligação bem-sucedida! Você escreveu: "${userMessage}". Sistema pronto.` 
    });
  } catch (error) {
    return res.status(500).json({ reply: "Erro interno: " + error.message });
  }
}
