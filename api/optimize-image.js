export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const { imageBase64, mimeType } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageBase64,
                  },
                },
                {
                  text: "Optimize this image for a perler bead pattern.",
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
