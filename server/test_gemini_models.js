import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
    const apiKey = process.argv[2];
    if (!apiKey) return;
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro',
        'gemini-2.0-flash-exp',
        'gemini-pro'
    ];

    for (const modelId of models) {
        console.log(`--- Testing ${modelId} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelId });
            const result = await model.generateContent('hi');
            console.log(`SUCCESS: ${modelId} works!`);
            break;
        } catch (err) {
            console.log(`FAILED: ${modelId} - ${err.message}`);
        }
    }
}
test();
