// api/ocr.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.OCR_KEY_VENTORA;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'OCR service not configured' });
        }

        // Forward the request to OCR.space
        const formData = req.body;
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData,
            headers: {
                'apikey': apiKey
            }
        });

        const data = await response.json();
        
        // Check for errors
        if (data.IsErroredOnProcessing) {
            return res.status(400).json({ 
                error: data.ErrorMessage || 'OCR processing failed',
                details: data
            });
        }

        res.status(200).json(data);
        
    } catch (error) {
        console.error('OCR API error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}

export const config = {
    api: {
        bodyParser: false // We'll handle raw body for file upload
    }
};
