export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body;
    const userMessage = messages[messages.length - 1].content;

    // Utilizando um endpoint alternativo de alta performance focado em modelos abertos e livres
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY || "demo"}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: userMessage }],
        temperature: 0.9
      })
    });

    const data = await response.json();
    let replyText = "";

    if (data.choices && data.choices[0]?.message?.content) {
      replyText = data.choices[0].message.content;
    } else if (data.error) {
      replyText = "Aviso: " + (data.error.message || JSON.stringify(data.error));
    } else {
      // Fallback para uma API de inferência direta livre
      const altResponse = await fetch("https://router.huggingface.co/hf-inference/models/cognitivecomputations/dolphin-2.9.2-llama3-8b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: userMessage, parameters: { max_new_tokens: 800 } })
      });
      const altData = await altResponse.json();
      replyText = altData[0]?.generated_text || "Sistema online e pronto.";
    }

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    return res.status(500).json({ reply: "Erro interno: " + error.message });
  }
}
