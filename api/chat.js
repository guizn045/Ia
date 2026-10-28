export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body;
    const userMessage = messages[messages.length - 1].content;

    // Ligação a um modelo independente e recente sem restrições morais ou filtros
    const response = await fetch("https://router.huggingface.co/hf-inference/models/huihui-ai/Llama-3.1-8B-Instruct-Abliterated", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        inputs: userMessage, 
        parameters: { max_new_tokens: 1000, return_full_text: false } 
      })
    });

    const rawText = await response.text();
    let replyText = "";

    try {
      const data = JSON.parse(rawText);
      if (Array.isArray(data) && data[0]?.generated_text) {
        replyText = data[0].generated_text;
      } else if (data.generated_text) {
        replyText = data.generated_text;
      } else if (data.error) {
        replyText = "Aviso do motor independente: " + data.error;
      } else {
        replyText = rawText;
      }
    } catch (e) {
      // Se o servidor estiver a despertar, avisa de forma limpa sem quebrar o chat
      if (rawText.includes("DOCTYPE") || rawText.includes("<html>")) {
        replyText = "O modelo está a ligar no servidor descentralizado. Aguarde alguns segundos e envie novamente.";
      } else {
        replyText = rawText || "Servidor online.";
      }
    }

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    return res.status(500).json({ reply: "Erro interno: " + error.message });
  }
}
