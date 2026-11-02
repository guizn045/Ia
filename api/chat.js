export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body;

    const prompt = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n") + "\nAssistant:";

    // Novo endpoint oficial do router da Hugging Face
    const response = await fetch("https://router.huggingface.co/hf-inference/models/cognitivecomputations/dolphin-2.9.3-llama-3-8b-instruct", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 800, temperature: 0.7, return_full_text: false }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(200).json({ reply: "Erro da API: " + data.error });
    }

    let reply = "Resposta vazia.";
    if (Array.isArray(data) && data[0] && data[0].generated_text) {
      reply = data[0].generated_text.trim();
    } else if (data.generated_text) {
      reply = data.generated_text.trim();
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(200).json({ reply: "Erro ao comunicar com a API: " + error.message });
  }
}
