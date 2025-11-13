// Import required modules
const express = require('express');
const fetch = require('node-fetch'); // Use node-fetch for `fetch` in Node.js
require('dotenv').config(); // Load environment variables from.env file

// Initialize the Express app
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Retrieve the secret API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Define the secure API endpoint
app.post('/api/askAI', async (req, res) => {
  // Get the prompt from the client's request body
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Construct the payload for the Gemini API
    const payload = {
      contents: [{
        parts: [{
          text: prompt 
        }]
      }]
    };

    // Make the secure, server-to-server request to Google
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      // Forward Google's error if something went wrong
      const errorText = await apiResponse.text();
      return res.status(apiResponse.status).json({ error: `Google API Error: ${errorText}` });
    }

    const data = await apiResponse.json();
    
    // Send Google's successful response back to the client
    res.json(data);

  } catch (error) {
    console.error('Error in /api/askAI:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
const PORT = process.env.PORT |

| 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// This logic happens inside the /api/askAI endpoint on server.js

// 1. User question from client
const userQuestion = req.body.prompt; // e.g., "Tell me about the Sze Ya Temple."

// 2. (Simulated) Vector search retrieves the most relevant chunk from 
const retrievedChunk = `
6. Sze Ya Temple
This is the oldest traditional Chinese temple
in the city. It remains very well revered to today.
Originally housed in a small attap hut, the Temple
was rebuilt in 1882 in brick and tiles. It comprises
a main hall and two side halls. Following Feng shui
principles, it is set at an angle to Jalan Tun HS Lee and
Lebuh Pudu.... The
board at the entrance attributes Kapitan Yap Ah Loy
as the founder of the temple in 1864.
`; // 

// 3. Construct the augmented prompt
const finalPrompt = `
You are a helpful tour guide for Kuala Lumpur.
Your knowledge is strictly limited to the provided context.
Do not use any outside information.
Answer the user's question based ONLY on the context below.

Context:
---
${retrievedChunk}
---

Question:
${userQuestion}

Answer:
`;

// 4. Send THIS finalPrompt to the Gemini API
// (The rest of the fetch logic from Section 2.2 follows)
