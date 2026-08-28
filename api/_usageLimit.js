// /api/_usageLimit.js
// Lógica compartilhada do limite de uso diário por pessoa (tokens/dia).
// Usado pelo /api/chat.js (que aplica o limite) e pelo /api/usage.js (que só
// devolve a informação pro menu (⋮) mostrar pra pessoa).
//
// IMPORTANTE: aqui só usamos fetch puro contra a API REST do Supabase — sem
// importar nenhum pacote (@supabase/supabase-js etc). Isso evita que a função
// quebre inteira (erro 500 / FUNCTION_INVOCATION_FAILED) caso esse pacote não
// esteja instalado no projeto da Vercel.

// Ajuste esse número (ou a variável de ambiente DAILY_TOKEN_LIMIT na Vercel)
// se quiser liberar mais ou menos tokens por pessoa por dia.
export const DAILY_TOKEN_LIMIT = Number(process.env.DAILY_TOKEN_LIMIT) || 40000;

function getConfig() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return null;
    return { url: url.replace(/\/+$/, ''), serviceKey };
}

// Descobre de quem é esse uso:
// - Se a pessoa está logada, confirma o token dela direto na API de auth do
//   Supabase (não dá pra falsificar, ao contrário de um ID que o navegador só informa).
// - Se é convidado (sem login), usa o IP da requisição — mais confiável que um
//   session_id, que dá pra trocar só limpando o localStorage.
export async function resolveSubjectKey(req) {
    const config = getConfig();
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (config && authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            const resp = await fetch(config.url + '/auth/v1/user', {
                headers: { 'Authorization': 'Bearer ' + token, 'apikey': config.serviceKey }
            });
            if (resp.ok) {
                const user = await resp.json();
                if (user && user.id) return 'user:' + user.id;
            }
        } catch (e) {}
    }
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (forwarded ? forwarded.split(',')[0].trim() : null) || (req.socket && req.socket.remoteAddress) || 'unknown';
    return 'ip:' + ip;
}

// O limite reseta à meia-noite UTC. dayKey é a "chave do dia" (ex: 2026-08-28),
// usada como linha na tabela; resetAt é o horário ISO em que vira o próximo dia.
export function getTodayKeyAndReset() {
    const now = new Date();
    const dayKey = now.toISOString().slice(0, 10);
    const resetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)).toISOString();
    return { dayKey, resetAt };
}

// Quanto essa pessoa já usou hoje.
export async function getUsedTokens(subjectKey) {
    const config = getConfig();
    if (!config) return 0;
    const { dayKey } = getTodayKeyAndReset();
    try {
        const url = `${config.url}/rest/v1/usage_daily?subject_key=eq.${encodeURIComponent(subjectKey)}&day=eq.${dayKey}&select=tokens_used`;
        const resp = await fetch(url, {
            headers: { 'apikey': config.serviceKey, 'Authorization': 'Bearer ' + config.serviceKey }
        });
        if (!resp.ok) return 0;
        const rows = await resp.json();
        return (rows && rows[0] && rows[0].tokens_used) || 0;
    } catch (e) {
        return 0;
    }
}

// Soma tokens ao total do dia dessa pessoa (cria a linha se ainda não existir).
export async function addUsedTokens(subjectKey, tokens) {
    const config = getConfig();
    if (!config || !tokens) return;
    const { dayKey } = getTodayKeyAndReset();
    try {
        const current = await getUsedTokens(subjectKey);
        const newTotal = current + tokens;
        await fetch(`${config.url}/rest/v1/usage_daily`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': config.serviceKey,
                'Authorization': 'Bearer ' + config.serviceKey,
                // upsert: se já existir linha pra essa pessoa/dia, atualiza em vez de duplicar
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                subject_key: subjectKey,
                day: dayKey,
                tokens_used: newTotal,
                updated_at: new Date().toISOString()
            })
        });
    } catch (e) {}
}
