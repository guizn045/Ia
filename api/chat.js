export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });

    const { message, mode, userApiKey, imageBase64 } = req.body;
    const apiKey = userApiKey || process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(200).json({ response: "⚠️ Nenhuma chave da Groq encontrada! Toque no botão '🔑 Chave API' no topo." });
    }

    const lowerMsg = (message || "").toLowerCase();
    if (lowerMsg.startsWith("crie uma imagem") || lowerMsg.startsWith("gere uma imagem") || lowerMsg.startsWith("desenhe") || lowerMsg.startsWith("gerar imagem")) {
        const promptForImg = message.replace(/crie uma imagem de|gere uma imagem de|desenhe|gerar imagem de|crie uma imagem|gere uma imagem/gi, "").trim() || message;
        const encoded = encodeURIComponent(promptForImg);
        const imageUrl = `https://image.pollinations.ai/prompt/${encoded}`;
        return res.status(200).json({ 
            response: `🎨 Imagem gerada para: "${promptForImg}"`,
            imageUrl: imageUrl 
        });
    }

    let modelos = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
    let userContent = message;

    if (imageBase64) {
        modelos = ["llama-3.2-11b-vision-preview", "llama-3.1-8b-instant"];
        userContent = [
            { type: "text", text: message || "Descreva esta imagem." },
            { type: "image_url", image_url: { url: imageBase64 } }
        ];
    }

    let systemPrompt = "Você é o NexusAI, assistente inteligente criado por @GUIWY_045. Responda de forma organizada, limpa e bem estruturada.";
    if (mode === "Direto") systemPrompt += " Seja extremamente curto e direto.";
    if (mode === "Passo a Passo") systemPrompt += " Responda em tópicos organizados passo a passo.";

    for (const modelName of modelos) {
        try {
            const bodyData = {
                model: modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ]
            };
            if (!imageBase64) bodyData.temperature = 0.7;

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey.trim()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(bodyData)
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                return res.status(200).json({ response: data.choices[0].message.content });
            }
        } catch (err) {
            continue;
        }
    }

    return res.status(200).json({ response: "Erro: Não foi possível processar a solicitação." });
}

