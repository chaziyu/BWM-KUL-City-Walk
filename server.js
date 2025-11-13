// Import required modules
const express = require('express');
const fetch = require('node-fetch'); // Use node-fetch for `fetch` in Node.js
require('dotenv').config(); // Load environment variables from.env file

// Initialize the Express app
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Retrieve the secret API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Define the secure API endpoint
app.post('/api/askAI', async (req, res) => {
  // Get the prompt from the client's request body
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Construct the payload for the Gemini API
    // Note: The safetySettings are added here as a best practice
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings:
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
      console.error("Google API Error:", errorText);
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
