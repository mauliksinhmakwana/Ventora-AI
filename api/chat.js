// api/chat.js - UPDATED VERSION
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // DEBUG: Log incoming request
    console.log('=== REQUEST RECEIVED ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Messages length:', req.body.messages?.length);
    
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const { messages, model, temperature, max_tokens } = req.body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: 'Messages array is empty or invalid',
        received: req.body 
      });
    }

    console.log('Calling Groq API...');
    
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

    console.log('Groq Response Status:', response.status);
    
    const data = await response.json();
    
    // DEBUG: Log response
    console.log('=== GROQ RESPONSE ===');
    console.log('Has choices:', !!data.choices);
    console.log('Choices length:', data.choices?.length);
    console.log('First choice:', data.choices?.[0]);
    
    // Check if Groq returned valid response
    if (!data.choices || data.choices.length === 0) {
      console.error('Groq returned empty choices:', data);
      return res.status(500).json({ 
        error: 'AI returned empty response',
        groqResponse: data 
      });
    }

    console.log('Sending response to frontend...');
    res.status(200).json(data);
    
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
}
