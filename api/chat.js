// api/chat.js - MULTI PROVIDER (GROQ SAFE)

export default async function handler(req, res) {
  // ===== CORS =====
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request received');

    const body = req.body || {};
    const { messages, model, temperature, max_tokens } = body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Messages must be an array',
      });
    }

    // ===== MODEL PARSING (BACKWARD COMPATIBLE) =====
    let provider = 'groq';
    let modelName = model || 'llama-3.1-8b-instant';

    if (model && model.includes(':')) {
      const split = model.split(':');
      provider = split[0];
      modelName = split.slice(1).join(':');
    }

    console.log(`Provider: ${provider}, Model: ${modelName}`);

    let url = '';
    let headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Ventora-AI-Backend/1.0'
    };
    let payload = {};

    // ===================== GROQ =====================
    if (provider === 'groq') {
      const GROQ_API_KEY = process.env.GROQ_API_KEY;
      if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'GROQ_API_KEY missing' });
      }

      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers.Authorization = `Bearer ${GROQ_API_KEY}`;

      payload = {
        model: modelName,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 1024,
        stream: false
      };
    }

    // ===================== GEMINI =====================
    else if (provider === 'google') {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
      }

      url =
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

      payload = {
        contents: [{
          parts: [{
            text: messages.map(m => m.content).join('\n')
          }]
        }]
      };
    }

    // ===================== TOGETHER =====================
    else if (provider === 'together') {
      const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
      if (!TOGETHER_API_KEY) {
        return res.status(500).json({ error: 'TOGETHER_API_KEY missing' });
      }

      url = 'https://api.together.xyz/v1/chat/completions';
      headers.Authorization = `Bearer ${TOGETHER_API_KEY}`;

      payload = {
        model: modelName,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 2048
      };
    }

    // ===================== OPENROUTER =====================
    else if (provider === 'openrouter') {
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
      if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'OPENROUTER_API_KEY missing' });
      }

      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers.Authorization = `Bearer ${OPENROUTER_API_KEY}`;
      headers['HTTP-Referer'] = 'https://ventora-ai.vercel.app';
      headers['X-Title'] = 'Ventora AI';

      payload = {
        model: modelName,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 2048
      };
    }

    else {
      return res.status(400).json({ error: 'Unknown provider' });
    }

    // ===== REQUEST =====
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const txt = await apiResponse.text();
      console.error('API error:', txt);
      return res.status(apiResponse.status).json({
        error: `Provider error (${provider})`,
        details: txt.slice(0, 200)
      });
    }

    const data = await apiResponse.json();

    // ===== NORMALIZE RESPONSE =====
    const content =
      data.choices?.[0]?.message?.content ||
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response';

    res.status(200).json({
      choices: [{ message: { content } }]
    });

  } catch (err) {
    console.error('Server error:', err.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
}
