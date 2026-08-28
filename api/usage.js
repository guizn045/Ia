// /api/usage.js
// Devolve quanto a pessoa (logada ou convidada) já usou hoje e quando o limite
// reseta. É só leitura — usado pra mostrar a informação no menu (⋮).
import { DAILY_TOKEN_LIMIT, resolveSubjectKey, getUsedTokens, getTodayKeyAndReset } from './_usageLimit.js';

export default async function handler(req, res) {
    const subjectKey = await resolveSubjectKey(req);
    const used = await getUsedTokens(subjectKey);
    const { resetAt } = getTodayKeyAndReset();

    return res.status(200).json({
        used: used,
        limit: DAILY_TOKEN_LIMIT,
        remaining: Math.max(0, DAILY_TOKEN_LIMIT - used),
        resetAt: resetAt
    });
}
