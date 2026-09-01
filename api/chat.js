// /api/chat.js
// Rota de backend (Vercel Serverless Function) que fala com a OpenRouter usando
// a chave guardada só no servidor (variável de ambiente OPENROUTER_API_KEY).
// O navegador do usuário nunca vê essa chave — ele só chama esse endpoint.
import { DAILY_TOKEN_LIMIT, resolveSubjectKey, getUsedTokens, addUsedTokens, getTodayKeyAndReset } from './_usageLimit.js';

// O front-end continua mandando esses 3 nomes de modelo (nada lá precisa
// mudar). Aqui eles são traduzidos pro modelo real da OpenRouter — inclusive
// "groq/compound" (que na Groq já vinha com busca na web embutida) agora
// vira o modelo de texto normal + o plugin de busca na web da OpenRouter.
const MODEL_MAP = {
    'openai/gpt-oss-120b': { model: 'openai/gpt-oss-120b' },
    'qwen/qwen3.6-27b': { model: 'qwen/qwen3.6-27b' },
    'groq/compound': { model: 'openai/gpt-oss-120b', plugins: [{ id: 'web' }] }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Método não permitido, use POST.' });
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
        return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada no servidor.' });
    }

    const { model, messages, temperature, max_completion_tokens, reasoning_effort } = req.body || {};

    if (!model || !MODEL_MAP[model]) {
        return res.status(400).json({ error: 'Modelo inválido ou não permitido.' });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Campo "messages" inválido.' });
    }

    // ---------- LIMITE DE USO DIÁRIO POR PESSOA ----------
    // subjectKey é o usuário logado (confirmado pelo token, não dá pra
    // falsificar) ou, pra convidado, o IP da requisição.
    const subjectKey = await resolveSubjectKey(req);
    const { resetAt } = getTodayKeyAndReset();
    const usedSoFar = await getUsedTokens(subjectKey);

    if (usedSoFar >= DAILY_TOKEN_LIMIT) {
        return res.status(429).json({
            error: 'Você já usou todo o seu limite de tokens de hoje. Volta depois que resetar.',
            usage: { used: usedSoFar, limit: DAILY_TOKEN_LIMIT, remaining: 0, resetAt: resetAt }
        });
    }

    const mapped = MODEL_MAP[model];
    const openrouterBody = {
        model: mapped.model,
        messages: messages,
        temperature: typeof temperature === 'number' ? temperature : 0.7
    };
    if (mapped.plugins) openrouterBody.plugins = mapped.plugins;

    // A OpenRouter usa nomes de campo um pouco diferentes da Groq pros mesmos
    // conceitos: max_tokens no lugar de max_completion_tokens, e um objeto
    // "reasoning: { effort }" no lugar de "reasoning_effort" solto.
    if (typeof max_completion_tokens === 'number') openrouterBody.max_tokens = max_completion_tokens;
    if (typeof reasoning_effort === 'string') openrouterBody.reasoning = { effort: reasoning_effort };

    try {
        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + openrouterKey,
                // Recomendados pela OpenRouter (identificam seu app nos rankings
                // deles); não são obrigatórios, mas não custa nada mandar.
                'HTTP-Referer': 'https://ianexus-six.vercel.app',
                'X-Title': 'NexusAI Pro'
            },
            body: JSON.stringify(openrouterBody)
        });

        const rawText = await orResponse.text();

        // Soma os tokens gastos nessa chamada ao total do dia da pessoa e devolve
        // a informação de uso atualizada junto da resposta (evita uma segunda
        // chamada só pra isso). Se algo aqui falhar, devolve a resposta normal
        // mesmo assim — isso nunca deve travar o chat.
        try {
            const parsed = JSON.parse(rawText);
            const tokensUsed = parsed && parsed.usage && parsed.usage.total_tokens;
            if (typeof tokensUsed === 'number') {
                await addUsedTokens(subjectKey, tokensUsed);
                const newUsed = usedSoFar + tokensUsed;
                parsed.nexus_usage = {
                    used: newUsed,
                    limit: DAILY_TOKEN_LIMIT,
                    remaining: Math.max(0, DAILY_TOKEN_LIMIT - newUsed),
                    resetAt: resetAt
                };
                res.status(orResponse.status);
                res.setHeader('Content-Type', 'application/json');
                return res.send(JSON.stringify(parsed));
            }
        } catch (e) {}

        res.status(orResponse.status);
        res.setHeader('Content-Type', 'application/json');
        return res.send(rawText);
    } catch (err) {
        return res.status(502).json({ error: 'Erro ao falar com a OpenRouter: ' + err.message });
    }
}
