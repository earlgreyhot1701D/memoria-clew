import axios from 'axios';

async function verify() {
    const baseUrl = 'http://localhost:3000';
    console.log('Verifying Capture endpoints at ' + baseUrl);

    try {
        // 1. Capture text
        console.log('1. Testing Capture (Text)...');
        // Use a unique content to ensure we find "it" specifically
        const content = 'Test capture item ' + Date.now();
        const captureRes = await axios.post(`${baseUrl}/api/capture`, {
            url: content
        });
        console.log('Capture Success:', captureRes.data.success);
        console.log('Item ID:', captureRes.data.data.id);
        console.log('Summary:', captureRes.data.data.summary);
        console.log('Tags:', captureRes.data.data.tags);

        // 2. Fetch Archive
        console.log('\n2. Testing Get Archive...');
        const archiveRes = await axios.get(`${baseUrl}/api/archive`);
        console.log('Archive Success:', archiveRes.data.success);
        console.log('Items found:', archiveRes.data.data.length);

        const found = archiveRes.data.data.find(i => i.id === captureRes.data.data.id);
        if (found) {
            console.log('SUCCESS: Captured item found in archive!');
            console.log('Found Item Title:', found.title);
        } else {
            console.error('FAILURE: Captured item NOT found in archive.');
        }

    } catch (err) {
        console.error('Verification Failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

// Simple delay to let server start (it's already running hopefully)
setTimeout(verify, 1000);
