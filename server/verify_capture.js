import axios from 'axios';

async function verify() {
    const baseUrl = 'http://localhost:3000';
    console.log('Verifying Capture endpoints at ' + baseUrl);

    try {
        // 1. Capture text
        console.log('1. Testing Capture (Text)...');
        const content = 'Technical overview of React and Hooks for state management';
        const captureRes = await axios.post(`${baseUrl}/api/capture`, {
            url: content
        });
        console.log('Text Capture Success:', !!captureRes.data.data.id);
        console.log('Title:', captureRes.data.data.title);
        console.log('Tags:', captureRes.data.data.tags);

        if (captureRes.data.data.tags.includes('manual')) {
            console.warn('WARNING: Received fallback tags. Still hitting rate limit or error.');
        }

        console.log('\nWaiting 15 seconds to avoid rate limit...');
        await new Promise(r => setTimeout(r, 15000));

        // 2. Capture URL
        console.log('2. Testing Capture (URL)...');
        const urlRes = await axios.post(`${baseUrl}/api/capture`, {
            url: 'https://github.com/google-gemini/generative-ai-js'
        });
        console.log('URL Capture Success:', !!urlRes.data.data.id);
        console.log('URL Title:', urlRes.data.data.title);
        console.log('URL Tags:', urlRes.data.data.tags);

    } catch (err) {
        console.error('Verification Failed:', err.message);
        if (err.response) console.error('Response:', err.response.data);
    }
}

verify();
