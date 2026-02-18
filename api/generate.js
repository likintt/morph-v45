export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { imageBase64, prompt, mode } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: "Imagem não enviada." });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // Gerar prompt automático se vazio ou modo automático
        let finalPrompt = prompt?.trim();
        if (!finalPrompt || mode === "auto" || mode === "friend_story") {
            const stories = [
                "Gere uma transição única e perfeita para este rosto, mantendo estética realista.",
                "Crie uma transformação feminina elegante e diferente, nunca repetida.",
                "Imagine uma história única de transição para este rosto, com detalhes sutis e realistas.",
                "Transforme este rosto de forma original, criando uma narrativa visual exclusiva."
            ];
            finalPrompt = stories[Math.floor(Math.random() * stories.length)];
        }

        const payload = {
            contents: [{
                parts: [
                    { text: finalPrompt },
                    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
                ]
            }],
            generationConfig: { responseModalities: ["IMAGE"] }
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();

        // Procura qualquer base64 retornado
        let imagePart = data?.candidates?.[0]?.content?.find(p => p.inlineData);
        const imageResult = imagePart?.inlineData?.data;

        if (!imageResult) {
            return res.status(500).json({ error: "A IA não retornou imagem. Tente novamente." });
        }

        // Verifica SAFETY
        if (data.candidates[0].finishReason === "SAFETY") {
            return res.status(403).json({ error: "Conteúdo bloqueado por segurança." });
        }

        res.status(200).json({ image: imageResult });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
