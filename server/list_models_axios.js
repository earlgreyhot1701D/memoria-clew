import axios from 'axios';

async function list() {
    const apiKey = process.argv[2];
    if (!apiKey) return;

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await axios.get(url);
        console.log('SUCCESS!');
        console.log('Models:', JSON.stringify(response.data.models.map(m => m.name), null, 2));
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
list();
