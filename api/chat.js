export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body;
    const userMessage = messages[messages.length - 1].content;

    // Usando uma API alternativa de alta disponibilidade para garantir que o fetch não falhe
    const response = await fetch("https://router.huggingface.co/hf-inference/models/cognitivecomputations/dolphin-2.9.2-llama3-8b", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        inputs: userMessage, 
        parameters: { max_new_tokens: 500, return_full_text: false } 
      })
    });

    const data = await response.json();
    let replyText = "";

    if (Array.isArray(data) && data[0]?.generated_text) {
      replyText = data[0].generated_text;
    } else if (data.generated_text) {
      replyText = data.generated_text;
    } else if (data.error) {
      replyText = "Resposta do modelo: " + data.error;
    } else {
      replyText = "Servidor online. O modelo respondeu: " + JSON.stringify(data);
    }

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    return res.status(500).json({ reply: "Erro de conexão com o motor: " + error.message });
  }
}
