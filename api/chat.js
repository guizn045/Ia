export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });

    const { message, mode, userApiKey } = req.body;
    const apiKey = userApiKey || process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(200).json({ response: "⚠️ Nenhuma chave da Groq encontrada! Salve sua chave no botão do topo." });
    }

    // Lista ordenada dos modelos mais recentes e ativos da Groq
    const modelos = [
        "llama-3.1-8b-instant",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "llama-3.3-70b-versatile",
        "openai/gpt-oss-20b"
    ];

    let systemPrompt = "Você é o NexusAI, assistente inteligente criado por @GUIWY_045.";
    if (mode === "Direto") systemPrompt += " Seja extremamente curto e direto.";
    if (mode === "Passo a Passo") systemPrompt += " Responda em tópicos organizados passo a passo.";

    for (const modelName of modelos) {
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey.trim()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message }
                    ]
                })
            });

            const data = await response.json();

            if (data.choices && data.choices[0]) {
                return res.status(200).json({ response: data.choices[0].message.content });
            }
        } catch (err) {
            continue;
        }
    }

    return res.status(200).json({ response: "Erro: Não foi possível conectar a nenhum modelo ativo da Groq." });
}
