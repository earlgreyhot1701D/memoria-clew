import axios from 'axios';

async function testCapture() {
    try {
        const response = await axios.post('http://localhost:3000/api/capture', {
            url: "This project uses React, TypeScript, and Firebase for the backend."
        });
        console.log('Capture Result:', JSON.stringify(response.data, null, 2));
    } catch (err: any) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response:', err.response.data);
        }
    }
}

testCapture();
