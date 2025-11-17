import { GoogleGenerativeAI } from "@google/generative-ai";
import { BWM_KNOWLEDGE } from '../knowledge.js';

// RAG Function: Finds the most relevant section from the knowledge base.
function findRelevantContext(query, knowledge_base) {
    const sections = knowledge_base.split('### ').slice(1);
    const queryLower = query.toLowerCase();

    // First pass: look for an exact title match in the query
    for (const section of sections) {
        const title = section.split('\n')[0].trim().toLowerCase();
        if (queryLower.includes(title)) {
            return "### " + section;
        }
    }

    // Second pass: look for general keywords
    for (const section of sections) {
        if (section.toLowerCase().includes(queryLower)) {
            return "### " + section;
        }
    }
    return null; // No relevant context found
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

        // --- 1. RETRIEVAL Step (RAG) ---
        // Find the most relevant part of the document instead of sending the whole thing.
        const relevantContext = findRelevantContext(userQuery, BWM_KNOWLEDGE);

        // --- 2. GENERATION Step (Building the prompt) ---
        const systemPrompt = `You are an AI tour guide for the Jejak Warisan (Heritage Walk) in Kuala Lumpur.
- Your knowledge is strictly limited to the information provided in the "CONTEXT" section below.
- Answer the user's questions based ONLY on this context.
- If the answer is not in the text, you MUST say "I'm sorry, that information is not in my BWM document."
- Handle "memory" messages (e.g., "I have collected...") with a short, encouraging reply like "Great! Well done."
- Use Markdown for formatting and start main points with an emoji.

--- CONTEXT ---
${relevantContext || "General knowledge about the Kuala Lumpur Heritage Walk. No specific site context was found for this query."}
--- END CONTEXT ---`;

        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt,
        });

        const chat = model.startChat({
            history: history || [], 
        });

        const result = await chat.sendMessage(userQuery);
        const aiResponse = result.response;
        const text = aiResponse.text();
            
        return response.status(200).json({ reply: text });

    } catch (error) {
        console.error('Error in Google chat handler:', error);
        return response.status(500).json({ reply: 'An error occurred on the server while communicating with the AI.' });
    }
}
