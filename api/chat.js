import { GoogleGenerativeAI } from "@google/generative-ai";
import { BWM_KNOWLEDGE } from '../knowledge.js';

function findRelevantContext(query, knowledge_base) {
    const sections = knowledge_base.split('### ').slice(1);
    const queryLower = query.toLowerCase();

    // This function is good at finding SPECIFIC context.
    // It will intentionally return null for general questions.
    for (const section of sections) {
        const title = section.split('\n')[0].trim().toLowerCase();
        if (queryLower.includes(title)) {
            return "### " + section;
        }
    }
    // A broader check can be added, but returning null for general queries is what we want.
    return null;
}


export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
            return response.status(500).json({ reply: "Server configuration error: API key is missing." });
        }

        const { userQuery, history } = request.body;

        // --- THE FIX: SMART CONTEXT LOGIC ---
        // 1. Try to find a specific, relevant section of the document.
        const specificContext = findRelevantContext(userQuery, BWM_KNOWLEDGE);

        // 2. Decide what context to send to the AI.
        // If we found a specific section, use that for efficiency.
        // If not, the user is likely asking a general question, so give the AI the ENTIRE document.
        const finalContext = specificContext || BWM_KNOWLEDGE;
        // --- END FIX ---


        const systemPrompt = `You are an AI tour guide for the Jejak Warisan (Heritage Walk) in Kuala Lumpur.
- Your knowledge is strictly limited to the information provided in the "CONTEXT" section below.
- Answer the user's questions based ONLY on this context.
- If the answer is not in the text, you MUST say "I'm sorry, that information is not in my BWM document."
- For general questions like "suggest a place", recommend one of the main sites like Bangunan Sultan Abdul Samad or Masjid Jamek.
- Handle "memory" messages (e.g., "I have collected...") with a short, encouraging reply like "Great! Well done."
- Use Markdown for formatting and start main points with an emoji.

--- CONTEXT ---
${finalContext}
--- END CONTEXT ---`;

        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            systemInstruction: systemPrompt,
        });

        const chat = model.startChat({ history: history || [] });
        const result = await chat.sendMessage(userQuery);
        const aiResponse = result.response;
        const text = aiResponse.text();
            
        return response.status(200).json({ reply: text });

    } catch (error) {
        console.error('Error in Google chat handler:', error);
        return response.status(500).json({ reply: 'An error occurred on the server while communicating with the AI.' });
    }
}
