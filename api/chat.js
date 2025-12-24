export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get API key from Vercel environment
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        const { messages, model, temperature, max_tokens } = req.body;

        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'llama-3.1-8b-instant',
                messages: messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 1024
            })
        });

        const data = await response.json();
        res.status(200).json(data);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
