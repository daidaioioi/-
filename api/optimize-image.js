// /api/optimize-image.js

export const config = {
  api: { bodyParser: { sizeLimit: "6mb" } }, // adjust if your base64 is bigger
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing imageBase64 or mimeType" });
    }

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inline_data: { mime_type: mimeType, data: imageBase64 } },
                { text: "Optimize this image for a perler bead pattern." },
              ],
            },
          ],
        }),
      }
    );

    const data = await r.json();

    // IMPORTANT: if Gemini returns error, pass it back clearly
    if (!r.ok) {
      return res.status(r.status).json({
        error: "Gemini API error",
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
