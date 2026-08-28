module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método não permitido' });
        return;
    }

    const { passcode } = req.body || {};

    if (!passcode || passcode !== process.env.ADMIN_PASSCODE) {
        res.status(401).json({ error: 'Senha incorreta.' });
        return;
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const missing = [];
    if (!SUPABASE_URL) missing.push('SUPABASE_URL');
    if (!SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missing.length > 0) {
        res.status(500).json({ error: 'Faltando na Vercel: ' + missing.join(', ') });
        return;
    }

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/usage_events?select=*&order=created_at.desc&limit=2000`,
            {
                headers: {
                    apikey: SERVICE_KEY,
                    Authorization: `Bearer ${SERVICE_KEY}`
                }
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            res.status(502).json({ error: 'Erro ao consultar Supabase: ' + errText });
            return;
        }

        const events = await response.json();

        const totalEvents = events.length;
        const uniqueSessions = new Set(events.map(e => e.session_id)).size;

        const modeCounts = {};
        const modelCounts = {};
        const typeCounts = {};

        events.forEach(e => {
            if (e.mode) modeCounts[e.mode] = (modeCounts[e.mode] || 0) + 1;
            if (e.model) modelCounts[e.model] = (modelCounts[e.model] || 0) + 1;
            if (e.event_type) typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
        });

        const recent = events.slice(0, 20).map(e => ({
            session_id: e.session_id ? e.session_id.slice(0, 12) : '???',
            event_type: e.event_type,
            mode: e.mode,
            model: e.model,
            created_at: e.created_at
        }));

        res.status(200).json({
            totalEvents,
            uniqueSessions,
            modeCounts,
            modelCounts,
            typeCounts,
            recent
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
