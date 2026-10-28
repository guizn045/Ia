export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body;
    const userMessage = messages[messages.length - 1].content;

    // Endpoint alternativo de alta velocidade para modelos abertos
    const response = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: userMessage }],
        model: "llama", // Modelo base rápido e sem filtros corporativos restritos
        json: false
      })
    });

    const replyText = await response.text();

    if (!replyText || replyText.includes("<html>")) {
      return res.status(200).json({ reply: "A processar no motor livre. Envia novamente em instantes." });
    }

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    return res.status(500).json({ reply: "Erro de conexão: " + error.message });
  }
}
