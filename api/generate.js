export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { imageBase64, prompt } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: "Imagem não enviada." });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: "image/jpeg",
                                    data: imageBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        responseModalities: ["IMAGE"]
                    }
                })
            }
        );

        const data = await response.json();

        if (!data?.candidates?.length) {
            return res.status(500).json({ error: "Nenhuma imagem retornada." });
        }

        if (data.candidates[0].finishReason === "SAFETY") {
            return res.status(403).json({ error: "Conteúdo bloqueado por segurança." });
        }

        const imagePart = data.candidates[0].content.parts.find(p => p.inlineData);

        if (!imagePart?.inlineData?.data) {
            return res.status(500).json({ error: "Falha ao gerar imagem." });
        }

        res.status(200).json({
            image: imagePart.inlineData.data
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
