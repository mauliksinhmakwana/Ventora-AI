export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, model, temperature = 0.7, max_tokens = 1024 } = req.body;

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  // 🔹 GROQ KEY POOL WITH ROLES
  const GROQ_POOLS = {
    general: [
      {
        key: process.env.GROQ_API_KEY_MAIN,
        systemPrompt: "You are Ventora AI. Be clear, concise, and helpful."
      },
      {
        key: process.env.GROQ_API_KEY_BACKUP,
        systemPrompt: "You are Ventora AI. Answer clearly."
      }
    ],
    research: [
      {
        key: process.env.GROQ_API_KEY_RESEARCH,
        systemPrompt:
          "You are Ventora AI Research Mode. Provide evidence-based, structured, detailed answers. Use headings."
      },
      {
        key: process.env.GROQ_API_KEY_BACKUP,
        systemPrompt:
          "You are Ventora AI Research Mode. Be factual and structured."
      }
    ],
    study: [
      {
        key: process.env.GROQ_API_KEY_STUDY,
        systemPrompt:
          "You are Ventora AI Study Partner. Explain simply with examples."
      },
      {
        key: process.env.GROQ_API_KEY_BACKUP,
        systemPrompt:
          "You are Ventora AI Study Partner. Keep answers easy to understand."
      }
    ]
  };

  const mode = model?.replace("groq:", "") || "general";
  const pool = GROQ_POOLS[mode] || GROQ_POOLS.general;

  let lastError = null;

  // 🔁 AUTO SWITCH LOOP
  for (const slot of pool) {
    if (!slot.key) continue;

    try {
      const groqRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${slot.key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            temperature,
            max_tokens,
            messages: [
              { role: "system", content: slot.systemPrompt },
              ...messages
            ]
          })
        }
      );

      if (groqRes.ok) {
        const data = await groqRes.json();
        return res.status(200).json(data);
      }

      lastError = await groqRes.text();
    } catch (err) {
      lastError = err.message;
    }
  }

  // If ALL keys fail
  return res.status(429).json({
    error: "All Groq keys are busy. Please try again.",
    details: lastError
  });
}
