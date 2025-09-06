import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-1.5-flash-latest"; // Using a current and efficient model

if (!GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY in .env file");
    process.exit(1);
}

// Helper to build the request payload for the Gemini API
function buildPayload(prompt) {
    return {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7, // A good value for creative story generation
            maxOutputTokens: 1024, // Sufficient length for a short bedtime story
        },
    };
}

// The main route for generating a story
app.post('/generate-story', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid prompt' });
        }

        // This is the detailed prompt we send to the AI to guide its response
        const storyPrompt = `
एक छोटे बच्चे के लिए एक मजेदार और रहस्यमयी कहानी बनाओ। 
कहानी का विषय है: "${prompt}". 
कहानी सरल और आकर्षक हिंदी में होनी चाहिए, जैसे कोई दादा-दादी बच्चों को सुनाते हैं। 
कहानी में हल्का सा रोमांच और सस्पेंस होना चाहिए ताकि बच्चा अगली पंक्ति पढ़ने के लिए उत्सुक रहे। 
भाषा प्यारी, जीवंत और चित्रात्मक होनी चाहिए, ताकि बच्चा कहानी सुनते समय अपने दिमाग में चित्र बना सके। 
अंत में कहानी से एक सुंदर नैतिक शिक्षा भी जरूर जोड़ना। 
कहानी बहुत छोटी न हो, और न ही बहुत लंबी, बस इतनी कि बच्चा ध्यान से अंत तक सुन सके। 
`;


        const payload = buildPayload(storyPrompt);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY,
            },
            timeout: 30000, // Set a 30-second timeout for the API call
        });

        // Safely extract the generated text from the API response
        const storyText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!storyText) {
            return res.status(502).json({
                error: "No content was returned from the AI model.",
                raw: response.data,
            });
        }

        // Send the generated story back to the frontend
        res.json({ story: storyText });

    } catch (error) {
        // Log detailed error information on the server
        console.error("🔥 Server error:", error.response?.data || error.message);

        // Send a generic but helpful error message to the frontend
        res.status(500).json({
            error: "Internal server error",
            detail: error.response?.data || error.message || "An unknown error occurred.",
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server is running on port: ${PORT}`);
});

