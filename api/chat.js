// /api/chat.js
// Rota de backend (Vercel Serverless Function) que fala com a Groq usando
// a chave guardada só no servidor (variável de ambiente GROQ_API_KEY).
// O navegador do usuário nunca vê essa chave — ele só chama esse endpoint.
import { DAILY_TOKEN_LIMIT, resolveSubjectKey, getUsedTokens, addUsedTokens, getTodayKeyAndReset } from './_usageLimit.js';

// Modelos permitidos (mesma lista que já existe no front-end).
// Isso evita que alguém use seu endpoint pra chamar modelo caro/fora do previsto.
const ALLOWED_MODELS = new Set([
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'groq/compound'
]);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Método não permitido, use POST.' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        return res.status(500).json({ error: 'GROQ_API_KEY não configurada no servidor.' });
    }

    const { model, messages, temperature, max_completion_tokens, reasoning_effort } = req.body || {};

    if (!model || !ALLOWED_MODELS.has(model)) {
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

    const groqBody = {
        model: model,
        messages: messages,
        temperature: typeof temperature === 'number' ? temperature : 0.7
    };
    // Repassa esses campos só se vierem preenchidos (o front-end manda
    // reasoning_effort='high' pra modelos gpt-oss, e um teto de tokens)
    if (typeof max_completion_tokens === 'number') groqBody.max_completion_tokens = max_completion_tokens;
    if (typeof reasoning_effort === 'string') groqBody.reasoning_effort = reasoning_effort;

    try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + groqKey
            },
            body: JSON.stringify(groqBody)
        });

        const rawText = await groqResponse.text();

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
                res.status(groqResponse.status);
                res.setHeader('Content-Type', 'application/json');
                return res.send(JSON.stringify(parsed));
            }
        } catch (e) {}

        res.status(groqResponse.status);
        res.setHeader('Content-Type', 'application/json');
        return res.send(rawText);
    } catch (err) {
        return res.status(502).json({ error: 'Erro ao falar com a Groq: ' + err.message });
    }
}
