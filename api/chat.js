export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body;

    // Bucket ID já configurado automaticamente
    const bucketId = "qwen-colab-chat-9831a2";
    const urlRes = await fetch(`https://kvdb.io/${bucketId}/url`);
    const colabUrl = (await urlRes.text()).trim();

    if (!colabUrl || !colabUrl.startsWith("http")) {
      return res.status(200).json({ 
        reply: "Erro: O Google Colab está desligado ou ainda não atualizou o link." 
      });
    }

    // Envia a mensagem para o teu Google Colab atual
    const response = await fetch(`${colabUrl}/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "bypass-tunnel-reminder": "true" 
      },
      body: JSON.stringify({ messages })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return res.status(200).json({ 
        reply: "Erro: O Google Colab devolveu uma resposta inválida. Verifica se a aba do Colab continua aberta." 
      });
    }

    return res.status(200).json({ reply: data.reply || "Resposta vazia do servidor." });
  } catch (error) {
    return res.status(200).json({ reply: "Erro ao comunicar com o servidor: " + error.message });
  }
}
