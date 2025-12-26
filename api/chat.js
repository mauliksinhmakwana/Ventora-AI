// api/chat.js — MULTI PROVIDER (GROQ + GEMINI + OPENAI)

export default async function handler(req, res) {
  // ================= CORS =================
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model, temperature, max_tokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    // ========== MODEL PARSING (BACKWARD SAFE) ==========
    let provider = 'groq';
    let modelName = model || 'llama-3.1-8b-instant';

    if (model && model.includes(':')) {
      const parts = model.split(':');
      provider = parts[0];
      modelName = parts.slice(1).join(':');
    }

    let url = '';
    let headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Ventora-AI/1.0'
    };
    let body = {};

    // ===================== GROQ =====================
    if (provider === 'groq') {
      const key = process.env.GROQ_API_KEY;
      if (!key) return res.status(500).json({ error: 'GROQ_API_KEY missing' });

      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers.Authorization = `Bearer ${key}`;

      body = {
        model: modelName,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 1024,
        stream: false
      };
    }

    // ===================== GEMINI =====================
    else if (provider === 'google') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY missing' });

      url =
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;

      body = {
        contents: [{
          parts: [{ text: messages.map(m => m.content).join('\n') }]
        }]
      };
    }

    // ===================== OPENAI (CHATGPT) =====================
    else if (provider === 'openai') {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return res.status(500).json({ error: 'OPENAI_API_KEY missing' });

      url = 'https://api.openai.com/v1/chat/completions';
      headers.Authorization = `Bearer ${key}`;

      body = {
        model: modelName,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 2048
      };
    }

    else {
      return res.status(400).json({ error: 'Unknown provider' });
    }

    // ================= REQUEST =================
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: 'Provider error',
        details: errText.slice(0, 200)
      });
    }

    const data = await response.json();

    // ========== NORMALIZE RESPONSE ==========
    const content =
      data.choices?.[0]?.message?.content ||
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response';

    return res.status(200).json({
      choices: [{ message: { content } }]
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
}
