import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('ERROR: GEMINI_API_KEY missing');
        return;
    }
    console.log('API Key found (length):', apiKey.length);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        console.log('Sending request to Gemini...');
        const result = await model.generateContent('Say "API working" if you receive this.');
        const text = result.response.text();
        console.log('Response:', text);
    } catch (err) {
        console.error('API Error:', err);
    }
}

test();
