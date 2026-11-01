export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", 
        messages: messages
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(200).json({ reply: "Erro da API: " + data.error.message });
    }

    const reply = data.choices && data.choices[0] && data.choices[0].message 
      ? data.choices[0].message.content 
      : "Resposta vazia.";

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(200).json({ reply: "Erro ao comunicar com a API: " + error.message });
  }
}
