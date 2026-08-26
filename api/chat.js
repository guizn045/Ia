export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });

    const { message, mode, userApiKey } = req.body;
    // Pega a chave enviada pelo site ou a chave salva na Vercel
    const apiKey = userApiKey || process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(200).json({ response: "⚠️ Nenhuma chave da Groq encontrada! Toque no botão '🔑 Chave API' acima e salve sua chave." });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Você é o NexusAI, assistente inteligente criado por @GUIWY_045." },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        if (data.error) return res.status(200).json({ response: `Erro Groq: ${data.error.message}` });
        return res.status(200).json({ response: data.choices[0].message.content });
    } catch (err) {
        return res.status(500).json({ response: "Erro interno no servidor." });
    }
}
