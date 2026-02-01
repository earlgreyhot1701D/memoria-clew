import axios from 'axios';

async function test() {
    const apiKey = process.argv[2];
    if (!apiKey) return;

    // Testing v1beta with gemini-2.0-flash-lite
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

    console.log('Testing URL:', url.replace(apiKey, 'REDACTED'));

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: 'Respond with a JSON object { "test": "ok" }' }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        console.log('SUCCESS!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.log('FAILED!');
        if (err.response) {
            console.log('Status:', err.response.status);
            console.log('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.log('Error:', err.message);
        }
    }
}
test();
