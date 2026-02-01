import axios from 'axios';

async function verify() {
    const baseUrl = 'http://localhost:3000';
    console.log('Verifying Capture endpoints at ' + baseUrl);

    // Create a large payload (approx 50kb of text)
    const largeContent = "React ".repeat(10000);

    try {
        console.log('1. Testing Capture (Large Text Payload)...');
        const captureRes = await axios.post(`${baseUrl}/api/capture`, {
            url: largeContent
        });

        console.log('Status:', captureRes.status);
        console.log('Title:', captureRes.data.data.title);
        // Check if fallback was triggered
        if (captureRes.data.data.summary.includes("Summarization unavailable")) {
            console.error('FAILURE: Summarization unavailable for large payload.');
        } else {
            console.log('SUCCESS: Summarization worked for large payload.');
        }

    } catch (err) {
        console.error('Verification Failed:', err.message);
        if (err.response) console.error('Response:', err.response.data);
    }
}

verify();
