export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(200).json({ response: "Erro: A variável GROQ_API_KEY não foi encontrada na Vercel." });
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
                    { role: "system", content: "Você é o NexusAI, um assistente inteligente criado por @GUIWY_045." },
                    { role: "user", content: req.body.message || "Olá" }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(200).json({ response: `Erro Groq: ${data.error.message || JSON.stringify(data.error)}` });
        }

        if (data.choices && data.choices[0]) {
            return res.status(200).json({ response: data.choices[0].message.content });
        }

        return res.status(200).json({ response: "Sem resposta da IA." });
    } catch (err) {
        return res.status(500).json({ response: `Erro no servidor: ${err.message}` });
    }
}

