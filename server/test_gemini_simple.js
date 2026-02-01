import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
    const apiKey = process.argv[2];
    if (!apiKey) {
        console.error('Usage: node test_gemini.js <API_KEY>');
        return;
    }
    console.log('Testing with API Key (len):', apiKey.length);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Try with explicit apiVersion v1 in second argument
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }, { apiVersion: 'v1' });

        console.log('Sending request...');
        const result = await model.generateContent('hi');
        console.log('Success:', result.response.text());
    } catch (err) {
        console.error('FAILED:', err.message);
    }
}
test();
