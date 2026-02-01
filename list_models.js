import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // We can't easily list models with the standard SDK without an authenticated client,
        // but let's try a simple request with a known standard model: gemini-pro
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('Testing gemini-1.5-flash standard access...');
        const result = await model.generateContent('hi');
        console.log('Success with gemini-1.5-flash');
    } catch (err) {
        console.error('Failure:', err.message);
    }
}
listModels();
