import axios from 'axios';

async function test() {
    const apiKey = process.argv[2];
    if (!apiKey) {
        console.log('No API Key provided');
        return;
    }

    console.log('Testing Claude API...');

    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [{ role: "user", content: "Respond with JSON: { \"test\": \"ok\" }" }]
        }, {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
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
